// src/app/app/billing/page.tsx
import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import BillingHistoryList from '@/components/billing/BillingHistoryList';
import PlanSelection from '@/components/billing/PlanSelection';
import ManagePaymentMethods from '@/components/billing/ManagePaymentMethods';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link'; // For login link in alert

export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Please <Link href="/app/login" className="font-semibold underline hover:text-blue-700">log in</Link> to view your billing information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Billing Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View your payment history, manage subscriptions, and update payment methods.
        </p>
      </header>

      {/* Section for Plan Selection */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Choose or update your subscription plan.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4"> {/* Added some padding for content */}
          <PlanSelection userId={user.id} />
        </CardContent>
      </Card>

      {/* Section for Billing History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Review your past payments and invoices.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <BillingHistoryList userId={user.id} />
        </CardContent>
      </Card>

      {/* Section for Managing Payment Methods */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ManagePaymentMethods userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
