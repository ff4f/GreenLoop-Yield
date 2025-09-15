// Jest setup file for Hedera GreenLoop Yield tests
const { DatabaseService } = require('../shared/database.js');

// Global test setup
beforeAll(async () => {
  // Set test environment variables if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  
  // Set default test database URL if not provided
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/greenloop_test';
  }
  
  // Set Hedera test configuration
  if (!process.env.HEDERA_NETWORK) {
    process.env.HEDERA_NETWORK = 'testnet';
  }
  
  // Default to mock service unless explicitly testing real Hedera
  if (!process.env.USE_REAL_HEDERA) {
    process.env.USE_REAL_HEDERA = 'false';
  }
  
  // Set test Hedera credentials (only used if USE_REAL_HEDERA=true)
  if (!process.env.HEDERA_OPERATOR_ID && process.env.USE_REAL_HEDERA === 'true') {
    console.warn('Warning: HEDERA_OPERATOR_ID not set for real Hedera testing');
  }
  
  if (!process.env.HEDERA_OPERATOR_KEY && process.env.USE_REAL_HEDERA === 'true') {
    console.warn('Warning: HEDERA_OPERATOR_KEY not set for real Hedera testing');
  }
  
  // Initialize database connection for tests
  try {
    await DatabaseService.initialize();
    console.log('✅ Database initialized for testing');
  } catch (error) {
    console.error('❌ Failed to initialize database for testing:', error.message);
    // Don't fail tests if database is not available - some tests might not need it
  }
});

// Global test teardown
afterAll(async () => {
  // Close database connections
  try {
    await DatabaseService.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate test data
  generateTestLot: () => ({
    projectName: `Test Project ${Date.now()}`,
    projectType: 'reforestation',
    location: 'Test Location',
    area: 100,
    estimatedCredits: 1000,
    pricePerCredit: 10.00,
    description: 'Test project for automated testing',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [106.8456, -6.2088],
        [106.8556, -6.2088],
        [106.8556, -6.1988],
        [106.8456, -6.1988],
        [106.8456, -6.2088]
      ]]
    }
  }),
  
  // Helper to generate test proof data
  generateTestProof: (lotId, type = 'project_documentation') => ({
    lotId,
    type,
    title: `Test ${type} proof`,
    description: `Test proof of type ${type}`,
    file: 'data:text/plain;base64,VGVzdCBmaWxlIGNvbnRlbnQ=', // "Test file content" in base64
    metadata: {
      testData: true,
      timestamp: new Date().toISOString()
    }
  }),
  
  // Helper to generate test order data
  generateTestOrder: (lotId) => ({
    lotId,
    buyerId: `test-buyer-${Date.now()}`,
    quantity: 100,
    pricePerCredit: 10.00,
    deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    escrowAmount: 1000,
    terms: {
      paymentMethod: 'crypto',
      deliveryMethod: 'digital',
      qualityRequirements: ['test certified']
    }
  }),
  
  // Helper to check if using real Hedera
  isUsingRealHedera: () => process.env.USE_REAL_HEDERA === 'true',
  
  // Helper to validate Hedera transaction ID format
  validateHederaTxId: (txId) => {
    if (process.env.USE_REAL_HEDERA === 'true') {
      return /^0\.0\.[0-9]+@[0-9]+\.[0-9]+$/.test(txId);
    } else {
      return /^mock-(tx|hcs|file)-[a-f0-9]+$/.test(txId);
    }
  },
  
  // Helper to validate Hedera entity ID format (account, file, topic, token)
  validateHederaEntityId: (entityId) => {
    if (process.env.USE_REAL_HEDERA === 'true') {
      return /^0\.0\.[0-9]+$/.test(entityId);
    } else {
      return /^mock-(account|file|topic|token)-[a-f0-9]+$/.test(entityId);
    }
  },
  
  // Helper to clean up test data
  cleanupTestData: async () => {
    try {
      await DatabaseService.clearTestData();
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error.message);
    }
  }
};

// Console logging configuration for tests
if (process.env.NODE_ENV === 'test') {
  // Reduce console noise during tests
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.log = (...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleLog(...args);
    }
  };
  
  console.warn = (...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleWarn(...args);
    }
  };
  
  console.error = (...args) => {
    // Always show errors
    originalConsoleError(...args);
  };
}

// Export for use in other test files
module.exports = {
  testUtils: global.testUtils
};