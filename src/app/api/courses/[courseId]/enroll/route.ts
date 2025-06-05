import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { courseId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in to enroll." }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isFree: true, price: true, communityId: true }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if user is a member of the community the course belongs to
    const communityMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: course.communityId,
        }
      }
    })

    if (!communityMembership) {
      return NextResponse.json(
        { error: "You must be a member of the community to enroll in this course." },
        { status: 403 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 400 }
      )
    }

    // For now, only free courses can be enrolled directly. Paid courses would need Stripe integration.
    if (!course.isFree) {
      return NextResponse.json(
        { error: "Paid course enrollment via API is not yet supported. Please integrate Stripe." },
        { status: 400 }
      )
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        progress: 0,
      }
    })

    // Award points for enrolling in a course
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: {
          increment: 5, // 5 points for enrolling in a course
        }
      }
    })

    return NextResponse.json(enrollment, { status: 201 })

  } catch (error) {
    console.error("Failed to enroll in course:", error)
    return NextResponse.json({ error: "Failed to enroll in course" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where: Record<string, unknown> = { courseId }
    if (userId) {
      where.userId = userId
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: { select: { id: true, title: true } }
      }
    })

    return NextResponse.json(enrollments)

  } catch (error) {
    console.error("Failed to fetch enrollments:", error)
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}
