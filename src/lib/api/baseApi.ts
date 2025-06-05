import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if needed
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: [
    'User',
    'Community',
    'CommunityMember',
    'Post',
    'Comment',
    'Course',
    'Lesson',
    'Event',
    'Notification',
    'Leaderboard',
  ],
  endpoints: () => ({}),
})
