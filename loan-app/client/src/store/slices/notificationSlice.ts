import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  unreadCount: number;
  lastFetched: string | null;
}

const initialState: NotificationState = {
  unreadCount: 0,
  lastFetched: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    decrementUnread: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
  },
});

export const { setUnreadCount, decrementUnread, clearUnread, incrementUnread } = notificationSlice.actions;
export default notificationSlice.reducer;
