import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// No specific session/user authentication is strictly required for this endpoint
// if leaderboards are public within a community context, as per instructions.
// If auth were needed: import { getCurrentUser } from '@/lib/session';

interface LeaderboardRouteContext {
  params: {
    communityId: string;
  };
}

// GET /api/communities/[communityId]/leaderboard
export async function GET(request: Request, { params }: LeaderboardRouteContext) {
  const { communityId } = params;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10); // Default to top 10
  // const period = searchParams.get('period') || 'allTime'; // For future dynamic scoring

  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
  }
  if (isNaN(limit) || limit < 1 || limit > 100) { // Max limit 100 for performance
    return NextResponse.json({ error: 'Invalid limit value. Must be between 1 and 100.' }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  try {
    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
    }

    // Fetch community members and sort by user.points
    // For `User.points` based leaderboard, `period` is less relevant unless points are reset.
    // We'll fetch all members of the community and then sort/paginate in the application layer
    // if Prisma's direct orderBy on related field with skip/take is complex for this structure.
    // However, Prisma can handle this efficiently.

    const membersWithPoints = await prisma.user.findMany({
        where: {
            memberships: {
                some: {
                    communityId: communityId,
                },
            },
        },
        orderBy: {
            points: 'desc',
        },
        skip: skip,
        take: limit,
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            points: true,
            level: true,
        },
    });

    // Get total count of members in the community for pagination
    const totalMembers = await prisma.user.count({
        where: {
            memberships: {
                some: {
                    communityId: communityId,
                },
            },
        },
    });


    // Format the response with rank
    const leaderboard = membersWithPoints.map((user, index) => ({
      rank: skip + index + 1,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        points: user.points,
        level: user.level,
      },
      score: user.points, // Score is user.points for this implementation
    }));

    return NextResponse.json({
      leaderboard,
      currentPage: page,
      totalPages: Math.ceil(totalMembers / limit),
      totalEntries: totalMembers,
    }, { status: 200 });

    /*
    // Alternative/Future Ranking Logic Considerations (Commented Out)
    if (period === 'monthly' || period === 'weekly') {
      // This would require more complex queries on Post, Comment, Reaction tables
      // with date filters, grouping by userId, and applying a scoring formula.
      // Example conceptual structure:
      // const startDate = calculateStartDateForPeriod(period); // Helper function
      // const userActivityScores = await prisma.user.findMany({
      //   where: { memberships: { some: { communityId } } },
      //   include: {
      //     posts: { where: { communityId, createdAt: { gte: startDate } } },
      //     comments: { where: { post: { communityId }, createdAt: { gte: startDate } } },
      //     reactions: { where: { OR: [
      //        { post: { communityId }, createdAt: { gte: startDate } },
      //        { comment: { post: { communityId } }, createdAt: { gte: startDate } }
      //     ]}},
      //     // Potentially reactions received on user's posts/comments
      //   }
      // });
      // // Then, iterate userActivityScores, calculate a dynamic score, sort, and paginate.
      // return NextResponse.json({ error: 'Periodic leaderboards not yet implemented.' }, { status: 501 });
    }
    */

  } catch (error: any) {
    console.error(`Error fetching leaderboard for community ${communityId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard.', details: error.message }, { status: 500 });
  }
}
