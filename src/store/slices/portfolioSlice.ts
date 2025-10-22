import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PortfolioItem {
  id: number;
  company_id: number;
  company_name: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
}

interface PortfolioState {
  holdings: PortfolioItem[];
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  holdings: [],
  totalValue: 0,
  totalInvestment: 0,
  totalProfitLoss: 0,
  totalProfitLossPercentage: 0,
  loading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    fetchPortfolioStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPortfolioSuccess: (state, action: PayloadAction<{
      holdings: PortfolioItem[];
      summary: {
        totalValue: number;
        totalInvestment: number;
        totalProfitLoss: number;
        totalProfitLossPercentage: number;
      };
    }>) => {
      state.loading = false;
      state.holdings = action.payload.holdings;
      state.totalValue = action.payload.summary.totalValue;
      state.totalInvestment = action.payload.summary.totalInvestment;
      state.totalProfitLoss = action.payload.summary.totalProfitLoss;
      state.totalProfitLossPercentage = action.payload.summary.totalProfitLossPercentage;
      state.error = null;
    },
    fetchPortfolioFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateHolding: (state, action: PayloadAction<Partial<PortfolioItem> & { id: number }>) => {
      const index = state.holdings.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.holdings[index] = { ...state.holdings[index], ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchPortfolioStart,
  fetchPortfolioSuccess,
  fetchPortfolioFailure,
  updateHolding,
  clearError,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;