// Global teardown for Jest tests
// This file runs once after all test suites complete

const { DatabaseService } = require('../shared/database.js');

module.exports = async () => {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test data - skip for mock tests
    console.log('✅ Skipping test data cleanup for mock tests');
    
    // Close Hedera service connections - skip for mock tests
    console.log('✅ Skipping Hedera service cleanup for mock tests');
    
    // Close database connections - skip for mock tests
    console.log('✅ Skipping database cleanup for mock tests');
    
    // Clean up global variables
    delete global.hederaService;
    delete global.isRealHedera;
    delete global.testConfig;
    delete global.cleanupTestData;
    
    console.log('✅ Global test teardown completed');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
};