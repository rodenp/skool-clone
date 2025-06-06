// src/app/app/profile/page.tsx
import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, CreditCard, Bell, Edit3, LogOut } from 'lucide-react'; // Icons

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Please <Link href="/app/login" className="font-semibold underline hover:text-blue-700">log in</Link> to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getInitials = (name?: string | null, fallback = 'U') => {
    if (!name) return fallback;
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl"> {/* Max width for profile page */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Your Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your personal information and settings.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader className="border-b dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 text-2xl border-2 border-gray-200 dark:border-gray-600">
              <AvatarImage src={user.image || undefined} alt={user.name || user.username || 'User Avatar'} />
              <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">{user.name || 'User Name Not Set'}</CardTitle>
              {user.username && <CardDescription className="text-gray-500 dark:text-gray-400">@{user.username}</CardDescription>}
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400 pt-1">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</h4>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {user.bio || 'No bio set. Tell us a bit about yourself!'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
                <span className="text-gray-500 dark:text-gray-400 block">Points:</span>
                <p className="font-medium text-gray-800 dark:text-gray-200">{user.points || 0}</p>
            </div>
            <div>
                <span className="text-gray-500 dark:text-gray-400 block">Level:</span>
                <p className="font-medium text-gray-800 dark:text-gray-200">{user.level || 1}</p>
            </div>
          </div>

          {/* Placeholder for more profile fields if they exist, e.g., join date */}
          {/* <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</h4>
            <p className="text-gray-800 dark:text-gray-200">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div> */}
        </CardContent>
        <CardFooter className="border-t dark:border-gray-700 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button variant="default" asChild>
                <Link href="/app/settings/profile"> {/* Assuming this route will exist */}
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </Link>
            </Button>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/app/settings/notifications">
                        <Bell className="h-4 w-4 mr-1.5" /> Notifications
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/app/billing">
                        <CreditCard className="h-4 w-4 mr-1.5" /> Billing
                    </Link>
                </Button>
                 {/* Add sign out button directly if not in a global header dropdown, or link to account settings */}
                 {/* <form action="/auth/signout" method="post">
                    <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <LogOut className="h-4 w-4 mr-1.5" /> Sign Out
                    </Button>
                 </form> */}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
