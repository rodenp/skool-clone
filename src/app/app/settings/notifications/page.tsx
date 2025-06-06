'use client'; // For using hooks like useState, useEffect for user session

import React, { useState, useEffect } from 'react';
import NotificationSettingsForm from '@/components/notifications/NotificationSettingsForm';
import { getCurrentUser } from '@/lib/auth'; // Placeholder
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { CardDescription } from '@/components/ui/card';

export default function NotificationSettingsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const user = await getCurrentUser(); // Replace with your actual auth logic
        setCurrentUserId(user?.id || null);
      } catch (e) {
        console.error("Failed to fetch user for notification settings page", e);
        setCurrentUserId(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoadingUser) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
        <CardDescription>Loading user information...</CardDescription>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Please <Link href="/login" className="font-semibold underline">log in</Link> to manage your notification settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl"> {/* Max width for settings pages */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Notification Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Control how you receive notifications across the platform.
        </p>
      </header>

      <NotificationSettingsForm currentUserId={currentUserId} />
    </div>
  );
}
