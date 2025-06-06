"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Youtube from "@tiptap/extension-youtube"
import Color from "@tiptap/extension-color"
import TextStyle from "@tiptap/extension-text-style"
import Highlight from "@tiptap/extension-highlight"
import Table from "@tiptap/extension-table" // Reverted import
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { Video } from "@/components/tiptap/video"
import { Audio } from "@/components/tiptap/audio"
import { Pdf } from "@/components/tiptap/pdf"
import { FileUpload, UploadedFile } from "@/components/ui/file-upload" // Added UploadedFile import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog" // DialogTrigger removed as it's not used

const lowlight = createLowlight(common)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"; // No longer explicitly used for link input
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Palette,
  Highlighter,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileVideo, // Added
  FileAudio, // Added
  FileText, // Added (for PDF)
} from "lucide-react"
import { useState, useCallback } from "react" // Added useCallback
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

type MediaUploadType = "image" | "video" | "audio" | "pdf" | null; // Added

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMediaUploadDialog, setShowMediaUploadDialog] = useState(false) // Added
  const [mediaUploadType, setMediaUploadType] = useState<MediaUploadType>(null) // Added

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Reverted to only disabling codeBlock
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:text-blue-800 underline",
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: "rounded-lg",
        },
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      // TableRow, TableCell, TableHeader removed from here
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Video, // Added
      Audio, // Added
      Pdf, // Added
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
          className
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  const openMediaUpload = (type: MediaUploadType) => {
    setMediaUploadType(type)
    setShowMediaUploadDialog(true)
  }

  const handleMediaUploadSuccess = useCallback((uploadedFile: UploadedFile) => { // Renamed and updated parameter
    if (!editor || !mediaUploadType || !uploadedFile.url) {
      setShowMediaUploadDialog(false)
      // Optionally: show a toast notification for error
      console.error("Media upload failed or URL not provided.")
      return
    }

    const { url } = uploadedFile; // Get URL from the uploaded file object

    const chain = editor.chain().focus()

    switch (mediaUploadType) {
      case "image":
        chain.setImage({ src: url }).run()
        break
      case "video":
        chain.setVideo({ src: url }).run()
        break
      case "audio":
        chain.setAudio({ src: url }).run()
        break
      case "pdf":
        chain.setPdf({ src: url }).run()
        break
    }
    setShowMediaUploadDialog(false)
    setMediaUploadType(null)
    // Optionally: show a toast notification for success
  }, [editor, mediaUploadType])


  const addImage = () => openMediaUpload("image") // Updated
  const addYoutube = () => { // Kept as is for now, could be a separate "embed" type
    const url = window.prompt("Enter YouTube URL:")
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }
  const addVideo = () => openMediaUpload("video") // Updated
  const addAudio = () => openMediaUpload("audio") // Updated
  const addPdf = () => openMediaUpload("pdf") // Updated

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl("")
      setShowLinkInput(false)
    }
  }

  const colors = [
    "#000000", "#DC2626", "#EA580C", "#D97706", "#65A30D",
    "#059669", "#0891B2", "#2563EB", "#7C3AED", "#C026D3"
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("taskList") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button variant="ghost" size="sm" onClick={addImage} title="Insert Image">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addYoutube} title="Insert YouTube Video">
            <YoutubeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addVideo} title="Insert Video">
            <FileVideo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addAudio} title="Insert Audio">
            <FileAudio className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addPdf} title="Insert PDF">
            <FileText className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkInput(!showLinkInput)}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10">
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="Enter URL"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-48"
                  />
                  <Button size="sm" onClick={addLink}>Add</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette className="h-4 w-4" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run()
                        setShowColorPicker(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant={editor.isActive("highlight") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        {/* Other */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <Button
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
        <EditorContent
          editor={editor}
          placeholder={placeholder}
        />
        {!content && placeholder && (
          <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Media Upload Dialog */}
      <Dialog open={showMediaUploadDialog} onOpenChange={setShowMediaUploadDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Upload {mediaUploadType ? mediaUploadType.charAt(0).toUpperCase() + mediaUploadType.slice(1) : 'Media'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {mediaUploadType && ( // Ensure mediaUploadType is not null before rendering FileUpload
              <FileUpload
                onUploadSuccess={handleMediaUploadSuccess} // Changed prop name
                acceptedFileTypes={
                  mediaUploadType === "image" ? { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] } :
                  mediaUploadType === "video" ? { 'video/*': ['.mp4', '.mov', '.avi'] } :
                  mediaUploadType === "audio" ? { 'audio/*': ['.mp3', '.wav'] } :
                  mediaUploadType === "pdf" ? { 'application/pdf': ['.pdf'] } :
                  {}
                }
                maxFiles={1}
                label={`Upload ${mediaUploadType.charAt(0).toUpperCase() + mediaUploadType.slice(1)} File`}
                description={`Drag and drop your ${mediaUploadType} file here, or click to select.`}
              />
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
