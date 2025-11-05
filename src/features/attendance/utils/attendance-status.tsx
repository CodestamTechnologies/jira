import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { ReactNode } from 'react';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half-day';

export const getStatusIcon = (status: AttendanceStatus | string): ReactNode => {
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

export const getStatusColor = (status: AttendanceStatus | string): string => {
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

export const formatStatusLabel = (status: AttendanceStatus | string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
};
