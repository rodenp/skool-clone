import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from './api/authApi'
import { communityApi } from './api/communityApi'
import { courseApi } from './api/courseApi'
import { userApi } from './api/userApi'
import authSlice from './slices/authSlice'
import uiSlice from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    [authApi.reducerPath]: authApi.reducer,
    [communityApi.reducerPath]: communityApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(authApi.middleware)
      .concat(communityApi.middleware)
      .concat(courseApi.middleware)
      .concat(userApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
