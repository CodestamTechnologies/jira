'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetAttendance } from '../api/use-get-attendance';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { Attendance, AttendanceFilters } from '../types';

export const AttendanceTable = () => {
  const [filters, setFilters] = useState<AttendanceFilters>({});
  const workspaceId = useWorkspaceId();
  const { data: attendanceRecords, isLoading } = useGetAttendance(workspaceId, filters);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'half-day':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half-day':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFilterChange = (key: keyof AttendanceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance History
        </CardTitle>
        <CardDescription>
          View your attendance records and history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading attendance records...</div>
        ) : attendanceRecords && attendanceRecords.length > 0 ? (
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="min-w-full inline-block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Check In</TableHead>
                  <TableHead className="w-[100px]">Check Out</TableHead>
                  <TableHead className="w-[100px]">Hours</TableHead>
                  <TableHead className="min-w-[200px]">Check In Location</TableHead>
                  <TableHead className="min-w-[200px]">Check Out Location</TableHead>
                  <TableHead className="min-w-[300px]">Daily Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record: Attendance) => (
                  <TableRow key={record.$id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.date), 'EEEE')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          <span className="hidden sm:inline">
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{format(new Date(record.checkInTime), 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span>{format(new Date(record.checkOutTime), 'HH:mm')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.totalHours ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>{record.totalHours.toFixed(2)}h</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5 max-w-[200px]">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm truncate" title={record.checkInAddress || `${record.checkInLatitude.toFixed(4)}, ${record.checkInLongitude.toFixed(4)}`}>
                          {record.checkInAddress || `${record.checkInLatitude.toFixed(4)}, ${record.checkInLongitude.toFixed(4)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkOutLatitude && record.checkOutLongitude ? (
                        <div className="flex items-start gap-1.5 max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-sm truncate" title={record.checkOutAddress || `${record.checkOutLatitude.toFixed(4)}, ${record.checkOutLongitude.toFixed(4)}`}>
                            {record.checkOutAddress || `${record.checkOutLatitude.toFixed(4)}, ${record.checkOutLongitude.toFixed(4)}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      {record.notes ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-left w-full group">
                              <div className="max-w-[350px]">
                                <p className="text-sm line-clamp-3 text-foreground group-hover:text-primary transition-colors">
                                  {record.notes}
                                </p>
                                {record.notes.length > 150 && (
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
                                  {format(new Date(record.date), 'EEEE, MMMM dd, yyyy')}
                                </div>
                              </div>
                              <div className="max-h-[400px] overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {record.notes}
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
