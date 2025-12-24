/**
 * Export Utilities
 * Centralized utilities for CSV, JSON, and blob downloads
 * Follows DRY principle - reusable export functions
 */

import { format } from 'date-fns';
import { downloadPDF } from '@/lib/pdf/utils';

/**
 * Downloads a blob file in the browser
 * Handles cleanup of object URLs to prevent memory leaks
 * 
 * @param blob - Blob to download
 * @param filename - Filename for the download
 * @param mimeType - MIME type of the file
 */
export const downloadBlob = (blob: Blob, filename: string, mimeType?: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports data to CSV format
 * Handles proper CSV escaping and encoding
 * 
 * @param data - Array of data objects to export
 * @param headers - Column headers
 * @param getRowData - Function to extract row data from each item
 * @param filename - Optional filename (defaults to timestamped filename)
 * @returns void
 */
export const exportToCSV = <T>(
  data: T[],
  headers: string[],
  getRowData: (item: T) => (string | number)[],
  filename?: string,
): void => {
  if (data.length === 0) {
    return;
  }

  const rows = data.map((item) => getRowData(item));

  // Escape CSV cells properly (handle quotes and commas)
  const escapeCSVCell = (cell: string | number): string => {
    const cellStr = String(cell);
    // Escape quotes by doubling them, then wrap in quotes if contains comma, quote, or newline
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const defaultFilename = `export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadBlob(blob, filename || defaultFilename);
};

/**
 * Exports data to JSON format
 * 
 * @param data - Data to export
 * @param filename - Optional filename (defaults to timestamped filename)
 * @returns void
 */
export const exportToJSON = <T>(data: T[], filename?: string): void => {
  if (data.length === 0) {
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const defaultFilename = `export-${format(new Date(), 'yyyy-MM-dd')}.json`;
  downloadBlob(blob, defaultFilename);
};

/**
 * Downloads a PDF blob (re-export for convenience)
 */
export { downloadPDF } from '@/lib/pdf/utils';
