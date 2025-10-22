const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Document Processing Service
 * Handles OCR text extraction and document-specific processing
 */
class DocumentProcessingService {
  constructor() {
    this.tesseractWorker = null;
    this.initializeTesseract();
  }

  /**
   * Initialize Tesseract worker
   */
  async initializeTesseract() {
    try {
      this.tesseractWorker = await Tesseract.createWorker('eng');
      console.log('Tesseract OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tesseract worker:', error);
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   * @param {string} inputPath - Path to input image
   * @param {string} outputPath - Path for processed image
   * @returns {Promise<string>} - Path to processed image
   */
  async preprocessImage(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .resize(null, 1200, { 
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3 
        })
        .normalize()
        .sharpen()
        .greyscale()
        .png({ quality: 100 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      // Return original path if preprocessing fails
      return inputPath;
    }
  }

  /**
   * Extract text from document using OCR
   * @param {string} filePath - Path to document file
   * @param {string} documentType - Type of document
   * @returns {Promise<object>} - OCR result with extracted text and confidence
   */
  async extractText(filePath, documentType) {
    try {
      let processedFilePath = filePath;
      
      // Preprocess image files for better OCR
      const fileExtension = path.extname(filePath).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        const tempProcessedPath = filePath.replace(fileExtension, '_processed.png');
        processedFilePath = await this.preprocessImage(filePath, tempProcessedPath);
      }

      // Ensure worker is initialized
      if (!this.tesseractWorker) {
        await this.initializeTesseract();
      }

      // Configure OCR options based on document type
      const ocrOptions = this.getOCROptions(documentType);
      
      // Perform OCR
      const { data } = await this.tesseractWorker.recognize(processedFilePath, ocrOptions);
      
      // Clean up processed file if it was created
      if (processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
        fs.unlinkSync(processedFilePath);
      }

      return {
        success: true,
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        lines: data.lines,
        paragraphs: data.paragraphs
      };

    } catch (error) {
      console.error('OCR text extraction failed:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        confidence: 0
      };
    }
  }

  /**
   * Get OCR configuration options based on document type
   * @param {string} documentType - Type of document
   * @returns {object} - OCR options
   */
  getOCROptions(documentType) {
    const baseOptions = {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    };

    switch (documentType) {
      case 'aadhaar':
        return {
          ...baseOptions,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,/-:',
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
        };
      
      case 'pan':
        return {
          ...baseOptions,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,/-:',
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
        };
      
      case 'bank_statement':
        return {
          ...baseOptions,
          tessedit_pageseg_mode: Tesseract.PSM.AUTO
        };
      
      default:
        return baseOptions;
    }
  }

  /**
   * Process document and extract structured data
   * @param {string} filePath - Path to document file
   * @param {string} documentType - Type of document
   * @returns {Promise<object>} - Processing result with extracted data
   */
  async processDocument(filePath, documentType) {
    try {
      // Extract text using OCR
      const ocrResult = await this.extractText(filePath, documentType);
      
      if (!ocrResult.success) {
        return {
          success: false,
          error: 'OCR text extraction failed',
          details: ocrResult.error
        };
      }

      // Extract structured data based on document type
      const extractedData = await this.extractStructuredData(ocrResult.text, documentType);
      
      // Validate extracted data
      const validationResult = this.validateExtractedData(extractedData, documentType);

      return {
        success: true,
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        extractedData: extractedData,
        validation: validationResult,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Document processing failed:', error);
      return {
        success: false,
        error: 'Document processing failed',
        details: error.message
      };
    }
  }

  /**
   * Extract structured data from OCR text based on document type
   * @param {string} text - OCR extracted text
   * @param {string} documentType - Type of document
   * @returns {Promise<object>} - Structured data
   */
  async extractStructuredData(text, documentType) {
    switch (documentType) {
      case 'aadhaar':
        return this.extractAadhaarData(text);
      case 'pan':
        return this.extractPANData(text);
      case 'bank_statement':
        return this.extractBankStatementData(text);
      default:
        return {};
    }
  }

  /**
   * Extract Aadhaar card data from OCR text
   * @param {string} text - OCR text
   * @returns {object} - Extracted Aadhaar data
   */
  extractAadhaarData(text) {
    const data = {
      number: null,
      name: null,
      address: null,
      dateOfBirth: null
    };

    try {
      // Extract Aadhaar number (12 digits, may have spaces)
      const aadhaarRegex = /\b\d{4}\s*\d{4}\s*\d{4}\b/g;
      const aadhaarMatches = text.match(aadhaarRegex);
      if (aadhaarMatches && aadhaarMatches.length > 0) {
        data.number = aadhaarMatches[0].replace(/\s/g, '');
      }

      // Extract name (usually appears after "Name" or before "S/O", "D/O", "W/O")
      const nameRegex = /(?:Name[:\s]*|^)([A-Z][A-Za-z\s]{2,30})(?:\s*(?:S\/O|D\/O|W\/O|DOB|Date))/i;
      const nameMatch = text.match(nameRegex);
      if (nameMatch && nameMatch[1]) {
        data.name = nameMatch[1].trim();
      }

      // Extract date of birth
      const dobRegex = /(?:DOB|Date of Birth|Birth)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i;
      const dobMatch = text.match(dobRegex);
      if (dobMatch && dobMatch[1]) {
        data.dateOfBirth = dobMatch[1];
      }

      // Extract address (usually the longest text block)
      const lines = text.split('\n').filter(line => line.trim().length > 10);
      if (lines.length > 0) {
        // Find the longest line as potential address
        const addressLine = lines.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
        if (addressLine.length > 20) {
          data.address = addressLine.trim();
        }
      }

    } catch (error) {
      console.error('Aadhaar data extraction error:', error);
    }

    return data;
  }

  /**
   * Extract PAN card data from OCR text
   * @param {string} text - OCR text
   * @returns {object} - Extracted PAN data
   */
  extractPANData(text) {
    const data = {
      number: null,
      name: null
    };

    try {
      // Extract PAN number (format: ABCDE1234F)
      const panRegex = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
      const panMatches = text.match(panRegex);
      if (panMatches && panMatches.length > 0) {
        data.number = panMatches[0];
      }

      // Extract name (usually appears prominently on PAN card)
      const nameRegex = /([A-Z][A-Z\s]{5,40})/g;
      const nameMatches = text.match(nameRegex);
      if (nameMatches && nameMatches.length > 0) {
        // Filter out common PAN card text
        const filteredNames = nameMatches.filter(name => 
          !name.includes('INCOME TAX') && 
          !name.includes('GOVERNMENT') && 
          !name.includes('INDIA') &&
          !name.includes('PERMANENT') &&
          name.length > 5 && name.length < 40
        );
        if (filteredNames.length > 0) {
          data.name = filteredNames[0].trim();
        }
      }

    } catch (error) {
      console.error('PAN data extraction error:', error);
    }

    return data;
  }

  /**
   * Extract bank statement data from OCR text
   * @param {string} text - OCR text
   * @returns {object} - Extracted bank statement data
   */
  extractBankStatementData(text) {
    const data = {
      accountHolderName: null,
      accountNumber: null,
      bankName: null,
      statementPeriod: null
    };

    try {
      // Extract account number (various formats)
      const accountRegex = /(?:Account No|A\/C No|Account Number)[:\s]*(\d{9,18})/i;
      const accountMatch = text.match(accountRegex);
      if (accountMatch && accountMatch[1]) {
        data.accountNumber = accountMatch[1];
      }

      // Extract account holder name
      const nameRegex = /(?:Account Holder|Name)[:\s]*([A-Z][A-Za-z\s]{5,40})/i;
      const nameMatch = text.match(nameRegex);
      if (nameMatch && nameMatch[1]) {
        data.accountHolderName = nameMatch[1].trim();
      }

      // Extract bank name (usually at the top)
      const bankRegex = /(BANK|HDFC|ICICI|SBI|AXIS|KOTAK|CANARA|UNION|PUNJAB|INDIAN)/i;
      const bankMatch = text.match(bankRegex);
      if (bankMatch) {
        const lines = text.split('\n').slice(0, 5); // Check first 5 lines
        for (const line of lines) {
          if (line.toLowerCase().includes('bank')) {
            data.bankName = line.trim();
            break;
          }
        }
      }

      // Extract statement period
      const periodRegex = /(?:Statement Period|Period)[:\s]*(\w+\s*\d{4}\s*(?:to|-)?\s*\w+\s*\d{4})/i;
      const periodMatch = text.match(periodRegex);
      if (periodMatch && periodMatch[1]) {
        data.statementPeriod = periodMatch[1];
      }

    } catch (error) {
      console.error('Bank statement data extraction error:', error);
    }

    return data;
  }

  /**
   * Validate extracted data based on document type
   * @param {object} data - Extracted data
   * @param {string} documentType - Type of document
   * @returns {object} - Validation result
   */
  validateExtractedData(data, documentType) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      switch (documentType) {
        case 'aadhaar':
          this.validateAadhaarData(data, validation);
          break;
        case 'pan':
          this.validatePANData(data, validation);
          break;
        case 'bank_statement':
          this.validateBankStatementData(data, validation);
          break;
      }
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate Aadhaar data
   * @param {object} data - Aadhaar data
   * @param {object} validation - Validation object to update
   */
  validateAadhaarData(data, validation) {
    // Validate Aadhaar number
    if (!data.number) {
      validation.errors.push('Aadhaar number not found');
      validation.isValid = false;
    } else if (!/^\d{12}$/.test(data.number)) {
      validation.errors.push('Invalid Aadhaar number format');
      validation.isValid = false;
    }

    // Validate name
    if (!data.name || data.name.length < 2) {
      validation.errors.push('Name not found or too short');
      validation.isValid = false;
    }

    // Warn if address not found
    if (!data.address) {
      validation.warnings.push('Address not clearly extracted');
    }
  }

  /**
   * Validate PAN data
   * @param {object} data - PAN data
   * @param {object} validation - Validation object to update
   */
  validatePANData(data, validation) {
    // Validate PAN number
    if (!data.number) {
      validation.errors.push('PAN number not found');
      validation.isValid = false;
    } else if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(data.number)) {
      validation.errors.push('Invalid PAN number format');
      validation.isValid = false;
    }

    // Validate name
    if (!data.name || data.name.length < 2) {
      validation.errors.push('Name not found or too short');
      validation.isValid = false;
    }
  }

  /**
   * Validate bank statement data
   * @param {object} data - Bank statement data
   * @param {object} validation - Validation object to update
   */
  validateBankStatementData(data, validation) {
    // Validate account number
    if (!data.accountNumber) {
      validation.errors.push('Account number not found');
      validation.isValid = false;
    } else if (!/^\d{9,18}$/.test(data.accountNumber)) {
      validation.warnings.push('Account number format may be incorrect');
    }

    // Validate account holder name
    if (!data.accountHolderName || data.accountHolderName.length < 2) {
      validation.errors.push('Account holder name not found');
      validation.isValid = false;
    }

    // Warn if bank name not found
    if (!data.bankName) {
      validation.warnings.push('Bank name not clearly identified');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

// Create singleton instance
const documentProcessingService = new DocumentProcessingService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down document processing service...');
  await documentProcessingService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Terminating document processing service...');
  await documentProcessingService.cleanup();
  process.exit(0);
});

module.exports = documentProcessingService;