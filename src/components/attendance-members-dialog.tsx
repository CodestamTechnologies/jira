'use client'

import { CheckCircle, AlertCircle, Clock, Users } from 'lucide-react'
import { format } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MemberAvatar } from '@/features/members/components/member-avatar'
import { Badge } from '@/components/ui/badge'
import { formatStatusLabel } from '@/features/attendance/utils/attendance-status'

interface TeamAttendanceItem {
  member: {
    $id: string
    userId: string
    name: string
    email: string
    role: string
  }
  attendance: {
    $id: string
    date: string
    checkInTime: string
    checkOutTime?: string
    totalHours?: number
    status: string
    notes?: string
  } | null
}

interface AttendanceMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  members: TeamAttendanceItem[]
  date: string
}

export const AttendanceMembersDialog = ({
  open,
  onOpenChange,
  title,
  members,
  date,
}: AttendanceMembersDialogProps) => {
  const getStatusBadgeVariant = (status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!status) return 'secondary'
    if (status === 'present') return 'default'
    if (status === 'late') return 'outline'
    if (status === 'half-day') return 'outline'
    return 'secondary'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title === 'Total Members' && <Users className="size-5" />}
            {title === 'Checked In' && <CheckCircle className="size-5 text-blue-500" />}
            {title === 'Present' && <CheckCircle className="size-5 text-green-500" />}
            {title === 'Late' && <AlertCircle className="size-5 text-yellow-500" />}
            {title === 'Not Checked In' && <Clock className="size-5 text-red-500" />}
            <span>{title}</span>
            <Badge variant="secondary" className="ml-auto">
              {members.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((item) => (
                <div
                  key={item.member.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <MemberAvatar
                    name={item.member.name}
                    className="size-10 shrink-0"
                    fallbackClassName="text-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{item.member.name}</p>
                      {item.attendance && (
                        <Badge
                          variant={getStatusBadgeVariant(item.attendance.status)}
                          className="text-xs"
                        >
                          {formatStatusLabel(item.attendance.status)}
                        </Badge>
                      )}
                      {!item.attendance && (
                        <Badge variant="secondary" className="text-xs">
                          Not Checked In
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.member.email}</p>
                    {item.attendance && (
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {item.attendance.checkInTime && (
                          <span>
                            Check-in: {format(new Date(item.attendance.checkInTime), 'h:mm a')}
                          </span>
                        )}
                        {item.attendance.checkOutTime && (
                          <span>
                            Check-out: {format(new Date(item.attendance.checkOutTime), 'h:mm a')}
                          </span>
                        )}
                        {item.attendance.totalHours && (
                          <span>
                            Hours: {Math.floor(item.attendance.totalHours)}h{' '}
                            {Math.round((item.attendance.totalHours % 1) * 60)}m
                          </span>
                        )}
                      </div>
                    )}
                    {!item.attendance && (
                      <p className="text-xs text-muted-foreground mt-1">Not checked in</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

