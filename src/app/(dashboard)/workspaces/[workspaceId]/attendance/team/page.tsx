import { Suspense } from 'react';

import { TeamAttendanceClient } from './team-attendance-client';
import { PageLoader } from '@/components/page-loader';

export default function TeamAttendancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TeamAttendanceClient />
    </Suspense>
  );
}

