import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userId } = await params

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const communityMemberships = await prisma.communityMember.findMany({
      where: {
        userId: userId,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    const managedCommunities = communityMemberships.map(cm => cm.community)

    return NextResponse.json(managedCommunities)

  } catch (error) {
    console.error("Failed to fetch managed communities:", error)
    return NextResponse.json({ error: "Failed to fetch managed communities" }, { status: 500 })
  }
}
