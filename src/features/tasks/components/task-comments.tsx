'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useGetComments } from '../api/use-get-comments'
import { useCreateComment } from '../api/use-create-comment'
import { useUpdateComment } from '../api/use-update-comment'
import { useDeleteComment } from '../api/use-delete-comment'
import type { Comment } from '../types'
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
import { MoreVertical, Edit2, Trash2, Reply, Loader2, Paperclip } from 'lucide-react'
import { useGetMembers } from '@/features/members/api/use-get-members'
import { useUploadCommentFile } from '../api/use-upload-comment-file'
import { CommentAttachments } from './comment-attachments'
import { CommentContent } from './comment-content'
import { MentionAutocomplete } from './mention-autocomplete'
import { extractMentions } from '../utils/comment-utils'

interface TaskCommentsProps {
  taskId: string
  workspaceId: string
  currentUserId: string
  currentUserName?: string
}

interface CommentItemProps {
  comment: Comment
  currentUserId: string
  currentUserName?: string
  taskId: string
  workspaceId: string
  replies: Comment[]
  members?: Array<{ userId: string; name: string; email: string }>
  level?: number
}

const CommentItem = ({
  comment,
  currentUserId,
  currentUserName,
  taskId,
  workspaceId,
  replies,
  members,
  level = 0,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [replyValue, setReplyValue] = useState('')

  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment()
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment()
  const { mutate: addComment, isPending: isAddingReply } = useCreateComment()

  const [DeleteDialog, confirmDelete] = useConfirm(
    'Delete comment',
    'This action cannot be undone. This will also delete all replies to this comment.',
    'destructive'
  )

  const isOwner = comment.authorId === currentUserId
  const maxLevel = 3

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setEditValue(comment.content)
  }, [comment.content])

  const handleSaveEdit = useCallback(() => {
    if (!editValue.trim()) return
    updateComment(
      {
        commentId: comment.$id,
        taskId,
        content: editValue.trim(),
      },
      {
        onSuccess: () => {
          setIsEditing(false)
          setEditValue('')
        },
      }
    )
  }, [editValue, comment.$id, taskId, updateComment])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditValue(comment.content)
  }, [comment.content])

  const handleDelete = useCallback(async () => {
    const ok = await confirmDelete()
    if (!ok) return

    deleteComment({
      commentId: comment.$id,
      taskId,
    })
  }, [comment.$id, taskId, deleteComment, confirmDelete])

  const handleReply = useCallback(() => {
    setIsReplying(true)
  }, [])

  const handleSaveReply = useCallback(() => {
    if (!replyValue.trim()) return
    addComment(
      {
        taskId,
        content: replyValue.trim(),
        authorId: currentUserId,
        username: currentUserName || currentUserId,
        parentId: comment.$id,
      },
      {
        onSuccess: () => {
          setIsReplying(false)
          setReplyValue('')
        },
      }
    )
  }, [replyValue, taskId, currentUserId, currentUserName, comment.$id, addComment])

  const handleCancelReply = useCallback(() => {
    setIsReplying(false)
    setReplyValue('')
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, type: 'edit' | 'reply') => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (type === 'edit') {
          handleSaveEdit()
        } else {
          handleSaveReply()
        }
      }
      if (e.key === 'Escape') {
        if (type === 'edit') {
          handleCancelEdit()
        } else {
          handleCancelReply()
        }
      }
    },
    [handleSaveEdit, handleSaveReply, handleCancelEdit, handleCancelReply]
  )

  const showReplies = replies.length > 0 && level < maxLevel

  return (
    <>
      <DeleteDialog />
      <li className="flex items-start gap-3">
        <MemberAvatar
          name={comment.username || comment.authorId}
          className="w-10 h-10 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm px-4 py-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-semibold text-primary text-sm">
                  {comment.username || comment.authorId}
                </span>
                <span
                  className="text-xs text-muted-foreground shrink-0"
                  title={new Date(comment.$createdAt).toLocaleString()}
                >
                  {formatDistanceToNow(new Date(comment.$createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {comment.$updatedAt && comment.$updatedAt !== comment.$createdAt && (
                  <span className="text-xs text-muted-foreground italic shrink-0">
                    (edited)
                  </span>
                )}
              </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      disabled={isDeleting || isUpdating}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit} disabled={isUpdating}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'edit')}
                  rows={3}
                  disabled={isUpdating}
                  className="resize-none"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isUpdating || !editValue.trim()}
                    size="sm"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Press Enter to save, Esc to cancel
                  </span>
                </div>
              </div>
            ) : (
              <>
                <CommentContent
                  content={comment.content}
                  members={members}
                />
                {comment.attachments && comment.attachments.length > 0 && (
                  <CommentAttachments attachments={comment.attachments} />
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    onClick={handleReply}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={isReplying || level >= maxLevel}
                  >
                    <Reply className="mr-1 h-3 w-3" />
                    Reply
                  </Button>
                </div>
              </>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 ml-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyValue}
                  onChange={(e) => setReplyValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'reply')}
                  rows={2}
                  disabled={isAddingReply}
                  className="resize-none"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveReply}
                    disabled={isAddingReply || !replyValue.trim()}
                    size="sm"
                  >
                    {isAddingReply ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Replying...
                      </>
                    ) : (
                      'Reply'
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelReply}
                    variant="outline"
                    size="sm"
                    disabled={isAddingReply}
                  >
                    Cancel
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Press Enter to reply, Esc to cancel
                  </span>
                </div>
              </div>
            </div>
          )}

          {showReplies && (
            <ul className="mt-3 ml-4 pl-4 border-l-2 border-muted space-y-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.$id}
                  comment={reply}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  taskId={taskId}
                  workspaceId={workspaceId}
                  replies={[]}
                  members={members}
                  level={level + 1}
                />
              ))}
            </ul>
          )}
        </div>
      </li>
    </>
  )
}

export const TaskComments = ({
  taskId,
  workspaceId,
  currentUserId,
  currentUserName,
}: TaskCommentsProps) => {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Array<{
    fileId: string
    fileName: string
    fileType: string
    fileSize: number
  }>>([])
  const [mentionState, setMentionState] = useState<{
    show: boolean
    query: string
    position: { top: number; left: number }
    startIndex: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { data: comments = [], isLoading } = useGetComments({ taskId })
  const { data: members } = useGetMembers({ workspaceId })
  const { mutate: addComment, isPending } = useCreateComment()
  const { mutate: uploadFile, isPending: isUploading } = useUploadCommentFile()

  // Organize comments into threads (top-level comments and their replies)
  const organizedComments = useMemo(() => {
    const topLevel: Comment[] = []
    const replyMap = new Map<string, Comment[]>()

    comments.forEach((comment) => {
      if (!comment.parentId) {
        topLevel.push(comment)
      } else {
        if (!replyMap.has(comment.parentId)) {
          replyMap.set(comment.parentId, [])
        }
        replyMap.get(comment.parentId)!.push(comment)
      }
    })

    // Sort replies by creation time
    replyMap.forEach((replies) => {
      replies.sort(
        (a, b) =>
          new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
      )
    })

    return { topLevel, replyMap }
  }, [comments])

  const handleAdd = useCallback(() => {
    if (!value.trim() && attachments.length === 0) return
    
    const mentions = extractMentions(value)
    const mentionUserIds = mentions
      .map((mention) => {
        const member = members?.documents.find(
          (m) => m.name.toLowerCase() === mention.toLowerCase() || m.email.toLowerCase() === mention.toLowerCase()
        )
        return member?.userId
      })
      .filter((id): id is string => !!id)

    addComment(
      {
        taskId,
        content: value.trim(),
        authorId: currentUserId,
        username: currentUserName || currentUserId,
        mentions: mentionUserIds.length > 0 ? mentionUserIds : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: () => {
          setValue('')
          setAttachments([])
        },
      }
    )
  }, [value, attachments, taskId, currentUserId, currentUserName, members, addComment])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

      files.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} exceeds 10MB limit.`)
          return
        }

        uploadFile(
          { file, taskId },
          {
            onSuccess: (data) => {
              setAttachments((prev) => [...prev, data])
            },
          }
        )
      })

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [taskId, uploadFile]
  )

  const handleRemoveAttachment = useCallback((fileId: string) => {
    setAttachments((prev) => prev.filter((att) => att.fileId !== fileId))
  }, [])

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      
      const cursorPosition = e.target.selectionStart
      const textBeforeCursor = newValue.substring(0, cursorPosition)
      
      // Find the last @ mention
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')
      
      if (lastAtIndex !== -1) {
        // Check if there's a space after @ (meaning mention is complete)
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
        const hasSpace = textAfterAt.includes(' ')
        
        if (!hasSpace && textareaRef.current) {
          const mentionQuery = textAfterAt
          const rect = textareaRef.current.getBoundingClientRect()
          
          // Simple position calculation - show below textarea
          setMentionState({
            show: true,
            query: mentionQuery,
            position: {
              top: rect.bottom + 5,
              left: rect.left,
            },
            startIndex: lastAtIndex,
          })
        } else {
          setMentionState(null)
        }
      } else {
        setMentionState(null)
      }
    },
    []
  )

  const handleMentionSelect = useCallback(
    (member: { userId: string; name: string; email: string }) => {
      if (!mentionState || !textareaRef.current) return
      
      const beforeMention = value.substring(0, mentionState.startIndex)
      const afterMention = value.substring(mentionState.startIndex + 1 + mentionState.query.length)
      const newValue = `${beforeMention}@${member.name} ${afterMention}`
      
      setValue(newValue)
      setMentionState(null)
      
      // Set cursor position after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const cursorPos = beforeMention.length + member.name.length + 2 // +2 for @ and space
          textareaRef.current.setSelectionRange(cursorPos, cursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    },
    [mentionState, value]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle mention autocomplete navigation
      if (mentionState?.show) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setMentionState(null)
          return
        }
        // Arrow keys, Enter, and Tab are handled by MentionAutocomplete component
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          return
        }
      }
      
      if (e.key === 'Enter' && !e.shiftKey && !mentionState?.show) {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd, mentionState, members, handleMentionSelect]
  )

  return (
    <div className="rounded-lg border p-4 mt-4 bg-muted/40">
      <p className="text-lg font-semibold mb-4">Comments</p>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading comments...</span>
        </div>
      ) : organizedComments.topLevel.length === 0 ? (
        <div className="italic text-muted-foreground mb-4 text-center py-4">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <ul className="mb-6 space-y-4">
              {organizedComments.topLevel.map((comment) => (
            <CommentItem
              key={comment.$id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              taskId={taskId}
              workspaceId={workspaceId}
              replies={organizedComments.replyMap.get(comment.$id) || []}
              members={members?.documents.map((m) => ({
                userId: m.userId,
                name: m.name,
                email: m.email,
              }))}
            />
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm relative">
        <Textarea
          ref={textareaRef}
          placeholder="Add a comment... Use @ to mention someone (Press Enter to submit, Shift+Enter for new line)"
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isPending || isUploading}
          className="resize-none"
        />
        {mentionState?.show && members?.documents && (
          <MentionAutocomplete
            members={members.documents.map((m) => ({
              userId: m.userId,
              name: m.name,
              email: m.email,
            }))}
            query={mentionState.query}
            onSelect={handleMentionSelect}
            position={mentionState.position}
            onSelectFirst={() => {
              const filteredMembers = members.documents.filter(
                (m) =>
                  m.name.toLowerCase().includes(mentionState.query.toLowerCase()) ||
                  m.email.toLowerCase().includes(mentionState.query.toLowerCase())
              )
              if (filteredMembers.length > 0) {
                handleMentionSelect({
                  userId: filteredMembers[0].userId,
                  name: filteredMembers[0].name,
                  email: filteredMembers[0].email,
                })
              }
            }}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        {attachments.length > 0 && (
          <CommentAttachments
            attachments={attachments}
            onRemove={handleRemoveAttachment}
            canRemove
          />
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || isUploading}
              className="h-8"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach
            </Button>
            <span className="text-xs text-muted-foreground">
              Use @ to mention • Press Enter to submit
            </span>
          </div>
          <Button
            onClick={handleAdd}
            disabled={isPending || isUploading || (!value.trim() && attachments.length === 0)}
            size="sm"
          >
            {isPending || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading...' : 'Adding...'}
              </>
            ) : (
              'Add Comment'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
