'use client'

import { useState, useEffect } from 'react'
import { FileText, Save, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TemplateFormBuilder } from './template-form-builder'
import { PDFPreview } from './pdf-preview'
import type { PDFTemplate, TemplateData } from '@/lib/pdf/template/types'
import { DEFAULT_TEMPLATES } from '@/lib/pdf/template/default-templates'
import { useDownloadWithLogging } from '@/lib/pdf/use-download-with-logging'
import { generateSafeFilename } from '@/lib/pdf/utils'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'

interface PDFTemplateEditorProps {
  template?: PDFTemplate
  onSave?: (template: PDFTemplate, data: TemplateData) => void
  onClose?: () => void
}

/**
 * Main PDF Template Editor Component
 * Allows users to edit template data and see live preview
 */
export const PDFTemplateEditor: React.FC<PDFTemplateEditorProps> = ({
  template: initialTemplate,
  onSave,
  onClose,
}) => {
  const workspaceId = useWorkspaceId()
  const { downloadWithLogging } = useDownloadWithLogging()

  const [template, setTemplate] = useState<PDFTemplate>(
    initialTemplate || DEFAULT_TEMPLATES[0]
  )
  const [data, setData] = useState<TemplateData>({})
  const [templateName, setTemplateName] = useState(template.name || '')
  const [templateDescription, setTemplateDescription] = useState(
    template.description || ''
  )

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate)
      setTemplateName(initialTemplate.name)
      setTemplateDescription(initialTemplate.description || '')
    }
  }, [initialTemplate])

  const handleDataChange = (newData: TemplateData) => {
    setData(newData)
  }

  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = DEFAULT_TEMPLATES.find((t) => t.id === templateId)
    if (selectedTemplate) {
      setTemplate(selectedTemplate)
      setTemplateName(selectedTemplate.name)
      setTemplateDescription(selectedTemplate.description || '')
      setData({}) // Reset data when template changes
    }
  }

  const handleSave = () => {
    const updatedTemplate: PDFTemplate = {
      ...template,
      name: templateName,
      description: templateDescription,
      updatedAt: new Date().toISOString(),
    }

    if (onSave) {
      onSave(updatedTemplate, data)
    }
  }

  const handleDownload = async (blob: Blob, filename: string) => {
    await downloadWithLogging({
      documentType: 'INVOICE', // Could be dynamic based on template category
      blob,
      filename,
      documentName: templateName,
      workspaceId,
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Template Editor
              </CardTitle>
              <CardDescription>
                Edit template data and see live PDF preview
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onSave && (
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Template Selection */}
      {!initialTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Select Template</CardTitle>
            <CardDescription>Choose a template to start editing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="template-select">Template</Label>
              <Select value={template.id} onValueChange={handleTemplateSelect}>
                <SelectTrigger id="template-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.category && `(${t.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Enter template description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form Builder */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Edit Data</CardTitle>
            <CardDescription>Fill in the template fields</CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[calc(100vh-400px)]">
            <TemplateFormBuilder
              template={template}
              data={data}
              onChange={handleDataChange}
            />
          </CardContent>
        </Card>

        {/* PDF Preview */}
        <div className="h-full">
          <PDFPreview
            template={template}
            data={data}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  )
}
