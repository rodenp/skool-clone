import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

// GET /api/dashboard/analytics - Retrieve analytics metrics for the dashboard
export async function GET(request: Request) {
  const sessionUser = await getCurrentUser();

  // Authentication & Authorization
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  // @ts-ignore // Bypass TS error if 'role' is not explicitly on sessionUser type
  if (sessionUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. You do not have administrative privileges.' }, { status: 403 });
  }

  try {
    // 1. About Page Visitors (Placeholder)
    const aboutPageVisitors = null; // Requires external analytics integration

    // 2. Signups (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30); // Use UTC to be consistent
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0); // Start of the 30th day ago

    const newSignupsLast30Days = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // 3. Signups (Previous 30 Days - for comparison)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setUTCDate(sixtyDaysAgo.getUTCDate() - 60);
    sixtyDaysAgo.setUTCHours(0, 0, 0, 0); // Start of the 60th day ago

    // thirtyDaysAgo here refers to the end of the "previous 30 day" period
    const newSignupsPrevious30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo, // Up to (but not including) the start of the "last 30 day" period
        },
      },
    });

    // 4. Conversion Rate (Placeholder)
    const conversionRate = null; // Requires unique visitor data from external analytics

    return NextResponse.json({
      aboutPageVisitors,
      newSignupsLast30Days,
      newSignupsPrevious30Days,
      conversionRate,
      visitorDataStatus: "requires_analytics_integration", // Note about placeholder data
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching analytics metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics metrics.', details: error.message }, { status: 500 });
  }
}
