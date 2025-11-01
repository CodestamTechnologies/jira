'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { updateAttendanceSchema } from '../schema'

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
}

const checkoutFormSchema = updateAttendanceSchema.pick({
  notes: true,
})

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export const CheckoutDialog = ({
  open,
  onOpenChange,
  onCheckOut,
  location,
  isLoadingLocation,
  isPending,
}: CheckoutDialogProps) => {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      notes: '',
    },
  })

  const onSubmit = (values: CheckoutFormValues) => {
    if (!location) {
      return
    }

    onCheckOut({
      checkOutLatitude: location.latitude,
      checkOutLongitude: location.longitude,
      checkOutAddress: location.address,
      notes: values.notes,
    })

    form.reset()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Out</DialogTitle>
          <DialogDescription>
            Please provide a summary of your day before checking out (minimum 10 characters).
          </DialogDescription>
        </DialogHeader>

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
                      placeholder="Enter a summary of your day's work..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
                disabled={isPending || isLoadingLocation || !location}
              >
                {isPending ? 'Checking Out...' : 'Check Out'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

