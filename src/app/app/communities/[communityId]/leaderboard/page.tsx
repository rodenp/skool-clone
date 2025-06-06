'use client'; // To use hooks like useParams if needed, or handle client-side interactions

import React from 'react';
import LeaderboardList from '@/components/leaderboard/LeaderboardList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

interface LeaderboardPageProps {
  params: {
    communityId: string;
  };
}

// This page will display the leaderboard for a specific community.
// It will extract communityId from the URL parameters.
export default function CommunityLeaderboardPage({ params }: LeaderboardPageProps) {
  const { communityId } = params;

  if (!communityId) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Community ID is missing. Cannot display leaderboard.</AlertDescription>
        </Alert>
        <Link href="/app/communities" className="text-blue-500 hover:underline mt-4 inline-block">
          Browse Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="mb-6">
        {/* TODO: Fetch and display community name here */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top contributors in the community (ID: {communityId}).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Community Rankings</CardTitle>
          <CardDescription>See who's leading the pack in this community!</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaderboardList communityId={communityId} />
        </CardContent>
      </Card>
    </div>
  );
}
