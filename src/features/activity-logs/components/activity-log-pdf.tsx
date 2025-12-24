import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

import { registerPDFFonts } from '@/lib/pdf/fonts';
import { pdfStyles } from '@/lib/pdf/styles';
import {
  Separator,
} from '@/lib/pdf/components';
import { COMPANY_INFO } from '@/lib/pdf/constants';
import { format } from 'date-fns';
import { type ActivityLog } from '../types';

registerPDFFonts();

// Table styles for PDF
const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 20,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottomWidth: 2,
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    flex: 1,
  },
  tableCellTimestamp: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '15%',
  },
  tableCellUser: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '18%',
  },
  tableCellAction: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '10%',
  },
  tableCellEntityType: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '12%',
  },
  tableCellEntityId: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '15%',
  },
  tableCellChanges: {
    padding: 4,
    fontSize: 8,
    width: '30%',
  },
  lastCell: {
    borderRightWidth: 0,
  },
});

export interface ActivityLogPDFData {
  logs: ActivityLog[];
  filters?: {
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    action?: string;
    projectId?: string;
  };
  logoUrl?: string;
}

const ActivityLogPDF: React.FC<ActivityLogPDFData> = ({
  logs,
  filters,
  logoUrl = COMPANY_INFO.logoUrl,
}) => {
  const formatChanges = (changes: string | Record<string, unknown> | undefined): string => {
    if (!changes) return '-';
    
    try {
      const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
      if (typeof parsed === 'object' && parsed !== null) {
        const old = parsed.old || {};
        const new_ = parsed.new || {};
        const changesList: string[] = [];
        
        Object.keys({ ...old, ...new_ }).forEach((key) => {
          const oldVal = old[key];
          const newVal = new_[key];
          if (oldVal !== newVal) {
            const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal);
            const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal);
            changesList.push(`${key}: ${oldStr} → ${newStr}`);
          }
        });
        
        const result = changesList.length > 0 ? changesList.join('; ') : 'No changes';
        // Truncate if too long to prevent layout issues
        return result.length > 150 ? result.substring(0, 147) + '...' : result;
      }
      const result = JSON.stringify(parsed);
      return result.length > 150 ? result.substring(0, 147) + '...' : result;
    } catch {
      const result = typeof changes === 'string' ? changes : JSON.stringify(changes);
      return result.length > 150 ? result.substring(0, 147) + '...' : result;
    }
  };

  const getFilterSummary = (): string => {
    const parts: string[] = [];
    if (filters?.entityType) parts.push(`Type: ${filters.entityType}`);
    if (filters?.action) parts.push(`Action: ${filters.action}`);
    if (filters?.startDate) parts.push(`From: ${format(new Date(filters.startDate), 'MMM dd, yyyy')}`);
    if (filters?.endDate) parts.push(`To: ${format(new Date(filters.endDate), 'MMM dd, yyyy')}`);
    return parts.length > 0 ? parts.join(' | ') : 'All Activity Logs';
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Compact Letterhead */}
        <View style={{ marginBottom: 8, alignItems: 'center' }}>
          {logoUrl && (
            <View style={{ marginBottom: 4 }}>
              <Image src={logoUrl} style={{ width: 40, height: 'auto' }} />
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>
            {COMPANY_INFO.name}
          </Text>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 7, textAlign: 'center', lineHeight: 1.2 }}>
              {COMPANY_INFO.legalName && `Regd: ${COMPANY_INFO.legalName}`}
              {COMPANY_INFO.legalName && COMPANY_INFO.cin && ' | '}
              {COMPANY_INFO.cin && `CIN: ${COMPANY_INFO.cin}`}
              {COMPANY_INFO.address && ` | ${COMPANY_INFO.address}`}
            </Text>
          </View>
        </View>

        <Separator />

        {/* Document Title - Compact */}
        <View style={{ marginTop: 6, marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>
            ACTIVITY LOG REPORT
          </Text>
          <Text style={{ fontSize: 9, textAlign: 'center', marginBottom: 2 }}>
            {getFilterSummary()}
          </Text>
          <Text style={{ fontSize: 9, textAlign: 'center' }}>
            Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>

        <Separator />

        {/* Summary Statistics - Compact Layout */}
        <View style={{ marginBottom: 8 }}>
          <Text style={[pdfStyles.sectionHeading, { marginBottom: 4 }]}>SUMMARY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '50%', marginBottom: 2 }}>
              <Text style={pdfStyles.key}>Total Logs: {logs.length}</Text>
            </View>
            <View style={{ width: '50%', marginBottom: 2 }}>
              <Text style={pdfStyles.key}>
                Date Range: {logs.length > 0 
                  ? `${format(new Date(logs[logs.length - 1].$createdAt), 'MMM dd, yyyy')} - ${format(new Date(logs[0].$createdAt), 'MMM dd, yyyy')}`
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <Separator />

        {/* Activity Log Details Table */}
        <View style={{ marginBottom: 12 }}>
          <Text style={pdfStyles.sectionHeading}>ACTIVITY LOGS</Text>

          <View style={tableStyles.table}>
            {/* Table Header */}
            <View style={[tableStyles.tableRow, tableStyles.tableHeader]}>
              <View style={[tableStyles.tableCellTimestamp]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Timestamp</Text>
              </View>
              <View style={[tableStyles.tableCellUser]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>User</Text>
              </View>
              <View style={[tableStyles.tableCellAction]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Action</Text>
              </View>
              <View style={[tableStyles.tableCellEntityType]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Entity Type</Text>
              </View>
              <View style={[tableStyles.tableCellEntityId]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Entity ID</Text>
              </View>
              <View style={[tableStyles.tableCellChanges, tableStyles.lastCell]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Changes</Text>
              </View>
            </View>

            {/* Table Rows */}
            {logs.map((log, index) => (
              <View key={index} style={tableStyles.tableRow}>
                <View style={[tableStyles.tableCellTimestamp]}>
                  <Text style={{ fontSize: 8 }}>
                    {format(new Date(log.$createdAt), 'MMM dd, yyyy')}
                  </Text>
                  <Text style={{ fontSize: 7, color: '#666' }}>
                    {format(new Date(log.$createdAt), 'HH:mm:ss')}
                  </Text>
                </View>
                <View style={[tableStyles.tableCellUser]}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{log.username}</Text>
                  <Text style={{ fontSize: 7, color: '#666' }}>{log.userEmail}</Text>
                </View>
                <View style={[tableStyles.tableCellAction]}>
                  <Text style={{ fontSize: 8 }}>{log.action}</Text>
                </View>
                <View style={[tableStyles.tableCellEntityType]}>
                  <Text style={{ fontSize: 8 }}>{log.entityType}</Text>
                </View>
                <View style={[tableStyles.tableCellEntityId]}>
                  <Text style={{ fontSize: 7 }}>{log.entityId.substring(0, 12)}...</Text>
                </View>
                <View style={[tableStyles.tableCellChanges, tableStyles.lastCell]}>
                  <Text style={{ fontSize: 7 }}>
                    {formatChanges(log.changes)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 'auto', paddingTop: 10 }}>
          <Separator />
          <Text style={[pdfStyles.bodyText, { textAlign: 'center', fontSize: 9 }]}>
            This is a computer-generated document and does not require a signature.
          </Text>
          <Text style={[pdfStyles.bodyText, { textAlign: 'center', fontSize: 9, marginTop: 6 }]}>
            Total {logs.length} activity log{logs.length === 1 ? '' : 's'} exported
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ActivityLogPDF;
