import { Resend } from 'resend'

// Export shared Resend instance to avoid multiple initializations
export const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: string
    type?: string
  }>
}

const DEFAULT_CC_EMAIL = 'codestamtechnologies@gmail.com'
export const DEFAULT_BCC_EMAILS = ['kushwaha@codestam.com', 'souravmishra@codestam.com']

/**
 * Helper function to merge email arrays
 */
const mergeEmailArray = (provided: string | string[] | undefined, defaults: string[]): string[] => {
  if (!provided) return defaults
  const providedArray = Array.isArray(provided) ? provided : [provided]
  return [...providedArray, ...defaults]
}

/**
 * Wrapper around resend.emails.send() that automatically includes default CC and BCC.
 * Use this instead of calling resend.emails.send() directly to ensure defaults are always applied.
 * 
 * This function accepts all the same options as resend.emails.send() (including attachments, etc.)
 * and automatically merges default CC and BCC addresses.
 */
export const sendEmailWithDefaults = async (
  options: Parameters<typeof resend.emails.send>[0]
): Promise<ReturnType<typeof resend.emails.send>> => {
  // Always include default CC email, merge with any provided CC
  const ccEmails = mergeEmailArray(options.cc, [DEFAULT_CC_EMAIL])

  // Always include default BCC emails, merge with any provided BCC
  const bccEmails = mergeEmailArray(options.bcc, DEFAULT_BCC_EMAILS)

  return resend.emails.send({
    ...options,
    cc: ccEmails,
    bcc: bccEmails,
  })
}

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

    // Always include default BCC emails, merge with any provided BCC
    const bccEmails = Array.isArray(options.bcc)
      ? [...options.bcc, ...DEFAULT_BCC_EMAILS]
      : options.bcc
        ? [options.bcc, ...DEFAULT_BCC_EMAILS]
        : DEFAULT_BCC_EMAILS

    const emailData: any = {
      from: options.from || 'Codestam Technologies <noreply@manyblogs.blog>',
      to: options.to,
      cc: ccEmails,
      bcc: bccEmails,
      subject: options.subject,
      html: options.html,
    }

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        type: attachment.type || 'application/octet-stream',
      }))
    }

    const result = await resend.emails.send(emailData)

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
