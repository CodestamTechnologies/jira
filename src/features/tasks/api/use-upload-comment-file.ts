import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface UploadFileResponse {
  fileId: string
  fileName: string
  fileType: string
  fileSize: number
}

export const useUploadCommentFile = () => {
  const mutation = useMutation({
    mutationFn: async ({ file, taskId }: { file: File; taskId: string }): Promise<UploadFileResponse> => {
      const formData = new FormData()
      formData.append('file', file)

      const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || ''
      const response = await fetch(`${baseUrl}/api/tasks/${taskId}/comments/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file.')
      }

      const { data } = await response.json()
      return data
    },
    onError: (error) => {
      console.error('[UPLOAD_COMMENT_FILE]: ', error)
      toast.error(error.message || 'Failed to upload file.')
    },
  })

  return mutation
}
