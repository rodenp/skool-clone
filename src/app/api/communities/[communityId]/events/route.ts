export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth'; // Placeholder for auth

interface CommunityEventsRouteContext {
  params: {
    communityId: string;
  };
}

// POST /api/communities/[communityId]/events - Create a new event
export async function POST(request: Request, { params }: CommunityEventsRouteContext) {
  const { communityId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to create an event.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, startDate, endDate, location /* userId from sessionUser */ } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Event title cannot be empty.' }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Event start date and end date are required.' }, { status: 400 });
    }
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for start or end date.' }, { status: 400 });
    }
    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json({ error: 'Event start date must be before end date.' }, { status: 400 });
    }

    // Authorization: Check if user is a member/admin of the community
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: sessionUser.id,
          communityId: communityId,
        },
      },
    });
    // For this example, any member can create an event. Adjust if only admins/mods can.
    if (!membership) {
      // A more granular check could be:
      // if (!membership || ![MemberRole.ADMIN, MemberRole.MODERATOR, MemberRole.OWNER].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden. You must be a member of this community to create an event.' }, { status: 403 });
    }

    // Check if the community exists
    const communityExists = await prisma.community.findUnique({ where: { id: communityId } });
    if (!communityExists) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        location: location || null,
        creatorId: sessionUser.id, // Use sessionUser.id as creatorId
        communityId: communityId,
        // timezone might be a user/community setting or passed from client
      },
      include: {
        creator: { select: { id: true, name: true, username: true, image: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating event in community ${communityId}:`, error);
     if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2003') {
        if (error.meta?.field_name?.includes('communityId')) {
            return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
        }
    }
    return NextResponse.json({ error: 'Failed to create event.', details: error.message }, { status: 500 });
  }
}

// GET /api/communities/[communityId]/events - Get events for a community
export async function GET(request: Request, { params }: CommunityEventsRouteContext) {
  const { communityId } = params;
  const { searchParams } = new URL(request.url);

  const filterStartDateStr = searchParams.get('startDate');
  const filterEndDateStr = searchParams.get('endDate');
  const monthStr = searchParams.get('month'); // e.g., "2023-10"
  const yearStr = searchParams.get('year'); // e.g., "2023"

  let dateFilter: any = {};

  if (filterStartDateStr && filterEndDateStr) {
    const queryStartDate = new Date(filterStartDateStr);
    const queryEndDate = new Date(filterEndDateStr);
    if (!isNaN(queryStartDate.getTime()) && !isNaN(queryEndDate.getTime())) {
      dateFilter = {
        // Events that overlap with the given range
        // An event overlaps if its start is before range end AND its end is after range start
        AND: [
          { startDate: { lte: queryEndDate } }, // Event starts before or on queryEndDate
          { endDate: { gte: queryStartDate } },   // Event ends after or on queryStartDate
        ],
      };
    }
  } else if (monthStr) { // Format YYYY-MM
    const year = parseInt(monthStr.substring(0, 4), 10);
    const month = parseInt(monthStr.substring(5, 7), 10);
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      const monthStartDate = new Date(year, month - 1, 1);
      const monthEndDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
       dateFilter = {
        AND: [
          { startDate: { lte: monthEndDate } },
          { endDate: { gte: monthStartDate } },
        ],
      };
    }
  } else if (yearStr) {
    const year = parseInt(yearStr, 10);
    if (!isNaN(year)) {
        const yearStartDate = new Date(year, 0, 1);
        const yearEndDate = new Date(year, 11, 31, 23, 59, 59, 999);
         dateFilter = {
            AND: [
              { startDate: { lte: yearEndDate } },
              { endDate: { gte: yearStartDate } },
            ],
        };
    }
  }
  // If no date filters, it fetches all events for the community.

  try {
    const events = await prisma.event.findMany({
      where: {
        communityId: communityId,
        ...dateFilter, // Spread the date filter conditions
      },
      include: {
        creator: { select: { id: true, name: true, username: true, image: true } },
        // community: true, // Not strictly needed as we are filtering by communityId
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching events for community ${communityId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch events.', details: error.message }, { status: 500 });
  }
}
