'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityLogItem } from './activity-log-item';
import type { ActivityLog } from '../types';

interface ActivityFeedProps {
  logs: ActivityLog[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const ActivityFeed = ({ logs, isLoading, hasMore, onLoadMore, isLoadingMore }: ActivityFeedProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="size-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No activity found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          There are no activity logs matching your current filters. Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <ActivityLogItem key={log.$id} log={log} />
      ))}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
