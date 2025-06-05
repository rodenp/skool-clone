import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma

interface RouteContext {
  params: {
    subscriptionId: string;
  };
}

// GET /api/subscriptions/[subscriptionId] - Get a specific subscription
export async function GET(request: Request, { params }: RouteContext) {
  const { subscriptionId } = params;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json(subscription, { status: 200 });
  } catch (error) {
    console.error(`Error fetching subscription ${subscriptionId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// PUT /api/subscriptions/[subscriptionId] - Update a subscription
export async function PUT(request: Request, { params }: RouteContext) {
  const { subscriptionId } = params;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // Add specific validation for fields allowed to be updated, e.g. status, endDate
    const { status, endDate, planId, startDate, communityId } = body; // Allow updating more fields if needed

    const dataToUpdate: { status?: string; endDate?: Date | null, planId?: string, startDate?: Date, communityId?: string } = {};
    if (status) dataToUpdate.status = status;
    if (endDate !== undefined) dataToUpdate.endDate = endDate ? new Date(endDate) : null;
    if (planId) dataToUpdate.planId = planId;
    if (startDate) dataToUpdate.startDate = new Date(startDate);
    if (communityId) dataToUpdate.communityId = communityId;


    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedSubscription, { status: 200 });
  } catch (error) {
    console.error(`Error updating subscription ${subscriptionId}:`, error);
     if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        // P2025 is "Record to update not found"
        // @ts-ignore // code does not exist on type Error for TS < 4.9
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to update subscription due to database error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// DELETE /api/subscriptions/[subscriptionId] - Delete a subscription
export async function DELETE(request: Request, { params }: RouteContext) {
  const { subscriptionId } = params;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
  }

  try {
    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    return NextResponse.json({ message: 'Subscription deleted successfully' }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting subscription ${subscriptionId}:`, error);
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        // P2025 is "Record to delete not found"
        // @ts-ignore // code does not exist on type Error for TS < 4.9
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to delete subscription due to database error.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
