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
import { type ActivityLog } from '../types';
import { formatActivityDetailsShort } from '../utils/format-activity-details';
import { getActionConfig, getEntityIcon, getActionText } from '../utils/activity-helpers';
import { cn } from '@/lib/utils';

interface ActivityLogColumnsProps {
  onViewDetails?: (log: ActivityLog) => void;
}

// Using shared utilities from activity-helpers.ts (DRY principle)

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
      const activityDetails = formatActivityDetailsShort(log, 80);

      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn('text-xs font-medium w-fit', actionConfig.badge)}>
            <ActionIcon className="mr-1 size-3" />
            {log.action}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {getActionText(log.action, log.entityType, true)}
          </span>
          {activityDetails && activityDetails !== '-' && (
            <span className="text-xs text-foreground/80 mt-0.5">{activityDetails}</span>
          )}
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
    accessorKey: 'details',
    header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Details</span>,
    cell: ({ row }) => {
      const log = row.original;
      const activityDetails = formatActivityDetailsShort(log, 120);
      
      return (
        <div className="flex flex-col max-w-[200px]">
          {activityDetails && activityDetails !== '-' ? (
            <span className="text-xs text-foreground break-words">
              {activityDetails}
            </span>
          ) : (
            <code className="text-xs font-mono text-muted-foreground truncate">
              {log.entityId.slice(0, 16)}...
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
