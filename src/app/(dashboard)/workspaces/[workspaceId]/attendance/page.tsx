import { Suspense } from 'react';

import { AttendanceCard } from '@/features/attendance/components/attendance-card';
import { MobileAttendanceCard } from '@/features/attendance/components/mobile-attendance-card';
import { AttendanceStats } from '@/features/attendance/components/attendance-stats';
import { AttendanceTable } from '@/features/attendance/components/attendance-table';
import { PageLoader } from '@/components/page-loader';

export default function AttendancePage() {
  return (
    <div className="space-y-6">
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
