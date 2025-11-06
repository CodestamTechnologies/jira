import { type Databases, Query } from 'node-appwrite';

import { DATABASE_ID, MEMBERS_ID } from '@/config/db';
import { type Member } from './types';

interface GetMemberProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
  checkActive?: boolean; // If true, returns null for inactive members
}

export const getMember = async ({ databases, workspaceId, userId, checkActive = false }: GetMemberProps) => {
  const members = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
    Query.equal('workspaceId', workspaceId),
    Query.equal('userId', userId),
  ]);

  const member = members.documents[0];

  // If checkActive is true and member is inactive, return null
  if (checkActive && member && member.isActive === false) {
    return null;
  }

  return member;
};
