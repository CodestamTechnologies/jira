import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader = ({ message, fullScreen = true }: PageLoaderProps) => {
  const containerClass = fullScreen 
    ? "flex h-screen items-center justify-center" 
    : "flex min-h-[400px] items-center justify-center";
  
  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};
