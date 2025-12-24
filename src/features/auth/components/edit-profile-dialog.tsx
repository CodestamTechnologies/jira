'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useUpdateProfile } from '@/features/auth/api/use-update-profile'
import { updateProfileSchema } from '@/features/auth/schema'
import { useCurrent } from '@/features/auth/api/use-current'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { data: user } = useCurrent()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      image: undefined,
    },
  })

  // Update form when user data changes
  useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name || '',
        image: undefined,
      })
      setPreviewUrl(null)
    }
  }, [user, form, open])

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const onSubmit = (values: z.infer<typeof updateProfileSchema>) => {
    const updateData: { name?: string; image?: File | string } = {}

    if (values.name !== undefined && values.name !== user?.name) {
      updateData.name = values.name
    }

    if (values.image !== undefined) {
      updateData.image = values.image instanceof File ? values.image : ''
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      toast.info('No changes to save')
      onOpenChange(false)
      return
    }

    updateProfile(
      {
        form: updateData,
      },
      {
        onSuccess: () => {
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
          }
          toast.success('Profile updated successfully')
          form.reset()
          onOpenChange(false)
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to update profile')
        },
      },
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB in bytes
    const file = e.target.files?.[0]

    if (file) {
      const validImageTypes = ['image/png', 'image/jpg', 'image/jpeg']

      if (!validImageTypes.includes(file.type)) {
        toast.error('File is not a valid image.')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Image size cannot exceed 1 MB.')
        return
      }

      // Cleanup previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      const newPreviewUrl = URL.createObjectURL(file)
      setPreviewUrl(newPreviewUrl)
      form.setValue('image', file)
    }
  }

  const watchedImage = form.watch('image')
  const currentImageUrl = watchedImage instanceof File ? previewUrl : user?.imageUrl

  const avatarFallback = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() ?? '?')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your name and profile image.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              disabled={isPending}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Enter your name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isPending}
              control={form.control}
              name="image"
              render={({ field }) => (
                <div className="flex flex-col gap-y-2">
                  <div className="flex items-center gap-x-5">
                    {currentImageUrl ? (
                      <div className="relative size-[72px] overflow-hidden rounded-full">
                        <Image
                          src={currentImageUrl}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <Avatar className="size-[72px]">
                        <AvatarFallback>
                          <ImageIcon className="size-[36px] text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex flex-col">
                      <p className="text-sm">Profile Image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or JPEG, max 1MB</p>

                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageChange}
                        accept=".jpg, .png, .jpeg"
                        ref={inputRef}
                        disabled={isPending}
                      />

                      {field.value ? (
                        <Button
                          type="button"
                          disabled={isPending}
                          variant="destructive"
                          size="sm"
                          className="mt-2 w-fit"
                          onClick={() => {
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl)
                              setPreviewUrl(null)
                            }
                            field.onChange(undefined)
                            if (inputRef.current) inputRef.current.value = ''
                          }}
                        >
                          Remove Image
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={isPending}
                          variant="outline"
                          size="sm"
                          className="mt-2 w-fit"
                          onClick={() => inputRef.current?.click()}
                        >
                          Upload Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />

            <DialogFooter>
              <Button
                disabled={isPending}
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
