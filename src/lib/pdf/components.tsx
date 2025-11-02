import React from 'react'
import { View, Text, Image } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { COMPANY_INFO } from './constants'

interface LetterheadProps {
  logoUrl?: string
  companyName?: string
  legalName?: string
  cin?: string
  address?: string
}

// Reusable Letterhead Component
export const Letterhead: React.FC<LetterheadProps> = ({
  logoUrl = COMPANY_INFO.logoUrl,
  companyName = COMPANY_INFO.name,
  legalName = COMPANY_INFO.legalName,
  cin = COMPANY_INFO.cin,
  address = COMPANY_INFO.address,
}) => (
  <View style={pdfStyles.header}>
    {logoUrl && (
      <View style={pdfStyles.logoContainer}>
        <Image src={logoUrl} style={{ width: 60, height: 'auto' }} />
      </View>
    )}
    <Text style={pdfStyles.companyName}>{companyName}</Text>
    <View style={{ alignItems: 'center' }}>
      {legalName && <Text style={pdfStyles.companyInfo}>Regd: {legalName}</Text>}
      {cin && <Text style={pdfStyles.companyInfo}>CIN: {cin}</Text>}
      {address && <Text style={pdfStyles.companyInfo}>{address}</Text>}
    </View>
  </View>
)

interface SectionProps {
  number?: string
  title: string
  children: React.ReactNode
}

// Reusable Section Component
export const Section: React.FC<SectionProps> = ({ number, title, children }) => (
  <View>
    <Text style={pdfStyles.sectionHeading}>
      {number ? `${number}. ` : ''}{title}
    </Text>
    {children}
  </View>
)

interface SubSectionProps {
  title: string
  children: React.ReactNode
}

// Reusable SubSection Component
export const SubSection: React.FC<SubSectionProps> = ({ title, children }) => (
  <View>
    <Text style={pdfStyles.subsectionHeading}>{title}</Text>
    {children}
  </View>
)

interface SeparatorProps {
  type?: 'single' | 'double'
}

// Reusable Separator Component
export const Separator: React.FC<SeparatorProps> = ({ type = 'single' }) => {
  const char = type === 'double' ? '=' : '-'
  const style = type === 'double' ? pdfStyles.separatorDouble : pdfStyles.separator
  return (
    <Text style={style}>
      {char.repeat(80)}{'\n'}
    </Text>
  )
}

interface BulletListProps {
  items: string[]
}

// Reusable Bullet List Component
export const BulletList: React.FC<BulletListProps> = ({ items }) => (
  <View>
    {items.map((item, index) => (
      <Text key={index} style={pdfStyles.bulletItem}>
        • {item}
      </Text>
    ))}
  </View>
)

interface SignatureBoxProps {
  label: string
  fields: Array<{ label: string; value?: string }>
}

// Reusable Signature Box Component
export const SignatureBox: React.FC<SignatureBoxProps> = ({ label, fields }) => (
  <View style={pdfStyles.signatureBox}>
    <Text style={pdfStyles.signatureLabel}>{label}</Text>
    {fields.map((field, index) => (
      <Text key={index} style={pdfStyles.signatureField}>
        {field.label}: {field.value || '________________________'}
      </Text>
    ))}
  </View>
)

interface DocumentTitleProps {
  title: string
  subtitle?: string
}

// Reusable Document Title Component
export const DocumentTitle: React.FC<DocumentTitleProps> = ({ title, subtitle }) => (
  <View>
    <Text style={pdfStyles.title}>{title}</Text>
    {subtitle && <Text style={pdfStyles.subtitle}>{subtitle}</Text>}
  </View>
)
