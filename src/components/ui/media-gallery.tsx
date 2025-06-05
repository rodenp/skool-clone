"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Search,
  Grid3X3,
  List,
  Play,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  thumbnail?: string
  size: number
  duration?: number
  uploadedAt: string
  tags: string[]
  description?: string
}

interface MediaGalleryProps {
  items: MediaItem[]
  onSelect?: (item: MediaItem) => void
  onUpload?: (files: File[]) => void
  onDelete?: (itemId: string) => void
  selectable?: boolean
  viewMode?: 'grid' | 'list'
  className?: string
}

export function MediaGallery({
  items,
  onSelect,
  onUpload,
  onDelete,
  selectable = false,
  viewMode = 'grid',
  className
}: MediaGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [currentViewMode, setCurrentViewMode] = useState(viewMode)

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === "all" || item.type === selectedType
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    // You might want to show a toast here
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={currentViewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={currentViewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {onUpload && (
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
      </div>

      {/* Media Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No media files found</p>
          {searchQuery && (
            <p className="text-sm">Try adjusting your search or filters</p>
          )}
        </div>
      ) : currentViewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
                selectable && "hover:ring-2 hover:ring-blue-500"
              )}
              onClick={() => onSelect?.(item)}
            >
              <div className="aspect-square relative bg-gray-100">
                {item.type === 'image' && (
                  <Image
                    src={item.thumbnail || item.url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
                {item.type === 'video' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                )}
                {(item.type === 'audio' || item.type === 'document') && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    {getTypeIcon(item.type)}
                  </div>
                )}

                {item.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1 rounded">
                    {formatDuration(item.duration)}
                  </div>
                )}
              </div>

              <CardContent className="p-2">
                <p className="text-sm font-medium truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer hover:shadow-sm transition-shadow",
                selectable && "hover:ring-2 hover:ring-blue-500"
              )}
              onClick={() => onSelect?.(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {item.type === 'image' && item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="text-gray-400">
                        {getTypeIcon(item.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{formatFileSize(item.size)}</span>
                      {item.duration && <span>{formatDuration(item.duration)}</span>}
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(item.url)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(item.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
