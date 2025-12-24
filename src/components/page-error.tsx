import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  fullScreen?: boolean;
}

export const PageError = ({ 
  message = 'Something went wrong.', 
  onRetry,
  retryText = 'Try Again',
  fullScreen = true
}: PageErrorProps) => {
  const containerClass = fullScreen 
    ? "flex h-full min-h-[400px] flex-col items-center justify-center gap-4 px-4" 
    : "flex min-h-[400px] flex-col items-center justify-center gap-4 px-4";
  
  return (
    <div className={containerClass} role="alert" aria-live="assertive">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Oops! Something went wrong</h3>
          <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        </div>
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="mt-2"
            aria-label={retryText}
          >
            <RefreshCw className="size-4 mr-2" aria-hidden="true" />
            {retryText}
          </Button>
        )}
      </div>
    </div>
  );
};
