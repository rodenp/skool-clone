import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface ActivityHeatmapRouteContext {
  params: {
    userId: string;
  };
}

// GET /api/users/[userId]/activity-heatmap - Fetches activity data for a user's heatmap
export async function GET(request: Request, { params }: ActivityHeatmapRouteContext) {
  const targetUserId = params.userId;
  const sessionUser = await getCurrentUser();

  // Authentication/Authorization
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  // For now, allow users to fetch their own heatmap data.
  // Admin override could be added: if (sessionUser.id !== targetUserId && sessionUser.role !== 'ADMIN') { ... }
  if (sessionUser.id !== targetUserId) {
    return NextResponse.json({ error: 'Forbidden. You can only view your own activity heatmap.' }, { status: 403 });
  }

  try {
    // Define date range (e.g., last 365 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 365);
    startDate.setHours(0, 0, 0, 0); // Start of the day, 365 days ago
    endDate.setHours(23, 59, 59, 999); // End of today

    // Fetch relevant activities for targetUserId within this date range
    const posts = await prisma.post.findMany({
      where: {
        authorId: targetUserId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    });

    const comments = await prisma.comment.findMany({
      where: {
        authorId: targetUserId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    });

    const reactions = await prisma.reaction.findMany({
      where: {
        userId: targetUserId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    });

    // Optionally, include other activities like LessonProgress, EventRSVP, CommunityMember join date etc.
    // const lessonProgress = await prisma.lessonProgress.findMany({
    //   where: { userId: targetUserId, updatedAt: { gte: startDate, lte: endDate }, isCompleted: true },
    //   select: { updatedAt: true } // or createdAt if that's more relevant
    // });

    // Process and Aggregate Data
    const activityCounts: { [dateString: string]: number } = {};

    const allActivities = [
        ...posts.map(p => p.createdAt),
        ...comments.map(c => c.createdAt),
        ...reactions.map(r => r.createdAt),
        // ...lessonProgress.map(lp => lp.updatedAt),
    ];

    allActivities.forEach(timestamp => {
      // Normalize createdAt to a date string (e.g., 'YYYY-MM-DD')
      // Ensure date is treated in a consistent timezone, ideally UTC for storage and then local for display.
      // For simplicity here, using local timezone of server.
      const dateString = timestamp.toISOString().split('T')[0];
      activityCounts[dateString] = (activityCounts[dateString] || 0) + 1;
    });

    // Convert to the desired response format
    const heatmapData = Object.entries(activityCounts).map(([date, count]) => ({
      date,
      count,
    }));

    // Sort by date, though not strictly necessary if the heatmap library handles it
    heatmapData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(heatmapData, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching activity heatmap for user ${targetUserId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch activity heatmap data.', details: error.message }, { status: 500 });
  }
}
