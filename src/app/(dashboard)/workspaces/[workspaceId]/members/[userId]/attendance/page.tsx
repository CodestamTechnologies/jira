import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';
import { PageLoader } from '@/components/page-loader';
import { MemberAttendanceClient } from './member-attendance-client';
import type { MemberAttendancePageProps } from '../../../types';

const MemberAttendancePage = async ({ params }: MemberAttendancePageProps) => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return (
    <div className="space-y-6 p-6">
      <Suspense fallback={<PageLoader />}>
        <MemberAttendanceClient
          workspaceId={params.workspaceId}
          userId={params.userId}
        />
      </Suspense>
    </div>
  );
};

export default MemberAttendancePage;
