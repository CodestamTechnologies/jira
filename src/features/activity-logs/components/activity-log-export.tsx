'use client';

import { Download, FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useExportActivityLogs } from '../api/use-export-activity-logs';
import { ActivityAction, ActivityEntityType } from '../types';

interface ActivityLogExportProps {
  workspaceId: string;
  filters: {
    entityType?: ActivityEntityType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    action?: ActivityAction;
    projectId?: string;
  };
}

const exportToCSV = (data: Array<Record<string, unknown>>) => {
  if (data.length === 0) {
    toast.error('No data to export');
    return;
  }

  const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
      const rows = data.map((log: any) => {
        const changes = typeof log.changes === 'string' ? log.changes : JSON.stringify(log.changes);
        return [
          new Date(log.$createdAt).toISOString(),
          log.username,
          log.action,
          log.entityType,
          log.entityId,
          changes,
        ];
      });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success('Activity logs exported to CSV');
};

export const ActivityLogExport = ({ workspaceId, filters }: ActivityLogExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { refetch } = useExportActivityLogs({
    workspaceId,
    ...filters,
    enabled: false,
  });

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const { data } = await refetch();
      if (!data?.data) {
        toast.error('No data to export');
        return;
      }

      if (format === 'csv') {
        exportToCSV(data.data);
      } else {
        // JSON export
        const jsonContent = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Activity logs exported to JSON');
      }
    } catch (error) {
      console.error('[EXPORT_ERROR]:', error);
      toast.error('Failed to export activity logs');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 size-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileDown className="mr-2 size-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileDown className="mr-2 size-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
