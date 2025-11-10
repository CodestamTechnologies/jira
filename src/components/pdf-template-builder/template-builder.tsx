'use client'

import { useState } from 'react'
import { Plus, GripVertical, Trash2, Edit2, Eye, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SectionEditor } from './section-editor'
import { TemplatePreview } from './template-preview'
import type { PDFTemplate, TemplateSection } from '@/lib/pdf/template/types'

interface TemplateBuilderProps {
  initialTemplate?: PDFTemplate
  onSave: (template: PDFTemplate) => void
  onCancel?: () => void
}

/**
 * Visual PDF Template Builder
 * Allows users to create/edit PDF template structures
 */
export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  initialTemplate,
  onSave,
  onCancel,
}) => {
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '')
  const [templateDescription, setTemplateDescription] = useState(initialTemplate?.description || '')
  const [templateCategory, setTemplateCategory] = useState(initialTemplate?.category || '')
  const [sections, setSections] = useState<TemplateSection[]>(initialTemplate?.sections || [])
  const [fields, setFields] = useState(initialTemplate?.fields || [])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, any>>({})

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  const handleAddSection = (type: TemplateSection['type']) => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      type,
      title: type === 'section' ? 'New Section' : undefined,
      content: type === 'body' || type === 'header' ? 'Enter content here...' : undefined,
    }
    setSections([...sections, newSection])
    setSelectedSectionId(newSection.id)
  }

  const handleUpdateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)))
  }

  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId))
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
    }
  }

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const newSections = [...sections]
    ;[newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]
    setSections(newSections)
  }

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    const template: PDFTemplate = {
      id: initialTemplate?.id || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      version: initialTemplate?.version || '1.0.0',
      createdAt: initialTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections,
      fields,
    }

    onSave(template)
  }

  return (
    <div className="space-y-4">
      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Basic information about your PDF template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Probation Period Joining Letter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe what this template is used for"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={templateCategory} onValueChange={setTemplateCategory}>
              <SelectTrigger id="template-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Joining Letter">Joining Letter</SelectItem>
                <SelectItem value="NDA">NDA</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Salary Slip">Salary Slip</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Template Structure Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Template Structure</CardTitle>
                <CardDescription>Add and arrange sections</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(type) => handleAddSection(type as TemplateSection['type'])}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Add Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="body">Body Text</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="separator">Separator</SelectItem>
                    <SelectItem value="signature">Signature</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sections yet. Add a section to get started.</p>
              </div>
            ) : (
              sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedSectionId === section.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedSectionId(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">{section.type}</span>
                      {section.title && (
                        <span className="text-sm text-muted-foreground">- {section.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveSection(section.id, 'up')
                        }}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveSection(section.id, 'down')
                        }}
                        disabled={index === sections.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSection(section.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSection ? `Edit ${selectedSection.type}` : 'Select a Section'}
            </CardTitle>
            <CardDescription>
              {selectedSection
                ? 'Configure the selected section'
                : 'Click on a section to edit it'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSection ? (
              <SectionEditor
                section={selectedSection}
                onUpdate={(updates) => handleUpdateSection(selectedSection.id, updates)}
                fields={fields}
                onFieldsChange={setFields}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a section from the list to edit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>See how your template looks with sample data</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplatePreview
            template={{
              id: 'preview',
              name: templateName || 'Preview',
              version: '1.0.0',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sections,
              fields,
            }}
            data={previewData}
            onDataChange={setPreviewData}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={!templateName.trim()}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  )
}
