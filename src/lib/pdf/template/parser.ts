import type { TemplateData } from './types'

/**
 * Replaces placeholders in template content with actual data
 * Supports {{fieldName}} syntax
 */
export function replacePlaceholders(content: string, data: TemplateData): string {
  if (!content) return ''

  // Match {{fieldName}} or {{fieldName.defaultValue}} patterns
  return content.replace(/\{\{(\w+)(?:\.([^}]+))?\}\}/g, (match, fieldKey, defaultValue) => {
    const value = data[fieldKey]

    // If value exists and is not null/undefined, use it
    if (value !== undefined && value !== null && value !== '') {
      return String(value)
    }

    // Otherwise use default value if provided
    if (defaultValue) {
      return defaultValue
    }

    // Return empty string if no value and no default
    return ''
  })
}

/**
 * Extracts all field keys from template content
 */
export function extractFieldKeys(content: string): string[] {
  if (!content) return []

  const regex = /\{\{(\w+)(?:\.([^}]+))?\}\}/g
  const keys = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1])
  }

  return Array.from(keys)
}

/**
 * Validates that all required fields are present in data
 */
export function validateRequiredFields(
  fields: Array<{ key: string; required?: boolean }>,
  data: TemplateData
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []

  for (const field of fields) {
    if (field.required && (data[field.key] === undefined || data[field.key] === null || data[field.key] === '')) {
      missingFields.push(field.key)
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Merges template data with default values
 */
export function mergeWithDefaults(
  fields: Array<{ key: string; defaultValue?: string | number | boolean }>,
  data: TemplateData
): TemplateData {
  const merged = { ...data }

  for (const field of fields) {
    if (field.defaultValue !== undefined && (merged[field.key] === undefined || merged[field.key] === null)) {
      merged[field.key] = field.defaultValue
    }
  }

  return merged
}
