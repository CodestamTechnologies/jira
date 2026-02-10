import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Query } from 'node-appwrite';

import { createSessionClient, createAdminClient } from '@/lib/appwrite';
import { ATTENDANCE_ID, DATABASE_ID, MEMBERS_ID, TASKS_ID, COMMENTS_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { logActivity, getChangedFields } from '@/features/activity-logs/utils/log-activity';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { createAttendanceSchema, updateAttendanceSchema, attendanceFiltersSchema, specialDaysSchema } from '../schema';
import { getCurrent } from '@/features/auth/queries';
import { Attendance, SpecialDay } from '../types';
import { getMember } from '@/features/members/utils';
import { TaskStatus } from '@/features/tasks/types';
import type { Task, Comment } from '@/features/tasks/types';
import { getTodayDateRange, getTodayDateString, countWorkingDays, isWorkingDay } from '@/utils/date-helpers';
import { groupCommentsByTaskId, generateSummaryFromTasks } from '../utils/summary-generator';
import { SPECIAL_DAYS_ID } from '@/config/db';
import { parseISO, differenceInCalendarDays, eachDayOfInterval, format } from 'date-fns';

// Validate environment variables
if (!ATTENDANCE_ID) {
  console.error('ATTENDANCE_ID is not set in environment variables');
}

if (!DATABASE_ID) {
  console.error('DATABASE_ID is not set in environment variables');
}

const app = new Hono();

// Test endpoint to check if collection exists
app.get('/test', async (c) => {
  try {
    const { databases } = await createSessionClient();
    console.log('Testing connection to attendance collection...');
    console.log('Database ID:', DATABASE_ID);
    console.log('Attendance ID:', ATTENDANCE_ID);

    // Try to list documents with no filters
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      []
    );

    return c.json({
      success: true,
      message: 'Collection exists and is accessible',
      documentCount: response.documents.length
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseId: DATABASE_ID,
      attendanceId: ATTENDANCE_ID
    }, 500);
  }
});

// Get attendance records
app.get('/', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    console.log('Attendance API Request:', {
      workspaceId,
      startDate,
      endDate,
      status,
      userId,
      currentUser: user.$id,
      url: c.req.url
    });

    if (!workspaceId) {
      return c.json({ error: 'Workspace ID is required' }, 400);
    }

    // Validate workspace ID
    if (!workspaceId.trim()) {
      return c.json({ error: 'Invalid workspace ID' }, 400);
    }



    let queries = [
      Query.equal('workspaceId', workspaceId.trim())
    ];

    // Always filter by user ID unless a specific userId is provided for admin views
    if (userId) {
      // If specific userId is provided, check if user is admin
      let isAdmin = false;
      try {
        const { databases } = await createSessionClient();
        const membersResponse = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_ID,
          [
            Query.equal('workspaceId', workspaceId.trim()),
            Query.equal('userId', user.$id)
          ]
        );

        if (membersResponse.documents.length > 0) {
          const member = membersResponse.documents[0];
          isAdmin = member.role === 'ADMIN';
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }

      if (!isAdmin) {
        return c.json({ error: 'Unauthorized: Only admins can view other users\' attendance' }, 403);
      }

      // If admin and specific userId is provided, filter by that user
      queries.push(Query.equal('userId', userId));
    } else {
      // Otherwise, show only current user's records
      queries.push(Query.equal('userId', user.$id));
    }

    // Add optional filters
    if (startDate) {
      queries.push(Query.greaterThanEqual('date', startDate));
    }
    if (endDate) {
      queries.push(Query.lessThanEqual('date', endDate));
    }
    if (status && status !== 'all') {
      queries.push(Query.equal('status', status));
    }

    // Order by latest date first (descending)
    queries.push(Query.orderDesc('date')); // We will sort manually after filling gaps

    // Parse pagination parameters
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = limit ? parseInt(limit, 10) : 10;
    const offset = (pageNumber - 1) * pageSize;

    // Add pagination to queries
    queries.push(Query.limit(pageSize));
    queries.push(Query.offset(offset));

    // Fetch all records for the range to fill gaps correctly
    // If no range is provided, we might want to limit to current month or similar default?
    // For now, let's keep it simple: if no range, just fetch latest 50?
    if (!startDate && !endDate) {
      queries.push(Query.limit(50));
      queries.push(Query.orderDesc('date'));
    }

    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      queries
    );

    let documents = response.documents as unknown as Attendance[];

    // If we have a date range, we need to fill in "Absent" days
    if (startDate && endDate) {
      // Fetch special days for the range
      const specialDaysResponse = await databases.listDocuments<SpecialDay>(
        DATABASE_ID,
        SPECIAL_DAYS_ID,
        [
          Query.equal('workspaceId', workspaceId.trim()),
          Query.greaterThanEqual('date', startDate),
          Query.lessThanEqual('date', endDate)
        ]
      );
      const specialDays = specialDaysResponse.documents;

      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = eachDayOfInterval({ start, end });

      const allDays: Attendance[] = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const existingRecord = documents.find(doc => doc.date === dateStr);

        if (existingRecord) return existingRecord;

        // No record found
        const isWorking = isWorkingDay(dateStr, specialDays);

        if (isWorking) {
          // If today is working day, and it's in the past (or almost over), mark as absent
          // But if it's strictly in the future, we shouldn't show "Absent" yet? 
          // Logic: If date < today, show absent. If date == today, show nothing/pending?
          // User requirement: "if employee not mark attandance that day then the day would be count as absent"

          const todayStr = getTodayDateString();
          if (dateStr < todayStr) {
            return {
              $id: `absent-${dateStr}`,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              userId: userId || user.$id,
              workspaceId: workspaceId.trim(),
              date: dateStr,
              checkInTime: '',
              checkInLatitude: 0,
              checkInLongitude: 0,
              status: 'absent',
            } as Attendance;
          }
        }

        return null;
      }).filter(Boolean) as Attendance[];

      // Sort descending
      allDays.sort((a, b) => b.date.localeCompare(a.date));

      documents = allDays;
    }

    // Return paginated response with total count
    // Since we manually filled gaps, pagination needs to be manual too if we want it
    // For now, returning all
    return c.json({
      documents: documents,
      total: documents.length,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return c.json({ error: 'Failed to fetch attendance' }, 500);
  }
});

// Special Days Management
app.post('/special-days', zValidator('json', specialDaysSchema), async (c) => {
  try {
    const user = await getCurrent();
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { workspaceId, date, type, description } = await c.req.json();

    // Check admin using session client (verifies user has access)
    const { databases } = await createSessionClient();
    const member = await getMember({ databases, workspaceId, userId: user.$id });

    if (!member || member.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Use Admin Client for database operations on restricted collection
    const { databases: adminDatabases } = await createAdminClient();

    // Check if existing special day for this date (regardless of type)
    const existing = await adminDatabases.listDocuments(DATABASE_ID, SPECIAL_DAYS_ID, [
      Query.equal('workspaceId', workspaceId),
      Query.equal('date', date)
    ]);

    if (existing.documents.length > 0) {
      // Update - toggle the existing type
      const updated = await adminDatabases.updateDocument(
        DATABASE_ID, SPECIAL_DAYS_ID, existing.documents[0].$id,
        { type: existing.documents[0].type === 'holiday' ? 'working' : 'holiday', description }
      );
      return c.json(updated);
    }

    // Create
    const created = await adminDatabases.createDocument(
      DATABASE_ID, SPECIAL_DAYS_ID, 'unique()',
      { workspaceId, date, type, description }
    );

    return c.json(created);

  } catch (error) {
    console.error('Error saving special day:', error);
    return c.json({ error: 'Failed to save special day' }, 500);
  }
});

app.get('/special-days', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { searchParams } = new URL(c.req.url);
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const queries = [Query.equal('workspaceId', workspaceId)];
    if (startDate) queries.push(Query.greaterThanEqual('date', startDate));
    if (endDate) queries.push(Query.lessThanEqual('date', endDate));

    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(DATABASE_ID, SPECIAL_DAYS_ID, queries);

    return c.json(response);
  } catch (error) {
    console.error('Error fetching special days:', error);
    return c.json({ error: 'Failed to fetch special days' }, 500);
  }
});

app.delete('/special-days/:id', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const dayId = c.req.param('id');
    const { databases } = await createSessionClient();

    // We need to verify workspace ownership/admin status, but we don't have workspaceId easily here
    // For now assuming if they can delete, they are authorized (Appwrite permissions handle this usually, but we should double check)
    // Fetch the doc first
    const uniqueDay = await databases.getDocument(DATABASE_ID, SPECIAL_DAYS_ID, dayId);

    // Check admin status first
    const member = await getMember({ databases, workspaceId: uniqueDay.workspaceId, userId: user.$id });
    if (!member || member.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Use Admin Client for deletion
    const { databases: adminDatabases } = await createAdminClient();
    await adminDatabases.deleteDocument(DATABASE_ID, SPECIAL_DAYS_ID, dayId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting special day:', error);
    return c.json({ error: 'Failed to delete special day' }, 500);
  }
});

// Check in
app.post('/check-in', zValidator('json', createAttendanceSchema), async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { workspaceId, checkInLatitude, checkInLongitude, checkInAddress, notes } = body;

    if (!workspaceId || !workspaceId.trim()) {
      return c.json({ error: 'Invalid workspace ID' }, 400);
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already checked in today
    const { databases } = await createSessionClient();
    const checkInQueries = [
      Query.equal('workspaceId', workspaceId.trim()),
      Query.equal('userId', user.$id),
      Query.equal('date', today)
    ];

    const existingAttendance = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      checkInQueries
    );

    if (existingAttendance.documents.length > 0) {
      return c.json({ error: 'Already checked in today' }, 400);
    }

    // Determine status based on check-in time
    const checkInHour = new Date().getHours();
    const checkInMinute = new Date().getMinutes();
    let status = 'present';

    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
      status = 'late';
    }

    const attendance = await databases.createDocument(
      DATABASE_ID,
      ATTENDANCE_ID,
      'unique()',
      {
        userId: user.$id,
        workspaceId,
        date: today,
        checkInTime: now,
        checkInLatitude,
        checkInLongitude,
        checkInAddress,
        checkOutTime: null, // Set to null for check-in
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutAddress: null,
        totalHours: null,
        status,
        notes,
      }
    );

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(c);
    await logActivity({
      databases,
      action: ActivityAction.CREATE,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.$id,
      workspaceId,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { new: attendance },
      metadata,
    });

    return c.json(attendance);
  } catch (error) {
    console.error('Error checking in:', error);
    return c.json({ error: 'Failed to check in' }, 500);
  }
});

// Generate summary from today's tasks and comments
app.get('/generate-summary', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId || !workspaceId.trim()) {
      return c.json({ error: 'Workspace ID is required' }, 400);
    }

    const { databases } = await createSessionClient();

    // Get member to verify access
    const member = await getMember({
      databases,
      workspaceId: workspaceId.trim(),
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get today's date range for querying comments
    const { start: todayStart, end: todayEnd } = getTodayDateRange();

    // Get all IN_PROGRESS tasks assigned to user
    const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('workspaceId', workspaceId.trim()),
      Query.contains('assigneeIds', member.$id),
      Query.equal('status', TaskStatus.IN_PROGRESS),
    ]);

    // Get comments by this user made TODAY
    const todayComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
      Query.equal('authorId', user.$id),
      Query.greaterThanEqual('$createdAt', todayStart),
      Query.lessThanEqual('$createdAt', todayEnd),
    ]);

    // Group comments by task ID for efficient lookup
    const commentsByTaskId = groupCommentsByTaskId(todayComments.documents);

    // Generate formatted summary from tasks and comments
    const autoGeneratedSummary = generateSummaryFromTasks(userTasks.documents, commentsByTaskId);

    return c.json({
      summary: autoGeneratedSummary,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return c.json({ error: 'Failed to generate summary' }, 500);
  }
});

// Get pending tasks (uncommented tasks)
app.get('/pending-tasks', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId || !workspaceId.trim()) {
      return c.json({ error: 'Workspace ID is required' }, 400);
    }

    const { databases } = await createSessionClient();

    // Get member to verify access
    const member = await getMember({
      databases,
      workspaceId: workspaceId.trim(),
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all tasks assigned to user that are IN_PROGRESS (only these need comments)
    const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('workspaceId', workspaceId.trim()),
      Query.contains('assigneeIds', member.$id),
      Query.equal('status', TaskStatus.IN_PROGRESS),
    ]);

    // Get today's date range for querying comments
    const { start: todayStart, end: todayEnd } = getTodayDateRange();

    // Get comments by this user made TODAY
    const todayComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
      Query.equal('authorId', user.$id),
      Query.greaterThanEqual('$createdAt', todayStart),
      Query.lessThanEqual('$createdAt', todayEnd),
    ]);

    // Get task IDs that user has commented on TODAY (using Set for O(1) lookup)
    const commentedTaskIdsToday = new Set(todayComments.documents.map((comment) => comment.taskId));

    // Find tasks without comments TODAY
    const uncommentedTasks = userTasks.documents.filter((task) => !commentedTaskIdsToday.has(task.$id));

    return c.json({
      uncommentedTasks: uncommentedTasks.map((task) => ({
        id: task.$id,
        name: task.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return c.json({ error: 'Failed to fetch pending tasks' }, 500);
  }
});

// Check out
app.put('/check-out', zValidator('json', updateAttendanceSchema), async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    // Notes are already normalized by the schema transform
    const { checkOutLatitude, checkOutLongitude, checkOutAddress, notes } = body;

    // Get today's date string and current timestamp
    const today = getTodayDateString();
    const now = new Date().toISOString();

    // Find today's attendance record
    const { databases } = await createSessionClient();
    const checkOutQueries = [
      Query.equal('userId', user.$id),
      Query.equal('date', today)
    ];

    const existingAttendance = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      checkOutQueries
    );

    if (existingAttendance.documents.length === 0) {
      return c.json({ error: 'No check-in record found for today' }, 400);
    }

    const attendanceRecord = existingAttendance.documents[0];

    if (attendanceRecord.checkOutTime) {
      return c.json({ error: 'Already checked out today' }, 400);
    }

    // Validate: Check if user has commented TODAY on all their non-DONE tasks
    const member = await getMember({
      databases,
      workspaceId: attendanceRecord.workspaceId,
      userId: user.$id,
    });

    if (member) {
      // Get all tasks assigned to user that are IN_PROGRESS (only these need comments)
      const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.equal('workspaceId', attendanceRecord.workspaceId),
        Query.contains('assigneeIds', member.$id),
        Query.equal('status', TaskStatus.IN_PROGRESS),
      ]);

      // Get today's date range for querying comments
      const { start: todayStart, end: todayEnd } = getTodayDateRange();

      // Get comments by this user made TODAY
      const todayComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
        Query.equal('authorId', user.$id),
        Query.greaterThanEqual('$createdAt', todayStart),
        Query.lessThanEqual('$createdAt', todayEnd),
      ]);

      // Get task IDs that user has commented on TODAY (using Set for O(1) lookup)
      const commentedTaskIdsToday = new Set(todayComments.documents.map((comment) => comment.taskId));

      // Find tasks without comments TODAY
      const uncommentedTasks = userTasks.documents.filter((task) => !commentedTaskIdsToday.has(task.$id));

      if (uncommentedTasks.length > 0) {
        return c.json(
          {
            error: 'Cannot checkout: Please comment on all your in-progress tasks (today) before checking out.',
            uncommentedTasks: uncommentedTasks.map((task) => ({
              id: task.$id,
              name: task.name,
            })),
          },
          400,
        );
      }
    }

    // Calculate total hours
    const checkInTime = new Date(attendanceRecord.checkInTime);
    const checkOutTime = new Date(now);
    const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Update status based on total hours
    let status = attendanceRecord.status;
    if (totalHours < 4) {
      status = 'half-day';
    }

    const updatedAttendance = await databases.updateDocument(
      DATABASE_ID,
      ATTENDANCE_ID,
      attendanceRecord.$id,
      {
        checkOutTime: now,
        checkOutLatitude,
        checkOutLongitude,
        checkOutAddress,
        totalHours,
        status,
        notes,
      }
    );

    // Log activity - only log changed fields
    const changedFields = getChangedFields(attendanceRecord, updatedAttendance);
    if (Object.keys(changedFields).length > 0) {
      const userInfo = getUserInfoForLogging(user);
      const oldValues: Record<string, unknown> = {};
      for (const key in changedFields) {
        oldValues[key] = attendanceRecord[key as keyof Attendance];
      }
      const metadata = getRequestMetadata(c);
      await logActivity({
        databases,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.ATTENDANCE,
        entityId: updatedAttendance.$id,
        workspaceId: attendanceRecord.workspaceId,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: {
          old: oldValues,
          new: changedFields,
        },
        metadata,
      });
    }

    return c.json(updatedAttendance);
  } catch (error) {
    console.error('Error checking out:', error);
    return c.json({ error: 'Failed to check out' }, 500);
  }
});

// Get today's attendance
app.get('/today', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId') || user.$id;

    if (!workspaceId) {
      return c.json({ error: 'Workspace ID is required' }, 400);
    }

    const today = new Date().toISOString().split('T')[0];

    // Validate parameters
    if (!workspaceId.trim()) {
      return c.json({ error: 'Invalid workspace ID' }, 400);
    }

    if (!userId || !userId.trim()) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    // Build queries array
    const queries = [
      Query.equal('workspaceId', workspaceId.trim()),
      Query.equal('userId', userId.trim()),
      Query.equal('date', today)
    ];

    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      queries
    );

    return c.json(response.documents[0] || null);
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    return c.json({ error: 'Failed to fetch today\'s attendance' }, 500);
  }
});

// Get attendance stats
app.get('/stats', async (c) => {
  try {
    const user = await getCurrent();
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId') || user.$id;

    if (!workspaceId) {
      return c.json({ error: 'Workspace ID is required' }, 400);
    }

    // Validate workspace ID
    if (!workspaceId.trim()) {
      return c.json({ error: 'Invalid workspace ID' }, 400);
    }

    // Validate userId
    if (!userId || !userId.trim()) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    // Build queries array
    const queries = [
      Query.equal('workspaceId', workspaceId.trim()),
      Query.equal('userId', userId.trim()),
      Query.limit(5000)
    ];

    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      queries
    );

    const attendanceRecords = response.documents as unknown as Attendance[];

    // Fetch special days
    // We need to know the start of the period. Ideally user CreatedAt or just start of time?
    // Let's assume stats are for "All time" if no date range provided?
    // Or maybe last 30 days default? The logic below implies we need a fixed start.
    // If we want "total absent days ever", we need the user's join date.

    // Fetch user join date (member created at)
    const membersResponse = await databases.listDocuments(
      DATABASE_ID, MEMBERS_ID,
      [Query.equal('workspaceId', workspaceId), Query.equal('userId', userId)]
    );

    let joinDate = new Date().toISOString();
    if (membersResponse.documents.length > 0) {
      joinDate = membersResponse.documents[0].$createdAt;
    }

    // Calculate stats
    const todayStr = getTodayDateString();

    // Fetch all special days from join date to today
    const specialDaysResponse = await databases.listDocuments<SpecialDay>(
      DATABASE_ID, SPECIAL_DAYS_ID,
      [
        Query.equal('workspaceId', workspaceId),
        Query.greaterThanEqual('date', joinDate.split('T')[0]), // approx
        Query.lessThanEqual('date', todayStr)
      ]
    );

    const specialDays = specialDaysResponse.documents;

    // Deduplicate attendance records - keep only one record per day (the latest one)
    const recordsByDate = new Map<string, Attendance>();
    for (const record of attendanceRecords) {
      const dateKey = record.date.split('T')[0]; // Extract YYYY-MM-DD
      const existing = recordsByDate.get(dateKey);

      // Keep the record with the latest update time or the one with checkout if available
      if (!existing ||
        (record.checkOutTime && !existing.checkOutTime) ||
        (record.$updatedAt > existing.$updatedAt)) {
        recordsByDate.set(dateKey, record);
      }
    }

    // Use deduplicated records for all calculations
    const uniqueAttendanceRecords = Array.from(recordsByDate.values());

    const totalWorkingDays = countWorkingDays(joinDate, todayStr, specialDays);

    const presentRecords = uniqueAttendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'half-day');
    const presentCount = uniqueAttendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = uniqueAttendanceRecords.filter(r => r.status === 'late').length;
    const halfDayCount = uniqueAttendanceRecords.filter(r => r.status === 'half-day').length;

    // Absent = Total Working Days - (All present types)
    // Note: This matches "if employee not mark attendance that day then the day would be count as absent"
    const totalAttended = presentCount + lateCount + halfDayCount;
    // Ensure absent days isn't negative (in case of data anomalies)
    const absentDays = Math.max(0, totalWorkingDays - totalAttended);

    // Calculate average hours only from records that have totalHours (completed check-outs)
    const recordsWithHours = uniqueAttendanceRecords.filter(r => r.totalHours && r.totalHours > 0);
    const totalHours = recordsWithHours.reduce((acc, r) => acc + (r.totalHours || 0), 0);
    const averageHours = recordsWithHours.length > 0 ? totalHours / recordsWithHours.length : 0;
    console.log('Unique records count:', uniqueAttendanceRecords.length);
    console.log('Records with hours:', recordsWithHours.length);
    console.log('Total hours:', totalHours);
    console.log('Average hours:', averageHours);
    const stats = {
      totalDays: attendanceRecords.length, // This is just records count, might want to rename or clarify
      presentDays: presentCount,
      absentDays: absentDays, // Calculated!
      lateDays: lateCount,
      averageHours: averageHours,
      currentStreak: 0, // This would need to be calculated based on consecutive days
    };

    return c.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return c.json({ error: 'Failed to fetch attendance stats' }, 500);
  }
})
  .get('/today/stats', async (c) => {
    try {
      const user = await getCurrent();
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { searchParams } = new URL(c.req.url);
      const workspaceId = searchParams.get('workspaceId');

      if (!workspaceId) {
        return c.json({ error: 'Workspace ID is required' }, 400);
      }

      if (!workspaceId.trim()) {
        return c.json({ error: 'Invalid workspace ID' }, 400);
      }

      const today = new Date().toISOString().split('T')[0];

      const { databases } = await createSessionClient();

      // Get all members in the workspace
      const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal('workspaceId', workspaceId.trim())
      ]);

      // Filter out inactive members (same logic as /team endpoint)
      const activeMembers = members.documents.filter((m: any) => m.isActive !== false);
      const memberIds = activeMembers.map((m) => m.userId);

      if (memberIds.length === 0) {
        return c.json({
          total: 0,
          present: 0,
          late: 0,
          checkedIn: 0
        });
      }

      // Get today's attendance for all members in the workspace
      const todayAttendance = await databases.listDocuments(
        DATABASE_ID,
        ATTENDANCE_ID,
        [
          Query.equal('workspaceId', workspaceId.trim()),
          Query.equal('date', today)
        ]
      );

      // Filter to only include members of this workspace
      const memberAttendance = todayAttendance.documents.filter((record) =>
        memberIds.includes(record.userId)
      );

      const present = memberAttendance.filter((r) => r.status === 'present').length;
      const late = memberAttendance.filter((r) => r.status === 'late').length;
      const checkedIn = memberAttendance.length;

      return c.json({
        total: memberIds.length,
        present,
        late,
        checkedIn
      });
    } catch (error) {
      console.error('Error fetching today\'s attendance stats:', error);
      return c.json({ error: 'Failed to fetch today\'s attendance stats' }, 500);
    }
  })
  .get('/team', async (c) => {
    try {
      const user = await getCurrent();
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { searchParams } = new URL(c.req.url);
      const workspaceId = searchParams.get('workspaceId');
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

      if (!workspaceId) {
        return c.json({ error: 'Workspace ID is required' }, 400);
      }

      if (!workspaceId.trim()) {
        return c.json({ error: 'Invalid workspace ID' }, 400);
      }

      // Check if user is admin
      const { databases } = await createSessionClient();
      const membersResponse = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [
          Query.equal('workspaceId', workspaceId.trim()),
          Query.equal('userId', user.$id)
        ]
      );

      if (membersResponse.documents.length === 0) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const member = membersResponse.documents[0];
      if (member.role !== 'ADMIN') {
        return c.json({ error: 'Unauthorized: Only admins can view team attendance' }, 403);
      }

      // Get all active members in the workspace (exclude inactive)
      const allMembersResponse = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [
          Query.equal('workspaceId', workspaceId.trim())
        ]
      );

      // Filter out inactive members
      const allMembers = allMembersResponse.documents.filter((m: any) => m.isActive !== false);

      const memberIds = allMembers.map((m: any) => m.userId);

      // Get attendance for the specified date for all members
      const attendanceResponse = await databases.listDocuments(
        DATABASE_ID,
        ATTENDANCE_ID,
        [
          Query.equal('workspaceId', workspaceId.trim()),
          Query.equal('date', date),
          Query.limit(1000)
        ]
      );

      // Populate members with user info
      const { users } = await createAdminClient();
      const populatedMembers = await Promise.all(
        allMembers.map(async (member: any) => {
          const user = await users.get(member.userId);
          // Only return safe, non-sensitive fields
          return {
            $id: member.$id,
            userId: member.userId,
            workspaceId: member.workspaceId,
            role: member.role,
            isActive: member.isActive,
            name: user.name,
            email: user.email,
          };
        })
      );

      // Create a map of userId -> attendance record
      const attendanceMap = new Map();
      attendanceResponse.documents.forEach((record) => {
        if (memberIds.includes(record.userId)) {
          attendanceMap.set(record.userId, record);
        }
      });

      // Combine members with their attendance records
      const teamAttendance = populatedMembers.map((member: any) => {
        const attendance = attendanceMap.get(member.userId) || null;
        return {
          member: {
            $id: member.$id,
            userId: member.userId,
            name: member.name,
            email: member.email,
            role: member.role,
          },
          attendance: attendance ? {
            $id: attendance.$id,
            date: attendance.date,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            checkInLatitude: attendance.checkInLatitude,
            checkInLongitude: attendance.checkInLongitude,
            checkInAddress: attendance.checkInAddress,
            checkOutLatitude: attendance.checkOutLatitude,
            checkOutLongitude: attendance.checkOutLongitude,
            checkOutAddress: attendance.checkOutAddress,
            totalHours: attendance.totalHours,
            status: attendance.status,
            notes: attendance.notes,
          } : null,
        };
      });

      return c.json(teamAttendance);
    } catch (error) {
      console.error('Error fetching team attendance:', error);
      return c.json({ error: 'Failed to fetch team attendance' }, 500);
    }
  });

export default app;
