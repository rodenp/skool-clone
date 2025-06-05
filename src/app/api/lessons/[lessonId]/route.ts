import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required").max(150).optional(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } }, attachments: true }
    })
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }
    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Failed to fetch lesson:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { lessonId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lessonToUpdate = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { creatorId: true, community: { select: { members: { where: { userId: session.user.id } } } } } }
          }
        }
      }
    })

    if (!lessonToUpdate) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const userMembership = lessonToUpdate.module.course.community.members[0]
    const isCreator = lessonToUpdate.module.course.creatorId === session.user.id
    const isAdminOrOwner = userMembership && ["OWNER", "ADMIN"].includes(userMembership.role)

    if (!isCreator && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "You don't have permission to update this lesson" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateLessonSchema.parse(body)

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: validatedData,
    })

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error("Failed to update lesson:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { lessonId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lessonToDelete = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { creatorId: true, community: { select: { members: { where: { userId: session.user.id } } } } } }
          }
        }
      }
    })

    if (!lessonToDelete) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const userMembership = lessonToDelete.module.course.community.members[0]
    const isCreator = lessonToDelete.module.course.creatorId === session.user.id
    const isAdminOrOwner = userMembership && ["OWNER", "ADMIN"].includes(userMembership.role)

    if (!isCreator && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "You don't have permission to delete this lesson" },
        { status: 403 }
      )
    }

    // Important: Add transaction to delete related progress and attachments
    await prisma.lesson.delete({ where: { id: lessonId } })

    return NextResponse.json({ message: "Lesson deleted successfully" })
  } catch (error) {
    console.error("Failed to delete lesson:", error)
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 })
  }
}
