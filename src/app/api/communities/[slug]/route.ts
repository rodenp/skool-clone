import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        members: {
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
          },
          orderBy: {
            joinedAt: "asc"
          }
        },
        _count: {
          select: {
            members: true,
            posts: true,
            courses: true,
            events: true,
          }
        }
      }
    })

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(community)
  } catch (error) {
    console.error("Failed to fetch community:", error)
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    )
  }
}
