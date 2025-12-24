'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useJoinWorkspace } from '@/features/workspaces/api/use-join-workspace'
import { useInviteCode } from '@/features/workspaces/hooks/use-invite-code'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { cn } from '@/lib/utils'

interface JoinWorkspaceFormProps {
  onCancel?: () => void
  initialValues?: {
    name: string
    $id?: string
  }
}

const joinWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  code: z.string().min(1, 'Invite code is required'),
})

export function JoinWorkspaceForm({ onCancel, initialValues }: JoinWorkspaceFormProps) {
  const router = useRouter()
  const { mutate: joinWorkspace, isPending } = useJoinWorkspace()
  const workspaceIdFromRoute = useWorkspaceId()
  const inviteCodeFromRoute = useInviteCode()

  const form = useForm<z.infer<typeof joinWorkspaceSchema>>({
    resolver: zodResolver(joinWorkspaceSchema),
    defaultValues: {
      workspaceId: '',
      code: '',
    },
  })

  const onSubmit = (values: z.infer<typeof joinWorkspaceSchema>) => {
    joinWorkspace(
      {
        param: { workspaceId: values.workspaceId },
        json: { code: values.code },
      },
      {
        onSuccess: ({ data }) => {
          form.reset()
          if (onCancel) onCancel()
          router.push(`/workspaces/${data.$id}`)
        },
      },
    )
  }

  if (initialValues) {
    const handleJoin = () => {
      joinWorkspace(
        {
          param: { workspaceId: workspaceIdFromRoute },
          json: { code: inviteCodeFromRoute },
        },
        {
          onSuccess: ({ data }) => {
            router.push(`/workspaces/${data.$id}`)
          },
        },
      )
    }

    return (
      <Card className="size-full border-none shadow-none">
        <CardHeader className="p-7">
          <CardTitle className="text-xl font-bold">Join workspace</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{initialValues.name}</strong> workspace.
          </CardDescription>
        </CardHeader>

        <div className="px-7">
          <Separator />
        </div>

        <CardContent className="p-7">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <Button disabled={isPending} size="lg" variant="secondary" type="button" className="w-full md:w-fit" asChild>
              <Link href="/">Cancel</Link>
            </Button>

            <Button disabled={isPending} size="lg" type="button" onClick={handleJoin} className="w-full md:w-fit">
              Join Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Join an existing workspace</CardTitle>
      </CardHeader>

      <div className="px-7">
        <Separator />
      </div>

      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="workspaceId"
                disabled={isPending}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace ID</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Enter workspace ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                disabled={isPending}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invite Code</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Enter invite code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="py-7" />

            <div className="flex items-center justify-between">
              <Button
                disabled={isPending}
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                className={cn(!onCancel && 'invisible')}
              >
                Cancel
              </Button>

              <Button disabled={isPending} type="submit" size="lg">
                Join workspace
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
