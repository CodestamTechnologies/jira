/**
 * Extract user mentions from comment content
 * Matches @username patterns
 */
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g
  const matches = content.match(mentionRegex)
  if (!matches) return []
  
  // Extract usernames (remove @ symbol)
  return matches.map(match => match.substring(1))
}

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file is an image
 */
export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/')
}

/**
 * Simple markdown-like text renderer
 * Supports: **bold**, *italic*, `code`, links, line breaks
 */
export const renderCommentContent = (content: string, members?: Array<{ userId: string; name: string; email: string }>): string => {
  let rendered = content
  
  // Replace @mentions with highlighted text
  if (members) {
    members.forEach(member => {
      const mentionPattern = new RegExp(`@${member.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
      rendered = rendered.replace(mentionPattern, `<span class="font-semibold text-primary">@${member.name}</span>`)
    })
  }
  
  // Replace **bold**
  rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Replace *italic*
  rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // Replace `code`
  rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
  
  // Replace links (simple URL detection)
  const urlRegex = /(https?:\/\/[^\s]+)/g
  rendered = rendered.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
  
  // Replace line breaks
  rendered = rendered.replace(/\n/g, '<br />')
  
  return rendered
}
