CREATE TABLE "analytics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"metric" varchar(100) NOT NULL,
	"value" numeric(15, 2) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carbon_lots" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"area" numeric(10, 2),
	"units" integer,
	"rate" numeric(5, 2) NOT NULL,
	"buffer_percent" numeric(5, 2) NOT NULL,
	"forward_percent" numeric(5, 2) NOT NULL,
	"price_per_ton" numeric(8, 2) NOT NULL,
	"total_tons" numeric(10, 2) NOT NULL,
	"available_tons" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"developer_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"buyer_id" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"step_data" jsonb DEFAULT '{}'::jsonb,
	"pdf_file_id" varchar(255),
	"json_file_id" varchar(255),
	"anchor_tx_hash" varchar(255),
	"badge_token_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"lot_id" varchar(255) NOT NULL,
	"buyer_id" varchar(255) NOT NULL,
	"tons" numeric(10, 2) NOT NULL,
	"price_per_ton" numeric(8, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"platform_fee" numeric(12, 2) NOT NULL,
	"retirement_fee" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'CREATED' NOT NULL,
	"escrow_tx_hash" varchar(255),
	"delivery_ref" varchar(255),
	"payout_tx_hash" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_sheets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_name" text NOT NULL,
	"location" text NOT NULL,
	"area" numeric(10, 2),
	"rate_per_ha_per_year" numeric(5, 2),
	"buffer_percent" numeric(5, 2),
	"forward_percent" numeric(5, 2),
	"expected_tons" numeric(10, 2),
	"after_buffer_tons" numeric(10, 2),
	"listed_tons" numeric(10, 2),
	"estimated_value" numeric(12, 2),
	"lot_id" varchar,
	"token_id" varchar,
	"files" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_name" varchar(80) NOT NULL,
	"location" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"area" numeric(10, 2),
	"units" integer,
	"rate" numeric(5, 2) NOT NULL,
	"buffer_percent" numeric(5, 2) NOT NULL,
	"forward_percent" numeric(5, 2) NOT NULL,
	"price_per_ton" numeric(8, 2) NOT NULL,
	"total_tons" numeric(10, 2) NOT NULL,
	"developer_id" varchar(255) NOT NULL,
	"uploads" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proofs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"proof_hash" varchar(255),
	"hcs_topic_id" varchar(255),
	"submitted_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
