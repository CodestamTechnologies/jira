import { Suspense } from 'react';

import { AttendanceCard } from '@/features/attendance/components/attendance-card';
import { MobileAttendanceCard } from '@/features/attendance/components/mobile-attendance-card';
import { AttendanceStats } from '@/features/attendance/components/attendance-stats';
import { AttendanceTable } from '@/features/attendance/components/attendance-table';
import { PageLoader } from '@/components/page-loader';

export default function AttendancePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track your daily attendance and view your history
          </p>
        </div>
      </div>

      <Suspense fallback={<PageLoader />}>
        {/* Attendance Card - Responsive */}
        <div className="flex justify-center">
          <div className="hidden md:block">
            <AttendanceCard />
          </div>
          <div className="md:hidden w-full max-w-sm">
            <MobileAttendanceCard />
          </div>
        </div>

        {/* Attendance Stats */}
        <AttendanceStats />

        {/* Attendance Table */}
        <AttendanceTable />
      </Suspense>
    </div>
  );
}
