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
  Letterhead,
  Separator,
  DocumentTitle,
} from '@/lib/pdf/components';
import { COMPANY_INFO } from '@/lib/pdf/constants';
import { format } from 'date-fns';
import type { Task } from '@/features/tasks/types';

// Extended Task type for PDF with project name
type TaskWithProjectName = Task & {
  projectName?: string;
};

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
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableCellTask: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '40%',
  },
  tableCellProject: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '25%',
  },
  tableCellAssignee: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000',
    width: '20%',
  },
  tableCellDueDate: {
    padding: 6,
    fontSize: 9,
    width: '15%',
  },
  lastCell: {
    borderRightWidth: 0,
  },
});

/**
 * PDF Data Interface for Tasks in Progress Report
 */
export interface TasksInProgressPDFData {
  date: string;
  tasks: TaskWithProjectName[];
  logoUrl?: string;
}

/**
 * TasksInProgressPDF Component
 * 
 * Generates a PDF report of tasks that are currently in progress.
 * 
 * Features:
 * - Professional letterhead with company information
 * - Task details table with project names, assignees, and due dates
 * - Responsive table layout
 * - Footer with generation timestamp
 * 
 * @param date - The date for the report (YYYY-MM-DD format)
 * @param tasks - Array of tasks with project names
 * @param logoUrl - Optional company logo URL
 */
const TasksInProgressPDF: React.FC<TasksInProgressPDFData> = ({
  date,
  tasks,
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
            TASKS IN PROGRESS REPORT
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'center' }}>{formattedDate}</Text>
        </View>

        <Separator />

        {/* Tasks Details Table */}
        <View style={{ marginBottom: 12 }}>
          <Text style={pdfStyles.sectionHeading}>TASKS DETAILS</Text>

          {tasks.length === 0 ? (
            <View style={{ marginTop: 8, padding: 12, backgroundColor: '#f9f9f9' }}>
              <Text style={{ fontSize: 10, textAlign: 'center', fontStyle: 'italic' }}>
                No tasks in progress for today
              </Text>
            </View>
          ) : (
            <View style={tableStyles.table}>
              {/* Table Header */}
              <View style={[tableStyles.tableRow, tableStyles.tableHeader]}>
                <View style={[tableStyles.tableCellTask]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 9 }}>Task Name</Text>
                </View>
                <View style={[tableStyles.tableCellProject]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 9 }}>Project</Text>
                </View>
                <View style={[tableStyles.tableCellAssignee]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 9 }}>Assignee(s)</Text>
                </View>
                <View style={[tableStyles.tableCellDueDate, tableStyles.lastCell]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 9 }}>Due Date</Text>
                </View>
              </View>

              {/* Table Rows */}
              {tasks.map((task, index) => {
                const assigneeNames = task.assignees?.map(a => a.name).join(', ') || 
                                     (task.assignee?.name || 'Unassigned');
                const dueDate = task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date';
                // Get project name - check projectName first, then project object, then fallback to projectId
                const projectName = task.projectName || 
                                  (task as any).project?.name || 
                                  task.projectId || 
                                  'N/A';
                
                return (
                  <View key={task.$id || index} style={tableStyles.tableRow}>
                    <View style={[tableStyles.tableCellTask]}>
                      <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{task.name}</Text>
                      {task.description && (
                        <Text style={{ fontSize: 7, color: '#666', marginTop: 2 }}>
                          {task.description.length > 50 
                            ? `${task.description.substring(0, 50)}...` 
                            : task.description}
                        </Text>
                      )}
                    </View>
                    <View style={[tableStyles.tableCellProject]}>
                      <Text style={{ fontSize: 9 }}>{projectName}</Text>
                    </View>
                    <View style={[tableStyles.tableCellAssignee]}>
                      <Text style={{ fontSize: 9 }}>{assigneeNames}</Text>
                    </View>
                    <View style={[tableStyles.tableCellDueDate, tableStyles.lastCell]}>
                      <Text style={{ fontSize: 9 }}>{dueDate}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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

export default TasksInProgressPDF;
