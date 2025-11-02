# PDF Generation System

A reusable, scalable PDF generation system for creating professional documents.

## Structure

```
src/lib/pdf/
├── fonts.ts          # Font registration (shared across all PDFs)
├── styles.ts          # Shared PDF styles
├── components.tsx     # Reusable PDF components
├── constants.ts       # Company info, bank details, etc.
└── README.md          # This file
```

## Usage

### Creating a New PDF

1. Import shared utilities:
```tsx
import { registerPDFFonts } from '@/lib/pdf/fonts'
import { pdfStyles } from '@/lib/pdf/styles'
import { Letterhead, Section, BulletList, Separator, DocumentTitle } from '@/lib/pdf/components'
import { COMPANY_INFO, BANK_DETAILS } from '@/lib/pdf/constants'

registerPDFFonts()
```

2. Use reusable components:
```tsx
<Document>
  <Page size="A4" style={pdfStyles.page}>
    <Letterhead />
    <Separator type="double" />
    <DocumentTitle title="DOCUMENT TITLE" />
    <Section number="1" title="SECTION NAME">
      <Text style={pdfStyles.bodyText}>Content here...</Text>
      <BulletList items={['Item 1', 'Item 2']} />
    </Section>
  </Page>
</Document>
```

## Available Components

- **Letterhead**: Company logo and info
- **DocumentTitle**: Main document title
- **Section**: Numbered section with heading
- **SubSection**: Subsection within a section
- **BulletList**: Bulleted list items
- **Separator**: Horizontal line separator
- **SignatureBox**: Signature fields layout

## Available Styles

All styles are in `pdfStyles`:
- `page`, `header`, `logoContainer`
- `title`, `sectionHeading`, `subsectionHeading`
- `bodyText`, `bulletItem`, `partyText`
- `signatureSection`, `signatureBox`
- `row`, `col`, `spacer`

## Constants

- `COMPANY_INFO`: All company details
- `BANK_DETAILS`: Bank information
- `PDF_CONSTANTS`: Default values
