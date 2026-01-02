/**
 * Batch Query Utilities
 * 
 * Utilities for batching database queries to avoid Appwrite limits
 * and reduce the number of database calls.
 * 
 * @module lib/db/batch-queries
 */

import { type Models, Query } from 'node-appwrite';

/**
 * Batch query for documents by IDs
 * 
 * Appwrite limits: max 100 items in query array, max 4096 chars per query string
 * This function handles batching automatically for large arrays.
 * 
 * @param databases - Appwrite databases instance
 * @param databaseId - Database ID
 * @param collectionId - Collection ID
 * @param ids - Array of document IDs to fetch
 * @param chunkSize - Size of each batch (default: 50, safe limit)
 * @returns Combined list of documents
 */
export async function batchQueryContains<T extends Models.Document>(
  databases: any,
  databaseId: string,
  collectionId: string,
  ids: string[],
  chunkSize: number = 50,
): Promise<Models.DocumentList<T>> {
  if (ids.length === 0) {
    return { documents: [], total: 0 };
  }

  // If array is small enough, make a single query
  if (ids.length <= chunkSize) {
    return (await databases.listDocuments(databaseId, collectionId, [
      Query.contains('$id', ids),
    ])) as Models.DocumentList<T>;
  }

  // Otherwise, batch into chunks and combine results
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      databases.listDocuments(databaseId, collectionId, [
        Query.contains('$id', chunk),
      ]) as Promise<Models.DocumentList<T>>,
    ),
  );

  // Combine all results and deduplicate by $id
  const allDocuments = results.flatMap((result) => result.documents);
  const uniqueDocuments = Array.from(
    new Map(allDocuments.map((doc) => [doc.$id, doc])).values(),
  );

  return {
    documents: uniqueDocuments,
    total: uniqueDocuments.length,
  };
}
