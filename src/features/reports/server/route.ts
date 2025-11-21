import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { sendDailyReportsToEmails } from '../reports-service'

const app = new Hono()

// Schema for the request body
const sendReportsSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email address is required'),
  date: z.string().optional(), // If not provided, defaults to today
})

app.post(
  '/daily',
  zValidator('json', sendReportsSchema),
  async (ctx) => {
    try {
      const { emails, date } = ctx.req.valid('json')

      // Send daily reports to all specified emails
      const result = await sendDailyReportsToEmails({
        emails,
        date,
      })

      if (!result.success) {
        return ctx.json(
          {
            success: false,
            error: result.error,
          },
          500
        )
      }

      return ctx.json({
        success: true,
        message: `Daily reports sent to ${emails.length} email(s) successfully`,
        emailIds: result.emailIds,
      })
    } catch (error) {
      console.error('Error sending daily reports:', error)

      if (error instanceof z.ZodError) {
        return ctx.json(
          {
            success: false,
            error: 'Invalid input data',
            details: error.errors,
          },
          400
        )
      }

      return ctx.json(
        {
          success: false,
          error: 'Failed to send reports',
        },
        500
      )
    }
  }
)

export default app

