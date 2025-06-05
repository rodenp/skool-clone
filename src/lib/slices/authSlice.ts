import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name?: string
  username?: string
  image?: string
  bio?: string
  points: number
  level: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
    },
    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    updateUserPoints: (state, action: PayloadAction<{ points: number; level?: number }>) => {
      if (state.user) {
        state.user.points = action.payload.points
        if (action.payload.level) {
          state.user.level = action.payload.level
        }
      }
    },
  },
})

export const { setUser, clearUser, setLoading, updateUserPoints } = authSlice.actions
export default authSlice.reducer
