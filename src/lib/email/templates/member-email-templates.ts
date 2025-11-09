export const getMemberAddedEmailTemplate = (memberName: string, workspaceName: string, inviterName: string) => {
  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">Welcome to <strong>${workspaceName}</strong></h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          You have been added to the workspace <strong>${workspaceName}</strong> by ${inviterName}.
        </p>
        <p style="font-size: 14px; margin-bottom: 20px; color: #0a0a0a; font-family: sans;">
          You can now access the workspace and start collaborating with your team.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces" 
             style="color: #171717; text-decoration: underline; font-size: 14px; font-family: sans;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces
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

export const getMemberRoleChangedEmailTemplate = (
  memberName: string,
  workspaceName: string,
  newRole: string,
  changedBy: string
) => {
  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">Role Updated in <strong>${workspaceName}</strong></h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          Your role in the workspace <strong>${workspaceName}</strong> has been updated to <strong>${newRole}</strong> by ${changedBy}.
        </p>
        <p style="font-size: 14px; margin-bottom: 20px; color: #0a0a0a; font-family: sans;">
          This change affects your permissions and access within the workspace.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces" 
             style="color: #171717; text-decoration: underline; font-size: 14px; font-family: sans;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces
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

export const getMemberStatusChangedEmailTemplate = (
  memberName: string,
  workspaceName: string,
  isActive: boolean,
  changedBy: string
) => {
  const statusText = isActive ? 'activated' : 'deactivated'

  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">Account ${statusText.charAt(0).toUpperCase() + statusText.slice(1)} in <strong>${workspaceName}</strong></h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          Your account in the workspace <strong>${workspaceName}</strong> has been <strong>${statusText}</strong> by ${changedBy}.
        </p>
        ${!isActive ? '<p style="font-size: 14px; margin-bottom: 20px; color: #0a0a0a; font-family: sans;">You will no longer have access to this workspace until your account is reactivated.</p>' : '<p style="font-size: 14px; margin-bottom: 20px; color: #0a0a0a; font-family: sans;">You can now access the workspace again.</p>'}
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces" 
             style="color: #171717; text-decoration: underline; font-size: 14px; font-family: sans;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://jira.codestam.com'}/workspaces
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

export const getMemberRemovedEmailTemplate = (memberName: string, workspaceName: string, removedBy: string) => {
  return `
    <div style="font-family: sans; line-height: 1.5; color: #0a0a0a; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
        <h1 style="color: #0a0a0a; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; font-family: sans;">Removed from <strong>${workspaceName}</strong></h1>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">Hello <strong>${memberName}</strong>,</p>
        <p style="font-size: 14px; margin-bottom: 12px; color: #0a0a0a; font-family: sans;">
          You have been removed from the workspace <strong>${workspaceName}</strong> by ${removedBy}.
        </p>
        <p style="font-size: 14px; margin-bottom: 20px; color: #0a0a0a; font-family: sans;">
          You will no longer have access to this workspace or any of its resources.
        </p>
        <p style="font-size: 14px; color: #737373; margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-family: sans;">
          If you believe this was done in error, please contact the workspace administrator.
        </p>
        <p style="font-size: 14px; color: #737373; margin-top: 16px; font-family: sans;">
          Best regards,<br/>
          Codestam Technologies
        </p>
      </div>
    </div>
  `
}
