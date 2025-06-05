import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  isSidebarOpen: boolean
  activeModal: string | null
  isNotificationsPanelOpen: boolean
  theme: 'light' | 'dark'
  searchQuery: string
  isSearchOpen: boolean
}

const initialState: UiState = {
  isSidebarOpen: true,
  activeModal: null,
  isNotificationsPanelOpen: false,
  theme: 'light',
  searchQuery: '',
  isSearchOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload
    },
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload
    },
    toggleNotificationsPanel: (state) => {
      state.isNotificationsPanelOpen = !state.isNotificationsPanelOpen
    },
    setNotificationsPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isNotificationsPanelOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveModal,
  toggleNotificationsPanel,
  setNotificationsPanelOpen,
  setTheme,
  setSearchQuery,
  setSearchOpen,
} = uiSlice.actions

export default uiSlice.reducer
