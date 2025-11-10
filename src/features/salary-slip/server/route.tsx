import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types'
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info'
import { logActivity } from '@/features/activity-logs/utils/log-activity'
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata'
import { sessionMiddleware } from '@/lib/session-middleware'
import { sendEmailWithDefaults } from '@/lib/email/email-service'

const sendSalarySlipSchema = z.object({
  employeeName: z.string().trim().min(1, 'Employee name is required'),
  employeeEmail: z.string().email('Valid email is required'),
  month: z.string().trim().min(1, 'Month is required'),
  year: z.string().trim().min(1, 'Year is required'),
  pdfBase64: z.string().min(1, 'PDF data is required'),
  workspaceId: z.string().trim().min(1, 'Workspace ID is required'),
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
      const databases = ctx.get('databases')
      const { employeeName, employeeEmail, month, year, pdfBase64, workspaceId } = ctx.req.valid('json')

      try {
        const filename = `Salary-Slip-${employeeName.replace(/\s+/g, '-')}-${month}-${year}.pdf`

        // Send email with PDF attachment (default CC and BCC are automatically added)
        const emailResult = await sendEmailWithDefaults({
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

        // Log activity
        const userInfo = getUserInfoForLogging(user)
        const metadata = getRequestMetadata(ctx)
        await logActivity({
          databases,
          action: ActivityAction.SEND_EMAIL,
          entityType: ActivityEntityType.DOCUMENT_SALARY_SLIP,
          entityId: `email-${emailResult.data?.id || Date.now()}`,
          workspaceId,
          userId: userInfo.userId,
          username: userInfo.username,
          userEmail: userInfo.userEmail,
          changes: {
            new: {
              recipientEmail: employeeEmail,
              recipientName: employeeName,
              documentType: 'Salary Slip',
              month,
              year,
              emailId: emailResult.data?.id,
            },
          },
          metadata: {
            ...metadata,
            emailId: emailResult.data?.id,
            recipientEmail: employeeEmail,
          },
        })

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
