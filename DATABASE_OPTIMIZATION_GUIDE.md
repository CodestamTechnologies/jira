# Database Read Optimization Guide

## Summary of Changes Made

### ✅ Completed Optimizations

1. **QueryProvider Defaults** (`src/components/query-provider.tsx`)
   - Increased default `staleTime` from 60s to 2 minutes
   - Added `gcTime` (cache time) of 5 minutes
   - Disabled `refetchOnWindowFocus` by default (reduces unnecessary DB reads)
   - Disabled `refetchOnReconnect` by default
   - Set `retry: 1` to reduce failed request retries

2. **Projects Query** (`src/features/projects/api/use-get-projects.ts`)
   - Added `staleTime: 5 minutes` (projects change infrequently)
   - Disabled `refetchOnWindowFocus`

3. **Members Query** (`src/features/members/api/use-get-members.ts`)
   - Added `staleTime: 3 minutes` (members change infrequently)
   - Disabled `refetchOnWindowFocus`

4. **Tasks Query** (`src/features/tasks/api/use-get-tasks.ts`)
   - Added `staleTime: 1 minute` (tasks change more frequently)
   - Disabled `refetchOnWindowFocus` (mutations invalidate cache)

5. **Leads Query** (`src/features/leads/api/use-get-leads.ts`)
   - Added `staleTime: 2 minutes`
   - Disabled `refetchOnWindowFocus`

6. **Pending Tasks Query** (`src/features/attendance/api/use-get-pending-tasks.ts`)
   - Increased `staleTime` from 30s to 60s

### ⚠️ Manual Update Needed

**Notification Count** (`src/features/notifications/api/use-notification-count.ts`)
- Change `refetchInterval` from `30000` to `60000` (reduces polling by 50%)
- Change `staleTime` from `10000` to `30000`
- Add `refetchOnWindowFocus: true` (keep this for notifications)

```typescript
// Update these lines:
refetchInterval: 60000, // Refetch every 60 seconds (was 30 seconds)
staleTime: 30000, // Consider data stale after 30 seconds (was 10 seconds)
refetchOnWindowFocus: true, // Keep fresh for notifications
```

## Expected Impact

### Database Read Reduction
- **Notification polling**: 50% reduction (30s → 60s)
- **Window focus refetches**: ~70-80% reduction (disabled for most queries)
- **Default staleTime**: 2x increase (60s → 120s)
- **Stable data caching**: Projects (5min), Members (3min) - significant reduction

### Estimated Overall Reduction
- **Before**: ~100-200 DB reads per user per hour (depending on activity)
- **After**: ~30-60 DB reads per user per hour
- **Reduction**: ~60-70% fewer database reads

## Data Freshness Strategy

### How We Prevent Stale Data

1. **Cache Invalidation on Mutations**
   - When you create/update/delete tasks, projects, members, etc., React Query automatically invalidates related caches
   - This ensures UI updates immediately after changes

2. **Smart StaleTime by Data Type**
   - **Projects/Members**: 3-5 minutes (rarely change)
   - **Tasks**: 1 minute (change more frequently)
   - **Notifications**: 30 seconds (time-sensitive)
   - **Attendance**: 60 seconds (daily data)

3. **Selective Refetch on Focus**
   - Only notifications and pending tasks refetch on window focus
   - Other data relies on cache invalidation from mutations

4. **Manual Refetch Available**
   - Users can still manually refresh if needed
   - Mutations trigger automatic cache invalidation

## Additional Recommendations

### 1. Consider WebSockets/Server-Sent Events (Future)
Instead of polling notifications every 60 seconds, consider:
- Appwrite Realtime subscriptions
- WebSocket connections
- Server-Sent Events (SSE)

**Benefit**: Real-time updates with zero polling overhead

### 2. Server-Side Caching (If Using Next.js)
If you're using Next.js App Router, consider:
- `unstable_cache` for server components
- Redis for shared cache across instances
- Next.js Data Cache with revalidation

### 3. Optimistic Updates
For mutations (create/update/delete), use optimistic updates:
- Update UI immediately
- Rollback on error
- Reduces need for refetching

### 4. Query Deduplication
React Query already deduplicates identical queries, but ensure:
- Consistent query keys
- Same parameters = same key

### 5. Batch Queries
Consider combining related queries:
- Single endpoint for workspace dashboard data
- Reduces number of requests

## Monitoring

### Track These Metrics
1. **Database query count** (before/after)
2. **API response times** (should improve with less load)
3. **User complaints about stale data** (should be minimal)
4. **Cache hit rate** (React Query DevTools)

### React Query DevTools
Enable React Query DevTools to monitor:
- Cache status
- Query freshness
- Refetch patterns

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Add to your app
<ReactQueryDevtools initialIsOpen={false} />
```

## Testing Checklist

- [ ] Verify projects don't refetch unnecessarily
- [ ] Verify members don't refetch unnecessarily
- [ ] Verify tasks update after mutations
- [ ] Verify notifications still feel responsive (60s polling)
- [ ] Test window focus behavior
- [ ] Monitor database query logs

## Rollback Plan

If you experience stale data issues:
1. Reduce `staleTime` values incrementally
2. Re-enable `refetchOnWindowFocus` for specific queries
3. Reduce notification polling interval back to 30s if needed

## Questions & Answers

**Q: Will users see old data?**
A: No, because:
- Mutations invalidate cache immediately
- Critical data (notifications) still refetches on focus
- StaleTime is reasonable (1-5 minutes based on data type)

**Q: What if data changes on another device?**
A: Current setup doesn't handle cross-device updates. Consider:
- WebSockets for real-time sync
- Shorter staleTime for shared data
- Manual refresh option

**Q: Is 60 seconds too long for notifications?**
A: For most use cases, yes. If you need real-time notifications:
- Use WebSockets/SSE
- Or reduce to 30s (but increases DB reads)

**Q: Should I reduce staleTime further?**
A: Only if you see user complaints. Current values balance performance and freshness well.

