'use client'

import { useState, useCallback, useMemo, useOptimistic } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MemberAvatar } from '@/features/members/components/member-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/hooks/use-confirm'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { MoreVertical, Edit2, Trash2, Loader2, Send } from 'lucide-react'
import { useGetMembers } from '@/features/members/api/use-get-members'
import { useAddComment } from '@/features/leads/api/use-add-comment'
import { useDeleteComment } from '@/features/leads/api/use-delete-comment'
import { useGetLead } from '@/features/leads/api/use-get-lead'
import type { Comment } from '@/data/lead-schema'
import { cn } from '@/lib/utils'

interface LeadCommentsProps {
  leadId: string
  workspaceId: string
  currentUserId: string
  currentUserName?: string
}

interface CommentItemProps {
  comment: Comment
  currentUserId: string
  leadId: string
  workspaceId: string
  onOptimisticDelete?: (commentId: string) => void
}

const CommentItem = ({
  comment,
  currentUserId,
  leadId,
  workspaceId,
  onOptimisticDelete,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)

  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment()

  const [DeleteDialog, confirmDelete] = useConfirm(
    'Delete comment',
    'This action cannot be undone.',
    'destructive'
  )

  const isOwner = comment.authorId === currentUserId

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setEditValue(comment.content)
  }, [comment.content])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditValue(comment.content)
  }, [comment.content])

  const handleSaveEdit = useCallback(() => {
    if (!editValue.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    // Note: Update comment functionality would need to be added to the API
    // For now, we'll just show a message
    toast.info('Comment editing will be available soon')
    setIsEditing(false)
  }, [editValue])

  const handleDelete = useCallback(async () => {
    const confirmed = await confirmDelete()
    if (!confirmed) return

    deleteComment(
      {
        leadId,
        commentId: comment.id,
        workspaceId,
      },
      {
        onSuccess: () => {
          onOptimisticDelete?.(comment.id)
        },
      }
    )
  }, [comment.id, leadId, workspaceId, confirmDelete, deleteComment, onOptimisticDelete])

  return (
    <>
      <DeleteDialog />
      <li className="flex gap-3">
        <MemberAvatar
          name={comment.authorName}
          className="h-8 w-8 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editValue.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </div>
              )}
            </div>
            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </li>
    </>
  )
}

export const LeadComments = ({
  leadId,
  workspaceId,
  currentUserId,
  currentUserName,
}: LeadCommentsProps) => {
  const [value, setValue] = useState('')
  const { data: lead, isLoading: isLoadingLead } = useGetLead({ leadId })
  const { data: members } = useGetMembers({ workspaceId })
  const { mutate: addComment, isPending } = useAddComment()

  // Get comments from lead data
  const comments: Comment[] = useMemo(() => {
    if (!lead?.comments) return []
    return Array.isArray(lead.comments) ? lead.comments : []
  }, [lead?.comments])

  // Optimistic comments state
  const [optimisticComments, optimisticAction] = useOptimistic(
    comments,
    (state: Comment[], action: { type: 'add' | 'delete'; comment?: Comment; commentId?: string }) => {
      switch (action.type) {
        case 'add':
          return action.comment ? [...state, action.comment] : state
        case 'delete':
          return action.commentId ? state.filter((c) => c.id !== action.commentId) : state
        default:
          return state
      }
    }
  )

  const addOptimisticComment = useCallback(
    (comment: Comment) => {
      optimisticAction({ type: 'add', comment })
    },
    [optimisticAction]
  )

  const deleteOptimisticComment = useCallback(
    (commentId: string) => {
      optimisticAction({ type: 'delete', commentId })
    },
    [optimisticAction]
  )

  const handleAdd = useCallback(() => {
    if (!value.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    const content = value.trim()
    setValue('')

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content,
      authorId: currentUserId,
      authorName: currentUserName || 'You',
      authorEmail: '',
      createdAt: new Date().toISOString(),
    }

    addOptimisticComment(optimisticComment)

    addComment(
      {
        leadId,
        commentData: { content },
        workspaceId,
      },
      {
        onSuccess: (response) => {
          // The API response will update the lead query, which will refresh the comments
          // The optimistic comment will be replaced with the real one
        },
        onError: () => {
          // Revert optimistic update on error
          setValue(content)
        },
      }
    )
  }, [value, leadId, workspaceId, currentUserId, currentUserName, addComment, addOptimisticComment])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !isPending) {
          handleAdd()
        }
      }
    },
    [value, isPending, handleAdd]
  )

  if (isLoadingLead) {
    return (
      <div className="rounded-lg border p-4 mt-4 bg-muted/40">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading comments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 mt-4 bg-muted/40">
      <p className="text-lg font-semibold mb-4">Comments</p>
      {optimisticComments.length === 0 ? (
        <div className="italic text-muted-foreground mb-4 text-center py-4">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <ul className="mb-6 space-y-4">
          {optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              leadId={leadId}
              workspaceId={workspaceId}
              onOptimisticDelete={deleteOptimisticComment}
            />
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
        <Textarea
          placeholder="Add a comment... (Press Enter to submit, Shift+Enter for new line)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isPending}
          className="resize-none"
        />
        <div className="flex items-center justify-end">
          <Button
            onClick={handleAdd}
            disabled={isPending || !value.trim()}
            size="sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Add Comment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
