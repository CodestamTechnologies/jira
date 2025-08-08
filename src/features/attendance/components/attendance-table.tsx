'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
                      <span>Total: {record.totalHours.toFixed(2)}h</span>
                    </div>
                  )}

                  {/* Check In Location */}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      Check In: {record.checkInAddress || `${record.checkInLatitude.toFixed(4)}, ${record.checkInLongitude.toFixed(4)}`}
                    </span>
                  </div>

                  {/* Check Out Location */}
                  {record.checkOutLatitude && record.checkOutLongitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="truncate">
                        Check Out: {record.checkOutAddress || `${record.checkOutLatitude.toFixed(4)}, ${record.checkOutLongitude.toFixed(4)}`}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <div className="col-span-full">
                      <span className="text-gray-600">Notes: {record.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attendance records found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
