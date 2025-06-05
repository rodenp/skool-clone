'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Assuming Alert components
import { Input } from '@/components/ui/input'; // For start date, though a date picker would be better

// Define interfaces for mock/prop data
interface Community {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number; //
  currency: string;
}

interface SubscribeToCommunityFormProps {
  userId: string;
  // Optional: pre-select community if the form is on a specific community page
  defaultCommunityId?: string;
  // Pass communities and plans as props, or fetch them internally
  communities?: Community[];
  plans?: Plan[];
}

// Mock function to fetch available plans - replace with actual API call or prop
const fetchAvailablePlans = async (communityId?: string): Promise<Plan[]> => {
  // If communityId is provided, fetch plans for that community
  // const res = await fetch(`/api/plans?communityId=${communityId}`);
  // For now, returning generic plans
  return Promise.resolve([
    { id: 'plan_1', name: 'Basic Plan', price: 1000, currency: 'USD' },
    { id: 'plan_2', name: 'Pro Plan', price: 2500, currency: 'USD' },
    { id: 'plan_free', name: 'Free Trial', price: 0, currency: 'USD' },
  ]);
};

// Mock function to fetch available communities - replace with actual API call or prop
const fetchAvailableCommunities = async (): Promise<Community[]> => {
  return Promise.resolve([
    { id: 'comm_1', name: 'Tech Enthusiasts Hub' },
    { id: 'comm_2', name: 'Gamers United' },
    { id: 'comm_3', name: 'Art & Design Collective' },
  ]);
};


const SubscribeToCommunityForm: React.FC<SubscribeToCommunityFormProps> = ({
  userId,
  defaultCommunityId,
  communities: initialCommunities,
  plans: initialPlans
}) => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>(defaultCommunityId);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [status, setStatus] = useState<string>('active'); // Default status

  const [availablePlans, setAvailablePlans] = useState<Plan[]>(initialPlans || []);
  const [availableCommunities, setAvailableCommunities] = useState<Community[]>(initialCommunities || []);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch communities if not provided
  useEffect(() => {
    if (!initialCommunities) {
      setLoading(true);
      fetchAvailableCommunities()
        .then(setAvailableCommunities)
        .catch(err => setError("Failed to load communities."))
        .finally(() => setLoading(false));
    }
  }, [initialCommunities]);

  // Fetch plans when a community is selected or if not provided initially
  useEffect(() => {
    if (!initialPlans) {
        // If defaultCommunityId is set, fetch its plans initially
        // Or if form allows selecting community, fetch plans when selectedCommunityId changes
      if (selectedCommunityId || !defaultCommunityId) {
        setLoading(true);
        fetchAvailablePlans(selectedCommunityId)
          .then(setAvailablePlans)
          .catch(err => setError("Failed to load plans."))
          .finally(() => setLoading(false));
      }
    } else {
        setAvailablePlans(initialPlans);
    }
  }, [selectedCommunityId, initialPlans, defaultCommunityId]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!selectedCommunityId || !selectedPlanId || !userId || !startDate || !status) {
      setError('Please fill in all required fields: Community, Plan, Start Date, and Status.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          communityId: selectedCommunityId,
          planId: selectedPlanId,
          startDate,
          status,
          // endDate can be omitted or set by backend logic for new 'active' subs
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to create subscription: ${response.statusText}`);
      }
      setSuccessMessage(`Successfully subscribed to plan: ${responseData.id}`);
      // Optionally reset form or redirect
      setSelectedPlanId(undefined); // Reset plan selection
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg w-full max-w-lg">
      <CardHeader>
        <CardTitle>Subscribe to a Community</CardTitle>
        <CardDescription>Choose a community and a plan to join.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {!defaultCommunityId && (
            <div className="space-y-1">
              <Label htmlFor="community">Community</Label>
              <Select onValueChange={setSelectedCommunityId} value={selectedCommunityId} disabled={loading}>
                <SelectTrigger id="community">
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {availableCommunities.map(comm => (
                    <SelectItem key={comm.id} value={comm.id}>{comm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(selectedCommunityId || defaultCommunityId) && (
            <div className="space-y-1">
              <Label htmlFor="plan">Plan</Label>
              <Select onValueChange={setSelectedPlanId} value={selectedPlanId} disabled={loading || availablePlans.length === 0}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.price / 100} {plan.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {availablePlans.length === 0 && <p className="text-sm text-gray-500">Select a community to see available plans.</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="status">Subscription Status</Label>
             <Select onValueChange={setStatus} value={status} disabled={loading}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  {/* More statuses might not be relevant for user creation */}
                </SelectContent>
              </Select>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading || !selectedPlanId || !selectedCommunityId}>
            {loading ? 'Subscribing...' : 'Subscribe Now'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SubscribeToCommunityForm;
