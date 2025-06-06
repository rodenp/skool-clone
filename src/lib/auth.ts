import type { NextAuthOptions, User } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.hashedPassword) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          image: user.image || undefined,
        } as User
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/app/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fetch additional user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true, points: true, level: true }
        })
        token.username = dbUser?.username || undefined
        token.points = dbUser?.points || 0
        token.level = dbUser?.level || 1
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.points = token.points as number
        session.user.level = token.level as number
      }
      return session
    },
  },
}

declare module "next-auth" {
  interface User {
    username?: string
    points: number
    level: number
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      username?: string
      image?: string
      points: number
      level: number
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    points: number
    level: number
  }
}

import { getServerSession } from "next-auth/next";
// authOptions should already be defined in this file.
// If authOptions is not already exported, ensure it is: export const authOptions ...

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}
