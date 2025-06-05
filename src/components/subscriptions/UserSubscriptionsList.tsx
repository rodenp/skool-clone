'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button component exists
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'; // Assuming Card components exist
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Assuming Table components exist
import { Badge } from "@/components/ui/badge"; // Assuming Badge component exists
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Assuming Alert components exist

interface Subscription {
  id: string;
  communityId: string;
  planId: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  // Placeholder for related data - in a real app, these would be populated
  communityName?: string;
  planName?: string;
}

interface UserSubscriptionsListProps {
  userId: string;
}

// Mock function to fetch community details - replace with actual API call
const fetchCommunityDetails = async (communityId: string) => {
  // In a real app, this would be:
  // const res = await fetch(`/api/communities/${communityId}`);
  // if (!res.ok) return { name: 'Unknown Community' };
  // const community = await res.json();
  // return community;
  return Promise.resolve({ name: `Community ${communityId.substring(0, 5)}...` });
};

// Mock function to fetch plan details - replace with actual API call
const fetchPlanDetails = async (planId: string) => {
  // In a real app, this would be:
  // const res = await fetch(`/api/plans/${planId}`);
  // if (!res.ok) return { name: 'Unknown Plan' };
  // const plan = await res.json();
  // return plan;
  return Promise.resolve({ name: `Plan ${planId.substring(0,5)}...` });
};

const UserSubscriptionsList: React.FC<UserSubscriptionsListProps> = ({ userId }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/subscriptions?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch subscriptions: ${response.statusText}`);
      }
      let data: Subscription[] = await response.json();

      // Fetch community and plan names for each subscription
      data = await Promise.all(
        data.map(async (sub) => {
          const community = await fetchCommunityDetails(sub.communityId);
          const plan = await fetchPlanDetails(sub.planId);
          return {
            ...sub,
            communityName: community.name,
            planName: plan.name,
          };
        })
      );
      setSubscriptions(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchSubscriptions();
    }
  }, [userId, fetchSubscriptions]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancelingId(subscriptionId);
    setError(null);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'canceled' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to cancel subscription: ${response.statusText}`);
      }
      // Refresh the list or update the specific subscription's status
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while canceling.');
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Loading Subscriptions...</CardTitle>
                <CardDescription>Please wait while we fetch your subscription details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-24">
                    {/* You can use a spinner component here */}
                    <p>Loading...</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (subscriptions.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>No Subscriptions Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You do not have any active or past subscriptions.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Your Subscriptions</CardTitle>
        <CardDescription>A list of your current and past subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Community</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.communityName || 'N/A'}</TableCell>
                <TableCell>{sub.planName || 'N/A'}</TableCell>
                <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {sub.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSubscription(sub.id)}
                      disabled={cancelingId === sub.id}
                    >
                      {cancelingId === sub.id ? 'Canceling...' : 'Cancel'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your subscriptions here. For new subscriptions, browse communities or plans.
        </p>
      </CardFooter>
    </Card>
  );
};

export default UserSubscriptionsList;
