import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Course {
  id: string
  title: string
  description?: string
  image?: string
  price: number
  currency: string
  isPublished: boolean
  isFree: boolean
  creator: {
    id: string
    name?: string
    image?: string
  }
  community: {
    id: string
    name: string
    slug: string
  }
  modules: Module[]
  _count: {
    enrollments: number
  }
  createdAt: string
  updatedAt: string
}

interface Module {
  id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
  createdAt: string
  updatedAt: string
}

interface Lesson {
  id: string
  title: string
  description?: string
  content?: string
  videoUrl?: string
  duration?: number
  order: number
  isPublished: boolean
  isFree: boolean
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size?: number
  createdAt: string
}

interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface LessonProgress {
  id: string
  userId: string
  lessonId: string
  isCompleted: boolean
  timeSpent: number
  createdAt: string
  updatedAt: string
}

interface CreateCourseRequest {
  title: string
  description?: string
  price?: number
  isFree?: boolean
}

interface CreateModuleRequest {
  title: string
  description?: string
  order: number
}

interface CreateLessonRequest {
  title: string
  description?: string
  content?: string
  videoUrl?: string
  duration?: number
  order: number
  isFree?: boolean
}

export const courseApi = createApi({
  reducerPath: 'courseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/courses',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Course', 'Module', 'Lesson', 'Enrollment', 'Progress'],
  endpoints: (builder) => ({
    getCourses: builder.query<Course[], { communitySlug?: string; limit?: number }>({
      query: ({ communitySlug, limit = 20 }) => ({
        url: '',
        params: { communitySlug, limit },
      }),
      providesTags: ['Course'],
    }),
    getCourse: builder.query<Course, string>({
      query: (courseId) => `/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: 'Course', id: courseId }],
    }),
    createCourse: builder.mutation<Course, { communitySlug: string; data: CreateCourseRequest }>({
      query: ({ data }) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Course'],
    }),
    updateCourse: builder.mutation<Course, { courseId: string; data: Partial<CreateCourseRequest> }>({
      query: ({ courseId, data }) => ({
        url: `/${courseId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { courseId }) => [{ type: 'Course', id: courseId }],
    }),
    deleteCourse: builder.mutation<void, string>({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Course'],
    }),
    createModule: builder.mutation<Module, { courseId: string; data: CreateModuleRequest }>({
      query: ({ courseId, data }) => ({
        url: `/${courseId}/modules`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { courseId }) => [{ type: 'Course', id: courseId }],
    }),
    updateModule: builder.mutation<Module, { moduleId: string; data: Partial<CreateModuleRequest> }>({
      query: ({ moduleId, data }) => ({
        url: `/modules/${moduleId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Module'],
    }),
    deleteModule: builder.mutation<void, string>({
      query: (moduleId) => ({
        url: `/modules/${moduleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Module'],
    }),
    createLesson: builder.mutation<Lesson, { moduleId: string; data: CreateLessonRequest }>({
      query: ({ moduleId, data }) => ({
        url: `/modules/${moduleId}/lessons`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lesson'],
    }),
    updateLesson: builder.mutation<Lesson, { lessonId: string; data: Partial<CreateLessonRequest> }>({
      query: ({ lessonId, data }) => ({
        url: `/lessons/${lessonId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { lessonId }) => [{ type: 'Lesson', id: lessonId }],
    }),
    deleteLesson: builder.mutation<void, string>({
      query: (lessonId) => ({
        url: `/lessons/${lessonId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lesson'],
    }),
    enrollInCourse: builder.mutation<Enrollment, string>({
      query: (courseId) => ({
        url: `/${courseId}/enroll`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: 'Course', id: courseId },
        'Enrollment',
      ],
    }),
    getEnrollments: builder.query<Enrollment[], { userId?: string; courseId?: string }>({
      query: ({ userId, courseId }) => ({
        url: '/enrollments',
        params: { userId, courseId },
      }),
      providesTags: ['Enrollment'],
    }),
    updateLessonProgress: builder.mutation<LessonProgress, { lessonId: string; isCompleted: boolean; timeSpent?: number }>({
      query: ({ lessonId, isCompleted, timeSpent }) => ({
        url: `/lessons/${lessonId}/progress`,
        method: 'POST',
        body: { isCompleted, timeSpent },
      }),
      invalidatesTags: ['Progress'],
    }),
    getLessonProgress: builder.query<LessonProgress[], { courseId: string; userId?: string }>({
      query: ({ courseId, userId }) => ({
        url: `/${courseId}/progress`,
        params: { userId },
      }),
      providesTags: ['Progress'],
    }),
  }),
})

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useEnrollInCourseMutation,
  useGetEnrollmentsQuery,
  useUpdateLessonProgressMutation,
  useGetLessonProgressQuery,
} = courseApi
