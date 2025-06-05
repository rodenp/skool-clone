import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createModuleSchema = z.object({
  title: z.string().min(1, "Module title is required").max(100),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { courseId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to add modules to this course (creator or community admin/owner)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { creatorId: true, community: { select: { members: { where: { userId: session.user.id } } } } }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const userMembership = course.community.members[0]
    const isCreator = course.creatorId === session.user.id
    const isAdminOrOwner = userMembership && ["OWNER", "ADMIN"].includes(userMembership.role)

    if (!isCreator && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "You don't have permission to add modules to this course" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createModuleSchema.parse(body)

    const newModule = await prisma.module.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        order: validatedData.order,
        courseId: courseId,
      },
    })

    return NextResponse.json(newModule, { status: 201 })
  } catch (error) {
    console.error("Failed to create module:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 })
  }
}
