import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Query } from 'node-appwrite';
import { z } from 'zod';

import { DATABASE_ID, INVOICES_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '../types';
import { getUserInfoForLogging } from '../utils/get-user-info';
import { logActivity } from '../utils/log-activity';
import { getRequestMetadata } from '../utils/get-request-metadata';
import { sessionMiddleware } from '@/lib/session-middleware';
import type { Invoice } from '@/features/invoices/types';

const logDownloadSchema = z.object({
  documentType: z.enum(['NDA', 'JOINING_LETTER', 'SALARY_SLIP', 'INVOICE', 'EXPENSE']),
  workspaceId: z.string().trim().min(1, 'Workspace ID is required'),
  documentName: z.string().optional(),
  invoiceNumber: z.string().optional(), // For invoice downloads
  employeeName: z.string().optional(), // For employee documents
  month: z.string().optional(), // For salary slips
  year: z.string().optional(), // For salary slips
});

const app = new Hono()
  .post(
    '/',
    sessionMiddleware,
    zValidator('json', logDownloadSchema),
    async (ctx) => {
      const user = ctx.get('user');
      const databases = ctx.get('databases');
      const { documentType, workspaceId, documentName, invoiceNumber, employeeName, month, year } = ctx.req.valid('json');

      // Map document type to entity type
      const entityTypeMap: Record<string, ActivityEntityType> = {
        NDA: ActivityEntityType.DOCUMENT_NDA,
        JOINING_LETTER: ActivityEntityType.DOCUMENT_JOINING_LETTER,
        SALARY_SLIP: ActivityEntityType.DOCUMENT_SALARY_SLIP,
        INVOICE: ActivityEntityType.DOCUMENT_INVOICE,
        EXPENSE: ActivityEntityType.EXPENSE,
      };

      const entityType = entityTypeMap[documentType];
      if (!entityType) {
        return ctx.json({ error: 'Invalid document type.' }, 400);
      }

      // For invoices, try to get invoice ID
      let entityId = `download-${Date.now()}`;
      let projectId: string | undefined;

      if (documentType === 'INVOICE' && invoiceNumber) {
        try {
          const invoices = await databases.listDocuments<Invoice>(DATABASE_ID, INVOICES_ID, [
            Query.equal('invoiceNumber', invoiceNumber),
            Query.limit(1),
          ]);
          if (invoices.documents.length > 0) {
            entityId = invoices.documents[0].$id;
            projectId = invoices.documents[0].projectId;
          }
        } catch (error) {
          console.error('Error fetching invoice for download logging:', error);
        }
      }

      // Log activity
      const userInfo = getUserInfoForLogging(user);
      const metadata = getRequestMetadata(ctx);
      await logActivity({
        databases,
        action: ActivityAction.DOWNLOAD,
        entityType,
        entityId,
        workspaceId,
        projectId,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: {
          new: {
            documentType,
            documentName,
            invoiceNumber,
            employeeName,
            month,
            year,
          },
        },
        metadata,
      });

      return ctx.json({ success: true });
    }
  );

export default app;
