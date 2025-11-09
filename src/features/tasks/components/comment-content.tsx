'use client'

import { renderCommentContent } from '../utils/comment-utils'

interface CommentMember {
  userId: string
  name: string
  email: string
}

interface CommentContentProps {
  content: string
  members?: CommentMember[]
}

export const CommentContent = ({ content, members }: CommentContentProps) => {
  const rendered = renderCommentContent(
    content,
    members
  )

  return (
    <div
      className="text-sm whitespace-pre-line break-words"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}
