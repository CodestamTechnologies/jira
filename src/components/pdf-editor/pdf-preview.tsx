'use client'

import { useState, useEffect, useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Eye, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TemplateRenderer from '@/lib/pdf/template/renderer'
import type { PDFTemplate, TemplateData } from '@/lib/pdf/template/types'
import { generateSafeFilename } from '@/lib/pdf/utils'

interface PDFPreviewProps {
  template: PDFTemplate
  data: TemplateData
  onDownload?: (blob: Blob, filename: string) => void
}

/**
 * Live PDF preview component
 */
export const PDFPreview: React.FC<PDFPreviewProps> = ({ template, data, onDownload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePreview = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const doc = <TemplateRenderer template={template} data={data} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      
      // Revoke old URL if exists
      setPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        return url
      })
    } catch (err) {
      console.error('Error generating PDF preview:', err)
      setError('Failed to generate preview. Please check your template configuration.')
    } finally {
      setIsGenerating(false)
    }
  }, [template, data])

  useEffect(() => {
    // Auto-generate preview when data changes
    const timeoutId = setTimeout(() => {
      generatePreview()
    }, 500) // Debounce for 500ms

    return () => {
      clearTimeout(timeoutId)
    }
  }, [generatePreview])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleDownload = async () => {
    if (!previewUrl) return

    try {
      setIsGenerating(true)
      const doc = <TemplateRenderer template={template} data={data} />
      const blob = await pdf(doc).toBlob()
      const filename = generateSafeFilename(template.name.toLowerCase().replace(/\s+/g, '-'), 'pdf')

      if (onDownload) {
        onDownload(blob, filename)
      } else {
        // Fallback download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error downloading PDF:', err)
      setError('Failed to download PDF.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          PDF Preview
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isGenerating || !previewUrl}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {error ? (
          <div className="p-4 text-sm text-destructive">{error}</div>
        ) : isGenerating && !previewUrl ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating preview...</p>
            </div>
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full min-h-[600px] border-0"
            title="PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground">Preview will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
