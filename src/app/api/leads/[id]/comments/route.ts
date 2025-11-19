import { NextRequest, NextResponse } from 'next/server'
import { ID } from 'node-appwrite'

import { DATABASE_ID, LEADS_ID } from '@/config/db'
import { MemberRole } from '@/features/members/types'
import { getMember } from '@/features/members/utils'
import { createSessionClient } from '@/lib/appwrite'
import { validateCreateComment } from '../../../../../../data/lead-schema'

// Add comment to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    const commentData = await request.json()

    // Validate comment data
    const validation = validateCreateComment(commentData)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid comment data', details: validation.error.issues },
        { status: 400 }
      )
    }

    if (!LEADS_ID) {
      return NextResponse.json(
        { error: 'Leads collection is not configured.' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { account, databases } = await createSessionClient()
    const user = await account.get()

    // Get current lead
    const leadDoc = await databases.getDocument(
      DATABASE_ID,
      LEADS_ID,
      leadId
    )

    if (!leadDoc) {
      return NextResponse.json(
        { error: 'Lead not found.' },
        { status: 404 }
      )
    }

    // Verify user has access to workspace
    const member = await getMember({
      databases,
      workspaceId: leadDoc.workspaceId,
      userId: user.$id,
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    // Regular members can only comment on leads they are assigned to
    const isAdmin = member.role === MemberRole.ADMIN
    if (!isAdmin) {
      const assigneeIds = leadDoc.assigneeIds
        ? (typeof leadDoc.assigneeIds === 'string' ? JSON.parse(leadDoc.assigneeIds) : leadDoc.assigneeIds)
        : []
      if (!assigneeIds.includes(member.$id)) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only comment on leads assigned to you.' },
          { status: 403 }
        )
      }
    }

    // Parse existing comments
    const comments = leadDoc.comments
      ? (typeof leadDoc.comments === 'string' ? JSON.parse(leadDoc.comments) : leadDoc.comments)
      : []

    // Create new comment
    const newComment = {
      id: ID.unique(),
      content: validation.data.content,
      authorId: user.$id,
      authorName: user.name || user.email || 'Unknown',
      authorEmail: user.email || '',
      createdAt: new Date().toISOString(),
    }

    // Add comment to array
    comments.push(newComment)

    // Update lead with new comments
    await databases.updateDocument(
      DATABASE_ID,
      LEADS_ID,
      leadId,
      {
        comments: JSON.stringify(comments),
      }
    )

    return NextResponse.json(
      { success: true, data: newComment },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding comment:', error)

    if (error.message === 'Unauthorized.') {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Lead not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    )
  }
}

