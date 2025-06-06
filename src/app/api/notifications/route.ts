import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

// GET /api/notifications - Retrieve notifications for the authenticated user
export async function GET(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const authenticatedUserId = sessionUser.id;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const isReadFilterParam = searchParams.get('isRead'); // 'true', 'false', or null

  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
  }
  if (isNaN(limit) || limit < 1 || limit > 50) { // Max limit 50 for notifications
    return NextResponse.json({ error: 'Invalid limit value. Must be between 1 and 50.' }, { status: 400 });
  }

  const skip = (page - 1) * limit;
  let isReadFilter: boolean | undefined = undefined;
  if (isReadFilterParam === 'true') {
    isReadFilter = true;
  } else if (isReadFilterParam === 'false') {
    isReadFilter = false;
  }

  try {
    const whereClause: any = {
      userId: authenticatedUserId,
    };
    if (isReadFilter !== undefined) {
      whereClause.isRead = isReadFilter;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        actor: { select: { id: true, name: true, username: true, image: true } },
        community: { select: { id: true, name: true, slug: true } },
        // Note: relatedEntity is not directly included here as it's dynamic.
        // Client would use relatedEntityType and relatedEntityId to build links/context.
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit,
    });

    const totalNotifications = await prisma.notification.count({ where: whereClause });

    return NextResponse.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(totalNotifications / limit),
      totalNotifications,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications.', details: error.message }, { status: 500 });
  }
}


// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const authenticatedUserId = sessionUser.id;

  try {
    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead === true) {
      // Mark all unread notifications as read for the user
      const result = await prisma.notification.updateMany({
        where: {
          userId: authenticatedUserId,
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'All unread notifications marked as read.', count: result.count }, { status: 200 });
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      // Ensure all IDs are strings to prevent injection, though Prisma should handle type safety
      const validNotificationIds = notificationIds.filter(id => typeof id === 'string');
      if (validNotificationIds.length === 0) {
          return NextResponse.json({ error: 'No valid notification IDs provided.' }, { status: 400 });
      }

      const result = await prisma.notification.updateMany({
        where: {
          id: { in: validNotificationIds },
          userId: authenticatedUserId, // Ensure user can only update their own notifications
        },
        data: { isRead: true },
      });
      if (result.count === 0) {
          return NextResponse.json({ message: 'No notifications found or updated. They might have already been read or do not belong to the user.'}, { status: 200 });
      }
      return NextResponse.json({ message: `${result.count} notification(s) marked as read.` , count: result.count }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Invalid request. Provide notificationIds array or markAllAsRead: true.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read.', details: error.message }, { status: 500 });
  }
}
