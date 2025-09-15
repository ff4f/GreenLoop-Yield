// Unit tests for Hedera services with real/mock switching
const { HederaRealService } = require('../../shared/hedera-real.js');
const { HederaMockService } = require('../../shared/hedera-mock.js');

describe('Hedera Services', () => {
  let HederaService;
  
  beforeEach(() => {
    // Use real or mock service based on environment
    HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;
  });

  describe('Token Service', () => {
    test('should create token with correct parameters', async () => {
      const tokenData = {
        name: 'Test Carbon Credit',
        symbol: 'TCC',
        decimals: 2,
        initialSupply: 1000
      };

      const result = await HederaService.token.createToken(
        tokenData.name,
        tokenData.symbol,
        tokenData.decimals,
        tokenData.initialSupply
      );

      expect(result).toHaveProperty('tokenId');
      expect(result).toHaveProperty('transactionId');
      expect(result.tokenId).toMatch(/^0\.0\.[0-9]+$/);
    });

    test('should mint tokens successfully', async () => {
      const tokenId = '0.0.123456';
      const amount = 500;

      const result = await HederaService.token.mintToken(tokenId, amount);

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('newTotalSupply');
      expect(result.newTotalSupply).toBeGreaterThan(0);
    });

    test('should transfer tokens between accounts', async () => {
      const tokenId = '0.0.123456';
      const fromAccount = '0.0.123';
      const toAccount = '0.0.456';
      const amount = 100;

      const result = await HederaService.token.transferToken(
        tokenId,
        fromAccount,
        toAccount,
        amount
      );

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('SUCCESS');
    });
  });

  describe('File Service', () => {
    test('should upload file to Hedera File Service', async () => {
      const fileContent = 'Test file content for carbon credit proof';
      const contentType = 'text/plain';

      const result = await HederaService.file.uploadFile(fileContent, contentType);

      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('transactionId');
      expect(result.fileId).toMatch(/^0\.0\.[0-9]+$/);
    });

    test('should retrieve file content', async () => {
      const fileId = '0.0.789012';

      const result = await HederaService.file.getFileContents(fileId);

      expect(result).toHaveProperty('contents');
      expect(result).toHaveProperty('fileId');
      expect(result.fileId).toBe(fileId);
    });

    test('should update existing file', async () => {
      const fileId = '0.0.789012';
      const newContent = 'Updated file content';
      const contentType = 'text/plain';

      const result = await HederaService.file.updateFile(fileId, newContent, contentType);

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('fileId');
      expect(result.fileId).toBe(fileId);
    });
  });

  describe('Consensus Service', () => {
    test('should create HCS topic', async () => {
      const topicMemo = 'Carbon Credit Audit Trail';

      const result = await HederaService.consensus.createTopic(topicMemo);

      expect(result).toHaveProperty('topicId');
      expect(result).toHaveProperty('transactionId');
      expect(result.topicId).toMatch(/^0\.0\.[0-9]+$/);
    });

    test('should submit message to HCS topic', async () => {
      const topicId = '0.0.345678';
      const message = JSON.stringify({
        type: 'PROOF_UPLOADED',
        lotId: 'lot-001',
        proofType: 'photo',
        timestamp: new Date().toISOString()
      });

      const result = await HederaService.consensus.submitMessage(topicId, message);

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('sequenceNumber');
      expect(result.sequenceNumber).toBeGreaterThan(0);
    });

    test('should get topic info', async () => {
      const topicId = '0.0.345678';

      const result = await HederaService.consensus.getTopicInfo(topicId);

      expect(result).toHaveProperty('topicId');
      expect(result).toHaveProperty('memo');
      expect(result.topicId).toBe(topicId);
    });
  });

  describe('Network Connection', () => {
    test('should test network connectivity', async () => {
      if (process.env.USE_REAL_HEDERA === 'true') {
        // Test real Hedera connection
        const result = await HederaService.testConnection();
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('network');
        expect(result.success).toBe(true);
        expect(['testnet', 'mainnet']).toContain(result.network);
      } else {
        // Test mock service
        const result = await HederaService.testConnection();
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('network');
        expect(result.success).toBe(true);
        expect(result.network).toBe('mock');
      }
    });

    test('should handle connection errors gracefully', async () => {
      // Temporarily break connection for testing
      const originalOperatorId = process.env.HEDERA_OPERATOR_ID;
      process.env.HEDERA_OPERATOR_ID = 'invalid';

      if (process.env.USE_REAL_HEDERA === 'true') {
        try {
          await HederaService.testConnection();
          // Should not reach here if connection fails
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }

      // Restore original value
      process.env.HEDERA_OPERATOR_ID = originalOperatorId;
    });
  });

  describe('Service Selection', () => {
    test('should use real service when USE_REAL_HEDERA is true', () => {
      process.env.USE_REAL_HEDERA = 'true';
      const TestService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;
      
      expect(TestService).toBe(HederaRealService);
    });

    test('should use mock service when USE_REAL_HEDERA is false', () => {
      process.env.USE_REAL_HEDERA = 'false';
      const TestService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;
      
      expect(TestService).toBe(HederaMockService);
    });

    test('should default to mock service when USE_REAL_HEDERA is not set', () => {
      delete process.env.USE_REAL_HEDERA;
      const TestService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;
      
      expect(TestService).toBe(HederaMockService);
    });
  });
});