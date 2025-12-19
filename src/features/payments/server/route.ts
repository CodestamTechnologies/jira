import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import Razorpay from 'razorpay'
import { z } from 'zod'

import { createPaymentLinkSchema } from '../schema'

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured')
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

const app = new Hono()
  .post(
    '/create-link',
    zValidator('json', createPaymentLinkSchema),
    async (ctx) => {
      try {
        // Validate Razorpay credentials
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          return ctx.json(
            {
              error: 'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.',
            },
            500,
          )
        }

        const razorpay = getRazorpayInstance()
        const paymentData = ctx.req.valid('json')

        // Convert amount to paise (Razorpay expects amount in smallest currency unit)
        // For INR, 1 rupee = 100 paise
        const amountInPaise = Math.round(paymentData.amount * 100)

        // Prepare payment link options
        const options: Record<string, unknown> = {
          amount: amountInPaise,
          currency: paymentData.currency || 'INR',
          description: paymentData.description,
          reminder_enable: paymentData.reminderEnable ?? true,
        }

        // Add optional fields only if they are defined
        if (paymentData.customer) {
          options.customer = {
            name: paymentData.customer.name,
            email: paymentData.customer.email,
            ...(paymentData.customer.contact && { contact: paymentData.customer.contact }),
          }
        }

        if (paymentData.notes && Object.keys(paymentData.notes).length > 0) {
          options.notes = paymentData.notes
        }

        if (paymentData.expireBy) {
          options.expire_by = paymentData.expireBy
        }

        if (paymentData.callbackUrl) {
          options.callback_url = paymentData.callbackUrl
          options.callback_method = paymentData.callbackMethod || 'post'
        }

        // Create payment link
        const paymentLink = (await razorpay.paymentLink.create(options as never)) as unknown as {
          id: string
          short_url: string
          status: string
          amount: number
          currency: string
          description: string
          customer?: {
            name: string
            email: string
            contact?: string
          }
          notes?: Record<string, string>
          expire_by?: number
          reminder_enable: boolean
          created_at: number
        }

        return ctx.json({
          data: {
            id: paymentLink.id,
            shortUrl: paymentLink.short_url,
            status: paymentLink.status,
            amount: paymentLink.amount / 100, // Convert back to rupees
            currency: paymentLink.currency,
            description: paymentLink.description,
            customer: paymentLink.customer
              ? {
                name: paymentLink.customer.name,
                email: paymentLink.customer.email,
                contact: paymentLink.customer.contact,
              }
              : undefined,
            notes: paymentLink.notes,
            expireBy: paymentLink.expire_by,
            reminderEnable: paymentLink.reminder_enable,
            createdAt: paymentLink.created_at,
          },
        })
      } catch (error: unknown) {
        console.error('Error creating Razorpay payment link:', error)

        if (error instanceof Error) {
          // Handle Razorpay API errors
          if (error.message.includes('authentication')) {
            return ctx.json({ error: 'Invalid Razorpay credentials.' }, 401)
          }

          if (error.message.includes('amount')) {
            return ctx.json({ error: 'Invalid amount specified.' }, 400)
          }

          return ctx.json(
            {
              error: error.message || 'Failed to create payment link. Please try again later.',
            },
            500,
          )
        }

        return ctx.json(
          {
            error: 'An unexpected error occurred while creating the payment link.',
          },
          500,
        )
      }
    },
  )
  .get(
    '/link/:id',
    zValidator(
      'param',
      z.object({
        id: z.string().min(1, 'Payment link ID is required'),
      }),
    ),
    async (ctx) => {
      try {
        // Validate Razorpay credentials
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          return ctx.json(
            {
              error: 'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.',
            },
            500,
          )
        }

        const razorpay = getRazorpayInstance()
        const { id } = ctx.req.valid('param')

        // Fetch payment link details
        const paymentLink = (await razorpay.paymentLink.fetch(id)) as unknown as {
          id: string
          short_url: string
          status: string
          amount: number
          currency: string
          description: string
          customer?: {
            name: string
            email: string
            contact?: string
          }
          notes?: Record<string, string>
          expire_by?: number
          reminder_enable: boolean
          created_at: number
        }

        const amount = typeof paymentLink.amount === 'number' ? paymentLink.amount / 100 : 0

        return ctx.json({
          data: {
            id: paymentLink.id,
            shortUrl: paymentLink.short_url,
            status: paymentLink.status,
            amount, // Convert back to rupees
            currency: paymentLink.currency,
            description: paymentLink.description,
            customer: paymentLink.customer
              ? {
                name: paymentLink.customer.name,
                email: paymentLink.customer.email,
                contact: paymentLink.customer.contact,
              }
              : undefined,
            notes: paymentLink.notes,
            expireBy: paymentLink.expire_by,
            reminderEnable: paymentLink.reminder_enable,
            createdAt: paymentLink.created_at,
          },
        })
      } catch (error: unknown) {
        console.error('Error fetching Razorpay payment link:', error)

        if (error instanceof Error) {
          if (error.message.includes('not found') || error.message.includes('No such')) {
            return ctx.json({ error: 'Payment link not found.' }, 404)
          }

          return ctx.json(
            {
              error: error.message || 'Failed to fetch payment link. Please try again later.',
            },
            500,
          )
        }

        return ctx.json(
          {
            error: 'An unexpected error occurred while fetching the payment link.',
          },
          500,
        )
      }
    },
  )

export default app
