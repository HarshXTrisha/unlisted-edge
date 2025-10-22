/**
 * Document Verification Service
 * Handles validation and verification of KYC documents
 */

const crypto = require('crypto');

class VerificationService {
  constructor() {
    // Aadhaar validation patterns and rules
    this.aadhaarPatterns = {
      number: /^\d{12}$/,
      maskedNumber: /^\d{4}\s*\*{4}\s*\d{4}$|^\*{8}\d{4}$/,
      name: /^[A-Za-z\s.]{2,50}$/,
      address: /^[A-Za-z0-9\s,.\-/]{10,200}$/,
      dateOfBirth: /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/
    };

    // PAN validation patterns
    this.panPatterns = {
      number: /^[A-Z]{5}\d{4}[A-Z]$/,
      name: /^[A-Za-z\s.]{2,50}$/
    };

    // Bank statement validation patterns
    this.bankPatterns = {
      accountNumber: /^\d{9,18}$/,
      ifscCode: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      name: /^[A-Za-z\s.]{2,50}$/
    };

    // Common validation rules
    this.commonRules = {
      minAge: 18,
      maxAge: 100,
      currentYear: new Date().getFullYear()
    };
  }

  /**
   * Validate Aadhaar document data
   * @param {object} extractedData - Data extracted from Aadhaar document
   * @returns {object} - Validation result
   */
  async validateAadhaar(extractedData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      confidence: 100,
      details: {}
    };

    try {
      // Validate Aadhaar number
      const numberValidation = this.validateAadhaarNumber(extractedData.number);
      if (!numberValidation.isValid) {
        validation.isValid = false;
        validation.errors.push(...numberValidation.errors);
        validation.confidence -= 30;
      } else {
        validation.details.aadhaarNumber = {
          isValid: true,
          formatted: this.formatAadhaarNumber(extractedData.number),
          checksum: this.validateAadhaarChecksum(extractedData.number)
        };
      }

      // Validate name
      const nameValidation = this.validateName(extractedData.name, 'aadhaar');
      if (!nameValidation.isValid) {
        validation.isValid = false;
        validation.errors.push(...nameValidation.errors);
        validation.confidence -= 20;
      } else {
        validation.details.name = {
          isValid: true,
          normalized: this.normalizeName(extractedData.name),
          length: extractedData.name?.length || 0
        };
      }

      // Validate date of birth
      if (extractedData.dateOfBirth) {
        const dobValidation = this.validateDateOfBirth(extractedData.dateOfBirth);
        if (!dobValidation.isValid) {
          validation.warnings.push(...dobValidation.errors);
          validation.confidence -= 10;
        } else {
          validation.details.dateOfBirth = {
            isValid: true,
            parsed: dobValidation.parsedDate,
            age: dobValidation.age,
            isAdult: dobValidation.age >= this.commonRules.minAge
          };
        }
      } else {
        validation.warnings.push('Date of birth not found in document');
        validation.confidence -= 5;
      }

      // Validate address
      if (extractedData.address) {
        const addressValidation = this.validateAddress(extractedData.address);
        if (!addressValidation.isValid) {
          validation.warnings.push(...addressValidation.errors);
          validation.confidence -= 5;
        } else {
          validation.details.address = {
            isValid: true,
            length: extractedData.address.length,
            hasPin: /\d{6}/.test(extractedData.address)
          };
        }
      } else {
        validation.warnings.push('Address not clearly extracted from document');
        validation.confidence -= 10;
      }

      // Additional Aadhaar-specific validations
      this.performAadhaarSecurityChecks(extractedData, validation);

    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
      validation.confidence = 0;
    }

    return validation;
  }

  /**
   * Validate Aadhaar number format and checksum
   * @param {string} aadhaarNumber - Aadhaar number to validate
   * @returns {object} - Validation result
   */
  validateAadhaarNumber(aadhaarNumber) {
    const validation = { isValid: true, errors: [] };

    if (!aadhaarNumber) {
      validation.isValid = false;
      validation.errors.push('Aadhaar number is required');
      return validation;
    }

    // Clean the number (remove spaces and special characters)
    const cleanNumber = aadhaarNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');

    // Check length
    if (cleanNumber.length !== 12) {
      validation.isValid = false;
      validation.errors.push('Aadhaar number must be exactly 12 digits');
      return validation;
    }

    // Check if all digits are the same (invalid pattern)
    if (/^(\d)\1{11}$/.test(cleanNumber)) {
      validation.isValid = false;
      validation.errors.push('Invalid Aadhaar number pattern');
      return validation;
    }

    // Validate checksum using Verhoeff algorithm
    if (!this.validateAadhaarChecksum(cleanNumber)) {
      validation.isValid = false;
      validation.errors.push('Invalid Aadhaar number checksum');
    }

    return validation;
  }

  /**
   * Validate Aadhaar checksum using Verhoeff algorithm
   * @param {string} aadhaarNumber - 12-digit Aadhaar number
   * @returns {boolean} - True if checksum is valid
   */
  validateAadhaarChecksum(aadhaarNumber) {
    // Verhoeff algorithm tables
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    let c = 0;
    const reversedNumber = aadhaarNumber.split('').reverse();

    for (let i = 0; i < reversedNumber.length; i++) {
      c = d[c][p[i % 8][parseInt(reversedNumber[i])]];
    }

    return c === 0;
  }

  /**
   * Format Aadhaar number with spaces
   * @param {string} aadhaarNumber - Raw Aadhaar number
   * @returns {string} - Formatted Aadhaar number
   */
  formatAadhaarNumber(aadhaarNumber) {
    const clean = aadhaarNumber.replace(/\s+/g, '');
    return clean.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  /**
   * Validate PAN document data
   * @param {object} extractedData - Data extracted from PAN document
   * @returns {object} - Validation result
   */
  async validatePAN(extractedData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      confidence: 100,
      details: {}
    };

    try {
      // Validate PAN number
      const panValidation = this.validatePANNumber(extractedData.number);
      if (!panValidation.isValid) {
        validation.isValid = false;
        validation.errors.push(...panValidation.errors);
        validation.confidence -= 40;
      } else {
        validation.details.panNumber = {
          isValid: true,
          formatted: extractedData.number.toUpperCase(),
          category: this.getPANCategory(extractedData.number),
          checkDigit: this.validatePANCheckDigit(extractedData.number)
        };
      }

      // Validate name
      const nameValidation = this.validateName(extractedData.name, 'pan');
      if (!nameValidation.isValid) {
        validation.isValid = false;
        validation.errors.push(...nameValidation.errors);
        validation.confidence -= 30;
      } else {
        validation.details.name = {
          isValid: true,
          normalized: this.normalizeName(extractedData.name),
          length: extractedData.name?.length || 0
        };
      }

      // Additional PAN-specific validations
      this.performPANSecurityChecks(extractedData, validation);

    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`PAN validation error: ${error.message}`);
      validation.confidence = 0;
    }

    return validation;
  }

  /**
   * Validate PAN number format
   * @param {string} panNumber - PAN number to validate
   * @returns {object} - Validation result
   */
  validatePANNumber(panNumber) {
    const validation = { isValid: true, errors: [] };

    if (!panNumber) {
      validation.isValid = false;
      validation.errors.push('PAN number is required');
      return validation;
    }

    const cleanPAN = panNumber.toUpperCase().trim();

    // Check format: ABCDE1234F
    if (!this.panPatterns.number.test(cleanPAN)) {
      validation.isValid = false;
      validation.errors.push('Invalid PAN format. Expected format: ABCDE1234F');
      return validation;
    }

    // Validate check digit (last character)
    if (!this.validatePANCheckDigit(cleanPAN)) {
      validation.isValid = false;
      validation.errors.push('Invalid PAN check digit');
    }

    return validation;
  }

  /**
   * Validate PAN check digit
   * @param {string} panNumber - PAN number
   * @returns {boolean} - True if check digit is valid
   */
  validatePANCheckDigit(panNumber) {
    // PAN check digit validation (simplified)
    // In real implementation, this would use the actual PAN algorithm
    const pattern = /^[A-Z]{5}\d{4}[A-Z]$/;
    return pattern.test(panNumber);
  }

  /**
   * Get PAN category based on 4th character
   * @param {string} panNumber - PAN number
   * @returns {string} - PAN category
   */
  getPANCategory(panNumber) {
    const categoryMap = {
      'P': 'Individual',
      'F': 'Firm',
      'C': 'Company',
      'H': 'HUF',
      'A': 'AOP',
      'T': 'Trust',
      'B': 'Body of Individuals',
      'L': 'Local Authority',
      'J': 'Artificial Juridical Person',
      'G': 'Government'
    };

    if (!panNumber || panNumber.length < 4) return 'Unknown';
    return categoryMap[panNumber[3]] || 'Unknown';
  }

  /**
   * Validate bank statement data
   * @param {object} extractedData - Data extracted from bank statement
   * @returns {object} - Validation result
   */
  async validateBankStatement(extractedData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      confidence: 100,
      details: {}
    };

    try {
      // Validate account number
      if (extractedData.accountNumber) {
        const accountValidation = this.validateAccountNumber(extractedData.accountNumber);
        if (!accountValidation.isValid) {
          validation.warnings.push(...accountValidation.errors);
          validation.confidence -= 20;
        } else {
          validation.details.accountNumber = {
            isValid: true,
            length: extractedData.accountNumber.length,
            masked: this.maskAccountNumber(extractedData.accountNumber)
          };
        }
      } else {
        validation.isValid = false;
        validation.errors.push('Account number not found');
        validation.confidence -= 40;
      }

      // Validate account holder name
      const nameValidation = this.validateName(extractedData.accountHolderName, 'bank');
      if (!nameValidation.isValid) {
        validation.isValid = false;
        validation.errors.push(...nameValidation.errors);
        validation.confidence -= 30;
      } else {
        validation.details.accountHolderName = {
          isValid: true,
          normalized: this.normalizeName(extractedData.accountHolderName)
        };
      }

      // Validate bank name
      if (extractedData.bankName) {
        validation.details.bankName = {
          isValid: true,
          normalized: extractedData.bankName.trim(),
          isRecognized: this.isRecognizedBank(extractedData.bankName)
        };
      } else {
        validation.warnings.push('Bank name not clearly identified');
        validation.confidence -= 10;
      }

      // Validate statement period
      if (extractedData.statementPeriod) {
        const periodValidation = this.validateStatementPeriod(extractedData.statementPeriod);
        if (!periodValidation.isValid) {
          validation.warnings.push(...periodValidation.errors);
          validation.confidence -= 10;
        } else {
          validation.details.statementPeriod = periodValidation.details;
        }
      }

    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Bank statement validation error: ${error.message}`);
      validation.confidence = 0;
    }

    return validation;
  }

  /**
   * Validate account number format
   * @param {string} accountNumber - Account number
   * @returns {object} - Validation result
   */
  validateAccountNumber(accountNumber) {
    const validation = { isValid: true, errors: [] };

    if (!accountNumber) {
      validation.isValid = false;
      validation.errors.push('Account number is required');
      return validation;
    }

    const cleanNumber = accountNumber.replace(/\s+/g, '');

    if (!this.bankPatterns.accountNumber.test(cleanNumber)) {
      validation.isValid = false;
      validation.errors.push('Invalid account number format');
    }

    return validation;
  }

  /**
   * Mask account number for security
   * @param {string} accountNumber - Account number
   * @returns {string} - Masked account number
   */
  maskAccountNumber(accountNumber) {
    if (accountNumber.length <= 4) return accountNumber;
    const visible = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return masked + visible;
  }

  /**
   * Check if bank is in recognized list
   * @param {string} bankName - Bank name
   * @returns {boolean} - True if recognized
   */
  isRecognizedBank(bankName) {
    const recognizedBanks = [
      'HDFC', 'ICICI', 'SBI', 'STATE BANK', 'AXIS', 'KOTAK', 'CANARA', 'UNION', 'PUNJAB',
      'INDIAN', 'BANK OF BARODA', 'CENTRAL BANK', 'SYNDICATE', 'ALLAHABAD'
    ];

    if (!bankName) return false;
    return recognizedBanks.some(bank => 
      bankName.toUpperCase().includes(bank)
    );
  }

  /**
   * Validate statement period
   * @param {string} period - Statement period string
   * @returns {object} - Validation result
   */
  validateStatementPeriod(period) {
    const validation = { isValid: true, errors: [], details: {} };

    try {
      // Parse common period formats
      const periodRegex = /(\w+)\s*(\d{4})\s*(?:to|-)?\s*(\w+)?\s*(\d{4})?/i;
      const match = period.match(periodRegex);

      if (match) {
        validation.details = {
          startMonth: match[1],
          startYear: parseInt(match[2]),
          endMonth: match[3] || match[1],
          endYear: parseInt(match[4] || match[2]),
          isRecent: this.isRecentPeriod(parseInt(match[2]))
        };
      } else {
        validation.isValid = false;
        validation.errors.push('Unable to parse statement period');
      }
    } catch (error) {
      validation.isValid = false;
      validation.errors.push('Invalid statement period format');
    }

    return validation;
  }

  /**
   * Check if period is recent (within last 6 months)
   * @param {number} year - Year from statement
   * @returns {boolean} - True if recent
   */
  isRecentPeriod(year) {
    const currentYear = new Date().getFullYear();
    return year >= currentYear - 1;
  }

  /**
   * Validate name field
   * @param {string} name - Name to validate
   * @param {string} documentType - Type of document
   * @returns {object} - Validation result
   */
  validateName(name, documentType) {
    const validation = { isValid: true, errors: [] };

    if (!name || typeof name !== 'string') {
      validation.isValid = false;
      validation.errors.push('Name is required');
      return validation;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      validation.isValid = false;
      validation.errors.push('Name is too short');
    }

    if (trimmedName.length > 50) {
      validation.isValid = false;
      validation.errors.push('Name is too long');
    }

    // Check for valid characters
    const namePattern = documentType === 'aadhaar' 
      ? /^[A-Za-z\s.]{2,50}$/ 
      : /^[A-Za-z\s.]{2,50}$/;

    if (!namePattern.test(trimmedName)) {
      validation.isValid = false;
      validation.errors.push('Name contains invalid characters');
    }

    return validation;
  }

  /**
   * Normalize name for comparison
   * @param {string} name - Name to normalize
   * @returns {string} - Normalized name
   */
  normalizeName(name) {
    if (!name) return '';
    return name.trim()
      .replace(/\s+/g, ' ')
      .toUpperCase()
      .replace(/[.]/g, '');
  }

  /**
   * Validate date of birth
   * @param {string} dob - Date of birth string
   * @returns {object} - Validation result
   */
  validateDateOfBirth(dob) {
    const validation = { isValid: true, errors: [] };

    try {
      const match = dob.match(this.aadhaarPatterns.dateOfBirth);
      if (!match) {
        validation.isValid = false;
        validation.errors.push('Invalid date format');
        return validation;
      }

      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);

      // Validate date components
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        validation.isValid = false;
        validation.errors.push('Invalid date values');
        return validation;
      }

      const date = new Date(year, month - 1, day);
      
      // Check if the date is valid (JavaScript Date object validation)
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        validation.isValid = false;
        validation.errors.push('Invalid date');
        return validation;
      }

      const age = this.calculateAge(date);

      if (age < 0 || age > this.commonRules.maxAge) {
        validation.isValid = false;
        validation.errors.push('Invalid age calculated from date of birth');
      }

      validation.parsedDate = date;
      validation.age = age;

    } catch (error) {
      validation.isValid = false;
      validation.errors.push('Error parsing date of birth');
    }

    return validation;
  }

  /**
   * Calculate age from date of birth
   * @param {Date} birthDate - Birth date
   * @returns {number} - Age in years
   */
  calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Validate address format
   * @param {string} address - Address string
   * @returns {object} - Validation result
   */
  validateAddress(address) {
    const validation = { isValid: true, errors: [] };

    if (!address || address.length < 10) {
      validation.isValid = false;
      validation.errors.push('Address is too short or missing');
    }

    if (address.length > 200) {
      validation.isValid = false;
      validation.errors.push('Address is too long');
    }

    return validation;
  }

  /**
   * Perform additional security checks for Aadhaar
   * @param {object} data - Extracted data
   * @param {object} validation - Validation object to update
   */
  performAadhaarSecurityChecks(data, validation) {
    // Check for common fraud patterns
    if (data.number && /^(0{12}|1{12}|2{12})$/.test(data.number)) {
      validation.isValid = false;
      validation.errors.push('Suspicious Aadhaar number pattern detected');
    }

    // Check for placeholder text
    if (data.name && /^(test|sample|demo|placeholder)/i.test(data.name)) {
      validation.warnings.push('Possible test/sample document detected');
      validation.confidence -= 20;
    }
  }

  /**
   * Perform additional security checks for PAN
   * @param {object} data - Extracted data
   * @param {object} validation - Validation object to update
   */
  performPANSecurityChecks(data, validation) {
    // Check for common test PAN numbers
    const testPANs = ['ABCDE1234F', 'AAAAA0000A'];
    if (data.number && testPANs.includes(data.number)) {
      validation.warnings.push('Possible test PAN number detected');
      validation.confidence -= 30;
    }
  }

  /**
   * Cross-validate data between documents
   * @param {object} aadhaarData - Aadhaar extracted data
   * @param {object} panData - PAN extracted data
   * @returns {object} - Cross-validation result
   */
  crossValidateDocuments(aadhaarData, panData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      matchScore: 100
    };

    if (aadhaarData?.name && panData?.name) {
      const aadhaarName = this.normalizeName(aadhaarData.name);
      const panName = this.normalizeName(panData.name);
      
      const similarity = this.calculateNameSimilarity(aadhaarName, panName);
      
      if (similarity < 0.8) {
        validation.warnings.push('Name mismatch between Aadhaar and PAN documents');
        validation.matchScore -= 20;
      }
      
      if (similarity < 0.5) {
        validation.isValid = false;
        validation.errors.push('Significant name mismatch between documents');
      }
    }

    return validation;
  }

  /**
   * Calculate name similarity using Levenshtein distance
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {number} - Similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 && !name2) return 1; // Both empty
    if (!name1 || !name2) return 0; // One empty
    
    const maxLength = Math.max(name1.length, name2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(name1, name2);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Create singleton instance
const verificationService = new VerificationService();

module.exports = verificationService;