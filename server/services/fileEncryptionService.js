const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { encrypt, decrypt, generateToken } = require('../utils/encryption');

// File encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const CHUNK_SIZE = 64 * 1024; // 64KB chunks for streaming

// Secure storage directory
const SECURE_STORAGE_DIR = path.join(__dirname, '../storage/kyc-documents');

// Ensure secure storage directory exists
if (!fs.existsSync(SECURE_STORAGE_DIR)) {
  fs.mkdirSync(SECURE_STORAGE_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Generate secure filename for encrypted storage
 * @param {string} originalFilename - Original filename
 * @param {string} documentType - Type of document
 * @returns {string} - Secure encrypted filename
 */
const generateSecureFilename = (originalFilename, documentType) => {
  const extension = path.extname(originalFilename);
  const timestamp = Date.now();
  const uuid = uuidv4();
  return `${documentType}_${timestamp}_${uuid}${extension}.enc`;
};

/**
 * Encrypt file using AES-256-GCM
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path for encrypted output file
 * @returns {Promise<object>} - Encryption metadata
 */
const encryptFile = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Generate encryption key and IV
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Create streams
      const inputStream = fs.createReadStream(inputPath);
      const outputStream = fs.createWriteStream(outputPath);
      
      // Write IV to the beginning of the encrypted file
      outputStream.write(iv);
      
      // Track file size and hash
      let originalSize = 0;
      const hash = crypto.createHash('sha256');
      
      inputStream.on('data', (chunk) => {
        originalSize += chunk.length;
        hash.update(chunk);
      });
      
      inputStream.on('error', (error) => {
        reject(new Error(`Input stream error: ${error.message}`));
      });
      
      outputStream.on('error', (error) => {
        reject(new Error(`Output stream error: ${error.message}`));
      });
      
      cipher.on('error', (error) => {
        reject(new Error(`Cipher error: ${error.message}`));
      });
      
      // Pipe input through cipher to output
      inputStream.pipe(cipher).pipe(outputStream);
      
      outputStream.on('finish', () => {
        try {
          // Get authentication tag
          const authTag = cipher.getAuthTag();
          
          // Append auth tag to the end of the file
          fs.appendFileSync(outputPath, authTag);
          
          const encryptionMetadata = {
            algorithm: ALGORITHM,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            originalSize: originalSize,
            encryptedSize: fs.statSync(outputPath).size,
            fileHash: hash.digest('hex'),
            timestamp: new Date().toISOString()
          };
          
          resolve(encryptionMetadata);
        } catch (error) {
          reject(new Error(`Finalization error: ${error.message}`));
        }
      });
      
    } catch (error) {
      reject(new Error(`Encryption setup error: ${error.message}`));
    }
  });
};

/**
 * Decrypt file using AES-256-GCM
 * @param {string} inputPath - Path to encrypted file
 * @param {string} outputPath - Path for decrypted output file
 * @param {object} metadata - Encryption metadata
 * @returns {Promise<boolean>} - Success status
 */
const decryptFile = async (inputPath, outputPath, metadata) => {
  return new Promise((resolve, reject) => {
    try {
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      
      // Read the encrypted file
      const encryptedData = fs.readFileSync(inputPath);
      
      // Extract IV (first 12 bytes)
      const iv = encryptedData.slice(0, IV_LENGTH);
      
      // Extract auth tag (last 16 bytes)
      const authTag = encryptedData.slice(-16);
      
      // Extract encrypted content (middle part)
      const encryptedContent = encryptedData.slice(IV_LENGTH, -16);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt content
      const decryptedContent = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final()
      ]);
      
      // Write decrypted content to output file
      fs.writeFileSync(outputPath, decryptedContent);
      
      // Verify file integrity if hash is available
      if (metadata && metadata.fileHash) {
        const hash = crypto.createHash('sha256');
        hash.update(decryptedContent);
        const calculatedHash = hash.digest('hex');
        
        if (calculatedHash !== metadata.fileHash) {
          reject(new Error('File integrity check failed'));
          return;
        }
      }
      
      resolve(true);
      
    } catch (error) {
      reject(new Error(`Decryption error: ${error.message}`));
    }
  });
};

/**
 * Store uploaded file securely with encryption
 * @param {string} tempFilePath - Path to temporary uploaded file
 * @param {string} originalFilename - Original filename
 * @param {string} documentType - Type of document
 * @param {number} userId - User ID for organization
 * @returns {Promise<object>} - Storage result with metadata
 */
const storeFileSecurely = async (tempFilePath, originalFilename, documentType, userId) => {
  try {
    // Generate secure filename
    const secureFilename = generateSecureFilename(originalFilename, documentType);
    
    // Create user-specific directory
    const userDir = path.join(SECURE_STORAGE_DIR, `user_${userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true, mode: 0o700 });
    }
    
    const encryptedFilePath = path.join(userDir, secureFilename);
    
    // Encrypt and store file
    const encryptionMetadata = await encryptFile(tempFilePath, encryptedFilePath);
    
    // Get file stats
    const stats = fs.statSync(tempFilePath);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    return {
      success: true,
      encryptedFilename: secureFilename,
      encryptedFilePath: encryptedFilePath,
      originalFilename: originalFilename,
      fileSize: stats.size,
      encryptionMetadata: encryptionMetadata,
      storedAt: new Date().toISOString()
    };
    
  } catch (error) {
    // Clean up temporary file on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    throw new Error(`File storage failed: ${error.message}`);
  }
};

/**
 * Retrieve and decrypt file for viewing/download
 * @param {string} encryptedFilename - Encrypted filename
 * @param {number} userId - User ID for security check
 * @param {object} encryptionMetadata - Encryption metadata from database
 * @returns {Promise<object>} - Decrypted file info
 */
const retrieveFileSecurely = async (encryptedFilename, userId, encryptionMetadata) => {
  try {
    const userDir = path.join(SECURE_STORAGE_DIR, `user_${userId}`);
    const encryptedFilePath = path.join(userDir, encryptedFilename);
    
    // Check if encrypted file exists
    if (!fs.existsSync(encryptedFilePath)) {
      throw new Error('Encrypted file not found');
    }
    
    // Create temporary decrypted file
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilename = `temp_${Date.now()}_${uuidv4()}`;
    const tempFilePath = path.join(tempDir, tempFilename);
    
    // Decrypt file
    await decryptFile(encryptedFilePath, tempFilePath, encryptionMetadata);
    
    return {
      success: true,
      tempFilePath: tempFilePath,
      cleanup: () => {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    };
    
  } catch (error) {
    throw new Error(`File retrieval failed: ${error.message}`);
  }
};

/**
 * Delete encrypted file securely
 * @param {string} encryptedFilename - Encrypted filename
 * @param {number} userId - User ID for security check
 * @returns {Promise<boolean>} - Success status
 */
const deleteFileSecurely = async (encryptedFilename, userId) => {
  try {
    const userDir = path.join(SECURE_STORAGE_DIR, `user_${userId}`);
    const encryptedFilePath = path.join(userDir, encryptedFilename);
    
    if (fs.existsSync(encryptedFilePath)) {
      // Secure deletion with multiple overwrites
      const fileSize = fs.statSync(encryptedFilePath).size;
      const fd = fs.openSync(encryptedFilePath, 'r+');
      
      // Overwrite with random data 3 times
      for (let i = 0; i < 3; i++) {
        const randomData = crypto.randomBytes(fileSize);
        fs.writeSync(fd, randomData, 0, fileSize, 0);
        fs.fsyncSync(fd);
      }
      
      fs.closeSync(fd);
      fs.unlinkSync(encryptedFilePath);
    }
    
    return true;
    
  } catch (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

/**
 * Get storage statistics for a user
 * @param {number} userId - User ID
 * @returns {object} - Storage statistics
 */
const getStorageStats = (userId) => {
  try {
    const userDir = path.join(SECURE_STORAGE_DIR, `user_${userId}`);
    
    if (!fs.existsSync(userDir)) {
      return {
        fileCount: 0,
        totalSize: 0,
        lastModified: null
      };
    }
    
    const files = fs.readdirSync(userDir);
    let totalSize = 0;
    let lastModified = null;
    
    files.forEach(file => {
      const filePath = path.join(userDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (!lastModified || stats.mtime > lastModified) {
        lastModified = stats.mtime;
      }
    });
    
    return {
      fileCount: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      lastModified: lastModified
    };
    
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      fileCount: 0,
      totalSize: 0,
      lastModified: null,
      error: error.message
    };
  }
};

module.exports = {
  generateSecureFilename,
  encryptFile,
  decryptFile,
  storeFileSecurely,
  retrieveFileSecurely,
  deleteFileSecurely,
  getStorageStats,
  SECURE_STORAGE_DIR
};