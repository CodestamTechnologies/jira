import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrent } from '@/features/auth/queries';
import { NotificationCenter } from '@/features/notifications/components/notification-center';

export const dynamic = 'force-dynamic';

const NotificationsPage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
        <NotificationCenter />
      </Suspense>
    </div>
  );
};

export default NotificationsPage;
