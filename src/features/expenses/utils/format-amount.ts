/**
 * Currency formatting utilities for expenses
 * Formats amounts in Indian Rupees (₹)
 */

/**
 * Formats a number as currency in Indian Rupees
 * @param amount - Amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string (e.g., "₹1,234.56")
 */
export const formatAmount = (amount: number, showDecimals = true): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Formats amount without currency symbol (just number with commas)
 * @param amount - Amount to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export const formatAmountNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
