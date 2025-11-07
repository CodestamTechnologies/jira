'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, FileText, Folder, MessageSquare, Trash2, User, Users } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ActivityAction, ActivityEntityType, type ActivityLog } from '../types';
import { parseActivityChanges, parseActivityMetadata } from '../utils/log-activity';
import { cn } from '@/lib/utils';

interface ActivityLogItemProps {
  log: ActivityLog;
}

const getActionConfig = (action: ActivityAction) => {
  switch (action) {
    case ActivityAction.CREATE:
      return {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-800',
        badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
      };
    case ActivityAction.UPDATE:
      return {
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
      };
    case ActivityAction.DELETE:
      return {
        icon: Trash2,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
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
  }
};

const getActionText = (action: ActivityAction, entityType: ActivityEntityType) => {
  const entityName = entityType.toLowerCase();
  switch (action) {
    case ActivityAction.CREATE:
      return `created ${entityName}`;
    case ActivityAction.UPDATE:
      return `updated ${entityName}`;
    case ActivityAction.DELETE:
      return `deleted ${entityName}`;
  }
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const formatChanges = (changes: string | { old?: Record<string, unknown>; new?: Record<string, unknown> }) => {
  const parsed = parseActivityChanges(changes);
  const entries: Array<{ key: string; old: unknown; new: unknown }> = [];

  // Filter out system fields (starting with $)
  const filterSystemFields = (obj: Record<string, unknown>) => {
    const filtered: Record<string, unknown> = {};
    for (const key in obj) {
      if (!key.startsWith('$')) {
        filtered[key] = obj[key];
      }
    }
    return filtered;
  };

  if (parsed.old && parsed.new) {
    // Update: show old vs new
    const filteredOld = filterSystemFields(parsed.old);
    const filteredNew = filterSystemFields(parsed.new);
    const allKeys = new Set([...Object.keys(filteredOld), ...Object.keys(filteredNew)]);
    allKeys.forEach((key) => {
      if (JSON.stringify(filteredOld[key]) !== JSON.stringify(filteredNew[key])) {
        entries.push({
          key,
          old: filteredOld[key],
          new: filteredNew[key],
        });
      }
    });
  } else if (parsed.new) {
    // Create: show new values
    const filteredNew = filterSystemFields(parsed.new);
    Object.entries(filteredNew).forEach(([key, value]) => {
      entries.push({ key, old: undefined, new: value });
    });
  } else if (parsed.old) {
    // Delete: show old values
    const filteredOld = filterSystemFields(parsed.old);
    Object.entries(filteredOld).forEach(([key, value]) => {
      entries.push({ key, old: value, new: undefined });
    });
  }

  return entries;
};

export const ActivityLogItem = ({ log }: ActivityLogItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const changes = formatChanges(log.changes);
  const hasChanges = changes.length > 0;
  const metadata = parseActivityMetadata(log.metadata);
  const hasMetadata = metadata && (metadata.ipAddress || metadata.userAgent);
  const actionConfig = getActionConfig(log.action);
  const ActionIcon = actionConfig.icon;
  const EntityIcon = getEntityIcon(log.entityType);

  return (
    <div className={cn(
      'group relative rounded-lg border transition-all hover:shadow-md',
      actionConfig.bgColor,
      actionConfig.borderColor,
      'border'
    )}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="size-10 border-2 border-background shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {log.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{log.username}</span>
                  <span className="text-muted-foreground">
                    {getActionText(log.action, log.entityType)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn('text-xs font-medium', actionConfig.badge)}>
                    <ActionIcon className="mr-1 size-3" />
                    {log.action}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <EntityIcon className="mr-1 size-3" />
                    {log.entityType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.$createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Changes Section */}
            {hasChanges && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-1 size-3" />
                        Hide changes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 size-3" />
                        Show {changes.length} change{changes.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <Separator />
                  <div className="rounded-md border bg-background/50 p-4 space-y-3">
                    {changes.map((change, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{change.key}</span>
                          {change.old !== undefined && change.new !== undefined && (
                            <ArrowRight className="size-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-1.5 pl-4">
                          {change.old !== undefined && (
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
                              <div className="flex-1 rounded bg-red-50 dark:bg-red-950/20 px-2 py-1.5">
                                <div className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
                                  {formatValue(change.old)}
                                </div>
                              </div>
                            </div>
                          )}
                          {change.new !== undefined && (
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                              <div className="flex-1 rounded bg-green-50 dark:bg-green-950/20 px-2 py-1.5">
                                <div className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
                                  {formatValue(change.new)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {idx < changes.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Metadata Section */}
            {hasMetadata && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  {metadata.ipAddress && (
                    <div>
                      <span className="font-medium">IP:</span> {metadata.ipAddress}
                    </div>
                  )}
                  {metadata.userAgent && (
                    <div className="truncate">
                      <span className="font-medium">User Agent:</span> {metadata.userAgent}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
