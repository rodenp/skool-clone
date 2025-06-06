import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma

// GET /api/plans - Fetches all active plans
export async function GET(request: Request) {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        active: true, // Only fetch plans that are currently active
      },
      orderBy: {
        price: 'asc', // Order by price, or name, or a custom order field
      },
    });

    // findMany returns an empty array if no records found, which is a valid response.
    return NextResponse.json(plans, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans', details: error.message }, { status: 500 });
  }
}
