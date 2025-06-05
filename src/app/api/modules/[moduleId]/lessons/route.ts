import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required").max(150),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(), // in seconds
  order: z.number().int().min(0),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { moduleId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { creatorId: true, community: { select: { members: { where: { userId: session.user.id } } } } } } }
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const userMembership = module.course.community.members[0]
    const isCreator = module.course.creatorId === session.user.id
    const isAdminOrOwner = userMembership && ["OWNER", "ADMIN"].includes(userMembership.role)

    if (!isCreator && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "You don't have permission to add lessons to this module" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createLessonSchema.parse(body)

    const newLesson = await prisma.lesson.create({
      data: {
        ...validatedData,
        moduleId: moduleId,
      },
    })

    return NextResponse.json(newLesson, { status: 201 })
  } catch (error) {
    console.error("Failed to create lesson:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 })
  }
}
