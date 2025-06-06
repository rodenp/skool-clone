import React from 'react';
import { getCurrentUser } from '@/lib/auth'; // Assuming a way to get current user
import BillingHistoryList from '@/components/billing/BillingHistoryList';
import PlanSelection from '@/components/billing/PlanSelection';
import ManagePaymentMethods from '@/components/billing/ManagePaymentMethods';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default async function BillingPage() {
  const user = await getCurrentUser(); // Fetch current user

  if (!user || !user.id) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Please log in to view your billing information.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Billing Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your payment history, manage subscriptions, and update payment methods.
        </p>
      </header>

      {/* Section for Plan Selection - Conditionally render or link */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Choose or update your subscription plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanSelection userId={user.id} />
        </CardContent>
      </Card>

      {/* Section for Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Review your past payments and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <BillingHistoryList userId={user.id} />
        </CardContent>
      </Card>

      {/* Section for Managing Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods.</CardDescription>
        </CardHeader>
        <CardContent>
          <ManagePaymentMethods userId={user.id} />
        </CardContent>
      </Card>

    </div>
  );
}
