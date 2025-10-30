import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form';
import { JoinWorkspaceForm } from '@/features/workspaces/components/join-workspace-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WorkspaceCreatePage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  return (
    <div className="w-full lg:max-w-xl">
      <Tabs defaultValue="create">
        <TabsList aria-label="Workspace actions">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="join">Join</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateWorkspaceForm />
        </TabsContent>

        <TabsContent value="join">
          <JoinWorkspaceForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default WorkspaceCreatePage;
