import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().optional(),
  gdprConsent: z.boolean().refine(val => val === true, "GDPR consent is required"),
  marketingConsent: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      )
    }

    // Check username availability if provided
    if (validatedData.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: validatedData.username }
      })

      if (existingUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        username: validatedData.username || null,
        hashedPassword,
        gdprConsent: validatedData.gdprConsent,
        gdprConsentDate: new Date(),
        points: 0,
        level: 1,
      },
    })

    // Create default subscription (free trial)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: "TRIALING",
        plan: "FREE",
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    })

    // Remove password from response
    const { hashedPassword: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)

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
