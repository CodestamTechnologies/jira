import { type Models } from 'node-appwrite'
import type { PDFTemplate } from '@/lib/pdf/template/types'

export type PDFTemplateDocument = Models.Document & {
  name: string
  description?: string
  category?: string
  templateConfig: string // JSON stringified PDFTemplate
  workspaceId: string
  isDefault: boolean
  createdBy: string
  version: string
}

