'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from 'lucide-react'; // For feature lists

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string; // e.g., "monthly", "yearly"
  features: string[];
  stripePriceId?: string; // Needed if creating Stripe subscriptions directly
}

interface PlanSelectionProps {
  userId: string;
  // onSubscriptionSuccess: () => void; // Callback for when subscription is successful
}

const PlanSelection: React.FC<PlanSelectionProps> = ({ userId }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [loadingPaymentIntent, setLoadingPaymentIntent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError(null);
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch plans: ${response.statusText}`);
      }
      setPlans(await response.json());
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while fetching plans.');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setError(null); // Clear previous errors
    setPaymentMessage(null); // Clear previous messages
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlanId) {
      setError("Please select a plan first.");
      return;
    }
    setLoadingPaymentIntent(true);
    setError(null);
    setPaymentMessage("Initializing secure payment...");

    try {
      const response = await fetch('/api/billing/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId: selectedPlanId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment.');
      }

      if (data.type === 'freePlan') {
        setPaymentMessage('This is a free plan. Redirecting to create subscription...');
        // Here you would typically call another endpoint to create the free subscription directly
        // For example: await fetch('/api/subscriptions', { method: 'POST', body: JSON.stringify({ userId, planId: selectedPlanId, status: 'active' }) });
        // Then onSubscriptionSuccess();
        alert("Conceptual: Free subscription would be created here.");
        setLoadingPaymentIntent(false);
        return;
      }

      const clientSecret = data.clientSecret;
      if (!clientSecret) {
        throw new Error('Could not retrieve payment secret. Please try again.');
      }

      setPaymentMessage(`Client Secret received: ${clientSecret.substring(0,30)}... Next step: Use Stripe.js to confirm payment/setup.`);
      // **CONCEPTUAL STRIPE.JS INTEGRATION POINT**
      // At this point, you would use Stripe.js with the clientSecret to confirm the card setup or payment.
      // Example (pseudo-code, actual implementation requires Stripe.js library):
      // const stripe = await loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');
      // const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      //   payment_method: { card: cardElementFromStripeElements }
      // });
      // if (stripeError) {
      //   setError(stripeError.message);
      //   setPaymentMessage(null);
      // } else {
      //   // SetupIntent successful, send setupIntent.payment_method to your server to create the subscription
      //   setPaymentMessage('Payment method configured! Creating subscription...');
      //   // await fetch('/api/subscriptions/create-with-stripe', { method: 'POST', body: JSON.stringify({ userId, planId: selectedPlanId, paymentMethodId: setupIntent.payment_method }) });
      //   // onSubscriptionSuccess();
      //   alert("Conceptual: Stripe.js would confirm setup here, then you'd create the subscription on your backend.");
      // }
      alert("Conceptual: Stripe Elements would be used here with clientSecret: " + clientSecret);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setPaymentMessage(null);
    } finally {
      setLoadingPaymentIntent(false);
    }
  };

  if (loadingPlans) {
    return <CardDescription>Loading available plans...</CardDescription>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {paymentMessage && (
        <Alert>
          <AlertTitle>Payment Status</AlertTitle>
          <AlertDescription>{paymentMessage}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col justify-between cursor-pointer transition-all ease-in-out duration-150
                        ${selectedPlanId === plan.id ? 'border-primary ring-2 ring-primary shadow-xl' : 'border-gray-200 dark:border-gray-700 hover:shadow-lg'}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency }).format(plan.price)}
                {' / '}{plan.billingCycle}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={(e) => { e.stopPropagation(); handleProceedToPayment(); }}
                disabled={loadingPaymentIntent || selectedPlanId !== plan.id}
              >
                {selectedPlanId === plan.id && loadingPaymentIntent ? 'Processing...' :
                 selectedPlanId === plan.id ? 'Proceed to Payment' : 'Select Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {plans.length === 0 && !loadingPlans && <CardDescription>No active plans available at the moment.</CardDescription>}
    </div>
  );
};

export default PlanSelection;
