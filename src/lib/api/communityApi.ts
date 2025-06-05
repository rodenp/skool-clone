import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Community {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  banner?: string
  isPrivate: boolean
  isFree: boolean
  price?: number
  currency: string
  memberCount: number
  owner: {
    id: string
    name?: string
    image?: string
  }
  createdAt: string
  updatedAt: string
}

interface CommunityMember {
  id: string
  userId: string
  communityId: string
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    name?: string
    username?: string
    image?: string
    points: number
    level: number
  }
}

interface Post {
  id: string
  title: string
  content: string
  image?: string
  isPinned: boolean
  isLocked: boolean
  author: {
    id: string
    name?: string
    username?: string
    image?: string
    points: number
    level: number
  }
  community: {
    id: string
    name: string
    slug: string
  }
  category?: {
    id: string
    name: string
    color?: string
  }
  _count: {
    comments: number
    reactions: number
  }
  createdAt: string
  updatedAt: string
}

interface CreateCommunityRequest {
  name: string
  slug: string
  description?: string
  isPrivate?: boolean
  isFree?: boolean
  price?: number
}

interface CreatePostRequest {
  title: string
  content: string
  image?: string
  categoryId?: string
}

export const communityApi = createApi({
  reducerPath: 'communityApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/communities',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Community', 'CommunityMember', 'Post', 'Comment'],
  endpoints: (builder) => ({
    getCommunities: builder.query<Community[], { search?: string; limit?: number }>({
      query: ({ search, limit = 20 }) => ({
        url: '',
        params: { search, limit },
      }),
      providesTags: ['Community'],
    }),
    getCommunity: builder.query<Community, string>({
      query: (slug) => `/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Community', id: slug }],
    }),
    createCommunity: builder.mutation<Community, CreateCommunityRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Community'],
    }),
    updateCommunity: builder.mutation<Community, { slug: string; data: Partial<CreateCommunityRequest> }>({
      query: ({ slug, data }) => ({
        url: `/${slug}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Community', id: slug }],
    }),
    deleteCommunity: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/${slug}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Community'],
    }),
    getCommunityMembers: builder.query<CommunityMember[], { slug: string; limit?: number }>({
      query: ({ slug, limit = 50 }) => ({
        url: `/${slug}/members`,
        params: { limit },
      }),
      providesTags: (result, error, { slug }) => [{ type: 'CommunityMember', id: slug }],
    }),
    joinCommunity: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/${slug}/join`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, slug) => [
        { type: 'Community', id: slug },
        { type: 'CommunityMember', id: slug },
      ],
    }),
    leaveCommunity: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/${slug}/leave`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, slug) => [
        { type: 'Community', id: slug },
        { type: 'CommunityMember', id: slug },
      ],
    }),
    getCommunityPosts: builder.query<Post[], { slug: string; limit?: number; categoryId?: string }>({
      query: ({ slug, limit = 20, categoryId }) => ({
        url: `/${slug}/posts`,
        params: { limit, categoryId },
      }),
      providesTags: (result, error, { slug }) => [{ type: 'Post', id: slug }],
    }),
    createPost: builder.mutation<Post, { slug: string; data: CreatePostRequest }>({
      query: ({ slug, data }) => ({
        url: `/${slug}/posts`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Post', id: slug }],
    }),
    getPost: builder.query<Post, { slug: string; postId: string }>({
      query: ({ slug, postId }) => `/${slug}/posts/${postId}`,
      providesTags: (result, error, { postId }) => [{ type: 'Post', id: postId }],
    }),
    updatePost: builder.mutation<Post, { slug: string; postId: string; data: Partial<CreatePostRequest> }>({
      query: ({ slug, postId, data }) => ({
        url: `/${slug}/posts/${postId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { slug, postId }) => [
        { type: 'Post', id: slug },
        { type: 'Post', id: postId },
      ],
    }),
    deletePost: builder.mutation<void, { slug: string; postId: string }>({
      query: ({ slug, postId }) => ({
        url: `/${slug}/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Post', id: slug }],
    }),
    getLeaderboard: builder.query<CommunityMember[], { slug: string; limit?: number }>({
      query: ({ slug, limit = 10 }) => ({
        url: `/${slug}/leaderboard`,
        params: { limit },
      }),
      providesTags: (result, error, { slug }) => [{ type: 'CommunityMember', id: `${slug}-leaderboard` }],
    }),
  }),
})

export const {
  useGetCommunitiesQuery,
  useGetCommunityQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation,
  useDeleteCommunityMutation,
  useGetCommunityMembersQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useGetCommunityPostsQuery,
  useCreatePostMutation,
  useGetPostQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetLeaderboardQuery,
} = communityApi
