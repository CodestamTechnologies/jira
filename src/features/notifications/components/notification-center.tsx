'use client';

import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { NotificationItem } from './notification-item';
import { useGetNotifications } from '../api/use-get-notifications';
import { useMarkAllRead } from '../api/use-mark-all-read';
import { useCurrent } from '@/features/auth/api/use-current';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationType } from '../types';

export const NotificationCenter = () => {
  const { data: user } = useCurrent();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: notificationsData, isLoading, refetch } = useGetNotifications({
    userId: user?.$id || '',
    read: activeTab === 'unread' ? false : undefined,
    limit,
    offset,
  });

  const { mutate: markAllRead, isPending: isMarkingAllRead } = useMarkAllRead();

  const notifications = notificationsData?.documents || [];
  const total = notificationsData?.total || 0;
  const hasMore = offset + limit < total;

  const handleMarkAllRead = () => {
    markAllRead(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Notifications
            </CardTitle>
            <CardDescription>View and manage all your notifications</CardDescription>
          </div>
          {notifications.length > 0 && activeTab === 'unread' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 size-4" />
              )}
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as 'all' | 'unread');
          setOffset(0);
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading && offset === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="mb-3 size-12 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTab === 'unread'
                    ? "You don't have any unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 pr-4">
                    {notifications.map((notification) => (
                      <NotificationItem key={notification.$id} notification={notification} />
                    ))}
                  </div>
                </ScrollArea>
                {hasMore && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load more'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};


