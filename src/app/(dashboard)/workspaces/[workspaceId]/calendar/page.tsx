
import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';
import { CalendarClient } from './client';

const CalendarPage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return <CalendarClient />;
};

export default CalendarPage;
