# Usage Guide - Notification System & Task Management Features

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [In-App Notifications](#in-app-notifications)
3. [My Tasks Dashboard](#my-tasks-dashboard)
4. [Enhanced Activity Feed](#enhanced-activity-feed)
5. [Task Assignment Visibility](#task-assignment-visibility)

---

## Setup & Configuration

### Step 1: Appwrite Setup
1. Go to your Appwrite Console → Database → Collections
2. Create a new collection with ID: `notifications`
3. Add the required attributes (see main README or Appwrite setup instructions)
4. Set up indexes and permissions
5. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_ID=notifications
   ```

### Step 2: Restart Server
```bash
npm run dev
```

---

## In-App Notifications

### For End Users

#### Viewing Notifications
1. **Notification Bell**: Look for the bell icon (🔔) in the top-right header
2. **Unread Badge**: Red badge shows count of unread notifications
3. **Click Bell**: Opens dropdown with recent unread notifications

#### Notification Dropdown Features
- **View Recent**: Shows last 10 unread notifications
- **Mark All Read**: Button to mark all notifications as read
- **View Details**: Click any notification to go to the related task
- **Mark as Read**: Hover over notification → Click checkmark icon
- **Delete**: Hover over notification → Click X icon

#### Notification Center
1. Click "View all notifications" in dropdown
2. Or navigate to `/notifications` route
3. **Tabs**:
   - **Unread**: Shows only unread notifications
   - **All**: Shows all notifications (read + unread)
4. **Load More**: Pagination for viewing more notifications

### Automatic Notifications

You'll automatically receive notifications when:

1. **Task Assigned**: Someone assigns a task to you
   - Title: "New Task Assigned: [Task Name]"
   - Message: "[Person] assigned you a new task..."

2. **Task Updated**: Status of your assigned task changes
   - Title: "Task Status Updated: [Task Name]"
   - Message: "[Person] changed the status from [Old] to [New]"

3. **Task Commented**: Someone comments on your assigned task
   - Title: "New comment on: [Task Name]"
   - Message: "[Person] commented on [Task Name]"

4. **Mentioned in Comment**: Someone mentions you in a comment
   - Title: "You were mentioned in: [Task Name]"
   - Message: "[Person] mentioned you in a comment..."

### Notification Types
- 🔵 **TASK_ASSIGNED**: New task assigned to you
- 🔄 **TASK_UPDATED**: Task status or details changed
- 💬 **TASK_COMMENTED**: New comment on your task
- @ **TASK_MENTIONED**: You were mentioned in a comment

---

## My Tasks Dashboard

### Accessing My Tasks
1. Navigate to: `/workspaces/[workspaceId]/my-tasks`
2. Or use the sidebar navigation (if added)

### Features

#### Statistics Cards
View at-a-glance metrics:
- **Total Tasks**: All tasks assigned to you
- **Overdue**: Tasks past due date (highlighted in red)
- **Due Today**: Tasks due today
- **Due This Week**: Tasks due in next 7 days

#### Filter Tabs
- **Assigned to Me**: All your tasks
- **Due Today**: Tasks due today
- **Due This Week**: Tasks due in next 7 days
- **Overdue**: Past due tasks (excluding completed)
- **All**: All tasks (no filter)

#### View Options
- **Table View**: Detailed list with columns
- **Kanban View**: Visual board by status

#### Search & Filters
- **Search**: Search by task name
- **Status Filter**: Filter by task status (Backlog, Todo, In Progress, etc.)

#### Task Actions
- Click task name to view details
- Use action menu (⋯) for:
  - Edit task
  - Delete task
  - Change status

---

## Enhanced Activity Feed

### Accessing Activity Feed
1. Navigate to: `/workspaces/[workspaceId]/activity`
2. Only accessible to **Admin** users

### New Filter Options

#### Scope Filter (if enabled)
- **All Workspace**: All activity in workspace
- **My Tasks**: Activity on tasks assigned to you
- **My Projects**: Activity in your projects
- **Team Activity**: Activity by your team members

#### Existing Filters
- **Entity Type**: Filter by Task, Project, Member, etc.
- **Action**: Filter by Create, Update, Delete, etc.
- **User**: Filter by specific user
- **Project**: Filter by specific project
- **Date Range**: Filter by start/end date

### Pagination
- **Load More**: Button at bottom to load more activity logs
- Infinite scroll support for better UX

---

## Task Assignment Visibility

### Enhanced Task Cards

#### Kanban View
- **Assignee Avatars**: Shows up to 3 assignee avatars
- **+N Badge**: Shows count if more than 3 assignees
- **Unassigned Badge**: Clear "Unassigned" indicator for tasks without assignees
- **Due Date**: Displayed with task card

#### Table View
- **Assignee Column**: Shows assignee avatars and names
- **Unassigned Badge**: Clear indicator for unassigned tasks
- **Multiple Assignees**: Shows first assignee + count

#### Task Details
- **Assignees Section**: Full list of assignees
- **Assignment History**: (Future enhancement)

---

## Dashboard Widgets

### Task Summary Widgets
Located on the main workspace dashboard:

1. **Total Tasks Card**
   - Shows total tasks assigned to you
   - Displays completed count below

2. **Overdue Card** (Red highlight)
   - Shows overdue tasks count
   - Requires attention

3. **Due Today Card**
   - Shows tasks due today
   - Deadline today indicator

4. **Due This Week Card**
   - Shows tasks due in next 7 days
   - Upcoming deadlines

5. **View All Link**
   - Quick link to My Tasks page

---

## Best Practices

### For Team Members
1. **Check Notifications Regularly**: Bell icon shows unread count
2. **Use My Tasks Page**: Focus on your assigned work
3. **Filter by Due Date**: Prioritize overdue and due today
4. **Mark Notifications Read**: Keep notification center clean

### For Project Managers
1. **Assign Tasks Clearly**: Assignees get automatic notifications
2. **Update Task Status**: Team members are notified of changes
3. **Add Comments**: Keep team informed with task comments
4. **Monitor Activity Feed**: Track team activity

### For Admins
1. **Use Activity Feed**: Monitor workspace activity
2. **Filter by Scope**: Focus on specific areas
3. **Export Logs**: Use export feature for reporting

---

## Troubleshooting

### Notifications Not Showing
1. **Check Appwrite Setup**: Ensure collection is created
2. **Check Environment Variable**: `NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_ID` set
3. **Check Permissions**: User has read access to notifications
4. **Refresh Page**: Notifications refresh every 30 seconds

### Notification Count Wrong
1. **Wait 30 seconds**: Auto-refreshes every 30 seconds
2. **Click Bell**: Manually refreshes when opened
3. **Check Browser Console**: Look for errors

### My Tasks Not Loading
1. **Check Workspace Access**: Ensure you're a member
2. **Check Assignments**: You need assigned tasks to see them
3. **Try Different Filters**: Switch between filter tabs

### Activity Feed Empty
1. **Admin Only**: Only admins can access activity feed
2. **Check Filters**: Clear all filters to see all activity
3. **Check Date Range**: Ensure date range includes activity

---

## API Usage (For Developers)

### Creating Notifications Programmatically

```typescript
import { InAppNotificationService } from '@/features/notifications/server/notification-service';
import { NotificationType } from '@/features/notifications/types';

// In your server route
const notificationService = new InAppNotificationService(databases);

await notificationService.createNotification(
  userId, // User ID (from Appwrite Users)
  NotificationType.TASK_ASSIGNED,
  'Task Assigned',
  'You have been assigned a new task',
  '/workspaces/123/tasks/456', // Deep link
  { taskId: '456', projectId: '789' } // Metadata
);
```

### Using Notification Hooks

```typescript
// Get notifications
const { data, isLoading } = useGetNotifications({
  userId: user?.$id || '',
  read: false, // Only unread
  limit: 20,
  offset: 0,
});

// Get notification count
const { data: count } = useNotificationCount();

// Mark as read
const { mutate: markAsRead } = useMarkNotificationRead();
markAsRead(notificationId);

// Mark all as read
const { mutate: markAllRead } = useMarkAllRead();
markAllRead();

// Delete notification
const { mutate: deleteNotification } = useDeleteNotification();
deleteNotification(notificationId);
```

---

## Keyboard Shortcuts (Future Enhancement)
- `N` - Open notifications
- `M` - Go to My Tasks
- `A` - Go to Activity Feed

---

## Support

For issues or questions:
1. Check this guide first
2. Review `CODE_REVIEW_OPTIMIZATIONS.md` for technical details
3. Check browser console for errors
4. Verify Appwrite configuration

---

## Quick Reference

| Feature | Route | Access |
|---------|-------|--------|
| Notifications | `/notifications` | All users |
| My Tasks | `/workspaces/[id]/my-tasks` | All users |
| Activity Feed | `/workspaces/[id]/activity` | Admins only |
| Dashboard | `/workspaces/[id]` | All users |

---

**Last Updated**: After code review and optimizations
**Version**: 1.0.0

