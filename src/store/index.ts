import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import marketSlice from './slices/marketSlice';
import portfolioSlice from './slices/portfolioSlice';
import adminSlice from './slices/adminSlice';
import simpleKycSlice from './slices/simpleKycSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    market: marketSlice,
    portfolio: portfolioSlice,
    admin: adminSlice,
    kyc: simpleKycSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;