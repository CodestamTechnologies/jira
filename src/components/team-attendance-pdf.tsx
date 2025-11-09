import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';

import { registerPDFFonts } from '@/lib/pdf/fonts';
import { pdfStyles } from '@/lib/pdf/styles';
import {
  Letterhead,
  Separator,
  DocumentTitle,
} from '@/lib/pdf/components';
import { COMPANY_INFO } from '@/lib/pdf/constants';
import { format } from 'date-fns';

registerPDFFonts();

// Helper function to get background color based on attendance status
const getStatusBackgroundColor = (status: string | null): string => {
  if (!status) return '#fef2f2' // Light red for absent
  
  switch (status.toLowerCase()) {
    case 'present':
      return '#f0fdf4' // Light green
    case 'late':
      return '#fffbeb' // Light amber/yellow
    case 'half-day':
      return '#eff6ff' // Light blue
    case 'absent':
      return '#fef2f2' // Light red
    default:
      return '#ffffff' // White for unknown
  }
}

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
  tableCellMember: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '35%',
  },
  tableCellStatus: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '15%',
  },
  tableCellTime: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '12%',
  },
  tableCellHours: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '10%',
  },
  tableCellNotes: {
    padding: 4,
    fontSize: 8,
    width: '28%',
  },
  lastCell: {
    borderRightWidth: 0,
  },
});

interface TeamAttendanceItem {
  member: {
    name: string;
    email: string;
  };
  attendance: {
    checkInTime: string;
    checkOutTime?: string;
    totalHours?: number;
    status: string;
    checkInAddress?: string;
    checkOutAddress?: string;
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    notes?: string;
  } | null;
}

export interface TeamAttendancePDFData {
  date: string;
  teamAttendance: TeamAttendanceItem[];
  stats: {
    totalMembers: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    halfDayCount: number;
    checkedInCount: number;
  };
  logoUrl?: string;
}

const TeamAttendancePDF: React.FC<TeamAttendancePDFData> = ({
  date,
  teamAttendance,
  stats,
  logoUrl = COMPANY_INFO.logoUrl,
}) => {
  const formattedDate = format(new Date(date), 'EEEE, MMMM dd, yyyy');

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
            TEAM ATTENDANCE REPORT
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'center' }}>{formattedDate}</Text>
        </View>

        <Separator />

        {/* Summary Statistics - Compact Layout */}
        <View style={{ marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
          <Text style={[pdfStyles.sectionHeading, { width: '100%', marginBottom: 4 }]}>SUMMARY</Text>
          <View style={{ width: '33%', marginBottom: 2 }}>
            <Text style={pdfStyles.key}>Total Members: {stats.totalMembers}</Text>
          </View>
          <View style={{ width: '33%', marginBottom: 2 }}>
            <Text style={pdfStyles.key}>Present      : {stats.presentCount}</Text>
          </View>
          <View style={{ width: '33%', marginBottom: 2 }}>
            <Text style={pdfStyles.key}>Late         : {stats.lateCount}</Text>
          </View>
          <View style={{ width: '33%', marginBottom: 2 }}>
            <Text style={pdfStyles.key}>Half Day     : {stats.halfDayCount}</Text>
          </View>
          <View style={{ width: '33%', marginBottom: 2 }}>
            <Text style={pdfStyles.key}>Absent       : {stats.absentCount}</Text>
          </View>
          <View style={{ width: '33%', marginBottom: 2 }}>
            <Text style={pdfStyles.key}>Checked In   : {stats.checkedInCount}</Text>
          </View>
        </View>

        <Separator />

        {/* Team Attendance Details Table */}
        <View style={{ marginBottom: 12 }}>
          <Text style={pdfStyles.sectionHeading}>ATTENDANCE DETAILS</Text>

          <View style={tableStyles.table}>
            {/* Table Header */}
            <View style={[tableStyles.tableRow, tableStyles.tableHeader]}>
              <View style={[tableStyles.tableCellMember]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Member</Text>
              </View>
              <View style={[tableStyles.tableCellStatus]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Status</Text>
              </View>
              <View style={[tableStyles.tableCellTime]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Check In</Text>
              </View>
              <View style={[tableStyles.tableCellTime]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Check Out</Text>
              </View>
              <View style={[tableStyles.tableCellHours]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Hours</Text>
              </View>
              <View style={[tableStyles.tableCellNotes, tableStyles.lastCell]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Daily Summary</Text>
              </View>
            </View>

            {/* Table Rows */}
            {teamAttendance.map((item, index) => {
              const status = item.attendance?.status || null
              const backgroundColor = getStatusBackgroundColor(status)
              
              return (
              <View key={index} style={[tableStyles.tableRow, { backgroundColor }]}>
                <View style={[tableStyles.tableCellMember]}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{item.member.name}</Text>
                  <Text style={{ fontSize: 7, color: '#666' }}>{item.member.email}</Text>
                </View>
                <View style={[tableStyles.tableCellStatus]}>
                  <Text style={{ fontSize: 8 }}>
                    {item.attendance
                      ? item.attendance.status.charAt(0).toUpperCase() +
                      item.attendance.status.slice(1).replace('-', ' ')
                      : 'Absent'}
                  </Text>
                </View>
                <View style={[tableStyles.tableCellTime]}>
                  {item.attendance?.checkInTime ? (
                    item.attendance.checkInLatitude && item.attendance.checkInLongitude ? (
                      <Link
                        src={`https://www.google.com/maps?q=${item.attendance.checkInLatitude},${item.attendance.checkInLongitude}`}
                        style={{ fontSize: 8, color: '#0066cc', textDecoration: 'underline' }}
                      >
                        {format(new Date(item.attendance.checkInTime), 'HH:mm')}
                      </Link>
                    ) : (
                      <Text style={{ fontSize: 8 }}>
                        {format(new Date(item.attendance.checkInTime), 'HH:mm')}
                      </Text>
                    )
                  ) : (
                    <Text style={{ fontSize: 8 }}>-</Text>
                  )}
                </View>
                <View style={[tableStyles.tableCellTime]}>
                  {item.attendance?.checkOutTime ? (
                    item.attendance.checkOutLatitude && item.attendance.checkOutLongitude ? (
                      <Link
                        src={`https://www.google.com/maps?q=${item.attendance.checkOutLatitude},${item.attendance.checkOutLongitude}`}
                        style={{ fontSize: 8, color: '#0066cc', textDecoration: 'underline' }}
                      >
                        {format(new Date(item.attendance.checkOutTime), 'HH:mm')}
                      </Link>
                    ) : (
                      <Text style={{ fontSize: 8 }}>
                        {format(new Date(item.attendance.checkOutTime), 'HH:mm')}
                      </Text>
                    )
                  ) : (
                    <Text style={{ fontSize: 8 }}>-</Text>
                  )}
                </View>
                <View style={[tableStyles.tableCellHours]}>
                  <Text style={{ fontSize: 8 }}>
                    {item.attendance?.totalHours
                      ? `${item.attendance.totalHours.toFixed(2)}h`
                      : '-'}
                  </Text>
                </View>
                <View style={[tableStyles.tableCellNotes, tableStyles.lastCell]}>
                  <Text style={{ fontSize: 8 }}>
                    {item.attendance?.notes || '-'}
                  </Text>
                </View>
              </View>
              )
            })}
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 'auto', paddingTop: 10 }}>
          <Separator />
          <Text style={[pdfStyles.bodyText, { textAlign: 'center', fontSize: 9 }]}>
            This is a computer-generated document and does not require a signature.
          </Text>
          <Text style={[pdfStyles.bodyText, { textAlign: 'center', fontSize: 9, marginTop: 6 }]}>
            Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default TeamAttendancePDF;
