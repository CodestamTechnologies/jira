'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { WorkspaceAvatar } from '@/features/workspaces/components/workspace-avatar';
import { useCreateWorkspaceModal } from '@/features/workspaces/hooks/use-create-workspace-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const WorkspaceSwitcher = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { open: openCreateWorkspaceModal } = useCreateWorkspaceModal();

  const { data: workspaces } = useGetWorkspaces();

  const onSelect = (id: string) => {
    router.push(`/workspaces/${id}`);
  };

  const handleCreateWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCreateWorkspaceModal();
  };

  return (
    <div className="flex flex-col gap-y-1">
      <Select onValueChange={onSelect} value={workspaceId}>
        <SelectTrigger className="h-8 w-full bg-muted/50 px-2 text-sm font-medium text-foreground hover:bg-muted">
          <SelectValue placeholder="No workspace selected" />
        </SelectTrigger>

        <SelectContent>
          {workspaces?.documents.map((workspace) => (
            <SelectItem key={workspace.$id} value={workspace.$id}>
              <div className="flex items-center justify-start gap-3 font-medium">
                <WorkspaceAvatar name={workspace.name} image={workspace.imageUrl} />

                <span className="truncate">{workspace.name}</span>
              </div>
            </SelectItem>
          ))}

          {workspaces?.documents && workspaces.documents.length > 0 && <SelectSeparator />}

          <button
            type="button"
            onClick={handleCreateWorkspace}
            className="relative flex w-full cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground min-h-[44px]"
            aria-label="Create new workspace"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-medium">Create workspace</span>
          </button>
        </SelectContent>
      </Select>
    </div>
  );
};
