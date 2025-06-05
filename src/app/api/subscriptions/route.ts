import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma

// POST /api/subscriptions - Create a new subscription
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, communityId, planId, startDate, endDate, status } = body;

    if (!userId || !communityId || !planId || !startDate || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        communityId,
        planId,
        startDate: new Date(startDate), // Ensure startDate is a Date object
        endDate: endDate ? new Date(endDate) : null, // Ensure endDate is a Date object or null
        status,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    // Consider more specific error messages based on error type
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        // Handle Prisma-specific errors, e.g., foreign key constraint violation
        return NextResponse.json({ error: 'Failed to create subscription due to database error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// GET /api/subscriptions - Get subscriptions, optionally filtered by userId
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId query parameter' }, { status: 400 });
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
      },
    });

    if (!subscriptions) {
        return NextResponse.json({ error: 'No subscriptions found for this user' }, { status: 404 });
    }

    return NextResponse.json(subscriptions, { status: 200 });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
