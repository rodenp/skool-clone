"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { FileUpload } from "@/components/ui/file-upload"
import { SortableList } from "@/components/ui/sortable-list"
import {
  ArrowLeft,
  Upload,
  Eye,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Camera,
  Sparkles,
  AlertCircle,
  Video,
  FileText,
  DollarSign,
  Globe,
  Lock,
  PlayCircle,
  Monitor,
  BookOpen,
  Clock,
  Users,
  Settings,
  Image as ImageIcon,
  Music,
  Download,
  Link as LinkIcon,
  CheckCircle,
  Edit,
  Copy,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { toast } from "sonner"

interface Community {
  id: string
  name: string
  slug: string
}

interface Module {
  id?: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Attachment {
  id?: string
  name: string
  url: string
  type: string
  size: number
}

interface Lesson {
  id?: string
  title: string
  description: string
  content: string
  videoUrl: string
  duration: number
  order: number
  isPublished: boolean
  isFree: boolean
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'discussion'
  attachments: Attachment[]
  quiz?: {
    questions: Array<{
      id?: string
      question: string
      type: 'multiple_choice' | 'true_false' | 'short_answer'
      options?: string[]
      correctAnswer?: string | number
    }>
  }
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
]

function CreateCoursePageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCourse, setIsLoadingCourse] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [communities, setCommunities] = useState<Community[]>([])

  const courseId = searchParams.get("courseId")
  const isEditing = !!courseId

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    price: 0,
    currency: "USD",
    isPublished: false,
    isFree: true,
    communityId: "",
  })

  const [modules, setModules] = useState<Module[]>([
    {
      title: "Getting Started",
      description: "Introduction to the course",
      order: 1,
      lessons: [
        {
          title: "Welcome to the Course",
          description: "Course overview and what you'll learn",
          content: "<h2>Welcome!</h2><p>In this lesson, you'll get an overview of the entire course and understand what you'll learn.</p>",
          videoUrl: "",
          duration: 5,
          order: 1,
          isPublished: false,
          isFree: true,
          type: 'video',
          attachments: [],
        }
      ]
    }
  ])

  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string
    name: string
    size: number
    type: string
    url?: string
    progress?: number
    status: 'uploading' | 'completed' | 'error'
    error?: string
  }>>([])

  const [editingLesson, setEditingLesson] = useState<{
    moduleIndex: number
    lessonIndex: number
  } | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchCommunities = useCallback(async () => {
    try {
      const response = await fetch("/api/communities")
      if (response.ok) {
        const data = await response.json()
        // Filter to only owned communities
        const ownedCommunities = data.filter((c: { owner: { id: string } }) => c.owner.id === session?.user?.id)
        setCommunities(ownedCommunities)

        // Auto-select first community if creating new course
        if (!isEditing && ownedCommunities.length > 0) {
          setFormData(prev => ({ ...prev, communityId: ownedCommunities[0].id }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error)
    }
  }, [session?.user?.id, isEditing])

  const fetchCourse = useCallback(async () => {
    if (!courseId) return

    try {
      setIsLoadingCourse(true)
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const course = await response.json()

        // Defensive programming - ensure all required fields exist
        setFormData({
          title: course.title || "",
          description: course.description || "",
          image: course.image || "",
          price: course.price || 0,
          currency: course.currency || "USD",
          isPublished: course.isPublished || false,
          isFree: course.isFree !== undefined ? course.isFree : true,
          communityId: course.communityId || "",
        })

        if (course.modules && Array.isArray(course.modules)) {
          const sortedModules = course.modules
            .sort((a: { order: number }, b: { order: number }) => (a.order || 0) - (b.order || 0))
            .map((module: any) => ({
              ...module,
              lessons: Array.isArray(module.lessons)
                ? module.lessons.sort((a: { order: number }, b: { order: number }) => (a.order || 0) - (b.order || 0))
                : []
            }))
          setModules(sortedModules)
        }
      } else {
        throw new Error(`Failed to fetch course: ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to load course:", error)
      toast.error("Failed to load course. Please try again.")
    } finally {
      setIsLoadingCourse(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  useEffect(() => {
    if (isEditing && courseId) {
      fetchCourse()
    }
  }, [isEditing, courseId, fetchCourse])

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Course title is required"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Course description is required"
    }
    if (!formData.communityId) {
      newErrors.communityId = "Please select a community"
    }
    if (!formData.isFree && formData.price <= 0) {
      newErrors.price = "Price must be greater than 0 for paid courses"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addModule = () => {
    const newModule: Module = {
      title: `Module ${modules.length + 1}`,
      description: "",
      order: modules.length + 1,
      lessons: []
    }
    setModules([...modules, newModule])
  }

  const updateModule = (moduleIndex: number, field: string, value: string) => {
    const updatedModules = modules.map((module, index) =>
      index === moduleIndex ? { ...module, [field]: value } : module
    )
    setModules(updatedModules)
  }

  const deleteModule = (moduleIndex: number) => {
    const updatedModules = modules.filter((_, index) => index !== moduleIndex)
    setModules(updatedModules)
  }

  const addLesson = (moduleIndex: number, type: Lesson['type'] = 'video') => {
    const newLesson: Lesson = {
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Lesson`,
      description: "",
      content: type === 'text' ? "<p>Start writing your lesson content here...</p>" : "",
      videoUrl: "",
      duration: 0,
      order: modules[moduleIndex].lessons.length + 1,
      isPublished: false,
      isFree: false,
      type,
      attachments: [],
      ...(type === 'quiz' && {
        quiz: {
          questions: []
        }
      })
    }

    const updatedModules = modules.map((module, index) =>
      index === moduleIndex
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    )
    setModules(updatedModules)
  }

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: string | number | boolean | Attachment[]) => {
    const updatedModules = modules.map((module, mIndex) =>
      mIndex === moduleIndex
        ? {
            ...module,
            lessons: module.lessons.map((lesson, lIndex) =>
              lIndex === lessonIndex
                ? { ...lesson, [field]: value }
                : lesson
            )
          }
        : module
    )

    setModules(updatedModules)
  }

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = modules.map((module, mIndex) =>
      mIndex === moduleIndex
        ? {
            ...module,
            lessons: module.lessons.filter((_, lIndex) => lIndex !== lessonIndex)
          }
        : module
    )
    setModules(updatedModules)

    // Close editing if we're editing this lesson
    if (editingLesson?.moduleIndex === moduleIndex && editingLesson?.lessonIndex === lessonIndex) {
      setEditingLesson(null)
    }
  }

  const reorderLessons = (moduleIndex: number, startIndex: number, endIndex: number) => {
    const lessons = [...modules[moduleIndex].lessons]
    const [removed] = lessons.splice(startIndex, 1)
    lessons.splice(endIndex, 0, removed)

    // Update order numbers
    const reorderedLessons = lessons.map((lesson, index) => ({
      ...lesson,
      order: index + 1
    }))

    const updatedModules = modules.map((module, mIndex) =>
      mIndex === moduleIndex
        ? { ...module, lessons: reorderedLessons }
        : module
    )
    setModules(updatedModules)
  }

  const handleFileUpload = (files: File[]) => {
    files.forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9)
      const newFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading' as const,
        progress: 0,
      }

      setUploadedFiles(prev => [...prev, newFile])

      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'completed', progress: 100, url: URL.createObjectURL(file) }
              : f
          ))
        } else {
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, progress } : f
          ))
        }
      }, 500)
    })
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab("details")
      return
    }

    setIsLoading(true)

    try {
      const courseData = {
        ...formData,
        modules: modules.map((module, moduleIndex) => ({
          ...module,
          order: moduleIndex + 1,
          lessons: module.lessons.map((lesson, lessonIndex) => ({
            ...lesson,
            order: lessonIndex + 1,
          }))
        }))
      }

      const url = isEditing ? `/api/courses/${courseId}` : "/api/courses"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} course`)
      }

      const course = await response.json()
      toast.success(`Course ${isEditing ? 'updated' : 'created'} successfully!`)
      router.push(`/app/courses/${course.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} course`)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCurrency = currencies.find(c => c.code === formData.currency)

  // Show loading spinner when loading course data for editing
  if (isEditing && isLoadingCourse) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/courses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="ml-4 text-gray-600">Loading course data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Course' : 'Create Course'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update your course content and settings' : 'Create an engaging course for your community'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                  <CardDescription>
                    Basic information about your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter course title"
                      className={errors.title ? "border-red-500" : ""}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Course Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe what students will learn in this course..."
                      rows={4}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="community">Community *</Label>
                    <Select value={formData.communityId} onValueChange={(value) => handleInputChange("communityId", value)}>
                      <SelectTrigger className={errors.communityId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a community" />
                      </SelectTrigger>
                      <SelectContent>
                        {communities.map(community => (
                          <SelectItem key={community.id} value={community.id}>
                            {community.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.communityId && (
                      <p className="text-sm text-red-500 mt-1">{errors.communityId}</p>
                    )}
                  </div>

                  <div>
                    <Label>Course Thumbnail</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a course thumbnail (recommended: 16:9 ratio)
                      </p>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Course Structure</CardTitle>
                      <CardDescription>
                        Organize your course into modules and lessons with rich content
                      </CardDescription>
                    </div>
                    <Button onClick={addModule} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {modules.map((module, moduleIndex) => (
                    <Card key={moduleIndex} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              value={module.title}
                              onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                              placeholder="Module title"
                              className="font-medium"
                            />
                            <Input
                              value={module.description}
                              onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                              placeholder="Module description"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteModule(moduleIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Lesson Creation Buttons */}
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Add lesson type:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'video')}
                            >
                              <Video className="h-3 w-3 mr-1" />
                              Video
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'text')}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Text
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'quiz')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Quiz
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'assignment')}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Assignment
                            </Button>
                          </div>

                          {/* Sortable Lessons */}
                          <SortableList
                            items={module.lessons.map((lesson, lessonIndex) => ({
                              id: `${moduleIndex}-${lessonIndex}`,
                              content: (
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        {lesson.type === 'video' && <Video className="h-4 w-4 text-blue-600" />}
                                        {lesson.type === 'text' && <FileText className="h-4 w-4 text-green-600" />}
                                        {lesson.type === 'quiz' && <CheckCircle className="h-4 w-4 text-purple-600" />}
                                        {lesson.type === 'assignment' && <Edit className="h-4 w-4 text-orange-600" />}
                                        <span className="text-sm font-medium">{lesson.title}</span>
                                      </div>
                                      <Badge variant={lesson.isPublished ? "default" : "secondary"}>
                                        {lesson.isPublished ? "Published" : "Draft"}
                                      </Badge>
                                      {lesson.isFree && (
                                        <Badge variant="outline" className="text-green-600">
                                          Free
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {lesson.duration}min
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingLesson({ moduleIndex, lessonIndex })}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {lesson.description}
                                  </p>
                                </div>
                              )
                            }))}
                            onReorder={(startIndex, endIndex) => reorderLessons(moduleIndex, startIndex, endIndex)}
                            className="space-y-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Lesson Editor Modal */}
              {editingLesson && (
                <Card className="border-2 border-blue-500">
                  <CardHeader className="bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].type === 'video' && <Video className="h-5 w-5" />}
                          {modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].type === 'text' && <FileText className="h-5 w-5" />}
                          {modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].type === 'quiz' && <CheckCircle className="h-5 w-5" />}
                          {modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].type === 'assignment' && <Edit className="h-5 w-5" />}
                          Editing: {modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].title}
                        </CardTitle>
                        <CardDescription>
                          Create engaging content for your students
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setEditingLesson(null)}
                      >
                        Close Editor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {(() => {
                      const lesson = modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex]
                      return (
                        <>
                          {/* Basic Lesson Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="lesson-title">Lesson Title</Label>
                              <Input
                                id="lesson-title"
                                value={lesson.title}
                                onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "title", e.target.value)}
                                placeholder="Enter lesson title"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                              <Input
                                id="lesson-duration"
                                type="number"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "duration", Number(e.target.value))}
                                min="0"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="lesson-description">Description</Label>
                            <Textarea
                              id="lesson-description"
                              value={lesson.description}
                              onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "description", e.target.value)}
                              placeholder="Brief description of the lesson"
                              rows={2}
                            />
                          </div>

                          {/* Video URL for video lessons */}
                          {lesson.type === 'video' && (
                            <div>
                              <Label htmlFor="video-url">Video URL</Label>
                              <Input
                                id="video-url"
                                value={lesson.videoUrl}
                                onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "videoUrl", e.target.value)}
                                placeholder="YouTube, Vimeo, or direct video URL"
                              />
                            </div>
                          )}

                          {/* Rich Text Content */}
                          <div>
                            <Label>Lesson Content</Label>
                            <div className="mt-2">
                              <RichTextEditor
                                content={lesson.content}
                                onChange={(content) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "content", content)}
                                placeholder={
                                  lesson.type === 'text' ? "Write your lesson content here..." :
                                  lesson.type === 'assignment' ? "Describe the assignment requirements..." :
                                  "Add additional notes or instructions for this lesson..."
                                }
                              />
                            </div>
                          </div>

                          {/* File Attachments */}
                          <div>
                            <Label>Attachments</Label>
                            <div className="mt-2">
                              <FileUpload
                                onUpload={handleFileUpload}
                                onRemove={removeFile}
                                uploadedFiles={uploadedFiles}
                                label="Upload lesson materials"
                                description="Add PDFs, images, audio files, or other resources"
                                maxFiles={5}
                              />
                            </div>
                          </div>

                          {/* Lesson Settings */}
                          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.isPublished}
                                onCheckedChange={(checked) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "isPublished", checked)}
                              />
                              <Label>Published</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.isFree}
                                onCheckedChange={(checked) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, "isFree", checked)}
                              />
                              <Label>Free Preview</Label>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Access</CardTitle>
                  <CardDescription>
                    Set pricing for your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="free">Free Course</Label>
                      <p className="text-sm text-gray-500">
                        Anyone can access this course for free
                      </p>
                    </div>
                    <Switch
                      id="free"
                      checked={formData.isFree}
                      onCheckedChange={(checked) => handleInputChange("isFree", checked)}
                    />
                  </div>

                  {!formData.isFree && (
                    <>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map(currency => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="price">Price *</Label>
                        <div className="flex items-center">
                          <span className="text-lg font-medium mr-2">
                            {selectedCurrency?.symbol}
                          </span>
                          <Input
                            id="price"
                            type="number"
                            min="1"
                            step="1"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", Number(e.target.value))}
                            placeholder="99"
                            className={errors.price ? "border-red-500" : ""}
                          />
                        </div>
                        {errors.price && (
                          <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                        )}
                      </div>

                      <Alert>
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription>
                          Skool takes a 2.9% transaction fee on all paid courses.
                          You'll earn {selectedCurrency?.symbol}{(formData.price * 0.971).toFixed(2)} per sale.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publication Settings</CardTitle>
                  <CardDescription>
                    Control how your course appears to students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="published">Publish Course</Label>
                      <p className="text-sm text-gray-500">
                        Make this course visible to community members
                      </p>
                    </div>
                    <Switch
                      id="published"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
                    />
                  </div>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      {formData.isPublished
                        ? "Your course is published and visible to community members."
                        : "Your course is in draft mode. Only you can see it until you publish it."
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
              <CardDescription>
                How your course will appear to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Course Card Preview */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2">
                      {formData.title || "Course Title"}
                    </h3>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {formData.description || "Course description will appear here..."}
                    </p>

                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center text-gray-600">
                        <Video className="h-3 w-3 mr-1" />
                        {modules.reduce((total, module) => total + module.lessons.length, 0)} lessons
                      </div>
                      <div>
                        {formData.isFree ? (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        ) : (
                          <span className="font-semibold">
                            {selectedCurrency?.symbol}{formData.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {communities.find(c => c.id === formData.communityId)?.name || "Community"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {formData.isPublished ? (
                          <Globe className="h-3 w-3 text-green-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Statistics */}
                <div className="text-xs space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Course Statistics:</h4>
                    <div className="space-y-1 text-gray-600">
                      <div>📚 {modules.length} modules</div>
                      <div>🎯 {modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</div>
                      <div>⏱️ {modules.reduce((total, module) =>
                        total + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.duration, 0), 0
                      )} total minutes</div>
                      <div>🎬 {modules.reduce((total, module) =>
                        total + module.lessons.filter(lesson => lesson.type === 'video').length, 0
                      )} video lessons</div>
                      <div>📝 {modules.reduce((total, module) =>
                        total + module.lessons.filter(lesson => lesson.type === 'text').length, 0
                      )} text lessons</div>
                      <div>🆓 {modules.reduce((total, module) =>
                        total + module.lessons.filter(lesson => lesson.isFree).length, 0
                      )} free previews</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Module Structure:</h4>
                    <div className="space-y-1">
                      {modules.map((module, index) => (
                        <div key={index} className="text-gray-600">
                          <div className="font-medium">{index + 1}. {module.title || `Module ${index + 1}`}</div>
                          <div className="ml-3 space-y-0.5">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lessonIndex} className="flex items-center gap-1 text-xs">
                                {lesson.type === 'video' && <Video className="h-3 w-3 text-blue-500" />}
                                {lesson.type === 'text' && <FileText className="h-3 w-3 text-green-500" />}
                                {lesson.type === 'quiz' && <CheckCircle className="h-3 w-3 text-purple-500" />}
                                {lesson.type === 'assignment' && <Edit className="h-3 w-3 text-orange-500" />}
                                <span className="truncate">{lesson.title}</span>
                                <span className="text-gray-400">({lesson.duration}min)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center border-t pt-6">
        <Button variant="outline" asChild>
          <Link href="/app/courses">
            Cancel
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? `${isEditing ? 'Updating' : 'Creating'}...` : `${isEditing ? 'Update' : 'Create'} Course`}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>}>
      <CreateCoursePageContent />
    </Suspense>
  )
}
