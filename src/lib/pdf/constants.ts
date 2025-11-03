// Shared constants for PDF generation
export const PDF_CONSTANTS = {
  DEFAULT_LOGO_URL: 'https://store.codestam.com/codestam_logo.png',
  SEPARATOR_LENGTH: 80,
  PAGE_PADDING: 20,
}

// Company Information - Centralized
export const COMPANY_INFO = {
  name: 'Codestam Technologies',
  legalName: 'Kbyte Techbuilder Pvt. Ltd.',
  cin: 'U63112JH2024PTC022816',
  address: 'Ranchi Jharkhand – 835103',
  email: 'codestamtechnologies@gmail.com',
  phone: '+918228840065',
  website: 'https://www.codestam.com',
  logoUrl: 'https://store.codestam.com/codestam_logo.png',
  udyamRegistrationNumber: '214014001053',
}

// Bank Details - Can be used across PDFs
export const BANK_DETAILS = {
  bankName: 'HDFC Bank',
  accountName: 'Priyanshu Kushwaha',
  accountNumber: '57100718608692',
  ifsc: 'HDFC0005866',
  branch: 'BIT MESRA',
  upi: 'kushwaha.priyanshu@ptyes',
}

// Terms and Conditions - Shared across invoices
export const TERMS_AND_CONDITIONS = `
1. Payment Terms: Payment is due within 30 days of invoice date.
2. Late Payment: A late fee of 1.5% per month will be applied to overdue accounts.
3. Disputes: Any disputes must be submitted in writing within 15 days of invoice date.
4. Liability: Our liability is limited to the amount paid for the services.
5. Governing Law: This invoice is governed by the laws of the jurisdiction where services were provided.
`
