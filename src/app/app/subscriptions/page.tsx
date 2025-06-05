import React from 'react';
import UserSubscriptionsList from '@/components/subscriptions/UserSubscriptionsList';
import { getCurrentUser } from '@/lib/session'; // Assuming a way to get current user

export default async function SubscriptionsPage() {
  const user = await getCurrentUser(); // Fetch current user (adjust based on auth setup)

  if (!user || !user.id) {
    // Handle case where user is not logged in or user ID is not available
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">My Subscriptions</h1>
        <p>Please log in to view your subscriptions.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Your Subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View, update, or cancel your active subscriptions.
        </p>
      </header>

      <UserSubscriptionsList userId={user.id} />

      {/* Placeholder for subscribing to new communities - can be a link or another component */}
      {/*
        Consider adding a link to a page with <SubscribeToCommunityForm />
        or conditionally rendering it here if no active subscriptions, etc.
        For example:
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Discover New Subscriptions</h2>
          <SubscribeToCommunityForm userId={user.id} />
        </div>
      */}
      <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Discover New Communities</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Browse communities and subscribe to new plans. (Link/Component to be added)
        </p>
      </div>
    </div>
  );
}
