import { IMAGES_BUCKET_ID } from '@/config/db';

/**
 * Get bill file URL from Appwrite storage
 * Constructs the public URL for viewing/downloading expense bills
 * 
 * @param fileId - File ID from Appwrite storage
 * @returns Public URL to view the bill file
 */
export const getBillUrl = (fileId: string): string => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  
  if (!endpoint || !projectId) {
    throw new Error('Appwrite endpoint or project ID is not configured');
  }
  
  return `${endpoint}/storage/buckets/${IMAGES_BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
};
