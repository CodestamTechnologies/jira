'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { TemplateSection, TemplateField, TableColumn } from '@/lib/pdf/template/types'

interface SectionEditorProps {
  section: TemplateSection
  onUpdate: (updates: Partial<TemplateSection>) => void
  fields: TemplateField[]
  onFieldsChange: (fields: TemplateField[]) => void
}

/**
 * Editor for individual template sections
 */
export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  onUpdate,
  fields,
  onFieldsChange,
}) => {
  const handleAddField = () => {
    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      key: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
    }
    // Add to section fields
    const sectionFields = section.fields || []
    onUpdate({ fields: [...sectionFields, newField] })
    // Also add to global fields if not exists
    if (!fields.find((f) => f.id === newField.id)) {
      onFieldsChange([...fields, newField])
    }
  }

  const handleUpdateField = (fieldId: string, updates: Partial<TemplateField>) => {
    const sectionFields = section.fields || []
    const updatedSectionFields = sectionFields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    onUpdate({ fields: updatedSectionFields })
    // Also update global fields
    onFieldsChange(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
  }

  const handleDeleteField = (fieldId: string) => {
    const sectionFields = section.fields || []
    onUpdate({ fields: sectionFields.filter((f) => f.id !== fieldId) })
  }

  const handleAddTableColumn = () => {
    const newColumn: TableColumn = {
      id: `col-${Date.now()}`,
      key: `column_${Date.now()}`,
      label: 'New Column',
      type: 'text',
    }
    onUpdate({
      columns: [...(section.columns || []), newColumn],
    })
  }

  const handleUpdateTableColumn = (columnId: string, updates: Partial<TableColumn>) => {
    onUpdate({
      columns: section.columns?.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
    })
  }

  const handleDeleteTableColumn = (columnId: string) => {
    onUpdate({
      columns: section.columns?.filter((c) => c.id !== columnId),
    })
  }

  return (
    <div className="space-y-4">
      {/* Section Title (for section type) */}
      {section.type === 'section' && (
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="e.g., Remuneration"
          />
        </div>
      )}

      {/* Content (for header, body, footer) */}
      {(section.type === 'header' || section.type === 'body' || section.type === 'footer') && (
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Use {{fieldName}} for placeholders. Example: Dear {{employeeName}},"
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            Use {`{{fieldName}}`} to insert dynamic values. Example: {`{{employeeName}}`}
          </p>
        </div>
      )}

      {/* Table Columns */}
      {section.type === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Table Columns</Label>
            <Button variant="outline" size="sm" onClick={handleAddTableColumn}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
          {section.columns && section.columns.length > 0 ? (
            <div className="space-y-2">
              {section.columns.map((column) => (
                <div key={column.id} className="flex gap-2 items-end border p-2 rounded">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Column Label</Label>
                    <Input
                      value={column.label}
                      onChange={(e) => handleUpdateTableColumn(column.id, { label: e.target.value })}
                      placeholder="Column name"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Field Key</Label>
                    <Input
                      value={column.key}
                      onChange={(e) => handleUpdateTableColumn(column.id, { key: e.target.value })}
                      placeholder="field_key"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={column.type}
                      onValueChange={(type) =>
                        handleUpdateTableColumn(column.id, { type: type as 'text' | 'number' | 'date' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTableColumn(column.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No columns yet. Add a column to start.</p>
          )}
        </div>
      )}

      {/* Section Fields (for section and signature types) */}
      {(section.type === 'section' || section.type === 'signature') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Fields</Label>
            <Button variant="outline" size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
          {section.fields && section.fields.length > 0 ? (
            <div className="space-y-2">
              {section.fields.map((field) => {
                return (
                  <div key={field.id} className="border p-3 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                          placeholder="Field label"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Field Key</Label>
                        <Input
                          value={field.key}
                          onChange={(e) => handleUpdateField(field.id, { key: e.target.value })}
                          placeholder="field_key"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(type) =>
                          handleUpdateField(field.id, { type: type as TemplateField['type'] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label className="text-xs">Required</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Field
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No fields yet. Add a field to start.</p>
          )}
        </div>
      )}

      {/* Separator has no config */}
      {section.type === 'separator' && (
        <p className="text-sm text-muted-foreground">Separator sections don't need configuration.</p>
      )}
    </div>
  )
}
