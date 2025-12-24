import { redirect } from 'next/navigation';
import { getCurrent } from '@/features/auth/queries';
import { MyTasksView } from '@/features/tasks/components/my-tasks-view';

const MyTasksPage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return (
    <div className="flex h-full flex-col">
      <MyTasksView />
    </div>
  );
};

export default MyTasksPage;

