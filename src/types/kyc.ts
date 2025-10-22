// KYC Document System Type Definitions

export type KYCStatus = 'pending' | 'verified' | 'rejected' | 'expired';
export type DocumentType = 'aadhaar' | 'pan' | 'bank_statement';
export type ValidationStatus = 'pending' | 'valid' | 'invalid';

export interface KYCRecord {
  id: number;
  userId: number;
  status: KYCStatus;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: number;
  rejectionReason?: string;
  expiryDate?: Date;
  complianceScore: number;
}

export interface DocumentMetadata {
  id: number;
  kycRecordId: number;
  documentType: DocumentType;
  originalFilename: string;
  encryptedFilename: string;
  fileSize: number;
  mimeType: string;
  uploadTimestamp: Date;
  extractedData?: ExtractedDocumentData;
  validationStatus: ValidationStatus;
  validationErrors?: ValidationError[];
}

export interface ExtractedDocumentData {
  aadhaar?: {
    number: string;
    name: string;
    address: string;
    dateOfBirth?: string;
  };
  pan?: {
    number: string;
    name: string;
  };
  bankStatement?: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    statementPeriod: string;
  };
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface KYCSubmission {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: KYCStatus;
  submittedAt: Date;
  documentsCount: number;
  documents: DocumentMetadata[];
}

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  currentFile?: string;
  error?: string;
}

export interface KYCProgressIndicator {
  currentStep: number;
  totalSteps: number;
  statusMessage: string;
  estimatedTime?: string;
}

export interface FileValidationRules {
  maxSize: number; // 5MB in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

export interface DocumentUploadForm {
  documentType: DocumentType;
  file: File;
  validationRules: FileValidationRules;
}

export interface KYCUploadProps {
  userId: string;
  currentStatus: KYCStatus;
  onUploadComplete: (documentType: DocumentType) => void;
}

export interface KYCStatusProps {
  kycRecord: KYCRecord;
  documents: DocumentMetadata[];
  onReupload: (documentType: DocumentType) => void;
}

export interface AdminKYCReviewProps {
  pendingSubmissions: KYCSubmission[];
  onApprove: (submissionId: string) => void;
  onReject: (submissionId: string, reason: string) => void;
}

export interface DocumentViewer {
  documentUrl: string;
  documentType: DocumentType;
  extractedData?: ExtractedDocumentData;
  zoomLevel: number;
}

export interface AuditLogEntry {
  id: number;
  kycRecordId: number;
  actionType: string;
  performedBy?: number;
  performedByName?: string;
  actionDetails: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Upload Error Types
export enum UploadErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export interface UploadError {
  type: UploadErrorType;
  message: string;
  details?: any;
  retryable: boolean;
}

// Validation Error Codes
export const ValidationErrorCodes = {
  AADHAAR_INVALID_FORMAT: 'Aadhaar number format is invalid',
  PAN_INVALID_FORMAT: 'PAN number format is invalid',
  NAME_MISMATCH: 'Name does not match across documents',
  DOCUMENT_EXPIRED: 'Document has expired',
  OCR_EXTRACTION_FAILED: 'Could not extract text from document',
  FILE_CORRUPTED: 'Document file appears to be corrupted',
  INSUFFICIENT_QUALITY: 'Document image quality is too low for processing'
} as const;

// File validation constants
export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png']
} as const;

// Document type display names
export const DOCUMENT_TYPE_NAMES = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  bank_statement: 'Bank Statement'
} as const;

// KYC Status display information
export const KYC_STATUS_INFO = {
  pending: {
    label: 'Under Review',
    color: 'yellow',
    description: 'Your documents are being reviewed by our compliance team'
  },
  verified: {
    label: 'Verified',
    color: 'green',
    description: 'Your KYC verification is complete'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    description: 'Your KYC submission was rejected. Please resubmit with correct documents'
  },
  expired: {
    label: 'Expired',
    color: 'gray',
    description: 'Your KYC verification has expired. Please resubmit documents'
  }
} as const;