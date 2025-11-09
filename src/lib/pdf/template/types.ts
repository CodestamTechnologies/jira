// PDF Template System Types

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'multiselect' | 'checkbox' | 'image' | 'table'

export type SectionType = 'header' | 'body' | 'footer' | 'section' | 'separator' | 'table' | 'signature'

export interface TemplateField {
  id: string
  label: string
  type: FieldType
  key: string // Used to access the value in data
  required?: boolean
  defaultValue?: string | number | boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }> // For select/multiselect
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface TableColumn {
  id: string
  label: string
  key: string
  type: 'text' | 'number' | 'date'
  width?: string
}

export interface TemplateSection {
  id: string
  type: SectionType
  title?: string
  content?: string // Can contain placeholders like {{fieldName}}
  fields?: TemplateField[] // Fields that can be edited in this section
  columns?: TableColumn[] // For table sections
  style?: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    textAlign?: 'left' | 'center' | 'right'
    marginTop?: number
    marginBottom?: number
  }
  conditional?: {
    showIf?: string // Field key that must be truthy
    hideIf?: string // Field key that must be falsy
  }
}

export interface PDFTemplate {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  createdAt: string
  updatedAt: string
  sections: TemplateSection[]
  fields: TemplateField[] // Global fields available across all sections
  metadata?: {
    author?: string
    tags?: string[]
  }
}

export interface TemplateData {
  [key: string]: string | number | boolean | string[] | Array<Record<string, any>>
}

export interface TemplateConfig {
  template: PDFTemplate
  data: TemplateData
}
