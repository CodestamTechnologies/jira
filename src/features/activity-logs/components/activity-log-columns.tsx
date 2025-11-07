'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle2, Download, Eye, FileText, Folder, Mail, MessageSquare, MoreVertical, Trash2, User, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActivityAction, ActivityEntityType, type ActivityLog } from '../types';
import { cn } from '@/lib/utils';

interface ActivityLogColumnsProps {
  onViewDetails?: (log: ActivityLog) => void;
}

const getActionConfig = (action: ActivityAction) => {
  switch (action) {
    case ActivityAction.CREATE:
      return {
        icon: CheckCircle2,
        badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
      };
    case ActivityAction.UPDATE:
      return {
        icon: FileText,
        badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
      };
    case ActivityAction.DELETE:
      return {
        icon: Trash2,
        badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
      };
    case ActivityAction.DOWNLOAD:
      return {
        icon: Download,
        badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
      };
    case ActivityAction.SEND_EMAIL:
      return {
        icon: Mail,
        badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
      };
    default:
      return {
        icon: FileText,
        badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-800',
      };
  }
};

const getEntityIcon = (entityType: ActivityEntityType) => {
  switch (entityType) {
    case ActivityEntityType.TASK:
      return CheckCircle2;
    case ActivityEntityType.PROJECT:
      return Folder;
    case ActivityEntityType.WORKSPACE:
      return Folder;
    case ActivityEntityType.MEMBER:
      return User;
    case ActivityEntityType.COMMENT:
      return MessageSquare;
    case ActivityEntityType.INVOICE:
      return FileText;
    case ActivityEntityType.ATTENDANCE:
      return Users;
    case ActivityEntityType.DOCUMENT_NDA:
    case ActivityEntityType.DOCUMENT_JOINING_LETTER:
    case ActivityEntityType.DOCUMENT_SALARY_SLIP:
    case ActivityEntityType.DOCUMENT_INVOICE:
      return FileText;
    default:
      return FileText;
  }
};

const getActionText = (action: ActivityAction, entityType: ActivityEntityType) => {
  const entityName = entityType.toLowerCase().replace(/_/g, ' ');
  switch (action) {
    case ActivityAction.CREATE:
      return `Created ${entityName}`;
    case ActivityAction.UPDATE:
      return `Updated ${entityName}`;
    case ActivityAction.DELETE:
      return `Deleted ${entityName}`;
    case ActivityAction.DOWNLOAD:
      return `Downloaded ${entityName}`;
    case ActivityAction.SEND_EMAIL:
      return `Sent ${entityName} via email`;
    default:
      return `${String(action)} ${entityName}`;
  }
};

export const createActivityLogColumns = ({ onViewDetails }: ActivityLogColumnsProps = {}): ColumnDef<ActivityLog>[] => [
  {
    accessorKey: 'user',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          User
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-8 border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {log.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{log.username}</span>
            <span className="text-xs text-muted-foreground">{log.userEmail}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'action',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          Action
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const log = row.original;
      const actionConfig = getActionConfig(log.action);
      const ActionIcon = actionConfig.icon;

      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn('text-xs font-medium w-fit', actionConfig.badge)}>
            <ActionIcon className="mr-1 size-3" />
            {log.action}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {getActionText(log.action, log.entityType)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'entityType',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          Entity
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const log = row.original;
      const EntityIcon = getEntityIcon(log.entityType);

      return (
        <Badge variant="outline" className="text-xs">
          <EntityIcon className="mr-1 size-3" />
          {log.entityType}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'entityId',
    header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Entity ID</span>,
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="flex flex-col">
          <code className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
            {log.entityId}
          </code>
          {log.projectId && (
            <code className="text-xs font-mono text-muted-foreground/70 max-w-[120px] truncate">
              Project: {log.projectId.slice(0, 8)}...
            </code>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: '$createdAt',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          Timestamp
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {formatDistanceToNow(new Date(log.$createdAt), { addSuffix: true })}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(log.$createdAt).toLocaleString()}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Actions</span>,
    cell: ({ row }) => {
      const log = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewDetails && (
              <DropdownMenuItem onClick={() => onViewDetails(log)}>
                <Eye className="mr-2 size-4" />
                View Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(log.entityId);
              }}
            >
              <FileText className="mr-2 size-4" />
              Copy Entity ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
