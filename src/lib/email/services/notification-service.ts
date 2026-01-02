import type { Databases } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite'
import { sendEmail } from '@/lib/email/email-service'
import { sendEmailBackground } from '@/lib/email/utils/send-email-background'
import { getMemberEmails, getUserEmail } from '@/lib/email/utils/get-member-emails'
import { DATABASE_ID, MEMBERS_ID, WORKSPACES_ID } from '@/config/db'
import { Query } from 'node-appwrite'
import type { Member } from '@/features/members/types'
import type { Workspace } from '@/features/workspaces/types'
import type { Project } from '@/features/projects/types'
import type { Task } from '@/features/tasks/types'
/**
 * Notification service following SOLID principles
 * Single Responsibility: Handles email notifications only
 * Dependency Injection: Receives dependencies as parameters
 */
export class NotificationService {
  constructor(private databases: Databases) {}

  /**
   * Send email to a single member
   */
  private async sendToMember(
    memberId: string,
    subject: string,
    html: string
  ): Promise<void> {
    const { users } = await createAdminClient()
    const member = await this.databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)
    const memberEmail = await getUserEmail(member.userId)
    
    if (memberEmail) {
      await sendEmail({
        to: memberEmail,
        subject,
        html,
      })
    }
  }

  /**
   * Send email to multiple members
   */
  private async sendToMembers(
    memberIds: string[],
    getEmailContent: (member: Member, user: any) => { subject: string; html: string }
  ): Promise<void> {
    if (memberIds.length === 0) return

    const { users } = await createAdminClient()
    const members = await this.databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
      Query.contains('$id', memberIds),
    ])

    const memberEmails = await getMemberEmails(this.databases, memberIds)

    await Promise.all(
      members.documents.map(async (member) => {
        const memberEmail = memberEmails.get(member.$id)
        if (memberEmail) {
          const memberUser = await users.get(member.userId)
          const { subject, html } = getEmailContent(member, memberUser)
          await sendEmail({
            to: memberEmail,
            subject,
            html,
          }).catch((error) => {
            console.error(`Failed to send email to ${memberEmail}:`, error)
          })
        }
      })
    )
  }

  /**
   * Send member added notification (non-blocking)
   */
  async notifyMemberAdded(
    userId: string,
    workspaceId: string,
    workspaceName: string,
    inviterName: string
  ): Promise<void> {
    sendEmailBackground(async () => {
      const { getMemberAddedEmailTemplate } = await import('@/lib/email/templates/member-email-templates')
      const userEmail = await getUserEmail(userId)
      if (userEmail) {
        const { users } = await createAdminClient()
        const newMemberUser = await users.get(userId)
        await sendEmail({
          to: userEmail,
          subject: `Welcome to ${workspaceName}!`,
          html: getMemberAddedEmailTemplate(
            newMemberUser.name || newMemberUser.email || 'Member',
            workspaceName,
            inviterName
          ),
        })
      }
    })
  }

  /**
   * Send member role changed notification (non-blocking)
   */
  async notifyMemberRoleChanged(
    memberId: string,
    workspaceId: string,
    workspaceName: string,
    newRole: string,
    changedBy: string
  ): Promise<void> {
    sendEmailBackground(async () => {
      const { getMemberRoleChangedEmailTemplate } = await import('@/lib/email/templates/member-email-templates')
      const { users } = await createAdminClient()
      const workspace = await this.databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, workspaceId)
      const member = await this.databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)
      const memberEmail = await getUserEmail(member.userId)
      
      if (memberEmail) {
        const memberUser = await users.get(member.userId)
        await sendEmail({
          to: memberEmail,
          subject: `Role Updated in ${workspaceName}`,
          html: getMemberRoleChangedEmailTemplate(
            memberUser.name || memberUser.email || 'Member',
            workspaceName,
            newRole,
            changedBy
          ),
        })
      }
    })
  }

  /**
   * Send member status changed notification (non-blocking)
   */
  async notifyMemberStatusChanged(
    memberId: string,
    workspaceId: string,
    workspaceName: string,
    isActive: boolean,
    changedBy: string
  ): Promise<void> {
    sendEmailBackground(async () => {
      const { getMemberStatusChangedEmailTemplate } = await import('@/lib/email/templates/member-email-templates')
      const { users } = await createAdminClient()
      const workspace = await this.databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, workspaceId)
      const member = await this.databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)
      const memberEmail = await getUserEmail(member.userId)
      
      if (memberEmail) {
        const memberUser = await users.get(member.userId)
        await sendEmail({
          to: memberEmail,
          subject: `Account ${isActive ? 'Activated' : 'Deactivated'} in ${workspaceName}`,
          html: getMemberStatusChangedEmailTemplate(
            memberUser.name || memberUser.email || 'Member',
            workspaceName,
            isActive,
            changedBy
          ),
        })
      }
    })
  }

  /**
   * Send member removed notification (non-blocking)
   */
  async notifyMemberRemoved(
    memberId: string,
    workspaceId: string,
    workspaceName: string,
    removedBy: string
  ): Promise<void> {
    sendEmailBackground(async () => {
      const { getMemberRemovedEmailTemplate } = await import('@/lib/email/templates/member-email-templates')
      const { users } = await createAdminClient()
      const workspace = await this.databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, workspaceId)
      const member = await this.databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)
      const memberEmail = await getUserEmail(member.userId)
      
      if (memberEmail) {
        const memberUser = await users.get(member.userId)
        await sendEmail({
          to: memberEmail,
          subject: `Removed from ${workspaceName}`,
          html: getMemberRemovedEmailTemplate(
            memberUser.name || memberUser.email || 'Member',
            workspaceName,
            removedBy
          ),
        })
      }
    })
  }

  /**
   * Send task created notification to assignees (non-blocking)
   */
  async notifyTaskCreated(
    task: Task,
    workspaceName: string,
    projectName: string,
    createdBy: string,
    assigneeIds: string[]
  ): Promise<void> {
    if (assigneeIds.length === 0) return

    // Send email notifications
    sendEmailBackground(async () => {
      const { getTaskCreatedEmailTemplate } = await import('@/lib/email/templates/task-email-templates')
      const { users } = await createAdminClient()
      const creatorUser = await users.get(createdBy)
      
      await this.sendToMembers(assigneeIds, (member, memberUser) => ({
        subject: `New Task Assigned: ${task.name}`,
        html: getTaskCreatedEmailTemplate(
          memberUser.name || memberUser.email || 'Member',
          task.name,
          projectName,
          workspaceName,
          creatorUser.name || creatorUser.email || 'Team Member',
          task.dueDate,
          task.description
        ),
      }))
    })
  }

  /**
   * Send task assigned notification to new assignees (non-blocking)
   */
  async notifyTaskAssigned(
    task: Task,
    workspaceName: string,
    projectName: string,
    assignedBy: string,
    newAssigneeIds: string[]
  ): Promise<void> {
    if (newAssigneeIds.length === 0) return

    // Send email notifications
    sendEmailBackground(async () => {
      const { getTaskAssignedEmailTemplate } = await import('@/lib/email/templates/task-email-templates')
      const { users } = await createAdminClient()
      const assignerUser = await users.get(assignedBy)
      
      await this.sendToMembers(newAssigneeIds, (member, memberUser) => ({
        subject: `New Task Assigned: ${task.name}`,
        html: getTaskAssignedEmailTemplate(
          memberUser.name || memberUser.email || 'Member',
          task.name,
          projectName,
          workspaceName,
          assignerUser.name || assignerUser.email || 'Team Member',
          task.dueDate,
          task.description
        ),
      }))
    })
  }

  /**
   * Send task status changed notification (non-blocking)
   */
  async notifyTaskStatusChanged(
    task: Task,
    workspaceName: string,
    projectName: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    assigneeIds: string[]
  ): Promise<void> {
    if (assigneeIds.length === 0) return

    // Send email notifications
    sendEmailBackground(async () => {
      const { getTaskStatusChangedEmailTemplate } = await import('@/lib/email/templates/task-email-templates')
      const { users } = await createAdminClient()
      const changerUser = await users.get(changedBy)
      
      await this.sendToMembers(assigneeIds, (member, memberUser) => ({
        subject: `Task Status Updated: ${task.name}`,
        html: getTaskStatusChangedEmailTemplate(
          memberUser.name || memberUser.email || 'Member',
          task.name,
          projectName,
          workspaceName,
          oldStatus as any,
          newStatus as any,
          changerUser.name || changerUser.email || 'Team Member'
        ),
      }))
    })
  }

  /**
   * Send project created notification to workspace members (non-blocking)
   */
  async notifyProjectCreated(
    projectName: string,
    workspaceId: string,
    workspaceName: string,
    createdBy: string,
    excludeUserId?: string
  ): Promise<void> {
    sendEmailBackground(async () => {
      const { getProjectCreatedEmailTemplate } = await import('@/lib/email/templates/project-email-templates')
      const { users } = await createAdminClient()
      const allMembers = await this.databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
        Query.equal('workspaceId', workspaceId),
      ])
      
      const activeMembers = allMembers.documents.filter(
        (m) => m.isActive !== false && m.userId !== excludeUserId
      )

      if (activeMembers.length > 0) {
        const memberIds = activeMembers.map((m) => m.$id)
        const creatorUser = await users.get(createdBy)
        
        await this.sendToMembers(memberIds, (member, memberUser) => ({
          subject: `New Project Created: ${projectName}`,
          html: getProjectCreatedEmailTemplate(
            memberUser.name || memberUser.email || 'Member',
            projectName,
            workspaceName,
            creatorUser.name || creatorUser.email || 'Team Member'
          ),
        }))
      }
    })
  }

  /**
   * Send comment mention notification (non-blocking)
   */
  async notifyCommentMentioned(
    task: Task,
    workspaceName: string,
    projectName: string,
    commentAuthor: string,
    commentContent: string,
    mentionedMemberIds: string[]
  ): Promise<void> {
    if (mentionedMemberIds.length === 0) return

    // Send email notifications
    sendEmailBackground(async () => {
      const { getTaskMentionedEmailTemplate } = await import('@/lib/email/templates/comment-email-templates')
      const { users } = await createAdminClient()
      const authorUser = await users.get(commentAuthor)
      
      await this.sendToMembers(mentionedMemberIds, (member, memberUser) => ({
        subject: `You were mentioned in a comment on: ${task.name}`,
        html: getTaskMentionedEmailTemplate(
          memberUser.name || memberUser.email || 'Member',
          task.name,
          projectName,
          workspaceName,
          authorUser.name || authorUser.email || 'Team Member',
          commentContent
        ),
      }))
    })
  }

  /**
   * Send comment added notification to task assignees (non-blocking)
   */
  async notifyCommentAdded(
    task: Task,
    workspaceName: string,
    projectName: string,
    commentAuthor: string,
    commentContent: string,
    assigneeIds: string[],
    excludeUserId?: string
  ): Promise<void> {
    if (assigneeIds.length === 0) return

    // Send email notifications
    sendEmailBackground(async () => {
      const { getTaskCommentAddedEmailTemplate } = await import('@/lib/email/templates/comment-email-templates')
      const { users } = await createAdminClient()
      const authorUser = await users.get(commentAuthor)
      
      // Filter out the comment author
      const members = await this.databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
        Query.contains('$id', assigneeIds),
      ])
      
      const filteredMemberIds = members.documents
        .filter((m) => m.userId !== excludeUserId)
        .map((m) => m.$id)

      if (filteredMemberIds.length > 0) {
        await this.sendToMembers(filteredMemberIds, (member, memberUser) => ({
          subject: `New comment on task: ${task.name}`,
          html: getTaskCommentAddedEmailTemplate(
            memberUser.name || memberUser.email || 'Member',
            task.name,
            projectName,
            workspaceName,
            authorUser.name || authorUser.email || 'Team Member',
            commentContent
          ),
        }))
      }
    })
  }
}
