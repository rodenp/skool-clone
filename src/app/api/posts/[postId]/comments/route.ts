import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth

interface PostCommentsRouteContext {
  params: {
    postId: string;
  };
}

// POST /api/posts/[postId]/comments - Create a new comment
export async function POST(request: Request, { params }: PostCommentsRouteContext) {
  const { postId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to comment.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, parentId } = body; // userId will be from sessionUser.id

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }

    // Check if the post exists
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    // If parentId is provided, check if the parent comment exists and belongs to the same post
    if (parentId) {
      const parentCommentExists = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentCommentExists || parentCommentExists.postId !== postId) {
        return NextResponse.json({ error: 'Parent comment not found or does not belong to this post.' }, { status: 400 });
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: sessionUser.id,
        parentId: parentId || null, // Ensure parentId is null if not provided or empty
      },
      include: {
        author: { // Include author details in the response
          select: { id: true, name: true, image: true, username: true },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating comment for post ${postId}:`, error);
    if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2003') { // Foreign key constraint failed
        if (error.meta?.field_name?.includes('postId')) {
            return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
        }
         if (error.meta?.field_name?.includes('parentId')) {
            return NextResponse.json({ error: 'Parent comment not found.' }, { status: 400 });
        }
    }
    return NextResponse.json({ error: 'Failed to create comment.', details: error.message }, { status: 500 });
  }
}

// GET /api/posts/[postId]/comments - Get comments for a post
export async function GET(request: Request, { params }: PostCommentsRouteContext) {
  const { postId } = params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit to 10

  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
  }
  if (isNaN(limit) || limit < 1 || limit > 100) { // Max limit 100
    return NextResponse.json({ error: 'Invalid limit value.' }, { status: 400 });
  }

  try {
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        parentId: null, // Fetch only top-level comments initially
      },
      include: {
        author: { // Renamed from 'user' to 'author' to match create response
          select: { id: true, name: true, image: true, username: true },
        },
        replies: { // Include direct replies
          include: {
            author: {
              select: { id: true, name: true, image: true, username: true },
            },
            // To avoid overly deep nesting in this query, we might stop here.
            // Further replies for these replies can be fetched on demand by client.
            // replies: true // Potentially include one more level if desired, but be cautious.
          },
          orderBy: { createdAt: 'asc' },
        },
        // _count: { // If you want to show reply counts without fetching them all
        //   select: { replies: true }
        // }
      },
      orderBy: { createdAt: 'asc' },
      skip: skip,
      take: limit,
    });

    const totalTopLevelComments = await prisma.comment.count({
      where: {
        postId: postId,
        parentId: null,
      },
    });

    // If you want total comments including replies, the query is more complex
    // const totalComments = await prisma.comment.count({ where: { postId: postId } });


    return NextResponse.json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalTopLevelComments / limit),
      totalComments: totalTopLevelComments, // Total top-level comments
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch comments.', details: error.message }, { status: 500 });
  }
}
