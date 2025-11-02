import { Suspense } from 'react'

import { PageLoader } from '@/components/page-loader'
import { NDAPageClient } from './nda-page-client'

export default function NDAPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<PageLoader />}>
        <NDAPageClient />
      </Suspense>
    </div>
  )
}
