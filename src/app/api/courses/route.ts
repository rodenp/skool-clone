import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma, Prisma } from "@/lib/prisma" // Import Prisma namespace for types
import { z } from "zod"

const lessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().min(0).default(0),
  order: z.number().min(1),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
})

const moduleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().min(1),
  lessons: z.array(lessonSchema),
})

const createCourseSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  description: z.string().min(1, "Course description is required"),
  image: z.string().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(true),
  communityId: z.string().min(1, "Community is required"),
  modules: z.array(moduleSchema),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to create a course" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Verify user owns the community
    const community = await prisma.community.findFirst({
      where: {
        id: validatedData.communityId,
        ownerId: session.user.id,
      }
    })

    if (!community) {
      return NextResponse.json(
        { error: "You can only create courses in communities you own" },
        { status: 403 }
      )
    }

    // Validate pricing
    if (!validatedData.isFree && validatedData.price <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0 for paid courses" },
        { status: 400 }
      )
    }

    // Create the course with modules and lessons
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        image: validatedData.image || null,
        price: validatedData.isFree ? 0 : validatedData.price,
        currency: validatedData.currency,
        isPublished: validatedData.isPublished,
        isFree: validatedData.isFree,
        creatorId: session.user.id,
        communityId: validatedData.communityId,
        modules: {
          create: validatedData.modules.map(module => ({
            title: module.title,
            description: module.description || null,
            order: module.order,
            lessons: {
              create: module.lessons.map(lesson => ({
                title: lesson.title,
                description: lesson.description || null,
                content: lesson.content || null,
                videoUrl: lesson.videoUrl || null,
                duration: lesson.duration,
                order: lesson.order,
                isPublished: lesson.isPublished,
                isFree: lesson.isFree,
              }))
            }
          }))
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        modules: {
          include: {
            lessons: true,
          },
          orderBy: {
            order: "asc"
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    })

    // Award points for creating a course
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: {
          increment: 100, // 100 points for creating a course
        }
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Course creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create course. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get("communityId"); // Get communityId
    const communitySlug = searchParams.get("communitySlug")
    const limit = Number(searchParams.get("limit")) || 20

    const where: Prisma.CourseWhereInput = { // Explicit type
      isPublished: true,
    };

    if (communityId) {
      where.communityId = communityId; // Filter by communityId if provided
    } else if (communitySlug) {
      where.community = {
        slug: communitySlug
      };
    }

    const courses = await prisma.course.findMany({
      where, // Use the constructed where clause
      take: limit,
      orderBy: [
        { createdAt: "desc" }
      ],
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
                order: true,
                isPublished: true,
                isFree: true,
              }
            },
          },
          orderBy: {
            order: "asc"
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
