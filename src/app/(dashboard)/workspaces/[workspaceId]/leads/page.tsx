import { redirect } from 'next/navigation'
import { LeadsPageClient } from './leads-page-client'
import { getCurrent } from '@/features/auth/queries'
import { createAdminClient } from '@/lib/appwrite'
import { checkLeadsAccess } from '@/features/members/utils/permissions'

/**
 * Leads page with server-side access control
 * Uses scalable permission system to check access before rendering
 */
export default async function LeadsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const user = await getCurrent()

  if (!user) {
    redirect('/sign-in')
  }

  // Check if user has access to leads using scalable permission system
  const { databases } = await createAdminClient()
  const accessResult = await checkLeadsAccess(databases, workspaceId, user.$id)

  if (!accessResult.hasAccess) {
    // Redirect to workspace home if no access
    redirect(`/workspaces/${workspaceId}`)
  }

  return <LeadsPageClient />
}
