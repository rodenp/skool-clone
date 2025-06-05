import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma

// Initialize Stripe SDK with the secret key
// Ensure STRIPE_SECRET_KEY is set in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Ensure STRIPE_WEBHOOK_SECRET is set in your environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !webhookSecret) {
    console.error('Stripe webhook signature or secret missing.');
    return NextResponse.json({ error: 'Webhook signature or secret missing.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  console.log('Received Stripe event:', event.type, event.id);
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
      console.log(`Processing invoice.payment_succeeded for invoice ${invoicePaymentSucceeded.id}`);
      try {
        const stripeCustomerId = invoicePaymentSucceeded.customer as string;
        const stripeSubscriptionId = invoicePaymentSucceeded.subscription as string;
        const stripeChargeId = invoicePaymentSucceeded.charge as string; // Or payment_intent

        const user = await prisma.user.findFirst({ where: { stripeCustomerId } });
        if (!user) {
          console.error(`User with Stripe Customer ID ${stripeCustomerId} not found.`);
          break;
        }

        const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId }});
        if (!subscription) {
            console.error(`Subscription with Stripe Subscription ID ${stripeSubscriptionId} not found.`);
            // Potentially create a subscription if it's the first payment for a new sub not yet in DB
            // This depends on your exact subscription creation flow.
            // For now, we'll assume subscription should exist.
            break;
        }

        // Create a Payment record
        await prisma.payment.create({
          data: {
            userId: user.id,
            subscriptionId: subscription.id,
            planId: subscription.planId, // Denormalized from subscription
            amount: invoicePaymentSucceeded.amount_paid / 100, // Stripe amounts are in cents
            currency: invoicePaymentSucceeded.currency.toUpperCase(),
            paymentGateway: 'stripe',
            paymentGatewayId: stripeChargeId || invoicePaymentSucceeded.payment_intent as string || invoicePaymentSucceeded.id,
            status: 'succeeded',
            paidAt: new Date(invoicePaymentSucceeded.status_transitions.paid_at! * 1000), // Convert Stripe timestamp
          },
        });

        // Ensure the associated Subscription is active and its period end is updated
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'active', // Or Stripe's subscription status if more granular
            // Stripe's current_period_end is a Unix timestamp
            endDate: invoicePaymentSucceeded.lines.data[0]?.period?.end ? new Date(invoicePaymentSucceeded.lines.data[0].period.end * 1000) : subscription.endDate,
            updatedAt: new Date(),
          },
        });
        console.log(`Payment recorded and subscription updated for invoice ${invoicePaymentSucceeded.id}`);
      } catch (dbError: any) {
        console.error(`Database error processing invoice.payment_succeeded ${invoicePaymentSucceeded.id}:`, dbError.message);
        // Potentially return 500 if we want Stripe to retry, but be careful with multiple processing
      }
      break;

    case 'invoice.payment_failed':
      const invoicePaymentFailed = event.data.object as Stripe.Invoice;
      console.log(`Processing invoice.payment_failed for invoice ${invoicePaymentFailed.id}`);
      try {
        const stripeCustomerId = invoicePaymentFailed.customer as string;
        const stripeSubscriptionId = invoicePaymentFailed.subscription as string;

        const user = await prisma.user.findFirst({ where: { stripeCustomerId } });
        if (!user) {
          console.error(`User with Stripe Customer ID ${stripeCustomerId} not found for failed payment.`);
          break;
        }

        const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId }});
        // Payment might not be linked to a subscription if it's for a one-time invoice

        await prisma.payment.create({
          data: {
            userId: user.id,
            subscriptionId: subscription?.id, // Optional
            planId: subscription?.planId, // Optional
            amount: invoicePaymentFailed.amount_due / 100,
            currency: invoicePaymentFailed.currency.toUpperCase(),
            paymentGateway: 'stripe',
            paymentGatewayId: invoicePaymentFailed.payment_intent as string || invoicePaymentFailed.id,
            status: 'failed',
            // paidAt remains null
          },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: invoicePaymentFailed.status || 'past_due', // Reflect Stripe invoice status or a general past_due
              updatedAt: new Date(),
            },
          });
        }
        console.log(`Failed payment recorded for invoice ${invoicePaymentFailed.id}`);
        // TODO: Notify the user about the payment failure
      } catch (dbError: any)        {
        console.error(`Database error processing invoice.payment_failed ${invoicePaymentFailed.id}:`, dbError.message);
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log(`Processing customer.subscription.updated for subscription ${subscriptionUpdated.id}`);
      try {
        const localSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionUpdated.id },
        });

        if (!localSubscription) {
          console.error(`Subscription with Stripe ID ${subscriptionUpdated.id} not found in local DB.`);
          // This might happen if the subscription was created directly on Stripe
          // or if this is the first webhook after creation and before local DB record is made.
          // Consider creating it if `subscriptionUpdated.metadata` links to your user/plan.
          break;
        }

        // Match Stripe Price ID to local Plan ID
        let localPlanId = localSubscription.planId;
        const stripePriceId = subscriptionUpdated.items.data[0]?.price.id;
        if (stripePriceId) {
            const plan = await prisma.plan.findFirst({ where: { stripePriceId }});
            if (plan) {
                localPlanId = plan.id;
            } else {
                console.warn(`Plan with Stripe Price ID ${stripePriceId} not found. Subscription ${localSubscription.id} plan not updated.`);
            }
        }

        await prisma.subscription.update({
          where: { id: localSubscription.id },
          data: {
            status: subscriptionUpdated.status,
            planId: localPlanId,
            endDate: new Date(subscriptionUpdated.current_period_end * 1000),
            // cancel_at_period_end is a boolean on Stripe subscription
            // You might want a specific status like 'canceling' if true
            // For now, just updating status directly from Stripe handles 'canceled' too.
            updatedAt: new Date(subscriptionUpdated.created * 1000), // or current date
          },
        });
        console.log(`Local subscription ${localSubscription.id} updated from Stripe event.`);
      } catch (dbError: any) {
        console.error(`Database error processing customer.subscription.updated ${subscriptionUpdated.id}:`, dbError.message);
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log(`Processing customer.subscription.deleted for subscription ${subscriptionDeleted.id}`);
      // This event occurs when a subscription is actually canceled/deleted in Stripe
      // (either immediately or at period end if cancel_at_period_end was true).
      try {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionDeleted.id },
          data: {
            status: 'canceled', // Or 'expired', depending on your terminology
            endDate: new Date(subscriptionDeleted.ended_at! * 1000), // ended_at should be available
          },
        });
        console.log(`Subscription ${subscriptionDeleted.id} marked as canceled in local DB.`);
      } catch (dbError: any) {
        console.error(`Database error processing customer.subscription.deleted ${subscriptionDeleted.id}:`, dbError.message);
      }
      break;

    // Add other event types to handle as needed:
    // case 'setup_intent.succeeded':
    //   const setupIntentSucceeded = event.data.object as Stripe.SetupIntent;
    //   // Usually, client confirms this and then sends PaymentMethod ID to server to create subscription.
    //   // If you need to store something about the setup itself:
    //   console.log(`SetupIntent ${setupIntentSucceeded.id} succeeded.`);
    //   break;

    // case 'payment_intent.succeeded':
    //   const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
    //   // Useful if you have one-time payments not tied to invoices/subscriptions.
    //   // Logic would be similar to invoice.payment_succeeded for creating a Payment record.
    //   console.log(`PaymentIntent ${paymentIntentSucceeded.id} succeeded.`);
    //   break;

    // case 'checkout.session.completed':
    //   const session = event.data.object as Stripe.Checkout.Session;
    //   // Handle payment and subscription creation if using Stripe Checkout.
    //   // This is a more involved flow where Stripe hosts the payment page.
    //   if (session.mode === 'subscription') {
    //     // Logic to create/update subscription and payment records
    //   } else if (session.mode === 'payment') {
    //     // Logic to create payment record
    //   }
    //   break;

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
