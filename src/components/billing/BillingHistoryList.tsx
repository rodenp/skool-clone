'use client';

import React, { useEffect, useState, useCallback } from 'react';
// Removed Table, TableBody, TableCell, TableHead, TableHeader, TableRow imports
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button'; // For potential actions like "View Invoice"
import { CardDescription } from '@/components/ui/card';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string; // Assuming ISO string from backend
  planId?: string | null;
  // In a real app, you might want to fetch planName if planId exists
  planName?: string; // Placeholder
  paymentGatewayId?: string; // For linking to Stripe invoice, etc.
}

interface BillingHistoryListProps {
  userId: string;
}

// Mock function to fetch plan details - replace with actual API call or pass as prop
// Or, ideally, the payments API would return plan names if needed.
const fetchPlanNameForPayment = async (planId: string | null | undefined): Promise<string> => {
  if (!planId) return 'N/A';
  // Example: const response = await fetch(`/api/plans/${planId}`);
  // const planData = await response.json(); return planData.name;
  return `Plan ${planId.substring(0, 5)}...`;
};


const BillingHistoryList: React.FC<BillingHistoryListProps> = ({ userId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}/payments`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch billing history: ${response.statusText}`);
      }
      let data: Payment[] = await response.json();

      // Optionally enrich with plan names (consider if API should do this)
      data = await Promise.all(
        data.map(async (payment) => {
          if (payment.planId) {
            payment.planName = await fetchPlanNameForPayment(payment.planId);
          }
          return payment;
        })
      );

      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBillingHistory();
    }
  }, [userId, fetchBillingHistory]);

  if (loading) {
    return <CardDescription>Loading billing history...</CardDescription>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Billing History</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (payments.length === 0) {
    return <CardDescription>No payment history found.</CardDescription>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'success'; // Assuming you have a 'success' variant for Badge
      case 'pending':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {new Date(payment.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {payment.planName || 'One-time payment or direct charge'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge variant={getStatusBadgeVariant(payment.status) as any}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {/* Conceptual: Link to Stripe invoice if paymentGatewayId is available */}
                {payment.status.toLowerCase() === 'succeeded' && payment.paymentGatewayId?.startsWith('in_') && (
                  <Button variant="outline" size="sm" onClick={() => window.open(`https://dashboard.stripe.com/test/invoices/${payment.paymentGatewayId}`, '_blank')}>
                      View Invoice (Test)
                  </Button>
                )}
                {payment.status.toLowerCase() === 'succeeded' && payment.paymentGatewayId?.startsWith('py_') && (
                  <Button variant="outline" size="sm" onClick={() => window.open(`https://dashboard.stripe.com/test/payments/${payment.paymentGatewayId}`, '_blank')}>
                      View Payment (Test)
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BillingHistoryList;
