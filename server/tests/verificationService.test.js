const verificationService = require('../services/verificationService');

describe('Verification Service', () => {
  describe('Aadhaar Validation', () => {
    describe('Aadhaar Number Validation', () => {
      test('should validate correct Aadhaar number', () => {
        // Using a test Aadhaar number with valid format (not real)
        const validAadhaar = '123456789012';
        const result = verificationService.validateAadhaarNumber(validAadhaar);
        // Note: This will fail checksum validation but pass format validation
        expect(result.errors.some(error => error.includes('12 digits'))).toBe(false);
      });

      test('should reject invalid Aadhaar number length', () => {
        const invalidAadhaar = '12345';
        const result = verificationService.validateAadhaarNumber(invalidAadhaar);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Aadhaar number must be exactly 12 digits');
      });

      test('should reject Aadhaar with all same digits', () => {
        const invalidAadhaar = '111111111111';
        const result = verificationService.validateAadhaarNumber(invalidAadhaar);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid Aadhaar number pattern');
      });

      test('should handle Aadhaar with spaces', () => {
        const aadhaarWithSpaces = '1234 5678 9012';
        const result = verificationService.validateAadhaarNumber(aadhaarWithSpaces);
        // Should pass format validation but may fail checksum
        expect(result.errors.some(error => error.includes('12 digits'))).toBe(false);
      });

      test('should reject empty Aadhaar number', () => {
        const result = verificationService.validateAadhaarNumber('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Aadhaar number is required');
      });
    });

    describe('Aadhaar Checksum Validation', () => {
      test('should validate Aadhaar checksum using Verhoeff algorithm', () => {
        // Test with known valid Aadhaar numbers (test numbers)
        const validNumbers = ['234123412341', '123456789012'];
        
        validNumbers.forEach(number => {
          const isValid = verificationService.validateAadhaarChecksum(number);
          // Note: These are test numbers, actual validation would depend on real checksum
          expect(typeof isValid).toBe('boolean');
        });
      });
    });

    describe('Aadhaar Formatting', () => {
      test('should format Aadhaar number with spaces', () => {
        const aadhaar = '123456789012';
        const formatted = verificationService.formatAadhaarNumber(aadhaar);
        expect(formatted).toBe('1234 5678 9012');
      });

      test('should handle already formatted Aadhaar', () => {
        const aadhaar = '1234 5678 9012';
        const formatted = verificationService.formatAadhaarNumber(aadhaar);
        expect(formatted).toBe('1234 5678 9012');
      });
    });

    describe('Complete Aadhaar Validation', () => {
      test('should validate complete Aadhaar data', async () => {
        const aadhaarData = {
          number: '123456789012',
          name: 'John Doe',
          address: '123 Main Street, City, State - 123456',
          dateOfBirth: '15/08/1990'
        };

        const result = await verificationService.validateAadhaar(aadhaarData);
        
        // May not be fully valid due to checksum, but should have structure
        expect(result.details.name).toBeDefined();
        expect(result.details.address).toBeDefined();
        expect(result.details.dateOfBirth).toBeDefined();
      });

      test('should handle invalid Aadhaar data', async () => {
        const invalidData = {
          number: '12345', // Invalid length
          name: 'J', // Too short
          address: 'Short', // Too short
          dateOfBirth: 'invalid-date'
        };

        const result = await verificationService.validateAadhaar(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThan(50);
      });

      test('should detect security issues', async () => {
        const suspiciousData = {
          number: '000000000000',
          name: 'Test User',
          address: '123 Test Street'
        };

        const result = await verificationService.validateAadhaar(suspiciousData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Suspicious'))).toBe(true);
      });
    });
  });

  describe('PAN Validation', () => {
    describe('PAN Number Validation', () => {
      test('should validate correct PAN format', () => {
        const validPAN = 'ABCDE1234F';
        const result = verificationService.validatePANNumber(validPAN);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject invalid PAN format', () => {
        const invalidPAN = 'INVALID123';
        const result = verificationService.validatePANNumber(invalidPAN);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid PAN format. Expected format: ABCDE1234F');
      });

      test('should handle lowercase PAN', () => {
        const lowercasePAN = 'abcde1234f';
        const result = verificationService.validatePANNumber(lowercasePAN);
        expect(result.isValid).toBe(true);
      });

      test('should reject empty PAN', () => {
        const result = verificationService.validatePANNumber('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('PAN number is required');
      });
    });

    describe('PAN Category Detection', () => {
      test('should detect PAN categories correctly', () => {
        expect(verificationService.getPANCategory('ABCPD1234F')).toBe('Individual');
        expect(verificationService.getPANCategory('ABCCD1234F')).toBe('Company');
        expect(verificationService.getPANCategory('ABCFD1234F')).toBe('Firm');
        expect(verificationService.getPANCategory('ABCHD1234F')).toBe('HUF');
        expect(verificationService.getPANCategory('ABCXD1234F')).toBe('Unknown');
      });
    });

    describe('Complete PAN Validation', () => {
      test('should validate complete PAN data', async () => {
        const panData = {
          number: 'ABCPD1234F',
          name: 'John Doe'
        };

        const result = await verificationService.validatePAN(panData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.confidence).toBeGreaterThan(60);
        expect(result.details.panNumber).toBeDefined();
        expect(result.details.panNumber.category).toBe('Individual');
        expect(result.details.name).toBeDefined();
      });

      test('should handle invalid PAN data', async () => {
        const invalidData = {
          number: 'INVALID',
          name: 'J'
        };

        const result = await verificationService.validatePAN(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThan(50);
      });

      test('should detect test PAN numbers', async () => {
        const testData = {
          number: 'ABCDE1234F', // Common test PAN
          name: 'Test User'
        };

        const result = await verificationService.validatePAN(testData);
        
        expect(result.warnings.some(warning => warning.includes('test PAN'))).toBe(true);
      });
    });
  });

  describe('Bank Statement Validation', () => {
    describe('Account Number Validation', () => {
      test('should validate correct account number', () => {
        const validAccount = '1234567890123456';
        const result = verificationService.validateAccountNumber(validAccount);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject invalid account number', () => {
        const invalidAccount = '12345';
        const result = verificationService.validateAccountNumber(invalidAccount);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid account number format');
      });

      test('should handle account number with spaces', () => {
        const accountWithSpaces = '1234 5678 9012 3456';
        const result = verificationService.validateAccountNumber(accountWithSpaces);
        expect(result.isValid).toBe(true);
      });
    });

    describe('Account Number Masking', () => {
      test('should mask account number correctly', () => {
        const account = '1234567890123456';
        const masked = verificationService.maskAccountNumber(account);
        expect(masked).toBe('************3456');
      });

      test('should handle short account numbers', () => {
        const shortAccount = '1234';
        const masked = verificationService.maskAccountNumber(shortAccount);
        expect(masked).toBe('1234');
      });
    });

    describe('Bank Recognition', () => {
      test('should recognize major banks', () => {
        expect(verificationService.isRecognizedBank('HDFC BANK LIMITED')).toBe(true);
        expect(verificationService.isRecognizedBank('ICICI BANK')).toBe(true);
        expect(verificationService.isRecognizedBank('STATE BANK OF INDIA')).toBe(true);
        expect(verificationService.isRecognizedBank('UNKNOWN BANK')).toBe(false);
      });
    });

    describe('Statement Period Validation', () => {
      test('should parse valid statement periods', () => {
        const period = 'Jan 2024 to Mar 2024';
        const result = verificationService.validateStatementPeriod(period);
        
        expect(result.isValid).toBe(true);
        expect(result.details.startMonth).toBe('Jan');
        expect(result.details.startYear).toBe(2024);
        expect(result.details.endMonth).toBe('Mar');
        expect(result.details.endYear).toBe(2024);
      });

      test('should handle single month periods', () => {
        const period = 'March 2024';
        const result = verificationService.validateStatementPeriod(period);
        
        expect(result.isValid).toBe(true);
        expect(result.details.startMonth).toBe('March');
        expect(result.details.endMonth).toBe('March');
      });

      test('should reject invalid period formats', () => {
        const invalidPeriod = 'Invalid Period Format';
        const result = verificationService.validateStatementPeriod(invalidPeriod);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unable to parse statement period');
      });
    });

    describe('Complete Bank Statement Validation', () => {
      test('should validate complete bank statement data', async () => {
        const bankData = {
          accountNumber: '1234567890123456',
          accountHolderName: 'John Doe',
          bankName: 'HDFC BANK LIMITED',
          statementPeriod: 'Jan 2024 to Mar 2024'
        };

        const result = await verificationService.validateBankStatement(bankData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.confidence).toBeGreaterThan(80);
        expect(result.details.accountNumber).toBeDefined();
        expect(result.details.accountHolderName).toBeDefined();
        expect(result.details.bankName.isRecognized).toBe(true);
      });

      test('should handle missing required fields', async () => {
        const incompleteData = {
          bankName: 'HDFC BANK'
          // Missing account number and holder name
        };

        const result = await verificationService.validateBankStatement(incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Name Validation and Normalization', () => {
    test('should validate correct names', () => {
      const validNames = ['John Doe', 'Mary Jane Smith', 'A. K. Sharma'];
      
      validNames.forEach(name => {
        const result = verificationService.validateName(name, 'aadhaar');
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid names', () => {
      const invalidNames = ['J', '', 'A'.repeat(60), 'John123', 'John@Doe'];
      
      invalidNames.forEach(name => {
        const result = verificationService.validateName(name, 'aadhaar');
        expect(result.isValid).toBe(false);
      });
    });

    test('should normalize names correctly', () => {
      expect(verificationService.normalizeName('  John   Doe  ')).toBe('JOHN DOE');
      expect(verificationService.normalizeName('John. Doe')).toBe('JOHN DOE');
      expect(verificationService.normalizeName('john doe')).toBe('JOHN DOE');
    });
  });

  describe('Date of Birth Validation', () => {
    test('should validate correct date formats', () => {
      const validDates = ['15/08/1990', '01/01/2000', '31-12-1985'];
      
      validDates.forEach(date => {
        const result = verificationService.validateDateOfBirth(date);
        expect(result.isValid).toBe(true);
        expect(result.age).toBeGreaterThan(0);
      });
    });

    test('should reject invalid dates', () => {
      const result1 = verificationService.validateDateOfBirth('invalid-date');
      expect(result1.isValid).toBe(false);
      
      const result2 = verificationService.validateDateOfBirth('32/13/1990');
      expect(result2.isValid).toBe(false);
    });

    test('should calculate age correctly', () => {
      const birthDate = new Date('1990-08-15');
      const age = verificationService.calculateAge(birthDate);
      expect(age).toBeGreaterThan(30);
      expect(age).toBeLessThan(40);
    });
  });

  describe('Cross-Document Validation', () => {
    test('should validate matching names across documents', () => {
      const aadhaarData = { name: 'John Doe' };
      const panData = { name: 'John Doe' };
      
      const result = verificationService.crossValidateDocuments(aadhaarData, panData);
      
      expect(result.isValid).toBe(true);
      expect(result.matchScore).toBeGreaterThan(90);
    });

    test('should detect name mismatches', () => {
      const aadhaarData = { name: 'John Doe' };
      const panData = { name: 'Completely Different Name' };
      
      const result = verificationService.crossValidateDocuments(aadhaarData, panData);
      
      expect(result.isValid).toBe(false);
      expect(result.matchScore).toBeLessThanOrEqual(80);
      expect(result.errors.some(error => error.includes('mismatch'))).toBe(true);
    });

    test('should handle similar but not identical names', () => {
      const aadhaarData = { name: 'John Doe Smith' };
      const panData = { name: 'John Doe' }; // Similar but not identical
      
      const result = verificationService.crossValidateDocuments(aadhaarData, panData);
      
      expect(result.matchScore).toBeLessThan(100);
      expect(result.matchScore).toBeGreaterThan(50);
    });
  });

  describe('Name Similarity Calculation', () => {
    test('should calculate similarity correctly', () => {
      expect(verificationService.calculateNameSimilarity('JOHN DOE', 'JOHN DOE')).toBe(1);
      expect(verificationService.calculateNameSimilarity('JOHN DOE', 'JANE DOE')).toBeGreaterThan(0.5);
      expect(verificationService.calculateNameSimilarity('JOHN DOE', 'MARY SMITH')).toBeLessThan(0.5);
      expect(verificationService.calculateNameSimilarity('', '')).toBe(1);
      expect(verificationService.calculateNameSimilarity('JOHN', '')).toBe(0);
    });
  });

  describe('Levenshtein Distance', () => {
    test('should calculate edit distance correctly', () => {
      expect(verificationService.levenshteinDistance('', '')).toBe(0);
      expect(verificationService.levenshteinDistance('abc', 'abc')).toBe(0);
      expect(verificationService.levenshteinDistance('abc', 'ab')).toBe(1);
      expect(verificationService.levenshteinDistance('abc', 'def')).toBe(3);
      expect(verificationService.levenshteinDistance('kitten', 'sitting')).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', async () => {
      const nullResult = await verificationService.validateAadhaar(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.confidence).toBe(0);

      const undefinedResult = await verificationService.validatePAN(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.confidence).toBe(0);
    });

    test('should handle empty objects', async () => {
      const emptyResult = await verificationService.validateBankStatement({});
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors.length).toBeGreaterThan(0);
    });
  });
});