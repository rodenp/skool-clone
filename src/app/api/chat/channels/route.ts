import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

// GET /api/chat/channels - Retrieve all channels the authenticated user is a member of
export async function GET(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const authenticatedUserId = sessionUser.id;

  try {
    const channels = await prisma.chatChannel.findMany({
      where: {
        members: {
          some: {
            userId: authenticatedUserId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
        },
        lastMessage: {
          include: {
            sender: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
        },
        _count: { // To get member count easily
            select: { members: true }
        }
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // Add a 'name' for DM channels based on the other user for client convenience
    const processedChannels = channels.map(channel => {
      if (channel.isDirectMessage && channel.members.length === 2) {
        const otherMember = channel.members.find(m => m.userId !== authenticatedUserId);
        return {
          ...channel,
          name: otherMember?.user.name || otherMember?.user.username || 'Direct Message', // Use other user's name for DM
          image: otherMember?.user.image, // Use other user's image for DM
        };
      }
      return channel;
    });

    return NextResponse.json(processedChannels, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching chat channels:', error);
    return NextResponse.json({ error: 'Failed to fetch chat channels.', details: error.message }, { status: 500 });
  }
}

// POST /api/chat/channels - Create/find a DM channel
export async function POST(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const currentUserId = sessionUser.id;

  try {
    const body = await request.json();
    const { targetUserId, name, memberIds } = body; // name & memberIds for group chats (future)

    if (targetUserId) { // Logic for Direct Message
      if (targetUserId === currentUserId) {
        return NextResponse.json({ error: 'Cannot create a DM channel with yourself.' }, { status: 400 });
      }

      // Check if a DM channel already exists between currentUserId and targetUserId
      const existingChannel = await prisma.chatChannel.findFirst({
        where: {
          isDirectMessage: true,
          AND: [
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: targetUserId } } },
          ],
        },
        include: { // Include necessary details if returning existing channel
            members: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
            lastMessage: { include: { sender: {select: { id: true, name: true, username: true, image: true }} } }
        }
      });

      if (existingChannel) {
        // Process for client convenience (name, image)
         const otherMember = existingChannel.members.find(m => m.userId !== currentUserId);
         const processedChannel = {
            ...existingChannel,
            name: otherMember?.user.name || otherMember?.user.username || 'Direct Message',
            image: otherMember?.user.image
         };
        return NextResponse.json(processedChannel, { status: 200 });
      }

      // If not, create a new DM channel
      const newDMChannel = await prisma.chatChannel.create({
        data: {
          isDirectMessage: true,
          // Name can be null for DMs, or generated (e.g., "UserA & UserB")
          members: {
            create: [
              { userId: currentUserId },
              { userId: targetUserId },
            ],
          },
        },
        include: {
            members: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
        }
      });

      // Process for client convenience
      const otherMember = newDMChannel.members.find(m => m.userId !== currentUserId);
      const processedNewChannel = {
         ...newDMChannel,
         name: otherMember?.user.name || otherMember?.user.username || 'Direct Message',
         image: otherMember?.user.image
      };

      return NextResponse.json(processedNewChannel, { status: 201 });

    } else if (name && memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Future: Logic for Group Chat creation
      // 1. Ensure currentUserId is part of memberIds or add them.
      // 2. Validate memberIds (users exist).
      // 3. Create ChatChannel with isDirectMessage: false, name: name.
      // 4. Create ChatChannelMember entries for all memberIds.
      return NextResponse.json({ error: 'Group chat creation not yet implemented.' }, { status: 501 });
    } else {
      return NextResponse.json({ error: 'Invalid request. Provide targetUserId for DM or name/memberIds for group chat.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error creating/finding chat channel:', error);
    if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') { // Unique constraint failed
        return NextResponse.json({ error: 'A channel with these members might already exist or another unique constraint failed.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create/find chat channel.', details: error.message }, { status: 500 });
  }
}
