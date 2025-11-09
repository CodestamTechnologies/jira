export const getTaskMentionedEmailTemplate = (
  memberName: string,
  taskName: string,
  projectName: string,
  workspaceName: string,
  commentAuthor: string,
  commentContent: string
) => {
  // Truncate comment if too long
  const truncatedComment = commentContent.length > 200 ? commentContent.substring(0, 200) + '...' : commentContent

  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">You Were Mentioned</h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          ${commentAuthor} mentioned you in a comment on a task:
        </p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; border-left: 3px solid #171717; margin: 16px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; font-family: sans;">${taskName}</h2>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Workspace:</strong> ${workspaceName}</p>
          <div style="margin: 12px 0 0 0; padding: 12px; background: #ffffff; border-radius: 4px; border: 1px solid #e5e5e5;">
            <p style="margin: 0 0 6px 0; color: #737373; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans;">Comment:</p>
            <p style="margin: 0; color: #0a0a0a; font-size: 14px; line-height: 1.5; white-space: pre-wrap; font-family: sans;">${truncatedComment}</p>
          </div>
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

export const getTaskCommentAddedEmailTemplate = (
  memberName: string,
  taskName: string,
  projectName: string,
  workspaceName: string,
  commentAuthor: string,
  commentContent: string
) => {
  // Truncate comment if too long
  const truncatedComment = commentContent.length > 200 ? commentContent.substring(0, 200) + '...' : commentContent

  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">New Comment on Task</h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          ${commentAuthor} added a comment on a task you're assigned to:
        </p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; border-left: 3px solid #171717; margin: 16px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #0a0a0a; font-weight: 600; font-family: sans;">${taskName}</h2>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin: 6px 0; color: #737373; font-size: 14px; font-family: sans;"><strong>Workspace:</strong> ${workspaceName}</p>
          <div style="margin: 12px 0 0 0; padding: 12px; background: #ffffff; border-radius: 4px; border: 1px solid #e5e5e5;">
            <p style="margin: 0 0 6px 0; color: #737373; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans;">Comment:</p>
            <p style="margin: 0; color: #0a0a0a; font-size: 14px; line-height: 1.5; white-space: pre-wrap; font-family: sans;">${truncatedComment}</p>
          </div>
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
