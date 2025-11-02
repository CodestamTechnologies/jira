/**
 * Gets the environment prefix for invoice numbers
 * DEV/ for development, empty for production
 */
export const getEnvironmentPrefix = (): string => {
  const env = process.env.NODE_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'production';
  return env === 'development' ? 'DEV/' : '';
};

/**
 * Generates an invoice number in the format: [ENV/]CS/YYYY/MM/DD/NN
 * Examples:
 *   Production: CS/2025/11/02/03
 *   Development: DEV/CS/2025/11/02/03
 */
export const generateInvoiceNumberPattern = (date: Date, serialNumber: number, environment?: string): string => {
  const env = environment || getEnvironmentPrefix();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const serial = String(serialNumber).padStart(2, '0');

  return `${env}CS/${year}/${month}/${day}/${serial}`;
};

/**
 * Parses an invoice number to extract environment, date and serial number
 * Returns null if the format is invalid
 */
export const parseInvoiceNumber = (invoiceNumber: string): { environment: string; date: Date; serial: number } | null => {
  // Match both DEV/CS/... and CS/... formats
  const pattern = /^(?:DEV\/)?CS\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})$/;
  const match = invoiceNumber.match(pattern);

  if (!match) {
    return null;
  }

  const [, year, month, day, serial] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const environment = invoiceNumber.startsWith('DEV/') ? 'DEV/' : '';

  return {
    environment,
    date,
    serial: parseInt(serial),
  };
};
