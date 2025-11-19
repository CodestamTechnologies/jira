import { NextRequest, NextResponse } from 'next/server'

import { DATABASE_ID, LEADS_ID } from '@/config/db'
import { MemberRole } from '@/features/members/types'
import { getMember } from '@/features/members/utils'
import { createSessionClient } from '@/lib/appwrite'

// Delete comment from lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: leadId, commentId } = await params

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

    // Parse existing comments
    const comments = leadDoc.comments
      ? (typeof leadDoc.comments === 'string' ? JSON.parse(leadDoc.comments) : leadDoc.comments)
      : []

    // Find comment
    const commentIndex = comments.findIndex((c: any) => c.id === commentId)

    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found.' },
        { status: 404 }
      )
    }

    const comment = comments[commentIndex]

    // Regular members can only delete their own comments, admins can delete any comment
    const isAdmin = member.role === MemberRole.ADMIN
    if (!isAdmin && comment.authorId !== user.$id) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only delete your own comments.' },
        { status: 403 }
      )
    }

    // Remove comment
    comments.splice(commentIndex, 1)

    // Update lead with updated comments
    await databases.updateDocument(
      DATABASE_ID,
      LEADS_ID,
      leadId,
      {
        comments: JSON.stringify(comments),
      }
    )

    return NextResponse.json({ success: true, data: { success: true } })
  } catch (error: any) {
    console.error('Error deleting comment:', error)

    if (error.message === 'Unauthorized.') {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Lead or comment not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

