import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma

// Initialize Stripe SDK with the secret key
// Ensure STRIPE_SECRET_KEY is set in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // Use the latest API version
});

// POST /api/billing/create-payment-intent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, planId, paymentMethodId } = body; // paymentMethodId is optional here

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing userId or planId' }, { status: 400 });
    }

    // 1. Retrieve the user from your database to get their stripeCustomerId
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user has a Stripe Customer ID. Create one if they don't.
    // This logic might also reside in user signup or a dedicated "create customer" endpoint.
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: {
          internalUserId: userId,
        },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // 2. Retrieve the plan details from your database
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // This endpoint will primarily focus on SetupIntents for new subscriptions.
    // For a new subscription, we typically want to set up a payment method for future use.
    // The actual subscription can be created after the payment method is successfully set up on the client
    // and the PaymentMethod ID is sent back to another endpoint (e.g., /api/subscriptions).

    // Option A: Create a SetupIntent (Recommended for setting up future payments for subscriptions)
    // The client will confirm this SetupIntent with Stripe.js using its client_secret.
    // After successful confirmation, the client gets a PaymentMethod ID that can be used to create the subscription.
    if (plan.price > 0) { // For paid plans, create a setup intent
        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          payment_method_types: ['card'], // Or other types like ['sepa_debit'], etc.
          metadata: {
            userId: userId,
            planId: planId,
          },
        });
        return NextResponse.json({ clientSecret: setupIntent.client_secret, type: 'setupIntent' });
    } else {
        // For free plans, no payment setup is needed.
        // The client can proceed to create the subscription directly without a payment method.
        // This endpoint might not even be called for free plans, or could return a specific signal.
        return NextResponse.json({ message: 'Free plan, no payment intent needed.', type: 'freePlan' });
    }

    // Option B: Create a PaymentIntent for a one-time payment (less common for initial subscription setup)
    // This would be if you are charging a one-time setup fee or for a non-subscription product.
    /*
    if (paymentMethodId) { // If client already has a payment method ID
        const paymentIntent = await stripe.paymentIntents.create({
            amount: plan.price * 100, // Amount in cents
            currency: plan.currency.toLowerCase(),
            customer: stripeCustomerId,
            payment_method: paymentMethodId,
            off_session: false, // Typically true if charging an existing PM, false if client confirms
            confirm: true, // Attempt to confirm immediately
            metadata: { userId, planId },
        });
        return NextResponse.json({ clientSecret: paymentIntent.client_secret, status: paymentIntent.status });
    } else { // If client needs to provide payment details
        const paymentIntent = await stripe.paymentIntents.create({
            amount: plan.price * 100, // Amount in cents
            currency: plan.currency.toLowerCase(),
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            metadata: { userId, planId },
        });
        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }
    */

    // Option C: Create subscription directly and use client_secret from its first invoice's payment_intent
    // This is an advanced flow.
    /*
    const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripePriceId }], // Assuming plan.stripePriceId exists
        payment_behavior: 'default_incomplete', // Creates subscription pending payment
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, planId },
    });
    // @ts-ignore because latest_invoice and payment_intent might not be directly on type for expand
    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (paymentIntent && typeof paymentIntent !== 'string' && paymentIntent.client_secret) {
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            subscriptionId: subscription.id,
            type: 'subscriptionIntent'
        });
    } else {
        // Handle cases where payment is not required (e.g. trial) or payment_intent is not created
        return NextResponse.json({ subscriptionId: subscription.id, status: subscription.status, type: 'subscriptionCreated' });
    }
    */

  } catch (error: any) {
    console.error('Error creating payment/setup intent:', error);
    // Check for Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      return NextResponse.json({ error: error.message, type: error.type }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: 'Failed to create payment/setup intent' }, { status: 500 });
  }
}
