const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// AES Encryption Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length

// Require encryption key to be set
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY environment variable is required');
  process.exit(1);
}

// Convert hex string to Buffer for consistent key handling
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @returns {object} - Encrypted data with IV and auth tag
 */
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ALGORITHM
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param {object} encryptedData - Object containing encrypted data, IV, and auth tag
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedData) => {
  try {
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
const hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt wallet balance for storage
 * @param {number} balance - Wallet balance
 * @returns {object} - Encrypted balance
 */
const encryptWalletBalance = (balance) => {
  return encrypt(balance.toString());
};

/**
 * Decrypt wallet balance from storage
 * @param {object} encryptedBalance - Encrypted balance object
 * @returns {number} - Decrypted balance
 */
const decryptWalletBalance = (encryptedBalance) => {
  const decrypted = decrypt(encryptedBalance);
  return parseFloat(decrypted);
};

/**
 * Encrypt sensitive user data
 * @param {object} userData - User data to encrypt
 * @returns {object} - Encrypted user data
 */
const encryptUserData = (userData) => {
  const sensitiveFields = ['phone', 'wallet_balance', 'bank_details'];
  const encrypted = { ...userData };
  
  sensitiveFields.forEach(field => {
    if (userData[field] !== undefined && userData[field] !== null) {
      try {
        let valueToEncrypt;
        if (typeof userData[field] === 'object') {
          valueToEncrypt = JSON.stringify(userData[field]);
        } else {
          valueToEncrypt = userData[field].toString();
        }
        encrypted[field] = encrypt(valueToEncrypt);
      } catch (error) {
        console.error(`Failed to encrypt ${field}:`, error);
        // Keep original value on encryption failure
      }
    }
  });
  
  return encrypted;
};

/**
 * Decrypt sensitive user data
 * @param {object} encryptedUserData - Encrypted user data
 * @returns {object} - Decrypted user data
 */
const decryptUserData = (encryptedUserData) => {
  const sensitiveFields = ['phone', 'wallet_balance', 'bank_details'];
  const decrypted = { ...encryptedUserData };
  
  sensitiveFields.forEach(field => {
    if (encryptedUserData[field] && typeof encryptedUserData[field] === 'object') {
      try {
        const decryptedValue = decrypt(encryptedUserData[field]);
        
        if (field === 'wallet_balance') {
          decrypted[field] = parseFloat(decryptedValue);
        } else if (field === 'bank_details') {
          try {
            decrypted[field] = JSON.parse(decryptedValue);
          } catch (parseError) {
            // If JSON parsing fails, keep as string
            decrypted[field] = decryptedValue;
          }
        } else {
          decrypted[field] = decryptedValue;
        }
      } catch (error) {
        console.error(`Failed to decrypt ${field}:`, error);
        // Keep original value if decryption fails (backward compatibility)
      }
    }
  });
  
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  encryptWalletBalance,
  decryptWalletBalance,
  encryptUserData,
  decryptUserData,
};