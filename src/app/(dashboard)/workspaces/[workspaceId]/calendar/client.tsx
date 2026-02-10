'use client';

import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { WorkCalendar } from '@/features/attendance/components/work-calendar';

export const CalendarClient = () => {
  const { data: isAdmin, isLoading } = useAdminStatus();

  if (isLoading) {
    return <PageLoader />;
  }

  // Everyone can view, only admins can edit (handled in component)
  if (isAdmin === undefined) {
    return <PageError message="Failed to load permissions" />;
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <WorkCalendar isAdmin={isAdmin} />
    </div>
  );
};
