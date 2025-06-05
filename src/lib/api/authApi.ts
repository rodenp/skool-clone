import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  name: string
  username?: string
}

interface AuthResponse {
  user: {
    id: string
    email: string
    name?: string
    username?: string
    image?: string
    bio?: string
    points: number
    level: number
  }
  token?: string
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/auth',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),
    getCurrentUser: builder.query<AuthResponse['user'], void>({
      query: () => '/me',
      providesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    updateProfile: builder.mutation<AuthResponse['user'], Partial<AuthResponse['user']>>({
      query: (updates) => ({
        url: '/profile',
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
} = authApi
