'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';

import TasksInProgressPDF, { type TasksInProgressPDFData } from '@/components/tasks-in-progress-pdf';
import { downloadPDF, generateSafeFilename } from '@/lib/pdf/utils';
import type { Task } from '@/features/tasks/types';

interface UseDownloadTasksPDFProps {
  tasks: Task[];
  selectedDate: string;
}

export const useDownloadTasksPDF = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateTasksPDF = async ({
    tasks,
    selectedDate,
  }: UseDownloadTasksPDFProps) => {
    try {
      const pdfData: TasksInProgressPDFData = {
        date: selectedDate,
        tasks: tasks,
      };

      const doc = <TasksInProgressPDF {...pdfData} />;
      const pdfBlob = await pdf(doc).toBlob();

      return { pdfBlob, pdfData };
    } catch (error) {
      console.error('Error generating tasks PDF:', error);
      throw error;
    }
  };

  const downloadTasksPDF = async ({
    tasks,
    selectedDate,
  }: UseDownloadTasksPDFProps) => {
    setIsDownloading(true);

    try {
      const { pdfBlob } = await generateTasksPDF({
        tasks,
        selectedDate,
      });

      const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
      const filename = generateSafeFilename(
        `tasks-in-progress-${formattedDate}`,
        'pdf'
      );
      downloadPDF(pdfBlob, filename);
    } catch (error) {
      console.error('Error downloading tasks PDF:', error);
      throw error;
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadTasksPDF, generateTasksPDF, isDownloading };
};

