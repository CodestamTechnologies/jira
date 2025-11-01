import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Query } from 'node-appwrite';

import { createSessionClient } from '@/lib/appwrite';
import { ATTENDANCE_ID, DATABASE_ID, MEMBERS_ID } from '@/config/db';
import { createAttendanceSchema, updateAttendanceSchema, attendanceFiltersSchema } from '../schema';
import { getCurrent } from '@/features/auth/queries';
import { Attendance } from '../types';

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



    const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_ID,
      queries
    );

    return c.json(response.documents);
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

    return c.json(attendance);
  } catch (error) {
    console.error('Error checking in:', error);
    return c.json({ error: 'Failed to check in' }, 500);
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
        notes: notes || attendanceRecord.notes,
      }
    );

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

      const memberIds = members.documents.map((m) => m.userId);

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
  });

export default app;
