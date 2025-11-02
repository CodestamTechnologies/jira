/**
 * PDF Utility Functions
 * Shared helpers for PDF generation across the application
 */

/**
 * Converts a PDF Blob to base64 string (browser-compatible)
 * Useful for sending PDFs via email or API
 */
export const pdfBlobToBase64 = async (blob: Blob): Promise<string> => {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  
  // Convert ArrayBuffer to base64 (browser-compatible)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Generates a safe filename from a string
 * Removes special characters and replaces spaces with dashes
 */
export const generateSafeFilename = (name: string, extension = 'pdf'): string => {
  const sanitized = name
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .toLowerCase()
  
  return `${sanitized}.${extension}`
}

/**
 * Downloads a PDF blob in the browser
 */
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
