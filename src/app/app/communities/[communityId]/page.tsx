"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Users,
  Settings,
  Plus,
  Globe,
  Lock,
  Crown,
  Star,
  MessageCircle,
  BookOpen,
  Calendar, // Already imported, but make sure it's Calendar from lucide-react if used as icon
  Trophy,
  Share2,
  MoreHorizontal
} from "lucide-react"
import { toast } from "sonner"

interface Community {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  banner?: string
  isPrivate: boolean
  isFree: boolean
  price: number
  currency: string
  settings: Record<string, unknown>
  owner: {
    id: string
    name: string
    image?: string
  }
  _count: {
    members: number
  }
  createdAt: string
  updatedAt: string
}

interface CommunityEvent { // Already defined from previous step
  id: string;
  title: string;
  startDate: string;
  description?: string | null;
  location?: string | null;
}

// Define CommunityCourse interface
interface CommunityCourse {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  // Add other relevant fields from your Course model if needed for display
  // e.g., modules_count for a quick summary, or creator name
  creator?: { name?: string | null };
  _count?: { modules?: number; lessons?: number; enrollments?: number }; // Example
}

interface Member {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string
    username?: string
    image?: string
    points: number
    level: number
  }
}

export default function CommunityPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [userRole, setUserRole] = useState<string>("")

  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [communityCourses, setCommunityCourses] = useState<CommunityCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const communityIdFromParams = params.communityId as string

  const fetchCommunity = useCallback(async () => {
    if (!communityIdFromParams || communityIdFromParams === "undefined") {
      setIsLoading(false);
      setCommunity(null); // Explicitly set community to null
      // console.error("FetchCommunity called with invalid communityId:", communityIdFromParams); // Optional: for debugging
      return;
    }

    setIsLoading(true); // Set isLoading true only if we proceed
    try {
      const response = await fetch(`/api/communities/${communityIdFromParams}`);
      if (!response.ok) {
        // Try to parse error from API if possible, otherwise use generic
        let errorMsg = "Community not found";
        try {
           const errorData = await response.json();
           errorMsg = errorData.error || errorMsg;
        } catch (e) { /* ignore parsing error, use generic */ }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setCommunity(data);

      if (session?.user?.id && data.members) { // Check if data.members exists
        const membership = data.members.find((m: { userId: string }) => m.userId === session.user.id);
        setIsMember(!!membership);
        setUserRole(membership?.role || "");
      } else if (session?.user?.id && !data.members) {
        // If API doesn't include members, we might need a separate fetch or adjust expectations
        // For now, assume members might not always be directly on community object from this specific fetch
        // Or, ensure the API always returns it if needed for membership check here.
        // Let's assume for now that if community is found, membership check might be based on a separate call or different logic
        // For this fix, the key is handling the community data itself.
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load community");
      console.error(error);
      setCommunity(null); // Ensure community is null on error
    } finally {
      setIsLoading(false);
    }
  }, [communityIdFromParams, session?.user?.id]);

  const fetchMembers = useCallback(async () => {
    if (!communityIdFromParams || communityIdFromParams === "undefined") {
      setMembers([]); // Clear members if ID is invalid
      return;
    }
    try {
      const response = await fetch(`/api/communities/${communityIdFromParams}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      } else {
        // Optionally handle error for fetching members, e.g., show a toast or log
        console.error("Failed to fetch members list from API");
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    }
  }, [communityIdFromParams]);

  }, [communityIdFromParams]);

  const fetchCommunityEvents = useCallback(async () => {
    if (!communityIdFromParams || communityIdFromParams === "undefined") {
      setCommunityEvents([]);
      return;
    }
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      // Example: Fetch all events for the community, not just for a specific month initially
      const response = await fetch(`/api/communities/${communityIdFromParams}/events`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch community events");
      }
      const data = await response.json();
      setCommunityEvents(data);
    } catch (error) {
      console.error("Failed to fetch community events:", error);
      setEventsError(error instanceof Error ? error.message : "Could not load events");
      setCommunityEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [communityIdFromParams]);

  const fetchCommunityCourses = useCallback(async () => {
    if (!communityIdFromParams || communityIdFromParams === "undefined") {
      setCommunityCourses([]);
      return;
    }
    setIsLoadingCourses(true);
    setCoursesError(null);
    try {
      const response = await fetch(`/api/courses?communityId=${communityIdFromParams}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch community courses");
      }
      const data = await response.json();
      setCommunityCourses(data);
    } catch (error) {
      console.error("Failed to fetch community courses:", error);
      setCoursesError(error instanceof Error ? error.message : "Could not load courses");
      setCommunityCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [communityIdFromParams]);

  useEffect(() => {
    if (communityIdFromParams && communityIdFromParams !== "undefined") {
      fetchCommunity();
      fetchMembers();
      fetchCommunityEvents();
      fetchCommunityCourses(); // New call
    } else {
      // Handle the case where communityId is not valid on initial load
      setIsLoading(false);
      setCommunity(null);
      setMembers([]);
      setCommunityEvents([]);
      setCommunityCourses([]); // Clear courses if ID is invalid
    }
  }, [communityIdFromParams, fetchCommunity, fetchMembers, fetchCommunityEvents, fetchCommunityCourses]);

  const handleJoinCommunity = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to join the community")
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch(`/api/communities/${communityIdFromParams}/join`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to join community")
      }

      setIsMember(true)
      setUserRole("MEMBER")
      toast.success("Successfully joined the community!")
      fetchCommunity()
      fetchMembers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join community")
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Community not found</h1>
        <p className="text-gray-600 mb-6">The community you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/app/communities">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Link>
        </Button>
      </div>
    )
  }

  const isOwner = session?.user?.id === community.owner.id
  const category = (community.settings?.category as string) || "General"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/communities">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Link>
        </Button>
      </div>

      {/* Community Header */}
      <div className="relative">
        {/* Banner */}
        {community.banner ? (
          <div className="h-48 relative rounded-lg overflow-hidden">
            <Image
              src={community.banner}
              alt={`${community.name} banner`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-6xl text-white">🏠</span>
          </div>
        )}

        {/* Community Info */}
        <Card className="relative -mt-16 mx-4 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Community Avatar */}
              <div className="w-24 h-24 bg-white rounded-lg border-4 border-white shadow-lg flex items-center justify-center text-3xl flex-shrink-0">
                {community.image ? (
                  <Image
                    src={community.image}
                    alt={community.name}
                    width={96}
                    height={96}
                    className="rounded-lg"
                  />
                ) : (
                  "🏠"
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
                      {community.isPrivate ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Globe className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{community.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {community._count.members} members
                      </div>
                      <Badge variant="secondary">{category}</Badge>
                      {!community.isFree && (
                        <Badge className="bg-green-600">
                          {community.currency === "USD" ? "$" : community.currency}
                          {community.price}/month
                        </Badge>
                      )}
                      {community.isFree && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/app/communities/${communityIdFromParams}/settings`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </Button>
                    )}
                    {!isMember && !isOwner && (
                      <Button onClick={handleJoinCommunity} disabled={isJoining}>
                        {isJoining ? "Joining..." : community.isFree ? "Join Free" : "Join"}
                      </Button>
                    )}
                    {isMember && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">
                          <Star className="h-3 w-3 mr-1" />
                          {userRole === "OWNER" ? "Owner" : "Member"}
                        </Badge>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {isMember && (
                <Card>
                  <CardContent className="p-4">
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create a post
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Sample Posts */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet. Be the first to start a discussion!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Courses Offered</CardTitle>
                   {isOwner && (
                    <Button size="sm" asChild className="ml-auto">
                      {/* Link to create course page or open modal */}
                      <Link href={`/app/courses/create?communityId=${communityIdFromParams}`}>
                         <Plus className="h-4 w-4 mr-2" /> Create Course
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingCourses && <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>}
                  {coursesError && (
                    <Alert variant="destructive">
                      <AlertDescription>{coursesError}</AlertDescription>
                    </Alert>
                  )}
                  {!isLoadingCourses && !coursesError && communityCourses.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No courses available in this community yet.</p>
                    </div>
                  )}
                  {!isLoadingCourses && !coursesError && communityCourses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {communityCourses.map(course => (
                        <Link key={course.id} href={`/app/courses/${course.id}`} passHref>
                          <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                            {course.image && (
                              <div className="aspect-video relative w-full">
                                <Image src={course.image} alt={course.title} fill className="object-cover rounded-t-lg" />
                              </div>
                            )}
                            <CardHeader>
                              <CardTitle className="text-md line-clamp-2">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <CardDescription className="text-xs line-clamp-3">{course.description || "No description available."}</CardDescription>
                            </CardContent>
                            {/* <CardFooter className="text-xs text-gray-500">
                              {course._count?.lessons || 0} lessons
                            </CardFooter> */}
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  {isOwner && (
                    <Button size="sm" asChild className="ml-auto">
                      {/* Link to create event page or open modal */}
                      <Link href={`/app/events/create?communityId=${communityIdFromParams}`}>
                        <Plus className="h-4 w-4 mr-2" /> Schedule Event
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingEvents && <p className="text-gray-500 dark:text-gray-400">Loading events...</p>}
                  {eventsError && (
                    <Alert variant="destructive">
                      <AlertDescription>{eventsError}</AlertDescription>
                    </Alert>
                  )}
                  {!isLoadingEvents && !eventsError && communityEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No events scheduled for this community yet.</p>
                    </div>
                  )}
                  {!isLoadingEvents && !eventsError && communityEvents.length > 0 && (
                    <ul className="space-y-4">
                      {communityEvents.map(event => (
                        <li key={event.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                          <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{event.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            {' at '}
                            {new Date(event.startDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {event.location && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Location: {event.location}</p>}
                          {event.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{event.description}</p>}
                          {/* Conceptual: Link to event details page */}
                          {/* <Link href={`/app/events/${event.id}`} className="text-sm text-blue-500 hover:underline mt-2 inline-block">View Details</Link> */}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About this community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">{community.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created by:</span>
                      <p className="font-medium">{community.owner.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p className="font-medium">{category}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium">
                        {community.isPrivate ? "Private" : "Public"} Community
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pricing:</span>
                      <p className="font-medium">
                        {community.isFree ? "Free" : `${community.currency === "USD" ? "$" : community.currency}${community.price}/month`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({community._count.members})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>
                        {member.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {member.role === "OWNER" && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          Level {member.user.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {members.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full">
                    View all members
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members
                  .sort((a, b) => b.user.points - a.user.points)
                  .slice(0, 3)
                  .map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.user.image || ""} />
                        <AvatarFallback className="text-xs">
                          {member.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user.name}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {member.user.points}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
