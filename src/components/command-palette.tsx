'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Settings,
  UsersIcon,
  Clock,
  Home,
  CheckSquare,
  FolderKanban,
  Building2,
  FileText,
  User,
  Circle,
  CircleCheck,
  Loader2,
  Eye,
} from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces'
import { useGetProjects } from '@/features/projects/api/use-get-projects'
import { useGetTasks } from '@/features/tasks/api/use-get-tasks'
import { useGetMembers } from '@/features/members/api/use-get-members'
import { TaskStatus } from '@/features/tasks/types'
import { MemberRole } from '@/features/members/types'
import { cn } from '@/lib/utils'

const navigationRoutes = [
  {
    label: 'Home',
    href: '',
    icon: Home,
  },
  {
    label: 'My Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: Clock,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'Members',
    href: '/members',
    icon: UsersIcon,
  },
]

const getTaskStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.BACKLOG:
      return Circle
    case TaskStatus.TODO:
      return Circle
    case TaskStatus.IN_PROGRESS:
      return Loader2
    case TaskStatus.IN_REVIEW:
      return Eye
    case TaskStatus.DONE:
      return CircleCheck
    default:
      return FileText
  }
}

const getTaskStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.BACKLOG:
      return 'text-muted-foreground'
    case TaskStatus.TODO:
      return 'text-blue-500'
    case TaskStatus.IN_PROGRESS:
      return 'text-yellow-500'
    case TaskStatus.IN_REVIEW:
      return 'text-purple-500'
    case TaskStatus.DONE:
      return 'text-green-500'
    default:
      return 'text-muted-foreground'
  }
}

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = useWorkspaceId()
  const { data: workspaces } = useGetWorkspaces()
  const { data: projects } = useGetProjects({ workspaceId })
  const { data: tasksData } = useGetTasks({
    workspaceId,
    search: null,
  })
  const { data: membersData } = useGetMembers({ workspaceId })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const tasks = (tasksData?.documents || []).slice(0, 50)
  // Filter out inactive members from command palette
  const members = (membersData?.documents || []).filter(m => m.isActive !== false).slice(0, 50)

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette" description="Search for pages, tasks, members, and navigate quickly">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationRoutes.map((route) => {
            const fullHref = `/workspaces/${workspaceId}${route.href}`
            const Icon = route.icon
            return (
              <CommandItem key={fullHref} value={route.label} onSelect={() => handleSelect(fullHref)}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{route.label}</span>
                {pathname === fullHref && (
                  <CommandShortcut>Current</CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.map((task) => {
                const href = `/workspaces/${workspaceId}/tasks/${task.$id}`
                const StatusIcon = getTaskStatusIcon(task.status)
                const statusColor = getTaskStatusColor(task.status)
                const searchText = `${task.name} ${task.description || ''} ${task.project?.name || ''} ${task.assignees?.map(a => a.name).join(' ') || ''}`
                return (
                  <CommandItem
                    key={task.$id}
                    value={searchText}
                    onSelect={() => handleSelect(href)}
                  >
                    <StatusIcon className={cn('mr-2 h-4 w-4', statusColor)} />
                    <div className="flex flex-col">
                      <span>{task.name}</span>
                      {(task.project?.name || task.assignees?.length) && (
                        <span className="text-xs text-muted-foreground">
                          {task.project?.name}
                          {task.assignees && task.assignees.length > 0 && (
                            <> • {task.assignees.map((a) => a.name).join(', ')}</>
                          )}
                        </span>
                      )}
                    </div>
                    {pathname === href && (
                      <CommandShortcut>Current</CommandShortcut>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {members.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Members">
              {members.map((member) => {
                const searchText = `${member.name} ${member.email}`
                return (
                  <CommandItem
                    key={member.$id}
                    value={searchText}
                    onSelect={() => handleSelect(`/workspaces/${workspaceId}/members`)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                    {member.role === MemberRole.ADMIN && (
                      <CommandShortcut>Admin</CommandShortcut>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {projects && projects.documents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.documents.map((project) => {
                const href = `/workspaces/${workspaceId}/projects/${project.$id}`
                return (
                  <CommandItem key={project.$id} value={project.name} onSelect={() => handleSelect(href)}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span>{project.name}</span>
                    {pathname === href && (
                      <CommandShortcut>Current</CommandShortcut>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {workspaces && workspaces.documents.length > 1 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch Workspace">
              {workspaces.documents.map((workspace) => {
                const href = `/workspaces/${workspace.$id}`
                return (
                  <CommandItem
                    key={workspace.$id}
                    value={workspace.name}
                    onSelect={() => handleSelect(href)}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{workspace.name}</span>
                    {workspace.$id === workspaceId && (
                      <CommandShortcut>Current</CommandShortcut>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
