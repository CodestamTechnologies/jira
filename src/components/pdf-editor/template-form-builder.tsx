'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { PDFTemplate, TemplateData, TemplateField } from '@/lib/pdf/template/types'
import { mergeWithDefaults, extractFieldKeys } from '@/lib/pdf/template/parser'

interface TemplateFormBuilderProps {
  template: PDFTemplate
  data: TemplateData
  onChange: (data: TemplateData) => void
}

/**
 * Dynamically generates form fields based on template configuration
 */
export const TemplateFormBuilder: React.FC<TemplateFormBuilderProps> = ({ template, data, onChange }) => {
  const [formData, setFormData] = useState<TemplateData>(() => {
    // Initialize with defaults
    const allFields = [
      ...template.fields,
      ...template.sections.flatMap((s) => s.fields || []),
    ]
    return mergeWithDefaults(allFields, data)
  })

  useEffect(() => {
    // Update form data when template changes
    const allFields = [
      ...template.fields,
      ...template.sections.flatMap((s) => s.fields || []),
    ]
    const merged = mergeWithDefaults(allFields, data)
    setFormData(merged)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  const updateField = (key: string, value: string | number | boolean | string[] | Array<Record<string, any>>) => {
    const newData = { ...formData, [key]: value }
    setFormData(newData)
    onChange(newData)
  }

  const renderField = (field: TemplateField) => {
    const value = formData[field.key]
    const fieldId = `field-${field.id}`

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={value !== undefined ? String(value) : ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value !== undefined ? String(value) : ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type="number"
              value={value !== undefined ? String(value) : ''}
              onChange={(e) => updateField(field.key, Number(e.target.value) || 0)}
              placeholder={field.placeholder}
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={fieldId}
              type="date"
              value={value !== undefined ? String(value) : ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              required={field.required}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={value !== undefined ? String(value) : ''}
              onValueChange={(val) => updateField(field.key, val)}
            >
              <SelectTrigger id={fieldId}>
                <SelectValue placeholder={field.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <input
              id={fieldId}
              type="checkbox"
              checked={value === true}
              onChange={(e) => updateField(field.key, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
          </div>
        )

      case 'table': {
        const tableData = (Array.isArray(value) ? value : []) as Array<Record<string, any>>
        const section = template.sections.find((s) => s.id === field.key || s.columns)
        const columns = section?.columns || []

        if (columns.length === 0) return null

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <div className="space-y-2 border rounded-lg p-4">
              {tableData.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-12 gap-2 items-end">
                  {columns.map((column) => (
                    <div key={column.id} className="col-span-12 sm:col-span-6 lg:col-span-3">
                      <Label className="text-xs">{column.label}</Label>
                      <Input
                        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                        value={row[column.key] !== undefined ? String(row[column.key]) : ''}
                        onChange={(e) => {
                          const newTableData = [...tableData]
                          newTableData[rowIndex] = {
                            ...newTableData[rowIndex],
                            [column.key]:
                              column.type === 'number'
                                ? Number(e.target.value) || 0
                                : e.target.value,
                          }
                          updateField(field.key, newTableData)
                        }}
                        placeholder={column.label}
                      />
                    </div>
                  ))}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newTableData = tableData.filter((_, i) => i !== rowIndex)
                        updateField(field.key, newTableData)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newRow: Record<string, any> = {}
                  columns.forEach((col) => {
                    newRow[col.key] = col.type === 'number' ? 0 : ''
                  })
                  updateField(field.key, [...tableData, newRow])
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  // Get all unique fields from template
  const allFields = new Map<string, TemplateField>()

  // Add global fields
  template.fields.forEach((field) => {
    allFields.set(field.key, field)
  })

  // Add section fields
  template.sections.forEach((section) => {
    section.fields?.forEach((field) => {
      if (!allFields.has(field.key)) {
        allFields.set(field.key, field)
      }
    })
  })

  // Extract placeholders from section content and create fields for them
  template.sections.forEach((section) => {
    // Extract from content
    if (section.content) {
      const fieldKeys = extractFieldKeys(section.content)
      fieldKeys.forEach((fieldKey) => {
        if (!allFields.has(fieldKey)) {
          // Create a field for this placeholder
          const placeholderField: TemplateField = {
            id: `placeholder-${fieldKey}`,
            key: fieldKey,
            label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1'),
            type: 'text',
            required: false,
          }
          allFields.set(fieldKey, placeholderField)
        }
      })
    }
    // Extract from title
    if (section.title) {
      const fieldKeys = extractFieldKeys(section.title)
      fieldKeys.forEach((fieldKey) => {
        if (!allFields.has(fieldKey)) {
          const placeholderField: TemplateField = {
            id: `placeholder-${fieldKey}`,
            key: fieldKey,
            label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1'),
            type: 'text',
            required: false,
          }
          allFields.set(fieldKey, placeholderField)
        }
      })
    }
  })

  // Handle table sections
  template.sections.forEach((section) => {
    if (section.type === 'table' && section.columns) {
      const tableField: TemplateField = {
        id: section.id,
        key: section.id,
        label: section.title || 'Table Data',
        type: 'table',
        required: false,
      }
      allFields.set(section.id, tableField)
    }
  })

  const fieldsArray = Array.from(allFields.values())

  return (
    <div className="space-y-4">
      {fieldsArray.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fields defined in this template.</p>
      ) : (
        fieldsArray.map((field) => renderField(field))
      )}
    </div>
  )
}
