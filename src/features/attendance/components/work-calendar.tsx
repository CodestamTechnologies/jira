'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, isSunday, addMonths, subMonths } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGetSpecialDays } from '../api/use-get-special-days';
import { useCreateSpecialDay } from '../api/use-manage-special-days';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

interface WorkCalendarProps {
  isAdmin: boolean;
}

export const WorkCalendar = ({ isAdmin }: WorkCalendarProps) => {
  const workspaceId = useWorkspaceId();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { data: specialDays, isLoading } = useGetSpecialDays({
    workspaceId,
    startDate: subMonths(currentMonth, 1).toISOString(), // Fetch a bit more context
    endDate: addMonths(currentMonth, 1).toISOString()
  });
  const { mutate: createSpecialDay, isPending: isCreating } = useCreateSpecialDay();

  const isPending = isCreating;

  const handleDayClick = (day: Date) => {
    if (!isAdmin || isPending) return;

    const dateStr = format(day, 'yyyy-MM-dd');
    const isSun = isSunday(day);

    // Backend now handles toggle if record exists
    if (isSun) {
      // Default is Holiday. If we click, we likely want to toggle to Working.
      // Backend checks if exists and toggles. ID is not needed for creation logic.
      createSpecialDay({
        workspaceId,
        date: dateStr,
        type: 'working',
        description: 'Working Sunday'
      });
    } else {
      // Default is Working. Click to toggle to Holiday.
      createSpecialDay({
        workspaceId,
        date: dateStr,
        type: 'holiday',
        description: 'Holiday'
      });
    }
  };

  // Modifiers
  const modifiers = {
    customHoliday: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const sd = specialDays?.find(s => {
        // Extract date portion from ISO string (e.g., "2026-02-15T00:00:00.000+00:00" -> "2026-02-15")
        const dbDate = s.date.split('T')[0];
        return dbDate === dateStr;
      });
      return sd?.type === 'holiday';
    },
    customWorking: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const sd = specialDays?.find(s => {
        const dbDate = s.date.split('T')[0];
        return dbDate === dateStr;
      });
      return sd?.type === 'working';
    },
    defaultHoliday: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const sd = specialDays?.find(s => {
        const dbDate = s.date.split('T')[0];
        return dbDate === dateStr;
      });
      if (sd) return false; // has override
      return isSunday(date);
    }
  };



  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Work Calendar</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Mon-Sat are working days by default. Click to mark exceptions (holidays on weekdays or working Sundays)."
                : "View working days and holidays."}
            </CardDescription>
          </div>
          {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex gap-2 text-xs mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="size-3 rounded border border-green-200 bg-green-100"></div>
            <span>Holiday (Override)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded border "></div>
            <span>Working Sunday (Override)</span>
          </div>
          <div className="flex items-center gap-1">
            {/* <div className="size-3 text-red-500 font-bold">Sun</div> */}
            <span>Sunday (Default Holiday)</span>
          </div>
          <div className="flex items-center gap-1">
            {/* <div className="size-3 text-gray-700">Mon-Sat</div> */}
            <span>Default Working Days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="p-4 border rounded-md">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={undefined} // Controlled selection not needed
            onDayClick={handleDayClick}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersClassNames={{
              customHoliday: "bg-green-100 text-green-700 font-bold border border-green-200 rounded-md hover:bg-green-200",
              
              defaultHoliday: "text-red-500 font-medium"
            }}
            className="pointer-events-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
};
