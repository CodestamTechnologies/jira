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
import { createAttendanceSchema, updateAttendanceSchema, attendanceFiltersSchema } from '../schema';
import { getCurrent } from '@/features/auth/queries';
import { Attendance } from '../types';
import { getMember } from '@/features/members/utils';
import { TaskStatus } from '@/features/tasks/types';
import type { Task, Comment } from '@/features/tasks/types';

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
    queries.push(Query.orderDesc('date'));

    // Parse pagination parameters
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = limit ? parseInt(limit, 10) : 10;
    const offset = (pageNumber - 1) * pageSize;

    // Add pagination to queries
    queries.push(Query.limit(pageSize));
    queries.push(Query.offset(offset));

    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      queries
    );

    // Return paginated response with total count
    return c.json({
      documents: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return c.json({ error: 'Failed to fetch attendance' }, 500);
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

    console.log('Check-in query:', checkInQueries); // Debug log

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

    // Get all tasks assigned to user that are not DONE
    const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('workspaceId', workspaceId.trim()),
      Query.contains('assigneeIds', member.$id),
      Query.notEqual('status', TaskStatus.DONE),
    ]);

    // Get today's date range for comments (start and end of today in UTC)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Get comments by this user made TODAY
    const todayComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
      Query.equal('authorId', user.$id),
      Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
      Query.lessThanEqual('$createdAt', todayEnd.toISOString()),
    ]);

    // Get task IDs that user has commented on TODAY
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

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Find today's attendance record
    const { databases } = await createSessionClient();
    const checkOutQueries = [
      Query.equal('userId', user.$id),
      Query.equal('date', today)
    ];

    console.log('Check-out query:', checkOutQueries); // Debug log

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
      // Get all tasks assigned to user that are not DONE
      const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.equal('workspaceId', attendanceRecord.workspaceId),
        Query.contains('assigneeIds', member.$id),
        Query.notEqual('status', TaskStatus.DONE),
      ]);

      // Get today's date range for comments (start and end of today in UTC)
      const now = new Date();
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      // Get comments by this user made TODAY
      const todayComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
        Query.equal('authorId', user.$id),
        Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
        Query.lessThanEqual('$createdAt', todayEnd.toISOString()),
      ]);

      // Get task IDs that user has commented on TODAY
      const commentedTaskIdsToday = new Set(todayComments.documents.map((comment) => comment.taskId));

      // Find tasks without comments TODAY
      const uncommentedTasks = userTasks.documents.filter((task) => !commentedTaskIdsToday.has(task.$id));

      if (uncommentedTasks.length > 0) {
        return c.json(
          {
            error: 'Cannot checkout: Please comment on all your incomplete tasks (today) before checking out.',
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

    console.log('Today query:', queries); // Debug log

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
      Query.equal('userId', userId.trim())
    ];

    console.log('Stats query:', queries); // Debug log
    console.log('Database ID:', DATABASE_ID); // Debug log
    console.log('Attendance ID:', ATTENDANCE_ID); // Debug log

    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      queries
    );

    const attendanceRecords = response.documents;

    const stats = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter((r) => r.status === 'present').length,
      absentDays: 0, // This would need to be calculated based on business logic
      lateDays: attendanceRecords.filter((r) => r.status === 'late').length,
      averageHours: attendanceRecords.reduce((acc, r) => acc + (r.totalHours || 0), 0) / attendanceRecords.length || 0,
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
          Query.equal('date', date)
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
