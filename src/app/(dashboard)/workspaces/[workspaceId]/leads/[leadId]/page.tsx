import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';

import { LeadIdClient } from './client';

const LeadIdPage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return <LeadIdClient />;
};

export default LeadIdPage;

