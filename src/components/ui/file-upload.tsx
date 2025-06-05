"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  X,
  Check,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onUpload: (files: File[]) => void
  onRemove?: (fileId: string) => void
  acceptedFileTypes?: {
    [key: string]: string[]
  }
  maxFileSize?: number // in bytes
  maxFiles?: number
  uploadedFiles?: UploadedFile[]
  className?: string
  label?: string
  description?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  progress?: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

const DEFAULT_ACCEPTED_FILES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
  'audio/*': ['.mp3', '.wav', '.aac', '.ogg'],
  'application/pdf': ['.pdf'],
  'text/*': ['.txt', '.md'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
}

export function FileUpload({
  onUpload,
  onRemove,
  acceptedFileTypes = DEFAULT_ACCEPTED_FILES,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  uploadedFiles = [],
  className,
  label = "Upload Files",
  description = "Drag and drop files here, or click to select"
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles)
    }
    setDragActive(false)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    maxFiles: maxFiles - uploadedFiles.length,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />
    if (type.startsWith('video/')) return <Video className="h-8 w-8" />
    if (type.startsWith('audio/')) return <Music className="h-8 w-8" />
    if (type === 'application/pdf') return <FileText className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive || dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          uploadedFiles.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} disabled={uploadedFiles.length >= maxFiles} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{label}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Button
          variant="outline"
          disabled={uploadedFiles.length >= maxFiles}
          type="button"
        >
          Select Files
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Max file size: {formatFileSize(maxFileSize)} • Max files: {maxFiles}
        </p>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                {file.name}: {errors.map(e => e.message).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="text-gray-400">
                  {getFileIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>

                  {file.status === 'uploading' && file.progress !== undefined && (
                    <div className="mt-1">
                      <Progress value={file.progress} className="h-1" />
                    </div>
                  )}

                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(file.status)}

                  {file.url && file.status === 'completed' && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  )}

                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted File Types */}
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Accepted file types:</p>
        <p>
          {Object.entries(acceptedFileTypes)
            .map(([type, extensions]) => extensions.join(', '))
            .join(', ')
          }
        </p>
      </div>
    </div>
  )
}
