import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  cc?: string | string[]
}

const DEFAULT_CC_EMAIL = 'codestamtechnologies@gmail.com'

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string; emailId?: string }> => {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'Email service is not configured.' }
  }

  try {
    // Always include default CC email, merge with any provided CC
    const ccEmails = Array.isArray(options.cc)
      ? [...options.cc, DEFAULT_CC_EMAIL]
      : options.cc
        ? [options.cc, DEFAULT_CC_EMAIL]
        : [DEFAULT_CC_EMAIL]

    const result = await resend.emails.send({
      from: options.from || 'Codestam Technologies <noreply@manyblogs.blog>',
      to: options.to,
      cc: ccEmails,
      subject: options.subject,
      html: options.html,
    })

    if (result.error) {
      console.error('Resend API error:', result.error)
      return { success: false, error: 'Failed to send email.' }
    }

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: 'An error occurred while sending the email.' }
  }
}
