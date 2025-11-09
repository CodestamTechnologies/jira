'use client'

import { useState } from 'react'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { TemplateBuilder } from '@/components/pdf-template-builder/template-builder'
import { useCreateTemplate } from '@/features/pdf-templates/api/use-create-template'
import { useGetTemplates } from '@/features/pdf-templates/api/use-get-templates'
import { useUpdateTemplate } from '@/features/pdf-templates/api/use-update-template'
import { useDeleteTemplate } from '@/features/pdf-templates/api/use-delete-template'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Edit2, Plus } from 'lucide-react'
import type { PDFTemplate } from '@/lib/pdf/template/types'
import type { PDFTemplateDocument } from '@/features/pdf-templates/types'

export function PDFEditorPageClient() {
  const workspaceId = useWorkspaceId()
  const { data: templatesData, isLoading } = useGetTemplates({ workspaceId })
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate()
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTemplate()
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate()

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<PDFTemplateDocument | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const templates = templatesData?.data?.documents || []

  const handleSave = (template: PDFTemplate) => {
    if (editingTemplate) {
      // Update existing template
      updateTemplate(
        {
          id: editingTemplate.$id,
          data: {
            name: template.name,
            description: template.description,
            category: template.category,
            templateConfig: JSON.stringify(template),
            version: template.version,
          },
        },
        {
          onSuccess: () => {
            setEditingTemplate(null)
            setSelectedTemplateId(null)
          },
        }
      )
    } else {
      // Create new template
      createTemplate(
        {
          json: {
            name: template.name,
            description: template.description,
            category: template.category,
            templateConfig: JSON.stringify(template),
            workspaceId: workspaceId!,
            isDefault: false,
            version: template.version,
          },
        },
        {
          onSuccess: () => {
            setIsCreatingNew(false)
          },
        }
      )
    }
  }

  const handleLoadTemplate = (templateDoc: PDFTemplateDocument) => {
    try {
      const template = JSON.parse(templateDoc.templateConfig) as PDFTemplate
      setEditingTemplate(templateDoc)
      setSelectedTemplateId(templateDoc.$id)
    } catch (error) {
      console.error('Error parsing template config:', error)
    }
  }

  const getTemplateForEditor = (): PDFTemplate | undefined => {
    if (editingTemplate) {
      try {
        return JSON.parse(editingTemplate.templateConfig) as PDFTemplate
      } catch {
        return undefined
      }
    }
    return undefined
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(
        { id: templateId, workspaceId: workspaceId! },
        {
          onSuccess: () => {
            if (editingTemplate?.$id === templateId) {
              setEditingTemplate(null)
              setSelectedTemplateId(null)
            }
          },
        }
      )
    }
  }

  const handleNewTemplate = () => {
    setIsCreatingNew(true)
    setEditingTemplate(null)
    setSelectedTemplateId(null)
  }

  const handleCancel = () => {
    setIsCreatingNew(false)
    setEditingTemplate(null)
    setSelectedTemplateId(null)
  }

  // Show template builder if creating new or editing
  if (isCreatingNew || editingTemplate) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PDF Template Builder</CardTitle>
                <CardDescription>
                  {isCreatingNew
                    ? 'Create a new PDF template by adding sections and defining fields'
                    : `Editing: ${editingTemplate?.name}`}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardHeader>
        </Card>
        <TemplateBuilder
          initialTemplate={getTemplateForEditor()}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  // Show template list
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PDF Templates</CardTitle>
              <CardDescription>
                Create and manage PDF templates for documents like joining letters, NDAs, invoices, etc.
              </CardDescription>
            </div>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">No templates yet</p>
              <Button onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template: PDFTemplateDocument) => (
                <div
                  key={template.$id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50"
                >
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    {template.category && (
                      <span className="text-xs text-muted-foreground">Category: {template.category}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.$id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
