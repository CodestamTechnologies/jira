import { useRouter } from 'next/navigation';

import { MemberAvatar } from '@/features/members/components/member-avatar';
import type { Member } from '@/features/members/types';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import type { Project } from '@/features/projects/types';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

interface EventCardProps {
  title: string;
  assignee?: { $id: string; name: string; email?: string };
  assignees?: Array<{ $id: string; name: string; email?: string }>;
  project: Project;
  status: TaskStatus;
  id: string;
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'border-l-pink-500',
  [TaskStatus.TODO]: 'border-l-red-500',
  [TaskStatus.IN_PROGRESS]: 'border-l-yellow-500',
  [TaskStatus.IN_REVIEW]: 'border-l-blue-500',
  [TaskStatus.DONE]: 'border-l-emerald-500',
};

export const EventCard = ({ title, assignee, assignees, project, status, id }: EventCardProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };

  return (
    <div className="px-2">
      <button
        onClick={onClick}
        className={cn(
          'flex cursor-pointer flex-col gap-y-1.5 rounded-md border border-l-4 bg-card p-1.5 text-xs text-primary transition hover:opacity-75',
          statusColorMap[status],
        )}
      >
        <p>{title}</p>

        <div className="flex items-center gap-x-1">
          {assignees && assignees.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {assignees.slice(0, 2).map((a, index) => (
                <MemberAvatar key={a.$id} name={a.name} className={index > 0 ? '-ml-1' : ''} />
              ))}
              {assignees.length > 2 && (
                <div className="flex size-4 items-center justify-center rounded-full bg-muted text-[7px] font-medium text-muted-foreground">
                  +{assignees.length - 2}
                </div>
              )}
            </div>
          ) : assignee ? (
            <MemberAvatar name={assignee?.name} />
          ) : null}

          <div aria-hidden className="size-1 rounded-full bg-muted" />
          <ProjectAvatar name={project?.name} image={project?.imageUrl} />
        </div>
      </button>
    </div>
  );
};
