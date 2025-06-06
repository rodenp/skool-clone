import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

interface ChannelMessagesRouteContext {
  params: {
    channelId: string;
  };
}

// GET /api/chat/channels/[channelId]/messages - Retrieve messages for a channel
export async function GET(request: Request, { params }: ChannelMessagesRouteContext) {
  const { channelId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const authenticatedUserId = sessionUser.id;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '30', 10); // Default to 30 messages
  const cursor = searchParams.get('cursor'); // For cursor-based pagination (message ID)

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'Invalid limit value. Must be between 1 and 100.' }, { status: 400 });
  }

  try {
    // Verify user is a member of the channel
    const membership = await prisma.chatChannelMember.findFirst({
      where: {
        channelId: channelId,
        userId: authenticatedUserId,
      },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this channel.' }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId: channelId,
        deletedAt: null, // Only fetch non-deleted messages
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, image: true },
        },
        // readBy: true, // If detailed read receipts per message are needed by client immediately
      },
      orderBy: {
        createdAt: 'desc', // Get newest messages first for typical chat display
      },
      take: limit,
      ...(cursor && { // Spread cursor options if cursor is provided
        skip: 1, // Skip the cursor item itself
        cursor: {
          id: cursor,
        },
      }),
    });

    let nextCursor = null;
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].id;
    }

    // Messages are fetched in desc order for pagination, client might want to reverse for display
    return NextResponse.json({ messages: messages.reverse(), nextCursor }, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching messages for channel ${channelId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch messages.', details: error.message }, { status: 500 });
  }
}

// POST /api/chat/channels/[channelId]/messages - Create a new message in a channel
export async function POST(request: Request, { params }: ChannelMessagesRouteContext) {
  const { channelId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const senderId = sessionUser.id;

  try {
    const body = await request.json();
    const { content, attachmentUrl, attachmentType } = body;

    if (!content || content.trim() === '') {
      // Allow messages with only attachments if attachmentUrl is present
      if (!attachmentUrl) {
        return NextResponse.json({ error: 'Message content cannot be empty unless an attachment is provided.' }, { status: 400 });
      }
    }
    if (attachmentUrl && !attachmentType) {
        return NextResponse.json({ error: 'Attachment type is required if attachment URL is provided.'}, { status: 400 });
    }


    // Verify user is a member of the channel
    const membership = await prisma.chatChannelMember.findFirst({
      where: {
        channelId: channelId,
        userId: senderId,
      },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this channel.' }, { status: 403 });
    }

    const newMesageTime = new Date();

    // Use $transaction to create the message and update channel's lastMessageId and lastMessageAt
    const result = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.chatMessage.create({
        data: {
          content: content || "", // Ensure content is at least an empty string if null/undefined
          attachmentUrl,
          attachmentType,
          senderId,
          channelId,
          createdAt: newMesageTime, // Ensure consistent timestamp
          updatedAt: newMesageTime,
        },
        include: {
          sender: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      });

      await tx.chatChannel.update({
        where: { id: channelId },
        data: {
          lastMessageId: newMessage.id,
          lastMessageAt: newMessage.createdAt,
        },
      });

      // Also update the sender's lastReadAt for this channel to the message time
      await tx.chatChannelMember.updateMany({
          where: { channelId: channelId, userId: senderId },
          data: { lastReadAt: newMesageTime }
      });


      return newMessage;
    });

    // For real-time, this is where you'd broadcast the message (e.g., via WebSockets/Pusher/Ably)
    // Example: await pusher.trigger(channelId, 'new-message', result);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating message in channel ${channelId}:`, error);
    return NextResponse.json({ error: 'Failed to create message.', details: error.message }, { status: 500 });
  }
}
