import { parseAsBoolean, parseAsStringEnum, parseAsString, useQueryStates } from 'nuqs';

import { TaskStatus } from '@/features/tasks/types';

export const useCreateTaskModal = () => {
  const [{ isOpen, initialStatus, initialProjectId }, setTaskModal] = useQueryStates({
    isOpen: parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }),
    initialStatus: parseAsStringEnum(Object.values(TaskStatus)),
    initialProjectId: parseAsString,
  });
  const open = (initialStatus?: TaskStatus, initialProjectId?: string) =>
    setTaskModal({
      isOpen: true,
      initialStatus: initialStatus ?? null,
      initialProjectId: initialProjectId ?? null
    });
  const close = () => setTaskModal({
    isOpen: false,
    initialStatus: null,
    initialProjectId: null
  });

  return {
    isOpen,
    initialStatus,
    initialProjectId,
    setTaskModal,
    open,
    close,
  };
};
