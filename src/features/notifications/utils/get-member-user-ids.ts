import type { Databases } from 'node-appwrite';
import { Query } from 'node-appwrite';
import { DATABASE_ID, MEMBERS_ID } from '@/config/db';
import type { Member } from '@/features/members/types';

/**
 * Convert member IDs to user IDs
 * Utility function to avoid code duplication when creating notifications
 * 
 * @param databases - Appwrite databases instance
 * @param memberIds - Array of member IDs to convert
 * @returns Array of user IDs
 */
export async function getMemberUserIds(
  databases: Databases,
  memberIds: string[]
): Promise<string[]> {
  if (memberIds.length === 0) return [];

  // Use batch query for large arrays (following existing codebase pattern)
  const members = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
    Query.contains('$id', memberIds),
  ]);

  return members.documents.map((member) => member.userId);
}

