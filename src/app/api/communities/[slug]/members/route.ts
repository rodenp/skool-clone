import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 50

    // First find the community
    const community = await prisma.community.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    // Fetch members
    const members = await prisma.communityMember.findMany({
      where: { communityId: community.id },
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
