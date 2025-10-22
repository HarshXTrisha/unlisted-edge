// Jest setup file for KYC document processing tests

const path = require('path');
const fs = require('fs');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes in hex

// Create test directories
const testDirs = [
  path.join(__dirname, '../uploads/kyc'),
  path.join(__dirname, '../storage/kyc-documents'),
  path.join(__dirname, '../temp')
];

testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Global test cleanup
afterAll(async () => {
  // Clean up test files and directories
  const cleanupDirs = [
    path.join(__dirname, 'test-files'),
    path.join(__dirname, '../temp')
  ];

  cleanupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};