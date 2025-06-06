import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

interface EventRouteContext {
  params: {
    eventId: string;
  };
}

// PUT /api/events/[eventId] - Update an event
export async function PUT(request: Request, { params }: EventRouteContext) {
  const { eventId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, startDate, endDate, location } = body;

    // Validate incoming data
    if (title !== undefined && (title === null || title.trim() === '')) {
      return NextResponse.json({ error: 'Event title cannot be empty.' }, { status: 400 });
    }
    if (startDate !== undefined && endDate !== undefined) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for start or end date.' }, { status: 400 });
      }
      if (parsedStartDate >= parsedEndDate) {
        return NextResponse.json({ error: 'Event start date must be before end date.' }, { status: 400 });
      }
    } else if ((startDate !== undefined && endDate === undefined) || (startDate === undefined && endDate !== undefined)) {
        // If one date is provided, the other must be too, or fetched from existing record to validate.
        // For simplicity, require both if either is being updated to ensure validity.
        // A more complex logic would fetch existing event and validate against existing other date.
         return NextResponse.json({ error: 'Both start and end dates must be provided if one is being updated.' }, { status: 400 });
    }


    const eventToUpdate = await prisma.event.findUnique({
      where: { id: eventId },
      include: { community: { select: { ownerId: true } } }, // For checking community owner/admin later
    });

    if (!eventToUpdate) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // Authorization: Check if the logged-in user is the creator or an admin/owner of the community
    // This is a simplified check. A full RBAC might involve checking a CommunityMember role.
    const isCreator = eventToUpdate.creatorId === sessionUser.id;
    const isCommunityOwner = eventToUpdate.community.ownerId === sessionUser.id;
    // Add isAdmin check if you have a general admin role: const isAdmin = sessionUser.isAdmin;

    if (!isCreator && !isCommunityOwner /* && !isAdmin */) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to update this event.' }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description || null;
    if (startDate !== undefined) dataToUpdate.startDate = new Date(startDate);
    if (endDate !== undefined) dataToUpdate.endDate = new Date(endDate);
    if (location !== undefined) dataToUpdate.location = location || null;

    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
    }
    dataToUpdate.updatedAt = new Date(); // Manually update updatedAt

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: dataToUpdate,
      include: {
        creator: { select: { id: true, name: true, username: true, image: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating event ${eventId}:`, error);
    return NextResponse.json({ error: 'Failed to update event.', details: error.message }, { status: 500 });
  }
}

// DELETE /api/events/[eventId] - Delete an event
export async function DELETE(request: Request, { params }: EventRouteContext) {
  const { eventId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const eventToDelete = await prisma.event.findUnique({
      where: { id: eventId },
      include: { community: { select: { ownerId: true } } }, // For checking community owner/admin
    });

    if (!eventToDelete) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // Authorization: Check if the logged-in user is the creator or an admin/owner of the community
    const isCreator = eventToDelete.creatorId === sessionUser.id;
    const isCommunityOwner = eventToDelete.community.ownerId === sessionUser.id;
    // Add isAdmin check if you have a general admin role: const isAdmin = sessionUser.isAdmin;

    if (!isCreator && !isCommunityOwner /* && !isAdmin */) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to delete this event.' }, { status: 403 });
    }

    // Before deleting event, consider related data like EventRSVPs.
    // Prisma schema for EventRSVP has `onDelete: Cascade` for the event relation,
    // so RSVPs should be deleted automatically when an event is deleted.
    // If not, they would need to be manually deleted here:
    // await prisma.eventRSVP.deleteMany({ where: { eventId: eventId } });

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting event ${eventId}:`, error);
     if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2025') {
        return NextResponse.json({ error: 'Event not found or already deleted.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete event.', details: error.message }, { status: 500 });
  }
}
