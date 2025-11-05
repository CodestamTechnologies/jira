import { Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TeamAttendanceDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const TeamAttendanceDatePicker = ({
  selectedDate,
  onDateChange,
}: TeamAttendanceDatePickerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Date
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="max-w-xs"
        />
      </CardContent>
    </Card>
  );
};
