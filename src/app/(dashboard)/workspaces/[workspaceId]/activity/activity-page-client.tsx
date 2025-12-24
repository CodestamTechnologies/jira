'use client';

import { Clock } from 'lucide-react';
import { useState } from 'react';

import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLogTable } from '@/features/activity-logs/components/activity-log-table';
import { createActivityLogColumns } from '@/features/activity-logs/components/activity-log-columns';
import { ActivityLogExport } from '@/features/activity-logs/components/activity-log-export';
import { ActivityLogFilters } from '@/features/activity-logs/components/activity-log-filters';
import { useGetActivityLogs } from '@/features/activity-logs/api/use-get-activity-logs';
import { ActivityAction, ActivityEntityType, type ActivityLog } from '@/features/activity-logs/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { Separator } from '@/components/ui/separator';
import { ActivityLogDetailsDialog } from '@/features/activity-logs/components/activity-log-details-dialog';
import { useAdminRedirect } from '@/features/attendance/hooks/use-admin-redirect';

export const ActivityLogPageClient = () => {
  const workspaceId = useWorkspaceId();
  const { isAdminLoading } = useAdminRedirect(`/workspaces/${workspaceId}`);

  const [filters, setFilters] = useState<{
    entityType?: ActivityEntityType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    action?: ActivityAction;
    projectId?: string;
  }>({});
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const limit = 10000; // Large limit for table pagination (client-side pagination)

  const { data, isLoading, error } = useGetActivityLogs({
    workspaceId,
    ...filters,
    limit,
    offset: 0,
  });

  if (isAdminLoading) {
    return <PageLoader />;
  }

  const logs = data?.data?.documents || [];
  const total = data?.data?.total || 0;

  const columns = createActivityLogColumns({
    onViewDetails: (log) => {
      setSelectedLog(log);
      setIsDetailsDialogOpen(true);
    },
  });

  if (error) {
    return <PageError message="Failed to load activity logs." />;
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Activity Log
          </h1>
          <p className="text-muted-foreground">
            Track all changes and activities in your workspace
          </p>
        </div>
        <ActivityLogExport workspaceId={workspaceId} filters={filters} />
      </div>

      {/* Filters */}
      <ActivityLogFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
        }}
      />

      {/* Activity Feed */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                Activity Feed
              </CardTitle>
              <CardDescription className="mt-1.5">
                {total > 0 ? (
                  <span>
                    <span className="font-semibold text-foreground">{total}</span> activity log{total === 1 ? '' : 's'} found
                  </span>
                ) : (
                  'No activity logs'
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <ActivityLogTable
            data={logs}
            columns={columns}
            isLoading={isLoading}
            onViewDetails={(log) => {
              setSelectedLog(log);
              setIsDetailsDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <ActivityLogDetailsDialog
        log={selectedLog}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
};
