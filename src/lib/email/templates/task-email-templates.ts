import { TaskStatus } from '@/features/tasks/types'

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
      return 'To Do'
    case TaskStatus.IN_PROGRESS:
      return 'In Progress'
    case TaskStatus.IN_REVIEW:
      return 'In Review'
    case TaskStatus.DONE:
      return 'Done'
    default:
      return status
  }
}

export const getTaskAssignedEmailTemplate = (
  memberName: string,
  taskName: string,
  projectName: string,
  workspaceName: string,
  assignedBy: string,
  dueDate?: string,
  description?: string
) => {
  const dueDateText = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'

  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">New Task Assigned</h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          You have been assigned a new task by ${assignedBy}:
        </p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; border-left: 3px solid #171717; margin: 16px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; font-family: sans;">${taskName}</h2>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Workspace:</strong> ${workspaceName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Due Date:</strong> ${dueDateText}</p>
          ${description ? `<p style="margin: 12px 0 0 0; color: #0a0a0a; font-size: 14px; line-height: 1.5; font-family: sans;">${description}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces/${workspaceName}/tasks" 
             style="color: #171717; text-decoration: underline; font-size: 14px; font-family: sans;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces/${workspaceName}/tasks
          </a>
        </div>
        <p style="font-size: 14px; color: #737373; margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-family: sans;">
          Best regards,<br/>
          Codestam Technologies
        </p>
      </div>
    </div>
  `
}

export const getTaskStatusChangedEmailTemplate = (
  memberName: string,
  taskName: string,
  projectName: string,
  workspaceName: string,
  oldStatus: TaskStatus,
  newStatus: TaskStatus,
  changedBy: string
) => {
  const oldStatusLabel = getStatusLabel(oldStatus)
  const newStatusLabel = getStatusLabel(newStatus)

  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">Task Status Updated</h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          The status of a task you're assigned to has been updated by ${changedBy}:
        </p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; border-left: 3px solid #171717; margin: 16px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; font-family: sans;">${taskName}</h2>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Workspace:</strong> ${workspaceName}</p>
          <p style="margin: 12px 0 6px 0; color: #0a0a0a; font-size: 14px; font-family: sans;">
            <strong>Status:</strong> 
            <span style="color: #737373; text-decoration: line-through;">${oldStatusLabel}</span> 
            → 
            <strong>${newStatusLabel}</strong>
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces/${workspaceName}/tasks" 
             style="color: #171717; text-decoration: underline; font-size: 14px; font-family: sans;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces/${workspaceName}/tasks
          </a>
        </div>
        <p style="font-size: 14px; color: #737373; margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-family: sans;">
          Best regards,<br/>
          Codestam Technologies
        </p>
      </div>
    </div>
  `
}

export const getTaskCreatedEmailTemplate = (
  memberName: string,
  taskName: string,
  projectName: string,
  workspaceName: string,
  createdBy: string,
  dueDate?: string,
  description?: string
) => {
  const dueDateText = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'

  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">New Task Created</h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          A new task has been created by ${createdBy} and assigned to you:
        </p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; border-left: 3px solid #171717; margin: 16px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; font-family: sans;">${taskName}</h2>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Workspace:</strong> ${workspaceName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Due Date:</strong> ${dueDateText}</p>
          ${description ? `<p style="margin: 12px 0 0 0; color: #0a0a0a; font-size: 14px; line-height: 1.5; font-family: sans;">${description}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces/${workspaceName}/tasks" 
             style="color: #171717; text-decoration: underline; font-size: 14px; font-family: sans;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces/${workspaceName}/tasks
          </a>
        </div>
        <p style="font-size: 14px; color: #737373; margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-family: sans;">
          Best regards,<br/>
          Codestam Technologies
        </p>
      </div>
    </div>
  `
}
