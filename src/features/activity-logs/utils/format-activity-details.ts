import { format } from 'date-fns';
import { ActivityAction, ActivityEntityType, type ActivityLog } from '../types';
import { parseActivityChanges } from './log-activity';

/**
 * Formats activity details based on entity type and action
 * Returns meaningful, human-readable information instead of raw data
 * 
 * This utility follows DRY principle - used across PDF, UI components, and tables
 * 
 * @param log - Activity log to format
 * @returns Human-readable description of the activity
 */
export const formatActivityDetails = (log: ActivityLog): string => {
  try {
    const changes = parseActivityChanges(log.changes);
    const oldData = changes.old || {};
    const newData = changes.new || {};

    // Attendance activities
    if (log.entityType === ActivityEntityType.ATTENDANCE) {
      if (log.action === ActivityAction.CREATE) {
        // Check-in
        const checkInTime = newData.checkInTime as string;
        const status = newData.status as string;
        if (checkInTime) {
          const time = format(new Date(checkInTime), 'HH:mm:ss');
          return `Checked in at ${time}${status ? ` (${status})` : ''}`;
        }
        return 'Checked in';
      } else if (log.action === ActivityAction.UPDATE) {
        // Check-out or status update
        if (newData.checkOutTime) {
          const checkOutTime = format(new Date(newData.checkOutTime as string), 'HH:mm:ss');
          const totalHours = newData.totalHours as number;
          const status = newData.status as string;
          let details = `Checked out at ${checkOutTime}`;
          if (totalHours) {
            details += ` (${totalHours.toFixed(1)}h)`;
          }
          if (status) {
            details += ` - ${status}`;
          }
          return details;
        } else if (newData.status) {
          return `Status changed to ${newData.status}`;
        }
        return 'Attendance updated';
      }
    }

    // Task activities
    if (log.entityType === ActivityEntityType.TASK) {
      if (log.action === ActivityAction.CREATE) {
        const taskName = newData.name as string;
        const description = newData.description as string;
        const status = newData.status as string;
        let details = taskName || 'New task';
        if (description) {
          const shortDesc = description.length > 50 ? description.substring(0, 47) + '...' : description;
          details += `\n${shortDesc}`;
        }
        if (status) {
          details += `\nStatus: ${status}`;
        }
        return details;
      } else if (log.action === ActivityAction.UPDATE) {
        const details: string[] = [];
        
        if (newData.name && newData.name !== oldData.name) {
          details.push(`Title: "${oldData.name || 'N/A'}" → "${newData.name}"`);
        }
        
        if (newData.status && newData.status !== oldData.status) {
          details.push(`Status: ${oldData.status || 'N/A'} → ${newData.status}`);
        }
        
        if (newData.description && newData.description !== oldData.description) {
          const desc = newData.description as string;
          const shortDesc = desc.length > 40 ? desc.substring(0, 37) + '...' : desc;
          details.push(`Description updated: ${shortDesc}`);
        }
        
        if (newData.dueDate && newData.dueDate !== oldData.dueDate) {
          const dueDate = format(new Date(newData.dueDate as string), 'MMM dd, yyyy');
          details.push(`Due date: ${dueDate}`);
        }

        return details.length > 0 ? details.join('\n') : 'Task updated';
      }
    }

    // Project activities
    if (log.entityType === ActivityEntityType.PROJECT) {
      if (log.action === ActivityAction.CREATE) {
        const projectName = newData.name as string;
        return `Project created: ${projectName || 'New project'}`;
      } else if (log.action === ActivityAction.UPDATE) {
        if (newData.name && newData.name !== oldData.name) {
          return `Project renamed: "${oldData.name || 'N/A'}" → "${newData.name}"`;
        }
        return 'Project updated';
      }
    }

    // Comment activities
    if (log.entityType === ActivityEntityType.COMMENT) {
      if (log.action === ActivityAction.CREATE) {
        const content = newData.content as string;
        const shortContent = content && content.length > 60 ? content.substring(0, 57) + '...' : content;
        return `Comment: ${shortContent || 'New comment'}`;
      }
    }

    // Invoice activities
    if (log.entityType === ActivityEntityType.INVOICE) {
      if (log.action === ActivityAction.CREATE) {
        const invoiceNumber = newData.invoiceNumber || newData.number;
        const amount = newData.amount || newData.total;
        let details = invoiceNumber ? `Invoice #${invoiceNumber}` : 'Invoice created';
        if (amount) {
          details += ` - ₹${typeof amount === 'number' ? amount.toFixed(2) : amount}`;
        }
        return details;
      } else if (log.action === ActivityAction.UPDATE) {
        if (newData.status && newData.status !== oldData.status) {
          return `Status: ${oldData.status || 'N/A'} → ${newData.status}`;
        }
        return 'Invoice updated';
      } else if (log.action === ActivityAction.DOWNLOAD) {
        return 'Invoice downloaded';
      }
    }

    // Member activities
    if (log.entityType === ActivityEntityType.MEMBER) {
      if (log.action === ActivityAction.CREATE) {
        const memberName = newData.name as string;
        return `Member added: ${memberName || 'New member'}`;
      } else if (log.action === ActivityAction.UPDATE) {
        if (newData.name && newData.name !== oldData.name) {
          return `Member name: "${oldData.name || 'N/A'}" → "${newData.name}"`;
        }
        if (newData.role && newData.role !== oldData.role) {
          return `Role changed: ${oldData.role || 'N/A'} → ${newData.role}`;
        }
        return 'Member updated';
      }
    }

    // Document activities
    if (
      log.entityType === ActivityEntityType.DOCUMENT_NDA ||
      log.entityType === ActivityEntityType.DOCUMENT_JOINING_LETTER ||
      log.entityType === ActivityEntityType.DOCUMENT_SALARY_SLIP ||
      log.entityType === ActivityEntityType.DOCUMENT_INVOICE
    ) {
      if (log.action === ActivityAction.DOWNLOAD) {
        const docType = log.entityType.replace('DOCUMENT_', '').replace(/_/g, ' ').toLowerCase();
        return `${docType} downloaded`;
      } else if (log.action === ActivityAction.CREATE) {
        const docType = log.entityType.replace('DOCUMENT_', '').replace(/_/g, ' ').toLowerCase();
        return `${docType} generated`;
      }
    }

    // Generic fallback
    if (log.action === ActivityAction.CREATE) {
      return 'Created';
    } else if (log.action === ActivityAction.UPDATE) {
      const changedFields = Object.keys(newData).filter(
        (key) => !key.startsWith('$') && newData[key] !== oldData[key]
      );
      if (changedFields.length > 0) {
        return `Updated: ${changedFields.slice(0, 3).join(', ')}${changedFields.length > 3 ? '...' : ''}`;
      }
      return 'Updated';
    } else if (log.action === ActivityAction.DELETE) {
      return 'Deleted';
    }

    return '-';
  } catch (error) {
    console.error('Error formatting activity details:', error);
    return 'Unable to parse details';
  }
};

/**
 * Formats activity details for single-line display (e.g., in tables)
 * Truncates long descriptions
 * 
 * @param log - Activity log to format
 * @param maxLength - Maximum length for truncation (default: 100)
 * @returns Single-line formatted description
 */
export const formatActivityDetailsShort = (log: ActivityLog, maxLength: number = 100): string => {
  const details = formatActivityDetails(log);
  // Replace newlines with spaces for single-line display
  const singleLine = details.replace(/\n/g, ' | ');
  return singleLine.length > maxLength ? singleLine.substring(0, maxLength - 3) + '...' : singleLine;
};
