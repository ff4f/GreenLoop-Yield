import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// State Machine Enums
export const LotStatus = {
  DRAFT: "draft",
  PROOFED: "proofed",
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  MINTED: "minted",
  LISTED: "listed",
  PARTIALLY_SOLD: "partially_sold",
  SOLD_OUT: "sold_out",
  RETIRED: "retired",
  CANCELLED: "cancelled",
  EXPIRED: "expired"
};

export const OrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  ESCROW: "escrow",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
  REFUNDED: "refunded",
  DISPUTED: "disputed"
};

export const ClaimStatus = {
  DRAFT: "DRAFT",
  VALIDATED: "VALIDATED",
  PDF_STORED: "PDF_STORED",
  JSON_STORED: "JSON_STORED",
  ANCHORED: "ANCHORED",
  BADGED: "BADGED",
  COMPLETE: "COMPLETE"
};

export const ProjectType = {
  NATURE: "nature",
  COOKSTOVE: "cookstove", 
  AGROFORESTRY: "agroforestry",
  METHANE: "methane"
};

export const ProofType = {
  PHOTO: "photo",
  NDVI: "ndvi",
  QC: "qc"
};

export const UserRole = {
  DEVELOPER: "developer",
  BUYER: "buyer",
  ADMIN: "admin",
  AUDITOR: "auditor"
};

// Validation schemas
export const projectValidationSchema = z.object({
  projectName: z.string().min(1).max(80),
  location: z.string().min(1),
  type: z.enum([ProjectType.NATURE, ProjectType.COOKSTOVE, ProjectType.AGROFORESTRY, ProjectType.METHANE]),
  area: z.number().min(1).optional(),
  units: z.number().min(1).optional(),
  rate: z.number().min(0.1).max(15),
  bufferPercent: z.number().min(10).max(30),
  forwardPercent: z.number().min(0).max(50),
  pricePerTon: z.number().min(5).max(30)
}).refine(data => data.area || data.units, {
  message: "Either area or units must be provided"
});

// Guard functions
export const canTransitionLotStatus = (from, to, hasValidUploads = false, isRetired = false, pdi = 0) => {
  const transitions = {
    [LotStatus.DRAFT]: [LotStatus.PROOFED, LotStatus.CANCELLED],
    [LotStatus.PROOFED]: [LotStatus.PENDING_VERIFICATION, LotStatus.CANCELLED],
    [LotStatus.PENDING_VERIFICATION]: [LotStatus.VERIFIED, LotStatus.CANCELLED],
    [LotStatus.VERIFIED]: [LotStatus.MINTED, LotStatus.CANCELLED],
    [LotStatus.MINTED]: [LotStatus.LISTED, LotStatus.CANCELLED],
    [LotStatus.LISTED]: [LotStatus.PARTIALLY_SOLD, LotStatus.SOLD_OUT, LotStatus.EXPIRED, LotStatus.CANCELLED],
    [LotStatus.PARTIALLY_SOLD]: [LotStatus.SOLD_OUT, LotStatus.EXPIRED, LotStatus.CANCELLED],
    [LotStatus.SOLD_OUT]: [LotStatus.RETIRED],
    [LotStatus.RETIRED]: [],
    [LotStatus.CANCELLED]: [],
    [LotStatus.EXPIRED]: [LotStatus.CANCELLED]
  };
  
  const allowedTransitions = transitions[from] || [];
  if (!allowedTransitions.includes(to)) return false;
  
  // Additional validation rules
  if (from === LotStatus.DRAFT && to === LotStatus.PROOFED) {
    return hasValidUploads; // Require at least one proof upload
  }
  
  if (from === LotStatus.MINTED && to === LotStatus.LISTED) {
    return pdi >= 70; // Require PDI >= 70 to list
  }
  
  return true;
};

export const canTransitionOrderStatus = (from, to, hasDeliveryRef = false, hasPayoutTx = false) => {
  const transitions = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.FAILED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.ESCROW, OrderStatus.COMPLETED, OrderStatus.FAILED],
    [OrderStatus.ESCROW]: [OrderStatus.COMPLETED, OrderStatus.DISPUTED, OrderStatus.REFUNDED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.FAILED]: [OrderStatus.REFUNDED],
    [OrderStatus.REFUNDED]: [],
    [OrderStatus.DISPUTED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED]
  };
  
  const allowedTransitions = transitions[from] || [];
  return allowedTransitions.includes(to);
};

export const canTransitionClaimStatus = (from, to) => {
  const transitions = {
    [ClaimStatus.DRAFT]: [ClaimStatus.VALIDATED],
    [ClaimStatus.VALIDATED]: [ClaimStatus.PDF_STORED],
    [ClaimStatus.PDF_STORED]: [ClaimStatus.JSON_STORED],
    [ClaimStatus.JSON_STORED]: [ClaimStatus.ANCHORED],
    [ClaimStatus.ANCHORED]: [ClaimStatus.BADGED, ClaimStatus.COMPLETE],
    [ClaimStatus.BADGED]: [ClaimStatus.COMPLETE],
    [ClaimStatus.COMPLETE]: []
  };
  return transitions[from]?.includes(to) || false;
};

// Mock Hedera IDs (consistent with blueprint)
export const MOCK_IDS = {
  PROOF_HASHES: {
    PHOTO: "0xabc123",
    NDVI: "0xdef456", 
    QC: "0xghi789"
  },
  TX_HASHES: {
    ESCROW: "0x111aaa",
    DELIVERY: "0x222bbb",
    PAYOUT: "0x333ccc"
  },
  HCS_TOPICS: {
    PROOF: "0.0.900123",
    CLAIM: "0.0.900456"
  },
  HFS_FILES: {
    CONTRACT: "0.0.700111",
    DELIVERY_CERT: "0.0.700222",
    CLAIM_PDF: "0.0.700567",
    CLAIM_JSON: "0.0.700568"
  },
  HTS_TOKENS: {
    FT_TONS: "0.0.600111",
    NFT_BADGE: "0.0.600222"
  }
};

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id", { length: 255 }).primaryKey(),
  projectName: varchar("project_name", { length: 80 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  units: integer("units"),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  bufferPercent: decimal("buffer_percent", { precision: 5, scale: 2 }).notNull(),
  forwardPercent: decimal("forward_percent", { precision: 5, scale: 2 }).notNull(),
  pricePerTon: decimal("price_per_ton", { precision: 8, scale: 2 }).notNull(),
  totalTons: decimal("total_tons", { precision: 10, scale: 2 }).notNull(),
  developerId: varchar("developer_id", { length: 255 }).notNull(),
  uploads: jsonb("uploads").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Carbon Credit Lots (PBCL)
export const carbonLots = pgTable("carbon_lots", {
  id: varchar("id", { length: 255 }).primaryKey(),
  projectId: varchar("project_id", { length: 255 }).notNull(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  units: integer("units"),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  bufferPercent: decimal("buffer_percent", { precision: 5, scale: 2 }).notNull(),
  forwardPercent: decimal("forward_percent", { precision: 5, scale: 2 }).notNull(),
  pricePerTon: decimal("price_per_ton", { precision: 8, scale: 2 }).notNull(),
  totalTons: decimal("total_tons", { precision: 10, scale: 2 }).notNull(),
  availableTons: decimal("available_tons", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  developerId: varchar("developer_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  lotId: varchar("lot_id", { length: 255 }).notNull(),
  buyerId: varchar("buyer_id", { length: 255 }).notNull(),
  tons: decimal("tons", { precision: 10, scale: 2 }).notNull(),
  pricePerTon: decimal("price_per_ton", { precision: 8, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 12, scale: 2 }).notNull(),
  retirementFee: decimal("retirement_fee", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  escrowTxHash: varchar("escrow_tx_hash", { length: 255 }),
  deliveryRef: varchar("delivery_ref", { length: 255 }),
  payoutTxHash: varchar("payout_tx_hash", { length: 255 }),
  disputeReason: text("dispute_reason"),
  disputeRaisedBy: varchar("dispute_raised_by", { length: 255 }),
  disputeRaisedAt: timestamp("dispute_raised_at"),
  disputeResolvedBy: varchar("dispute_resolved_by", { length: 255 }),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  disputeResolution: text("dispute_resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Proofs table
export const proofs = pgTable("proofs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  projectId: varchar("project_id", { length: 255 }).notNull(),
  lotId: varchar("lot_id", { length: 255 }),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  fileId: varchar("file_id", { length: 255 }),
  manifestFileId: varchar("manifest_file_id", { length: 255 }),
  proofHash: varchar("proof_hash", { length: 255 }),
  hcsTopicId: varchar("hcs_topic_id", { length: 255 }),
  hcsTransactionId: varchar("hcs_transaction_id", { length: 255 }),
  submittedBy: varchar("submitted_by", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Claims table
export const claims = pgTable("claims", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  buyerId: varchar("buyer_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
  stepData: jsonb("step_data").default({}),
  pdfFileId: varchar("pdf_file_id", { length: 255 }),
  jsonFileId: varchar("json_file_id", { length: 255 }),
  anchorTxHash: varchar("anchor_tx_hash", { length: 255 }),
  badgeTokenId: varchar("badge_token_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Analytics table
export const analytics = pgTable("analytics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  metric: varchar("metric", { length: 100 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  changes: jsonb("changes").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Investor Pool aggregate table
export const investorPools = pgTable("investor_pools", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tvl: decimal("tvl", { precision: 18, scale: 2 }).default("0").notNull(),
  totalShares: decimal("total_shares", { precision: 18, scale: 8 }).default("0").notNull(),
  sharePrice: decimal("share_price", { precision: 12, scale: 6 }).default("1").notNull(),
  apr: decimal("apr", { precision: 6, scale: 4 }).default("0.1000").notNull(),
  totalDeposits: decimal("total_deposits", { precision: 18, scale: 2 }).default("0").notNull(),
  totalWithdrawals: decimal("total_withdrawals", { precision: 18, scale: 2 }).default("0").notNull(),
  lastSettlementAt: timestamp("last_settlement_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Investor Accounts table
export const investorAccounts = pgTable("investor_accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  shares: decimal("shares", { precision: 18, scale: 8 }).default("0").notNull(),
  depositTotal: decimal("deposit_total", { precision: 18, scale: 2 }).default("0").notNull(),
  withdrawTotal: decimal("withdraw_total", { precision: 18, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Investor Flows table
export const investorFlows = pgTable("investor_flows", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 40 }).notNull(), // DEPOSIT | WITHDRAW | CREDIT_FROM_SETTLEMENT | FEE
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  sharesDelta: decimal("shares_delta", { precision: 18, scale: 8 }).default("0").notNull(),
  orderId: varchar("order_id", { length: 255 }),
  txHash: varchar("tx_hash", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payout Splits per order
export const payoutSplits = pgTable("payout_splits", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  developerAmount: decimal("developer_amount", { precision: 18, scale: 2 }).notNull(),
  investorAmount: decimal("investor_amount", { precision: 18, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 18, scale: 2 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project Sheets table
export const projectSheets = pgTable("project_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectName: text("project_name").notNull(),
  location: text("location").notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  ratePerHaPerYear: decimal("rate_per_ha_per_year", { precision: 5, scale: 2 }),
  bufferPercent: decimal("buffer_percent", { precision: 5, scale: 2 }),
  forwardPercent: decimal("forward_percent", { precision: 5, scale: 2 }),
  expectedTons: decimal("expected_tons", { precision: 10, scale: 2 }),
  afterBufferTons: decimal("after_buffer_tons", { precision: 10, scale: 2 }),
  listedTons: decimal("listed_tons", { precision: 10, scale: 2 }),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  lotId: varchar("lot_id"),
  tokenId: varchar("token_id"),
  files: jsonb("files"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// HCS Events table for Mirror Node audit trail
export const hcsEvents = pgTable("hcs_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  topicId: varchar("topic_id", { length: 255 }).notNull(),
  sequenceNumber: varchar("sequence_number", { length: 255 }).notNull(),
  consensusTimestamp: varchar("consensus_timestamp", { length: 255 }).notNull(),
  runningHash: varchar("running_hash", { length: 255 }).notNull(),
  messageContent: text("message_content").notNull(),
  parsedMessage: jsonb("parsed_message").default({}),
  topicName: varchar("topic_name", { length: 100 }),
  confirmed: boolean("confirmed").default(false),
  hcsEventId: varchar("hcs_event_id", { length: 255 }),
  lastHcsEventId: varchar("last_hcs_event_id", { length: 255 }),
  lastConsensusTimestamp: varchar("last_consensus_timestamp", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// Idempotency table for preventing duplicate requests
export const idempotencyKeys = pgTable("idempotency_keys", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
  requestHash: varchar("request_hash", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  responseData: jsonb("response_data"),
  statusCode: integer("status_code"),
  userId: varchar("user_id", { length: 255 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects);
export const insertCarbonLotSchema = createInsertSchema(carbonLots);
export const insertOrderSchema = createInsertSchema(orders);
export const insertProofSchema = createInsertSchema(proofs);
export const insertClaimSchema = createInsertSchema(claims);
export const insertAnalyticsSchema = createInsertSchema(analytics);
export const insertAuditLogSchema = createInsertSchema(auditLog);
export const insertInvestorPoolSchema = createInsertSchema(investorPools);
export const insertInvestorAccountSchema = createInsertSchema(investorAccounts);
export const insertInvestorFlowSchema = createInsertSchema(investorFlows);
export const insertPayoutSplitSchema = createInsertSchema(payoutSplits);
export const insertHcsEventSchema = createInsertSchema(hcsEvents);
export const insertIdempotencyKeySchema = createInsertSchema(idempotencyKeys);

// ProofLink utility class
export class ProofLink {
  static buildTxLink(txHash) {
    return `https://hashscan.io/testnet/transaction/${txHash}`;
  }
  
  static buildFileLink(fileId) {
    return `https://hashscan.io/testnet/file/${fileId}`;
  }
  
  static buildTopicLink(topicId, sequence) {
    const baseUrl = `https://hashscan.io/testnet/topic/${topicId}`;
    return sequence ? `${baseUrl}/message/${sequence}` : baseUrl;
  }
  
  static buildTokenLink(tokenId) {
    return `https://hashscan.io/testnet/token/${tokenId}`;
  }
  
  // Alias for compatibility
  static buildTransactionLink(txHash) {
    return this.buildTxLink(txHash);
  }
}

// Fee calculation utility
export const calculateOrderFees = (tons, pricePerTon) => {
  const subtotal = tons * pricePerTon;
  const platformFee = subtotal * 0.03; // 3% platform fee
  const retirementFee = subtotal * 0.05; // 5% retirement fee
  const total = subtotal + platformFee + retirementFee;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    retirementFee: parseFloat(retirementFee.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

// Advanced pricing and fee calculation functions
export function calculateDynamicPricing(basePrice, demand, supply, marketConditions = {}) {
  const {
    volatilityMultiplier = 1.0,
    seasonalAdjustment = 1.0,
    qualityPremium = 1.0,
    urgencyMultiplier = 1.0
  } = marketConditions;
  
  // Supply-demand ratio impact
  const demandSupplyRatio = demand / Math.max(supply, 1);
  const demandAdjustment = Math.min(Math.max(demandSupplyRatio * 0.1, -0.3), 0.5);
  
  // Calculate dynamic price
  const adjustedPrice = basePrice * 
    (1 + demandAdjustment) * 
    volatilityMultiplier * 
    seasonalAdjustment * 
    qualityPremium * 
    urgencyMultiplier;
  
  return {
    basePrice,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100,
    demandSupplyRatio,
    demandAdjustment,
    priceChange: adjustedPrice - basePrice,
    priceChangePercent: ((adjustedPrice - basePrice) / basePrice) * 100
  };
}

export function calculateTieredFees(amount, userTier = 'standard') {
  const feeStructure = {
    basic: { platform: 0.035, retirement: 0.06, transaction: 2.0 },
    standard: { platform: 0.03, retirement: 0.05, transaction: 1.5 },
    premium: { platform: 0.025, retirement: 0.04, transaction: 1.0 },
    enterprise: { platform: 0.02, retirement: 0.035, transaction: 0.5 }
  };
  
  const fees = feeStructure[userTier] || feeStructure.standard;
  
  // Volume discounts
  let volumeDiscount = 0;
  if (amount >= 10000) volumeDiscount = 0.15; // 15% discount for $10k+
  else if (amount >= 5000) volumeDiscount = 0.10; // 10% discount for $5k+
  else if (amount >= 1000) volumeDiscount = 0.05; // 5% discount for $1k+
  
  const platformFee = amount * fees.platform * (1 - volumeDiscount);
  const retirementFee = amount * fees.retirement * (1 - volumeDiscount);
  const transactionFee = fees.transaction;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100,
    retirementFee: Math.round(retirementFee * 100) / 100,
    transactionFee,
    totalFees: Math.round((platformFee + retirementFee + transactionFee) * 100) / 100,
    volumeDiscount,
    userTier,
    effectiveRate: {
      platform: fees.platform * (1 - volumeDiscount),
      retirement: fees.retirement * (1 - volumeDiscount)
    }
  };
}

export function calculatePayoutSplit(totalAmount, stakeholders = {}) {
  const {
    projectDeveloper = 0.70,  // 70% to project developer
    investorPool = 0.20,      // 20% to investor pool
    platform = 0.10           // 10% to platform
  } = stakeholders;
  
  // Ensure percentages add up to 100%
  const totalPercentage = projectDeveloper + investorPool + platform;
  if (Math.abs(totalPercentage - 1.0) > 0.001) {
    throw new Error(`Payout percentages must sum to 100%, got ${totalPercentage * 100}%`);
  }
  
  const payouts = {
    projectDeveloper: Math.round(totalAmount * projectDeveloper * 100) / 100,
    investorPool: Math.round(totalAmount * investorPool * 100) / 100,
    platform: Math.round(totalAmount * platform * 100) / 100
  };
  
  // Adjust for rounding errors
  const calculatedTotal = Object.values(payouts).reduce((sum, amount) => sum + amount, 0);
  const roundingDifference = totalAmount - calculatedTotal;
  if (Math.abs(roundingDifference) > 0.01) {
    payouts.projectDeveloper += roundingDifference;
    payouts.projectDeveloper = Math.round(payouts.projectDeveloper * 100) / 100;
  }
  
  return {
    totalAmount,
    payouts,
    percentages: { projectDeveloper, investorPool, platform },
    verification: {
      totalPayout: Object.values(payouts).reduce((sum, amount) => sum + amount, 0),
      difference: totalAmount - Object.values(payouts).reduce((sum, amount) => sum + amount, 0)
    }
  };
}

export function calculateEscrowTerms(orderAmount, riskLevel = 'medium') {
  const riskMultipliers = {
    low: { holdPeriod: 7, collateral: 0.05, penalty: 0.02 },
    medium: { holdPeriod: 14, collateral: 0.10, penalty: 0.05 },
    high: { holdPeriod: 30, collateral: 0.20, penalty: 0.10 },
    critical: { holdPeriod: 60, collateral: 0.30, penalty: 0.15 }
  };
  
  const terms = riskMultipliers[riskLevel] || riskMultipliers.medium;
  
  return {
    orderAmount,
    riskLevel,
    holdPeriodDays: terms.holdPeriod,
    collateralRequired: Math.round(orderAmount * terms.collateral * 100) / 100,
    penaltyRate: terms.penalty,
    maxPenalty: Math.round(orderAmount * terms.penalty * 100) / 100,
    releaseDate: new Date(Date.now() + terms.holdPeriod * 24 * 60 * 60 * 1000),
    escrowFee: Math.round(orderAmount * 0.001 * 100) / 100 // 0.1% escrow service fee
  };
}

export function calculateCarbonPricing(projectType, vintage, quality, location, certifications = []) {
  // Base prices by project type (USD per tCO2e)
  const basePrices = {
    'forestry': 25,
    'renewable-energy': 15,
    'energy-efficiency': 12,
    'methane-capture': 20,
    'direct-air-capture': 150,
    'blue-carbon': 35,
    'soil-carbon': 30,
    'biochar': 40,
    'industrial': 18
  };
  
  let basePrice = basePrices[projectType] || 20;
  
  // Vintage adjustment (newer = premium)
  const currentYear = new Date().getFullYear();
  const vintageAdjustment = Math.max(0, (vintage - 2020) * 0.02); // 2% premium per year after 2020
  
  // Quality multiplier
  const qualityMultipliers = {
    'gold': 1.3,
    'verified': 1.15,
    'standard': 1.0,
    'basic': 0.85
  };
  const qualityMultiplier = qualityMultipliers[quality] || 1.0;
  
  // Location adjustment
  const locationMultipliers = {
    'developed': 1.1,
    'developing': 0.9,
    'ldcs': 0.8 // Least Developed Countries
  };
  const locationMultiplier = locationMultipliers[location] || 1.0;
  
  // Certification premiums
  const certificationPremiums = {
    'vcs': 0.05,
    'gold-standard': 0.10,
    'climate-action-reserve': 0.08,
    'american-carbon-registry': 0.06
  };
  
  const certificationBonus = certifications.reduce((total, cert) => {
    return total + (certificationPremiums[cert] || 0);
  }, 0);
  
  const finalPrice = basePrice * 
    (1 + vintageAdjustment) * 
    qualityMultiplier * 
    locationMultiplier * 
    (1 + certificationBonus);
  
  return {
    basePrice,
    finalPrice: Math.round(finalPrice * 100) / 100,
    adjustments: {
      vintage: vintageAdjustment,
      quality: qualityMultiplier,
      location: locationMultiplier,
      certifications: certificationBonus
    },
    breakdown: {
      projectType,
      vintage,
      quality,
      location,
      certifications
    }
  };
}

// DeFi Yield Calculation Engine
export const calculateYield = (principal, apy, timeInDays) => {
  const dailyRate = apy / 365;
  const compoundedAmount = principal * Math.pow(1 + dailyRate, timeInDays);
  const yieldEarned = compoundedAmount - principal;
  
  return {
    principal: parseFloat(principal.toFixed(2)),
    yieldEarned: parseFloat(yieldEarned.toFixed(2)),
    totalValue: parseFloat(compoundedAmount.toFixed(2)),
    apyPercentage: parseFloat((apy * 100).toFixed(2)),
    dailyYield: parseFloat((principal * dailyRate).toFixed(2))
  };
};

// Calculate APY based on carbon credit performance
export const calculateCarbonAPY = (initialPrice, currentPrice, timeInDays) => {
  if (timeInDays <= 0) return 0;
  const priceAppreciation = (currentPrice - initialPrice) / initialPrice;
  const annualizedReturn = (priceAppreciation * 365) / timeInDays;
  return Math.max(0, annualizedReturn); // Ensure non-negative APY
};

// Calculate staking rewards
export const calculateStakingRewards = (stakedAmount, rewardRate, stakingDays) => {
  const dailyRewardRate = rewardRate / 365;
  const totalRewards = stakedAmount * dailyRewardRate * stakingDays;
  
  return {
    stakedAmount: parseFloat(stakedAmount.toFixed(2)),
    dailyRewards: parseFloat((stakedAmount * dailyRewardRate).toFixed(2)),
    totalRewards: parseFloat(totalRewards.toFixed(2)),
    rewardAPY: parseFloat((rewardRate * 100).toFixed(2))
  };
};

// Calculate liquidity provider rewards
export const calculateLPRewards = (liquidityProvided, poolTVL, dailyVolume, feeRate = 0.003) => {
  const poolShare = liquidityProvided / poolTVL;
  const dailyFees = dailyVolume * feeRate;
  const userDailyRewards = dailyFees * poolShare;
  const annualizedAPY = (userDailyRewards * 365) / liquidityProvided;
  
  return {
    poolShare: parseFloat((poolShare * 100).toFixed(4)),
    dailyRewards: parseFloat(userDailyRewards.toFixed(2)),
    annualizedAPY: parseFloat((annualizedAPY * 100).toFixed(2)),
    liquidityProvided: parseFloat(liquidityProvided.toFixed(2))
  };
};

// Calculate Proof Density Index (PDI)
export const calcPDI = (proofs, parcelData = null) => {
  if (!proofs || proofs.length === 0) return 0;
  
  const weights = {
    [ProofType.PHOTO]: 30,
    [ProofType.NDVI]: 40,
    [ProofType.QC]: 30
  };
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  let bonusScore = 0;
  
  // Calculate score for each proof type
  Object.values(ProofType).forEach(type => {
    const typeProofs = proofs.filter(p => p.type === type && p.status === 'verified');
    const hasProof = typeProofs.length > 0;
    
    if (hasProof) {
      totalScore += weights[type];
      
      // Apply bonus scoring for quality validations
      typeProofs.forEach(proof => {
        if (proof.metadata) {
          // EXIF/GPS validation bonus for PHOTO proofs
          if (type === ProofType.PHOTO && proof.metadata.exifValidation) {
            const exifScore = proof.metadata.exifValidation.score || 0;
            if (exifScore >= 0.8) {
              bonusScore += 10; // High quality EXIF data
            } else if (exifScore >= 0.6) {
              bonusScore += 5; // Good EXIF data
            }
          }
          
          // NDVI sanity check bonus for NDVI proofs
          if (type === ProofType.NDVI && proof.metadata.ndviValidation) {
            const ndviScore = proof.metadata.ndviValidation.score || 0;
            if (ndviScore >= 0.8) {
              bonusScore += 15; // High quality NDVI matching
            } else if (ndviScore >= 0.6) {
              bonusScore += 8; // Good NDVI matching
            }
          }
          
          // Additional quality indicators
          if (proof.metadata.qualityScore && proof.metadata.qualityScore >= 0.9) {
            bonusScore += 5; // Overall high quality proof
          }
        }
      });
    }
    maxPossibleScore += weights[type];
  });
  
  // Calculate base PDI
  const basePDI = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  
  // Apply bonus (max 20% bonus)
  const finalPDI = Math.min(100, basePDI + Math.min(20, bonusScore));
  
  return Math.round(finalPDI);
};

// DeFi Yield Tracking Schema
export const yieldPositionsTable = {
  id: 'text',
  userId: 'text',
  lotId: 'text',
  principal: 'real',
  currentValue: 'real',
  yieldEarned: 'real',
  apy: 'real',
  startDate: 'text',
  lastCalculated: 'text',
  status: 'text', // 'active', 'withdrawn', 'compounding'
  yieldType: 'text', // 'carbon_appreciation', 'staking', 'liquidity_mining'
  createdAt: 'text',
  updatedAt: 'text'
};

// Staking Positions Schema
export const stakingPositionsTable = {
  id: 'text',
  userId: 'text',
  tokenId: 'text', // Hedera Token ID
  stakedAmount: 'real',
  rewardRate: 'real',
  stakingStartDate: 'text',
  lastRewardClaim: 'text',
  totalRewardsClaimed: 'real',
  pendingRewards: 'real',
  lockPeriod: 'integer', // days
  status: 'text', // 'active', 'unstaking', 'completed'
  createdAt: 'text',
  updatedAt: 'text'
};

// Liquidity Pool Schema
export const liquidityPoolsTable = {
  id: 'text',
  tokenA: 'text', // Hedera Token ID
  tokenB: 'text', // Hedera Token ID
  totalValueLocked: 'real',
  dailyVolume: 'real',
  feeRate: 'real',
  apy: 'real',
  totalLPTokens: 'real',
  createdAt: 'text',
  updatedAt: 'text'
};

// LP Positions Schema
export const lpPositionsTable = {
  id: 'text',
  userId: 'text',
  poolId: 'text',
  lpTokens: 'real',
  liquidityProvided: 'real',
  feesEarned: 'real',
  impermanentLoss: 'real',
  entryPrice: 'real',
  currentPrice: 'real',
  createdAt: 'text',
  updatedAt: 'text'
};

// State Machine Definitions
const LOT_STATES = {
  DRAFT: 'draft',
  PROOFED: 'proofed',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  MINTED: 'minted',
  LISTED: 'listed',
  PARTIALLY_SOLD: 'partially_sold',
  SOLD_OUT: 'sold_out',
  RETIRED: 'retired',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

const ORDER_STATES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  ESCROW: 'escrow',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed'
};

const CLAIM_STATES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RETIRED: 'retired',
  CANCELLED: 'cancelled'
};

// State Machine Transition Rules
const LOT_TRANSITIONS = {
  [LOT_STATES.DRAFT]: [LOT_STATES.PROOFED, LOT_STATES.CANCELLED],
  [LOT_STATES.PROOFED]: [LOT_STATES.PENDING_VERIFICATION, LOT_STATES.CANCELLED],
  [LOT_STATES.PENDING_VERIFICATION]: [LOT_STATES.VERIFIED, LOT_STATES.CANCELLED],
  [LOT_STATES.VERIFIED]: [LOT_STATES.MINTED, LOT_STATES.CANCELLED],
  [LOT_STATES.MINTED]: [LOT_STATES.LISTED, LOT_STATES.CANCELLED],
  [LOT_STATES.LISTED]: [LOT_STATES.PARTIALLY_SOLD, LOT_STATES.SOLD_OUT, LOT_STATES.EXPIRED, LOT_STATES.CANCELLED],
  [LOT_STATES.PARTIALLY_SOLD]: [LOT_STATES.SOLD_OUT, LOT_STATES.EXPIRED, LOT_STATES.CANCELLED],
  [LOT_STATES.SOLD_OUT]: [LOT_STATES.RETIRED],
  [LOT_STATES.RETIRED]: [], // Terminal state
  [LOT_STATES.CANCELLED]: [], // Terminal state
  [LOT_STATES.EXPIRED]: [LOT_STATES.CANCELLED]
};

const ORDER_TRANSITIONS = {
  [ORDER_STATES.PENDING]: [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED, ORDER_STATES.FAILED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PROCESSING]: [ORDER_STATES.ESCROW, ORDER_STATES.COMPLETED, ORDER_STATES.FAILED],
  [ORDER_STATES.ESCROW]: [ORDER_STATES.COMPLETED, ORDER_STATES.DISPUTED, ORDER_STATES.REFUNDED],
  [ORDER_STATES.COMPLETED]: [], // Terminal state
  [ORDER_STATES.CANCELLED]: [], // Terminal state
  [ORDER_STATES.FAILED]: [ORDER_STATES.REFUNDED],
  [ORDER_STATES.REFUNDED]: [], // Terminal state
  [ORDER_STATES.DISPUTED]: [ORDER_STATES.COMPLETED, ORDER_STATES.REFUNDED]
};

const CLAIM_TRANSITIONS = {
  [CLAIM_STATES.DRAFT]: [CLAIM_STATES.SUBMITTED, CLAIM_STATES.CANCELLED],
  [CLAIM_STATES.SUBMITTED]: [CLAIM_STATES.UNDER_REVIEW, CLAIM_STATES.CANCELLED],
  [CLAIM_STATES.UNDER_REVIEW]: [CLAIM_STATES.VERIFIED, CLAIM_STATES.REJECTED],
  [CLAIM_STATES.VERIFIED]: [CLAIM_STATES.APPROVED, CLAIM_STATES.REJECTED],
  [CLAIM_STATES.APPROVED]: [CLAIM_STATES.RETIRED],
  [CLAIM_STATES.REJECTED]: [CLAIM_STATES.CANCELLED],
  [CLAIM_STATES.RETIRED]: [], // Terminal state
  [CLAIM_STATES.CANCELLED]: [] // Terminal state
};

// State Machine Functions
function canTransition(currentState, targetState, transitions) {
  const allowedTransitions = transitions[currentState] || [];
  return allowedTransitions.includes(targetState);
}

function transitionLotState(currentState, targetState, context = {}) {
  if (!canTransition(currentState, targetState, LOT_TRANSITIONS)) {
    throw new Error(`Invalid transition from ${currentState} to ${targetState}`);
  }

  const timestamp = new Date().toISOString();
  const transition = {
    from: currentState,
    to: targetState,
    timestamp,
    context,
    txHash: context.txHash || null,
    fileId: context.fileId || null,
    topicId: context.topicId || null
  };

  // Business logic for specific transitions
  switch (targetState) {
    case LOT_STATES.VERIFIED:
      if (!context.verificationProof) {
        throw new Error('Verification proof required for verified state');
      }
      break;
    case LOT_STATES.LISTED:
      if (!context.price || context.price <= 0) {
        throw new Error('Valid price required for listing');
      }
      break;
    case LOT_STATES.SOLD_OUT:
      if (!context.finalSaleAmount) {
        throw new Error('Final sale amount required for sold out state');
      }
      break;
  }

  return {
    newState: targetState,
    transition,
    metadata: {
      isTerminal: LOT_TRANSITIONS[targetState].length === 0,
      nextPossibleStates: LOT_TRANSITIONS[targetState] || []
    }
  };
}

function transitionOrderState(currentState, targetState, context = {}) {
  if (!canTransition(currentState, targetState, ORDER_TRANSITIONS)) {
    throw new Error(`Invalid transition from ${currentState} to ${targetState}`);
  }

  const timestamp = new Date().toISOString();
  const transition = {
    from: currentState,
    to: targetState,
    timestamp,
    context,
    txHash: context.txHash || null,
    fileId: context.fileId || null,
    topicId: context.topicId || null
  };

  // Business logic for specific transitions
  switch (targetState) {
    case ORDER_STATES.CONFIRMED:
      if (!context.paymentConfirmation) {
        throw new Error('Payment confirmation required for confirmed state');
      }
      break;
    case ORDER_STATES.ESCROW:
      if (!context.escrowAmount || !context.escrowTerms) {
        throw new Error('Escrow amount and terms required for escrow state');
      }
      break;
    case ORDER_STATES.COMPLETED:
      if (!context.deliveryConfirmation) {
        throw new Error('Delivery confirmation required for completed state');
      }
      break;
    case ORDER_STATES.REFUNDED:
      if (!context.refundAmount || !context.refundReason) {
        throw new Error('Refund amount and reason required for refunded state');
      }
      break;
  }

  return {
    newState: targetState,
    transition,
    metadata: {
      isTerminal: ORDER_TRANSITIONS[targetState].length === 0,
      nextPossibleStates: ORDER_TRANSITIONS[targetState] || []
    }
  };
}

function transitionClaimState(currentState, targetState, context = {}) {
  if (!canTransition(currentState, targetState, CLAIM_TRANSITIONS)) {
    throw new Error(`Invalid transition from ${currentState} to ${targetState}`);
  }

  const timestamp = new Date().toISOString();
  const transition = {
    from: currentState,
    to: targetState,
    timestamp,
    context,
    txHash: context.txHash || null,
    fileId: context.fileId || null,
    topicId: context.topicId || null
  };

  // Business logic for specific transitions
  switch (targetState) {
    case CLAIM_STATES.SUBMITTED:
      if (!context.claimData || !context.supportingDocuments) {
        throw new Error('Claim data and supporting documents required for submission');
      }
      break;
    case CLAIM_STATES.VERIFIED:
      if (!context.verificationReport) {
        throw new Error('Verification report required for verified state');
      }
      break;
    case CLAIM_STATES.APPROVED:
      if (!context.approvalSignature) {
        throw new Error('Approval signature required for approved state');
      }
      break;
    case CLAIM_STATES.RETIRED:
      if (!context.retirementCertificate) {
        throw new Error('Retirement certificate required for retired state');
      }
      break;
  }

  return {
    newState: targetState,
    transition,
    metadata: {
      isTerminal: CLAIM_TRANSITIONS[targetState].length === 0,
      nextPossibleStates: CLAIM_TRANSITIONS[targetState] || []
    }
  };
}

// State Machine Utilities
function getStateInfo(state, type) {
  const stateMap = {
    lot: LOT_STATES,
    order: ORDER_STATES,
    claim: CLAIM_STATES
  };

  const transitionMap = {
    lot: LOT_TRANSITIONS,
    order: ORDER_TRANSITIONS,
    claim: CLAIM_TRANSITIONS
  };

  const states = stateMap[type];
  const transitions = transitionMap[type];

  if (!states || !Object.values(states).includes(state)) {
    throw new Error(`Invalid state ${state} for type ${type}`);
  }

  return {
    state,
    type,
    isTerminal: transitions[state].length === 0,
    nextPossibleStates: transitions[state] || [],
    isInitial: state === Object.values(states)[0]
  };
}

function validateStateTransitionHistory(transitions, type) {
  if (!Array.isArray(transitions) || transitions.length === 0) {
    return { isValid: false, error: 'No transitions provided' };
  }

  const stateMap = {
    lot: LOT_STATES,
    order: ORDER_STATES,
    claim: CLAIM_STATES
  };

  const transitionMap = {
    lot: LOT_TRANSITIONS,
    order: ORDER_TRANSITIONS,
    claim: CLAIM_TRANSITIONS
  };

  const states = stateMap[type];
  const allowedTransitions = transitionMap[type];

  // Check if first transition starts from initial state
  const initialState = Object.values(states)[0];
  if (transitions[0].from !== initialState) {
    return { 
      isValid: false, 
      error: `First transition must start from initial state ${initialState}` 
    };
  }

  // Validate each transition
  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i];
    
    // Check if transition is valid
    if (!canTransition(transition.from, transition.to, allowedTransitions)) {
      return {
        isValid: false,
        error: `Invalid transition from ${transition.from} to ${transition.to} at step ${i + 1}`
      };
    }

    // Check if transitions are connected
    if (i > 0 && transitions[i - 1].to !== transition.from) {
      return {
        isValid: false,
        error: `Disconnected transitions at step ${i + 1}: previous ended at ${transitions[i - 1].to}, current starts at ${transition.from}`
      };
    }
  }

  return { isValid: true, finalState: transitions[transitions.length - 1].to };
}

// Permission utility
export const hasPermission = (userRole, action, entityType) => {
  const permissions = {
    [UserRole.DEVELOPER]: ['create_project', 'update_project', 'generate_lot', 'add_proof'],
    [UserRole.BUYER]: ['buy_lot', 'create_claim', 'view_orders', 'stake_tokens', 'provide_liquidity'],
    [UserRole.ADMIN]: ['*'], // Admin has all permissions
    [UserRole.AUDITOR]: ['view_*', 'audit_*']
  };
  
  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes('*') || userPermissions.includes(action) || userPermissions.some(p => p.startsWith(action.split('_')[0]));
};

// Export state machine functions
export {
  LOT_STATES,
  ORDER_STATES,
  CLAIM_STATES,
  LOT_TRANSITIONS,
  ORDER_TRANSITIONS,
  CLAIM_TRANSITIONS,
  canTransition,
  transitionLotState,
  transitionOrderState,
  transitionClaimState,
  getStateInfo,
  validateStateTransitionHistory
};

// ES modules exports for Vite compatibility
// All exports are already defined above using export statements