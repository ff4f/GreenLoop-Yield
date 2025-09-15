#!/usr/bin/env node
/**
 * GreenLoop Yield - Demo Data Seeding Script
 * 
 * This script seeds the database with comprehensive demo data for
 * Hedera Hackathon Africa 2024 presentation.
 * 
 * Usage:
 *   npm run seed:demo
 *   node scripts/seed.ts
 *   node scripts/seed.ts --clear --verbose
 */

import { db } from '../shared/database.js';
import { 
  projects, 
  carbonLots, 
  orders, 
  proofs, 
  claims, 
  analytics, 
  auditLog,
  investorPools,
  investorAccounts,
  investorFlows,
  payoutSplits
} from '../shared/schema.js';
import { 
  LotStatus, 
  OrderStatus, 
  ClaimStatus, 
  ProjectType, 
  ProofType, 
  UserRole, 
  MOCK_IDS 
} from '../shared/schema.js';
import { randomUUID } from 'crypto';

// Command line arguments
const args = process.argv.slice(2);
const CLEAR_DATA = args.includes('--clear');
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const DEMO_MODE = args.includes('--demo') || true;

// Demo data constants
const DEMO_USERS = {
  DEVELOPER: 'dev-001',
  BUYER: 'buyer-001',
  AUDITOR: 'auditor-001',
  ADMIN: 'admin-001'
};

const DEMO_PROJECTS = [
  {
    id: 'proj-001',
    projectName: 'Kenyan Agroforestry Initiative',
    location: 'Nakuru County, Kenya',
    type: ProjectType.AGROFORESTRY,
    area: '500.00',
    rate: '8.5',
    bufferPercent: '20.0',
    forwardPercent: '30.0',
    pricePerTon: '12.50',
    totalTons: '4250.00',
    developerId: DEMO_USERS.DEVELOPER,
    uploads: []
  },
  {
    id: 'proj-002',
    projectName: 'Nigerian Cookstove Program',
    location: 'Lagos State, Nigeria',
    type: ProjectType.COOKSTOVE,
    units: 1000,
    rate: '2.1',
    bufferPercent: '15.0',
    forwardPercent: '25.0',
    pricePerTon: '8.75',
    totalTons: '2100.00',
    developerId: DEMO_USERS.DEVELOPER,
    uploads: []
  }
];

const DEMO_CARBON_LOTS = [
  {
    id: 'lot-001',
    projectId: 'proj-001',
    projectName: 'Kenyan Agroforestry Initiative',
    location: 'Nakuru County, Kenya',
    type: ProjectType.AGROFORESTRY,
    area: '500.00',
    rate: '8.5',
    bufferPercent: '20.0',
    forwardPercent: '30.0',
    pricePerTon: '12.50',
    totalTons: '4250.00',
    availableTons: '3400.00',
    status: LotStatus.LISTED,
    developerId: DEMO_USERS.DEVELOPER
  },
  {
    id: 'lot-002',
    projectId: 'proj-002',
    projectName: 'Nigerian Cookstove Program',
    location: 'Lagos State, Nigeria',
    type: ProjectType.COOKSTOVE,
    units: 1000,
    rate: '2.1',
    bufferPercent: '15.0',
    forwardPercent: '25.0',
    pricePerTon: '8.75',
    totalTons: '2100.00',
    availableTons: '1785.00',
    status: LotStatus.PARTIALLY_SOLD,
    developerId: DEMO_USERS.DEVELOPER
  }
];

const DEMO_PROOFS = [
  {
    id: 'proof-001',
    projectId: 'proj-001',
    lotId: 'lot-001',
    type: ProofType.PHOTO,
    title: 'Tree Planting Evidence - Q1 2024',
    description: 'Aerial photography showing 500 hectares of newly planted indigenous trees',
    imageUrl: 'https://example.com/proof-photos/kenya-q1-2024.jpg',
    fileId: MOCK_IDS.HFS_FILES.CLAIM_PDF,
    manifestFileId: MOCK_IDS.HFS_FILES.CLAIM_JSON,
    proofHash: MOCK_IDS.PROOF_HASHES.PHOTO,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    hcsTransactionId: '0.0.123456@1234567890.123456789',
    submittedBy: DEMO_USERS.DEVELOPER,
    status: 'verified',
    metadata: {
      coordinates: { lat: -0.3031, lng: 36.0800 },
      captureDate: '2024-03-15',
      verificationScore: 95
    }
  },
  {
    id: 'proof-002',
    projectId: 'proj-001',
    lotId: 'lot-001',
    type: ProofType.NDVI,
    title: 'NDVI Analysis - Q1 2024',
    description: 'Satellite NDVI data showing vegetation growth patterns',
    imageUrl: 'https://example.com/ndvi/kenya-q1-2024.png',
    fileId: MOCK_IDS.HFS_FILES.DELIVERY_CERT,
    manifestFileId: MOCK_IDS.HFS_FILES.CLAIM_JSON,
    proofHash: MOCK_IDS.PROOF_HASHES.NDVI,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    hcsTransactionId: '0.0.123457@1234567891.123456789',
    submittedBy: DEMO_USERS.DEVELOPER,
    status: 'verified',
    metadata: {
      ndviScore: 0.78,
      analysisDate: '2024-03-20',
      satelliteSource: 'Sentinel-2'
    }
  }
];

const DEMO_ORDERS = [
  {
    id: 'order-001',
    lotId: 'lot-001',
    buyerId: DEMO_USERS.BUYER,
    tons: '25.00',
    pricePerTon: '12.50',
    subtotal: '312.50',
    platformFee: '9.38',
    retirementFee: '6.25',
    total: '328.13',
    status: OrderStatus.COMPLETED,
    escrowTxHash: MOCK_IDS.TX_HASHES.ESCROW,
    deliveryRef: MOCK_IDS.HFS_FILES.DELIVERY_CERT,
    payoutTxHash: MOCK_IDS.TX_HASHES.PAYOUT
  },
  {
    id: 'order-002',
    lotId: 'lot-002',
    buyerId: DEMO_USERS.BUYER,
    tons: '15.00',
    pricePerTon: '8.75',
    subtotal: '131.25',
    platformFee: '3.94',
    retirementFee: '2.63',
    total: '137.82',
    status: OrderStatus.ESCROW,
    escrowTxHash: MOCK_IDS.TX_HASHES.ESCROW
  }
];

const DEMO_CLAIMS = [
  {
    id: 'claim-001',
    orderId: 'order-001',
    buyerId: DEMO_USERS.BUYER,
    status: ClaimStatus.COMPLETE,
    stepData: {
      step1: { completed: true, timestamp: '2024-01-15T10:00:00Z' },
      step2: { completed: true, timestamp: '2024-01-15T10:05:00Z' },
      step3: { completed: true, timestamp: '2024-01-15T10:10:00Z' }
    },
    pdfFileId: MOCK_IDS.HFS_FILES.CLAIM_PDF,
    jsonFileId: MOCK_IDS.HFS_FILES.CLAIM_JSON,
    anchorTxHash: MOCK_IDS.TX_HASHES.DELIVERY,
    badgeTokenId: MOCK_IDS.HTS_TOKENS.NFT_BADGE
  }
];

const DEMO_ANALYTICS = [
  {
    id: 'analytics-001',
    metric: 'total_carbon_credits',
    value: '260.00',
    metadata: {
      period: 'Q1-2024',
      projects: 5,
      countries: ['Kenya', 'Nigeria', 'Ghana', 'Ethiopia', 'Tanzania']
    }
  },
  {
    id: 'analytics-002',
    metric: 'average_pdi_score',
    value: '0.846',
    metadata: {
      period: 'Q1-2024',
      total_proofs: 15,
      verification_rate: 0.95
    }
  },
  {
    id: 'analytics-003',
    metric: 'total_revenue',
    value: '3779.25',
    metadata: {
      currency: 'USD',
      period: 'Q1-2024',
      completed_orders: 8
    }
  }
];

const DEMO_AUDIT_LOGS = [
  {
    id: 'audit-001',
    userId: DEMO_USERS.DEVELOPER,
    action: 'project_created',
    entityType: 'project',
    entityId: 'proj-001',
    changes: {
      projectName: 'Kenyan Agroforestry Initiative',
      location: 'Nakuru County, Kenya',
      type: ProjectType.AGROFORESTRY
    }
  },
  {
    id: 'audit-002',
    userId: DEMO_USERS.DEVELOPER,
    action: 'proof_uploaded',
    entityType: 'proof',
    entityId: 'proof-001',
    changes: {
      type: ProofType.PHOTO,
      status: 'verified',
      pdiScore: 0.87
    }
  },
  {
    id: 'audit-003',
    userId: DEMO_USERS.BUYER,
    action: 'order_placed',
    entityType: 'order',
    entityId: 'order-001',
    changes: {
      lotId: 'lot-001',
      tons: '25.00',
      total: '328.13'
    }
  }
];

const DEMO_INVESTOR_POOLS = [
  {
    id: 'pool-001',
    tvl: '50000.00',
    totalShares: '50000.00000000',
    sharePrice: '1.000000',
    apr: '0.1200',
    totalDeposits: '50000.00',
    totalWithdrawals: '0.00',
    lastSettlementAt: new Date('2024-01-15T00:00:00Z')
  }
];

const DEMO_INVESTOR_ACCOUNTS = [
  {
    id: 'account-001',
    userId: DEMO_USERS.BUYER,
    shares: '10000.00000000',
    depositTotal: '10000.00',
    withdrawTotal: '0.00'
  }
];

const DEMO_INVESTOR_FLOWS = [
  {
    id: 'flow-001',
    userId: DEMO_USERS.BUYER,
    type: 'DEPOSIT',
    amount: '10000.00',
    sharesDelta: '10000.00000000',
    txHash: MOCK_IDS.TX_HASHES.ESCROW,
    metadata: {
      method: 'hedera_transfer',
      timestamp: '2024-01-15T10:00:00Z'
    }
  }
];

const DEMO_PAYOUT_SPLITS = [
  {
    id: 'split-001',
    orderId: 'order-001',
    developerAmount: '250.00',
    investorAmount: '62.50',
    platformFee: '15.63',
    txHash: MOCK_IDS.TX_HASHES.PAYOUT
  }
];

class DemoSeeder {
  private verbose: boolean;
  private clearData: boolean;
  private stats = {
    projects: 0,
    carbonLots: 0,
    proofs: 0,
    orders: 0,
    claims: 0,
    analytics: 0,
    auditLogs: 0,
    investorPools: 0,
    investorAccounts: 0,
    investorFlows: 0,
    payoutSplits: 0,
    errors: 0
  };

  constructor(verbose = VERBOSE, clearData = CLEAR_DATA) {
    this.verbose = verbose;
    this.clearData = clearData;
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    if (!this.verbose && type === 'info') return;
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m'     // Yellow
    };
    
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString();
    console.log(`${colors[type]}[${timestamp}] ${message}${reset}`);
  }

  private async checkDatabaseHealth(): Promise<void> {
    this.log('Checking database connection...');
    try {
      // Simple query to test connection
      await db.select().from(projects).limit(1);
      this.log('Database connection successful', 'success');
    } catch (error) {
      this.log(`Database connection failed: ${error}`, 'error');
      throw error;
    }
  }

  private async clearExistingData(): Promise<void> {
    if (!this.clearData) return;
    
    this.log('Clearing existing demo data...');
    try {
      // Clear in reverse dependency order
      await db.delete(payoutSplits);
      await db.delete(investorFlows);
      await db.delete(investorAccounts);
      await db.delete(investorPools);
      await db.delete(auditLog);
      await db.delete(analytics);
      await db.delete(claims);
      await db.delete(orders);
      await db.delete(proofs);
      await db.delete(carbonLots);
      await db.delete(projects);
      
      this.log('Existing data cleared', 'success');
    } catch (error) {
      this.log(`Error clearing data: ${error}`, 'error');
      throw error;
    }
  }

  private async seedProjects(): Promise<void> {
    this.log('Seeding projects...');
    try {
      for (const project of DEMO_PROJECTS) {
        await db.insert(projects).values({
          ...project,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.projects++;
      }
      this.log(`Seeded ${this.stats.projects} projects`, 'success');
    } catch (error) {
      this.log(`Error seeding projects: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedCarbonLots(): Promise<void> {
    this.log('Seeding carbon lots...');
    try {
      for (const lot of DEMO_CARBON_LOTS) {
        await db.insert(carbonLots).values({
          ...lot,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.carbonLots++;
      }
      this.log(`Seeded ${this.stats.carbonLots} carbon lots`, 'success');
    } catch (error) {
      this.log(`Error seeding carbon lots: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedProofs(): Promise<void> {
    this.log('Seeding proofs...');
    try {
      for (const proof of DEMO_PROOFS) {
        await db.insert(proofs).values({
          ...proof,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.proofs++;
      }
      this.log(`Seeded ${this.stats.proofs} proofs`, 'success');
    } catch (error) {
      this.log(`Error seeding proofs: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedOrders(): Promise<void> {
    this.log('Seeding orders...');
    try {
      for (const order of DEMO_ORDERS) {
        await db.insert(orders).values({
          ...order,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.orders++;
      }
      this.log(`Seeded ${this.stats.orders} orders`, 'success');
    } catch (error) {
      this.log(`Error seeding orders: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedClaims(): Promise<void> {
    this.log('Seeding claims...');
    try {
      for (const claim of DEMO_CLAIMS) {
        await db.insert(claims).values({
          ...claim,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.claims++;
      }
      this.log(`Seeded ${this.stats.claims} claims`, 'success');
    } catch (error) {
      this.log(`Error seeding claims: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedAnalytics(): Promise<void> {
    this.log('Seeding analytics...');
    try {
      for (const analytic of DEMO_ANALYTICS) {
        await db.insert(analytics).values({
          ...analytic,
          timestamp: new Date()
        }).onConflictDoNothing();
        this.stats.analytics++;
      }
      this.log(`Seeded ${this.stats.analytics} analytics`, 'success');
    } catch (error) {
      this.log(`Error seeding analytics: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedAuditLogs(): Promise<void> {
    this.log('Seeding audit logs...');
    try {
      for (const log of DEMO_AUDIT_LOGS) {
        await db.insert(auditLog).values({
          ...log,
          timestamp: new Date()
        }).onConflictDoNothing();
        this.stats.auditLogs++;
      }
      this.log(`Seeded ${this.stats.auditLogs} audit logs`, 'success');
    } catch (error) {
      this.log(`Error seeding audit logs: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedInvestorPools(): Promise<void> {
    this.log('Seeding investor pools...');
    try {
      for (const pool of DEMO_INVESTOR_POOLS) {
        await db.insert(investorPools).values({
          ...pool,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.investorPools++;
      }
      this.log(`Seeded ${this.stats.investorPools} investor pools`, 'success');
    } catch (error) {
      this.log(`Error seeding investor pools: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedInvestorAccounts(): Promise<void> {
    this.log('Seeding investor accounts...');
    try {
      for (const account of DEMO_INVESTOR_ACCOUNTS) {
        await db.insert(investorAccounts).values({
          ...account,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        this.stats.investorAccounts++;
      }
      this.log(`Seeded ${this.stats.investorAccounts} investor accounts`, 'success');
    } catch (error) {
      this.log(`Error seeding investor accounts: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedInvestorFlows(): Promise<void> {
    this.log('Seeding investor flows...');
    try {
      for (const flow of DEMO_INVESTOR_FLOWS) {
        await db.insert(investorFlows).values({
          ...flow,
          createdAt: new Date()
        }).onConflictDoNothing();
        this.stats.investorFlows++;
      }
      this.log(`Seeded ${this.stats.investorFlows} investor flows`, 'success');
    } catch (error) {
      this.log(`Error seeding investor flows: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async seedPayoutSplits(): Promise<void> {
    this.log('Seeding payout splits...');
    try {
      for (const split of DEMO_PAYOUT_SPLITS) {
        await db.insert(payoutSplits).values({
          ...split,
          createdAt: new Date()
        }).onConflictDoNothing();
        this.stats.payoutSplits++;
      }
      this.log(`Seeded ${this.stats.payoutSplits} payout splits`, 'success');
    } catch (error) {
      this.log(`Error seeding payout splits: ${error}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  private async verifySeeding(): Promise<void> {
    this.log('Verifying seeded data...');
    try {
      const projectCount = await db.select().from(projects);
      const lotCount = await db.select().from(carbonLots);
      const proofCount = await db.select().from(proofs);
      const orderCount = await db.select().from(orders);
      
      this.log(`Verification complete:`, 'success');
      this.log(`  - Projects: ${projectCount.length}`);
      this.log(`  - Carbon Lots: ${lotCount.length}`);
      this.log(`  - Proofs: ${proofCount.length}`);
      this.log(`  - Orders: ${orderCount.length}`);
    } catch (error) {
      this.log(`Error verifying data: ${error}`, 'error');
      throw error;
    }
  }

  public async run(): Promise<void> {
    const startTime = Date.now();
    this.log('🌱 Starting GreenLoop Yield demo data seeding...', 'info');
    
    try {
      await this.checkDatabaseHealth();
      await this.clearExistingData();
      
      // Seed data in dependency order
      await this.seedProjects();
      await this.seedCarbonLots();
      await this.seedProofs();
      await this.seedOrders();
      await this.seedClaims();
      await this.seedAnalytics();
      await this.seedAuditLogs();
      await this.seedInvestorPools();
      await this.seedInvestorAccounts();
      await this.seedInvestorFlows();
      await this.seedPayoutSplits();
      
      await this.verifySeeding();
      
      const duration = Date.now() - startTime;
      this.log(`\n🎉 Demo seeding completed successfully in ${duration}ms`, 'success');
      this.log(`📊 Seeding Statistics:`);
      Object.entries(this.stats).forEach(([key, value]) => {
        if (value > 0) {
          this.log(`   ${key}: ${value}`);
        }
      });
      
      if (this.stats.errors > 0) {
        this.log(`⚠️  ${this.stats.errors} errors encountered`, 'warn');
      }
      
    } catch (error) {
      this.log(`❌ Seeding failed: ${error}`, 'error');
      throw error;
    }
  }
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new DemoSeeder();
  seeder.run().catch(console.error);
}

export { DemoSeeder };
export default DemoSeeder;