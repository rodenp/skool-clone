import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const onboardingSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  timezone: z.string(),
  interests: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = onboardingSchema.parse(body)

    // Check username availability if provided
    if (validatedData.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: session.user.id }
        }
      })

      if (existingUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: validatedData.username || null,
        bio: validatedData.bio || null,
        timezone: validatedData.timezone,
        // Store interests in notifications JSON field for now
        notifications: {
          interests: validatedData.interests,
          onboarded: true,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        points: true,
        level: true,
        timezone: true,
        notifications: true,
      },
    })

    return NextResponse.json(
      {
        message: "Onboarding completed successfully",
        user: updatedUser
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Onboarding error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
