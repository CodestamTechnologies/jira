import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { registerPDFFonts } from '@/lib/pdf/fonts'
import { pdfStyles } from '@/lib/pdf/styles'
import { COMPANY_INFO } from '@/lib/pdf/constants'
import type { PDFTemplate, TemplateData, TemplateSection } from './types'
import { replacePlaceholders } from './parser'

// Register fonts once
registerPDFFonts()

// Additional styles for template rendering
const templateStyles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 4,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
})

interface TemplateRendererProps {
  template: PDFTemplate
  data: TemplateData
}

/**
 * Renders a PDF document from a template configuration
 */
export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ template, data }) => {
  const renderSection = (section: TemplateSection, index: number): React.ReactNode => {
    // Check conditional rendering
    if (section.conditional) {
      if (section.conditional.showIf && !data[section.conditional.showIf]) {
        return null
      }
      if (section.conditional.hideIf && data[section.conditional.hideIf]) {
        return null
      }
    }

    const sectionStyle = {
      ...templateStyles.section,
      ...(section.style?.marginTop && { marginTop: section.style.marginTop }),
      ...(section.style?.marginBottom && { marginBottom: section.style.marginBottom }),
    }

    switch (section.type) {
      case 'header': {
        const content = section.content ? replacePlaceholders(section.content, data) : ''
        return (
          <View key={section.id} style={sectionStyle}>
            {COMPANY_INFO.logoUrl && (
              <View style={pdfStyles.logoContainer}>
                <Image src={COMPANY_INFO.logoUrl} style={{ width: 60, height: 'auto' }} />
              </View>
            )}
            {content && (
              <Text
                style={{
                  fontSize: section.style?.fontSize || 18,
                  fontWeight: section.style?.fontWeight || 'bold',
                  textAlign: section.style?.textAlign || 'center',
                }}
              >
                {content}
              </Text>
            )}
          </View>
        )
      }

      case 'separator': {
        return (
          <View key={section.id} style={sectionStyle}>
            <Text style={pdfStyles.separator}>
              {'-'.repeat(80)}
              {'\n'}
            </Text>
          </View>
        )
      }

      case 'section': {
        const title = section.title ? replacePlaceholders(section.title, data) : ''
        const content = section.content ? replacePlaceholders(section.content, data) : ''

        return (
          <View key={section.id} style={sectionStyle}>
            {title && (
              <Text
                style={{
                  ...pdfStyles.sectionHeading,
                  fontSize: section.style?.fontSize || pdfStyles.sectionHeading.fontSize,
                  fontWeight: section.style?.fontWeight || 'bold',
                  textAlign: section.style?.textAlign || 'left',
                }}
              >
                {title}
              </Text>
            )}
            {content && <Text style={pdfStyles.bodyText}>{content}</Text>}
            {section.fields?.map((field) => {
              const value = data[field.key]
              if (value === undefined || value === null || value === '') return null

              return (
                <Text key={field.id} style={pdfStyles.bodyText}>
                  <Text style={pdfStyles.key}>{field.label}: </Text>
                  <Text style={pdfStyles.value}>{String(value)}</Text>
                </Text>
              )
            })}
          </View>
        )
      }

      case 'table': {
        if (!section.columns || section.columns.length === 0) return null

        const tableData = (data[section.id] || data['tableData'] || []) as Array<Record<string, any>>

        return (
          <View key={section.id} style={[sectionStyle, templateStyles.table]}>
            {section.title && (
              <Text style={pdfStyles.sectionHeading}>
                {replacePlaceholders(section.title, data)}
              </Text>
            )}
            {/* Table Header */}
            <View style={[templateStyles.tableRow, templateStyles.tableHeader]}>
              {section.columns.map((column) => (
                <View key={column.id} style={templateStyles.tableCell}>
                  <Text style={pdfStyles.key}>{column.label}</Text>
                </View>
              ))}
            </View>
            {/* Table Rows */}
            {Array.isArray(tableData) &&
              tableData.map((row, rowIndex) => (
                <View key={rowIndex} style={templateStyles.tableRow}>
                  {section.columns!.map((column) => (
                    <View key={column.id} style={templateStyles.tableCell}>
                      <Text style={pdfStyles.value}>
                        {row[column.key] !== undefined ? String(row[column.key]) : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        )
      }

      case 'body': {
        const content = section.content ? replacePlaceholders(section.content, data) : ''
        return (
          <View key={section.id} style={sectionStyle}>
            {content && (
              <Text
                style={{
                  ...pdfStyles.bodyText,
                  fontSize: section.style?.fontSize || pdfStyles.bodyText.fontSize,
                  fontWeight: section.style?.fontWeight || 'normal',
                  textAlign: section.style?.textAlign || 'left',
                }}
              >
                {content}
              </Text>
            )}
          </View>
        )
      }

      case 'signature': {
        return (
          <View key={section.id} style={[sectionStyle, pdfStyles.signatureSection]}>
            <View style={pdfStyles.signatureBox}>
              <Text style={pdfStyles.signatureLabel}>
                {section.title ? replacePlaceholders(section.title, data) : 'Signature'}
              </Text>
              {section.fields?.map((field) => {
                const value = data[field.key]
                return (
                  <Text key={field.id} style={pdfStyles.signatureField}>
                    {field.label}: {value ? String(value) : '________________________'}
                  </Text>
                )
              })}
              <View style={pdfStyles.signatureLine} />
            </View>
          </View>
        )
      }

      case 'footer': {
        const content = section.content ? replacePlaceholders(section.content, data) : ''
        return (
          <View key={section.id} style={sectionStyle}>
            {content && <Text style={pdfStyles.bodyTextSmall}>{content}</Text>}
          </View>
        )
      }

      default:
        return null
    }
  }

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {template.sections.map((section, index) => renderSection(section, index))}
      </Page>
    </Document>
  )
}

export default TemplateRenderer



