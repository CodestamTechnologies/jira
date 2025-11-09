import { IMAGES_BUCKET_ID } from '@/config/db'

/**
 * Get file URL from Appwrite storage
 * This should be called from the server or use a proper Appwrite client
 */
export const getFileUrl = (fileId: string): string => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
  return `${endpoint}/storage/buckets/${IMAGES_BUCKET_ID}/files/${fileId}/view?project=${projectId}`
}
