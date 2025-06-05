"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  BookOpen,
  Calendar,
  Trophy,
  TrendingUp,
  Clock,
  Star,
  Plus,
  ArrowRight,
  MessageCircle,
  Heart,
  Eye
} from "lucide-react"
import Link from "next/link"

// Mock data - in real app this would come from API
const dashboardStats = {
  totalCommunities: 3,
  totalMembers: 248,
  totalCourses: 5,
  totalPoints: 1420,
  level: 8,
  nextLevelPoints: 1800,
}

const recentActivity = [
  {
    id: "1",
    type: "comment",
    user: { name: "Sarah Chen", avatar: "", initials: "SC" },
    action: "commented on your post",
    target: "Getting Started with Web Design",
    time: "2 minutes ago",
    community: "Design Hub"
  },
  {
    id: "2",
    type: "like",
    user: { name: "Mike Johnson", avatar: "", initials: "MJ" },
    action: "liked your course",
    target: "React for Beginners",
    time: "15 minutes ago",
    community: "Tech Learning"
  },
  {
    id: "3",
    type: "join",
    user: { name: "Emma Davis", avatar: "", initials: "ED" },
    action: "joined your community",
    target: "Photography Masters",
    time: "1 hour ago",
    community: "Photography Masters"
  },
  {
    id: "4",
    type: "complete",
    user: { name: "Alex Rivera", avatar: "", initials: "AR" },
    action: "completed",
    target: "Module 3: Advanced Techniques",
    time: "2 hours ago",
    community: "Design Hub"
  }
]

const upcomingEvents = [
  {
    id: "1",
    title: "Weekly Design Review",
    community: "Design Hub",
    date: "Today at 3:00 PM",
    attendees: 12
  },
  {
    id: "2",
    title: "React Q&A Session",
    community: "Tech Learning",
    date: "Tomorrow at 10:00 AM",
    attendees: 28
  },
  {
    id: "3",
    title: "Photography Workshop",
    community: "Photography Masters",
    date: "Friday at 2:00 PM",
    attendees: 35
  }
]

const featuredCommunities = [
  {
    id: "1",
    name: "Design Hub",
    description: "A community for designers to share and learn",
    members: 156,
    image: "🎨",
    isJoined: true,
    category: "Design"
  },
  {
    id: "2",
    name: "Tech Learning",
    description: "Learn programming and technology skills",
    members: 203,
    image: "💻",
    isJoined: false,
    category: "Technology"
  },
  {
    id: "3",
    name: "Fitness Journey",
    description: "Get fit and healthy together",
    members: 89,
    image: "💪",
    isJoined: false,
    category: "Health"
  }
]

export default function DashboardPage() {
  const { data: session } = useSession()

  const progressToNextLevel = ((dashboardStats.totalPoints % 200) / 200) * 100

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening in your communities today
          </p>
        </div>
        <Button asChild>
          <Link href="/app/communities/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCommunities}</div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              2 in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points & Level</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {dashboardStats.level}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={progressToNextLevel} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {dashboardStats.totalPoints}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your communities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {activity.type === "comment" && <MessageCircle className="h-3 w-3 text-blue-500" />}
                      {activity.type === "like" && <Heart className="h-3 w-3 text-red-500" />}
                      {activity.type === "join" && <Users className="h-3 w-3 text-green-500" />}
                      {activity.type === "complete" && <Trophy className="h-3 w-3 text-yellow-500" />}
                      <span className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        {activity.action}{" "}
                        <span className="font-medium">{activity.target}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.community}
                      </Badge>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/app/activity">
                  View all activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Don't miss these scheduled events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.date}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {event.community}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/app/calendar">
                  View calendar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Communities */}
      <Card>
        <CardHeader>
          <CardTitle>Discover Communities</CardTitle>
          <CardDescription>
            Find new communities that match your interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCommunities.map((community) => (
              <div
                key={community.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                    {community.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {community.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {community.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {community.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {community.members} members
                        </span>
                      </div>
                      {community.isJoined ? (
                        <Badge className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Joined
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/app/communities">
                Explore all communities
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
