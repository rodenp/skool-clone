"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Users,
  Star,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  Crown,
  Lock,
  Globe
} from "lucide-react"
import Image from "next/image"

interface Community {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  icon?: string
  memberCount?: number
  price: number
  currency: string
  isPrivate: boolean
  isFree: boolean
  isJoined?: boolean
  isOwner?: boolean
  category?: string
  trending?: boolean
  owner: {
    id?: string
    name: string
    image?: string
  }
  _count?: {
    members: number
  }
  settings?: Record<string, unknown>
  members?: Member[]
}

interface CommunityApiResponse {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  price: number
  currency: string
  isPrivate: boolean
  isFree: boolean
  owner: {
    id: string
    name: string
    image?: string
  }
  _count: {
    members: number
  }
  settings?: {
    category?: string
  }
  members?: Array<{
    userId: string
  }>
}

interface Member {
  userId: string
}

// This will be replaced with real data from the API
const mockCommunities: Community[] = []

const categories = [
  "All",
  "Business",
  "Technology",
  "Art & Creativity",
  "Sports",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Education"
]

export default function CommunitiesPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("all")
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCommunities = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/communities')
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedCommunities = data.map((community: CommunityApiResponse): Community => ({
          ...community,
          memberCount: community._count.members,
          category: community.settings?.category || "General",
          isJoined: session?.user?.id ? community.members?.some((m) => m.userId === session.user.id) : false,
          isOwner: session?.user?.id === community.owner.id,
          trending: false, // You can implement trending logic later
          icon: "🏠" // Default icon
        }))
        setCommunities(transformedCommunities)
      } else {
        console.error('Failed to fetch communities')
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || community.category === selectedCategory

    if (activeTab === "joined") {
      return matchesSearch && matchesCategory && community.isJoined
    }
    if (activeTab === "owned") {
      return matchesSearch && matchesCategory && community.isOwner
    }

    return matchesSearch && matchesCategory
  })

  const CommunityCard = ({ community }: { community: Community }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        {community.image ? (
          <div className="aspect-video relative">
            <Image
              src={community.image}
              alt={community.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-4xl">{community.icon}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {community.trending && (
            <Badge className="bg-red-500 text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
          {community.isOwner && (
            <Badge className="bg-yellow-500 text-black">
              <Crown className="h-3 w-3 mr-1" />
              Owner
            </Badge>
          )}
          {community.isPrivate && (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Private
            </Badge>
          )}
        </div>

        {community.isJoined && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-600 text-white">
              <Star className="h-3 w-3 mr-1" />
              Joined
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {community.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {community.name}
            </h3>
            <p className="text-sm text-gray-600">
              by {community.owner.name}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {community.description}
        </p>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            {(community.memberCount || community._count?.members || 0).toLocaleString()} members
          </div>
          <div className="flex items-center">
            {community.isFree ? (
              <Badge variant="secondary" className="text-green-600">
                Free
              </Badge>
            ) : (
              <span className="font-semibold text-gray-900">
                ${community.price}/month
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {community.category}
          </Badge>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/app/communities/${community.slug}`}>
                View
              </Link>
            </Button>
            {!community.isJoined && (
              <Button size="sm">
                {community.isFree ? "Join Free" : "Join"}
              </Button>
            )}
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
          <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
          <p className="text-gray-600 mt-1">
            Discover and join communities that match your interests
          </p>
        </div>
        <Button asChild>
          <Link href="/app/communities/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Community
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
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

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
          <TabsTrigger value="all">All Communities</TabsTrigger>
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="owned">My Communities</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading communities...</p>
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "owned" ? "No communities created yet" :
                 activeTab === "joined" ? "No communities joined yet" :
                 "No communities found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "owned" ? "Create your first community to get started" :
                 activeTab === "joined" ? "Join some communities to see them here" :
                 "Try adjusting your search or filters"}
              </p>
              {activeTab === "owned" && (
                <Button asChild>
                  <Link href="/app/communities/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Community
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
              {filteredCommunities.map((community) => (
                <CommunityCard key={community.id} community={community} />
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
                {communities.length}
              </div>
              <div className="text-sm text-gray-600">Total Communities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {communities.filter(c => c.isJoined).length}
              </div>
              <div className="text-sm text-gray-600">Communities Joined</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {communities.filter(c => c.isOwner).length}
              </div>
              <div className="text-sm text-gray-600">Communities Owned</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
