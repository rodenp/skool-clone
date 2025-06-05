import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCommunitySchema = z.object({
  name: z.string().min(1, "Community name is required").max(100),
  slug: z.string().min(1, "URL slug is required").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required").max(500),
  category: z.string().min(1, "Category is required"),
  isPrivate: z.boolean().default(false),
  isFree: z.boolean().default(true),
  price: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  image: z.string().optional(),
  banner: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to create a community" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCommunitySchema.parse(body)

    // Check if slug is already taken
    const existingCommunity = await prisma.community.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingCommunity) {
      return NextResponse.json(
        { error: "This URL slug is already taken. Please choose a different one." },
        { status: 400 }
      )
    }

    // Validate pricing
    if (!validatedData.isFree && validatedData.price <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0 for paid communities" },
        { status: 400 }
      )
    }

    // Create the community
    const community = await prisma.community.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        image: validatedData.image || null,
        banner: validatedData.banner || null,
        isPrivate: validatedData.isPrivate,
        isFree: validatedData.isFree,
        price: validatedData.isFree ? 0 : validatedData.price,
        currency: validatedData.currency,
        ownerId: session.user.id,
        settings: {
          category: validatedData.category,
          createdAt: new Date().toISOString(),
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        _count: {
          select: {
            members: true,
          }
        }
      }
    })

    // Add the creator as the first member with OWNER role
    await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
        role: "OWNER",
      }
    })

    // Award points for creating a community
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: {
          increment: 50, // 50 points for creating a community
        }
      }
    })

    return NextResponse.json(
      {
        message: "Community created successfully!",
        community: {
          ...community,
          memberCount: 1, // Creator is the first member
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Community creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create community. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = Number(searchParams.get("limit")) || 20
    const category = searchParams.get("category")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (category && category !== "All") {
      where.settings = {
        path: ["category"],
        equals: category,
      }
    }

    const communities = await prisma.community.findMany({
      where,
      take: limit,
      orderBy: [
        { createdAt: "desc" }
      ],
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        _count: {
          select: {
            members: true,
          }
        }
      }
    })

    return NextResponse.json(communities)
  } catch (error) {
    console.error("Failed to fetch communities:", error)
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    )
  }
}
