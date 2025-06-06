'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ClientNotification, getNotificationLinkAndText } from '@/lib/notifications/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, MailWarning, BellRing } from 'lucide-react'; // Icons
import { formatDistanceToNowStrict } from 'date-fns';

interface NotificationListProps {
  currentUserId: string | null; // Needed if API requires auth, even if filtered by userId in backend
}

interface PaginatedNotificationResponse {
  notifications: ClientNotification[];
  currentPage: number;
  totalPages: number;
  totalNotifications: number;
}

const NOTIFICATIONS_PER_PAGE = 15;

const NotificationList: React.FC<NotificationListProps> = ({ currentUserId }) => {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async (page: number, currentFilter: 'all' | 'unread') => {
    if (!currentUserId) {
        setIsLoading(false);
        setError("User not authenticated.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/notifications?page=${page}&limit=${NOTIFICATIONS_PER_PAGE}`;
      if (currentFilter === 'unread') {
        url += '&isRead=false';
      }
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications.');
      }
      const data: PaginatedNotificationResponse = await response.json();
      setNotifications(data.notifications);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchNotifications(currentPage, filter);
  }, [fetchNotifications, currentPage, filter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      if (response.ok) {
        // Optimistically update UI or refetch
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        // Potentially refetch if counts or other things need updating from server
        // fetchNotifications(currentPage, filter);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as read");
      }
    } catch (err: any) {
      setError(err.message || 'Could not mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (response.ok) {
        fetchNotifications(1, 'all'); // Refetch all, reset to page 1
        setFilter('all');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark all as read");
      }
    } catch (err: any) {
      setError(err.message || 'Could not mark all notifications as read.');
    }
  };


  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading && notifications.length === 0) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading notifications...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error} <Button variant="link" size="sm" onClick={() => fetchNotifications(1, filter)}>Try again</Button></AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="space-x-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => { setFilter('all'); setCurrentPage(1);}}>All</Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => { setFilter('unread'); setCurrentPage(1);}}>Unread</Button>
        </div>
        <Button variant="outline" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.isRead)}>
            <CheckCheck className="h-4 w-4 mr-2"/> Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <MailWarning className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No {filter === 'unread' ? 'unread' : ''} notifications.</p>
          {filter === 'unread' && <p>You're all caught up!</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map(notif => {
            const { href, text } = getNotificationLinkAndText(notif);
            return (
              <li
                key={notif.id}
                className={`p-4 rounded-lg border flex items-start space-x-3 transition-colors dark:border-gray-700 ${
                  notif.isRead
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
                }`}
              >
                <Avatar className="h-10 w-10 mt-0.5 flex-shrink-0">
                  <AvatarImage src={notif.actor?.image || undefined} alt={notif.actor?.name || 'Actor'} />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                    {(notif.actor?.name || 'N').charAt(0).toUpperCase() || <BellRing size={20}/>}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <Link href={href} className="hover:underline">
                    <p className={`text-sm mb-1 whitespace-normal break-words ${notif.isRead ? 'text-gray-600 dark:text-gray-300' : 'font-semibold text-gray-800 dark:text-gray-100'}`}>
                      {text}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDistanceToNowStrict(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="Mark as read"
                    className="flex-shrink-0 ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
