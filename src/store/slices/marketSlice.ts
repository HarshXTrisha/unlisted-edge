import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Company {
  id: number;
  symbol: string;
  name: string;
  current_price: string;
  sector: string;
  available_shares: number;
  total_shares: number;
  is_active: boolean;
}

interface MarketState {
  companies: Company[];
  selectedCompany: Company | null;
  loading: boolean;
  error: string | null;
  marketStats: {
    totalCompanies: number;
    avgPrice: number;
    sectors: number;
    totalShares: number;
  };
}

const initialState: MarketState = {
  companies: [],
  selectedCompany: null,
  loading: false,
  error: null,
  marketStats: {
    totalCompanies: 0,
    avgPrice: 0,
    sectors: 0,
    totalShares: 0,
  },
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    fetchCompaniesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCompaniesSuccess: (state, action: PayloadAction<Company[]>) => {
      state.loading = false;
      state.companies = action.payload;
      state.error = null;
    },
    fetchCompaniesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectCompany: (state, action: PayloadAction<Company>) => {
      state.selectedCompany = action.payload;
    },
    updateMarketStats: (state, action: PayloadAction<MarketState['marketStats']>) => {
      state.marketStats = action.payload;
    },
    updateCompanyPrice: (state, action: PayloadAction<{ id: number; price: string }>) => {
      const company = state.companies.find(c => c.id === action.payload.id);
      if (company) {
        company.current_price = action.payload.price;
      }
      if (state.selectedCompany?.id === action.payload.id) {
        state.selectedCompany.current_price = action.payload.price;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchCompaniesStart,
  fetchCompaniesSuccess,
  fetchCompaniesFailure,
  selectCompany,
  updateMarketStats,
  updateCompanyPrice,
  clearError,
} = marketSlice.actions;

export default marketSlice.reducer;