'use client'; // For using hooks like useState, useEffect for user session

import React, { useState, useEffect } from 'react';
import NotificationList from '@/components/notifications/NotificationList';
import { getCurrentUser } from '@/lib/auth'; // Placeholder
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function NotificationsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const user = await getCurrentUser(); // Replace with your actual auth logic
        setCurrentUserId(user?.id || null);
      } catch (e) {
        console.error("Failed to fetch user for notifications page", e);
        setCurrentUserId(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoadingUser) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading user information...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Please <Link href="/login" className="font-semibold underline">log in</Link> to view your notifications.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Your Notifications</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Stay updated with the latest activities relevant to you.
        </p>
      </header>

      <Card className="shadow-sm">
        {/* CardHeader can be used if there are overall actions or title for the list container itself */}
        {/* <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Manage and view all your notifications.</CardDescription>
        </CardHeader> */}
        <CardContent className="p-0 sm:p-4"> {/* Add padding for larger screens, remove for list to handle its own */}
          <NotificationList currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  );
}
