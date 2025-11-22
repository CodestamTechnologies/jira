'use client';

import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetAttendance } from '@/features/attendance/api/use-get-attendance';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { Attendance } from '@/features/attendance/types';
import { formatHoursAndMinutes } from '@/features/attendance/utils';

import type { MemberAttendanceClientProps } from '../../../types';

export const MemberAttendanceClient = ({ workspaceId, userId }: MemberAttendanceClientProps) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
  });

  // Map 'all' to undefined for status to match AttendanceFilters type
  const attendanceFilters = {
    ...filters,
    status: filters.status === 'all' ? undefined : filters.status,
    userId: userId,
  };

  // Fix: Ensure status is typed correctly for AttendanceFilters
  const typedAttendanceFilters = {
    ...filters,
    status: filters.status === 'all' ? undefined : (filters.status as 'present' | 'late' | 'absent' | 'half-day' | undefined),
    userId: userId,
  };

  const { data: attendanceData, isLoading } = useGetAttendance({
    workspaceId,
    filters: typedAttendanceFilters,
  });

  const attendanceRecords = attendanceData?.documents || [];

  const { data: members } = useGetMembers({ workspaceId });
  const member = members?.documents.find((m: { userId: string }) => m.userId === userId);

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
    });
  };

  // Calculate summary statistics
  const totalRecords = attendanceData?.total || attendanceRecords?.length || 0;
  const presentCount = attendanceRecords?.filter((r: { status: string; }) => r.status === 'present').length || 0;
  const lateCount = attendanceRecords?.filter((r: { status: string; }) => r.status === 'late').length || 0;
  const absentCount = attendanceRecords?.filter((r: { status: string; }) => r.status === 'absent').length || 0;
  const halfDayCount = attendanceRecords?.filter((r: { status: string; }) => r.status === 'half-day').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/workspaces/${workspaceId}/members`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Members
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {member?.name || 'Member'} Attendance
          </h1>
          <p className="text-muted-foreground">
            Monthly attendance records for {member?.name || 'this member'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">Attendance records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground">On time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
            <p className="text-xs text-muted-foreground">Arrived late</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Half Day</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{halfDayCount}</div>
            <p className="text-xs text-muted-foreground">Less than 4 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-xs text-muted-foreground">No check-in</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter attendance records by date and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select
                value={filters.status}
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

          {/* Attendance Records Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading attendance records...</div>
          ) : attendanceRecords && attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.map((record: Attendance) => (
                <div
                  key={record.$id}
                  className="border rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {format(new Date(record.date), 'EEEE, MMMM do, yyyy')}
                        </span>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </div>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {/* Check In */}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Check In: {format(new Date(record.checkInTime), 'HH:mm')}</span>
                    </div>

                    {/* Check Out */}
                    {record.checkOutTime && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Check Out: {format(new Date(record.checkOutTime), 'HH:mm')}</span>
                      </div>
                    )}

                    {/* Total Hours */}
                    {record.totalHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Total: {formatHoursAndMinutes(record.totalHours)}</span>
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="truncate">
                        {record.checkInAddress || `${record.checkInLatitude.toFixed(4)}, ${record.checkInLongitude.toFixed(4)}`}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {record.notes ? (
                    <div className="mt-4 pt-4 border-t">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-left w-full group">
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="font-medium text-sm mb-1 text-foreground">Daily Summary</div>
                                <div className="max-w-full">
                                  <p className="text-sm line-clamp-3 text-foreground group-hover:text-primary transition-colors">
                                    {record.notes}
                                  </p>
                                  {record.notes.length > 150 && (
                                    <span className="text-xs text-primary mt-1 inline-block font-medium">
                                      View full summary →
                                    </span>
                                  )}
                                </div>
                              </div>
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
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>No daily summary available</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this member
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
