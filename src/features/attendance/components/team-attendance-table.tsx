import { format } from 'date-fns';
import { Clock, MapPin, CheckCircle, XCircle, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getStatusIcon, getStatusColor, formatStatusLabel } from '../utils/attendance-status';
import { formatHoursAndMinutes } from '../utils';

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

interface TeamAttendanceTableProps {
  teamAttendance: TeamAttendanceItem[];
  selectedDate: string;
  isLoading: boolean;
}

export const TeamAttendanceTable = ({
  teamAttendance,
  selectedDate,
  isLoading,
}: TeamAttendanceTableProps) => {
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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Attendance - {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
        </CardTitle>
        <CardDescription>
          View attendance details for all team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="min-w-full inline-block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Member</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Check In</TableHead>
                  <TableHead className="w-[120px]">Check Out</TableHead>
                  <TableHead className="w-[100px]">Hours</TableHead>
                  <TableHead className="min-w-[200px]">Check In Location</TableHead>
                  <TableHead className="min-w-[200px]">Check Out Location</TableHead>
                  <TableHead className="min-w-[300px]">Daily Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamAttendance.map((item) => (
                  <TableRow key={item.member.userId}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{item.member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.member.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.attendance ? (
                        <Badge className={getStatusColor(item.attendance.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.attendance.status)}
                            <span className="hidden sm:inline">
                              {formatStatusLabel(item.attendance.status)}
                            </span>
                          </div>
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="hidden sm:inline">Absent</span>
                          </div>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.attendance?.checkInTime ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span>{format(new Date(item.attendance.checkInTime), 'HH:mm')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.attendance?.checkOutTime ? (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span>{format(new Date(item.attendance.checkOutTime), 'HH:mm')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.attendance?.totalHours ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>{formatHoursAndMinutes(item.attendance.totalHours)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.attendance?.checkInAddress || item.attendance?.checkInLatitude ? (
                        <div className="flex items-start gap-1.5 max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span
                            className="text-sm truncate"
                            title={
                              item.attendance.checkInAddress ||
                              `${item.attendance.checkInLatitude?.toFixed(4)}, ${item.attendance.checkInLongitude?.toFixed(4)}`
                            }
                          >
                            {item.attendance.checkInAddress ||
                              `${item.attendance.checkInLatitude?.toFixed(4)}, ${item.attendance.checkInLongitude?.toFixed(4)}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.attendance?.checkOutAddress || item.attendance?.checkOutLatitude ? (
                        <div className="flex items-start gap-1.5 max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span
                            className="text-sm truncate"
                            title={
                              item.attendance.checkOutAddress ||
                              `${item.attendance.checkOutLatitude?.toFixed(4)}, ${item.attendance.checkOutLongitude?.toFixed(4)}`
                            }
                          >
                            {item.attendance.checkOutAddress ||
                              `${item.attendance.checkOutLatitude?.toFixed(4)}, ${item.attendance.checkOutLongitude?.toFixed(4)}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      {item.attendance?.notes ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-left w-full group">
                              <div className="max-w-[350px]">
                                <p className="text-sm line-clamp-3 text-foreground group-hover:text-primary transition-colors">
                                  {item.attendance.notes}
                                </p>
                                {item.attendance.notes.length > 150 && (
                                  <span className="text-xs text-primary mt-1 inline-block font-medium">
                                    View full summary →
                                  </span>
                                )}
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[500px] max-w-[90vw] p-4" align="start">
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
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
