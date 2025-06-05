import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateModuleSchema = z.object({
  title: z.string().min(1, "Module title is required").max(100).optional(),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
})

// GET module (optional, usually modules are fetched with course)
export async function GET(request: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  try {
    const { moduleId } = await params
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { lessons: { orderBy: { order: 'asc' } } }
    })
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    return NextResponse.json(module)
  } catch (error) {
    console.error('Failed to fetch module:', error)
    return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { moduleId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const moduleToUpdate = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { creatorId: true, community: { select: { members: { where: { userId: session.user.id } } } } } } }
    })

    if (!moduleToUpdate) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const userMembership = moduleToUpdate.course.community.members[0]
    const isCreator = moduleToUpdate.course.creatorId === session.user.id
    const isAdminOrOwner = userMembership && ["OWNER", "ADMIN"].includes(userMembership.role)

    if (!isCreator && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "You don't have permission to update this module" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateModuleSchema.parse(body)

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: validatedData,
    })

    return NextResponse.json(updatedModule)
  } catch (error) {
    console.error("Failed to update module:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { moduleId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const moduleToDelete = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { creatorId: true, community: { select: { members: { where: { userId: session.user.id } } } } } } }
    })

    if (!moduleToDelete) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const userMembership = moduleToDelete.course.community.members[0]
    const isCreator = moduleToDelete.course.creatorId === session.user.id
    const isAdminOrOwner = userMembership && ["OWNER", "ADMIN"].includes(userMembership.role)

    if (!isCreator && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "You don't have permission to delete this module" },
        { status: 403 }
      )
    }

    // Important: Add transaction to delete related lessons and their progress
    await prisma.module.delete({ where: { id: moduleId } })

    return NextResponse.json({ message: "Module deleted successfully" })
  } catch (error) {
    console.error("Failed to delete module:", error)
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 })
  }
}
