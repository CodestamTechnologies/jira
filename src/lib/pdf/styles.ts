import { StyleSheet } from '@react-pdf/renderer'

// Shared PDF styles - consistent across all PDFs
export const pdfStyles = StyleSheet.create({
  // Page base
  page: {
    padding: 20,
    fontSize: 11,
    fontFamily: 'CourierPrime',
    lineHeight: 1.5,
  },

  // Header/Letterhead
  header: {
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 6,
  },

  // Separators
  separator: {
    marginTop: 12,
    marginBottom: 12,
  },
  separatorDouble: {
    marginTop: 16,
    marginBottom: 16,
  },

  // Titles
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },

  // Section headings
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subsectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },

  // Text content
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  bodyTextSmall: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },

  // Lists
  bulletItem: {
    fontSize: 10,
    lineHeight: 1.6,
    marginLeft: 12,
    marginBottom: 6,
  },
  numberedItem: {
    fontSize: 10,
    lineHeight: 1.6,
    marginLeft: 12,
    marginBottom: 6,
  },

  // Parties/Entities
  partyLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  partyText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 6,
  },

  // Key-Value pairs
  key: {
    fontSize: 11,
    fontWeight: 'normal',
  },
  value: {
    fontSize: 9,
    lineHeight: 1.4,
  },

  // Signatures
  signatureSection: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '48%',
  },
  signatureLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  signatureField: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  signatureLine: {
    marginTop: 24,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 8,
  },

  // Layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  col: {
    flexDirection: 'column',
    flex: 1,
  },
  spacer: {
    marginBottom: 8,
  },
  spacerLarge: {
    marginBottom: 16,
  },
})
