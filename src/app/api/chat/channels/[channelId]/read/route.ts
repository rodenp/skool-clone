import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

interface ChannelReadRouteContext {
  params: {
    channelId: string;
  };
}

// POST /api/chat/channels/[channelId]/read - Update lastReadAt timestamp for a user in a channel
export async function POST(request: Request, { params }: ChannelReadRouteContext) {
  const { channelId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const authenticatedUserId = sessionUser.id;

  try {
    // Check if the channel exists and the user is a member
    const membership = await prisma.chatChannelMember.findFirst({
      where: {
        channelId: channelId,
        userId: authenticatedUserId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this channel or channel does not exist.' }, { status: 403 });
    }

    // Update the lastReadAt timestamp for the user in this specific channel
    await prisma.chatChannelMember.updateMany({ // use updateMany because a direct id might not be on ChatChannelMember if it's compound
      where: {
        channelId: channelId,
        userId: authenticatedUserId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Successfully updated last read timestamp.' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating lastReadAt for user ${authenticatedUserId} in channel ${channelId}:`, error);
    return NextResponse.json({ error: 'Failed to update last read timestamp.', details: error.message }, { status: 500 });
  }
}

// Note: A PUT request might also be suitable here, but POST is fine.
// If you want to pass a specific messageId up to which messages were read,
// the body of the POST/PUT could include that, and you could potentially
// also update MessageReadReceipts if using them for per-message granularity.
// For this implementation, just updating ChatChannelMember.lastReadAt is sufficient.
