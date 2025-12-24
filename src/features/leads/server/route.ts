import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { ID, Query } from 'node-appwrite'
import { z } from 'zod'

import { DATABASE_ID, LEADS_ID, MEMBERS_ID } from '@/config/db'
import { validateCreateLead, validateUpdateLead, createLeadSchema, updateLeadSchema, validateCreateComment, createCommentSchema } from '../../../../data/lead-schema'
import { MemberRole } from '@/features/members/types'
import { getMember } from '@/features/members/utils'
import { createAdminClient } from '@/lib/appwrite'
import { sessionMiddleware } from '@/lib/session-middleware'

const app = new Hono()
  .get(
    '/',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { workspaceId } = ctx.req.valid('query')

      if (!LEADS_ID) {
        return ctx.json({ error: 'Leads collection is not configured.' }, 500)
      }

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Build query based on role
      const isAdmin = member.role === MemberRole.ADMIN
      const queries = [
        Query.equal('workspaceId', workspaceId),
        Query.orderDesc('$createdAt'),
      ]

      // Fetch all leads for the workspace
      let leads = await databases.listDocuments(DATABASE_ID, LEADS_ID, queries)

      // Regular members only see leads they are assigned to
      if (!isAdmin) {
        // Filter leads where the member's ID is in the assigneeIds array
        leads.documents = leads.documents.filter((doc: any) => {
          const assigneeIds = doc.assigneeIds
            ? (typeof doc.assigneeIds === 'string' ? JSON.parse(doc.assigneeIds) : doc.assigneeIds)
            : []
          return assigneeIds.includes(member.$id)
        })
        leads.total = leads.documents.length
      }

      // Collect all assignee IDs for batch fetching
      const allAssigneeIds = leads.documents.flatMap((doc: any) => {
        const assigneeIds = doc.assigneeIds ? (typeof doc.assigneeIds === 'string' ? JSON.parse(doc.assigneeIds) : doc.assigneeIds) : []
        return assigneeIds
      })

      // Fetch all assignees in batch
      const uniqueAssigneeIds: string[] = Array.from(new Set(allAssigneeIds))
      const members = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        uniqueAssigneeIds.length > 0 ? [Query.contains('$id', uniqueAssigneeIds)] : [],
      )

      const { users } = await createAdminClient()
      const assignees = await Promise.all(
        members.documents.map(async (member: any) => {
          const user = await users.get(member.userId)
          return {
            $id: member.$id,
            name: user.name,
            email: user.email,
          }
        }),
      )

      // Transform Appwrite documents to Lead format
      const transformedLeads = leads.documents
        .filter((doc: any) => doc.workspaceId) // Only include leads with workspaceId
        .map((doc: any) => {
          const assigneeIds = doc.assigneeIds ? (typeof doc.assigneeIds === 'string' ? JSON.parse(doc.assigneeIds) : doc.assigneeIds) : []
          const leadAssignees = assigneeIds.map((assigneeId: string) =>
            assignees.find((assignee) => assignee.$id === assigneeId),
          ).filter(Boolean) as Array<{ $id: string; name: string; email?: string }>

          return {
            id: doc.$id,
            workspaceId: doc.workspaceId,
            name: doc.name,
            email: doc.email,
            phone: doc.phone || undefined,
            company: doc.company || undefined,
            website: doc.website || undefined,
            source: doc.source,
            status: doc.status,
            priority: doc.priority,
            description: doc.description || undefined,
            notes: doc.notes || undefined,
            assigneeIds,
            assignees: leadAssignees,
            assignee: leadAssignees[0], // For backward compatibility
            createdBy: doc.createdBy,
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
            comments: doc.comments ? (typeof doc.comments === 'string' ? JSON.parse(doc.comments) : doc.comments) : [],
          }
        })

      return ctx.json({
        data: {
          documents: transformedLeads,
          total: leads.total,
        },
      })
    },
  )
  .get('/:leadId', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases')
    const user = ctx.get('user')
    const { leadId } = ctx.req.param()

    if (!LEADS_ID) {
      return ctx.json({ error: 'Leads collection is not configured.' }, 500)
    }

    const lead = await databases.getDocument(DATABASE_ID, LEADS_ID, leadId)

    if (!lead) {
      return ctx.json({ error: 'Lead not found.' }, 404)
    }

    // Verify user has access to the workspace
    const member = await getMember({
      databases,
      workspaceId: lead.workspaceId,
      userId: user.$id,
    })

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Regular members can only view leads they are assigned to
    const isAdmin = member.role === MemberRole.ADMIN
    if (!isAdmin) {
      const assigneeIds = lead.assigneeIds ? (typeof lead.assigneeIds === 'string' ? JSON.parse(lead.assigneeIds) : lead.assigneeIds) : []
      if (!assigneeIds.includes(member.$id)) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }
    }

    // Populate assignees data
    const assigneeIds = lead.assigneeIds ? (typeof lead.assigneeIds === 'string' ? JSON.parse(lead.assigneeIds) : lead.assigneeIds) : []
    const members = await Promise.all(
      assigneeIds.map((assigneeId: string) => databases.getDocument(DATABASE_ID, MEMBERS_ID, assigneeId)),
    )

    const { users } = await createAdminClient()
    const assignees = await Promise.all(
      members.map(async (member: any) => {
        const user = await users.get(member.userId)
        return {
          $id: member.$id,
          name: user.name,
          email: user.email,
        }
      }),
    )

    // Transform to Lead format
    const transformedLead = {
      id: lead.$id,
      workspaceId: lead.workspaceId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || undefined,
      company: lead.company || undefined,
      website: lead.website || undefined,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      description: lead.description || undefined,
      notes: lead.notes || undefined,
      assigneeIds,
      assignees,
      assignee: assignees[0], // For backward compatibility
      createdBy: lead.createdBy,
      createdAt: lead.$createdAt,
      updatedAt: lead.$updatedAt,
      comments: lead.comments ? (typeof lead.comments === 'string' ? JSON.parse(lead.comments) : lead.comments) : [],
    }

    return ctx.json({ data: transformedLead })
  })
  .post(
    '/',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
      }),
    ),
    zValidator('json', createLeadSchema),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')

      if (!LEADS_ID) {
        return ctx.json({ error: 'Leads collection is not configured.' }, 500)
      }

      const { workspaceId } = ctx.req.valid('query')
      const leadData = ctx.req.valid('json')

      // Validate lead data
      const validation = validateCreateLead(leadData)
      if (!validation.success) {
        return ctx.json(
          { error: 'Invalid lead data', details: validation.error.issues },
          { status: 400 },
        )
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

      // Create lead document
      const leadDocument = {
        workspaceId,
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone || '',
        company: validation.data.company || '',
        website: validation.data.website || '',
        source: validation.data.source || 'other',
        status: validation.data.status || 'new',
        priority: validation.data.priority || 'medium',
        description: validation.data.description || '',
        notes: validation.data.notes || '',
        assigneeIds: JSON.stringify(validation.data.assigneeIds || []), // Store assigneeIds as JSON string
        createdBy: user.$id,
        // comments is optional, will be initialized when first comment is added
      }

      const response = await databases.createDocument(DATABASE_ID, LEADS_ID, ID.unique(), leadDocument)

      // Populate assignees data
      const assigneeIds = response.assigneeIds ? (typeof response.assigneeIds === 'string' ? JSON.parse(response.assigneeIds) : response.assigneeIds) : []
      const members = await Promise.all(
        assigneeIds.map((assigneeId: string) => databases.getDocument(DATABASE_ID, MEMBERS_ID, assigneeId)),
      )

      const { users } = await createAdminClient()
      const assignees = await Promise.all(
        members.map(async (member: any) => {
          const user = await users.get(member.userId)
          return {
            $id: member.$id,
            name: user.name,
            email: user.email,
          }
        }),
      )

      // Transform to Lead format
      const lead = {
        id: response.$id,
        workspaceId: response.workspaceId,
        name: response.name,
        email: response.email,
        phone: response.phone || undefined,
        company: response.company || undefined,
        website: response.website || undefined,
        source: response.source,
        status: response.status,
        priority: response.priority,
        description: response.description || undefined,
        notes: response.notes || undefined,
        assigneeIds: response.assigneeIds ? (typeof response.assigneeIds === 'string' ? JSON.parse(response.assigneeIds) : response.assigneeIds) : [],
        assignees,
        assignee: assignees[0], // For backward compatibility
        createdBy: response.createdBy,
        createdAt: response.$createdAt,
        updatedAt: response.$updatedAt,
        comments: response.comments ? (typeof response.comments === 'string' ? JSON.parse(response.comments) : response.comments) : [],
      }

      return ctx.json({ data: lead }, 201)
    },
  )
  .post(
    '/bulk',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
      }),
    ),
    zValidator(
      'json',
      z.object({
        leads: z.array(
          z.object({
            name: z.string(),
            email: z.string().email().optional().or(z.literal("")),
            phone: z.string().optional(),
            company: z.string().optional(),
            website: z.string().optional(),
            source: z.string().optional(),
            status: z.string().optional(),
            priority: z.string().optional(),
            description: z.string().optional(),
            notes: z.string().optional(),
            assigneeEmails: z.array(z.string().email()).optional(),
          }),
        ),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')

      if (!LEADS_ID) {
        return ctx.json({ error: 'Leads collection is not configured.' }, 500)
      }

      const { workspaceId } = ctx.req.valid('query')
      const { leads } = ctx.req.valid('json')

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Get all members in workspace to map emails to member IDs
      const allMembers = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal('workspaceId', workspaceId),
      ])

      const { users } = await createAdminClient()

      // Create email to member ID map
      const emailToMemberIdMap = new Map<string, string>()
      await Promise.all(
        allMembers.documents.map(async (memberDoc: any) => {
          try {
            const userDoc = await users.get(memberDoc.userId)
            if (userDoc.email) {
              emailToMemberIdMap.set(userDoc.email.toLowerCase(), memberDoc.$id)
            }
          } catch (error) {
            // Skip if user not found
          }
        }),
      )

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      }

      // Process each lead
      for (let i = 0; i < leads.length; i++) {
        const leadData = leads[i]
        try {
          // Convert assignee emails to member IDs
          const assigneeIds: string[] = []
          if (leadData.assigneeEmails && leadData.assigneeEmails.length > 0) {
            for (const email of leadData.assigneeEmails) {
              const memberId = emailToMemberIdMap.get(email.toLowerCase())
              if (memberId) {
                assigneeIds.push(memberId)
              }
            }
          }

          // Validate and create lead
          const validation = validateCreateLead({
            name: leadData.name,
            email: leadData.email && leadData.email.trim() !== "" ? leadData.email : undefined,
            phone: leadData.phone,
            company: leadData.company,
            website: leadData.website,
            source: (leadData.source as any) || 'other',
            status: (leadData.status as any) || 'new',
            priority: (leadData.priority as any) || 'medium',
            description: leadData.description,
            notes: leadData.notes,
            assigneeIds,
          })

          if (!validation.success) {
            results.failed++
            results.errors.push(`Row ${i + 2}: ${validation.error.issues.map((issue) => issue.message).join(', ')}`)
            continue
          }

          // Create lead document
          const leadDocument = {
            workspaceId,
            name: validation.data.name,
            email: validation.data.email,
            phone: validation.data.phone || '',
            company: validation.data.company || '',
            website: validation.data.website || '',
            source: validation.data.source || 'other',
            status: validation.data.status || 'new',
            priority: validation.data.priority || 'medium',
            description: validation.data.description || '',
            notes: validation.data.notes || '',
            assigneeIds: JSON.stringify(validation.data.assigneeIds || []),
            createdBy: user.$id,
            // comments is optional, will be initialized when first comment is added
          }

          await databases.createDocument(DATABASE_ID, LEADS_ID, ID.unique(), leadDocument)
          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push(`Row ${i + 2}: ${error.message || 'Failed to create lead'}`)
        }
      }

      return ctx.json({ data: results }, 200)
    },
  )
  .put(
    '/:leadId',
    sessionMiddleware,
    zValidator('json', updateLeadSchema),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { leadId } = ctx.req.param()

      if (!LEADS_ID) {
        return ctx.json({ error: 'Leads collection is not configured.' }, 500)
      }

      const updateData = ctx.req.valid('json')

      // Validate update data
      const validation = validateUpdateLead(updateData)
      if (!validation.success) {
        return ctx.json(
          { error: 'Invalid lead data', details: validation.error.issues },
          { status: 400 },
        )
      }

      // Get existing lead
      const existingLead = await databases.getDocument(DATABASE_ID, LEADS_ID, leadId)

      if (!existingLead) {
        return ctx.json({ error: 'Lead not found.' }, 404)
      }

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId: existingLead.workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Regular members can only update leads they are assigned to
      const isAdmin = member.role === MemberRole.ADMIN
      if (!isAdmin) {
        const assigneeIds = existingLead.assigneeIds ? (typeof existingLead.assigneeIds === 'string' ? JSON.parse(existingLead.assigneeIds) : existingLead.assigneeIds) : []
        if (!assigneeIds.includes(member.$id)) {
          return ctx.json({ error: 'Unauthorized.' }, 401)
        }
      }

      // Prepare update document (only include fields that are provided)
      const updateDocument: any = {}
      if (validation.data.name !== undefined) updateDocument.name = validation.data.name
      if (validation.data.email !== undefined) updateDocument.email = validation.data.email
      if (validation.data.phone !== undefined) updateDocument.phone = validation.data.phone || ''
      if (validation.data.company !== undefined) updateDocument.company = validation.data.company || ''
      if (validation.data.website !== undefined) updateDocument.website = validation.data.website || ''
      if (validation.data.source !== undefined) updateDocument.source = validation.data.source
      if (validation.data.status !== undefined) updateDocument.status = validation.data.status
      if (validation.data.priority !== undefined) updateDocument.priority = validation.data.priority
      if (validation.data.description !== undefined) updateDocument.description = validation.data.description || ''
      if (validation.data.notes !== undefined) updateDocument.notes = validation.data.notes || ''
      if (validation.data.assigneeIds !== undefined) updateDocument.assigneeIds = JSON.stringify(validation.data.assigneeIds)

      const updatedLead = await databases.updateDocument(DATABASE_ID, LEADS_ID, leadId, updateDocument)

      // Populate assignees data
      const assigneeIds = updatedLead.assigneeIds ? (typeof updatedLead.assigneeIds === 'string' ? JSON.parse(updatedLead.assigneeIds) : updatedLead.assigneeIds) : []
      const members = await Promise.all(
        assigneeIds.map((assigneeId: string) => databases.getDocument(DATABASE_ID, MEMBERS_ID, assigneeId)),
      )

      const { users } = await createAdminClient()
      const assignees = await Promise.all(
        members.map(async (member: any) => {
          const user = await users.get(member.userId)
          return {
            $id: member.$id,
            name: user.name,
            email: user.email,
          }
        }),
      )

      // Transform to Lead format
      const lead = {
        id: updatedLead.$id,
        workspaceId: updatedLead.workspaceId,
        name: updatedLead.name,
        email: updatedLead.email,
        phone: updatedLead.phone || undefined,
        company: updatedLead.company || undefined,
        website: updatedLead.website || undefined,
        source: updatedLead.source,
        status: updatedLead.status,
        priority: updatedLead.priority,
        description: updatedLead.description || undefined,
        notes: updatedLead.notes || undefined,
        assigneeIds: updatedLead.assigneeIds || [],
        assignees,
        assignee: assignees[0], // For backward compatibility
        createdBy: updatedLead.createdBy,
        createdAt: updatedLead.$createdAt,
        updatedAt: updatedLead.$updatedAt,
        comments: updatedLead.comments ? (typeof updatedLead.comments === 'string' ? JSON.parse(updatedLead.comments) : updatedLead.comments) : [],
      }

      return ctx.json({ data: lead })
    },
  )
  .delete('/:leadId', sessionMiddleware, async (ctx) => {
    try {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { leadId } = ctx.req.param()

      if (!LEADS_ID) {
        return ctx.json({ error: 'Leads collection is not configured.' }, 500)
      }

      // Get existing lead
      const existingLead = await databases.getDocument(DATABASE_ID, LEADS_ID, leadId)

      if (!existingLead) {
        return ctx.json({ error: 'Lead not found.' }, 404)
      }

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId: existingLead.workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Regular members can only delete leads they are assigned to, admins can delete any lead
      const isAdmin = member.role === MemberRole.ADMIN
      if (!isAdmin) {
        const assigneeIds = existingLead.assigneeIds
          ? (typeof existingLead.assigneeIds === 'string' ? JSON.parse(existingLead.assigneeIds) : existingLead.assigneeIds)
          : []
        if (!assigneeIds.includes(member.$id)) {
          return ctx.json({ error: 'Unauthorized. You can only delete leads assigned to you.' }, 403)
        }
      }

      await databases.deleteDocument(DATABASE_ID, LEADS_ID, leadId)

      return ctx.json({ data: { success: true } })
    } catch (error: any) {
      console.error('Error deleting lead:', error)

      if (error.message === 'Unauthorized.') {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      if (error.code === 404) {
        return ctx.json({ error: 'Lead not found.' }, 404)
      }

      return ctx.json(
        { error: error.message || 'Failed to delete lead' },
        500,
      )
    }
  })
  .post(
    '/:leadId/comments',
    sessionMiddleware,
    zValidator('json', createCommentSchema),
    async (ctx) => {
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { leadId } = ctx.req.param()

      if (!LEADS_ID) {
        return ctx.json({ error: 'Leads collection is not configured.' }, 500)
      }

      const commentData = ctx.req.valid('json')

      // Validate comment data
      const validation = validateCreateComment(commentData)
      if (!validation.success) {
        return ctx.json(
          { error: 'Invalid comment data', details: validation.error.issues },
          { status: 400 },
        )
      }

      // Get existing lead
      const existingLead = await databases.getDocument(DATABASE_ID, LEADS_ID, leadId)

      if (!existingLead) {
        return ctx.json({ error: 'Lead not found.' }, 404)
      }

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId: existingLead.workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      // Regular members can only comment on leads they are assigned to
      const isAdmin = member.role === MemberRole.ADMIN
      if (!isAdmin) {
        const assigneeIds = existingLead.assigneeIds
          ? (typeof existingLead.assigneeIds === 'string' ? JSON.parse(existingLead.assigneeIds) : existingLead.assigneeIds)
          : []
        if (!assigneeIds.includes(member.$id)) {
          return ctx.json({ error: 'Unauthorized. You can only comment on leads assigned to you.' }, 403)
        }
      }

      // Parse existing comments
      const comments = existingLead.comments
        ? typeof existingLead.comments === 'string'
          ? JSON.parse(existingLead.comments)
          : existingLead.comments
        : []

      // Create new comment
      const newComment = {
        id: ID.unique(),
        content: validation.data.content,
        authorId: user.$id,
        authorName: user.name || user.email || 'Unknown',
        authorEmail: user.email || '',
        createdAt: new Date().toISOString(),
      }

      // Add comment to array
      comments.push(newComment)

      // Update lead with new comments
      const updatedLead = await databases.updateDocument(DATABASE_ID, LEADS_ID, leadId, {
        comments: JSON.stringify(comments),
      })

      return ctx.json({ data: newComment }, 201)
    },
  )
  .delete('/:leadId/comments/:commentId', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases')
    const user = ctx.get('user')
    const { leadId, commentId } = ctx.req.param()

    if (!LEADS_ID) {
      return ctx.json({ error: 'Leads collection is not configured.' }, 500)
    }

    // Get existing lead
    const existingLead = await databases.getDocument(DATABASE_ID, LEADS_ID, leadId)

    if (!existingLead) {
      return ctx.json({ error: 'Lead not found.' }, 404)
    }

    // Verify user has access to workspace
    const member = await getMember({
      databases,
      workspaceId: existingLead.workspaceId,
      userId: user.$id,
    })

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Parse existing comments
    const comments = existingLead.comments
      ? typeof existingLead.comments === 'string'
        ? JSON.parse(existingLead.comments)
        : existingLead.comments
      : []

    // Find comment
    const commentIndex = comments.findIndex((c: any) => c.id === commentId)

    if (commentIndex === -1) {
      return ctx.json({ error: 'Comment not found.' }, 404)
    }

    const comment = comments[commentIndex]

    // Regular members can only delete their own comments, admins can delete any comment
    const isAdmin = member.role === MemberRole.ADMIN
    if (!isAdmin && comment.authorId !== user.$id) {
      return ctx.json({ error: 'Unauthorized.' }, 401)
    }

    // Remove comment
    comments.splice(commentIndex, 1)

    // Update lead with updated comments
    await databases.updateDocument(DATABASE_ID, LEADS_ID, leadId, {
      comments: JSON.stringify(comments),
    })

    return ctx.json({ data: { success: true } })
  })

export default app
