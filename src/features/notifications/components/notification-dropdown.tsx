'use client';

import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NotificationItem } from './notification-item';
import { useGetNotifications } from '../api/use-get-notifications';
import { useNotificationCount } from '../api/use-notification-count';
import { useMarkAllRead } from '../api/use-mark-all-read';
import { useCurrent } from '@/features/auth/api/use-current';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const NotificationDropdown = () => {
  const router = useRouter();
  const { data: user } = useCurrent();
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useNotificationCount();
  const { data: notificationsData, isLoading } = useGetNotifications({
    userId: user?.$id || '',
    read: false,
    limit: 10,
    offset: 0,
  });
  const { mutate: markAllRead, isPending: isMarkingAllRead } = useMarkAllRead();

  // Don't render if user is not logged in
  if (!user) return null;

  const notifications = notificationsData?.documents || [];

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push('/notifications');
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Bell className="size-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center p-0 text-xs"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={10}>
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 size-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You don't have any new notifications.
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <NotificationItem key={notification.$id} notification={notification} />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs"
                onClick={handleViewAll}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
