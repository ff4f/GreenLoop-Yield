// Microcopy constants for GreenLoop Yield Dashboard
// Centralized text content for guards, empty states, success messages, and UI labels

export const GUARDS = {
  WALLET_REQUIRED: {
    title: "Connect Wallet Required",
    description: "Please connect your Hedera wallet to proceed with this action.",
    action: "Connect Wallet"
  },
  UPLOAD_REQUIRED: {
    title: "Upload Required",
    description: "Please upload at least one document before proceeding.",
    action: "Upload Document"
  },
  BUFFER_VALIDATION: {
    title: "Buffer Validation",
    description: "Buffer percentage must be between 10-30% for optimal risk management.",
    tooltip: "Buffer helps account for measurement uncertainties and ensures conservative estimates."
  },
  FORM_INCOMPLETE: {
    title: "Form Incomplete",
    description: "Please complete all required fields before proceeding.",
    action: "Review Form"
  }
};

export const EMPTY_STATES = {
  NO_PROJECTS: {
    icon: "📋",
    title: "No Projects Yet",
    description: "Create your first carbon credit project to get started.",
    action: "Create Project"
  },
  NO_LOTS: {
    icon: "📦",
    title: "No Lots Available",
    description: "Generate your first lot from a completed project.",
    action: "Generate Lot"
  },
  NO_ORDERS: {
    icon: "🛒",
    title: "No Orders Yet",
    description: "Your carbon credit orders will appear here once you make a purchase.",
    action: "Browse Marketplace"
  },
  NO_EVIDENCE: {
    icon: "🔍",
    title: "No Evidence Recorded",
    description: "Proof evidence from your actions will appear here.",
    action: "Start Working"
  },
  NO_CLAIMS: {
    icon: "📋",
    title: "No Claims Started",
    description: "Begin the claims process to validate your carbon credits.",
    action: "Start Claims"
  },
  NO_SEARCH_RESULTS: {
    icon: "🔍",
    title: "No Results Found",
    description: "Try adjusting your search criteria or filters.",
    action: "Clear Filters"
  }
};

export const SUCCESS_MESSAGES = {
  EVIDENCE: {
    tx: "Transaction verified on Hedera",
    file: "File secured on Hedera File Service",
    topic: "Message anchored on Hedera Consensus Service",
    token: "Token created on Hedera Token Service",
    default: "Evidence recorded successfully"
  },
  ACTIONS: {
    LOT_GENERATED: "Lot generated successfully! Your carbon credits are now tokenized.",
    ORDER_CREATED: "Purchase order created successfully! Funds are held in escrow.",
    ORDER_PLACED: "Order placed successfully! Funds are held in escrow.",
    ORDER_DELIVERED: "Delivery confirmed successfully! Carbon credits marked as delivered.",
    ESCROW_RELEASED: "Escrow released successfully! Payment transferred to seller.",
    PROOF_UPLOADED: "Proof uploaded successfully! Evidence added to timeline.",
    CLAIM_SUBMITTED: "Claim submitted successfully! Validation in progress.",
    WALLET_CONNECTED: "Wallet connected successfully!",
    FILE_UPLOADED: "File uploaded successfully!"
  }
};

export const EVIDENCE_MICROCOPY = {
  tx: {
    default: "Transaction completed",
    create: "Transaction created",
    mint: "Token minted",
    transfer: "Transfer completed",
    escrow: "Escrow transaction",
    release: "Escrow released"
  },
  file: {
    default: "File stored on HFS",
    upload: "File uploaded",
    certificate: "Certificate stored",
    document: "Document archived",
    proof: "Proof document stored"
  },
  topic: {
    default: "Message submitted to HCS",
    lot_listed: "Lot listing published",
    order_placed: "Order placement recorded",
    order_delivered: "Delivery confirmation",
    proof_uploaded: "Proof submission recorded",
    claim_submitted: "Claim submission recorded"
  },
  token: {
    default: "Token minted",
    create: "Token created",
    mint: "Carbon credits minted",
    nft: "NFT certificate created"
  }
};

export const UI_LABELS = {
  BUTTONS: {
    CONNECT_WALLET: "Connect Wallet",
    GENERATE_LOT: "Generate Lot",
    BUY_NOW: "Buy Now",
    MARK_DELIVERED: "Mark Delivered",
    RELEASE_ESCROW: "Release Escrow",
    ADD_PROOF: "Add Proof",
    START_CLAIM: "Start Claim",
    VIEW_PROOF: "View Proof",
    COPY_ID: "Copy ID",
    CLEAR_ALL: "Clear All",
    UPLOAD_FILE: "Upload File",
    SAVE_DRAFT: "Save Draft",
    SUBMIT: "Submit"
  },
  TABS: {
    PROJECT_SHEETS: "Project Sheets",
    PRICING_CALCULATOR: "Pricing Calculator",
    STATE_MACHINE: "State Machine",
    PROOF_FIRST: "Proof-First",
    MARKETPLACE: "Marketplace",
    ORDERS: "Orders",
    PROOF_FEED: "Proof Feed",
    CLAIMS_HELPER: "Claims Helper",
    HEDERA_TOOLS: "Hedera Tools"
  },
  STATUS: {
    DRAFT: "Draft",
    PENDING: "Pending",
    VALIDATED: "Validated",
    LISTED: "Listed",
    SOLD: "Sold",
    DELIVERED: "Delivered",
    SETTLED: "Settled",
    CANCELLED: "Cancelled"
  }
};

export const TOOLTIPS = {
  BUFFER_PERCENTAGE: "Buffer accounts for measurement uncertainties and ensures conservative carbon credit estimates. Recommended range: 10-30%.",
  PROOF_INSPECTOR: "View all blockchain evidence and proof records from your actions.",
  HASHSCAN_LINK: "View this transaction, file, or message on Hashscan explorer.",
  ICVCM_BADGE: "This lot meets ICVCM (Integrity Council for the Voluntary Carbon Market) standards.",
  ESCROW_PROTECTION: "Your payment is held in escrow until delivery is confirmed.",
  HFS_STORAGE: "Files are stored on Hedera File Service for immutable record keeping.",
  HCS_CONSENSUS: "Messages are anchored on Hedera Consensus Service for timestamped proof.",
  HTS_TOKENIZATION: "Carbon credits are tokenized using Hedera Token Service."
};

// Helper functions for dynamic content
export const getEvidenceMicrocopy = (kind, action) => {
  const category = EVIDENCE_MICROCOPY[kind];
  if (!category) return EVIDENCE_MICROCOPY.default;
  return category[action] || category.default;
};

export const getSuccessMessage = (kind) => {
  return SUCCESS_MESSAGES.EVIDENCE[kind] || SUCCESS_MESSAGES.EVIDENCE.default;
};

export const getEmptyState = (type) => {
  return EMPTY_STATES[type] || EMPTY_STATES.NO_SEARCH_RESULTS;
};

export const getGuard = (type) => {
  return GUARDS[type] || GUARDS.FORM_INCOMPLETE;
};