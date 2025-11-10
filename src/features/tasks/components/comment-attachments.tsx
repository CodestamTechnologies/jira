'use client'

import { X, Image as ImageIcon, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getFileUrl } from '../utils/get-file-url'
import { formatFileSize, isImageFile } from '../utils/comment-utils'
import { type Attachment } from '../types'
import { cn } from '@/lib/utils'

interface CommentAttachmentsProps {
  attachments: Attachment[]
  onRemove?: (fileId: string) => void
  canRemove?: boolean
}

export const CommentAttachments = ({
  attachments,
  onRemove,
  canRemove = false,
}: CommentAttachmentsProps) => {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        const isImage = isImageFile(attachment.fileType)
        // Use fileUrl if provided (base64 for images), otherwise fallback to download URL
        const fileUrl = attachment.fileUrl || getFileUrl(attachment.fileId)

        return (
          <div
            key={attachment.fileId}
            className="relative group border rounded-lg p-2 bg-muted/50 w-fit"
          >
            {isImage ? (
              <div className="space-y-2">
                <img
                  src={attachment.fileUrl || getFileUrl(attachment.fileId)}
                  alt={attachment.fileName}
                  className="max-w-full max-h-64 rounded-md object-contain"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    // If already using fileUrl, try the other source
                    if (target.src.includes('data:')) {
                      target.src = getFileUrl(attachment.fileId);
                    } else if (attachment.fileUrl) {
                      target.src = attachment.fileUrl;
                    }
                  }}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span className="truncate flex-1">{attachment.fileName}</span>
                  <span>{formatFileSize(attachment.fileSize)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {attachment.fileName}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </span>
                </div>
              </div>
            )}
            {canRemove && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                )}
                onClick={() => onRemove(attachment.fileId)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
