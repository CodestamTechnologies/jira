import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Query } from 'node-appwrite'
import { z } from 'zod'

import { DATABASE_ID, MEMBERS_ID } from '@/config/db'
import { type Member, MemberRole } from '@/features/members/types'
import { getMember } from '@/features/members/utils'
import { createAdminClient } from '@/lib/appwrite'
import { sessionMiddleware } from '@/lib/session-middleware'

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
})

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
      const { users } = await createAdminClient()
      const databases = ctx.get('databases')
      const user = ctx.get('user')
      const { workspaceId } = ctx.req.valid('query')

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      })

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401)
      }

      const members = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [Query.equal('workspaceId', workspaceId)])

      const populatedMembers = await Promise.all(
        members.documents.map(async (member) => {
          const user = await users.get(member.userId)

          return { ...member, name: user.name, email: user.email }
        }),
      )

      return ctx.json({
        data: {
          ...members,
          documents: populatedMembers,
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

    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, memberId)

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

      return ctx.json({
        data: updatedMember,
      })
    },
  )

export default app
