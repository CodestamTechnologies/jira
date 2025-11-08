'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';

import TeamAttendancePDF, { type TeamAttendancePDFData } from '@/components/team-attendance-pdf';
import { downloadPDF, generateSafeFilename } from '@/lib/pdf/utils';
import { calculateTeamAttendanceStats } from '../utils/team-attendance-stats';

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

interface UseDownloadTeamAttendanceProps {
  teamAttendance: TeamAttendanceItem[];
  selectedDate: string;
}

export const useDownloadTeamAttendance = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateTeamAttendancePDF = async ({
    teamAttendance,
    selectedDate,
  }: UseDownloadTeamAttendanceProps) => {
    try {
      const stats = calculateTeamAttendanceStats(teamAttendance);

      const pdfData: TeamAttendancePDFData = {
        date: selectedDate,
        teamAttendance: teamAttendance.map((item) => ({
          member: {
            name: item.member.name,
            email: item.member.email,
          },
          attendance: item.attendance
            ? {
                checkInTime: item.attendance.checkInTime,
                checkOutTime: item.attendance.checkOutTime,
                totalHours: item.attendance.totalHours,
                status: item.attendance.status,
                checkInAddress: item.attendance.checkInAddress,
                checkOutAddress: item.attendance.checkOutAddress,
                checkInLatitude: item.attendance.checkInLatitude,
                checkInLongitude: item.attendance.checkInLongitude,
                checkOutLatitude: item.attendance.checkOutLatitude,
                checkOutLongitude: item.attendance.checkOutLongitude,
                notes: item.attendance.notes,
              }
            : null,
        })),
        stats,
      };

      const doc = <TeamAttendancePDF {...pdfData} />;
      const pdfBlob = await pdf(doc).toBlob();

      return { pdfBlob, pdfData };
    } catch (error) {
      console.error('Error generating team attendance PDF:', error);
      throw error;
    }
  };

  const downloadTeamAttendance = async ({
    teamAttendance,
    selectedDate,
  }: UseDownloadTeamAttendanceProps) => {
    setIsDownloading(true);

    try {
      const { pdfBlob } = await generateTeamAttendancePDF({
        teamAttendance,
        selectedDate,
      });

      const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
      const filename = generateSafeFilename(
        `team-attendance-${formattedDate}`,
        'pdf'
      );
      downloadPDF(pdfBlob, filename);
    } catch (error) {
      console.error('Error downloading team attendance:', error);
      throw error;
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadTeamAttendance, generateTeamAttendancePDF, isDownloading };
};
