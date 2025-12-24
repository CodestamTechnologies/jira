'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Notification } from '../types';
import { useMarkNotificationRead } from '../api/use-mark-notification-read';
import { useDeleteNotification } from '../api/use-delete-notification';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const router = useRouter();
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.$id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      markAsRead(notification.$id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.$id);
  };

  // Parse metadata using centralized utility (already parsed in API response)
  const metadata = notification.metadata;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
        !notification.read && 'bg-muted/30'
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bell className="size-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
              {notification.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleMarkAsRead}
                title="Mark as read"
              >
                <Check className="size-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={handleDelete}
              title="Delete"
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>

        {notification.link && (
          <Link
            href={notification.link}
            onClick={handleClick}
            className="mt-2 block text-xs font-medium text-primary hover:underline"
          >
            View details →
          </Link>
        )}
      </div>

      {!notification.read && (
        <div className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
      )}
    </div>
  );
};
