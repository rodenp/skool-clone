import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const lessonSchema = z.object({
  id: z.string().optional(),
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
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().min(1),
  lessons: z.array(lessonSchema),
})

const updateCourseSchema = z.object({
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
              orderBy: {
                order: "asc"
              }
            },
          },
          orderBy: {
            order: "asc"
          }
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error("Failed to fetch course:", error)
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to update a course" },
        { status: 401 }
      )
    }

    const { courseId } = await params
    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)

    // Check if user owns the course
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        community: true,
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    if (existingCourse.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update courses you created" },
        { status: 403 }
      )
    }

    // Delete existing modules and lessons, then recreate them
    await prisma.module.deleteMany({
      where: { courseId: courseId }
    })

    // Update the course with new modules and lessons
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        image: validatedData.image || null,
        price: validatedData.isFree ? 0 : validatedData.price,
        currency: validatedData.currency,
        isPublished: validatedData.isPublished,
        isFree: validatedData.isFree,
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

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error("Course update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update course. Please try again." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to delete a course" },
        { status: 401 }
      )
    }

    const { courseId } = await params

    // Check if user owns the course
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        creatorId: true,
        title: true,
      }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    if (existingCourse.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete courses you created" },
        { status: 403 }
      )
    }

    // Delete the course (this will cascade delete modules and lessons)
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Course deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    )
  }
}
