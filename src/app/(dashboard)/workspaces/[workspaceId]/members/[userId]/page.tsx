import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getCurrent } from '@/features/auth/queries'
import { PageLoader } from '@/components/page-loader'
import { MemberDetailClient } from './member-detail-client'

interface MemberDetailPageProps {
  params: {
    workspaceId: string
    userId: string
  }
}

const MemberDetailPage = async ({ params }: MemberDetailPageProps) => {
  const user = await getCurrent()

  if (!user) redirect('/sign-in')

  return (
    <div className="space-y-6 p-6">
      <Suspense fallback={<PageLoader />}>
        <MemberDetailClient
          workspaceId={params.workspaceId}
          userId={params.userId}
        />
      </Suspense>
    </div>
  )
}

export default MemberDetailPage
