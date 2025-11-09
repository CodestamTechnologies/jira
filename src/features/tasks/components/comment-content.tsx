'use client'

import { renderCommentContent } from '../utils/comment-utils'
import type { Member } from '@/features/members/types'

interface CommentContentProps {
  content: string
  members?: Member[]
}

export const CommentContent = ({ content, members }: CommentContentProps) => {
  const rendered = renderCommentContent(
    content,
    members?.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
    }))
  )

  return (
    <div
      className="text-sm whitespace-pre-line break-words"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}
