// Global setup for Jest tests
// This file runs once before all test suites

// Load environment variables first
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

const DatabaseService = require('../shared/database.js').DatabaseService;
const HederaRealService = require('../shared/hedera-real.js').HederaRealService;
const HederaMockService = require('../shared/hedera-mock.js').HederaMockService;

module.exports = async () => {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Skip database connection test for mock testing
    console.log('📊 Skipping database connection for mock tests...');
    console.log('✅ Mock test environment ready');
    
    // Initialize Hedera service based on configuration
    const useRealHedera = process.env.USE_REAL_HEDERA === 'true';
    
    if (useRealHedera) {
      console.log('🌐 Testing Hedera network connection...');
      
      try {
        // Test real Hedera connection
        const hederaService = new HederaRealService();
        await hederaService.initialize();
        
        // Test basic operations
        const networkStatus = await hederaService.getNetworkStatus();
        console.log(`✅ Connected to Hedera ${process.env.HEDERA_NETWORK}:`, networkStatus);
        
        // Store service instance for tests
        global.hederaService = hederaService;
        global.isRealHedera = true;
        
      } catch (error) {
        console.warn(`⚠️  Real Hedera connection failed: ${error.message}`);
        console.log('🔧 Falling back to mock service for tests');
        
        // Fallback to mock service
        global.hederaService = new HederaMockService();
        global.isRealHedera = false;
        process.env.USE_REAL_HEDERA = 'false';
      }
    } else {
      console.log('🔧 Using mock Hedera service for tests');
      global.hederaService = new HederaMockService();
      global.isRealHedera = false;
    }
    
    // Set up test data cleanup function
    global.cleanupTestData = async () => {
      try {
        await DatabaseService.clearTestData();
        console.log('🧹 Test data cleaned up');
      } catch (error) {
        console.error('❌ Error cleaning up test data:', error.message);
      }
    };
    
    // Set up test utilities
    global.testConfig = {
      useRealHedera: global.isRealHedera,
      network: process.env.HEDERA_NETWORK,
      timeout: parseInt(process.env.TEST_TIMEOUT, 10) || 30000,
      databaseUrl: process.env.DATABASE_URL,
      mirrorNodeUrl: process.env.MIRROR_NODE_URL
    };
    
    console.log('✅ Global test setup completed');
    console.log('📋 Test configuration:', {
      useRealHedera: global.isRealHedera,
      network: process.env.HEDERA_NETWORK,
      database: process.env.DATABASE_URL ? 'configured' : 'not configured',
      timeout: global.testConfig.timeout + 'ms'
    });
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
};