import { redirect } from 'next/navigation'

import { getCurrent } from '@/features/auth/queries'

import { PDFEditorPageClient } from './pdf-editor-page-client'

const PDFEditorPage = async () => {
  const user = await getCurrent()

  if (!user) redirect('/sign-in')

  return <PDFEditorPageClient />
}

export default PDFEditorPage
