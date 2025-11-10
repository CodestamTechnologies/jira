import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';

import { ProjectsPageClient } from './projects-page-client';

const ProjectsPage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return <ProjectsPageClient />;
};

export default ProjectsPage;


