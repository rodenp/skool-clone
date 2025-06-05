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
  const { data: session } = useSession();
  const router = useRouter();
  // const searchParams = useSearchParams(); // Commented out
  // const [isLoading, setIsLoading] = useState(false); // Commented out
  // const [isLoadingCourse, setIsLoadingCourse] = useState(false); // Commented out
  // const [activeTab, setActiveTab] = useState("details"); // Commented out
  // const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false); // Commented out

  // // Enum for question types for clarity
  // const QuestionType = {
  //   MULTIPLE_CHOICE: 'multiple_choice' as 'multiple_choice',
  //   TRUE_FALSE: 'true_false' as 'true_false',
  //   SHORT_ANSWER: 'short_answer' as 'short_answer',
  // };
  // const [communities, setCommunities] = useState<Community[]>([]); // Commented out

  // const courseId = searchParams.get("courseId"); // Commented out
  // const isEditing = !!courseId; // Commented out

  // const [formData, setFormData] = useState({ // Commented out
  //   title: "",
  //   description: "",
  //   image: "",
  //   price: 0,
  //   currency: "USD",
  //   isPublished: false,
  //   isFree: true,
  //   communityId: "",
  // });

  // const [modules, setModules] = useState<Module[]>([]); // Commented out

  // const [uploadedLessonAttachments, setUploadedLessonAttachments] = useState<CustomUploadedFile[]>([]); // Commented out

  // const [editingLesson, setEditingLesson] = useState<{ // Commented out
  //   moduleIndex: number;
  //   lessonIndex: number;
  //   lessonData: Lesson;
  // } | null>(null);
  // const [isLessonEditorOpen, setIsLessonEditorOpen] = useState(false); // Commented out

  // const [errors, setErrors] = useState<Record<string, string>>({}); // Commented out

  // const fetchCommunities = useCallback(async () => { // Commented out entire function
  //   // ...
  // }, [session?.user?.id, isEditing]);

  // const fetchCourse = useCallback(async () => { // Commented out entire function
  //   // ...
  // }, [courseId]);

  // useEffect(() => { // Commented out
  //   // fetchCommunities()
  // }, []); // Simplified dependency

  // useEffect(() => { // Commented out
  //   // if (isEditing && courseId) {
  //   //   fetchCourse()
  //   // }
  // }, []); // Simplified dependency

  // const handleInputChange = (field: string, value: string | number | boolean) => { // Commented out
  //   // ...
  // };

  // const validateForm = () => { // Commented out
  //   // ...
  //   return true; // Simplified
  // };

  // const addModule = () => { // Commented out
  //   // ...
  // };

  // const updateModule = (moduleIndex: number, field: string, value: string) => { // Commented out
  //   // ...
  // };

  // const deleteModule = (moduleIndex: number) => { // Commented out
  //   // ...
  // };

  // const addLesson = (moduleIndex: number, type: Lesson['type'] = 'video') => { // Commented out
  //   // ...
  // };

  // const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: string | number | boolean | Attachment[]) => { // Commented out
  //   // ...
  // };

  // const deleteLesson = (moduleIndex: number, lessonIndex: number) => { // Commented out
  //   // ...
  // };

  // const reorderLessons = (moduleIndex: number, startIndex: number, endIndex: number) => { // Commented out
  //   // ...
  // };

  // const handleLessonAttachmentUploadSuccess = (uploadedFile: CustomUploadedFile) => { // Commented out
  //   // ...
  // };

  // const removeLessonAttachment = (attachmentUrl: string) => { // Commented out
  //   // ...
  // };

  // const openLessonEditor = (moduleIndex: number, lessonIndex: number) => { // Commented out
  //   // ...
  // };

  // const handleSaveLesson = () => { // Commented out
  //   // ...
  // };

  // const handleLessonEditorFieldChange = (field: keyof Lesson, value: any) => { // Commented out
  //   // ...
  // };

  // // --- Quiz Question Management Functions --- // Commented out
  // const addQuizQuestion = () => { // Commented out
  //   // ...
  // };
  // const updateQuizQuestion = (qIndex: number, field: string, value: any) => { // Commented out
  //   // ...
  // };
  // const deleteQuizQuestion = (qIndex: number) => { // Commented out
  //   // ...
  // };
  // const addQuestionOption = (qIndex: number) => { // Commented out
  //   // ...
  // };
  // const updateQuestionOption = (qIndex: number, optIndex: number, value: string) => { // Commented out
  //   // ...
  // };
  // const deleteQuestionOption = (qIndex: number, optIndex: number) => { // Commented out
  //   // ...
  // };
  // // --- End Quiz Question Management Functions --- // Commented out

  // const handleThumbnailUploadSuccess = (uploadedFile: CustomUploadedFile) => { // Commented out
  //   // ...
  // };

  // const removeThumbnail = () => { // Commented out
  //   // ...
  // };

  // const handleSubmit = async () => { // Commented out
  //   // ...
  // };

  // const selectedCurrency = currencies.find(c => c.code === formData.currency); // Commented out
  // // Removed console.log("Sanity check before main return");

  // // Show loading spinner when loading course data for editing
  // if (isEditing && isLoadingCourse) { // Commented out
  //   return (
  //     <div className="max-w-6xl mx-auto space-y-6">
  //       <div className="flex items-center gap-4">
  //         <Button variant="ghost" size="sm" asChild>
  //           <Link href="/app/courses">
  //             <ArrowLeft className="h-4 w-4 mr-2" />
  //             Back to Courses
  //           </Link>
  //         </Button>
  //       </div>
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  //         <p className="ml-4 text-gray-600">Loading course data...</p>
  //       </div>
  //     </div>
  //   ); // Semicolon kept
  // }
  // // Removed the else block, direct return follows
  return (
    // Simplified return for testing build
    <div>Create Course Page Content Placeholder</div>
    // <div className="max-w-6xl mx-auto space-y-6">
    //   {/* Header */}
    //   <div className="flex items-center gap-4">
    //     <Button variant="ghost" size="sm" asChild>
    //       <Link href="/app/courses">
    //         <ArrowLeft className="h-4 w-4 mr-2" />
    //         Back to Courses
    //       </Link>
    //     </Button>
    //     <div>
    //       <h1 className="text-3xl font-bold text-gray-900">
    //         {/* {isEditing ? 'Edit Course' : 'Create Course'} */}
    //       </h1>
    //       <p className="text-gray-600 mt-1">
    //         {/* {isEditing ? 'Update your course content and settings' : 'Create an engaging course for your community'} */}
    //       </p>
    //     </div>
    //   </div>
    //   {/* ... The rest of the original JSX is commented out for the test ... */}
    // </div>
  ); // Added semicolon
} // This is the correct closing brace for CreateCoursePageContent
