import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

interface CommentRouteContext {
  params: {
    commentId: string;
  };
}

// PUT /api/comments/[commentId] - Update a comment
export async function PUT(request: Request, { params }: CommentRouteContext) {
  const { commentId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }

    const commentToUpdate = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!commentToUpdate) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    // Authorization: Check if the logged-in user is the author of the comment
    if (commentToUpdate.userId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden. You can only update your own comments.' }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true, image: true, username: true },
        },
        // Include replies if needed in response, though typically not for an update action
      },
    });

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating comment ${commentId}:`, error);
    return NextResponse.json({ error: 'Failed to update comment.', details: error.message }, { status: 500 });
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(request: Request, { params }: CommentRouteContext) {
  const { commentId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const commentToDelete = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!commentToDelete) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    // Authorization: Check if the logged-in user is the author or has admin/moderator rights
    // For this example, only author can delete. Extend with role checks if needed.
    // e.g., if (commentToDelete.userId !== sessionUser.id && !sessionUser.isAdmin) { ... }
    if (commentToDelete.userId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden. You can only delete your own comments.' }, { status: 403 });
    }

    // Note on deleting replies:
    // Prisma's default behavior for self-relations with onDelete: Cascade (if set in schema, which it might be by default for some implicit relations)
    // or if parentId is set to null for replies, needs careful consideration.
    // If parentId is simply an optional string without explicit onDelete cascade, deleting parent won't auto-delete replies.
    // For this subtask, we perform a simple delete of the target comment.
    // A more robust solution might involve:
    // 1. Soft deleting (add an `isDeleted` flag).
    // 2. Explicitly deleting all replies (recursive delete).
    // 3. Setting parentId of replies to null if you want to keep them but orphan them.
    // The current schema has `parent Comment? @relation("CommentReplies", fields: [parentId], references: [id])`
    // This doesn't specify onDelete, so Prisma's default might be `SetNull` if `parentId` is optional, or restrict if not.
    // We should check Prisma's default for this type of optional self-relation or be explicit in the schema if cascade is desired.
    // For now, this will delete the comment. If `parentId` on replies has a constraint, it might fail or set them to null.

    // First, update replies to this comment to have parentId = null (orphaning them)
    // This is important if you don't want a cascade delete or errors due to foreign key constraints.
    await prisma.comment.updateMany({
        where: { parentId: commentId },
        data: { parentId: null },
    });

    // Then delete the comment itself
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: 'Comment deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting comment ${commentId}:`, error);
    if (error.name === 'PrismaClientKnownRequestError') {
        // P2025: Record to delete not found (already handled by initial findUnique)
        // P2003: Foreign key constraint error (e.g. if replies were not handled and block deletion)
        if(error.code === 'P2003') {
             return NextResponse.json({ error: 'Failed to delete comment due to existing replies that could not be orphaned.' }, { status: 409 }); // Conflict
        }
    }
    return NextResponse.json({ error: 'Failed to delete comment.', details: error.message }, { status: 500 });
  }
}
