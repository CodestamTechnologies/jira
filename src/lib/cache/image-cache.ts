/**
 * Image Cache Utility
 * 
 * In-memory cache for base64-encoded images to reduce storage API calls.
 * Images are cached by their file ID with a TTL to prevent stale data.
 * 
 * This significantly reduces database/storage reads when the same images
 * are requested multiple times within a short period.
 * 
 * @module lib/cache/image-cache
 */

import type { Storage } from 'node-appwrite';

/**
 * Cached image entry structure
 */
interface CachedImage {
  base64: string;
  timestamp: number;
}

/**
 * Cache configuration
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of images to cache

/**
 * In-memory cache for images
 * Key: fileId, Value: { base64: string, timestamp: number }
 */
const imageCache = new Map<string, CachedImage>();

/**
 * Get cached image or fetch and cache it
 * 
 * @param storage - Appwrite storage instance
 * @param bucketId - Storage bucket ID
 * @param fileId - File ID to fetch
 * @returns Base64-encoded image string or undefined if not found
 */
/**
 * Get cached image or fetch and cache it
 * 
 * @param storage - Appwrite storage instance
 * @param bucketId - Storage bucket ID
 * @param fileId - File ID to fetch
 * @returns Base64-encoded image string or undefined if not found
 */
export async function getCachedImage(
  storage: Storage,
  bucketId: string,
  fileId: string
): Promise<string | undefined> {
  if (!fileId) return undefined;

  // Check cache first
  const cached = imageCache.get(fileId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.base64;
  }

  // Cache miss or expired - fetch from storage
  try {
    const arrayBuffer = await storage.getFileView(bucketId, fileId);
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'image/png'; // Default, could be detected from file metadata

    // Cache the result
    setCachedImage(fileId, base64);

    return base64;
  } catch (error) {
    console.error(`[ImageCache] Failed to fetch image ${fileId}:`, error);
    return undefined;
  }
}

/**
 * Get cached image with full data URL
 * 
 * @param storage - Appwrite storage instance
 * @param bucketId - Storage bucket ID
 * @param fileId - File ID to fetch
 * @param mimeType - MIME type for data URL (default: image/png)
 * @returns Data URL string or undefined if not found
 */
/**
 * Get cached image with full data URL
 * 
 * @param storage - Appwrite storage instance
 * @param bucketId - Storage bucket ID
 * @param fileId - File ID to fetch
 * @param mimeType - MIME type for data URL (default: image/png)
 * @returns Data URL string or undefined if not found
 */
export async function getCachedImageDataUrl(
  storage: Storage,
  bucketId: string,
  fileId: string,
  mimeType: string = 'image/png'
): Promise<string | undefined> {
  const base64 = await getCachedImage(storage, bucketId, fileId);
  if (!base64) return undefined;
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Batch fetch multiple images with caching
 * 
 * @param storage - Appwrite storage instance
 * @param bucketId - Storage bucket ID
 * @param fileIds - Array of file IDs to fetch
 * @param mimeType - MIME type for data URLs (default: image/png)
 * @returns Map of fileId -> data URL
 */
/**
 * Batch fetch multiple images with caching
 * 
 * This is more efficient than fetching images individually as it:
 * - Checks cache for all images first
 * - Only fetches uncached images
 * - Fetches uncached images in parallel
 * 
 * @param storage - Appwrite storage instance
 * @param bucketId - Storage bucket ID
 * @param fileIds - Array of file IDs to fetch
 * @param mimeType - MIME type for data URLs (default: image/png)
 * @returns Map of fileId -> data URL
 */
export async function getCachedImagesBatch(
  storage: Storage,
  bucketId: string,
  fileIds: string[],
  mimeType: string = 'image/png'
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const uncachedIds: string[] = [];

  // Check cache for all images
  const now = Date.now();
  for (const fileId of fileIds) {
    if (!fileId) continue;

    const cached = imageCache.get(fileId);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      results.set(fileId, `data:${mimeType};base64,${cached.base64}`);
    } else {
      uncachedIds.push(fileId);
    }
  }

  // Fetch uncached images in parallel
  if (uncachedIds.length > 0) {
    const fetchPromises = uncachedIds.map(async (fileId) => {
      try {
        const arrayBuffer = await storage.getFileView(bucketId, fileId);
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        setCachedImage(fileId, base64);
        return { fileId, base64 };
      } catch (error) {
        console.error(`[ImageCache] Failed to fetch image ${fileId}:`, error);
        return null;
      }
    });

    const fetched = await Promise.all(fetchPromises);
    for (const result of fetched) {
      if (result) {
        results.set(result.fileId, `data:${mimeType};base64,${result.base64}`);
      }
    }
  }

  return results;
}

/**
 * Set cached image
 * 
 * @param fileId - File ID
 * @param base64 - Base64-encoded image
 */
function setCachedImage(fileId: string, base64: string): void {
  // Implement LRU eviction if cache is too large
  if (imageCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple FIFO for now)
    const firstKey = imageCache.keys().next().value;
    if (firstKey) {
      imageCache.delete(firstKey);
    }
  }

  imageCache.set(fileId, {
    base64,
    timestamp: Date.now(),
  });
}

/**
 * Clear expired cache entries
 * Call this periodically to prevent memory leaks
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  imageCache.forEach((cached, fileId) => {
    if (now - cached.timestamp >= CACHE_TTL) {
      keysToDelete.push(fileId);
    }
  });
  keysToDelete.forEach((key) => imageCache.delete(key));
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: imageCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL,
  };
}
