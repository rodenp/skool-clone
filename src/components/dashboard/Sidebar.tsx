"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  // Trophy, // Leaderboard icon, removed as the link is removed
  Search,
  Plus,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Star
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/app/dashboard", icon: Home },
  { name: "Communities", href: "/app/communities", icon: Users },
  // { name: "Courses", href: "/app/courses", icon: BookOpen }, // Removed this line
  // { name: "Calendar", href: "/app/calendar", icon: Calendar }, // Removed this line
  // { name: "Leaderboard", href: "/app/leaderboard", icon: Trophy }, // Removed this line
]

const quickActions = [
  { name: "Create Community", href: "/app/communities/create", icon: Plus },
  { name: "Create Course", href: "/app/courses/create", icon: BookOpen },
  { name: "Schedule Event", href: "/app/events/create", icon: Calendar },
]

const userCommunities = [
  {
    id: "1",
    name: "My Community",
    slug: "my-community",
    members: 42,
    isOwner: true,
    image: "🎨"
  },
  {
    id: "2",
    name: "Tech Talks",
    slug: "tech-talks",
    members: 156,
    isOwner: false,
    image: "💻"
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/app/dashboard" className="text-xl font-bold">
            <span className="text-blue-600">s</span>
            <span className="text-orange-500">k</span>
            <span className="text-orange-400">o</span>
            <span className="text-blue-500">o</span>
            <span className="text-gray-800">l</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="mt-2 space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <action.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="ml-3">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* My Communities */}
        {!isCollapsed && (
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                My Communities
              </h3>
              <Link href="/app/communities/create">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-1">
              {userCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/app/communities/${community.slug}`}
                  className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">
                    {community.image}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="text-gray-900 text-sm font-medium truncate">
                        {community.name}
                      </span>
                      {community.isOwner && (
                        <Star className="ml-1 h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">
                      {community.members} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <Link href="/app/notifications">
                <Button variant="ghost" size="sm" className="p-2 relative">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
                </Button>
              </Link>
              <Link href="/app/settings">
                <Button variant="ghost" size="sm" className="p-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
          {isCollapsed && (
            <div className="flex flex-col space-y-2">
              <Link href="/app/notifications">
                <Button variant="ghost" size="sm" className="p-2 relative">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
                </Button>
              </Link>
              <Link href="/app/settings">
                <Button variant="ghost" size="sm" className="p-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
