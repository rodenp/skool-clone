"use client"

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Search,
  Bell,
  Plus,
  User,
  Settings,
  LogOut,
  Crown,
  Trophy,
  Zap,
  Users,
  BookOpen,
  Calendar,
  FileText,
  CreditCard
} from "lucide-react"

export function Header() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const getUserInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search communities, courses, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Create Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/communities/create" className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Community
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/courses/create" className="cursor-pointer">
                <BookOpen className="h-4 w-4 mr-2" />
                Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/events/create" className="cursor-pointer">
                <Calendar className="h-4 w-4 mr-2" />
                Event
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/posts/create" className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Post
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem>
                <div className="flex items-start space-x-3 w-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New member joined Tech Talks</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-start space-x-3 w-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Course completed: Web Development</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/notifications" className="cursor-pointer text-center w-full">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>{getUserInitials(session?.user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{session?.user?.name}</span>
                <div className="flex items-center space-x-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-gray-500">Level {session?.user?.level}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{session?.user?.points} pts</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
                <div className="flex items-center space-x-2 pt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Level {session?.user?.level}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {session?.user?.points} pts
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/profile" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/billing" className="cursor-pointer">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
