'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AlertCircle, MapPin, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateAttendanceSchema } from '../schema'
import { countNormalizedCharacters } from '../utils'
import { useGenerateSummary } from '../api/use-generate-summary'

interface LocationData {
  latitude: number
  longitude: number
  address?: string
}

interface UncommentedTask {
  id: string
  name: string
}

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckOut: (data: { checkOutLatitude: number; checkOutLongitude: number; checkOutAddress?: string; notes?: string }) => void
  location: LocationData | null
  isLoadingLocation: boolean
  isPending: boolean
  locationError?: string
  onRetryLocation?: () => void
  checkoutError?: string
  uncommentedTasks?: UncommentedTask[]
  workspaceId?: string
}

const checkoutFormSchema = updateAttendanceSchema.pick({
  notes: true,
})

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

/**
 * Constants for summary validation
 */
const MIN_CHARS = 10
const MAX_CHARS = 1000

/**
 * Checkout dialog component
 * 
 * Handles the checkout process with:
 * - Location capture
 * - Task comment validation
 * - Auto-generated summary from tasks and comments
 * - Optional user-editable summary
 * 
 * @remarks
 * - Blocks checkout if there are uncommented IN_PROGRESS tasks
 * - Auto-generates summary from today's tasks and comments
 * - Allows user to edit or add to the auto-generated summary
 */
export const CheckoutDialog = ({
  open,
  onOpenChange,
  onCheckOut,
  location,
  isLoadingLocation,
  isPending,
  locationError,
  onRetryLocation,
  checkoutError,
  uncommentedTasks = [],
  workspaceId,
}: CheckoutDialogProps) => {
  // Local state
  const [charCount, setCharCount] = useState(0)
  const [isSummaryGenerated, setIsSummaryGenerated] = useState(false)
  
  // Check if there are uncommented tasks blocking checkout
  const hasUncommentedTasks = uncommentedTasks.length > 0
  
  // Fetch auto-generated summary when dialog opens and there are no uncommented tasks
  // Only fetch when dialog is open to avoid unnecessary API calls
  const { data: summaryData, isLoading: isLoadingSummary } = useGenerateSummary(
    workspaceId,
    open && !hasUncommentedTasks
  )

  // Form setup with react-hook-form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      notes: '',
    },
  })

  const notesValue = form.watch('notes')

  /**
   * Pre-fill summary when it's generated and dialog opens
   * Only runs once per dialog open to avoid overwriting user edits
   */
  useEffect(() => {
    if (open && !hasUncommentedTasks && summaryData?.summary && !isSummaryGenerated) {
      const autoSummary = summaryData.summary.trim()
      if (autoSummary) {
        form.setValue('notes', autoSummary)
        setIsSummaryGenerated(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasUncommentedTasks, summaryData?.summary, isSummaryGenerated])

  /**
   * Reset summary generation flag when dialog closes
   * This ensures summary is re-generated on next open
   */
  useEffect(() => {
    if (!open) {
      setIsSummaryGenerated(false)
    }
  }, [open])

  /**
   * Update character count when notes value changes
   * Uses normalized character count for accurate validation
   */
  useEffect(() => {
    if (notesValue) {
      const normalized = countNormalizedCharacters(notesValue)
      setCharCount(normalized)
    } else {
      setCharCount(0)
    }
  }, [notesValue])

  /**
   * Handle form submission
   * Validates location and calls onCheckOut callback
   */
  const onSubmit = (values: CheckoutFormValues) => {
    if (!location) {
      form.setError('notes', {
        type: 'manual',
        message: 'Location is required. Please wait for location to load or retry.',
      })
      return
    }

    onCheckOut({
      checkOutLatitude: location.latitude,
      checkOutLongitude: location.longitude,
      checkOutAddress: location.address,
      notes: values.notes,
    })

    // Reset form after successful submission
    form.reset()
    setCharCount(0)
  }

  /**
   * Handle dialog open/close state changes
   * Resets form state when dialog closes
   */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      setCharCount(0)
      setIsSummaryGenerated(false)
    }
    onOpenChange(open)
  }

  /**
   * Validation: Notes are optional, but if provided must be between MIN and MAX chars
   */
  const isNotesValid = charCount === 0 || (charCount >= MIN_CHARS && charCount <= MAX_CHARS)
  
  /**
   * Determine if checkout can be submitted
   * Requires: location ready, no pending tasks, valid notes (or empty), and not currently processing
   */
  const canSubmit = !isPending && !isLoadingLocation && location !== null && !hasUncommentedTasks && isNotesValid

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Check Out</DialogTitle>
          <DialogDescription>
            {hasUncommentedTasks 
              ? 'Please comment on all your in-progress tasks before checking out.'
              : 'Add a summary of your day\'s work (optional).'}
          </DialogDescription>
        </DialogHeader>

        {/* Location Status */}
        {isLoadingLocation && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Getting your location... This may take a few seconds.
            </AlertDescription>
          </Alert>
        )}

        {locationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{locationError}</span>
              {onRetryLocation && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetryLocation}
                  className="ml-2"
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {location && (
          <Alert className="bg-green-50 border-green-200">
            <MapPin className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location captured{location.address ? `: ${location.address}` : ''}
            </AlertDescription>
          </Alert>
        )}

        {/* Show error if there are uncommented tasks - but don't show task list (already shown in Pending Tasks button) */}
        {hasUncommentedTasks && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {checkoutError || 'Please comment on all your in-progress tasks before checking out. Use the "Pending Tasks" button to see which tasks need comments.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Other checkout errors (not related to uncommented tasks) */}
        {checkoutError && !hasUncommentedTasks && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{checkoutError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Daily Summary (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isLoadingSummary
                          ? 'Generating summary from your tasks and comments...'
                          : "Summary is auto-generated from your tasks and comments. You can edit or add to it..."
                      }
                      className="min-h-[120px] resize-none"
                      disabled={hasUncommentedTasks || isLoadingSummary}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        const normalized = countNormalizedCharacters(e.target.value)
                        setCharCount(normalized)
                      }}
                    />
                  </FormControl>
                  {!hasUncommentedTasks && (
                    <FormDescription className="flex items-center justify-between">
                      <span>
                        {isLoadingSummary
                          ? 'Generating summary from your tasks and comments...'
                          : charCount === 0
                          ? 'Summary is auto-generated from your tasks and comments. You can edit or add to it.'
                          : charCount < MIN_CHARS
                          ? `At least ${MIN_CHARS - charCount} more character${MIN_CHARS - charCount === 1 ? '' : 's'} needed`
                          : charCount > MAX_CHARS
                          ? `Exceeds limit by ${charCount - MAX_CHARS} character${charCount - MAX_CHARS === 1 ? '' : 's'}`
                          : 'Summary looks good. You can edit or add to it.'}
                      </span>
                      {charCount > 0 && (
                        <span
                          className={`text-sm font-medium ${
                            charCount < MIN_CHARS
                              ? 'text-yellow-600'
                              : charCount > MAX_CHARS
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {charCount}/{MAX_CHARS}
                        </span>
                      )}
                    </FormDescription>
                  )}
                  {hasUncommentedTasks && (
                    <FormDescription className="text-muted-foreground">
                      Complete all in-progress task comments to enable checkout
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Out...
                  </>
                ) : isLoadingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : !location ? (
                  'Waiting for Location...'
                ) : hasUncommentedTasks ? (
                  'Complete Task Comments First'
                ) : !isNotesValid && charCount > 0 ? (
                  'Fix Summary'
                ) : (
                  'Check Out'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
