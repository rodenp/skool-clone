"use client"

import { useCallback, useState, useEffect } from "react" // Added useEffect
import { useDropzone, FileRejection } from "react-dropzone" // Added FileRejection
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
  AlertCircle,
  Loader2 // Added for loading state
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onUploadSuccess: (uploadedFile: UploadedFile) => void; // Changed from onUpload: (files: File[])
  // onRemove is for removing already uploaded files, which might require server interaction.
  // For now, we'll focus on the upload part.
  // onRemove?: (fileId: string) => void
  acceptedFileTypes?: {
    [key: string]: string[]
  }
  maxFileSize?: number // in bytes
  maxFiles?: number
  // uploadedFiles prop might be used if parent component manages the list of files externally
  // For now, this component will manage its own internal list of files being processed.
  // uploadedFiles?: UploadedFile[];
  className?: string
  label?: string
  description?: string
  uploadImmediately?: boolean // New prop to control if upload starts on drop
}

export interface UploadedFile { // Exported for use in RichTextEditor if needed
  id: string; // Could be file.name or a generated UID
  name: string;
  size: number;
  type: string;
  url?: string; // URL from the server
  progress?: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  file?: File; // Keep the original file object for upload
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
  onUploadSuccess,
  acceptedFileTypes = DEFAULT_ACCEPTED_FILES,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 1, // Default to 1 for media insertion, can be overridden
  className,
  label = "Upload File",
  description = "Drag and drop a file here, or click to select",
  uploadImmediately = true,
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleUpload = async (fileToUpload: UploadedFile) => {
    if (!fileToUpload.file) return;

    setInternalFiles(prev => prev.map(f =>
      f.id === fileToUpload.id ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    const formData = new FormData();
    formData.append('file', fileToUpload.file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Simulate progress for demo
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(res => setTimeout(res, 50)); // Simulate network delay
        setInternalFiles(prev => prev.map(f =>
          f.id === fileToUpload.id ? { ...f, progress: i } : f
        ));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed with status: " + response.status }));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.url) {
        const newUploadedFile: UploadedFile = {
          ...fileToUpload,
          url: result.url,
          status: 'completed',
          progress: 100,
          file: undefined, // Remove original file object after upload
        };
        setInternalFiles(prev => prev.map(f => f.id === newUploadedFile.id ? newUploadedFile : f));
        onUploadSuccess(newUploadedFile);
      } else {
        throw new Error(result.error || 'Upload failed: No URL returned.');
      }
    } catch (error: any) {
      setInternalFiles(prev => prev.map(f =>
        f.id === fileToUpload.id ? { ...f, status: 'error', error: error.message || "Unknown error" } : f
      ));
    }
  };

  const onDrop = useCallback((acceptedBrowserFiles: File[], rejectedBrowserFiles: FileRejection[]) => {
    setDragActive(false);
    const newFiles: UploadedFile[] = acceptedBrowserFiles.map(browserFile => ({
      id: `${browserFile.name}-${Date.now()}`, // More unique ID
      name: browserFile.name,
      size: browserFile.size,
      type: browserFile.type,
      status: 'pending',
      file: browserFile,
    }));

    const rejectedFilesMapped: UploadedFile[] = rejectedBrowserFiles.map(rejectedFile => ({
      id: `${rejectedFile.file.name}-${Date.now()}-rejected`,
      name: rejectedFile.file.name,
      size: rejectedFile.file.size,
      type: rejectedFile.file.type,
      status: 'error',
      error: rejectedFile.errors.map(e => e.message).join(', '),
      file: rejectedFile.file,
    }));

    setInternalFiles(prev => [...prev, ...newFiles, ...rejectedFilesMapped].slice(0, maxFiles)); // Enforce maxFiles

    if (uploadImmediately && newFiles.length > 0) {
      // Upload valid files, for now just the first one if maxFiles is 1
      newFiles.filter(nf => nf.status === 'pending').slice(0, maxFiles).forEach(handleUpload);
    }
  }, [uploadImmediately, maxFiles, onUploadSuccess]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    maxFiles: maxFiles, // Let dropzone handle maxFiles check as well
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    disabled: internalFiles.some(f => f.status === 'uploading') || internalFiles.length >= maxFiles, // Disable if uploading or max files reached
  })

  // Cleanup blob URLs if any were created (though not used in this version)
  useEffect(() => {
    return () => {
      internalFiles.forEach(uploadedFile => {
        if (uploadedFile.url && uploadedFile.url.startsWith('blob:')) {
          URL.revokeObjectURL(uploadedFile.url);
        }
      });
    };
  }, [internalFiles]);

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
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <File className="h-4 w-4 text-gray-500" />; // Icon for pending state
      default:
        return null;
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
          (internalFiles.some(f => f.status === 'uploading') || internalFiles.length >= maxFiles) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{label}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Button
          type="button"
          variant="outline"
          disabled={internalFiles.some(f => f.status === 'uploading') || internalFiles.length >= maxFiles}
        >
          Select File
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Max file size: {formatFileSize(maxFileSize)} • Max files: {maxFiles}
        </p>
      </div>

      {/* Uploaded Files List */}
      {internalFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="font-medium text-gray-900">
            {maxFiles > 1 ? `Selected Files (${internalFiles.length}/${maxFiles})` : 'Selected File'}
          </h4>
          <div className="space-y-2">
            {internalFiles.map((internalFile) => (
              <div
                key={internalFile.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="text-gray-400">
                  {getFileIcon(internalFile.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {internalFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(internalFile.size)}
                    {internalFile.status === 'uploading' && internalFile.progress !== undefined && ` - ${internalFile.progress}%`}
                  </p>

                  {internalFile.status === 'uploading' && internalFile.progress !== undefined && (
                    <div className="mt-1">
                      <Progress value={internalFile.progress} className="h-1.5" />
                    </div>
                  )}

                  {internalFile.status === 'error' && internalFile.error && (
                    <p className="text-xs text-red-600 mt-1">{internalFile.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(internalFile.status)}

                  {internalFile.status === 'pending' && uploadImmediately === false && (
                     <Button size="sm" onClick={() => handleUpload(internalFile)}>Upload</Button>
                  )}

                  {internalFile.url && internalFile.status === 'completed' && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={internalFile.url} target="_blank" rel="noopener noreferrer" title="View uploaded file">
                        <FileText className="h-4 w-4" /> {/* Or a more generic link icon */}
                      </a>
                    </Button>
                  )}

                  {/* Basic remove functionality for pending or errored files */}
                  {(internalFile.status === 'pending' || internalFile.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInternalFiles(prev => prev.filter(f => f.id !== internalFile.id))}
                      className="text-red-600 hover:text-red-700"
                      title="Remove file from list"
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

      {/* Accepted File Types (Optional display) */}
      <div className="text-xs text-gray-500 mt-4">
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
