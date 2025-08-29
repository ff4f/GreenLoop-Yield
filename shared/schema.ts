import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Carbon Credit Lots (PBCL)
export const carbonLots = pgTable("carbon_lots", {
  id: varchar("id").primaryKey(),
  lotId: varchar("lot_id").notNull().unique(),
  projectName: text("project_name").notNull(),
  location: text("location").notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  units: integer("units"),
  listedTons: decimal("listed_tons", { precision: 10, scale: 2 }).notNull(),
  pricePerTon: decimal("price_per_ton", { precision: 10, scale: 2 }).notNull(),
  deliveryWindow: text("delivery_window").notNull(),
  bufferPercent: decimal("buffer_percent", { precision: 5, scale: 2 }),
  forwardPercent: decimal("forward_percent", { precision: 5, scale: 2 }),
  status: text("status").notNull().default("LISTED"),
  tokenId: varchar("token_id"),
  proofHashes: jsonb("proof_hashes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().unique(),
  lotId: varchar("lot_id").notNull(),
  buyerAccount: varchar("buyer_account").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  pricePerTon: decimal("price_per_ton", { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("ESCROWED"),
  escrowTxHash: varchar("escrow_tx_hash"),
  deliveryTxHash: varchar("delivery_tx_hash"),
  payoutTxHash: varchar("payout_tx_hash"),
  contractFileId: varchar("contract_file_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Proof Entries
export const proofEntries = pgTable("proof_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lotId: varchar("lot_id"),
  proofType: text("proof_type").notNull(),
  hash: varchar("hash").notNull(),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
  topicId: varchar("topic_id"),
  sequenceNumber: integer("sequence_number"),
  fileId: varchar("file_id"),
  metadata: jsonb("metadata"),
});

// Claims
export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().unique(),
  buyerName: text("buyer_name").notNull(),
  jurisdiction: text("jurisdiction"),
  csrLink: text("csr_link"),
  claimYear: integer("claim_year").notNull(),
  totalTons: decimal("total_tons", { precision: 10, scale: 2 }).notNull(),
  lots: jsonb("lots").notNull(),
  pdfFileId: varchar("pdf_file_id"),
  jsonFileId: varchar("json_file_id"),
  anchorTopicId: varchar("anchor_topic_id"),
  anchorSequence: integer("anchor_sequence"),
  badgeTokenId: varchar("badge_token_id"),
  status: text("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Project Sheets
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

// Insert schemas
export const insertCarbonLotSchema = createInsertSchema(carbonLots).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertProofEntrySchema = createInsertSchema(proofEntries).omit({
  id: true,
  timestamp: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSheetSchema = createInsertSchema(projectSheets).omit({
  id: true,
  createdAt: true,
});

// Types
export type CarbonLot = typeof carbonLots.$inferSelect;
export type InsertCarbonLot = z.infer<typeof insertCarbonLotSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type ProofEntry = typeof proofEntries.$inferSelect;
export type InsertProofEntry = z.infer<typeof insertProofEntrySchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type ProjectSheet = typeof projectSheets.$inferSelect;
export type InsertProjectSheet = z.infer<typeof insertProjectSheetSchema>;
