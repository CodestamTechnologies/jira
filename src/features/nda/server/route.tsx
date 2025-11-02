import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Resend } from 'resend'
import { z } from 'zod'

import { sessionMiddleware } from '@/lib/session-middleware'

const resend = new Resend(process.env.RESEND_API_KEY)

const sendNDASchema = z.object({
  employeeName: z.string().trim().min(1, 'Employee name is required'),
  employeeEmail: z.string().email('Valid email is required'),
  employeeAddress: z.string().trim().min(1, 'Employee address is required'),
  employeeAadhar: z.string().trim().min(12, 'Aadhar number must be 12 digits').max(12, 'Aadhar number must be 12 digits'),
  effectiveDate: z.string().trim().min(1, 'Effective date is required'),
  pdfBase64: z.string().min(1, 'PDF data is required'),
})

const app = new Hono()
  .post(
    '/send',
    sessionMiddleware,
    zValidator('json', sendNDASchema),
    async (ctx) => {
      if (!process.env.RESEND_API_KEY) {
        return ctx.json({ error: 'Email service is not configured.' }, 500)
      }

      const user = ctx.get('user')
      const { employeeName, employeeEmail, employeeAddress, employeeAadhar, effectiveDate, pdfBase64 } = ctx.req.valid('json')

      try {
        const filename = `NDA-${employeeName.replace(/\s+/g, '-')}.pdf`

        // Send email with PDF attachment
        const emailResult = await resend.emails.send({
          from: 'Codestam Technologies <noreply@manyblogs.blog>',
          to: employeeEmail,
          subject: 'Employee Non-Disclosure, Non-Compete, and Intellectual Property Assignment Agreement',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Employee Non-Disclosure Agreement</h2>
              <p>Dear ${employeeName},</p>
              <p>Please find attached your Employee Non-Disclosure, Non-Compete, and Intellectual Property Assignment Agreement.</p>
              <p>Please review the document carefully and acknowledge receipt.</p>
              <p>Best regards,<br/>Codestam Technologies</p>
            </div>
          `,
          attachments: [
            {
              filename,
              content: pdfBase64,
            },
          ],
        })

        if (emailResult.error) {
          console.error('Resend API error:', emailResult.error)
          return ctx.json({ error: 'Failed to send email. Please try again later.' }, 500)
        }

        return ctx.json({
          success: true,
          message: 'NDA sent successfully to employee email.',
          emailId: emailResult.data?.id,
        })
      } catch (error) {
        console.error('Error sending NDA:', error)
        return ctx.json({ error: 'An error occurred while sending the NDA.' }, 500)
      }
    },
  )

export default app
