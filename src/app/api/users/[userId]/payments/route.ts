import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma
import { getCurrentUser } from '@/lib/auth'; // Assuming a way to get current user

interface RouteContext {
  params: {
    userId: string;
  };
}

// GET /api/users/[userId]/payments - Fetches payments for a given user
export async function GET(request: Request, { params }: RouteContext) {
  const { userId: routeUserId } = params;

  // Optional: Validate that the logged-in user can access these payments
  // This might involve checking if routeUserId matches the logged-in user's ID
  // or if the logged-in user has admin privileges.
  const sessionUser = await getCurrentUser(); // Adjust based on your auth setup
  if (!sessionUser || sessionUser.id !== routeUserId) {
    // Add admin check here if needed: && !sessionUser.isAdmin
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!routeUserId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    const payments = await prisma.payment.findMany({
      where: {
        userId: routeUserId,
      },
      orderBy: {
        createdAt: 'desc', // Show most recent payments first
      },
      include: {
        // Optionally include plan details if your Payment model has a direct relation
        // and you want to denormalize/return it here.
        // plan: true,
      }
    });

    if (!payments) {
      // findMany returns an empty array if no records found, not null/undefined
      // So, this check might not be strictly necessary unless there's another failure mode
      return NextResponse.json({ error: 'No payments found for this user or failed to fetch.' }, { status: 404 });
    }

    return NextResponse.json(payments, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching payments for user ${routeUserId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch payments', details: error.message }, { status: 500 });
  }
}
