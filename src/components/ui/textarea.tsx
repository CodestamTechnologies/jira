import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
  errorMessage?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, errorMessage, helperText, id, disabled, ...props }, ref) => {
    const textareaId = id || React.useId();
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const errorId = error && errorMessage ? `${textareaId}-error` : undefined;
    
    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            id={textareaId}
            className={cn(
              'flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
              error && 'border-destructive focus-visible:ring-destructive',
              success && 'border-green-500 focus-visible:ring-green-500',
              !error && !success && 'border-input',
              className,
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={errorId || helperId}
            aria-disabled={disabled}
            {...props}
          />
          {(error || success) && (
            <div className="absolute right-3 top-3 pointer-events-none">
              {error && (
                <AlertCircle 
                  className="size-4 text-destructive" 
                  aria-hidden="true"
                />
              )}
              {success && !error && (
                <CheckCircle2 
                  className="size-4 text-green-500" 
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>
        {error && errorMessage && (
          <p 
            id={errorId}
            className="mt-1.5 text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={helperId}
            className="mt-1.5 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
