import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { communityId } = params;
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 50

    // Community ID is now directly available from params.
    // No need to fetch community first unless other community details are needed.
    // For fetching members, communityId is sufficient.
    // Optional: You might want to check if the community actually exists first.
    const communityExists = await prisma.community.count({
      where: { id: communityId },
    });

    if (communityExists === 0) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Fetch members
    const members = await prisma.communityMember.findMany({
      where: { communityId: communityId },
      take: limit,
      orderBy: [
        { role: "asc" }, // Owners first, then admins, etc.
        { joinedAt: "asc" }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            points: true,
            level: true,
          }
        }
      }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Failed to fetch community members:", error)
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    )
  }
}
