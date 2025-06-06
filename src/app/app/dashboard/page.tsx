"use client"

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react"
import StatCard from "@/components/dashboard/StatCard"; // Import the new StatCard
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  BookOpen,
  Calendar,
  Trophy,
  TrendingUp,
  Clock,
  Star,
  Plus,
  ArrowRight,
  MessageCircle,
  Heart,
  Eye,
  Users as UsersIcon,
  DollarSign,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Briefcase,
  UserPlus,
  Percent,
  ShoppingBag, // For 1-Time Sales Count
  Clock3,      // For Trials in Progress
  CheckCircle, // For Recently Activated Subs
  Zap,
  Activity,    // For Active Users
  CalendarDays, // For Monthly Active Users
  LineChart    // For Daily Activity
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data - in real app this would come from API
// We will remove or ignore parts of this as we fetch real financial data
const dashboardStats = { // This can remain for non-financial stats or be removed
  totalCommunities: 3,
  totalMembers: 248, // This might be different from "Paid Members"
  totalCourses: 5,
  totalPoints: 1420,
  level: 8,
  nextLevelPoints: 1800,
};


interface FinancialMetrics {
  totalActiveSubscriptions: number;
  numberOfPaidMembers: number;
  mrr: number;
  churnRateSimplified: number;
  churnedLast30DaysCount: number;
  // New "Other Metrics" fields
  oneTimeSalesCountLast30Days?: number;
  oneTimeSalesValueLast30Days?: number;
  trialsInProgressCount?: number;
  recentlyActivatedSubscriptionsLast30Days?: number;
  trialConversionRate?: number | null; // Can be null
}

interface AnalyticsMetrics {
  aboutPageVisitors: number | null;
  newSignupsLast30Days: number;
  newSignupsPrevious30Days: number;
  conversionRate: number | null;
  visitorDataStatus: string;
}

interface GroupActivityMetrics {
  totalMembers: number;
  activeMembersLast30Days: number | null;
  monthlyActiveMembers: number | null; // Placeholder
  dailyActivity: number | null;        // Placeholder
  dataStatus: {
    activeMembers: string;
    detailedActivity: string;
  };
  context?: string;
}

const recentActivity = [
  {
    id: "1",
    type: "comment",
    user: { name: "Sarah Chen", avatar: "", initials: "SC" },
    action: "commented on your post",
    target: "Getting Started with Web Design",
    time: "2 minutes ago",
    community: "Design Hub"
  },
  {
    id: "2",
    type: "like",
    user: { name: "Mike Johnson", avatar: "", initials: "MJ" },
    action: "liked your course",
    target: "React for Beginners",
    time: "15 minutes ago",
    community: "Tech Learning"
  },
  {
    id: "3",
    type: "join",
    user: { name: "Emma Davis", avatar: "", initials: "ED" },
    action: "joined your community",
    target: "Photography Masters",
    time: "1 hour ago",
    community: "Photography Masters"
  },
  {
    id: "4",
    type: "complete",
    user: { name: "Alex Rivera", avatar: "", initials: "AR" },
    action: "completed",
    target: "Module 3: Advanced Techniques",
    time: "2 hours ago",
    community: "Design Hub"
  }
]

const upcomingEvents = [
  {
    id: "1",
    title: "Weekly Design Review",
    community: "Design Hub",
    date: "Today at 3:00 PM",
    attendees: 12
  },
  {
    id: "2",
    title: "React Q&A Session",
    community: "Tech Learning",
    date: "Tomorrow at 10:00 AM",
    attendees: 28
  },
  {
    id: "3",
    title: "Photography Workshop",
    community: "Photography Masters",
    date: "Friday at 2:00 PM",
    attendees: 35
  }
]

const featuredCommunities = [
  {
    id: "1",
    name: "Design Hub",
    description: "A community for designers to share and learn",
    members: 156,
    image: "🎨",
    isJoined: true,
    category: "Design"
  },
  {
    id: "2",
    name: "Tech Learning",
    description: "Learn programming and technology skills",
    members: 203,
    image: "💻",
    isJoined: false,
    category: "Technology"
  },
  {
    id: "3",
    name: "Fitness Journey",
    description: "Get fit and healthy together",
    members: 89,
    image: "💪",
    isJoined: false,
    category: "Health"
  }
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(true); // Renamed for clarity
  const [financialError, setFinancialError] = useState<string | null>(null);

  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const [groupActivityMetrics, setGroupActivityMetrics] = useState<GroupActivityMetrics | null>(null);
  const [isGroupActivityLoading, setIsGroupActivityLoading] = useState(true);
  const [groupActivityError, setGroupActivityError] = useState<string | null>(null);

  const fetchFinancialMetrics = useCallback(async () => {
    setIsLoadingFinancials(true);
    setFinancialError(null);
    try {
      const response = await fetch('/api/dashboard/financials');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to view these metrics.");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch financial metrics.');
      }
      const data: FinancialMetrics = await response.json();
      setFinancialMetrics(data);
    } catch (err: any) {
      setFinancialError(err.message);
    } finally {
      setIsLoadingFinancials(false);
    }
  }, []);

  const fetchAnalyticsMetrics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const response = await fetch('/api/dashboard/analytics');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to view these metrics.");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics metrics.');
      }
      const data: AnalyticsMetrics = await response.json();
      setAnalyticsMetrics(data);
    } catch (err: any) {
      setAnalyticsError(err.message);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  const fetchGroupActivityMetrics = useCallback(async () => {
    setIsGroupActivityLoading(true);
    setGroupActivityError(null);
    try {
      // Fetch platform-wide stats by not providing communityId
      const response = await fetch('/api/dashboard/group-activity');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to view group activity metrics.");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch group activity metrics.');
      }
      const data: GroupActivityMetrics = await response.json();
      setGroupActivityMetrics(data);
    } catch (err: any) {
      setGroupActivityError(err.message);
    } finally {
      setIsGroupActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (session?.user?.role === 'ADMIN') {
      fetchFinancialMetrics();
      fetchAnalyticsMetrics();
      fetchGroupActivityMetrics();
    } else if (session?.user) {
      setIsLoadingFinancials(false);
      setIsAnalyticsLoading(false);
      setIsGroupActivityLoading(false);
    }
  }, [session, fetchFinancialMetrics, fetchAnalyticsMetrics, fetchGroupActivityMetrics]);

  const progressToNextLevel = ((dashboardStats.totalPoints % 200) / 200) * 100

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening in your communities today
          </p>
        </div>
        <Button asChild>
          <Link href="/app/communities/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Link>
        </Button>
      </div>

      {/* Financial Metrics Section - Only for Admins */}
      {/* @ts-ignore */}
      {session?.user?.role === 'ADMIN' && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">Financial Overview</h2>
          {isLoadingFinancials && <p className="text-gray-500 dark:text-gray-400">Loading financial metrics...</p>}
          {financialError && (
            <Alert variant="destructive">
              <AlertTitle>Error Loading Financials</AlertTitle>
              <AlertDescription>{financialError} <Button variant="link" size="sm" onClick={fetchFinancialMetrics}>Try again</Button></AlertDescription>
            </Alert>
          )}
          {financialMetrics && !isLoadingFinancials && !financialError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              <StatCard
                title="Active Subscriptions"
                value={financialMetrics.totalActiveSubscriptions}
                icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Paid Members"
                value={financialMetrics.numberOfPaidMembers}
                icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="MRR"
                value={`$${financialMetrics.mrr.toFixed(2)}`}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Churn Rate (30d)"
                value={`${financialMetrics.churnRateSimplified.toFixed(2)}%`}
                description="Simplified"
                icon={<TrendingDownIcon className="h-4 w-4 text-muted-foreground" />}
              />
               <StatCard
                value={financialMetrics.churnedLast30DaysCount}
                description="Last 30 days"
                icon={<UsersIcon className="h-4 w-4 text-muted-foreground opacity-70" />}
              />
              {/* Adding New "Other Metrics" StatCards here */}
              {financialMetrics.oneTimeSalesCountLast30Days !== undefined && (
                <StatCard
                  title="1-Time Sales (30d)"
                  value={financialMetrics.oneTimeSalesCountLast30Days}
                  icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                />
              )}
              {financialMetrics.oneTimeSalesValueLast30Days !== undefined && (
                <StatCard
                  title="1-Time Sales Value (30d)"
                  value={`$${financialMetrics.oneTimeSalesValueLast30Days.toFixed(2)}`}
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
              )}
              {financialMetrics.trialsInProgressCount !== undefined && (
                <StatCard
                  title="Trials in Progress"
                  value={financialMetrics.trialsInProgressCount}
                  icon={<Clock3 className="h-4 w-4 text-muted-foreground" />}
                />
              )}
              {financialMetrics.recentlyActivatedSubscriptionsLast30Days !== undefined && (
                <StatCard
                  title="Newly Active Subs (30d)"
                  value={financialMetrics.recentlyActivatedSubscriptionsLast30Days}
                  description="Proxy for trial conversions"
                  icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                />
              )}
              {financialMetrics.trialConversionRate !== undefined && ( // Also check if it's part of the API response
                <StatCard
                  title="Trial Conversion Rate"
                  value={financialMetrics.trialConversionRate !== null ? `${financialMetrics.trialConversionRate.toFixed(1)}%` : "N/A"}
                  description="Requires detailed tracking"
                  icon={<Zap className="h-4 w-4 text-muted-foreground" />}
                />
              )}
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-3">Usage Analytics Overview</h2>
          {isAnalyticsLoading && <p className="text-gray-500 dark:text-gray-400">Loading usage analytics...</p>}
          {analyticsError && (
            <Alert variant="destructive">
              <AlertTitle>Error Loading Analytics</AlertTitle>
              <AlertDescription>{analyticsError} <Button variant="link" size="sm" onClick={fetchAnalyticsMetrics}>Try again</Button></AlertDescription>
            </Alert>
          )}
          {analyticsMetrics && !isAnalyticsLoading && !analyticsError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard
                title="New Signups (Last 30d)"
                value={analyticsMetrics.newSignupsLast30Days}
                description={(() => {
                  const { newSignupsLast30Days, newSignupsPrevious30Days } = analyticsMetrics;
                  const change = newSignupsPrevious30Days > 0
                    ? ((newSignupsLast30Days - newSignupsPrevious30Days) / newSignupsPrevious30Days) * 100
                    : (newSignupsLast30Days > 0 ? 100 : 0); // Handle division by zero or if previous is zero
                  const changeText = change === 100 && newSignupsPrevious30Days === 0 && newSignupsLast30Days > 0 ? "New" : `${change.toFixed(1)}%`;
                  return `${change >= 0 ? '+' : ''}${changeText} from previous 30 days`;
                })()}
                icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="About Page Visitors"
                value={analyticsMetrics.aboutPageVisitors !== null ? analyticsMetrics.aboutPageVisitors : "N/A"}
                description={analyticsMetrics.visitorDataStatus === 'requires_analytics_integration' ? "Requires analytics integration" : "Last 7 days"}
                icon={<Eye className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Signup Conversion Rate"
                value={analyticsMetrics.conversionRate !== null ? `${analyticsMetrics.conversionRate.toFixed(1)}%` : "N/A"}
                description={analyticsMetrics.visitorDataStatus === 'requires_analytics_integration' ? "Requires analytics integration" : ""}
                icon={<Percent className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-3">Platform Activity Overview</h2>
          {isGroupActivityLoading && <p className="text-gray-500 dark:text-gray-400">Loading platform activity...</p>}
          {groupActivityError && (
            <Alert variant="destructive">
              <AlertTitle>Error Loading Platform Activity</AlertTitle>
              <AlertDescription>{groupActivityError} <Button variant="link" size="sm" onClick={fetchGroupActivityMetrics}>Try again</Button></AlertDescription>
            </Alert>
          )}
          {groupActivityMetrics && !isGroupActivityLoading && !groupActivityError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Users (Platform)"
                value={groupActivityMetrics.totalMembers}
                icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Active Users (Platform, 30d)"
                value={groupActivityMetrics.activeMembersLast30Days !== null ? groupActivityMetrics.activeMembersLast30Days : "N/A"}
                description={groupActivityMetrics.dataStatus?.activeMembers.replace(/_/g, ' ') || "Activity data"}
                icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Monthly Active Users"
                value={groupActivityMetrics.monthlyActiveMembers !== null ? groupActivityMetrics.monthlyActiveMembers : "N/A"}
                description={groupActivityMetrics.dataStatus?.detailedActivity.replace(/_/g, ' ') || "Requires advanced setup"}
                icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Daily Activity"
                value={groupActivityMetrics.dailyActivity !== null ? groupActivityMetrics.dailyActivity : "N/A"}
                description={groupActivityMetrics.dataStatus?.detailedActivity.replace(/_/g, ' ') || "Requires advanced setup"}
                icon={<LineChart className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          )}
        </>
      )}

      {/* Existing General Stats Cards - these can be kept or removed */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">General Platform Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCommunities}</div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              2 in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points & Level</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {dashboardStats.level}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={progressToNextLevel} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {dashboardStats.totalPoints}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your communities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {activity.type === "comment" && <MessageCircle className="h-3 w-3 text-blue-500" />}
                      {activity.type === "like" && <Heart className="h-3 w-3 text-red-500" />}
                      {activity.type === "join" && <Users className="h-3 w-3 text-green-500" />}
                      {activity.type === "complete" && <Trophy className="h-3 w-3 text-yellow-500" />}
                      <span className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        {activity.action}{" "}
                        <span className="font-medium">{activity.target}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.community}
                      </Badge>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/app/activity">
                  View all activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Don't miss these scheduled events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.date}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {event.community}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/app/calendar">
                  View calendar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Communities */}
      <Card>
        <CardHeader>
          <CardTitle>Discover Communities</CardTitle>
          <CardDescription>
            Find new communities that match your interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCommunities.map((community) => (
              <div
                key={community.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                    {community.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {community.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {community.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {community.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {community.members} members
                        </span>
                      </div>
                      {community.isJoined ? (
                        <Badge className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Joined
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/app/communities">
                Explore all communities
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
