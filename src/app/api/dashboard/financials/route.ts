import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

// GET /api/dashboard/financials - Retrieve financial metrics for the dashboard
export async function GET(request: Request) {
  const sessionUser = await getCurrentUser();

  // Authentication & Authorization
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  // Assuming 'ADMIN' role exists or similar check. Adjust as per your actual user model/role system.
  // @ts-ignore // Bypass TS error if 'role' is not explicitly on sessionUser type from getCurrentUser stub
  if (sessionUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. You do not have administrative privileges.' }, { status: 403 });
  }

  try {
    // 1. Total Active Subscriptions
    const totalActiveSubscriptions = await prisma.subscription.count({
      where: {
        status: 'active', // Assuming 'active' is the status for currently active, paying subscriptions
        // Add other conditions if 'active' could also mean 'trialing' for non-paying
      },
    });

    // 2. Paid Members & MRR Calculation
    const activeSubscriptionsWithPlan = await prisma.subscription.findMany({
      where: {
        status: 'active',
        // Optionally, filter out subscriptions to plans that are free if 'active' could include those
        // plan: {
        //   price: { gt: 0 }
        // }
      },
      include: {
        plan: {
          select: {
            price: true,
            billingCycle: true, // Assuming 'monthly', 'yearly'
          }
        }
      },
    });

    let mrr = 0;
    const paidUserIds = new Set<string>();

    activeSubscriptionsWithPlan.forEach(sub => {
      if (sub.plan && sub.plan.price > 0) {
        paidUserIds.add(sub.userId); // Count user if they have at least one active, paid subscription

        if (sub.plan.billingCycle === 'yearly') {
          mrr += sub.plan.price / 12;
        } else if (sub.plan.billingCycle === 'monthly') {
          mrr += sub.plan.price;
        }
        // Add handling for other billing cycles if necessary (e.g., quarterly)
      }
    });
    const numberOfPaidMembers = paidUserIds.size;
    const monthlyRecurringRevenue = parseFloat(mrr.toFixed(2)); // Ensure 2 decimal places

    // 3. Churn Rate (Simplified - Canceled or Expired in Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Subscriptions that became non-active (canceled, expired) in the last 30 days
    const churnedInLast30DaysCount = await prisma.subscription.count({
      where: {
        status: { in: ['canceled', 'expired'] }, // Define what constitutes a churned subscription status
        updatedAt: { gte: thirtyDaysAgo }, // When the status was updated to canceled/expired
      },
    });

    // For a basic churn rate, we need a denominator: active subscribers at the start of the period.
    // This is an approximation: Total current active + those who churned in the period.
    // A more accurate way needs historical snapshots or very detailed status transition logging.
    const approximateTotalAtStartOfPeriod = totalActiveSubscriptions + churnedInLast30DaysCount;

    let churnRate = 0;
    if (approximateTotalAtStartOfPeriod > 0) {
      churnRate = parseFloat(((churnedInLast30DaysCount / approximateTotalAtStartOfPeriod) * 100).toFixed(2));
    }
    // Given the complexity, returning the count of churned subscriptions might be more straightforward
    // and less prone to misinterpretation than a potentially inaccurate rate.
    // For this subtask, we'll return the calculated rate but acknowledge its simplified nature.

    // 4. 1-Time Sales (Last 30 Days)
    // Use the same thirtyDaysAgo as for churn calculation
    const oneTimePayments = await prisma.payment.findMany({
      where: {
        status: 'succeeded',
        subscriptionId: null, // Not linked to a recurring subscription
        planId: null,         // Not linked to a specific plan (could be for a one-off product/service)
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const oneTimeSalesCountLast30Days = oneTimePayments.length;
    const oneTimeSalesValueLast30Days = parseFloat(
      oneTimePayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)
    );

    // 5. Trials in Progress
    // This assumes 'trialing' is a defined status in your Subscription model.
    // If trials are identified differently (e.g., a specific plan, or a trialEndDate field), adjust query.
    const trialsInProgressCount = await prisma.subscription.count({
      where: { status: 'trialing' },
    });

    // 6. Trial Conversion Rate (Simplified - Placeholder for actual rate)
    // Count of subscriptions that became 'active' recently.
    const recentlyActivatedSubscriptionsLast30Days = await prisma.subscription.count({
      where: {
        status: 'active',
        // Assuming startDate reflects when it became active, or use updatedAt if status change is tracked there.
        // This might also count direct active subscriptions not from trials.
        // True trial conversion needs linking trial end to active start.
        startDate: { gte: thirtyDaysAgo },
      },
    });
    const trialConversionRate = null; // Placeholder for true conversion rate

    return NextResponse.json({
      totalActiveSubscriptions,
      numberOfPaidMembers,
      mrr: monthlyRecurringRevenue,
      churnRateSimplified: churnRate, // Percentage
      churnedLast30DaysCount: churnedInLast30DaysCount, // Raw count
      // Other Metrics
      oneTimeSalesCountLast30Days,
      oneTimeSalesValueLast30Days,
      trialsInProgressCount,
      recentlyActivatedSubscriptionsLast30Days,
      trialConversionRate, // Placeholder
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching financial metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch financial metrics.', details: error.message }, { status: 500 });
  }
}
