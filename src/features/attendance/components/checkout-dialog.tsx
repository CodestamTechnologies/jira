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

interface LocationData {
  latitude: number
  longitude: number
  address?: string
}

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckOut: (data: { checkOutLatitude: number; checkOutLongitude: number; checkOutAddress?: string; notes: string }) => void
  location: LocationData | null
  isLoadingLocation: boolean
  isPending: boolean
  locationError?: string
  onRetryLocation?: () => void
}

const checkoutFormSchema = updateAttendanceSchema.pick({
  notes: true,
})

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

const MIN_CHARS = 10
const MAX_CHARS = 1000

export const CheckoutDialog = ({
  open,
  onOpenChange,
  onCheckOut,
  location,
  isLoadingLocation,
  isPending,
  locationError,
  onRetryLocation,
}: CheckoutDialogProps) => {
  const [charCount, setCharCount] = useState(0)
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      notes: '',
    },
  })

  const notesValue = form.watch('notes')

  useEffect(() => {
    if (notesValue) {
      const normalized = countNormalizedCharacters(notesValue)
      setCharCount(normalized)
    } else {
      setCharCount(0)
    }
  }, [notesValue])

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

    form.reset()
    setCharCount(0)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      setCharCount(0)
    }
    onOpenChange(open)
  }

  const isNotesValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS
  const canSubmit = !isPending && !isLoadingLocation && location !== null && isNotesValid

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Check Out</DialogTitle>
          <DialogDescription>
            Please provide a summary of your day's work before checking out.
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Summary *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a summary of your day's work (e.g., completed tasks, meetings attended, progress made)..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        const normalized = countNormalizedCharacters(e.target.value)
                        setCharCount(normalized)
                      }}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center justify-between">
                    <span>
                      {charCount < MIN_CHARS
                        ? `At least ${MIN_CHARS - charCount} more character${MIN_CHARS - charCount === 1 ? '' : 's'} needed`
                        : charCount > MAX_CHARS
                        ? `Exceeds limit by ${charCount - MAX_CHARS} character${charCount - MAX_CHARS === 1 ? '' : 's'}`
                        : 'Summary looks good'}
                    </span>
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
                  </FormDescription>
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
                ) : !isNotesValid ? (
                  'Complete Summary'
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
