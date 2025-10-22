const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock uuid module
jest.mock('uuid', () => ({
    v4: () => 'mock-uuid-1234-5678-9012'
}));

// Mock tesseract.js
jest.mock('tesseract.js', () => ({
    createWorker: jest.fn(() => Promise.resolve({
        recognize: jest.fn(() => Promise.resolve({
            data: {
                text: 'Mock OCR text',
                confidence: 85,
                words: [],
                lines: [],
                paragraphs: []
            }
        })),
        terminate: jest.fn()
    })),
    PSM: {
        SPARSE_TEXT: 8,
        AUTO: 3
    }
}));

// Mock sharp
jest.mock('sharp', () => {
    return jest.fn(() => ({
        resize: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        greyscale: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue()
    }));
});

const {
    validateFileSize,
    validateFileType,
    validateFileExtension,
    FILE_VALIDATION
} = require('../middleware/documentUpload');
const {
    generateSecureFilename
} = require('../services/fileEncryptionService');
const documentProcessingService = require('../services/documentProcessingService');

// Mock environment variables for testing
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

describe('Document Upload Middleware', () => {
    describe('File Validation', () => {
        test('should validate file size correctly', () => {
            expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
            expect(validateFileSize(FILE_VALIDATION.MAX_SIZE)).toBe(true); // Exactly 5MB
            expect(validateFileSize(FILE_VALIDATION.MAX_SIZE + 1)).toBe(false); // Over 5MB
        });

        test('should validate file types correctly', () => {
            expect(validateFileType('application/pdf')).toBe(true);
            expect(validateFileType('image/jpeg')).toBe(true);
            expect(validateFileType('image/png')).toBe(true);
            expect(validateFileType('text/plain')).toBe(false);
            expect(validateFileType('application/exe')).toBe(false);
        });

        test('should validate file extensions correctly', () => {
            expect(validateFileExtension('document.pdf')).toBe(true);
            expect(validateFileExtension('image.jpg')).toBe(true);
            expect(validateFileExtension('photo.jpeg')).toBe(true);
            expect(validateFileExtension('scan.png')).toBe(true);
            expect(validateFileExtension('malware.exe')).toBe(false);
            expect(validateFileExtension('script.js')).toBe(false);
        });
    });

    describe('Secure Filename Generation', () => {
        test('should generate secure filenames', () => {
            const filename1 = generateSecureFilename('aadhaar.pdf', 'aadhaar');
            const filename2 = generateSecureFilename('aadhaar.pdf', 'aadhaar');

            expect(filename1).toMatch(/^aadhaar_\d+_mock-uuid-1234-5678-9012\.pdf\.enc$/);
            expect(filename2).toMatch(/^aadhaar_\d+_mock-uuid-1234-5678-9012\.pdf\.enc$/);
            // Note: In real implementation, UUIDs would be unique, but our mock returns the same value
        });

        test('should handle different document types', () => {
            const aadhaarFile = generateSecureFilename('aadhaar.pdf', 'aadhaar');
            const panFile = generateSecureFilename('pan.jpg', 'pan');
            const bankFile = generateSecureFilename('statement.pdf', 'bank_statement');

            expect(aadhaarFile).toMatch(/^aadhaar_/);
            expect(panFile).toMatch(/^pan_/);
            expect(bankFile).toMatch(/^bank_statement_/);
        });
    });
});

describe('File Encryption Service', () => {
    test('should generate secure filenames with correct format', () => {
        const filename = generateSecureFilename('test.pdf', 'aadhaar');
        expect(filename).toMatch(/^aadhaar_\d+_mock-uuid-1234-5678-9012\.pdf\.enc$/);
    });

    test('should handle different document types in filename generation', () => {
        const aadhaarFile = generateSecureFilename('aadhaar.pdf', 'aadhaar');
        const panFile = generateSecureFilename('pan.jpg', 'pan');
        const bankFile = generateSecureFilename('statement.pdf', 'bank_statement');

        expect(aadhaarFile).toMatch(/^aadhaar_/);
        expect(panFile).toMatch(/^pan_/);
        expect(bankFile).toMatch(/^bank_statement_/);
    });
});

describe('Document Processing Service', () => {
    describe('Data Extraction', () => {
        test('should extract Aadhaar data from text', () => {
            const sampleText = `
        Government of India
        Aadhaar
        1234 5678 9012
        Name: JOHN DOE
        S/O: JANE DOE
        DOB: 15/08/1990
        Address: 123 Main Street, City, State - 123456
      `;

            const extractedData = documentProcessingService.extractAadhaarData(sampleText);

            expect(extractedData.number).toBe('123456789012');
            expect(extractedData.name).toBe('JOHN DOE');
            expect(extractedData.dateOfBirth).toBe('15/08/1990');
            expect(extractedData.address).toContain('123 Main Street');
        });

        test('should extract PAN data from text', () => {
            const sampleText = `
        INCOME TAX DEPARTMENT
        GOVT. OF INDIA
        Permanent Account Number Card
        ABCDE1234F
        JOHN DOE SMITH
      `;

            const extractedData = documentProcessingService.extractPANData(sampleText);

            expect(extractedData.number).toBe('ABCDE1234F');
            expect(extractedData.name).toContain('JOHN DOE');
        });

        test('should extract bank statement data from text', () => {
            const sampleText = `
        HDFC BANK LIMITED
        Account Statement
        Account Holder: JOHN DOE SMITH
        Account No: 1234567890123456
        Statement Period: Jan 2024 to Mar 2024
      `;

            const extractedData = documentProcessingService.extractBankStatementData(sampleText);

            expect(extractedData.accountNumber).toBe('1234567890123456');
            expect(extractedData.accountHolderName).toContain('JOHN DOE');
            expect(extractedData.bankName).toContain('HDFC BANK');
            expect(extractedData.statementPeriod).toBe('Jan 2024 to Mar 2024');
        });
    });

    describe('Data Validation', () => {
        test('should validate Aadhaar data correctly', () => {
            const validData = {
                number: '123456789012',
                name: 'John Doe',
                address: '123 Main Street, City'
            };

            const validation = documentProcessingService.validateExtractedData(validData, 'aadhaar');
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            const invalidData = {
                number: '12345', // Invalid length
                name: 'J', // Too short
                address: null
            };

            const invalidValidation = documentProcessingService.validateExtractedData(invalidData, 'aadhaar');
            expect(invalidValidation.isValid).toBe(false);
            expect(invalidValidation.errors.length).toBeGreaterThan(0);
        });

        test('should validate PAN data correctly', () => {
            const validData = {
                number: 'ABCDE1234F',
                name: 'John Doe'
            };

            const validation = documentProcessingService.validateExtractedData(validData, 'pan');
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            const invalidData = {
                number: 'INVALID123', // Invalid format
                name: null
            };

            const invalidValidation = documentProcessingService.validateExtractedData(invalidData, 'pan');
            expect(invalidValidation.isValid).toBe(false);
            expect(invalidValidation.errors.length).toBeGreaterThan(0);
        });

        test('should validate bank statement data correctly', () => {
            const validData = {
                accountNumber: '1234567890123456',
                accountHolderName: 'John Doe',
                bankName: 'HDFC Bank'
            };

            const validation = documentProcessingService.validateExtractedData(validData, 'bank_statement');
            expect(validation.isValid).toBe(true);

            const invalidData = {
                accountNumber: null,
                accountHolderName: 'J', // Too short
                bankName: null
            };

            const invalidValidation = documentProcessingService.validateExtractedData(invalidData, 'bank_statement');
            expect(invalidValidation.isValid).toBe(false);
            expect(invalidValidation.errors.length).toBeGreaterThan(0);
        });
    });

    describe('OCR Options', () => {
        test('should return appropriate OCR options for different document types', () => {
            const aadhaarOptions = documentProcessingService.getOCROptions('aadhaar');
            expect(aadhaarOptions.tessedit_char_whitelist).toBeDefined();
            expect(aadhaarOptions.tessedit_pageseg_mode).toBeDefined();

            const panOptions = documentProcessingService.getOCROptions('pan');
            expect(panOptions.tessedit_char_whitelist).toBeDefined();

            const bankOptions = documentProcessingService.getOCROptions('bank_statement');
            expect(bankOptions.tessedit_pageseg_mode).toBeDefined();

            const defaultOptions = documentProcessingService.getOCROptions('unknown');
            expect(defaultOptions.logger).toBeDefined();
        });
    });
});

describe('Integration Tests', () => {
    test('should handle complete document processing workflow', async () => {
        // This test would require actual image files and OCR processing
        // For now, we'll test the workflow structure

        const mockFilePath = '/path/to/test/document.pdf';
        const documentType = 'aadhaar';

        // Mock the OCR result since we don't have actual Tesseract in test environment
        const mockOCRResult = {
            success: true,
            text: 'Government of India Aadhaar 1234 5678 9012 Name: JOHN DOE S/O JANE DOE',
            confidence: 85
        };

        // Test data extraction from mock OCR text
        const extractedData = documentProcessingService.extractAadhaarData(mockOCRResult.text);
        expect(extractedData.number).toBe('123456789012');
        expect(extractedData.name).toBe('JOHN DOE');

        // Test validation
        const validation = documentProcessingService.validateExtractedData(extractedData, documentType);
        expect(validation.isValid).toBe(true);
    });
});

// Error handling tests
describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
        const invalidData = null;

        const validation = documentProcessingService.validateExtractedData(invalidData, 'aadhaar');
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should handle empty data validation', () => {
        const emptyData = {};

        const validation = documentProcessingService.validateExtractedData(emptyData, 'aadhaar');
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Aadhaar number not found');
    });
});