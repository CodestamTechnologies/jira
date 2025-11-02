import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Resend } from 'resend'
import { z } from 'zod'

import { sessionMiddleware } from '@/lib/session-middleware'

const resend = new Resend(process.env.RESEND_API_KEY)

const sendSalarySlipSchema = z.object({
  employeeName: z.string().trim().min(1, 'Employee name is required'),
  employeeEmail: z.string().email('Valid email is required'),
  month: z.string().trim().min(1, 'Month is required'),
  year: z.string().trim().min(1, 'Year is required'),
  pdfBase64: z.string().min(1, 'PDF data is required'),
})

const app = new Hono()
  .post(
    '/send',
    sessionMiddleware,
    zValidator('json', sendSalarySlipSchema),
    async (ctx) => {
      if (!process.env.RESEND_API_KEY) {
        return ctx.json({ error: 'Email service is not configured.' }, 500)
      }

      const user = ctx.get('user')
      const { employeeName, employeeEmail, month, year, pdfBase64 } = ctx.req.valid('json')

      try {
        const filename = `Salary-Slip-${employeeName.replace(/\s+/g, '-')}-${month}-${year}.pdf`

        const emailResult = await resend.emails.send({
          from: 'Codestam Technologies <noreply@codestam.com>',
          to: employeeEmail,
          subject: `Salary Slip - ${month} ${year}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Salary Slip - ${month} ${year}</h2>
              <p>Dear ${employeeName},</p>
              <p>Please find attached your salary slip for ${month} ${year}.</p>
              <p>If you have any queries, please contact the HR department.</p>
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
          message: 'Salary slip sent successfully to employee email.',
          emailId: emailResult.data?.id,
        })
      } catch (error) {
        console.error('Error sending salary slip:', error)
        return ctx.json({ error: 'An error occurred while sending the salary slip.' }, 500)
      }
    },
  )

export default app
