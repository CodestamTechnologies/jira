import { zValidator } from '@hono/zod-validator'
import { Hono, type Context } from 'hono'
import { Query, type Databases } from 'node-appwrite'
import { z } from 'zod'

import { DATABASE_ID, MEMBERS_ID, WORKSPACES_ID } from '@/config/db'
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types'
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info'
import { getChangedFields } from '@/features/activity-logs/utils/log-activity'
import { logActivityBackground } from '@/lib/activity-logs/utils/log-activity-background'
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata'
import { type Member, MemberRole } from '@/features/members/types'
import { getMember } from '@/features/members/utils'
import { createAdminClient } from '@/lib/appwrite'
import { sessionMiddleware } from '@/lib/session-middleware'
import { NotificationService } from '@/lib/email/services/notification-service'

const updateMemberInfoSchema = z.object({
  position: z.string().optional(),
  address: z.string().optional(),
  aadhar: z.string().optional(),
  basicSalary: z.number().optional(),
  hra: z.number().optional(),
  transportAllowance: z.number().optional(),
  medicalAllowance: z.number().optional(),
  specialAllowance: z.number().optional(),
  providentFund: z.number().optional(),
  professionalTax: z.number().optional(),
  incomeTax: z.number().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  bankName: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfJoining: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Helper function to update member feature access permission
 * Follows DRY principle - reduces code duplication across feature access endpoints
 * 
 * @param databases - Appwrite databases instance
 * @param user - Current user making the request
 * @param ctx - Hono context for request metadata
 * @param memberId - Member ID to update
 * @param permissionField - Permission field name (e.g., 'hasLeadsAccess')
 * @param permissionValue - New permission value
 * @param featureName - Human-readable feature name for error messages
 * @returns Updated member document or throws error
 */
async function updateMemberFeatureAccess(
  databases: Databases,
  user: { $id: string; name?: string; email?: string },
  ctx: Context,
  memberId: string,
  permissionField: keyof Member,
  permissionValue: boolean,
  featureName: string
) {
  const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)

  if (!member) {
    throw new Error('Member not found.')
  }

  const requesterMember = await getMember({
    databases,
    workspaceId: member.workspaceId,
    userId: user.$id,
  })

  if (!requesterMember || requesterMember.role !== MemberRole.ADMIN) {
    throw new Error(`Unauthorized. Only admins can manage ${featureName} access.`)
  }

  const updatedMember = await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
    [permissionField]: permissionValue,
  })

  // Log activity in background
  // Extract user info manually since user is a partial object
  const userInfo = {
    userId: user.$id,
    username: user.name || user.email || 'Unknown User',
    userEmail: user.email || '',
  }
  const metadata = getRequestMetadata(ctx)
  logActivityBackground({
    databases,
    action: ActivityAction.UPDATE,
    entityType: ActivityEntityType.MEMBER,
    entityId: updatedMember.$id,
    workspaceId: member.workspaceId,
    userId: userInfo.userId,
    username: userInfo.username,
    userEmail: userInfo.userEmail,
    changes: {
      old: { [permissionField]: member[permissionField] },
      new: { [permissionField]: permissionValue },
    },
    metadata,
  })

  return updatedMember
}

const app = new Hono()
  .get(
    '/',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
        includeInactive: z.string().optional(), // 'true' to include inactive members
      }),
    ),
    async (ctx) => {
      const { users } = await createAdminClient()
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { workspaceId, includeInactive } = ctx.req.valid('query')

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Build query - by default, only show active members (isActive !== false)
      // If includeInactive is 'true', show all members
      const queries = [Query.equal('workspaceId', workspaceId)]

      if (includeInactive !== 'true') {
        // Only show active members (isActive is true or undefined/null)
        // We need to filter for members where isActive is not false
        // Appwrite doesn't support "not equal" directly, so we'll filter in memory
        // or use a workaround: query for isActive = true OR isActive doesn't exist
      }

      const members = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, queries)

      // Filter inactive members if includeInactive is not 'true'
      let filteredMembers = members.documents
      if (includeInactive !== 'true') {
        filteredMembers = members.documents.filter((m) => m.isActive !== false)
      }

      const populatedMembers = await Promise.all(
        filteredMembers.map(async (member) => {
          const user = await users.get(member.userId)

          // Only return safe, non-sensitive fields
          return {
            $id: member.$id,
            $createdAt: member.$createdAt,
            $updatedAt: member.$updatedAt,
            workspaceId: member.workspaceId,
            userId: member.userId,
            name: user.name,
            email: user.email,
            role: member.role,
            // Ensure isActive defaults to true for backward compatibility
            isActive: member.isActive !== false,
            // Include all permission fields for feature access
            hasLeadsAccess: member.hasLeadsAccess || false,
            hasInvoicesAccess: member.hasInvoicesAccess || false,
            hasExpensesAccess: member.hasExpensesAccess || false,
            hasActivityLogsAccess: member.hasActivityLogsAccess || false,
          }
        }),
      )

      return ctx.json({
        data: {
          ...members,
          documents: populatedMembers,
          total: populatedMembers.length,
        },
      })
    },
  )
  .get(
    '/:memberId',
    sessionMiddleware,
    async (ctx) => {
      const { users } = await createAdminClient()
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()

      // Get the member document
      const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)

      if (!member) {
        return ctx.json({ error: 'Member not found.' }, 404)
      }

      // Check if requesting user is admin or the member themselves
      const requesterMember = await getMember({
        databases,
        workspaceId: member.workspaceId,
        userId: user.$id,
      })

      if (!requesterMember) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      if (requesterMember.role !== MemberRole.ADMIN && requesterMember.userId !== member.userId) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Populate with user info
      const userData = await users.get(member.userId)

      // Only return safe, non-sensitive fields
      // For member detail endpoint, return all fields but only if user is admin or viewing their own profile
      // This endpoint is used for viewing full member details, so we return all fields
      // but the authorization check above ensures only authorized users can access it
      return ctx.json({
        data: {
          ...member,
          name: userData.name,
          email: userData.email,
        },
      })
    },
  )
  .patch(
    '/:memberId/info',
    sessionMiddleware,
    zValidator('json', updateMemberInfoSchema),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const updateData = ctx.req.valid('json')

      // Get the member document
      const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)

      if (!member) {
        return ctx.json({ error: 'Member not found.' }, 404)
      }

      // Check if requesting user is admin or the member themselves
      const requesterMember = await getMember({
        databases,
        workspaceId: member.workspaceId,
        userId: user.$id,
      })

      if (!requesterMember) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      if (requesterMember.role !== MemberRole.ADMIN && requesterMember.userId !== member.userId) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Update member info
      const updatedMember = await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, updateData)

      // Log activity in background - only log changed fields
      const changedFields = getChangedFields(member, updatedMember)
      if (Object.keys(changedFields).length > 0) {
        const userInfo = getUserInfoForLogging(user)
        // Build old values object with only changed fields
        const oldValues: Record<string, unknown> = {}
        for (const key in changedFields) {
          oldValues[key] = member[key as keyof Member]
        }

        const metadata = getRequestMetadata(ctx)
        logActivityBackground({
          databases,
          action: ActivityAction.UPDATE,
          entityType: ActivityEntityType.MEMBER,
          entityId: updatedMember.$id,
          workspaceId: member.workspaceId,
          userId: userInfo.userId,
          username: userInfo.username,
          userEmail: userInfo.userEmail,
          changes: {
            old: oldValues,
            new: changedFields,
          },
          metadata,
        })
      }

      return ctx.json({
        data: updatedMember,
      })
    },
  )
  .delete('/:memberId', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases')
    const user = ctx.get('user')
    const { memberId } = ctx.req.param()

    const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)

    if (!member) {
      return ctx.json({ error: 'Member not found.' }, 404)
    }

    const requesterMember = await getMember({
      databases,
      workspaceId: member.workspaceId,
      userId: user.$id,
    })

    if (!requesterMember || requesterMember.role !== MemberRole.ADMIN) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Get workspace info for email
    const workspace = await databases.getDocument(DATABASE_ID, WORKSPACES_ID, member.workspaceId)
    const { users } = await createAdminClient()
    const requesterUser = await users.get(user.$id)

    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, memberId)

    // Send email notification and log activity in background (non-blocking)
    const notificationService = new NotificationService(databases)
    notificationService.notifyMemberRemoved(
      memberId,
      member.workspaceId,
      workspace.name,
      requesterUser.name || requesterUser.email || 'Administrator'
    )

    const userInfo = getUserInfoForLogging(user)
    const metadata = getRequestMetadata(ctx)
    logActivityBackground({
      databases,
      action: ActivityAction.DELETE,
      entityType: ActivityEntityType.MEMBER,
      entityId: member.$id,
      workspaceId: member.workspaceId,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { old: member },
      metadata,
    })

    return ctx.json({ data: { success: true } })
  })
  .patch(
    '/:memberId',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        role: z.nativeEnum(MemberRole),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const { role } = ctx.req.valid('json')

      const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)

      if (!member) {
        return ctx.json({ error: 'Member not found.' }, 404)
      }

      const requesterMember = await getMember({
        databases,
        workspaceId: member.workspaceId,
        userId: user.$id,
      })

      if (!requesterMember || requesterMember.role !== MemberRole.ADMIN) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      const updatedMember = await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
        role,
      })

      // Send email notification and log activity in background (non-blocking)
      if (member.role !== role) {
        const workspace = await databases.getDocument(DATABASE_ID, WORKSPACES_ID, member.workspaceId)
        const { users } = await createAdminClient()
        const requesterUser = await users.get(user.$id)
        const notificationService = new NotificationService(databases)
        notificationService.notifyMemberRoleChanged(
          memberId,
          member.workspaceId,
          workspace.name,
          role === MemberRole.ADMIN ? 'Administrator' : 'Member',
          requesterUser.name || requesterUser.email || 'Administrator'
        )
      }

      const userInfo = getUserInfoForLogging(user)
      const metadata = getRequestMetadata(ctx)
      logActivityBackground({
        databases,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.MEMBER,
        entityId: updatedMember.$id,
        workspaceId: member.workspaceId,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: {
          old: { role: member.role },
          new: { role },
        },
        metadata,
      })

      return ctx.json({
        data: updatedMember,
      })
    },
  )
  .patch(
    '/:memberId/status',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        isActive: z.boolean(),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const { isActive } = ctx.req.valid('json')

      const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)

      if (!member) {
        return ctx.json({ error: 'Member not found.' }, 404)
      }

      const requesterMember = await getMember({
        databases,
        workspaceId: member.workspaceId,
        userId: user.$id,
      })

      if (!requesterMember || requesterMember.role !== MemberRole.ADMIN) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      const updatedMember = await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
        isActive,
      })

      // Send email notification and log activity in background (non-blocking)
      if (member.isActive !== isActive) {
        const workspace = await databases.getDocument(DATABASE_ID, WORKSPACES_ID, member.workspaceId)
        const { users } = await createAdminClient()
        const requesterUser = await users.get(user.$id)
        const notificationService = new NotificationService(databases)
        notificationService.notifyMemberStatusChanged(
          memberId,
          member.workspaceId,
          workspace.name,
          isActive,
          requesterUser.name || requesterUser.email || 'Administrator'
        )
      }

      const userInfo = getUserInfoForLogging(user)
      const metadata = getRequestMetadata(ctx)
      logActivityBackground({
        databases,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.MEMBER,
        entityId: updatedMember.$id,
        workspaceId: member.workspaceId,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: {
          old: { isActive: member.isActive },
          new: { isActive },
        },
        metadata,
      })

      return ctx.json({
        data: updatedMember,
      })
    },
  )
  // Feature access endpoints - following DRY principle with reusable helper
  .patch(
    '/:memberId/leads-access',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        hasLeadsAccess: z.boolean(),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const { hasLeadsAccess } = ctx.req.valid('json')

      try {
        const updatedMember = await updateMemberFeatureAccess(
          databases,
          user,
          ctx,
          memberId,
          'hasLeadsAccess',
          hasLeadsAccess,
          'leads'
        )

        return ctx.json({
          data: updatedMember,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update leads access.'
        const status = message.includes('Unauthorized') ? 401 : message.includes('not found') ? 404 : 500
        return ctx.json({ error: message }, status)
      }
    },
  )
  .patch(
    '/:memberId/invoices-access',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        hasInvoicesAccess: z.boolean(),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const { hasInvoicesAccess } = ctx.req.valid('json')

      try {
        const updatedMember = await updateMemberFeatureAccess(
          databases,
          user,
          ctx,
          memberId,
          'hasInvoicesAccess',
          hasInvoicesAccess,
          'invoices'
        )

        return ctx.json({
          data: updatedMember,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update invoices access.'
        const status = message.includes('Unauthorized') ? 401 : message.includes('not found') ? 404 : 500
        return ctx.json({ error: message }, status)
      }
    },
  )
  .patch(
    '/:memberId/expenses-access',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        hasExpensesAccess: z.boolean(),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const { hasExpensesAccess } = ctx.req.valid('json')

      try {
        const updatedMember = await updateMemberFeatureAccess(
          databases,
          user,
          ctx,
          memberId,
          'hasExpensesAccess',
          hasExpensesAccess,
          'expenses'
        )

        return ctx.json({
          data: updatedMember,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update expenses access.'
        const status = message.includes('Unauthorized') ? 401 : message.includes('not found') ? 404 : 500
        return ctx.json({ error: message }, status)
      }
    },
  )
  .patch(
    '/:memberId/activity-logs-access',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        hasActivityLogsAccess: z.boolean(),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { memberId } = ctx.req.param()
      const { hasActivityLogsAccess } = ctx.req.valid('json')

      try {
        const updatedMember = await updateMemberFeatureAccess(
          databases,
          user,
          ctx,
          memberId,
          'hasActivityLogsAccess',
          hasActivityLogsAccess,
          'activity logs'
        )

        return ctx.json({
          data: updatedMember,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update activity logs access.'
        const status = message.includes('Unauthorized') ? 401 : message.includes('not found') ? 404 : 500
        return ctx.json({ error: message }, status)
      }
    },
  )

export default app
