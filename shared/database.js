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
  projectSheets,
  // newly exposed tables
  investorPools,
  investorAccounts,
  investorFlows,
  payoutSplits,
  hcsEvents
} = schema;

// Database query helpers
export class QueryHelpers {
  // Utility
  static genId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Projects (keep existing minimal)
  static async getAllProjects() {
    return await db.select().from(projects);
  }

  static async getProjectById(id) {
    const rows = await db.select().from(projects).where(eq(projects.id, id));
    return rows?.[0] || null;
  }

  // Carbon Lots
  static async getCarbonLotById(id) {
    const rows = await db.select().from(carbonLots).where(eq(carbonLots.id, id));
    return rows?.[0] || null;
  }

  static async getCarbonLots(filters = {}) {
    let q = db.select().from(carbonLots);
    // Simple filtering in memory to keep drizzle where-building minimal
    const rows = await q;
    return rows.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.developerId && r.developerId !== filters.developerId) return false;
      return true;
    });
  }

  static async createCarbonLot(values) {
    const payload = { id: values.id || this.genId('lot'), ...values };
    await db.insert(carbonLots).values(payload);
    return payload;
  }

  static async updateCarbonLot(id, values) {
    await sql`UPDATE carbon_lots SET ${sql(values)} WHERE id = ${id}`;
    const updated = await this.getCarbonLotById(id);
    return updated;
  }

  // Orders
  static async getOrderById(id) {
    const rows = await db.select().from(orders).where(eq(orders.id, id));
    return rows?.[0] || null;
  }

  static async getOrders(filters = {}) {
    const rows = await db.select().from(orders);
    return rows.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.buyerId && r.buyerId !== filters.buyerId) return false;
      if (filters.developerId) {
        // join-less filter using lot lookup cache
        // Note: For simplicity, fetch lot per order later at API level
        // so here we don't filter by developerId
      }
      return true;
    });
  }

  static async createOrder(values) {
    const payload = { id: values.id || this.genId('order'), ...values };
    await db.insert(orders).values(payload);
    return payload;
  }

  static async updateOrder(id, values) {
    await sql`UPDATE orders SET ${sql(values)} WHERE id = ${id}`;
    const updated = await this.getOrderById(id);
    return updated;
  }

  static async deleteOrder(id) {
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return { success: true };
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

  // Analytics (compatible wrapper)
  static async createAnalytics({ event, value, metadata = {}, userId, timestamp }) {
    const meta = { ...metadata };
    if (userId) meta.userId = userId;
    const row = {
      id: this.genId('analytics'),
      metric: event,
      value,
      metadata: meta,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };
    await db.insert(analytics).values(row);
    return row;
  }

  static async logAnalytics(metric, value, metadata = {}) {
    return this.createAnalytics({ event: metric, value, metadata });
  }

  // Audit Log (compatible wrapper)
  static async createAuditLog({ userId, action, entityType, entityId, changes = {}, timestamp }) {
    const row = {
      id: this.genId('audit'),
      userId,
      action,
      entityType,
      entityId,
      changes,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };
    await db.insert(auditLog).values(row);
    return row;
  }

  static async logAudit(userId, action, entityType, entityId, changes = {}) {
    return this.createAuditLog({ userId, action, entityType, entityId, changes });
  }

  // Investor: payout splits
  static async createPayoutSplit({ orderId, developerAmount, investorAmount, platformFee, txHash }) {
    const row = {
      id: this.genId('split'),
      orderId,
      developerAmount,
      investorAmount,
      platformFee,
      txHash,
      createdAt: new Date()
    };
    await db.insert(payoutSplits).values(row);
    return row;
  }

  // Investor: pool/account helpers
  static async getInvestorPool() {
    const rows = await db.select().from(investorPools);
    return rows?.[0] || null;
  }

  static async upsertInvestorPool(values = {}) {
    const existing = await this.getInvestorPool();
    if (!existing) {
      const row = {
        id: values.id || 'pool_main',
        tvl: values.tvl ?? '0',
        totalShares: values.totalShares ?? '0',
        sharePrice: values.sharePrice ?? '1',
        apr: values.apr ?? '0.1000',
        totalDeposits: values.totalDeposits ?? '0',
        totalWithdrawals: values.totalWithdrawals ?? '0',
        lastSettlementAt: values.lastSettlementAt ? new Date(values.lastSettlementAt) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(investorPools).values(row);
      return row;
    } else {
      const updates = { ...values, updatedAt: new Date() };
      await sql`UPDATE investor_pools SET ${sql(updates)} WHERE id = ${existing.id}`;
      const rows2 = await db.select().from(investorPools).where(eq(investorPools.id, existing.id));
      return rows2?.[0] || null;
    }
  }

  static async getInvestorAccount(userId) {
    const rows = await db.select().from(investorAccounts).where(eq(investorAccounts.userId, userId));
    return rows?.[0] || null;
  }

  static async upsertInvestorAccount(userId, values = {}) {
    const existing = await this.getInvestorAccount(userId);
    if (!existing) {
      const row = {
        id: this.genId('acct'),
        userId,
        shares: values.shares ?? '0',
        depositTotal: values.depositTotal ?? '0',
        withdrawTotal: values.withdrawTotal ?? '0',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(investorAccounts).values(row);
      return row;
    } else {
      const updates = { ...values, updatedAt: new Date() };
      await sql`UPDATE investor_accounts SET ${sql(updates)} WHERE id = ${existing.id}`;
      const rows2 = await db.select().from(investorAccounts).where(eq(investorAccounts.id, existing.id));
      return rows2?.[0] || null;
    }
  }

  static async createInvestorFlow({ userId, type, amount, sharesDelta = '0', orderId, txHash, metadata = {} }) {
    const row = {
      id: this.genId('flow'),
      userId: userId || null,
      type,
      amount,
      sharesDelta,
      orderId: orderId || null,
      txHash: txHash || null,
      metadata,
      createdAt: new Date()
    };
    await db.insert(investorFlows).values(row);
    return row;
  }

  static async getInvestorFlows(limit = 50) {
    const rows = await db.select().from(investorFlows);
    // sort desc by createdAt (string dates OK if consistent)
    const sorted = rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted.slice(0, limit);
  }

  static recalcSharePrice(tvl, totalShares) {
    const tvlNum = Number(tvl);
    const sharesNum = Number(totalShares);
    if (!sharesNum || sharesNum <= 0) return 1;
    return tvlNum / sharesNum;
  }

  static async creditInvestorPoolFromSettlement({ amount, orderId, txHash }) {
    const pool = await this.getInvestorPool();
    const current = pool || await this.upsertInvestorPool({});
    const newTVL = (Number(current.tvl) + Number(amount)).toFixed(2);
    const newSharePrice = this.recalcSharePrice(newTVL, current.totalShares);
    await this.upsertInvestorPool({ tvl: newTVL, sharePrice: newSharePrice, lastSettlementAt: new Date() });
    await this.createInvestorFlow({ userId: null, type: 'CREDIT_FROM_SETTLEMENT', amount, sharesDelta: '0', orderId, txHash });
    return { tvl: newTVL, sharePrice: newSharePrice };
  }

  static async depositToInvestorPool({ userId, amount, txHash }) {
    const pool = (await this.getInvestorPool()) || await this.upsertInvestorPool({});
    const sharePrice = Number(pool.sharePrice) || 1;
    const minted = Number(amount) / sharePrice;
    const newTVL = (Number(pool.tvl) + Number(amount)).toFixed(2);
    const newTotalShares = (Number(pool.totalShares) + minted).toFixed(8);
    const newSharePrice = this.recalcSharePrice(newTVL, newTotalShares);
    await this.upsertInvestorPool({ tvl: newTVL, totalShares: newTotalShares, sharePrice: newSharePrice, totalDeposits: (Number(pool.totalDeposits) + Number(amount)).toFixed(2) });

    const acct = (await this.getInvestorAccount(userId)) || await this.upsertInvestorAccount(userId, {});
    await this.upsertInvestorAccount(userId, {
      shares: (Number(acct.shares) + minted).toFixed(8),
      depositTotal: (Number(acct.depositTotal) + Number(amount)).toFixed(2)
    });

    await this.createInvestorFlow({ userId, type: 'DEPOSIT', amount, sharesDelta: minted.toFixed(8), txHash });
    return { mintedShares: minted, sharePrice: newSharePrice };
  }

  static async withdrawFromInvestorPool({ userId, amount, txHash }) {
    const pool = (await this.getInvestorPool()) || await this.upsertInvestorPool({});
    const acct = (await this.getInvestorAccount(userId)) || await this.upsertInvestorAccount(userId, {});
    const sharePrice = Number(pool.sharePrice) || 1;
    const burnShares = Math.min(Number(acct.shares), Number(amount) / sharePrice);
    const withdrawAmount = burnShares * sharePrice;

    const newTVL = Math.max(0, Number(pool.tvl) - withdrawAmount).toFixed(2);
    const newTotalShares = Math.max(0, Number(pool.totalShares) - burnShares).toFixed(8);
    const newSharePrice = this.recalcSharePrice(newTVL, newTotalShares);
    await this.upsertInvestorPool({ tvl: newTVL, totalShares: newTotalShares, sharePrice: newSharePrice, totalWithdrawals: (Number(pool.totalWithdrawals) + withdrawAmount).toFixed(2) });

    await this.upsertInvestorAccount(userId, {
      shares: Math.max(0, Number(acct.shares) - burnShares).toFixed(8),
      withdrawTotal: (Number(acct.withdrawTotal) + withdrawAmount).toFixed(2)
    });

    await this.createInvestorFlow({ userId, type: 'WITHDRAW', amount: withdrawAmount.toFixed(2), sharesDelta: (-burnShares).toFixed(8), txHash });
    return { burnedShares: burnShares, amount: withdrawAmount };
  }

  // HCS Events methods for Mirror Worker
  static async createHcsEvent(values) {
    const result = await db.insert(schema.hcsEvents).values(values).returning();
    return result[0];
  }

  static async getLastHcsEvent(topicId) {
    const result = await db.select()
      .from(schema.hcsEvents)
      .where(eq(schema.hcsEvents.topicId, topicId))
      .orderBy(desc(schema.hcsEvents.sequenceNumber))
      .limit(1);
    return result[0] || null;
  }

  static async getHcsEvents(filters = {}) {
    let query = db.select().from(schema.hcsEvents);
    
    if (filters.topicId) {
      query = query.where(eq(schema.hcsEvents.topicId, filters.topicId));
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query.orderBy(desc(schema.hcsEvents.consensusTimestamp));
  }

  // Update methods for HCS confirmation
  static async updateProofByLotAndType(lotId, proofType, values) {
    return await db.update(schema.proofs)
      .set(values)
      .where(and(
        eq(schema.proofs.lotId, lotId),
        eq(schema.proofs.type, proofType)
      ));
  }

  // Audit logs methods
  static async getAuditLogs(filters = {}) {
    let query = db.select().from(schema.auditLog);
    
    if (filters.entityType) {
      query = query.where(eq(schema.auditLog.entityType, filters.entityType));
    }
    
    if (filters.entityId) {
      query = query.where(eq(schema.auditLog.entityId, filters.entityId));
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query.orderBy(desc(schema.auditLog.timestamp));
  }

  // Analytics methods
  static async getAnalytics(filters = {}) {
    let query = db.select().from(schema.analytics);
    
    if (filters.metric) {
      query = query.where(eq(schema.analytics.metric, filters.metric));
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query.orderBy(desc(schema.analytics.timestamp));
  }
}

// Import query functions
import { eq, desc, and } from 'drizzle-orm';
import { sql } from '@neondatabase/serverless';

export default db;