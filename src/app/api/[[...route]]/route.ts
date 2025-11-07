import { Hono } from 'hono';
import { handle } from 'hono/vercel';

import auth from '@/features/auth/server/route';
import attendance from '@/features/attendance/server/route';
import invoices from '@/features/invoices/server/route';
import members from '@/features/members/server/route';
import projects from '@/features/projects/server/route';
import tasks from '@/features/tasks/server/route';
import workspaces from '@/features/workspaces/server/route';
import nda from '@/features/nda/server/route';
import salarySlip from '@/features/salary-slip/server/route';
import activityLogs from '@/features/activity-logs/server/route';

export const runtime = 'nodejs';

const app = new Hono().basePath('/api');

const routes = app
  .route('/auth', auth)
  .route('/attendance', attendance)
  .route('/invoices', invoices)
  .route('/members', members)
  .route('/projects', projects)
  .route('/tasks', tasks)
  .route('/workspaces', workspaces)
  .route('/nda', nda)
  .route('/salary-slip', salarySlip)
  .route('/activity-logs', activityLogs);

export type AppType = typeof routes;

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
