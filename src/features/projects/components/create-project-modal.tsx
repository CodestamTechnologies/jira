'use client';

import { ResponsiveModal } from '@/components/responsive-modal';
import { useCreateProjectModal } from '@/features/projects/hooks/use-create-project-modal';

import { CreateProjectForm } from './create-project-form';

export const CreateProjectModal = () => {
  const { isOpen, setIsOpen, close } = useCreateProjectModal();

  return (
    <ResponsiveModal
      title="Create Project"
      description="Get started by creating a new project."
      open={isOpen}
      onOpenChange={setIsOpen}
      contentClassName="z-[400]"
      overlayClassName="z-[400]"
    >
      <CreateProjectForm onCancel={close} />
    </ResponsiveModal>
  );
};
