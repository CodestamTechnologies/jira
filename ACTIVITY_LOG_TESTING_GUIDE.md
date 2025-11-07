# Activity Log Testing Guide

## Prerequisites

1. **Environment Variables**
   Add to your `.env.local`:
   ```env
   NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID=your_collection_id
   ```

2. **Appwrite Collection Setup**
   Create a collection in Appwrite with the following attributes:

   | Attribute | Type | Required | Description |
   |-----------|------|----------|-------------|
   | `action` | String | Yes | CREATE, UPDATE, or DELETE |
   | `entityType` | String | Yes | TASK, PROJECT, WORKSPACE, MEMBER, COMMENT, INVOICE, ATTENDANCE |
   | `entityId` | String | Yes | ID of the affected entity |
   | `workspaceId` | String | Yes | Workspace context |
   | `projectId` | String | No | Project context (if applicable) |
   | `userId` | String | Yes | User who performed the action |
   | `username` | String | Yes | Username for display |
   | `userEmail` | String | Yes | User email |
   | `environment` | String | No | 'development' or 'production' |
   | `changes` | String | Yes | JSON stringified field changes |
   | `metadata` | String | No | JSON stringified additional context |
   | `createdAt` | DateTime | Auto | Timestamp (auto-generated) |

3. **Indexes** (for performance):
   - `workspaceId`
   - `entityType`
   - `userId`
   - `createdAt`
   - `entityId`
   - `environment`
   - Composite: `workspaceId` + `createdAt`
   - Composite: `workspaceId` + `environment`

4. **Permissions**:
   - Create: Authenticated users
   - Read: Authenticated users (filtered by workspace membership)
   - Update: None (logs are immutable)
   - Delete: None (logs are immutable)

---

## Testing Steps

### 1. Test Automatic Logging

#### Test Task Creation
1. Navigate to your workspace
2. Create a new task
3. **Expected**: Activity log should be created with:
   - `action: CREATE`
   - `entityType: TASK`
   - `changes.new` containing the task data

**How to verify:**
- Go to Activity Log page (`/workspaces/[workspaceId]/activity`)
- You should see: "Your Name created task"
- Click "Show changes" to see the task data

#### Test Task Update
1. Edit an existing task (change name, status, assignee, etc.)
2. **Expected**: Activity log should be created with:
   - `action: UPDATE`
   - `entityType: TASK`
   - `changes.old` and `changes.new` showing only changed fields

**How to verify:**
- Check Activity Log page
- You should see: "Your Name updated task"
- Click "Show changes" to see what changed

#### Test Task Deletion
1. Delete a task
2. **Expected**: Activity log should be created with:
   - `action: DELETE`
   - `entityType: TASK`
   - `changes.old` containing the deleted task data

#### Test Project Operations
1. Create a project → Should log CREATE
2. Update project name/image → Should log UPDATE
3. Delete project → Should log DELETE

#### Test Workspace Operations
1. Create a workspace → Should log CREATE
2. Update workspace name/image → Should log UPDATE
3. Delete workspace → Should log DELETE

#### Test Member Operations
1. Update member info → Should log UPDATE
2. Change member role → Should log UPDATE
3. Change member status (active/inactive) → Should log UPDATE
4. Remove member → Should log DELETE

#### Test Comment Creation
1. Add a comment to a task
2. **Expected**: Activity log should be created with:
   - `action: CREATE`
   - `entityType: COMMENT`

---

### 2. Test Activity Log UI

#### Test Activity Feed
1. Navigate to `/workspaces/[workspaceId]/activity`
2. **Expected**:
   - See list of activity logs
   - Each log shows: user, action, entity type, timestamp
   - Color-coded badges (green=CREATE, blue=UPDATE, red=DELETE)
   - "Show changes" button for logs with changes

#### Test Expandable Changes
1. Click "Show changes" on any log entry
2. **Expected**:
   - Changes section expands
   - Shows old values (if UPDATE/DELETE)
   - Shows new values (if CREATE/UPDATE)
   - Formatted nicely

#### Test Empty State
1. Apply filters that return no results
2. **Expected**: Shows "No activity found" message

#### Test Loading State
1. Navigate to Activity Log page
2. **Expected**: Shows skeleton loaders while fetching

---

### 3. Test Filters

#### Test Entity Type Filter
1. Select "TASK" from Entity Type dropdown
2. **Expected**: Only shows task-related activities

#### Test Action Filter
1. Select "CREATE" from Action dropdown
2. **Expected**: Only shows creation activities

#### Test User Filter
1. Select a specific user from User dropdown
2. **Expected**: Only shows activities by that user

#### Test Project Filter
1. Select a project from Project dropdown
2. **Expected**: Only shows activities related to that project

#### Test Date Range Filter
1. Select a start date and end date
2. **Expected**: Only shows activities within that date range

#### Test Multiple Filters
1. Apply multiple filters simultaneously
2. **Expected**: Results match all applied filters

#### Test Clear Filters
1. Apply some filters
2. Click "Clear All"
3. **Expected**: All filters reset, showing all activities

---

### 4. Test Pagination

1. Ensure you have more than 50 activity logs
2. **Expected**:
   - Shows first 50 logs
   - "Next" button is enabled
   - Shows "Showing 1 - 50 of X"
3. Click "Next"
4. **Expected**:
   - Shows next 50 logs
   - "Previous" button is enabled
   - Shows "Showing 51 - 100 of X"

---

### 5. Test Export

#### Test CSV Export
1. Apply some filters (optional)
2. Click Export → "Export as CSV"
3. **Expected**:
   - CSV file downloads
   - Contains all filtered logs
   - Includes: Timestamp, User, Action, Entity Type, Entity ID, Changes

#### Test JSON Export
1. Click Export → "Export as JSON"
2. **Expected**:
   - JSON file downloads
   - Contains all filtered logs in JSON format
   - Properly formatted with indentation

---

### 6. Test Environment Separation

#### Test Development Environment
1. Set `NODE_ENV=development` or `NEXT_PUBLIC_APP_ENV=development`
2. Create some activities (tasks, projects, etc.)
3. **Expected**: 
   - Logs are tagged with `environment: 'development'`
   - Only development logs are visible

#### Test Production Environment
1. Set `NODE_ENV=production` (or don't set it, defaults to production)
2. Create some activities
3. **Expected**:
   - Logs are tagged with `environment: 'production'`
   - Only production logs are visible
   - Development logs are hidden

#### Test Environment Switching
1. Create logs in development
2. Switch to production
3. **Expected**: Development logs are not visible
4. Switch back to development
5. **Expected**: Development logs are visible again

---

### 7. Test Error Handling

#### Test Missing Collection ID
1. Remove `NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID` from env
2. Try to create a task
3. **Expected**: 
   - Task creation succeeds (logging doesn't break main operations)
   - Console warning: "Activity logging disabled: ACTIVITY_LOGS_ID not configured"

#### Test Invalid Filters
1. Try to access activity logs with invalid workspace
2. **Expected**: Returns 401 Unauthorized

---

### 8. Test Performance

#### Test Large Dataset
1. Create 100+ activities
2. Navigate to Activity Log page
3. **Expected**: 
   - Page loads quickly
   - Pagination works correctly
   - No performance issues

---

## Manual Testing Checklist

- [ ] Task CREATE logs correctly
- [ ] Task UPDATE logs correctly (only changed fields)
- [ ] Task DELETE logs correctly
- [ ] Project CREATE/UPDATE/DELETE logs correctly
- [ ] Workspace CREATE/UPDATE/DELETE logs correctly
- [ ] Member UPDATE/DELETE logs correctly
- [ ] Comment CREATE logs correctly
- [ ] Activity feed displays correctly
- [ ] Changes are expandable
- [ ] Entity type filter works
- [ ] Action filter works
- [ ] User filter works
- [ ] Project filter works
- [ ] Date range filter works
- [ ] Multiple filters work together
- [ ] Clear filters works
- [ ] Pagination works
- [ ] CSV export works
- [ ] JSON export works
- [ ] Environment separation works (dev vs prod)
- [ ] Empty state displays
- [ ] Loading state displays
- [ ] Error handling works (missing collection ID)
- [ ] Navigation link works

---

## Quick Test Script

Run this in your browser console on the Activity Log page to verify data:

```javascript
// Check if logs are being fetched
fetch('/api/activity-logs?workspaceId=YOUR_WORKSPACE_ID&limit=10')
  .then(r => r.json())
  .then(data => {
    console.log('Activity Logs:', data);
    console.log('Total:', data.data?.total);
    console.log('First log:', data.data?.documents[0]);
  });
```

---

## Common Issues & Solutions

### Issue: No logs appearing
**Solution**: 
- Check `NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID` is set
- Verify collection exists in Appwrite
- Check environment matches (dev vs prod)
- Check workspace ID is correct

### Issue: Logs from wrong environment showing
**Solution**:
- Verify `NODE_ENV` or `NEXT_PUBLIC_APP_ENV` is set correctly
- Check that logs have `environment` field set
- Old logs without environment default to 'production'

### Issue: Changes not showing
**Solution**:
- Verify `changes` field contains valid JSON string
- Check browser console for parsing errors
- Ensure `parseActivityChanges` is working

### Issue: Export not working
**Solution**:
- Check browser allows downloads
- Verify export endpoint returns data
- Check browser console for errors

---

## Automated Testing (Future)

For automated testing, you could add:

1. **Unit Tests**: Test utility functions
   - `getChangedFields()`
   - `parseActivityChanges()`
   - `getUserInfoForLogging()`

2. **Integration Tests**: Test API routes
   - Test logging on mutations
   - Test filtering
   - Test environment separation

3. **E2E Tests**: Test UI
   - Test activity feed display
   - Test filters
   - Test export

---

## Next Steps After Testing

1. ✅ Verify all functionality works
2. ✅ Check performance with large datasets
3. ✅ Test in both dev and prod environments
4. ✅ Verify data integrity
5. ✅ Test with multiple users/workspaces
6. ✅ Monitor error logs

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for activity log errors
3. Verify Appwrite collection setup
4. Verify environment variables
5. Check network tab for API calls
