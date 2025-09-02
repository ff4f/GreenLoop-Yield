#!/usr/bin/env node
// Database Seeding Script for GreenLoop Yield
// Migrates seed data from in-memory to PostgreSQL via Drizzle ORM

import { db, DatabaseService } from '../shared/database.js';
import { 
  projects, 
  carbonLots, 
  orders, 
  proofs, 
  claims, 
  analytics, 
  auditLog 
} from '../shared/schema.js';
import {
  SEED_PROJECTS,
  SEED_LOTS,
  SEED_ORDERS,
  SEED_PROOFS,
  SEED_CLAIMS,
  SEED_ANALYTICS,
  SEED_AUDIT_LOG
} from '../shared/seed-data.js';

// Seeding configuration
const SEED_CONFIG = {
  clearExisting: true,
  verbose: true,
  batchSize: 100
};

class DatabaseSeeder {
  constructor(config = SEED_CONFIG) {
    this.config = config;
    this.stats = {
      projects: 0,
      carbonLots: 0,
      orders: 0,
      proofs: 0,
      claims: 0,
      analytics: 0,
      auditLog: 0,
      errors: 0
    };
  }

  log(message, type = 'info') {
    if (this.config.verbose) {
      const timestamp = new Date().toISOString();
      const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
      console.log(`${prefix} [${timestamp}] ${message}`);
    }
  }

  async checkDatabaseHealth() {
    this.log('Checking database health...');
    const health = await DatabaseService.healthCheck();
    
    if (!health.success) {
      throw new Error(`Database health check failed: ${health.error}`);
    }
    
    if (!health.tablesExist) {
      throw new Error('Database tables do not exist. Please run migrations first.');
    }
    
    this.log('Database health check passed', 'success');
    return health;
  }

  async clearExistingData() {
    if (!this.config.clearExisting) {
      this.log('Skipping data clearing (clearExisting = false)');
      return;
    }

    this.log('Clearing existing data...');
    const result = await DatabaseService.clearAllTables();
    
    if (!result.success) {
      throw new Error(`Failed to clear tables: ${result.error}`);
    }
    
    this.log('Existing data cleared successfully', 'success');
  }

  async seedProjects() {
    this.log(`Seeding ${SEED_PROJECTS.length} projects...`);
    
    try {
      for (const project of SEED_PROJECTS) {
        await db.insert(projects).values({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        });
        this.stats.projects++;
      }
      
      this.log(`Successfully seeded ${this.stats.projects} projects`, 'success');
    } catch (error) {
      this.log(`Error seeding projects: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async seedCarbonLots() {
    this.log(`Seeding ${SEED_LOTS.length} carbon lots...`);
    
    try {
      for (const lot of SEED_LOTS) {
        await db.insert(carbonLots).values({
          ...lot,
          createdAt: new Date(lot.createdAt),
          updatedAt: new Date(lot.updatedAt)
        });
        this.stats.carbonLots++;
      }
      
      this.log(`Successfully seeded ${this.stats.carbonLots} carbon lots`, 'success');
    } catch (error) {
      this.log(`Error seeding carbon lots: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async seedOrders() {
    this.log(`Seeding ${SEED_ORDERS.length} orders...`);
    
    try {
      for (const order of SEED_ORDERS) {
        await db.insert(orders).values({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        });
        this.stats.orders++;
      }
      
      this.log(`Successfully seeded ${this.stats.orders} orders`, 'success');
    } catch (error) {
      this.log(`Error seeding orders: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async seedProofs() {
    this.log(`Seeding ${SEED_PROOFS.length} proofs...`);
    
    try {
      for (const proof of SEED_PROOFS) {
        await db.insert(proofs).values({
          ...proof,
          createdAt: new Date(proof.createdAt)
        });
        this.stats.proofs++;
      }
      
      this.log(`Successfully seeded ${this.stats.proofs} proofs`, 'success');
    } catch (error) {
      this.log(`Error seeding proofs: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async seedClaims() {
    this.log(`Seeding ${SEED_CLAIMS.length} claims...`);
    
    try {
      for (const claim of SEED_CLAIMS) {
        await db.insert(claims).values({
          ...claim,
          createdAt: new Date(claim.createdAt),
          updatedAt: new Date(claim.updatedAt)
        });
        this.stats.claims++;
      }
      
      this.log(`Successfully seeded ${this.stats.claims} claims`, 'success');
    } catch (error) {
      this.log(`Error seeding claims: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async seedAnalytics() {
    this.log(`Seeding ${SEED_ANALYTICS.length} analytics records...`);
    
    try {
      for (const analytic of SEED_ANALYTICS) {
        await db.insert(analytics).values({
          ...analytic,
          timestamp: new Date(analytic.timestamp)
        });
        this.stats.analytics++;
      }
      
      this.log(`Successfully seeded ${this.stats.analytics} analytics records`, 'success');
    } catch (error) {
      this.log(`Error seeding analytics: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async seedAuditLog() {
    this.log(`Seeding ${SEED_AUDIT_LOG.length} audit log entries...`);
    
    try {
      for (const audit of SEED_AUDIT_LOG) {
        await db.insert(auditLog).values({
          ...audit,
          timestamp: new Date(audit.timestamp)
        });
        this.stats.auditLog++;
      }
      
      this.log(`Successfully seeded ${this.stats.auditLog} audit log entries`, 'success');
    } catch (error) {
      this.log(`Error seeding audit log: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async verifySeeding() {
    this.log('Verifying seeded data...');
    
    const counts = await DatabaseService.getTableCounts();
    
    if (!counts.success) {
      throw new Error(`Failed to verify seeding: ${counts.error}`);
    }
    
    this.log('Database table counts after seeding:');
    Object.entries(counts.counts).forEach(([table, count]) => {
      this.log(`  ${table}: ${count} records`);
    });
    
    // Verify expected counts
    const expectedCounts = {
      projects: SEED_PROJECTS.length,
      carbon_lots: SEED_LOTS.length,
      orders: SEED_ORDERS.length,
      proofs: SEED_PROOFS.length,
      claims: SEED_CLAIMS.length,
      analytics: SEED_ANALYTICS.length,
      audit_log: SEED_AUDIT_LOG.length
    };
    
    let verificationPassed = true;
    Object.entries(expectedCounts).forEach(([table, expected]) => {
      const actual = counts.counts[table] || 0;
      if (actual !== expected) {
        this.log(`❌ Verification failed for ${table}: expected ${expected}, got ${actual}`, 'error');
        verificationPassed = false;
      }
    });
    
    if (verificationPassed) {
      this.log('Data verification passed', 'success');
    } else {
      throw new Error('Data verification failed');
    }
  }

  async run() {
    const startTime = Date.now();
    this.log('Starting database seeding process...');
    
    try {
      // Health check
      await this.checkDatabaseHealth();
      
      // Clear existing data
      await this.clearExistingData();
      
      // Seed data in dependency order
      await this.seedProjects();
      await this.seedCarbonLots();
      await this.seedOrders();
      await this.seedProofs();
      await this.seedClaims();
      await this.seedAnalytics();
      await this.seedAuditLog();
      
      // Verify seeding
      await this.verifySeeding();
      
      const duration = Date.now() - startTime;
      this.log(`Database seeding completed successfully in ${duration}ms`, 'success');
      
      // Print summary
      this.log('\n📊 Seeding Summary:');
      Object.entries(this.stats).forEach(([key, value]) => {
        if (key !== 'errors' && value > 0) {
          this.log(`  ${key}: ${value} records`);
        }
      });
      
      if (this.stats.errors > 0) {
        this.log(`  errors: ${this.stats.errors}`, 'error');
      }
      
      return { success: true, stats: this.stats, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Database seeding failed after ${duration}ms: ${error.message}`, 'error');
      return { success: false, error: error.message, stats: this.stats, duration };
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new DatabaseSeeder();
  
  seeder.run()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Database seeding completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Database seeding failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error during seeding:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
export { DatabaseSeeder };