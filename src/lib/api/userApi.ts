import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface User {
  id: string
  email: string
  name?: string
  username?: string
  image?: string
  bio?: string
  points: number
  level: number
  timezone: string
  createdAt: string
  updatedAt: string
}

interface Badge {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  points: number
  earnedAt?: string
}

interface Achievement {
  id: string
  name: string
  description?: string
  icon?: string
  points: number
  earnedAt?: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

interface LeaderboardEntry {
  user: {
    id: string
    name?: string
    username?: string
    image?: string
    points: number
    level: number
  }
  rank: number
  points: number
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/users',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['User', 'Badge', 'Achievement', 'Notification', 'Leaderboard'],
  endpoints: (builder) => ({
    getUser: builder.query<User, string>({
      query: (userId) => `/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    updateUser: builder.mutation<User, { userId: string; data: Partial<User> }>({
      query: ({ userId, data }) => ({
        url: `/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),
    getUserBadges: builder.query<Badge[], string>({
      query: (userId) => `/${userId}/badges`,
      providesTags: (result, error, userId) => [{ type: 'Badge', id: userId }],
    }),
    getUserAchievements: builder.query<Achievement[], string>({
      query: (userId) => `/${userId}/achievements`,
      providesTags: (result, error, userId) => [{ type: 'Achievement', id: userId }],
    }),
    getNotifications: builder.query<Notification[], { limit?: number; unreadOnly?: boolean }>({
      query: ({ limit = 20, unreadOnly = false }) => ({
        url: '/notifications',
        params: { limit, unreadOnly },
      }),
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    getGlobalLeaderboard: builder.query<LeaderboardEntry[], { limit?: number; timeframe?: 'all' | 'month' | 'week' }>({
      query: ({ limit = 10, timeframe = 'all' }) => ({
        url: '/leaderboard',
        params: { limit, timeframe },
      }),
      providesTags: ['Leaderboard'],
    }),
    searchUsers: builder.query<User[], { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => ({
        url: '/search',
        params: { q: query, limit },
      }),
    }),
    followUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/${userId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    unfollowUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/${userId}/unfollow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    getFollowers: builder.query<User[], { userId: string; limit?: number }>({
      query: ({ userId, limit = 20 }) => ({
        url: `/${userId}/followers`,
        params: { limit },
      }),
    }),
    getFollowing: builder.query<User[], { userId: string; limit?: number }>({
      query: ({ userId, limit = 20 }) => ({
        url: `/${userId}/following`,
        params: { limit },
      }),
    }),
    reportUser: builder.mutation<void, { userId: string; reason: string; description?: string }>({
      query: ({ userId, reason, description }) => ({
        url: `/${userId}/report`,
        method: 'POST',
        body: { reason, description },
      }),
    }),
    blockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/${userId}/block`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    unblockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/${userId}/unblock`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    requestDataExport: builder.mutation<void, void>({
      query: () => ({
        url: '/data-export',
        method: 'POST',
      }),
    }),
    deleteAccount: builder.mutation<void, { password: string }>({
      query: ({ password }) => ({
        url: '/delete-account',
        method: 'POST',
        body: { password },
      }),
    }),
  }),
})

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useGetUserBadgesQuery,
  useGetUserAchievementsQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useGetGlobalLeaderboardQuery,
  useSearchUsersQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useReportUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useRequestDataExportMutation,
  useDeleteAccountMutation,
} = userApi
