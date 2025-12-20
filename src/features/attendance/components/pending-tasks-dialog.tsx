'use client';

import { AlertCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface UncommentedTask {
  id: string;
  name: string;
}

interface PendingTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uncommentedTasks: UncommentedTask[];
  checkoutError?: string;
  workspaceId?: string;
}

export const PendingTasksDialog = ({
  open,
  onOpenChange,
  uncommentedTasks,
  checkoutError,
  workspaceId,
}: PendingTasksDialogProps) => {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${checkoutError ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <AlertCircle className={`h-5 w-5 ${checkoutError ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">Pending Tasks</DialogTitle>
              <DialogDescription className="mt-1.5">
                Please comment on all your in-progress tasks before checking out.
              </DialogDescription>
            </div>
            {uncommentedTasks.length > 0 && (
              <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                {uncommentedTasks.length}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {uncommentedTasks.length > 0 ? (
            <div className="space-y-4">
              {checkoutError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {checkoutError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground px-1">
                  In-progress tasks that need comments today:
                </p>
                <div className="space-y-2">
                  {uncommentedTasks.map((task: UncommentedTask, index: number) => (
                    <div
                      key={task.id}
                      className="group relative flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-relaxed break-words">
                            {task.name}
                          </p>
                        </div>
                        <div className="">
                          {workspaceId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 h-8 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => {
                                onOpenChange(false);
                                router.push(`/workspaces/${workspaceId}/tasks/${task.id}`);
                              }}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="text-xs">Comment</span>
                              <ArrowRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No pending tasks. All in-progress tasks have been commented on today.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
