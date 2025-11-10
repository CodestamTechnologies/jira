import { zValidator } from '@hono/zod-validator';
import { startOfDay, endOfDay } from 'date-fns';
import { Hono } from 'hono';
import { ID, Query } from 'node-appwrite';
import { z } from 'zod';

import { DATABASE_ID, INVOICES_ID, PROJECTS_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { logActivity } from '@/features/activity-logs/utils/log-activity';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { getMember } from '@/features/members/utils';
import { createInvoiceSchema } from '@/features/invoices/schema';
import type { Invoice } from '@/features/invoices/types';
import type { Project } from '@/features/projects/types';
import { generateInvoiceNumberPattern, getEnvironmentPrefix, parseInvoiceNumber } from '@/features/invoices/utils/invoice-number';
import { sessionMiddleware } from '@/lib/session-middleware';
import { sendEmailWithDefaults } from '@/lib/email/email-service';

const sendInvoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1, 'Invoice number is required'),
  clientName: z.string().trim().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required'),
  pdfBase64: z.string().min(1, 'PDF data is required'),
});

// Get current environment
const CURRENT_ENV = process.env.NODE_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'production';
const ENV_PREFIX = getEnvironmentPrefix();

// Validate INVOICES_ID is set
if (!INVOICES_ID) {
  console.error('INVOICES_ID is not configured. Please set NEXT_PUBLIC_APPWRITE_INVOICES_ID in environment variables.');
}

const app = new Hono()
  .get('/next-number', sessionMiddleware, async (ctx) => {
    if (!INVOICES_ID) {
      return ctx.json({ error: 'Invoice collection is not configured.' }, 500);
    }

    const databases = ctx.get('databases');

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Get all invoices created today (items stored as JSON string in Appwrite)
    const todayInvoices = await databases.listDocuments<Invoice & { items: string }>(DATABASE_ID, INVOICES_ID, [
      Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
      Query.lessThanEqual('$createdAt', todayEnd.toISOString()),
      Query.orderAsc('$createdAt'),
    ]);

    // Extract serial numbers from today's invoices (only for current environment)
    const todaySerialNumbers = todayInvoices.documents
      .map((invoice) => {
        // Parse invoice number to get environment and serial
        const parsed = parseInvoiceNumber(invoice.invoiceNumber);
        if (!parsed) return null;

        // Only count invoices from the same environment
        const invoiceEnv = invoice.environment || (parsed.environment === 'DEV/' ? 'development' : 'production');
        if (invoiceEnv !== CURRENT_ENV) return null;

        return parsed.serial;
      })
      .filter((num): num is number => num !== null)
      .sort((a, b) => a - b);

    // Get the next serial number (highest + 1, or 1 if no invoices today for this environment)
    const nextSerialNumber = todaySerialNumbers.length > 0 ? Math.max(...todaySerialNumbers) + 1 : 1;

    const nextInvoiceNumber = generateInvoiceNumberPattern(now, nextSerialNumber);

    return ctx.json({ data: { invoiceNumber: nextInvoiceNumber } });
  })
  .post('/', sessionMiddleware, zValidator('json', createInvoiceSchema), async (ctx) => {
    if (!INVOICES_ID) {
      return ctx.json({ error: 'Invoice collection is not configured.' }, 500);
    }

    const databases = ctx.get('databases');
    const user = ctx.get('user');

    // Get data from request - invoiceNumber is IGNORED (always server-generated)
    const { projectId, workspaceId, items, notes } = ctx.req.valid('json');

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.json({ error: 'At least one invoice item is required.' }, 400);
    }

    // Validate and sanitize items
    const validItems = items
      .filter((item) => item.description && item.description.trim() !== '' && typeof item.price === 'number' && item.price >= 0)
      .map((item) => ({
        description: item.description.trim(),
        price: Math.round(item.price * 100) / 100, // Round to 2 decimal places
      }));

    if (validItems.length === 0) {
      return ctx.json({ error: 'At least one valid invoice item is required.' }, 400);
    }

    // RECALCULATE totals server-side (ignore client-provided values)
    const subtotal = validItems.reduce((sum, item) => sum + item.price, 0);
    const total = Math.round(subtotal * 100) / 100; // Round to 2 decimal places

    // Verify user has access to workspace
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    // Verify project exists and belongs to workspace
    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    if (!project) {
      return ctx.json({ error: 'Project not found.' }, 404);
    }

    if (project.workspaceId !== workspaceId) {
      return ctx.json({ error: 'Project does not belong to workspace.' }, 400);
    }

    // ALWAYS generate invoice number server-side (ignore any client input)
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Get all invoices created today (items stored as JSON string in Appwrite)
    const todayInvoices = await databases.listDocuments<Invoice & { items: string }>(DATABASE_ID, INVOICES_ID, [
      Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
      Query.lessThanEqual('$createdAt', todayEnd.toISOString()),
      Query.orderAsc('$createdAt'),
    ]);

    // Extract serial numbers from today's invoices (only for current environment)
    const todaySerialNumbers = todayInvoices.documents
      .map((invoice) => {
        // Parse invoice number to get environment and serial
        const parsed = parseInvoiceNumber(invoice.invoiceNumber);
        if (!parsed) return null;

        // Only count invoices from the same environment
        const invoiceEnv = invoice.environment || (parsed.environment === 'DEV/' ? 'development' : 'production');
        if (invoiceEnv !== CURRENT_ENV) return null;

        return parsed.serial;
      })
      .filter((num): num is number => num !== null)
      .sort((a, b) => a - b);

    // Get the next serial number (highest + 1, or 1 if no invoices today for this environment)
    const nextSerialNumber = todaySerialNumbers.length > 0 ? Math.max(...todaySerialNumbers) + 1 : 1;

    // Generate invoice number server-side with environment prefix
    const invoiceNumber = generateInvoiceNumberPattern(now, nextSerialNumber);

    // Create invoice with server-calculated values
    // Store items as JSON string (Appwrite doesn't support JSON arrays directly)
    const invoice = await databases.createDocument(DATABASE_ID, INVOICES_ID, ID.unique(), {
      invoiceNumber, // Always server-generated (includes environment prefix)
      environment: CURRENT_ENV, // Store environment for filtering
      projectId,
      workspaceId, // Validated against member access
      items: JSON.stringify(validItems), // Store as JSON string
      notes: notes?.trim() || undefined,
      subtotal, // Server-calculated
      total, // Server-calculated
    });

    // Parse items from JSON string to array for response
    const invoiceResponse = {
      ...invoice,
      items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
    };

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    await logActivity({
      databases,
      action: ActivityAction.CREATE,
      entityType: ActivityEntityType.INVOICE,
      entityId: invoice.$id,
      workspaceId,
      projectId: projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { new: invoiceResponse },
      metadata,
    });

    return ctx.json({ data: invoiceResponse });
  })
  .get(
    '/',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
      }),
    ),
    async (ctx) => {
      if (!INVOICES_ID) {
        return ctx.json({ error: 'Invoice collection is not configured.' }, 500);
      }

      const user = ctx.get('user');
      const databases = ctx.get('databases');

      const { workspaceId, projectId } = ctx.req.valid('query');

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // If projectId is provided, verify it belongs to workspace
      if (projectId) {
        try {
          const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);
          if (project.workspaceId !== workspaceId) {
            return ctx.json({ error: 'Project does not belong to workspace.' }, 400);
          }
        } catch (error) {
          return ctx.json({ error: 'Project not found.' }, 404);
        }
      }

      const queries = [Query.equal('workspaceId', workspaceId)];

      if (projectId) {
        queries.push(Query.equal('projectId', projectId));
      }

      queries.push(Query.orderDesc('$createdAt'));

      const invoicesResponse = await databases.listDocuments<Invoice & { items: string }>(DATABASE_ID, INVOICES_ID, queries);

      // Parse items JSON string back to array
      // Filter by current environment (show only invoices from current environment)
      const invoices = {
        ...invoicesResponse,
        documents: invoicesResponse.documents
          .filter((invoice) => {
            // Only show invoices from current environment
            const invoiceEnv = invoice.environment || (invoice.invoiceNumber.startsWith('DEV/') ? 'development' : 'production');
            return invoiceEnv === CURRENT_ENV;
          })
          .map((invoice) => ({
            ...invoice,
            items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
          })),
      };

      // Update total count after filtering
      invoices.total = invoices.documents.length;

      return ctx.json({ data: invoices });
    },
  )
  .post(
    '/send',
    sessionMiddleware,
    zValidator('json', sendInvoiceSchema),
    async (ctx) => {
      if (!process.env.RESEND_API_KEY) {
        return ctx.json({ error: 'Email service is not configured.' }, 500);
      }

      const user = ctx.get('user');
      const databases = ctx.get('databases');
      const { invoiceNumber, clientName, clientEmail, pdfBase64 } = ctx.req.valid('json');

      // Get invoice to fetch workspaceId
      let workspaceId: string | undefined;
      try {
        const invoices = await databases.listDocuments<Invoice>(DATABASE_ID, INVOICES_ID, [
          Query.equal('invoiceNumber', invoiceNumber),
          Query.limit(1),
        ]);
        if (invoices.documents.length > 0) {
          workspaceId = invoices.documents[0].workspaceId;
        }
      } catch (error) {
        console.error('Error fetching invoice for logging:', error);
      }

      try {
        const filename = `invoice-${invoiceNumber.replace(/\//g, '-')}.pdf`;

        // Send email with PDF attachment (default CC and BCC are automatically added)
        const emailResult = await sendEmailWithDefaults({
          from: 'Codestam Technologies <noreply@manyblogs.blog>',
          to: clientEmail,
          subject: `Invoice ${invoiceNumber} from Codestam Technologies`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Invoice ${invoiceNumber}</h2>
              <p>Dear ${clientName},</p>
              <p>Please find attached invoice ${invoiceNumber} from Codestam Technologies.</p>
              <p>Please review the invoice and process payment as per the payment terms.</p>
              <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
              <p>Best regards,<br/>Codestam Technologies</p>
            </div>
          `,
          attachments: [
            {
              filename,
              content: pdfBase64,
            },
          ],
        });

        if (emailResult.error) {
          console.error('Resend API error:', emailResult.error);
          return ctx.json({ error: 'Failed to send email. Please try again later.' }, 500);
        }

        // Log activity
        if (workspaceId) {
          const userInfo = getUserInfoForLogging(user);
          const metadata = getRequestMetadata(ctx);
          await logActivity({
            databases,
            action: ActivityAction.SEND_EMAIL,
            entityType: ActivityEntityType.DOCUMENT_INVOICE,
            entityId: `email-${emailResult.data?.id || Date.now()}`,
            workspaceId,
            userId: userInfo.userId,
            username: userInfo.username,
            userEmail: userInfo.userEmail,
            changes: {
              new: {
                recipientEmail: clientEmail,
                recipientName: clientName,
                documentType: 'Invoice',
                invoiceNumber,
                emailId: emailResult.data?.id,
              },
            },
            metadata: {
              ...metadata,
              emailId: emailResult.data?.id,
              recipientEmail: clientEmail,
            },
          });
        }

        return ctx.json({
          success: true,
          message: 'Invoice sent successfully to client email.',
          emailId: emailResult.data?.id,
        });
      } catch (error) {
        console.error('Error sending invoice:', error);
        return ctx.json({ error: 'An error occurred while sending the invoice.' }, 500);
      }
    },
  );

export default app;
