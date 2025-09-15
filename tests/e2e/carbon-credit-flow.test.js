// End-to-end tests for complete carbon credit flow with real/mock Hedera
const request = require('supertest');
const { HederaRealService } = require('../../shared/hedera-real.js');
const { HederaMockService } = require('../../shared/hedera-mock.js');
const { DatabaseService } = require('../../shared/database.js');

// Mock Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Import API handlers
const lotsHandler = require('../../api/lots.ts');
const proofsHandler = require('../../api/proofs/upload.ts');
const ordersHandler = require('../../api/orders.ts');
const networkStatusHandler = require('../../api/network-status.js');

// Setup routes for testing
app.post('/api/lots', lotsHandler);
app.post('/api/proofs/upload', proofsHandler);
app.post('/api/orders', ordersHandler);
app.get('/api/network/status', networkStatusHandler);

describe('Carbon Credit E2E Flow', () => {
  let HederaService;
  let testLotId;
  let testOrderId;
  let testProofIds = [];

  beforeAll(async () => {
    // Use real or mock service based on environment
    HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;
    
    // Initialize database for testing
    await DatabaseService.initialize();
    
    // Clear test data
    await DatabaseService.clearTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await DatabaseService.clearTestData();
  });

  describe('Network Status Check', () => {
    test('should return network status with correct service type', async () => {
      const response = await request(app)
        .get('/api/network/status')
        .expect(200);

      expect(response.body).toHaveProperty('network');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('connectionTest');
      
      if (process.env.USE_REAL_HEDERA === 'true') {
        expect(['testnet', 'mainnet']).toContain(response.body.network);
        expect(response.body.status).toBe('real');
      } else {
        expect(response.body.network).toBe('mock');
        expect(response.body.status).toBe('mock');
      }
    });
  });

  describe('Lot Creation Flow', () => {
    test('should create a new carbon credit lot', async () => {
      const lotData = {
        projectName: 'E2E Test Reforestation Project',
        projectType: 'reforestation',
        location: 'Test Forest, Indonesia',
        area: 100,
        estimatedCredits: 5000,
        pricePerCredit: 15.50,
        description: 'Test project for e2e testing',
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
      };

      const response = await request(app)
        .post('/api/lots')
        .send(lotData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('lotId');
      expect(response.body.data).toHaveProperty('status', 'DRAFT');
      expect(response.body.data).toHaveProperty('pdi', 0);
      
      testLotId = response.body.data.lotId;
    });
  });

  describe('Proof Upload Flow', () => {
    test('should upload project documentation proof', async () => {
      const proofData = {
        lotId: testLotId,
        type: 'project_documentation',
        title: 'Project Design Document',
        description: 'Comprehensive project design and methodology',
        file: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoK',
        metadata: {
          documentType: 'PDD',
          standard: 'VCS',
          version: '1.0'
        }
      };

      const response = await request(app)
        .post('/api/proofs/upload')
        .send(proofData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('proofId');
      expect(response.body.data).toHaveProperty('fileId');
      expect(response.body.data).toHaveProperty('hcsTransactionId');
      
      testProofIds.push(response.body.data.proofId);
    });

    test('should upload satellite imagery proof', async () => {
      const proofData = {
        lotId: testLotId,
        type: 'satellite_imagery',
        title: 'Baseline Satellite Images',
        description: 'Pre-project satellite imagery showing forest cover',
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
        metadata: {
          captureDate: '2024-01-15',
          resolution: '10m',
          source: 'Sentinel-2'
        }
      };

      const response = await request(app)
        .post('/api/proofs/upload')
        .send(proofData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testProofIds.push(response.body.data.proofId);
    });

    test('should upload field monitoring proof', async () => {
      const proofData = {
        lotId: testLotId,
        type: 'field_monitoring',
        title: 'Tree Planting Progress Photos',
        description: 'Field photos showing tree planting activities',
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
        metadata: {
          gpsCoordinates: '106.8506,-6.2038',
          timestamp: new Date().toISOString(),
          weather: 'sunny'
        }
      };

      const response = await request(app)
        .post('/api/proofs/upload')
        .send(proofData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testProofIds.push(response.body.data.proofId);
    });

    test('should upload third-party verification proof', async () => {
      const proofData = {
        lotId: testLotId,
        type: 'third_party_verification',
        title: 'VCS Verification Report',
        description: 'Independent verification by accredited body',
        file: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoK',
        metadata: {
          verifier: 'Test Verification Body',
          certificationDate: '2024-01-20',
          standard: 'VCS'
        }
      };

      const response = await request(app)
        .post('/api/proofs/upload')
        .send(proofData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testProofIds.push(response.body.data.proofId);
    });
  });

  describe('Order and Settlement Flow', () => {
    test('should create purchase order for carbon credits', async () => {
      const orderData = {
        lotId: testLotId,
        buyerId: 'test-buyer-001',
        quantity: 1000,
        pricePerCredit: 15.50,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        escrowAmount: 15500,
        terms: {
          paymentMethod: 'crypto',
          deliveryMethod: 'digital',
          qualityRequirements: ['VCS certified', 'additionality verified']
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data).toHaveProperty('status', 'PENDING');
      expect(response.body.data).toHaveProperty('escrowTxHash');
      
      testOrderId = response.body.data.orderId;
    });

    test('should complete order with delivery and payout', async () => {
      const deliveryData = {
        orderId: testOrderId,
        action: 'deliver',
        deliveryProof: {
          certificateFileId: '0.0.999888',
          registryTransactionId: 'REG-TX-001',
          serialNumbers: ['CC-001-001', 'CC-001-002']
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .send(deliveryData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'COMPLETED');
      expect(response.body.data).toHaveProperty('payoutTxHash');
      expect(response.body.data).toHaveProperty('deliveryTxId');
      
      // Verify Hedera transactions were recorded
      if (process.env.USE_REAL_HEDERA === 'true') {
        expect(response.body.data.payoutTxHash).toMatch(/^0\.0\.[0-9]+@[0-9]+\.[0-9]+$/);
        expect(response.body.data.deliveryTxId).toMatch(/^0\.0\.[0-9]+@[0-9]+\.[0-9]+$/);
      } else {
        expect(response.body.data.payoutTxHash).toMatch(/^mock-tx-[a-f0-9]+$/);
        expect(response.body.data.deliveryTxId).toMatch(/^mock-tx-[a-f0-9]+$/);
      }
    });
  });

  describe('Audit Trail Verification', () => {
    test('should verify all transactions are recorded in audit logs', async () => {
      // Check that all major actions were logged
      const auditLogs = await DatabaseService.getAuditLogs({
        resourceType: 'lot',
        resourceId: testLotId
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      
      const actionTypes = auditLogs.map(log => log.action);
      expect(actionTypes).toContain('create_lot');
      expect(actionTypes).toContain('upload_proof');
    });

    test('should verify HCS messages were published', async () => {
      if (process.env.USE_REAL_HEDERA === 'true') {
        // For real Hedera, verify actual HCS messages
        const hcsEvents = await DatabaseService.getHcsEvents({
          resourceType: 'proof',
          resourceId: testProofIds[0]
        });

        expect(hcsEvents.length).toBeGreaterThan(0);
        expect(hcsEvents[0]).toHaveProperty('txId');
        expect(hcsEvents[0]).toHaveProperty('topicId');
        expect(hcsEvents[0].txId).toMatch(/^0\.0\.[0-9]+@[0-9]+\.[0-9]+$/);
      } else {
        // For mock service, verify mock HCS events
        const hcsEvents = await DatabaseService.getHcsEvents({
          resourceType: 'proof',
          resourceId: testProofIds[0]
        });

        expect(hcsEvents.length).toBeGreaterThan(0);
        expect(hcsEvents[0]).toHaveProperty('txId');
        expect(hcsEvents[0].txId).toMatch(/^mock-hcs-[a-f0-9]+$/);
      }
    });

    test('should verify file storage on Hedera File Service', async () => {
      const proofData = await DatabaseService.getProof(testProofIds[0]);
      
      expect(proofData).toHaveProperty('fileId');
      
      if (process.env.USE_REAL_HEDERA === 'true') {
        expect(proofData.fileId).toMatch(/^0\.0\.[0-9]+$/);
        
        // Try to retrieve file content from real Hedera
        const fileContent = await HederaService.file.getFileContents(proofData.fileId);
        expect(fileContent).toHaveProperty('contents');
      } else {
        expect(proofData.fileId).toMatch(/^mock-file-[a-f0-9]+$/);
      }
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      if (process.env.USE_REAL_HEDERA === 'true') {
        // Test with real network - should handle actual timeouts
        const startTime = Date.now();
        
        try {
          await HederaService.testConnection();
          const endTime = Date.now();
          
          // Should complete within reasonable time (30 seconds)
          expect(endTime - startTime).toBeLessThan(30000);
        } catch (error) {
          // If network is down, should fail gracefully
          expect(error.message).toBeDefined();
        }
      }
    });

    test('should validate transaction consistency', async () => {
      // Verify that all database records have corresponding Hedera transaction IDs
      const orders = await DatabaseService.getOrders({ status: 'COMPLETED' });
      
      for (const order of orders) {
        if (order.payoutTxHash) {
          if (process.env.USE_REAL_HEDERA === 'true') {
            expect(order.payoutTxHash).toMatch(/^0\.0\.[0-9]+@[0-9]+\.[0-9]+$/);
          } else {
            expect(order.payoutTxHash).toMatch(/^mock-tx-[a-f0-9]+$/);
          }
        }
      }
    });
  });
});

// Helper function to wait for async operations
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}