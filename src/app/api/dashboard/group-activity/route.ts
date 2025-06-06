import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth'; // Placeholder for auth

// GET /api/dashboard/group-activity - Retrieve group activity metrics
export async function GET(request: Request) {
  const sessionUser = await getCurrentUser();

  // Authentication & Authorization
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  // @ts-ignore // Bypass TS error if 'role' is not explicitly on sessionUser type
  if (sessionUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. You do not have administrative privileges.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const communityId = searchParams.get('communityId');

  try {
    let totalMembers: number;
    let activeMembersLast30Days: number | null = null;
    let activeMembersDataStatus = "requires_activity_tracking"; // Default status

    // 1. Total Members
    if (communityId) {
      // Check if community exists first
      const communityExists = await prisma.community.count({ where: { id: communityId }});
      if (communityExists === 0) {
          return NextResponse.json({ error: `Community with ID ${communityId} not found.` }, { status: 404 });
      }
      totalMembers = await prisma.communityMember.count({
        where: { communityId: communityId },
      });
    } else {
      totalMembers = await prisma.user.count(); // Total platform users
    }

    // 2. Active Members (Last 30 Days - Simplified based on session activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find users with sessions that were active (i.e., 'expires' is in the future or recent past)
    // The `expires` field in NextAuth's Session model indicates when the session cookie expires.
    // A session active in the last 30 days means its `expires` timestamp is greater than 30 days ago.
    // However, to count users active *within* the last 30 days, we need to see if they *had* a session
    // that was valid at some point in the last 30 days. This means their session.expires > thirtyDaysAgo.
    // For a more direct measure of activity, an `updatedAt` on Session or a dedicated UserActivity table is better.
    // Let's assume `Session.expires` can give us a rough idea of users who *could* have been active.

    const recentUserSessions = await prisma.session.findMany({
      where: {
        // This condition means the session was valid at some point in the last 30 days.
        // Or, if `expires` means "last active + session duration", then this is also a good proxy.
        expires: { gte: thirtyDaysAgo },
      },
      distinct: ['userId'], // Get unique user IDs who had active sessions
    });

    const activeUserIdsFromSessions = recentUserSessions.map(s => s.userId);

    if (activeUserIdsFromSessions.length > 0) {
      if (communityId) {
        // Filter these active user IDs to those who are members of the specified community
        activeMembersLast30Days = await prisma.communityMember.count({
          where: {
            communityId: communityId,
            userId: { in: activeUserIdsFromSessions },
          },
        });
      } else {
        // Platform-wide active members based on session activity
        activeMembersLast30Days = activeUserIdsFromSessions.length;
      }
      activeMembersDataStatus = "calculated_via_recent_sessions";
    } else {
      activeMembersLast30Days = 0; // No recent sessions found
      activeMembersDataStatus = "no_recent_sessions_found";
    }


    // 3. Monthly Active Members / Daily Activity (Placeholders)
    const monthlyActiveMembers = null;
    const dailyActivity = null;

    return NextResponse.json({
      totalMembers,
      activeMembersLast30Days,
      monthlyActiveMembers, // Placeholder
      dailyActivity,        // Placeholder
      dataStatus: {
        activeMembers: activeMembersDataStatus,
        detailedActivity: "requires_advanced_analytics_or_dedicated_tracking",
      },
      context: communityId ? `community: ${communityId}` : "platform_wide",
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching group activity metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch group activity metrics.', details: error.message }, { status: 500 });
  }
}
