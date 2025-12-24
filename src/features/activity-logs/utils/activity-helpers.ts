import {
  CheckCircle2,
  Download,
  FileText,
  Folder,
  Mail,
  MessageSquare,
  Trash2,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ActivityAction, ActivityEntityType } from '../types';

/**
 * Configuration for activity actions
 * Used for consistent styling and icons across components
 */
export interface ActionConfig {
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  badge: string;
}

/**
 * Get action configuration (icon, colors, badge styles)
 * Centralized to follow DRY principle
 * 
 * @param action - Activity action type
 * @param includeFullConfig - Whether to include full config (color, bgColor, borderColor) or just icon and badge
 * @returns Action configuration object
 */
export const getActionConfig = (action: ActivityAction, includeFullConfig: boolean = false): ActionConfig => {
  const baseConfig = {
    [ActivityAction.CREATE]: {
      icon: CheckCircle2,
      badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
      ...(includeFullConfig && {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-800',
      }),
    },
    [ActivityAction.UPDATE]: {
      icon: FileText,
      badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
      ...(includeFullConfig && {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
      }),
    },
    [ActivityAction.DELETE]: {
      icon: Trash2,
      badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
      ...(includeFullConfig && {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800',
      }),
    },
    [ActivityAction.DOWNLOAD]: {
      icon: Download,
      badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
      ...(includeFullConfig && {
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        borderColor: 'border-purple-200 dark:border-purple-800',
      }),
    },
    [ActivityAction.SEND_EMAIL]: {
      icon: Mail,
      badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
      ...(includeFullConfig && {
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        borderColor: 'border-orange-200 dark:border-orange-800',
      }),
    },
  };

  return (
    baseConfig[action] || {
      icon: FileText,
      badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-800',
      ...(includeFullConfig && {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        borderColor: 'border-gray-200 dark:border-gray-800',
      }),
    }
  );
};

/**
 * Get entity icon based on entity type
 * Centralized to follow DRY principle
 * 
 * @param entityType - Activity entity type
 * @returns Lucide icon component
 */
export const getEntityIcon = (entityType: ActivityEntityType): LucideIcon => {
  const iconMap: Record<ActivityEntityType, LucideIcon> = {
    [ActivityEntityType.TASK]: CheckCircle2,
    [ActivityEntityType.PROJECT]: Folder,
    [ActivityEntityType.WORKSPACE]: Folder,
    [ActivityEntityType.MEMBER]: User,
    [ActivityEntityType.COMMENT]: MessageSquare,
    [ActivityEntityType.INVOICE]: FileText,
    [ActivityEntityType.ATTENDANCE]: Users,
    [ActivityEntityType.DOCUMENT_NDA]: FileText,
    [ActivityEntityType.DOCUMENT_JOINING_LETTER]: FileText,
    [ActivityEntityType.DOCUMENT_SALARY_SLIP]: FileText,
    [ActivityEntityType.DOCUMENT_INVOICE]: FileText,
  };

  return iconMap[entityType] || FileText;
};

/**
 * Get human-readable action text
 * Centralized to follow DRY principle
 * 
 * @param action - Activity action type
 * @param entityType - Activity entity type
 * @param capitalize - Whether to capitalize first letter (default: false)
 * @returns Human-readable action text
 */
export const getActionText = (
  action: ActivityAction,
  entityType: ActivityEntityType,
  capitalize: boolean = false
): string => {
  const entityName = entityType.toLowerCase().replace(/_/g, ' ');
  
  const actionTextMap: Record<ActivityAction, string> = {
    [ActivityAction.CREATE]: `created ${entityName}`,
    [ActivityAction.UPDATE]: `updated ${entityName}`,
    [ActivityAction.DELETE]: `deleted ${entityName}`,
    [ActivityAction.DOWNLOAD]: `downloaded ${entityName}`,
    [ActivityAction.SEND_EMAIL]: `sent ${entityName} via email`,
  };

  const text = actionTextMap[action] || `${String(action).toLowerCase()} ${entityName}`;
  return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
};
