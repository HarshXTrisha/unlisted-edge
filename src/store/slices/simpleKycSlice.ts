import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

interface KYCDocument {
  document_type: string;
  original_filename: string;
  upload_timestamp: string;
}

interface KYCStatus {
  status: 'not_started' | 'pending' | 'verified' | 'rejected';
  canTrade: boolean;
  submittedAt?: string;
  updatedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  documents: KYCDocument[];
  message: string;
}

interface KYCState {
  status: KYCStatus | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: boolean;
}

const initialState: KYCState = {
  status: null,
  isLoading: false,
  error: null,
  uploadProgress: false
};

// Async thunks
export const uploadKYCDocuments = createAsyncThunk(
  'kyc/uploadDocuments',
  async ({ files, documentTypes }: { files: FileList; documentTypes: string[] }) => {
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('documents', file);
    });
    
    formData.append('documentTypes', JSON.stringify(documentTypes));

    // Use fetch directly for file upload since api utility doesn't handle FormData
    const token = localStorage.getItem('demoToken') || btoa(JSON.stringify({ userId: 1, email: 'demo@example.com' }));
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiBaseUrl}/api/kyc/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return await response.json();
  }
);

export const fetchKYCStatus = createAsyncThunk(
  'kyc/fetchStatus',
  async () => {
    const response = await api.get('/kyc/status');
    
    if (!response.ok) {
      throw new Error('Failed to fetch KYC status');
    }
    
    return await response.json();
  }
);

const simpleKycSlice = createSlice({
  name: 'simpleKyc',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetKYC: (state) => {
      state.status = null;
      state.error = null;
      state.uploadProgress = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload documents
      .addCase(uploadKYCDocuments.pending, (state) => {
        state.uploadProgress = true;
        state.error = null;
      })
      .addCase(uploadKYCDocuments.fulfilled, (state, action) => {
        state.uploadProgress = false;
        // Refresh status after upload
      })
      .addCase(uploadKYCDocuments.rejected, (state, action) => {
        state.uploadProgress = false;
        state.error = action.error.message || 'Upload failed';
      })
      
      // Fetch status
      .addCase(fetchKYCStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKYCStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = {
          ...action.payload.data,
          documents: action.payload.data.documents || [] // Ensure documents is always an array
        };
      })
      .addCase(fetchKYCStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch KYC status';
      });
  },
});

export const { clearError, resetKYC } = simpleKycSlice.actions;
export default simpleKycSlice.reducer;