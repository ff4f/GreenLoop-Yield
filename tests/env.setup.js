// Environment setup for Jest tests
// This file runs before any tests and sets up environment variables

// Load environment variables from .env file if it exists
require('dotenv').config({ path: '.env' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';

// Database configuration for testing
if (!process.env.DATABASE_URL) {
  // Use in-memory SQLite for testing if no database URL provided
  process.env.DATABASE_URL = 'sqlite::memory:';
}

// Hedera network configuration
if (!process.env.HEDERA_NETWORK) {
  process.env.HEDERA_NETWORK = 'testnet';
}

// Default to mock service for tests unless explicitly testing real Hedera
if (!process.env.USE_REAL_HEDERA) {
  process.env.USE_REAL_HEDERA = 'false';
}

// Mirror node configuration
if (!process.env.MIRROR_NODE_URL) {
  if (process.env.HEDERA_NETWORK === 'mainnet') {
    process.env.MIRROR_NODE_URL = 'https://mainnet.mirrornode.hedera.com';
  } else {
    process.env.MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';
  }
}

// HCS topic IDs for testing
if (!process.env.HCS_AUDIT_TOPIC_ID) {
  process.env.HCS_AUDIT_TOPIC_ID = process.env.USE_REAL_HEDERA === 'true' 
    ? '0.0.123456' 
    : 'mock-topic-audit';
}

if (!process.env.HCS_PROOF_TOPIC_ID) {
  process.env.HCS_PROOF_TOPIC_ID = process.env.USE_REAL_HEDERA === 'true' 
    ? '0.0.123457' 
    : 'mock-topic-proof';
}

// API configuration
if (!process.env.API_BASE_URL) {
  process.env.API_BASE_URL = 'http://localhost:3000';
}

// Test timeout configuration
if (!process.env.TEST_TIMEOUT) {
  process.env.TEST_TIMEOUT = '30000'; // 30 seconds
}

// Logging configuration for tests
if (!process.env.LOG_LEVEL) {
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
}

// Real Hedera testing configuration
if (process.env.USE_REAL_HEDERA === 'true') {
  // Validate required environment variables for real Hedera testing
  const requiredVars = [
    'HEDERA_OPERATOR_ID',
    'HEDERA_OPERATOR_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`
⚠️  Warning: Real Hedera testing enabled but missing required environment variables:
${missingVars.map(v => `   - ${v}`).join('\n')}

Tests may fail or fall back to mock service.
To test with real Hedera, set these variables in your .env file:

HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
USE_REAL_HEDERA=true
`);
  } else {
    console.log('✅ Real Hedera testing enabled with valid credentials');
  }
} else {
  console.log('🔧 Using mock Hedera service for testing');
}

// Export configuration for use in tests
module.exports = {
  isRealHedera: process.env.USE_REAL_HEDERA === 'true',
  network: process.env.HEDERA_NETWORK,
  databaseUrl: process.env.DATABASE_URL,
  mirrorNodeUrl: process.env.MIRROR_NODE_URL,
  testTimeout: parseInt(process.env.TEST_TIMEOUT, 10)
};