import * as React from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  success?: boolean
  errorMessage?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, errorMessage, helperText, id, disabled, ...props }, ref) => {
    const inputId = id || React.useId()
    const helperId = helperText ? `${inputId}-helper` : undefined
    const errorId = error && errorMessage ? `${inputId}-error` : undefined
    
    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[44px]",
              error && "border-destructive focus-visible:ring-destructive pr-10",
              success && "border-green-500 focus-visible:ring-green-500 pr-10",
              !error && !success && "border-input",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={errorId || helperId}
            aria-disabled={disabled}
            {...props}
          />
          {error && (
            <AlertCircle 
              className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive pointer-events-none" 
              aria-hidden="true"
            />
          )}
          {success && !error && (
            <CheckCircle2 
              className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500 pointer-events-none" 
              aria-hidden="true"
            />
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
    )
  }
)
Input.displayName = "Input"

export { Input }
