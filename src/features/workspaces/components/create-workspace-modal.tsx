'use client';

import { ResponsiveModal } from '@/components/responsive-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateWorkspaceModal } from '@/features/workspaces/hooks/use-create-workspace-modal';

import { CreateWorkspaceForm } from './create-workspace-form';
import { JoinWorkspaceForm } from './join-workspace-form';

export const CreateWorkspaceModal = () => {
  const { isOpen, setIsOpen, close } = useCreateWorkspaceModal();

  return (
    <ResponsiveModal
      title="Workspace"
      description="Create a new workspace or join an existing one."
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Tabs defaultValue="create">
        <TabsList aria-label="Workspace actions">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="join">Join</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateWorkspaceForm onCancel={close} />
        </TabsContent>

        <TabsContent value="join">
          <JoinWorkspaceForm onCancel={close} />
        </TabsContent>
      </Tabs>
    </ResponsiveModal>
  );
};
