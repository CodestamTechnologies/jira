'use client'

import { useState, useEffect, useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Eye, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TemplateRenderer from '@/lib/pdf/template/renderer'
import type { PDFTemplate, TemplateData } from '@/lib/pdf/template/types'
import { TemplateFormBuilder } from '@/components/pdf-editor/template-form-builder'

interface TemplatePreviewProps {
  template: PDFTemplate
  data: TemplateData
  onDataChange: (data: TemplateData) => void
}

/**
 * Preview component for template builder
 * Shows form to fill data and live PDF preview
 */
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  data,
  onDataChange,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePreview = useCallback(async () => {
    setIsGenerating(true)
    try {
      const doc = <TemplateRenderer template={template} data={data} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl)
        return url
      })
    } catch (err) {
      console.error('Error generating preview:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [template, data])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePreview()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [generatePreview])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateFormBuilder template={template} data={data} onChange={onDataChange} />
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              PDF Preview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generatePreview}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-[600px] border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


