import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to join a community" },
        { status: 401 }
      )
    }

    const { slug } = await params

    // Find the community
    const community = await prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        isPrivate: true,
        isFree: true,
        price: true,
      }
    })

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this community" },
        { status: 400 }
      )
    }

    // For now, we'll allow free joining. In a real app, you'd handle payment here for paid communities
    if (!community.isFree) {
      return NextResponse.json(
        { error: "Paid community joining not implemented yet. Please contact the community owner." },
        { status: 400 }
      )
    }

    // Create membership
    await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
        role: "MEMBER",
      }
    })

    // Award points for joining a community
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: {
          increment: 10, // 10 points for joining a community
        }
      }
    })

    return NextResponse.json(
      { message: `Successfully joined ${community.name}!` },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to join community:", error)
    return NextResponse.json(
      { error: "Failed to join community" },
      { status: 500 }
    )
  }
}
