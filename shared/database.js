// Database Connection Service for GreenLoop Yield
// Provides Drizzle ORM connection to Neon PostgreSQL

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Environment variables validation
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle database instance
export const db = drizzle(sql, { schema });

// Database connection utilities
export class DatabaseService {
  static async testConnection() {
    try {
      const result = await sql`SELECT 1 as test`;
      return { success: true, result };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTableCounts() {
    try {
      const counts = {};
      
      // Get count for each table
      const tables = ['projects', 'carbon_lots', 'orders', 'proofs', 'claims', 'analytics', 'audit_log', 'project_sheets'];
      
      for (const table of tables) {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        counts[table] = parseInt(result[0].count);
      }
      
      return { success: true, counts };
    } catch (error) {
      console.error('Failed to get table counts:', error);
      return { success: false, error: error.message };
    }
  }

  static async runMigrations() {
    try {
      // This would typically be handled by drizzle-kit migrate command
      // But we can provide a programmatic way to check migration status
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'projects'
        ) as tables_exist
      `;
      
      return { 
        success: true, 
        tablesExist: result[0].tables_exist,
        message: result[0].tables_exist ? 'Tables already exist' : 'Tables need to be created'
      };
    } catch (error) {
      console.error('Migration check failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async clearAllTables() {
    try {
      // Clear all tables in reverse dependency order
      await sql`TRUNCATE TABLE audit_log CASCADE`;
      await sql`TRUNCATE TABLE analytics CASCADE`;
      await sql`TRUNCATE TABLE claims CASCADE`;
      await sql`TRUNCATE TABLE proofs CASCADE`;
      await sql`TRUNCATE TABLE orders CASCADE`;
      await sql`TRUNCATE TABLE carbon_lots CASCADE`;
      await sql`TRUNCATE TABLE project_sheets CASCADE`;
      await sql`TRUNCATE TABLE projects CASCADE`;
      
      return { success: true, message: 'All tables cleared successfully' };
    } catch (error) {
      console.error('Failed to clear tables:', error);
      return { success: false, error: error.message };
    }
  }

  static async healthCheck() {
    try {
      const connectionTest = await this.testConnection();
      const migrationStatus = await this.runMigrations();
      const tableCounts = await this.getTableCounts();
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        connection: connectionTest.success,
        tablesExist: migrationStatus.tablesExist,
        tableCounts: tableCounts.success ? tableCounts.counts : null,
        status: connectionTest.success && migrationStatus.tablesExist ? 'healthy' : 'needs_setup'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'error'
      };
    }
  }
}

// Export schema for use in other files
export { schema };

// Export individual tables for convenience
export const {
  projects,
  carbonLots,
  orders,
  proofs,
  claims,
  analytics,
  auditLog,
  projectSheets
} = schema;

// Database query helpers
export class QueryHelpers {
  // Projects
  static async getAllProjects() {
    return await db.select().from(projects);
  }

  static async getProjectById(id) {
    return await db.select().from(projects).where(eq(projects.id, id));
  }

  // Carbon Lots
  static async getAllLots() {
    return await db.select().from(carbonLots);
  }

  static async getLotById(id) {
    return await db.select().from(carbonLots).where(eq(carbonLots.id, id));
  }

  static async getAvailableLots() {
    return await db.select().from(carbonLots).where(eq(carbonLots.status, 'LISTED'));
  }

  // Orders
  static async getAllOrders() {
    return await db.select().from(orders);
  }

  static async getOrderById(id) {
    return await db.select().from(orders).where(eq(orders.id, id));
  }

  static async getOrdersByBuyer(buyerId) {
    return await db.select().from(orders).where(eq(orders.buyerId, buyerId));
  }

  // Proofs
  static async getAllProofs() {
    return await db.select().from(proofs);
  }

  static async getProofsByProject(projectId) {
    return await db.select().from(proofs).where(eq(proofs.projectId, projectId));
  }

  // Claims
  static async getAllClaims() {
    return await db.select().from(claims);
  }

  static async getClaimsByBuyer(buyerId) {
    return await db.select().from(claims).where(eq(claims.buyerId, buyerId));
  }

  // Analytics
  static async logAnalytics(metric, value, metadata = {}) {
    return await db.insert(analytics).values({
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric,
      value,
      metadata,
      timestamp: new Date()
    });
  }

  // Audit Log
  static async logAudit(userId, action, entityType, entityId, changes = {}) {
    return await db.insert(auditLog).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      entityType,
      entityId,
      changes,
      timestamp: new Date()
    });
  }
}

// Import eq function for queries
import { eq } from 'drizzle-orm';

export default db;