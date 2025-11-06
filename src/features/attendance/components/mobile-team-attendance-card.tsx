import { format } from 'date-fns';
import { Clock, MapPin, CheckCircle, XCircle, Users, Mail } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getStatusIcon, getStatusColor, formatStatusLabel } from '../utils/attendance-status';

interface TeamAttendanceItem {
  member: {
    $id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  attendance: {
    $id: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkInAddress?: string;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    checkOutAddress?: string;
    totalHours?: number;
    status: string;
    notes?: string;
  } | null;
}

interface MobileTeamAttendanceCardProps {
  teamAttendance: TeamAttendanceItem[];
  selectedDate: string;
  isLoading: boolean;
}

export const MobileTeamAttendanceCard = ({
  teamAttendance,
  selectedDate,
  isLoading,
}: MobileTeamAttendanceCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">Loading team attendance...</div>
        </CardContent>
      </Card>
    );
  }

  if (!teamAttendance || teamAttendance.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No team members found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Team Attendance
        </CardTitle>
        <CardDescription>
          {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamAttendance.map((item) => (
          <Card key={item.member.userId} className="border">
            <CardContent className="p-4 space-y-3">
              {/* Member Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{item.member.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {item.member.email}
                    </span>
                  </div>
                </div>
                {/* Status Badge */}
                <div className="shrink-0">
                  {item.attendance ? (
                    <Badge className={getStatusColor(item.attendance.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.attendance.status)}
                        <span className="text-xs">
                          {formatStatusLabel(item.attendance.status)}
                        </span>
                      </div>
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs">Absent</span>
                      </div>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Attendance Details */}
              {item.attendance && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Check In/Out Times */}
                  <div className="grid grid-cols-2 gap-3">
                    {item.attendance.checkInTime && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Check In</div>
                          <div className="text-sm font-medium">
                            {format(new Date(item.attendance.checkInTime), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}
                    {item.attendance.checkOutTime && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Check Out</div>
                          <div className="text-sm font-medium">
                            {format(new Date(item.attendance.checkOutTime), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Hours */}
                  {item.attendance.totalHours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground">Total Hours: </span>
                        <span className="text-sm font-medium">
                          {item.attendance.totalHours.toFixed(2)}h
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Check In Location */}
                  {(item.attendance.checkInAddress || item.attendance.checkInLatitude) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Check In Location</div>
                        <div className="text-sm break-words">
                          {item.attendance.checkInAddress ||
                            `${item.attendance.checkInLatitude?.toFixed(4)}, ${item.attendance.checkInLongitude?.toFixed(4)}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Check Out Location */}
                  {(item.attendance.checkOutAddress || item.attendance.checkOutLatitude) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Check Out Location</div>
                        <div className="text-sm break-words">
                          {item.attendance.checkOutAddress ||
                            `${item.attendance.checkOutLatitude?.toFixed(4)}, ${item.attendance.checkOutLongitude?.toFixed(4)}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily Summary */}
                  {item.attendance.notes && (
                    <div className="pt-2 border-t">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-left w-full group">
                            <div className="text-xs text-muted-foreground mb-1">Daily Summary</div>
                            <p className="text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                              {item.attendance.notes}
                            </p>
                            {item.attendance.notes.length > 100 && (
                              <span className="text-xs text-primary mt-1 inline-block font-medium">
                                View full summary →
                              </span>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[90vw] max-w-md p-4" align="start">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Daily Summary</h4>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(item.attendance.date), 'EEEE, MMMM dd, yyyy')}
                              </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {item.attendance.notes}
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              )}

              {/* No Attendance Message */}
              {!item.attendance && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No attendance record for this date
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
