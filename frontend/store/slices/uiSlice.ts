import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  notificationPanelOpen: boolean;
  unreadNotifications: number;
}

const initialState: UiState = {
  sidebarOpen: true,
  notificationPanelOpen: false,
  unreadNotifications: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleNotificationPanel(state) {
      state.notificationPanelOpen = !state.notificationPanelOpen;
    },
    setUnreadNotifications(state, action: PayloadAction<number>) {
      state.unreadNotifications = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleNotificationPanel, setUnreadNotifications } = uiSlice.actions;
export default uiSlice.reducer;
