import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Skool Clone App - Community Platform",
  description: "Access your communities, courses, and connect with like-minded people.",
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
