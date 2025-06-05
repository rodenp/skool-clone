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
import { FileUpload, UploadedFile as CustomUploadedFile } from "@/components/ui/file-upload" // Renamed UploadedFile to avoid conflict
import { SortableList } from "@/components/ui/sortable-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog" // Added Dialog components
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
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'discussion' // Added 'discussion' for completeness, though not fully implemented in form
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
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false) // Added for thumbnail upload

  // Enum for question types for clarity
  const QuestionType = {
    MULTIPLE_CHOICE: 'multiple_choice' as 'multiple_choice',
    TRUE_FALSE: 'true_false' as 'true_false',
    SHORT_ANSWER: 'short_answer' as 'short_answer',
  };
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

  const [modules, setModules] = useState<Module[]>([]) // Initialize as empty, fetched or default added later

  const [uploadedLessonAttachments, setUploadedLessonAttachments] = useState<CustomUploadedFile[]>([]) // For lesson attachments

  const [editingLesson, setEditingLesson] = useState<{
    moduleIndex: number
    lessonIndex: number
    lessonData: Lesson // Store a copy of lesson data for editing in dialog
  } | null>(null)
  const [isLessonEditorOpen, setIsLessonEditorOpen] = useState(false) // For dialog visibility

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
      setIsLessonEditorOpen(false)
      setEditingLesson(null)
    }
  }

  const reorderLessons = (moduleIndex: number, startIndex: number, endIndex: number) => {
    const lessons = [...modules[moduleIndex].lessons]
    const lessonsCopy = [...modules[moduleIndex].lessons]
    const [removed] = lessonsCopy.splice(startIndex, 1)
    lessonsCopy.splice(endIndex, 0, removed)

    const reorderedLessons = lessonsCopy.map((lesson, index) => ({
      ...lesson,
      order: index + 1,
    }))

    const updatedModules = modules.map((mod, mIdx) =>
      mIdx === moduleIndex
        ? { ...mod, lessons: reorderedLessons }
        : mod
    )
    setModules(updatedModules)
  }

  // For lesson attachments in the dialog
  const handleLessonAttachmentUploadSuccess = (uploadedFile: CustomUploadedFile) => {
    if (editingLesson) {
      const newAttachment: Attachment = {
        name: uploadedFile.name,
        url: uploadedFile.url || '', // Should always have URL on success
        type: uploadedFile.type,
        size: uploadedFile.size,
      };
      setEditingLesson(prev => ({
        ...prev!,
        lessonData: {
          ...prev!.lessonData,
          attachments: [...prev!.lessonData.attachments, newAttachment]
        }
      }));
    }
  };

  const removeLessonAttachment = (attachmentUrl: string) => {
    if (editingLesson) {
      setEditingLesson(prev => ({
        ...prev!,
        lessonData: {
          ...prev!.lessonData,
          attachments: prev!.lessonData.attachments.filter(att => att.url !== attachmentUrl)
        }
      }));
    }
  };

  const openLessonEditor = (moduleIndex: number, lessonIndex: number) => {
    const lessonToEdit = modules[moduleIndex].lessons[lessonIndex];
    setEditingLesson({
      moduleIndex,
      lessonIndex,
      lessonData: { ...lessonToEdit, attachments: [...(lessonToEdit.attachments || [])] } // Work with a copy
    });
    setUploadedLessonAttachments( (lessonToEdit.attachments || []).map(att => ({ // Initialize FileUpload state
        id: att.url, name: att.name, size: att.size, type: att.type, url: att.url, status: 'completed'
    })));
    setIsLessonEditorOpen(true);
  };

  const handleSaveLesson = () => {
    if (editingLesson) {
      const { moduleIndex, lessonIndex, lessonData } = editingLesson;
      // Create a new array for modules
      const updatedModules = [...modules];
      // Create a new array for lessons in the specific module
      const updatedLessons = [...updatedModules[moduleIndex].lessons];
      // Update the specific lesson
      updatedLessons[lessonIndex] = lessonData;
      // Update the module with the new lessons array
      updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], lessons: updatedLessons };
      // Set the new modules state
      setModules(updatedModules);

      setIsLessonEditorOpen(false);
      setEditingLesson(null);
      toast.success("Lesson updated locally. Save the course to persist changes.");
    }
  };

  const handleLessonEditorFieldChange = (field: keyof Lesson, value: any) => {
    if (editingLesson) {
      setEditingLesson(prev => ({
        ...prev!,
        lessonData: {
          ...prev!.lessonData,
          [field]: value,
        }
      }));
    }
  };

  // --- Quiz Question Management Functions ---
  const addQuizQuestion = () => {
    if (editingLesson) {
      const newQuestion = {
        question: "",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["", ""], // Default with two options for MC
        correctAnswer: "0",
      };
      setEditingLesson(prev => ({
        ...prev!,
        lessonData: {
          ...prev!.lessonData,
          quiz: {
            questions: [...(prev!.lessonData.quiz?.questions || []), newQuestion]
          }
        }
      }));
    }
  };

  const updateQuizQuestion = (qIndex: number, field: string, value: any) => {
    if (editingLesson && editingLesson.lessonData.quiz?.questions) {
      const updatedQuestions = [...editingLesson.lessonData.quiz.questions];
      const questionToUpdate = { ...updatedQuestions[qIndex] };

      if (field === 'type') {
        questionToUpdate.type = value;
        // Reset options and correctAnswer when type changes
        questionToUpdate.options = value === QuestionType.MULTIPLE_CHOICE ? ["", ""] : [];
        questionToUpdate.correctAnswer = value === QuestionType.MULTIPLE_CHOICE ? "0" : value === QuestionType.TRUE_FALSE ? "true" : "";
      } else if (field === 'correctAnswer') {
        questionToUpdate.correctAnswer = String(value);
      } else {
        (questionToUpdate as any)[field] = value;
      }
      updatedQuestions[qIndex] = questionToUpdate;

      setEditingLesson(prev => ({
        ...prev!,
        lessonData: { ...prev!.lessonData, quiz: { ...prev!.lessonData.quiz, questions: updatedQuestions } }
      }));
    }
  };

  const deleteQuizQuestion = (qIndex: number) => {
    if (editingLesson && editingLesson.lessonData.quiz?.questions) {
      const updatedQuestions = editingLesson.lessonData.quiz.questions.filter((_, index) => index !== qIndex);
      setEditingLesson(prev => ({
        ...prev!,
        lessonData: { ...prev!.lessonData, quiz: { ...prev!.lessonData.quiz, questions: updatedQuestions } }
      }));
    }
  };

  const addQuestionOption = (qIndex: number) => {
    if (editingLesson && editingLesson.lessonData.quiz?.questions) {
      const updatedQuestions = [...editingLesson.lessonData.quiz.questions];
      const question = updatedQuestions[qIndex];
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        question.options = [...(question.options || []), ""];
        setEditingLesson(prev => ({
          ...prev!,
          lessonData: { ...prev!.lessonData, quiz: { ...prev!.lessonData.quiz, questions: updatedQuestions } }
        }));
      }
    }
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    if (editingLesson && editingLesson.lessonData.quiz?.questions) {
      const updatedQuestions = [...editingLesson.lessonData.quiz.questions];
      const question = updatedQuestions[qIndex];
      if (question.options) {
        question.options[optIndex] = value;
        setEditingLesson(prev => ({
          ...prev!,
          lessonData: { ...prev!.lessonData, quiz: { ...prev!.lessonData.quiz, questions: updatedQuestions } }
        }));
      }
    }
  };

  const deleteQuestionOption = (qIndex: number, optIndex: number) => {
    if (editingLesson && editingLesson.lessonData.quiz?.questions) {
      const updatedQuestions = [...editingLesson.lessonData.quiz.questions];
      const question = updatedQuestions[qIndex];
      if (question.options && question.options.length > 1) { // Keep at least one option for MC
        question.options = question.options.filter((_, index) => index !== optIndex);
        // Adjust correct answer if it was the deleted option or a higher index
        if (Number(question.correctAnswer) === optIndex) {
            question.correctAnswer = "0"; // Default to first option
        } else if (Number(question.correctAnswer) > optIndex) {
            question.correctAnswer = String(Number(question.correctAnswer) - 1);
        }

        setEditingLesson(prev => ({
          ...prev!,
          lessonData: { ...prev!.lessonData, quiz: { ...prev!.lessonData.quiz, questions: updatedQuestions } }
        }));
      }
    }
  };
  // --- End Quiz Question Management Functions ---

  const handleThumbnailUploadSuccess = (uploadedFile: CustomUploadedFile) => {
    if (uploadedFile.url) {
      handleInputChange("image", uploadedFile.url); // Use existing handleInputChange
    }
    // setIsUploadingThumbnail(false); // Assuming FileUpload handles its own internal loading state display
    toast.success("Thumbnail uploaded successfully!");
  };

  const removeThumbnail = () => {
    handleInputChange("image", ""); // Use existing handleInputChange
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab("details") // Switch to details tab if form is invalid
      // Focus on the first error field if possible (advanced)
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      toast.error("Please fill in all required fields correctly.");
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
            // Ensure quizQuestions is correctly mapped from lesson.quiz.questions
            // The rest of the lesson object (including attachments, type) is spread.
            quizQuestions: lesson.quiz?.questions || [],
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
                    <Label htmlFor="course-thumbnail">Course Thumbnail</Label>
                    {formData.image ? (
                      <div className="mt-2 space-y-2">
                        <img
                          src={formData.image}
                          alt="Course thumbnail preview"
                          className="w-full max-w-xs rounded-lg border aspect-video object-cover shadow-sm"
                        />
                        <Button onClick={removeThumbnail} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Thumbnail
                        </Button>
                      </div>
                    ) : (
                      <FileUpload
                        onUploadSuccess={handleThumbnailUploadSuccess}
                        acceptedFileTypes={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }}
                        maxFiles={1}
                        label="Upload Course Thumbnail"
                        description="16:9 ratio recommended (e.g., 1280x720px). Max 5MB."
                        maxFileSize={5 * 1024 * 1024} // 5MB
                        className="mt-1"
                        // onUploadStart={() => setIsUploadingThumbnail(true)} // Optional: if you want to manage global loading state
                        // onUploadError={(errorMsg) => {setIsUploadingThumbnail(false); toast.error(errorMsg);}}
                      />
                    )}
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
                        Organize your course into modules and lessons with rich content.
                      </CardDescription>
                    </div>
                    <Button onClick={addModule} size="sm" variant="default">
                      <Plus className="h-4 w-4 mr-2" />
                      New Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {modules.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No modules yet.</p>
                      <Button onClick={addModule} variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Add your first module
                      </Button>
                    </div>
                  )}
                  {modules.map((module, moduleIndex) => (
                    <Card key={module.id || moduleIndex} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            <Input
                              value={module.title}
                              onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                              placeholder="Module title (e.g., Introduction)"
                              className="font-semibold text-base"
                            />
                            <Input
                              value={module.description}
                              onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                              placeholder="Module description (optional)"
                              className="text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteModule(moduleIndex)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            title="Delete Module"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {/* Lesson Creation Buttons - More prominent */}
                          <div className="flex flex-wrap gap-2 p-3 border border-dashed border-gray-300 rounded-lg items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 mr-2">New Lesson:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'video')}
                              className="hover:bg-blue-50 hover:border-blue-400"
                            >
                              <Video className="h-4 w-4 mr-2 text-blue-600" />
                              Video
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'text')}
                              className="hover:bg-green-50 hover:border-green-400"
                            >
                              <FileText className="h-4 w-4 mr-2 text-green-600" />
                              Text
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'quiz')}
                              className="hover:bg-purple-50 hover:border-purple-400"
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                              Quiz
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(moduleIndex, 'assignment')}
                              className="hover:bg-orange-50 hover:border-orange-400"
                            >
                              <Edit className="h-4 w-4 mr-2 text-orange-600" />
                              Assignment
                            </Button>
                          </div>

                          </div>

                          {/* Sortable Lessons List */}
                          {module.lessons.length === 0 ? (
                             <p className="text-sm text-center text-gray-500 py-4">No lessons in this module yet. Add one above!</p>
                          ) : (
                            <SortableList
                              items={module.lessons.map((lesson, lessonIndex) => ({
                                id: lesson.id || `${moduleIndex}-${lessonIndex}`, // Ensure stable ID
                                content: (
                                  <div className="flex-1 p-3 border rounded-md bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {lesson.type === 'video' && <Video className="h-4 w-4 text-blue-600" />}
                                        {lesson.type === 'text' && <FileText className="h-4 w-4 text-green-600" />}
                                        {lesson.type === 'quiz' && <CheckCircle className="h-4 w-4 text-purple-600" />}
                                        {lesson.type === 'assignment' && <Edit className="h-4 w-4 text-orange-600" />}
                                        <span className="text-sm font-medium">{lesson.title || `Lesson ${lesson.order}`}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={lesson.isPublished ? "default" : "secondary"} className="text-xs">
                                          {lesson.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                        {lesson.isFree && (
                                          <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                            Free
                                          </Badge>
                                        )}
                                        <span className="text-xs text-gray-500 hidden sm:inline">
                                          {lesson.duration > 0 ? `${lesson.duration}min` : ""}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openLessonEditor(moduleIndex, lessonIndex)}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                          title="Delete Lesson"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {lesson.description}
                                    </p>
                                  </div>
                                )
                              }))}
                              onReorder={(startIndex, endIndex) => reorderLessons(moduleIndex, startIndex, endIndex)}
                              className="space-y-2"
                              itemClassName="bg-transparent" // Let item content define its background
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lesson Editor Dialog */}
            <Dialog open={isLessonEditorOpen} onOpenChange={(isOpen) => {
              if (!isOpen) {
                setEditingLesson(null); // Clear editing state when dialog is closed
              }
              setIsLessonEditorOpen(isOpen);
            }}>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                {editingLesson && (() => {
                  const lesson = editingLesson.lessonData; // Use the copied data for editing
                  return (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {lesson.type === 'video' && <Video className="h-5 w-5 text-blue-600" />}
                          {lesson.type === 'text' && <FileText className="h-5 w-5 text-green-600" />}
                          {lesson.type === 'quiz' && <CheckCircle className="h-5 w-5 text-purple-600" />}
                          {lesson.type === 'assignment' && <Edit className="h-5 w-5 text-orange-600" />}
                          Editing Lesson: {lesson.title}
                        </DialogTitle>
                        <DialogDescription>
                          Module: {modules[editingLesson.moduleIndex].title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-grow overflow-y-auto p-1 pr-3 space-y-6">
                        {/* Lesson Fields */}
                        <div className="space-y-4">
                           {/* Basic Lesson Info */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="lesson-title-dialog">Lesson Title</Label>
                            <Input
                              id="lesson-title-dialog"
                              value={lesson.title}
                              onChange={(e) => handleLessonEditorFieldChange("title", e.target.value)}
                              placeholder="Enter lesson title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lesson-duration-dialog">Duration (minutes)</Label>
                            <Input
                              id="lesson-duration-dialog"
                              type="number"
                              value={lesson.duration}
                              onChange={(e) => handleLessonEditorFieldChange("duration", Number(e.target.value))}
                              min="0"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="lesson-description-dialog">Description</Label>
                          <Textarea
                            id="lesson-description-dialog"
                            value={lesson.description}
                            onChange={(e) => handleLessonEditorFieldChange("description", e.target.value)}
                            placeholder="Brief description of the lesson"
                            rows={2}
                          />
                        </div>

                        {lesson.type === 'video' && (
                          <div>
                            <Label htmlFor="video-url-dialog">Video URL</Label>
                            <Input
                              id="video-url-dialog"
                              value={lesson.videoUrl}
                              onChange={(e) => handleLessonEditorFieldChange("videoUrl", e.target.value)}
                              placeholder="YouTube, Vimeo, or direct video URL"
                            />
                          </div>
                        )}

                        <div>
                          <Label>Lesson Content</Label>
                          <div className="mt-1">
                            <RichTextEditor
                              content={lesson.content}
                              onChange={(content) => handleLessonEditorFieldChange("content", content)}
                              placeholder={
                                lesson.type === 'text' ? "Write your lesson content here..." :
                                lesson.type === 'assignment' ? "Describe the assignment requirements..." :
                                "Add additional notes or instructions..."
                              }
                            />
                          </div>
                        </div>
                        </div>
                        {/* End Lesson Fields */}

                        {/* Quiz Management UI */}
                        {lesson.type === 'quiz' && (
                          <div className="space-y-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold">Quiz Questions</h3>
                              <Button onClick={addQuizQuestion} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" /> Add Question
                              </Button>
                            </div>
                            {(lesson.quiz?.questions || []).map((q, qIndex) => (
                              <Card key={q.id || qIndex} className="p-4 space-y-3 bg-gray-50/50">
                                <div className="flex justify-between items-start">
                                  <Label htmlFor={`q-text-${qIndex}`} className="text-sm font-medium block mb-1">
                                    Question {qIndex + 1}
                                  </Label>
                                  <Button variant="ghost" size="icon" onClick={() => deleteQuizQuestion(qIndex)} className="text-red-500 hover:text-red-600 h-7 w-7">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Textarea
                                  id={`q-text-${qIndex}`}
                                  value={q.question}
                                  onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                                  placeholder="Enter question text"
                                  rows={2}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`q-type-${qIndex}`} className="text-xs">Type</Label>
                                    <Select
                                      value={q.type}
                                      onValueChange={(value) => updateQuizQuestion(qIndex, 'type', value)}
                                    >
                                      <SelectTrigger id={`q-type-${qIndex}`}>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                                        <SelectItem value={QuestionType.TRUE_FALSE}>True/False</SelectItem>
                                        <SelectItem value={QuestionType.SHORT_ANSWER}>Short Answer</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                  {q.type === QuestionType.TRUE_FALSE && (
                                    <>
                                      <Label htmlFor={`q-correct-tf-${qIndex}`} className="text-xs">Correct Answer</Label>
                                      <Select
                                        value={String(q.correctAnswer)}
                                        onValueChange={(value) => updateQuizQuestion(qIndex, 'correctAnswer', value)}
                                      >
                                        <SelectTrigger id={`q-correct-tf-${qIndex}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true">True</SelectItem>
                                          <SelectItem value="false">False</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </>
                                  )}
                                  {q.type === QuestionType.SHORT_ANSWER && (
                                    <>
                                      <Label htmlFor={`q-correct-sa-${qIndex}`} className="text-xs">Correct Answer</Label>
                                      <Input
                                        id={`q-correct-sa-${qIndex}`}
                                        value={q.correctAnswer as string || ""}
                                        onChange={(e) => updateQuizQuestion(qIndex, 'correctAnswer', e.target.value)}
                                        placeholder="Enter correct answer"
                                      />
                                    </>
                                  )}
                                  </div>
                                </div>

                                {q.type === QuestionType.MULTIPLE_CHOICE && (
                                  <div className="space-y-2">
                                    <Label className="text-xs">Options & Correct Answer</Label>
                                    {(q.options || []).map((opt, optIndex) => (
                                      <div key={optIndex} className="flex items-center gap-2">
                                        <Input
                                          value={opt}
                                          onChange={(e) => updateQuestionOption(qIndex, optIndex, e.target.value)}
                                          placeholder={`Option ${optIndex + 1}`}
                                          className="flex-grow"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => deleteQuestionOption(qIndex, optIndex)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                      <Button onClick={() => addQuestionOption(qIndex)} variant="outline" size="sm" className="mt-1">
                                        <Plus className="h-3 w-3 mr-1" /> Add Option
                                      </Button>
                                      <Select
                                          value={String(q.correctAnswer)}
                                          onValueChange={(value) => updateQuizQuestion(qIndex, 'correctAnswer', value)}
                                        >
                                          <SelectTrigger className="w-[180px] mt-1" id={`q-correct-mc-${qIndex}`}>
                                            <SelectValue placeholder="Correct Option" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(q.options || []).map((_, optIdx) => (
                                              <SelectItem key={optIdx} value={String(optIdx)}>
                                                Option {optIdx + 1}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                    </div>
                                  </div>
                                )}
                              </Card>
                            ))}
                             {(!lesson.quiz?.questions || lesson.quiz.questions.length === 0) && (
                                <p className="text-sm text-center text-gray-500 py-3">No questions yet. Add one above!</p>
                            )}
                          </div>
                        )}
                        {/* End Quiz Management UI */}


                        {/* Attachments and Settings */}
                        <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label>Attachments</Label>
                          <FileUpload
                            onUploadSuccess={handleLessonAttachmentUploadSuccess}
                            label="Upload lesson materials"
                            description="Add PDFs, images, audio files, or other resources"
                            maxFiles={5}
                            uploadImmediately={true}
                          />
                            {editingLesson.lessonData.attachments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <h4 className="text-sm font-medium">Uploaded Attachments:</h4>
                                {editingLesson.lessonData.attachments.map(att => (
                                  <div key={att.url} className="flex items-center justify-between p-2 border rounded-md">
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                                      {att.name} ({ (att.size / 1024).toFixed(1) } KB)
                                    </a>
                                    <Button variant="ghost" size="icon" onClick={() => removeLessonAttachment(att.url)} className="text-red-500 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Switch
                              id="lesson-published-dialog"
                              checked={lesson.isPublished}
                              onCheckedChange={(checked) => handleLessonEditorFieldChange("isPublished", checked)}
                            />
                              <Label htmlFor="lesson-published-dialog">Published</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id="lesson-free-dialog"
                              checked={lesson.isFree}
                              onCheckedChange={(checked) => handleLessonEditorFieldChange("isFree", checked)}
                            />
                            <Label htmlFor="lesson-free-dialog">Free Preview</Label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="pt-4 border-t">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSaveLesson}>Save Lesson</Button>
                      </DialogFooter>
                    </>
                  );
                })()}
              </DialogContent>
            </Dialog>


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
                <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
                  {formData.image ? (
                     <img src={formData.image} alt={formData.title || "Course Thumbnail"} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-400 opacity-75" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-base mb-1 truncate">
                      {formData.title || "Untitled Course"}
                    </h3>

                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">
                      {formData.description || "Add a compelling description for your course."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div className="flex items-center">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <span>{modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</span>
                      </div>
                      <div className="flex items-center">
                         <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                         <span>
                            {modules.reduce((total, module) =>
                              total + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.duration, 0), 0
                            )} min
                         </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                       <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                        {communities.find(c => c.id === formData.communityId)?.name || "Community"}
                      </Badge>
                       <div>
                        {formData.isFree ? (
                          <Badge variant="secondary" className="text-xs text-green-700 border-green-300 py-0.5 px-1.5">Free</Badge>
                        ) : (
                          <span className="font-semibold text-sm">
                            {selectedCurrency?.symbol}{formData.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button size="sm" className="w-full mt-2 text-xs" variant="outline">
                      View Course Page (Preview)
                    </Button>
                  </div>
                </div>

                {/* More Detailed Statistics */}
                <div className="text-xs space-y-2 pt-3 border-t mt-3">
                  <h4 className="font-medium mb-1 text-gray-700">Course Statistics:</h4>
                  <div className="space-y-0.5 text-gray-600">
                    <div><strong className="font-medium text-gray-800">{modules.length}</strong> modules</div>
                    <div><strong className="font-medium text-gray-800">{modules.reduce((total, module) => total + module.lessons.length, 0)}</strong> lessons</div>
                    <div><strong className="font-medium text-gray-800">{modules.reduce((total, module) =>
                      total + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.duration, 0), 0
                    )}</strong> total minutes</div>
                  </div>
                </div>

                <div className="text-xs space-y-2 pt-2 border-t mt-2">
                  <h4 className="font-medium mb-1 text-gray-700">Module Overview:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {modules.map((module, index) => (
                      <div key={index} className="text-gray-600 p-1.5 bg-gray-50 rounded text-xs">
                        <div className="font-medium truncate">{index + 1}. {module.title || `Module ${index + 1}`}</div>
                         <div className="text-xxs text-gray-500 pl-2">{module.lessons.length} lessons</div>
                      </div>
                    ))}
                    {modules.length === 0 && <p className="text-gray-500 text-xs">No modules defined yet.</p>}
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs text-gray-500 pt-2 border-t mt-2">
                    {formData.isPublished ? (
                      <div className="flex items-center text-green-600">
                         <Globe className="h-3.5 w-3.5 mr-1" /> Published
                      </div>
                    ) : (
                       <div className="flex items-center text-gray-500">
                        <Lock className="h-3.5 w-3.5 mr-1" /> Draft
                       </div>
                    )}
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
