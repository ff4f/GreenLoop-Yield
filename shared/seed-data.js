// Seed Data for GreenLoop Yield Demo
// Provides consistent mock data for marketplace lots, orders, proofs, and claims

import { 
  ProjectType, 
  LotStatus, 
  OrderStatus, 
  ClaimStatus, 
  ProofType,
  UserRole,
  MOCK_IDS,
  calculateOrderFees
} from './schema.js';

// Mock user accounts
export const MOCK_USERS = {
  DEVELOPER_1: {
    id: 'dev_001',
    name: 'EcoForest Solutions',
    role: UserRole.DEVELOPER,
    wallet: '0.0.123456'
  },
  DEVELOPER_2: {
    id: 'dev_002', 
    name: 'Carbon Capture Co',
    role: UserRole.DEVELOPER,
    wallet: '0.0.123457'
  },
  BUYER_1: {
    id: 'buyer_001',
    name: 'GreenTech Corp',
    role: UserRole.BUYER,
    wallet: '0.0.234567'
  },
  BUYER_2: {
    id: 'buyer_002',
    name: 'Sustainable Industries',
    role: UserRole.BUYER, 
    wallet: '0.0.234568'
  },
  ADMIN: {
    id: 'admin_001',
    name: 'Platform Admin',
    role: UserRole.ADMIN,
    wallet: '0.0.345678'
  },
  AUDITOR: {
    id: 'auditor_001',
    name: 'Carbon Auditor',
    role: UserRole.AUDITOR,
    wallet: '0.0.456789'
  }
};

// Seed Projects
export const SEED_PROJECTS = [
  {
    id: 'proj_001',
    projectName: 'Amazon Rainforest Conservation',
    location: 'Brazil, Amazon Basin',
    type: ProjectType.NATURE,
    area: 1000,
    rate: 12.5,
    bufferPercent: 20,
    forwardPercent: 30,
    pricePerTon: 25,
    totalTons: 12500,
    developerId: MOCK_USERS.DEVELOPER_1.id,
    uploads: [
      { type: 'satellite', url: '/images/amazon-satellite.jpg' },
      { type: 'certificate', url: '/docs/vcs-cert-001.pdf' }
    ],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'proj_002',
    projectName: 'Clean Cookstove Distribution',
    location: 'Kenya, Rural Communities',
    type: ProjectType.COOKSTOVE,
    units: 5000,
    rate: 8.2,
    bufferPercent: 15,
    forwardPercent: 25,
    pricePerTon: 18,
    totalTons: 41000,
    developerId: MOCK_USERS.DEVELOPER_2.id,
    uploads: [
      { type: 'field_report', url: '/docs/cookstove-report.pdf' },
      { type: 'photos', url: '/images/cookstove-installation.jpg' }
    ],
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  }
];

// Seed Carbon Lots (8 marketplace lots) with DeFi yield features
export const SEED_LOTS = [
  {
    id: 'lot_001',
    projectId: 'proj_001',
    projectName: 'Amazon Rainforest Conservation',
    location: 'Brazil, Amazon Basin',
    type: ProjectType.NATURE,
    area: 1000,
    rate: 12.5,
    bufferPercent: 20,
    forwardPercent: 30,
    pricePerTon: 25,
    currentPrice: 27.25, // Current market price for yield calculation
    initialPrice: 25, // Original purchase price
    totalTons: 2500,
    availableTons: 2500,
    status: LotStatus.LISTED,
    developerId: MOCK_USERS.DEVELOPER_1.id,
    expectedYield: 0.12, // 12% expected annual yield
    riskRating: 'medium',
    yieldType: 'carbon_appreciation',
    stakingEnabled: true,
    stakingAPY: 0.15, // 15% staking rewards
    liquidityPoolId: 'pool_001',
    tokenId: '0.0.789012', // Hedera Token ID
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'lot_002',
    projectId: 'proj_001',
    projectName: 'Amazon Rainforest Conservation',
    location: 'Brazil, Amazon Basin',
    type: ProjectType.NATURE,
    area: 1000,
    rate: 12.5,
    bufferPercent: 20,
    forwardPercent: 30,
    pricePerTon: 25,
    currentPrice: 26.10,
    initialPrice: 25,
    totalTons: 3000,
    availableTons: 2200,
    status: LotStatus.ESCROWED,
    developerId: MOCK_USERS.DEVELOPER_1.id,
    expectedYield: 0.08,
    riskRating: 'low',
    yieldType: 'carbon_appreciation',
    stakingEnabled: true,
    stakingAPY: 0.12,
    liquidityPoolId: 'pool_002',
    tokenId: '0.0.789013',
    createdAt: new Date('2024-01-16').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'lot_003',
    projectId: 'proj_002',
    projectName: 'Clean Cookstove Distribution',
    location: 'Kenya, Rural Communities',
    type: ProjectType.COOKSTOVE,
    units: 5000,
    rate: 8.2,
    bufferPercent: 15,
    forwardPercent: 25,
    pricePerTon: 18,
    currentPrice: 19.35,
    initialPrice: 18,
    totalTons: 8200,
    availableTons: 8200,
    status: LotStatus.LISTED,
    developerId: MOCK_USERS.DEVELOPER_2.id,
    expectedYield: 0.10,
    riskRating: 'medium',
    yieldType: 'carbon_appreciation',
    stakingEnabled: true,
    stakingAPY: 0.14,
    liquidityPoolId: 'pool_001',
    tokenId: '0.0.789014',
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  },
  {
    id: 'lot_004',
    projectId: 'proj_001',
    projectName: 'Amazon Rainforest Conservation',
    location: 'Brazil, Amazon Basin',
    type: ProjectType.NATURE,
    area: 800,
    rate: 11.8,
    bufferPercent: 18,
    forwardPercent: 28,
    pricePerTon: 24,
    currentPrice: 25.20,
    initialPrice: 24,
    totalTons: 2000,
    availableTons: 2000,
    status: LotStatus.LISTED,
    developerId: MOCK_USERS.DEVELOPER_1.id,
    expectedYield: 0.09,
    riskRating: 'low',
    yieldType: 'carbon_appreciation',
    stakingEnabled: false,
    stakingAPY: 0.00,
    liquidityPoolId: null,
    tokenId: '0.0.789015',
    createdAt: new Date('2024-01-25').toISOString(),
    updatedAt: new Date('2024-01-25').toISOString()
  },
  {
    id: 'lot_005',
    projectId: 'proj_002',
    projectName: 'Clean Cookstove Distribution',
    location: 'Kenya, Rural Communities',
    type: ProjectType.COOKSTOVE,
    units: 3000,
    rate: 7.8,
    bufferPercent: 16,
    forwardPercent: 24,
    pricePerTon: 17,
    currentPrice: 18.02,
    initialPrice: 17,
    totalTons: 5850,
    availableTons: 4200,
    status: LotStatus.DELIVERED,
    developerId: MOCK_USERS.DEVELOPER_2.id,
    expectedYield: 0.11,
    riskRating: 'medium',
    yieldType: 'carbon_appreciation',
    stakingEnabled: true,
    stakingAPY: 0.13,
    liquidityPoolId: 'pool_002',
    tokenId: '0.0.789016',
    createdAt: new Date('2024-01-28').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString()
  },
  {
    id: 'lot_006',
    projectId: 'proj_001',
    projectName: 'Amazon Rainforest Conservation',
    location: 'Brazil, Amazon Basin',
    type: ProjectType.AGROFORESTRY,
    area: 1200,
    rate: 9.5,
    bufferPercent: 22,
    forwardPercent: 32,
    pricePerTon: 22,
    currentPrice: 23.54,
    initialPrice: 22,
    totalTons: 2850,
    availableTons: 2850,
    status: LotStatus.LISTED,
    developerId: MOCK_USERS.DEVELOPER_1.id,
    expectedYield: 0.14,
    riskRating: 'high',
    yieldType: 'carbon_appreciation',
    stakingEnabled: true,
    stakingAPY: 0.18,
    liquidityPoolId: 'pool_001',
    tokenId: '0.0.789017',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'lot_007',
    projectId: 'proj_002',
    projectName: 'Methane Capture Initiative',
    location: 'India, Agricultural Regions',
    type: ProjectType.METHANE,
    units: 2500,
    rate: 15.2,
    bufferPercent: 12,
    forwardPercent: 20,
    pricePerTon: 28,
    currentPrice: 30.24,
    initialPrice: 28,
    totalTons: 9500,
    availableTons: 9500,
    status: LotStatus.LISTED,
    developerId: MOCK_USERS.DEVELOPER_2.id,
    expectedYield: 0.16,
    riskRating: 'high',
    yieldType: 'carbon_appreciation',
    stakingEnabled: true,
    stakingAPY: 0.20,
    liquidityPoolId: 'pool_002',
    tokenId: '0.0.789018',
    createdAt: new Date('2024-02-05').toISOString(),
    updatedAt: new Date('2024-02-05').toISOString()
  },
  {
    id: 'lot_008',
    projectId: 'proj_001',
    projectName: 'Amazon Rainforest Conservation',
    location: 'Brazil, Amazon Basin',
    type: ProjectType.NATURE,
    area: 600,
    rate: 13.2,
    bufferPercent: 25,
    forwardPercent: 35,
    pricePerTon: 26,
    currentPrice: 28.08,
    initialPrice: 26,
    totalTons: 1980,
    availableTons: 1200,
    status: LotStatus.SETTLED,
    developerId: MOCK_USERS.DEVELOPER_1.id,
    expectedYield: 0.13,
    riskRating: 'medium',
    yieldType: 'carbon_appreciation',
    stakingEnabled: false,
    stakingAPY: 0.00,
    liquidityPoolId: null,
    tokenId: '0.0.789019',
    createdAt: new Date('2024-02-08').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString()
  }
];

// Seed Orders with DeFi yield tracking
export const SEED_ORDERS = [
  {
    id: 'order_001',
    lotId: 'lot_002',
    buyerId: MOCK_USERS.BUYER_1.id,
    tons: 800,
    pricePerTon: 25,
    ...calculateOrderFees(800, 25),
    status: OrderStatus.ESCROWED,
    escrowTxHash: MOCK_IDS.TX_HASHES.ESCROW,
    // DeFi yield tracking
    yieldPositionId: 'yield_001',
    stakingPositionId: 'stake_001',
    lpPositionId: null,
    expectedAPY: 0.12,
    currentValue: 21600.00,
    yieldEarned: 0.00,
    autoCompound: true,
    yieldStrategy: 'carbon_appreciation_staking',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'order_002',
    lotId: 'lot_005',
    buyerId: MOCK_USERS.BUYER_2.id,
    tons: 1650,
    pricePerTon: 17,
    ...calculateOrderFees(1650, 17),
    status: OrderStatus.DELIVERED,
    escrowTxHash: MOCK_IDS.TX_HASHES.ESCROW,
    deliveryRef: MOCK_IDS.HFS_FILES.DELIVERY_CERT,
    // DeFi yield tracking
    yieldPositionId: 'yield_002',
    stakingPositionId: 'stake_002',
    lpPositionId: 'lp_002',
    expectedAPY: 0.08,
    currentValue: 29742.50,
    yieldEarned: 1692.50,
    autoCompound: false,
    yieldStrategy: 'carbon_appreciation_liquidity',
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString()
  },
  {
    id: 'order_003',
    lotId: 'lot_008',
    buyerId: MOCK_USERS.BUYER_1.id,
    tons: 780,
    pricePerTon: 26,
    ...calculateOrderFees(780, 26),
    status: OrderStatus.SETTLED,
    escrowTxHash: MOCK_IDS.TX_HASHES.ESCROW,
    deliveryRef: MOCK_IDS.HFS_FILES.DELIVERY_CERT,
    payoutTxHash: MOCK_IDS.TX_HASHES.PAYOUT,
    // DeFi yield tracking
    yieldPositionId: null,
    stakingPositionId: null,
    lpPositionId: null,
    expectedAPY: 0.00,
    currentValue: 21684.00,
    yieldEarned: 1624.00,
    autoCompound: false,
    yieldStrategy: 'carbon_appreciation',
    createdAt: new Date('2024-02-12').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString()
  }
];

// Seed Proofs
export const SEED_PROOFS = [
  {
    id: 'proof_001',
    projectId: 'proj_001',
    type: ProofType.PHOTO,
    title: 'Forest Canopy Monitoring',
    description: 'Aerial photography showing healthy forest canopy growth in conservation area.',
    imageUrl: '/images/forest-canopy.jpg',
    proofHash: MOCK_IDS.PROOF_HASHES.PHOTO,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    submittedBy: MOCK_USERS.DEVELOPER_1.id,
    createdAt: new Date('2024-01-16').toISOString()
  },
  {
    id: 'proof_002',
    projectId: 'proj_001',
    type: ProofType.NDVI,
    title: 'Vegetation Health Index',
    description: 'NDVI satellite data showing improved vegetation density over 6-month period.',
    imageUrl: '/images/ndvi-analysis.jpg',
    proofHash: MOCK_IDS.PROOF_HASHES.NDVI,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    submittedBy: MOCK_USERS.DEVELOPER_1.id,
    createdAt: new Date('2024-01-22').toISOString()
  },
  {
    id: 'proof_003',
    projectId: 'proj_002',
    type: ProofType.QC,
    title: 'Cookstove Installation Verification',
    description: 'Quality control inspection of 500 cookstove installations in rural communities.',
    imageUrl: '/images/cookstove-qc.jpg',
    proofHash: MOCK_IDS.PROOF_HASHES.QC,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    submittedBy: MOCK_USERS.DEVELOPER_2.id,
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: 'proof_004',
    projectId: 'proj_001',
    type: ProofType.PHOTO,
    title: 'Wildlife Biodiversity Survey',
    description: 'Camera trap footage documenting increased wildlife activity in protected areas.',
    imageUrl: '/images/wildlife-survey.jpg',
    proofHash: MOCK_IDS.PROOF_HASHES.PHOTO,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    submittedBy: MOCK_USERS.DEVELOPER_1.id,
    createdAt: new Date('2024-02-03').toISOString()
  },
  {
    id: 'proof_005',
    projectId: 'proj_002',
    type: ProofType.PHOTO,
    title: 'Community Training Session',
    description: 'Documentation of cookstove maintenance training for local community members.',
    imageUrl: '/images/community-training.jpg',
    proofHash: MOCK_IDS.PROOF_HASHES.PHOTO,
    hcsTopicId: MOCK_IDS.HCS_TOPICS.PROOF,
    submittedBy: MOCK_USERS.DEVELOPER_2.id,
    createdAt: new Date('2024-02-08').toISOString()
  }
];

// Seed Claims
export const SEED_CLAIMS = [
  {
    id: 'claim_001',
    orderId: 'order_003',
    buyerId: MOCK_USERS.BUYER_1.id,
    status: ClaimStatus.COMPLETE,
    stepData: {
      step1: { buyerName: 'GreenTech Corp', jurisdiction: 'United States' },
      step2: { csrLink: 'https://greentech.com/sustainability' },
      step3: { claimYear: 2024 },
      step4: { totalTons: 780, lots: ['lot_008'] },
      step5: { validated: true },
      step6: { pdfGenerated: true },
      step7: { jsonGenerated: true },
      step8: { anchored: true, badgeIssued: true }
    },
    pdfFileId: MOCK_IDS.HFS_FILES.CLAIM_PDF,
    jsonFileId: MOCK_IDS.HFS_FILES.CLAIM_JSON,
    anchorTxHash: MOCK_IDS.TX_HASHES.DELIVERY,
    badgeTokenId: MOCK_IDS.HTS_TOKENS.NFT_BADGE,
    createdAt: new Date('2024-02-18').toISOString(),
    updatedAt: new Date('2024-02-22').toISOString()
  },
  {
    id: 'claim_002',
    orderId: 'order_002',
    buyerId: MOCK_USERS.BUYER_2.id,
    status: ClaimStatus.VALIDATED,
    stepData: {
      step1: { buyerName: 'Sustainable Industries', jurisdiction: 'Canada' },
      step2: { csrLink: 'https://sustainableindustries.ca/csr' },
      step3: { claimYear: 2024 },
      step4: { totalTons: 1650, lots: ['lot_005'] },
      step5: { validated: true }
    },
    createdAt: new Date('2024-02-16').toISOString(),
    updatedAt: new Date('2024-02-17').toISOString()
  }
];

// Analytics seed data
export const SEED_ANALYTICS = [
  {
    id: 'analytics_001',
    metric: 'marketplace_views',
    value: 1247,
    metadata: { period: 'last_30_days' },
    timestamp: new Date().toISOString()
  },
  {
    id: 'analytics_002',
    metric: 'proof_submissions',
    value: 23,
    metadata: { period: 'last_30_days' },
    timestamp: new Date().toISOString()
  },
  {
    id: 'analytics_003',
    metric: 'avg_price_per_ton',
    value: 23.45,
    metadata: { currency: 'USD' },
    timestamp: new Date().toISOString()
  },
  {
    id: 'analytics_004',
    metric: 'total_orders',
    value: 156,
    metadata: { status: 'all' },
    timestamp: new Date().toISOString()
  }
];

// Audit log seed data
export const SEED_AUDIT_LOG = [
  {
    id: 'audit_001',
    userId: MOCK_USERS.DEVELOPER_1.id,
    action: 'generate_lot',
    entityType: 'lot',
    entityId: 'lot_001',
    changes: { status: 'DRAFT -> LISTED', totalTons: 2500 },
    timestamp: new Date('2024-01-15').toISOString()
  },
  {
    id: 'audit_002',
    userId: MOCK_USERS.BUYER_1.id,
    action: 'buy_lot',
    entityType: 'order',
    entityId: 'order_001',
    changes: { tons: 800, total: 21600 },
    timestamp: new Date('2024-02-01').toISOString()
  },
  {
    id: 'audit_003',
    userId: MOCK_USERS.DEVELOPER_1.id,
    action: 'add_proof',
    entityType: 'proof',
    entityId: 'proof_001',
    changes: { type: 'photo', proofHash: MOCK_IDS.PROOF_HASHES.PHOTO },
    timestamp: new Date('2024-01-16').toISOString()
  }
];

// DeFi Yield Positions Data
export const SEED_YIELD_POSITIONS = [
  {
    id: 'yield_001',
    userId: 'user_001',
    lotId: 'lot_001',
    principal: 2550.00,
    currentValue: 2742.75,
    yieldEarned: 192.75,
    apy: 0.12, // 12% APY
    startDate: '2024-01-01T00:00:00Z',
    lastCalculated: '2024-01-15T12:00:00Z',
    status: 'active',
    yieldType: 'carbon_appreciation',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: 'yield_002',
    userId: 'user_002',
    lotId: 'lot_002',
    principal: 1275.00,
    currentValue: 1338.75,
    yieldEarned: 63.75,
    apy: 0.08, // 8% APY
    startDate: '2024-01-05T00:00:00Z',
    lastCalculated: '2024-01-15T12:00:00Z',
    status: 'active',
    yieldType: 'carbon_appreciation',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  }
];

// Staking Positions Data
export const SEED_STAKING_POSITIONS = [
  {
    id: 'stake_001',
    userId: 'user_001',
    tokenId: '0.0.123456',
    stakedAmount: 1000.00,
    rewardRate: 0.15, // 15% APY
    stakingStartDate: '2024-01-01T00:00:00Z',
    lastRewardClaim: '2024-01-10T00:00:00Z',
    totalRewardsClaimed: 41.10,
    pendingRewards: 20.55,
    lockPeriod: 90, // 90 days
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: 'stake_002',
    userId: 'user_002',
    tokenId: '0.0.123456',
    stakedAmount: 500.00,
    rewardRate: 0.15,
    stakingStartDate: '2024-01-08T00:00:00Z',
    lastRewardClaim: '2024-01-08T00:00:00Z',
    totalRewardsClaimed: 0.00,
    pendingRewards: 14.38,
    lockPeriod: 90,
    status: 'active',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  }
];

// Liquidity Pools Data
export const SEED_LIQUIDITY_POOLS = [
  {
    id: 'pool_001',
    tokenA: '0.0.123456', // HBAR
    tokenB: '0.0.789012', // Carbon Credit Token
    totalValueLocked: 125000.00,
    dailyVolume: 15000.00,
    feeRate: 0.003, // 0.3%
    apy: 0.25, // 25% APY
    totalLPTokens: 10000.00,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: 'pool_002',
    tokenA: '0.0.789012', // Carbon Credit Token
    tokenB: '0.0.345678', // USDC
    totalValueLocked: 87500.00,
    dailyVolume: 8500.00,
    feeRate: 0.003,
    apy: 0.18, // 18% APY
    totalLPTokens: 7500.00,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  }
];

// LP Positions Data
export const SEED_LP_POSITIONS = [
  {
    id: 'lp_001',
    userId: 'user_001',
    poolId: 'pool_001',
    lpTokens: 250.00,
    liquidityProvided: 3125.00,
    feesEarned: 78.13,
    impermanentLoss: -12.50,
    entryPrice: 12.50,
    currentPrice: 12.75,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: 'lp_002',
    userId: 'user_002',
    poolId: 'pool_002',
    lpTokens: 150.00,
    liquidityProvided: 1750.00,
    feesEarned: 31.50,
    impermanentLoss: -5.25,
    entryPrice: 11.67,
    currentPrice: 12.00,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  }
]

// Export all seed data
export const SEED_DATA = {
  users: MOCK_USERS,
  projects: SEED_PROJECTS,
  lots: SEED_LOTS,
  orders: SEED_ORDERS,
  proofs: SEED_PROOFS,
  claims: SEED_CLAIMS,
  analytics: SEED_ANALYTICS,
  auditLog: SEED_AUDIT_LOG,
  yieldPositions: SEED_YIELD_POSITIONS,
  stakingPositions: SEED_STAKING_POSITIONS,
  liquidityPools: SEED_LIQUIDITY_POOLS,
  lpPositions: SEED_LP_POSITIONS
};

export default SEED_DATA;