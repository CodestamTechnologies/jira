'use server';

import { type Models, Query } from 'node-appwrite';

import { DATABASE_ID, IMAGES_BUCKET_ID, MEMBERS_ID, WORKSPACES_ID } from '@/config/db';
import { createSessionClient } from '@/lib/appwrite';
import { getCachedImagesBatch } from '@/lib/cache/image-cache';

export const getWorkspaces = async () => {
  try {
    const { account, databases, storage } = await createSessionClient();

    const user = await account.get();
    const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [Query.equal('userId', user.$id)]);

    if (members.total === 0) return { documents: [], total: 0 };

    const workspaceIds = members.documents.map((member) => member.workspaceId);

    const workspaces = await databases.listDocuments(DATABASE_ID, WORKSPACES_ID, [
      Query.contains('$id', workspaceIds),
      Query.orderDesc('$createdAt'),
    ]);

    // Batch fetch all workspace images at once (much more efficient)
    const workspaceImageIds = workspaces.documents
      .map((w) => w.imageId)
      .filter((id): id is string => Boolean(id));
    const workspaceImages = await getCachedImagesBatch(storage, IMAGES_BUCKET_ID, workspaceImageIds);

    const workspacesWithImages: Models.Document[] = workspaces.documents.map((workspace) => {
      const imageUrl = workspace.imageId ? workspaceImages.get(workspace.imageId) : undefined;
      return {
        ...workspace,
        imageUrl,
      };
    });

    return {
      documents: workspacesWithImages,
      total: workspaces.total,
    };
  } catch {
    return { documents: [], total: 0 };
  }
};
