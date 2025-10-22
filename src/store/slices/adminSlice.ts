import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_role: string;
  kyc_status: string;
  is_active: boolean;
  wallet_balance: number;
  created_at: string;
}

interface AdminStats {
  users: {
    total_users: number;
    active_users: number;
    verified_investors: number;
    pending_kyc: number;
    approved_kyc: number;
  };
  trading: {
    total_trades: number;
    total_volume: number;
    active_companies: number;
    avg_trade_size: number;
  };
  orders: {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
  };
  wallets: {
    total_wallet_balance: number;
    avg_wallet_balance: number;
    funded_users: number;
  };
}

interface AdminState {
  stats: AdminStats | null;
  users: AdminUser[];
  selectedUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    total_pages: number;
    total_users: number;
    per_page: number;
  } | null;
}

const initialState: AdminState = {
  stats: null,
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    fetchStatsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStatsSuccess: (state, action: PayloadAction<AdminStats>) => {
      state.loading = false;
      state.stats = action.payload;
      state.error = null;
    },
    fetchUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<{
      users: AdminUser[];
      pagination: AdminState['pagination'];
    }>) => {
      state.loading = false;
      state.users = action.payload.users;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<AdminUser> & { id: number }>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    },
    selectUser: (state, action: PayloadAction<AdminUser>) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchStatsStart,
  fetchStatsSuccess,
  fetchUsersStart,
  fetchUsersSuccess,
  fetchFailure,
  updateUser,
  selectUser,
  clearError,
} = adminSlice.actions;

export default adminSlice.reducer;