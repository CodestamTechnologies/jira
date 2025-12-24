import React from 'react';
import { Document, Page, StyleSheet, Text, View, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Expense } from '../types';
import { formatAmount } from '../utils/format-amount';
import { getCategoryName } from '../utils/expense-helpers';

// Register fonts
Font.register({
  family: 'CourierPrime',
  fonts: [
    {
      src: '/fonts/CourierPrime-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/CourierPrime-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'CourierPrime',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  table: {
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #000',
    paddingBottom: 8,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
    paddingHorizontal: 4,
  },
  dateCell: {
    width: '15%',
  },
  descriptionCell: {
    width: '25%',
  },
  categoryCell: {
    width: '15%',
  },
  amountCell: {
    width: '15%',
    textAlign: 'right',
  },
  projectCell: {
    width: '15%',
  },
  statusCell: {
    width: '15%',
  },
  summary: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '2 solid #000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

interface ExpensePDFProps {
  expenses: Expense[];
  projectMap?: Map<string, string>;
}

/**
 * PDF component for expenses export
 * Displays expenses in a formatted table with summary
 */
export const ExpensePDF = ({ expenses, projectMap }: ExpensePDFProps) => {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const dateRange =
    expenses.length > 0
      ? `${format(new Date(expenses[expenses.length - 1].date), 'MMM dd, yyyy')} - ${format(new Date(expenses[0].date), 'MMM dd, yyyy')}`
      : '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Expenses Report</Text>
          <Text style={styles.subtitle}>
            Generated on {format(new Date(), 'MMM dd, yyyy')} {dateRange && `• ${dateRange}`}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.dateCell]}>Date</Text>
            <Text style={[styles.tableCell, styles.descriptionCell]}>Description</Text>
            <Text style={[styles.tableCell, styles.categoryCell]}>Category</Text>
            <Text style={[styles.tableCell, styles.amountCell]}>Amount</Text>
            <Text style={[styles.tableCell, styles.projectCell]}>Project</Text>
            <Text style={[styles.tableCell, styles.statusCell]}>Status</Text>
          </View>

          {expenses.map((expense, index) => (
            <View key={expense.$id || index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.dateCell]}>{format(new Date(expense.date), 'MMM dd, yyyy')}</Text>
              <Text style={[styles.tableCell, styles.descriptionCell]}>{expense.description}</Text>
              <Text style={[styles.tableCell, styles.categoryCell]}>
                {getCategoryName(expense.category, expense.customCategory)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCell]}>{formatAmount(expense.amount, false)}</Text>
              <Text style={[styles.tableCell, styles.projectCell]}>
                {projectMap?.get(expense.projectId || '') || 'Workspace'}
              </Text>
              <Text style={[styles.tableCell, styles.statusCell]}>{expense.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses:</Text>
            <Text style={styles.summaryValue}>{formatAmount(totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Number of Expenses:</Text>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
          </View>
        </View>

        <Text style={styles.footer}>This is a computer-generated document.</Text>
      </Page>
    </Document>
  );
};
