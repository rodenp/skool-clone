"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  BookOpen,
  Play,
  Clock,
  Users,
  Star,
  Filter,
  Grid3X3,
  List,
  PlayCircle,
  DollarSign,
  Edit
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  image?: string
  price: number
  currency: string
  isFree: boolean
  isPublished: boolean
  creator: {
    id: string
    name: string
    image?: string
  }
  community: {
    id: string
    name: string
    slug: string
  }
  modules: Array<{
    id: string
    title: string
    lessons: Array<{
      id: string
      title: string
      duration: number
      isPublished: boolean
      isFree: boolean
    }>
  }>
  _count: {
    enrollments: number
  }
  createdAt: string
  updatedAt: string
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("all")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      } else {
        console.error('Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "enrolled") {
      // TODO: Check if user is enrolled in course
      return matchesSearch && false // Placeholder
    }
    if (activeTab === "created") {
      return matchesSearch && course.creator.id === session?.user?.id
    }

    return matchesSearch
  })

  const getTotalDuration = (course: Course) => {
    return course.modules.reduce((total, module) =>
      total + module.lessons.reduce((moduleTotal, lesson) => moduleTotal + lesson.duration, 0), 0
    )
  }

  const getTotalLessons = (course: Course) => {
    return course.modules.reduce((total, module) => total + module.lessons.length, 0)
  }

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        {course.image ? (
          <div className="aspect-video relative">
            <Image
              src={course.image}
              alt={course.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-white" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 text-gray-900 ml-1" />
          </div>
        </div>

        {/* Creator can edit */}
        {course.creator.id === session?.user?.id && (
          <div className="absolute top-3 right-3">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/app/courses/create?courseId=${course.id}`}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Link>
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={course.creator.image || ""} />
            <AvatarFallback>
              {course.creator.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600">
              by {course.creator.name}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              {getTotalLessons(course)} lessons
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {Math.round(getTotalDuration(course) / 60)}h {getTotalDuration(course) % 60}m
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {course._count.enrollments}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {course.community.name}
            </Badge>
            {!course.isPublished && (
              <Badge variant="secondary" className="text-xs">
                Draft
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {course.isFree ? (
              <Badge className="bg-green-600 text-white">
                Free
              </Badge>
            ) : (
              <span className="font-semibold text-gray-900">
                ${course.price}
              </span>
            )}
            <Button size="sm" asChild>
              <Link href={`/app/courses/${course.id}`}>
                View Course
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">
            Discover courses and expand your knowledge
          </p>
        </div>
        <Button asChild>
          <Link href="/app/courses/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
          <TabsTrigger value="created">My Courses</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "created" ? "No courses created yet" :
                 activeTab === "enrolled" ? "No courses enrolled yet" :
                 "No courses found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "created" ? "Create your first course to get started" :
                 activeTab === "enrolled" ? "Enroll in some courses to see them here" :
                 "Try adjusting your search"}
              </p>
              {activeTab === "created" && (
                <Button asChild>
                  <Link href="/app/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      {!isLoading && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {courses.length}
              </div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.creator.id === session?.user?.id).length}
              </div>
              <div className="text-sm text-gray-600">Courses Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {courses.reduce((total, course) => total + course._count.enrollments, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Enrollments</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
