import { type Databases, Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite'
import { DATABASE_ID, MEMBERS_ID } from '@/config/db'
import { type Member } from '@/features/members/types'

/**
 * Get email addresses for members by their member IDs
 */
export const getMemberEmails = async (databases: Databases, memberIds: string[]): Promise<Map<string, string>> => {
  if (memberIds.length === 0) return new Map()

  const { users } = await createAdminClient()
  const emailMap = new Map<string, string>()

  // Get all members
  const members = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
    Query.contains('$id', memberIds),
  ])

  // Get user emails for each member
  await Promise.all(
    members.documents.map(async (member) => {
      try {
        const user = await users.get(member.userId)
        if (user.email) {
          emailMap.set(member.$id, user.email)
        }
      } catch (error) {
        console.error(`Failed to get email for member ${member.$id}:`, error)
      }
    })
  )

  return emailMap
}

/**
 * Get email address for a single member by member ID
 */
export const getMemberEmail = async (databases: Databases, memberId: string): Promise<string | null> => {
  const { users } = await createAdminClient()

  try {
    const member = await databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)
    const user = await users.get(member.userId)
    return user.email || null
  } catch (error) {
    console.error(`Failed to get email for member ${memberId}:`, error)
    return null
  }
}

/**
 * Get email address for a user by user ID
 */
export const getUserEmail = async (userId: string): Promise<string | null> => {
  const { users } = await createAdminClient()

  try {
    const user = await users.get(userId)
    return user.email || null
  } catch (error) {
    console.error(`Failed to get email for user ${userId}:`, error)
    return null
  }
}

