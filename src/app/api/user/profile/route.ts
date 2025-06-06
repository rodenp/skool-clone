import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/user/profile - Update authenticated user's profile
export async function PUT(request: Request) {
  const sessionUser = await getCurrentUser();

  // Authentication
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const authenticatedUserId = sessionUser.id;

  try {
    const body = await request.json();
    const { name, username, bio, image } = body;

    const dataToUpdate: {
      name?: string;
      username?: string;
      bio?: string;
      image?: string;
    } = {};

    // Validation and constructing dataToUpdate object
    if (name !== undefined) {
      if (typeof name === 'string') {
        dataToUpdate.name = name; // Allow empty string to clear name, or add validation if name is required
      } else {
        return NextResponse.json({ error: 'Invalid name format.' }, { status: 400 });
      }
    }

    if (username !== undefined) {
      if (typeof username === 'string' && username.trim() !== '') {
        // Basic username validation (e.g., length, allowed characters) could be added here.
        // For this example, just checking if not empty.
        dataToUpdate.username = username.trim();
      } else if (username === null || username.trim() === '') {
        // Allow explicitly setting username to null or empty if desired by application logic
        // However, usually username is required and unique. For now, let's assume if provided it must be non-empty.
        return NextResponse.json({ error: 'Username cannot be empty if provided.' }, { status: 400 });
      } else {
         return NextResponse.json({ error: 'Invalid username format.' }, { status: 400 });
      }
    }

    if (bio !== undefined) {
      if (typeof bio === 'string') {
        dataToUpdate.bio = bio;
      } else {
         return NextResponse.json({ error: 'Invalid bio format.' }, { status: 400 });
      }
    }

    if (image !== undefined) {
      if (image === null || image === '') {
        dataToUpdate.image = null; // Allow clearing the image
      } else if (typeof image === 'string') {
        // Basic URL validation (very simple check)
        try {
          new URL(image);
          dataToUpdate.image = image;
        } catch (_) {
          return NextResponse.json({ error: 'Invalid image URL format.' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Invalid image URL format.' }, { status: 400 });
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
    }

    // Uniqueness check for username if it's being updated
    if (dataToUpdate.username) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: dataToUpdate.username },
      });
      if (existingUserByUsername && existingUserByUsername.id !== authenticatedUserId) {
        return NextResponse.json({ error: 'Username already taken. Please choose another.' }, { status: 409 }); // 409 Conflict
      }
    }

    // Add updatedAt manually if not automatically handled by Prisma @updatedAt for all fields
    // For this User model, @updatedAt should handle it automatically.

    const updatedUser = await prisma.user.update({
      where: { id: authenticatedUserId },
      data: dataToUpdate,
      select: { // Select only the fields safe to return to the client
        id: true,
        name: true,
        username: true,
        email: true, // Email is generally not updatable here, but good to return consistent user object
        bio: true,
        image: true,
        points: true,
        level: true,
      }
    });

    return NextResponse.json({ message: 'Profile updated successfully.', user: updatedUser }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.name === 'PrismaClientKnownRequestError') {
      if (error.code === 'P2002') { // Unique constraint violation (e.g. if username somehow still conflicts despite check)
        return NextResponse.json({ error: 'Username already taken or another unique field conflict.' }, { status: 409 });
      }
    }
    return NextResponse.json({ error: 'Failed to update profile.', details: error.message }, { status: 500 });
  }
}
