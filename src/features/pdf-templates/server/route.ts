import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { ID, Query } from 'node-appwrite'
import { z } from 'zod'

import { DATABASE_ID, PDF_TEMPLATES_ID } from '@/config/db'
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types'
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info'
import { logActivity } from '@/features/activity-logs/utils/log-activity'
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata'
import { getMember } from '@/features/members/utils'
import { createPDFTemplateSchema, updatePDFTemplateSchema } from '../schema'
import type { PDFTemplateDocument } from '../types'
import { sessionMiddleware } from '@/lib/session-middleware'

// PDF_TEMPLATES_ID is imported from config/db.ts

const app = new Hono()
  .get('/', sessionMiddleware, async (ctx) => {
    if (!PDF_TEMPLATES_ID) {
      return ctx.json({ error: 'PDF templates collection is not configured.' }, 500)
    }

    const databases = ctx.get('databases')
    const user = ctx.get('user')

    const workspaceId = ctx.req.query('workspaceId')
    const category = ctx.req.query('category')

    if (!workspaceId) {
      return ctx.json({ error: 'Workspace ID is required.' }, 400)
    }

    // Verify user has access to workspace
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    })

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Build query filters
    const queries = [Query.equal('workspaceId', workspaceId)]

    if (category) {
      queries.push(Query.equal('category', category))
    }

    // Order by created date (newest first)
    queries.push(Query.orderDesc('$createdAt'))

    try {
      const templates = await databases.listDocuments<PDFTemplateDocument>(
        DATABASE_ID,
        PDF_TEMPLATES_ID,
        queries
      )

      return ctx.json({ data: templates })
    } catch (error) {
      console.error('[GET_PDF_TEMPLATES]: ', error)
      return ctx.json({ error: 'Failed to fetch templates.' }, 500)
    }
  })
  .post('/', sessionMiddleware, zValidator('json', createPDFTemplateSchema), async (ctx) => {
    if (!PDF_TEMPLATES_ID) {
      return ctx.json({ error: 'PDF templates collection is not configured.' }, 500)
    }

    const databases = ctx.get('databases')
    const user = ctx.get('user')

    const { name, description, category, templateConfig, workspaceId, isDefault, version } =
      ctx.req.valid('json')

    // Verify user has access to workspace
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    })

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Validate templateConfig is valid JSON
    try {
      JSON.parse(templateConfig)
    } catch {
      return ctx.json({ error: 'Invalid template configuration JSON.' }, 400)
    }

    try {
      const template = await databases.createDocument<PDFTemplateDocument>(
        DATABASE_ID,
        PDF_TEMPLATES_ID,
        ID.unique(),
        {
          name,
          description: description || undefined,
          category: category || undefined,
          templateConfig,
          workspaceId,
          isDefault: isDefault || false,
          createdBy: user.$id,
          version: version || '1.0.0',
        }
      )

      // Log activity
      const userInfo = getUserInfoForLogging(user)
      const metadata = getRequestMetadata(ctx)
      await logActivity({
        databases,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.WORKSPACE, // Could add PDF_TEMPLATE entity type later
        entityId: template.$id,
        workspaceId,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: { new: template },
        metadata,
      })

      return ctx.json({ data: template })
    } catch (error) {
      console.error('[CREATE_PDF_TEMPLATE]: ', error)
      return ctx.json({ error: 'Failed to create template.' }, 500)
    }
  })
  .patch(
    '/:id',
    sessionMiddleware,
    zValidator('json', updatePDFTemplateSchema),
    async (ctx) => {
      if (!PDF_TEMPLATES_ID) {
        return ctx.json({ error: 'PDF templates collection is not configured.' }, 500)
      }

      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const templateId = ctx.req.param('id')

      // Get existing template
      let existingTemplate: PDFTemplateDocument
      try {
        existingTemplate = await databases.getDocument<PDFTemplateDocument>(
          DATABASE_ID,
          PDF_TEMPLATES_ID,
          templateId
        )
      } catch (error) {
        return ctx.json({ error: 'Template not found.' }, 404)
      }

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId: existingTemplate.workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Only allow creator or admin to update
      if (existingTemplate.createdBy !== user.$id && member.role !== 'ADMIN') {
        return ctx.json({ error: 'Unauthorized to update this template.' }, 403)
      }

      const updateData = ctx.req.valid('json')

      // Validate templateConfig if provided
      if (updateData.templateConfig) {
        try {
          JSON.parse(updateData.templateConfig)
        } catch {
          return ctx.json({ error: 'Invalid template configuration JSON.' }, 400)
        }
      }

      try {
        const updatedTemplate = await databases.updateDocument<PDFTemplateDocument>(
          DATABASE_ID,
          PDF_TEMPLATES_ID,
          templateId,
          {
            ...updateData,
            // Increment version if templateConfig changed
            version:
              updateData.templateConfig && updateData.templateConfig !== existingTemplate.templateConfig
                ? incrementVersion(existingTemplate.version)
                : updateData.version || existingTemplate.version,
          }
        )

        // Log activity
        const userInfo = getUserInfoForLogging(user)
        const metadata = getRequestMetadata(ctx)
        await logActivity({
          databases,
          action: ActivityAction.UPDATE,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: updatedTemplate.$id,
          workspaceId: updatedTemplate.workspaceId,
          userId: userInfo.userId,
          username: userInfo.username,
          userEmail: userInfo.userEmail,
          changes: { old: existingTemplate, new: updatedTemplate },
          metadata,
        })

        return ctx.json({ data: updatedTemplate })
      } catch (error) {
        console.error('[UPDATE_PDF_TEMPLATE]: ', error)
        return ctx.json({ error: 'Failed to update template.' }, 500)
      }
    }
  )
  .delete('/:id', sessionMiddleware, async (ctx) => {
    if (!PDF_TEMPLATES_ID) {
      return ctx.json({ error: 'PDF templates collection is not configured.' }, 500)
    }

    const databases = ctx.get('databases')
    const user = ctx.get('user')
    const templateId = ctx.req.param('id')

    // Get existing template
    let existingTemplate: PDFTemplateDocument
    try {
      existingTemplate = await databases.getDocument<PDFTemplateDocument>(
        DATABASE_ID,
        PDF_TEMPLATES_ID,
        templateId
      )
    } catch (error) {
      return ctx.json({ error: 'Template not found.' }, 404)
    }

    // Verify user has access to workspace
    const member = await getMember({
      databases,
      workspaceId: existingTemplate.workspaceId,
      userId: user.$id,
    })

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Only allow creator or admin to delete
    if (existingTemplate.createdBy !== user.$id && member.role !== 'ADMIN') {
      return ctx.json({ error: 'Unauthorized to delete this template.' }, 403)
    }

    // Don't allow deleting default templates
    if (existingTemplate.isDefault) {
      return ctx.json({ error: 'Cannot delete default templates.' }, 400)
    }

    try {
      await databases.deleteDocument(DATABASE_ID, PDF_TEMPLATES_ID, templateId)

      // Log activity
      const userInfo = getUserInfoForLogging(user)
      const metadata = getRequestMetadata(ctx)
      await logActivity({
        databases,
        action: ActivityAction.DELETE,
        entityType: ActivityEntityType.WORKSPACE,
        entityId: existingTemplate.$id,
        workspaceId: existingTemplate.workspaceId,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: { old: existingTemplate },
        metadata,
      })

      return ctx.json({ data: { success: true } })
    } catch (error) {
      console.error('[DELETE_PDF_TEMPLATE]: ', error)
      return ctx.json({ error: 'Failed to delete template.' }, 500)
    }
  })

// Helper function to increment version
function incrementVersion(version: string): string {
  const parts = version.split('.')
  if (parts.length === 3) {
    const patch = parseInt(parts[2], 10) + 1
    return `${parts[0]}.${parts[1]}.${patch}`
  }
  return '1.0.1'
}

export default app
