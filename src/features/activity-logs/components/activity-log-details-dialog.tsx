'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActivityLogItem } from './activity-log-item';
import type { ActivityLog } from '../types';

interface ActivityLogDetailsDialogProps {
  log: ActivityLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActivityLogDetailsDialog = ({ log, open, onOpenChange }: ActivityLogDetailsDialogProps) => {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Log Details</DialogTitle>
          <DialogDescription>View detailed information about this activity</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ActivityLogItem log={log} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
