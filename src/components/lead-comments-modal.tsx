"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Comment, CreateCommentData, Lead, validateCreateComment } from "../../data/lead-schema"
import { format } from "date-fns"
import { MessageSquare, Send, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Textarea } from "./ui/textarea"
import { useAddComment } from "@/features/leads/api/use-add-comment"
import { useDeleteComment } from "@/features/leads/api/use-delete-comment"
import { useGetLeads } from "@/features/leads/api/use-get-leads"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useCurrent } from "@/features/auth/api/use-current"
import { useAdminStatus } from "@/features/attendance/hooks/use-admin-status"

interface LeadCommentsModalProps {
    lead: Lead
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LeadCommentsModal({ lead, open, onOpenChange }: LeadCommentsModalProps) {
    const workspaceId = useWorkspaceId()
    const { data: user } = useCurrent()
    const { data: isAdmin } = useAdminStatus()
    const { data: leadsData, refetch: refetchLeads } = useGetLeads({ workspaceId })
    const { mutate: addComment, isPending: isAddingComment } = useAddComment()
    const { mutate: deleteComment } = useDeleteComment()

    // Get updated lead from refetched data
    const updatedLead = leadsData?.documents?.find((l) => l.id === lead.id) || lead
    const [commentText, setCommentText] = useState("")
    const [comments, setComments] = useState<Comment[]>(updatedLead.comments || [])

    // Update comments when lead changes
    useEffect(() => {
        setComments(updatedLead.comments || [])
    }, [updatedLead.comments])

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault()

        if (!commentText.trim()) {
            toast.error("Comment cannot be empty")
            return
        }

        const commentData: CreateCommentData = { content: commentText.trim() }
        const validation = validateCreateComment(commentData)

        if (!validation.success) {
            toast.error("Invalid comment data")
            return
        }

        addComment(
            {
                leadId: lead.id,
                commentData: validation.data,
                workspaceId,
            },
            {
                onSuccess: () => {
                    setCommentText("")
                    refetchLeads()
                },
            }
        )
    }

    const handleDeleteComment = (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) {
            return
        }

        deleteComment(
            {
                leadId: lead.id,
                commentId,
                workspaceId,
            },
            {
                onSuccess: () => {
                    refetchLeads()
                },
            }
        )
    }

    const canDeleteComment = (comment: Comment) => {
        if (!user) return false
        return comment.authorId === user.$id || isAdmin
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comments - {lead.name}
                    </DialogTitle>
                    <DialogDescription>
                        Add comments and track communication with this lead
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Lead Info */}
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="" alt={lead.name} />
                                <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {lead.company}{lead.email ? ` • ${lead.email}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No comments yet</p>
                                <p className="text-sm">Be the first to add a comment!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src="" alt={comment.authorName} />
                                        <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm">{comment.authorName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                                            </span>
                                            {canDeleteComment(comment) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 ml-auto"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                        <Textarea
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 min-h-[80px] resize-none"
                            disabled={isAddingComment}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isAddingComment || !commentText.trim()}
                            className="self-end"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
