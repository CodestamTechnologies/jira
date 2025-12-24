import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { ID, Query } from 'node-appwrite';
import { z } from 'zod';

import { DATABASE_ID, EXPENSES_ID, IMAGES_BUCKET_ID, PROJECTS_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { logActivity } from '@/features/activity-logs/utils/log-activity';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { getCurrentEnvironment } from '@/features/activity-logs/utils/get-environment';
import { getMember } from '@/features/members/utils';
import { createExpenseSchema, updateExpenseSchema, expenseFiltersSchema } from '@/features/expenses/schema';
import type { Expense } from '@/features/expenses/types';
import { ExpenseStatus } from '@/features/expenses/types';
import type { Project } from '@/features/projects/types';
import { sessionMiddleware } from '@/lib/session-middleware';
import { validateBillFile, MAX_BILL_FILE_SIZE, ALLOWED_BILL_FILE_TYPES } from '@/utils/file-validation';

// Get current environment
const CURRENT_ENV = getCurrentEnvironment();

// Validate EXPENSES_ID is set
if (!EXPENSES_ID) {
  // Use console.error for critical configuration errors (server-side only)
  console.error('[EXPENSES_ROUTE] EXPENSES_ID is not configured. Please set NEXT_PUBLIC_APPWRITE_EXPENSES_ID in environment variables.');
}

/**
 * Validates file type and size
 * Uses centralized file validation utility (DRY principle)
 */
const validateFile = (file: File): { valid: boolean; error?: string } => {
  return validateBillFile(file);
};

const app = new Hono()
  /**
   * GET / - List expenses with filters
   * Supports filtering by workspaceId, projectId, date range, category, and status
   */
  .get(
    '/',
    sessionMiddleware,
    zValidator('query', expenseFiltersSchema),
    async (ctx) => {
      if (!EXPENSES_ID) {
        return ctx.json({ error: 'Expenses collection is not configured.' }, 500);
      }

      const databases = ctx.get('databases');
      const user = ctx.get('user');
      const { workspaceId, projectId, startDate, endDate, category, status } = ctx.req.valid('query');

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

      // Build query filters
      const queries = [Query.equal('workspaceId', workspaceId)];

      if (projectId) {
        queries.push(Query.equal('projectId', projectId));
      }

      if (startDate) {
        queries.push(Query.greaterThanEqual('date', startDate));
      }

      if (endDate) {
        queries.push(Query.lessThanEqual('date', endDate));
      }

      if (category) {
        queries.push(Query.equal('category', category));
      }

      if (status) {
        queries.push(Query.equal('status', status));
      }

      queries.push(Query.orderDesc('date'));

      const expensesResponse = await databases.listDocuments<Expense>(DATABASE_ID, EXPENSES_ID, queries);

      // Filter by current environment (show only expenses from current environment)
      const expenses = {
        ...expensesResponse,
        documents: expensesResponse.documents.filter((expense) => {
          const expenseEnv = expense.environment || 'production'; // Default to production for backward compatibility
          return expenseEnv === CURRENT_ENV;
        }),
      };

      // Update total count after filtering
      expenses.total = expenses.documents.length;

      return ctx.json({ data: expenses });
    },
  )
  /**
   * GET /:expenseId - Get single expense
   */
  .get(
    '/:expenseId',
    sessionMiddleware,
    zValidator(
      'param',
      z.object({
        expenseId: z.string().min(1, 'Expense ID is required'),
      }),
    ),
    async (ctx) => {
      if (!EXPENSES_ID) {
        return ctx.json({ error: 'Expenses collection is not configured.' }, 500);
      }

      const databases = ctx.get('databases');
      const user = ctx.get('user');
      const { expenseId } = ctx.req.valid('param');

      try {
        const expense = await databases.getDocument<Expense>(DATABASE_ID, EXPENSES_ID, expenseId);

        // Verify user has access to workspace
        const member = await getMember({
          databases,
          workspaceId: expense.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return ctx.json({ error: 'Unauthorized.' }, 401);
        }

        return ctx.json({ data: expense });
      } catch (error) {
        return ctx.json({ error: 'Expense not found.' }, 404);
      }
    },
  )
  /**
   * POST / - Create expense with optional bill upload
   * Handles file upload via formData
   */
  .post(
    '/',
    sessionMiddleware,
    zValidator('form', createExpenseSchema),
    async (ctx) => {
      if (!EXPENSES_ID) {
        return ctx.json({ error: 'Expenses collection is not configured.' }, 500);
      }

      const databases = ctx.get('databases');
      const storage = ctx.get('storage');
      const user = ctx.get('user');

      // Get validated form data (excluding file)
      const validatedData = ctx.req.valid('form');
      const formData = await ctx.req.formData();
      
      const { workspaceId, projectId } = validatedData;

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

      // Handle bill file upload
      let billFileId: string | undefined = undefined;
      const billFile = formData.get('billFile') as File | null;

      if (billFile && billFile instanceof File) {
        const fileValidation = validateFile(billFile);
        if (!fileValidation.valid) {
          return ctx.json({ error: fileValidation.error }, 400);
        }

        try {
          const fileExt = billFile.name.split('.').at(-1) ?? 'bin';
          const fileName = `${ID.unique()}.${fileExt}`;
          const renamedFile = new File([billFile], fileName, { type: billFile.type });
          const uploadedFile = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), renamedFile);
          billFileId = uploadedFile.$id;
        } catch (error) {
          console.error('[CREATE_EXPENSE]: File upload error:', error);
          return ctx.json({ error: 'Failed to upload bill file.' }, 500);
        }
      }

      // Round amount to 2 decimal places
      const amount = Math.round(validatedData.amount * 100) / 100;

      // Create expense document
      const expense = await databases.createDocument(DATABASE_ID, EXPENSES_ID, ID.unique(), {
        amount,
        date: validatedData.date.toISOString().split('T')[0], // Store as YYYY-MM-DD
        description: validatedData.description.trim(),
        category: validatedData.category,
        customCategory: validatedData.customCategory?.trim() || undefined,
        projectId: projectId || undefined,
        workspaceId,
        billFileId: billFileId || undefined,
        notes: validatedData.notes?.trim() || undefined,
        status: validatedData.status || ExpenseStatus.APPROVED,
        submittedBy: user.$id,
        environment: CURRENT_ENV, // Store environment for filtering
      });

      // Log activity
      const userInfo = getUserInfoForLogging(user);
      const metadata = getRequestMetadata(ctx);
      await logActivity({
        databases,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.EXPENSE,
        entityId: expense.$id,
        workspaceId,
        projectId: projectId || undefined,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: { new: expense },
        metadata,
      });

      return ctx.json({ data: expense });
    },
  )
  /**
   * PATCH /:expenseId - Update expense
   * Handles bill file replacement if new file provided
   */
  .patch(
    '/:expenseId',
    sessionMiddleware,
    zValidator(
      'param',
      z.object({
        expenseId: z.string().min(1, 'Expense ID is required'),
      }),
    ),
    zValidator('form', updateExpenseSchema),
    async (ctx) => {
      if (!EXPENSES_ID) {
        return ctx.json({ error: 'Expenses collection is not configured.' }, 500);
      }

      const databases = ctx.get('databases');
      const storage = ctx.get('storage');
      const user = ctx.get('user');
      const { expenseId } = ctx.req.valid('param');

      // Get existing expense
      let existingExpense: Expense;
      try {
        existingExpense = await databases.getDocument<Expense>(DATABASE_ID, EXPENSES_ID, expenseId);
      } catch (error) {
        return ctx.json({ error: 'Expense not found.' }, 404);
      }

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId: existingExpense.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      const formData = await ctx.req.formData();
      const updateData: Partial<Expense> = {};

      // Handle amount update
      if (formData.has('amount')) {
        const amount = parseFloat(formData.get('amount') as string);
        updateData.amount = Math.round(amount * 100) / 100;
      }

      // Handle date update
      if (formData.has('date')) {
        const dateStr = formData.get('date') as string;
        updateData.date = new Date(dateStr).toISOString().split('T')[0];
      }

      // Handle description update
      if (formData.has('description')) {
        updateData.description = (formData.get('description') as string).trim();
      }

      // Handle category update
      if (formData.has('category')) {
        updateData.category = formData.get('category') as string;
      }

      // Handle custom category update
      if (formData.has('customCategory')) {
        const customCategory = formData.get('customCategory') as string;
        updateData.customCategory = customCategory?.trim() || undefined;
      }

      // Handle projectId update
      if (formData.has('projectId')) {
        const projectId = formData.get('projectId') as string;
        if (projectId) {
          // Verify project belongs to workspace
          try {
            const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);
            if (project.workspaceId !== existingExpense.workspaceId) {
              return ctx.json({ error: 'Project does not belong to workspace.' }, 400);
            }
            updateData.projectId = projectId;
          } catch (error) {
            return ctx.json({ error: 'Project not found.' }, 404);
          }
        } else {
          updateData.projectId = undefined;
        }
      }

      // Handle notes update
      if (formData.has('notes')) {
        const notes = formData.get('notes') as string;
        updateData.notes = notes?.trim() || undefined;
      }

      // Handle status update
      if (formData.has('status')) {
        updateData.status = formData.get('status') as ExpenseStatus;
      }

      // Handle bill file replacement
      const billFile = formData.get('billFile') as File | null;
      if (billFile && billFile instanceof File) {
        const fileValidation = validateFile(billFile);
        if (!fileValidation.valid) {
          return ctx.json({ error: fileValidation.error }, 400);
        }

        try {
          // Delete old file if exists
          if (existingExpense.billFileId) {
            try {
              await storage.deleteFile(IMAGES_BUCKET_ID, existingExpense.billFileId);
                  } catch (error) {
                    // Ignore error if file doesn't exist (non-critical)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.warn('[UPDATE_EXPENSE]: Failed to delete old bill file:', errorMessage);
                  }
          }

          // Upload new file
          const fileExt = billFile.name.split('.').at(-1) ?? 'bin';
          const fileName = `${ID.unique()}.${fileExt}`;
          const renamedFile = new File([billFile], fileName, { type: billFile.type });
          const uploadedFile = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), renamedFile);
          updateData.billFileId = uploadedFile.$id;
        } catch (error) {
          console.error('[UPDATE_EXPENSE]: File upload error:', error);
          return ctx.json({ error: 'Failed to upload bill file.' }, 500);
        }
      }

      // Update expense
      const updatedExpense = await databases.updateDocument(DATABASE_ID, EXPENSES_ID, expenseId, updateData);

      // Log activity
      const userInfo = getUserInfoForLogging(user);
      const metadata = getRequestMetadata(ctx);
      await logActivity({
        databases,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.EXPENSE,
        entityId: expenseId,
        workspaceId: existingExpense.workspaceId,
        projectId: updatedExpense.projectId || undefined,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: {
          old: existingExpense,
          new: updatedExpense,
        },
        metadata,
      });

      return ctx.json({ data: updatedExpense });
    },
  )
  /**
   * DELETE /:expenseId - Delete expense
   * Also deletes associated bill file
   */
  .delete(
    '/:expenseId',
    sessionMiddleware,
    zValidator(
      'param',
      z.object({
        expenseId: z.string().min(1, 'Expense ID is required'),
      }),
    ),
    async (ctx) => {
      if (!EXPENSES_ID) {
        return ctx.json({ error: 'Expenses collection is not configured.' }, 500);
      }

      const databases = ctx.get('databases');
      const storage = ctx.get('storage');
      const user = ctx.get('user');
      const { expenseId } = ctx.req.valid('param');

      // Get existing expense
      let existingExpense: Expense;
      try {
        existingExpense = await databases.getDocument<Expense>(DATABASE_ID, EXPENSES_ID, expenseId);
      } catch (error) {
        return ctx.json({ error: 'Expense not found.' }, 404);
      }

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId: existingExpense.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // Delete associated bill file if exists
      if (existingExpense.billFileId) {
        try {
          await storage.deleteFile(IMAGES_BUCKET_ID, existingExpense.billFileId);
        } catch (error) {
          // Non-critical error - expense deletion continues even if file deletion fails
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn('[DELETE_EXPENSE]: Failed to delete associated bill file:', errorMessage);
        }
      }

      // Delete expense document
      await databases.deleteDocument(DATABASE_ID, EXPENSES_ID, expenseId);

      // Log activity
      const userInfo = getUserInfoForLogging(user);
      const metadata = getRequestMetadata(ctx);
      await logActivity({
        databases,
        action: ActivityAction.DELETE,
        entityType: ActivityEntityType.EXPENSE,
        entityId: expenseId,
        workspaceId: existingExpense.workspaceId,
        projectId: existingExpense.projectId || undefined,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: { old: existingExpense },
        metadata,
      });

      return ctx.json({ success: true });
    },
  );

export default app;
