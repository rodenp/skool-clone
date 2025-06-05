import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const lessonProgressSchema = z.object({
  isCompleted: z.boolean().optional(),
  timeSpent: z.number().int().min(0).optional(), // in seconds
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { lessonId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, moduleId: true, module: { select: { courseId: true } } }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.courseId,
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in the course this lesson belongs to." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = lessonProgressSchema.parse(body)

    let lessonProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lesson.id,
        }
      }
    })

    if (lessonProgress) {
      // Update existing progress
      lessonProgress = await prisma.lessonProgress.update({
        where: { id: lessonProgress.id },
        data: {
          isCompleted: validatedData.isCompleted !== undefined ? validatedData.isCompleted : lessonProgress.isCompleted,
          timeSpent: validatedData.timeSpent !== undefined ? lessonProgress.timeSpent + validatedData.timeSpent : lessonProgress.timeSpent,
        }
      })
    } else {
      // Create new progress entry
      lessonProgress = await prisma.lessonProgress.create({
        data: {
          userId: session.user.id,
          lessonId: lesson.id,
          isCompleted: validatedData.isCompleted || false,
          timeSpent: validatedData.timeSpent || 0,
        }
      })
    }

    // Potentially update overall course progress here (more complex logic)
    // For now, just award points if lesson is completed for the first time
    if (validatedData.isCompleted && (lessonProgress.isCompleted && lessonProgress.updatedAt.getTime() === lessonProgress.createdAt.getTime())) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: {
            increment: 2, // 2 points for completing a lesson
          }
        }
      })
    }

    return NextResponse.json(lessonProgress, { status: 200 })

  } catch (error) {
    console.error("Failed to update lesson progress:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update lesson progress" }, { status: 500 })
  }
}
