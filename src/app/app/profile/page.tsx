// src/app/app/profile/page.tsx
// src/app/app/profile/page.tsx
import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, CreditCard, Bell, Edit3, LogOut, Users, Activity as ActivityIcon } from 'lucide-react'; // Added Users, ActivityIcon

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

  const userMemberships = await prisma.communityMember.findMany({
    where: { userId: user.id },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true
        }
      }
    },
    orderBy: {
      community: {
        name: 'asc'
      }
    }
  });

  let activityData: Array<{ date: string; count: number }> = [];
  if (user) {
    try {
      // Construct the full URL for server-side fetch
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Fallback for local dev
      const response = await fetch(`${baseUrl}/api/users/${user.id}/activity-heatmap`, { cache: 'no-store' });
      if (response.ok) {
        activityData = await response.json();
      } else {
        console.error("Failed to fetch activity heatmap data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching activity heatmap data:", error);
    }
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
            </div>
        </CardFooter>
      </Card>

      {/* My Communities Section */}
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-300" />
            My Communities
          </CardTitle>
          <CardDescription>Communities you are a member of.</CardDescription>
        </CardHeader>
        <CardContent>
          {userMemberships.length > 0 ? (
            <ul className="space-y-3">
              {userMemberships.map(membership => (
                <li key={membership.community.id}>
                  <Link href={`/app/communities/${membership.community.id}`} className="flex items-center space-x-3 p-3 -m-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Avatar className="h-10 w-10 border dark:border-gray-700">
                      <AvatarImage src={membership.community.image || undefined} alt={membership.community.name} />
                      <AvatarFallback>{getInitials(membership.community.name, 'C')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{membership.community.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You are not a member of any communities yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap Section */}
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ActivityIcon className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-300" />
            Activity Heatmap
          </CardTitle>
          <CardDescription>Your contribution activity over the last year.</CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            Placeholder for react-calendar-heatmap or similar library.
            Example usage:
            <CalendarHeatmap
              startDate={new Date(new Date().setDate(new Date().getDate() - 365))} // Example: last 365 days
              endDate={new Date()}
              values={activityData} // activityData should be an array of { date: string | Date, count: number }
              classForValue={(value) => {
                if (!value) return 'color-empty';
                // Example: scale of 0-4 for intensity
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
              tooltipDataAttrs={value => (value && value.date && value.count ? { 'data-tip': `${new Date(value.date).toLocaleDateString()}: ${value.count} activities` } : {})}
            />
            // Corresponding CSS would be needed:
            // .color-empty { fill: #eeeeee; }
            // .color-scale-0 { fill: #c6e48b; } // or some other very light color if 0 means no activity but day is tracked
            // .color-scale-1 { fill: #7bc96f; }
            // .color-scale-2 { fill: #49a951; }
            // .color-scale-3 { fill: #30813e; }
            // .color-scale-4 { fill: #196127; }
          */}
          {activityData.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Activity Heatmap would be shown here.</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Raw data (last 5 entries):</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(activityData.slice(-5).reverse(), null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No activity data to display for the heatmap, or it could not be loaded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
