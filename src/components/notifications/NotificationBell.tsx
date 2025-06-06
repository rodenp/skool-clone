'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area"; // For scrollable dropdown
import { ClientNotification, getNotificationLinkAndText } from '@/lib/notifications/utils'; // Using ClientNotification
import { formatDistanceToNowStrict } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface NotificationBellProps {
  userId?: string | null; // Current user's ID, if available
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // Fetch a small list of recent unread notifications for the dropdown
      // And also get the total unread count. The API might need to support count separately
      // or we derive it from a broader query. For now, limit=5 for display.
      const response = await fetch(`/api/notifications?isRead=false&limit=5&page=1`);
      if (!response.ok) {
        // Silently fail for bell, or log error. Don't want to break header.
        console.error("Failed to fetch notifications for bell");
        return;
      }
      const data = await response.json(); // Expects { notifications: ClientNotification[], totalNotifications: number }
      setNotifications(data.notifications || []);

      // For unread count, the API might return total unread matching the query.
      // If `data.totalNotifications` is for *all* unread, that's our count.
      // Or, we might need another query if totalNotifications is for paginated set only.
      // For simplicity, let's assume totalNotifications from this query is the unread count.
      // A dedicated count endpoint `/api/notifications/unread-count` would be better.
      setUnreadCount(data.totalNotifications || 0);

    } catch (error) {
      console.error("Error fetching notifications for bell:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Optional: Set up polling or WebSocket for real-time updates to unreadCount
      // const interval = setInterval(fetchNotifications, 60000); // Poll every minute
      // return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (response.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); // Optimistic update for UI
        fetchNotifications(); // Re-fetch to confirm
      } else {
        console.error("Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: ClientNotification) => {
    setIsOpen(false); // Close dropdown on click
    // Optional: Mark specific notification as read
    if (!notification.isRead) {
       try {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: [notification.id] }),
        });
        fetchNotifications(); // Refresh list and count
       } catch (error) {
        console.error("Error marking notification as read:", error);
       }
    }
    // Navigation is handled by Link component
  };

  if (!userId) {
    return null; // Don't show bell if user not logged in
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 min-w-[1rem] px-1 text-xs flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {isLoading && <span className="text-xs text-gray-500">Loading...</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[300px] md:max-h-[400px]">
          {notifications.length === 0 && !isLoading && (
            <DropdownMenuItem disabled className="text-center text-gray-500 py-4">
              No unread notifications.
            </DropdownMenuItem>
          )}
          {notifications.map((notif) => {
            const { href, text } = getNotificationLinkAndText(notif);
            return (
              <DropdownMenuItem key={notif.id} asChild className={`p-2.5 ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <Link href={href} onClick={() => handleNotificationClick(notif)} className="block w-full">
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarImage src={notif.actor?.image || undefined} alt={notif.actor?.name || 'Actor'} />
                      <AvatarFallback>{(notif.actor?.name || 'N').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 mb-0.5 whitespace-normal break-words">{text}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDistanceToNowStrict(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            {notifications.length > 0 && (
                 <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="cursor-pointer justify-center">
                    <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
                </DropdownMenuItem>
            )}
          <DropdownMenuItem asChild className="cursor-pointer justify-center">
            <Link href="/app/notifications">View all notifications</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
