'use client'

import { formatDistanceToNow } from 'date-fns'
import { Briefcase, CalendarIcon, CheckCircle, Clock, ListChecks, Users, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DottedSeparator } from '@/components/dotted-separator'
import { useGetAttendanceStats } from '@/features/attendance/api/use-get-attendance-stats'
import { MemberAvatar } from '@/features/members/components/member-avatar'
import type { Member } from '@/features/members/types'
import { ProjectAvatar } from '@/features/projects/components/project-avatar'
import type { Project } from '@/features/projects/types'
import { TaskStatus } from '@/features/tasks/types'
import type { Task } from '@/features/tasks/types'
import { useCurrent } from '@/features/auth/api/use-current'
import type { MyMemberDetailsProps } from '../types'

export const MyMemberDetails = ({ member, tasks, leads, projects, attendance, workspaceId, totalTasks }: MyMemberDetailsProps) => {
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false)
  const router = useRouter()
  const { data: user } = useCurrent()

  // Fetch attendance stats for the member
  const { data: attendanceStats } = useGetAttendanceStats(workspaceId, user?.$id)

  // Calculate current member's statistics
  const stats = useMemo(() => {
    const memberStats = {
      tasks: { total: totalTasks ?? 0, todo: 0, inProgress: 0, done: 0, backlog: 0, inReview: 0, pending: 0, completed: 0 },
      leads: 0,
      projects: new Set<string>(),
    }

    // Calculate task counts by status from the tasks array
    // Note: We use totalTasks for the total count (which may be paginated), but calculate status breakdowns from available tasks
    // This ensures accurate status counts even if tasks array is paginated
    tasks.forEach((task) => {
      // Safety check - log warning but still process if assigneeIds exist
      if (!task.assigneeIds || !Array.isArray(task.assigneeIds)) {
        console.warn('[MyMemberDetails] Task missing assigneeIds:', task.$id, task.name)
        // Still process it if it was passed to us (trust the filter)
      } else if (!task.assigneeIds.includes(member.$id)) {
        console.warn('[MyMemberDetails] Task not assigned to member:', task.$id, 'assigneeIds:', task.assigneeIds, 'memberId:', member.$id)
        // Still process it if it was passed to us (trust the filter)
      }

      // Count by status
      switch (task.status) {
        case TaskStatus.TODO:
          memberStats.tasks.todo += 1
          memberStats.tasks.pending += 1
          break
        case TaskStatus.IN_PROGRESS:
          memberStats.tasks.inProgress += 1
          memberStats.tasks.pending += 1
          break
        case TaskStatus.DONE:
          memberStats.tasks.done += 1
          memberStats.tasks.completed += 1
          break
        case TaskStatus.BACKLOG:
          memberStats.tasks.backlog += 1
          memberStats.tasks.pending += 1
          break
        case TaskStatus.IN_REVIEW:
          memberStats.tasks.inReview += 1
          memberStats.tasks.pending += 1
          break
        default:
          // Unknown status - count as pending
          memberStats.tasks.pending += 1
          console.warn('[MyMemberDetails] Unknown task status:', task.status, 'for task:', task.$id)
      }
      memberStats.projects.add(task.projectId)
    })

    // Calculate lead counts - filter leads assigned to this member
    const myLeads = leads.filter((lead) => {
      if (!lead.assigneeIds || !Array.isArray(lead.assigneeIds)) return false
      return lead.assigneeIds.includes(member.$id)
    })

    // Calculate lead statistics
    const leadStats = {
      total: myLeads.length,
      closed: myLeads.filter((lead) => lead.status === 'closed_won' || lead.status === 'closed_lost').length,
      new: myLeads.filter((lead) => lead.status === 'new').length,
      inProgress: myLeads.filter((lead) =>
        lead.status === 'contacted' ||
        lead.status === 'qualified' ||
        lead.status === 'proposal' ||
        lead.status === 'negotiation'
      ).length,
    }

    // Calculate project statistics
    // Projects where member has tasks
    const myProjects = projects.filter((project) => memberStats.projects.has(project.$id))

    // Count tasks per project for statistics
    const projectTaskMap = new Map<string, { total: number; pending: number; completed: number }>()

    tasks.forEach((task) => {
      if (!projectTaskMap.has(task.projectId)) {
        projectTaskMap.set(task.projectId, { total: 0, pending: 0, completed: 0 })
      }
      const projectStats = projectTaskMap.get(task.projectId)!
      projectStats.total += 1

      if (task.status === TaskStatus.DONE) {
        projectStats.completed += 1
      } else {
        projectStats.pending += 1
      }
    })

    // Calculate project stats
    const projectStats = {
      total: myProjects.length,
      withTasks: myProjects.filter((project) => {
        const stats = projectTaskMap.get(project.$id)
        return stats && stats.total > 0
      }).length,
      withPendingTasks: myProjects.filter((project) => {
        const stats = projectTaskMap.get(project.$id)
        return stats && stats.pending > 0
      }).length,
      withCompletedTasks: myProjects.filter((project) => {
        const stats = projectTaskMap.get(project.$id)
        return stats && stats.completed > 0
      }).length,
    }

    return {
      ...memberStats,
      leads: leadStats.total,
      leadStats,
      projects: memberStats.projects.size,
      projectStats,
    }
  }, [member.$id, tasks, leads, projects, totalTasks])

  const getAttendanceStatusBadge = () => {
    if (!attendance || !attendance.status) {
      return <Badge variant="secondary" className="text-xs">Not checked in</Badge>
    }

    const status = attendance.status.toLowerCase()
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 text-xs">Present</Badge>
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 text-xs">Absent</Badge>
      case 'half-day':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Half Day</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{attendance.status}</Badge>
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return null
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-blue-100 text-blue-800'
      case TaskStatus.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800'
      case TaskStatus.IN_REVIEW:
        return 'bg-orange-100 text-orange-800'
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-800'
      case TaskStatus.BACKLOG:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <MemberAvatar name={member.name} className="size-16 shrink-0" fallbackClassName="text-lg" />
          <div>
            <h2 className="text-2xl font-semibold">{member.name}</h2>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            {member.position && (
              <p className="text-xs text-muted-foreground mt-1">{member.position}</p>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/workspaces/${workspaceId}/members/${member.userId}`}>
            View Profile
          </Link>
        </Button>
      </div>

      <DottedSeparator className="my-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Card - Clickable */}
        <Card
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => router.push(`/workspaces/${workspaceId}/attendance`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attendance</span>
              </div>
              {getAttendanceStatusBadge()}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{attendanceStats?.totalDays ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total days</p>
            </div>

            {/* Main Stats - Present and Absent */}
            <div className="grid grid-cols-2 gap-3 mt-4 p-2 bg-muted/50 rounded-md">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{attendanceStats?.presentDays ?? 0}</div>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{attendanceStats?.absentDays ?? 0}</div>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {attendanceStats && (attendanceStats.lateDays > 0 || attendanceStats.totalDays > 0) && (
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {attendanceStats.lateDays > 0 && (
                  <div>
                    <span className="font-medium text-yellow-600">{attendanceStats.lateDays}</span>
                    <span className="text-muted-foreground ml-1">Late</span>
                  </div>
                )}
                {attendanceStats.averageHours > 0 && (
                  <div>
                    <span className="font-medium text-blue-600">{attendanceStats.averageHours.toFixed(1)}h</span>
                    <span className="text-muted-foreground ml-1">Avg Hours</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Card - Clickable */}
        <Card
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => router.push(`/workspaces/${workspaceId}/tasks`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tasks</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.tasks.total}</div>
              <p className="text-xs text-muted-foreground">Total assigned</p>
            </div>

            {/* Main Stats - Pending and Completed */}
            <div className="grid grid-cols-2 gap-3 mt-4 p-2 bg-muted/50 rounded-md">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{stats.tasks.pending}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.tasks.completed}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              {stats.tasks.todo > 0 && (
                <div>
                  <span className="font-medium text-blue-600">{stats.tasks.todo}</span>
                  <span className="text-muted-foreground ml-1">Todo</span>
                </div>
              )}
              {stats.tasks.inProgress > 0 && (
                <div>
                  <span className="font-medium text-purple-600">{stats.tasks.inProgress}</span>
                  <span className="text-muted-foreground ml-1">In Progress</span>
                </div>
              )}
              {stats.tasks.inReview > 0 && (
                <div>
                  <span className="font-medium text-orange-600">{stats.tasks.inReview}</span>
                  <span className="text-muted-foreground ml-1">In Review</span>
                </div>
              )}
              {stats.tasks.backlog > 0 && (
                <div>
                  <span className="font-medium text-gray-600">{stats.tasks.backlog}</span>
                  <span className="text-muted-foreground ml-1">Backlog</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads Card - Clickable */}
        <Card
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => router.push(`/workspaces/${workspaceId}/leads`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Leads</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.leads}</div>
              <p className="text-xs text-muted-foreground">Total leads</p>
            </div>

            {/* Main Stats - Closed and New */}
            <div className="grid grid-cols-2 gap-3 mt-4 p-2 bg-muted/50 rounded-md">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.leadStats.closed}</div>
                <p className="text-xs text-muted-foreground">Closed</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.leadStats.new}</div>
                <p className="text-xs text-muted-foreground">New</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {stats.leadStats.inProgress > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <span className="font-medium text-purple-600">{stats.leadStats.inProgress}</span>
                  <span className="text-muted-foreground ml-1">In Progress</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Card - Clickable */}
        <Card
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => router.push(`/workspaces/${workspaceId}/projects`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Projects</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.projects}</div>
              <p className="text-xs text-muted-foreground">Total projects</p>
            </div>

            {/* Main Stats - With Tasks and With Pending */}
            <div className="grid grid-cols-2 gap-3 mt-4 p-2 bg-muted/50 rounded-md">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.projectStats.withTasks}</div>
                <p className="text-xs text-muted-foreground">With Tasks</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{stats.projectStats.withPendingTasks}</div>
                <p className="text-xs text-muted-foreground">With Pending</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {stats.projectStats.withCompletedTasks > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <span className="font-medium text-green-600">{stats.projectStats.withCompletedTasks}</span>
                  <span className="text-muted-foreground ml-1">Completed</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks Dialog */}
      <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>My Tasks ({totalTasks ?? tasks.length})</DialogTitle>
            <DialogDescription>
              All tasks assigned to you
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-6 min-h-0  ">
            <div className="flex flex-col space-y-3 space-y-3 pr-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks assigned to you</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const project = projects.find((p) => p.$id === task.projectId)

                  return (
                    <Link
                      key={task.$id}
                      href={`/workspaces/${workspaceId}/tasks/${task.$id}`}
                      onClick={() => setTasksDialogOpen(false)}
                    >
                      <Card className="transition hover:shadow-md cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-sm line-clamp-2">{task.name}</h3>
                                <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                {project && (
                                  <div className="flex items-center gap-1.5">
                                    <ProjectAvatar
                                      name={project.name}
                                      image={project.imageUrl}
                                      className="size-4"
                                      fallbackClassName="text-[8px]"
                                    />
                                    <span className="truncate">{project.name}</span>
                                  </div>
                                )}

                                {task.dueDate && (
                                  <>
                                    <div aria-hidden className="size-1 rounded-full bg-muted" />
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="size-3" />
                                      <span>{formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setTasksDialogOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href={`/workspaces/${workspaceId}/tasks`} onClick={() => setTasksDialogOpen(false)}>
                View All in Tasks Page
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

