# 🌱 GreenLoop Yield - Decentralized Carbon Credit Platform

**Hackathon Track**: Onchain Finance & Real-World Assets (RWA) - Asset Tokenization  
**Built for**: Hedera Hackathon Africa 2024 🌍

## 🎯 Problem Statement

The global carbon credit market faces critical challenges:

- **Lack of Transparency**: Traditional carbon markets suffer from opacity in verification processes
- **Double Counting**: Same carbon credits sold multiple times across different platforms
- **High Transaction Costs**: Intermediaries inflate costs, reducing benefits for project developers
- **Slow Settlement**: Manual verification processes delay credit issuance by months
- **Limited Access**: Small-scale African projects struggle to access global carbon markets
- **Proof Verification**: Difficulty in verifying the authenticity of environmental impact claims

## 💡 Our Solution: GreenLoop Yield

GreenLoop Yield leverages **Hedera Hashgraph's** fast, secure, and low-cost infrastructure to create a transparent, efficient carbon credit marketplace specifically designed for African projects.

### Key Innovations:

1. **Proof-Based Validation System**
   - Multi-format proof uploads (photos, NDVI satellite data, QC documents)
   - Automated Proof Density Index (PDI) scoring
   - Immutable storage on Hedera File Service (HFS)

2. **Real-Time Transparency**
   - All transactions recorded on Hedera Consensus Service (HCS)
   - Public audit trail with cryptographic verification
   - Real-time status tracking and settlement

3. **Investor Pool Integration**
   - Fractional investment opportunities
   - Automated yield distribution
   - Risk-adjusted returns based on project performance

4. **Smart Escrow System**
   - Automated fund release upon delivery verification
   - Dispute resolution mechanisms
   - Multi-signature security

## 🌟 Features

### 🏪 Carbon Credit Marketplace
- Browse verified carbon credits with real-time pricing
- Advanced filtering by project type, location, and PDI score
- Instant purchase with Hedera Token Service (HTS) integration
- Automated retirement certificate generation

### 📊 Project Management Dashboard
- Create and manage carbon credit projects
- Upload and track verification proofs
- Monitor lot status progression
- Analytics and performance metrics

### 🔒 Secure Order Processing
- Escrow-based order management
- Multi-party settlement system
- Automated payout distribution
- Dispute resolution workflow

### 🏆 Claims & Certification System
- Submit carbon credit retirement claims
- Generate verifiable certificates
- NFT badge issuance for verified claims
- Integration with global registries

### 💰 Investor Pool Platform
- Deposit funds to earn yield from carbon credit trading
- Automated profit sharing from platform fees
- Real-time APY calculations
- Transparent fee structure

## 🔄 Lot Status Flow
```
DRAFT → PROOFED → PENDING_VERIFICATION → VERIFIED → MINTED → LISTED → SOLD → RETIRED
```

**PDI Requirements**: Lots require Proof Density Index ≥70% to transition to LISTED status

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Hedera        │
│   (React)       │◄──►│   (Express)     │◄──►│   Network       │
│                 │    │                 │    │                 │
│ • Marketplace   │    │ • Lot Management│    │ • HCS Topics    │
│ • Dashboard     │    │ • Order Process │    │ • HFS Storage   │
│ • Proof Upload  │    │ • Proof Upload  │    │ • HTS Tokens    │
│ • Investor Pool │    │ • Claims System │    │ • Smart Escrow  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
           │                       │                       │
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Workers       │    │   External      │
│   (PostgreSQL)  │    │                 │    │   Services      │
│                 │    │ • Audit Feed    │    │                 │
│ • Projects      │    │ • HCS Monitor   │    │ • NDVI API      │
│ • Lots          │    │ • Analytics     │    │ • Price Feeds   │
│ • Orders        │    │ • Settlements   │    │ • Notifications │
│ • Proofs        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Modules

1. **Frontend (React + Vite)**
   - Modern React SPA with TypeScript
   - Tailwind CSS for styling
   - React Query for state management
   - Wouter for routing

2. **Backend API (Express + TypeScript)**
   - RESTful API with Vercel serverless functions
   - Drizzle ORM for database operations
   - Zod for request validation
   - Idempotency middleware for safe retries

3. **Database (PostgreSQL)**
   - Neon serverless PostgreSQL
   - Drizzle migrations
   - Optimized indexes for performance

4. **Hedera Integration**
   - **HCS**: Consensus timestamps for audit trails
   - **HFS**: Immutable file storage for proofs
   - **HTS**: Token creation and management
   - **Smart Contracts**: Escrow and settlement logic

5. **Background Workers**
   - Audit feed processing
   - HCS event monitoring
   - Analytics aggregation
   - Settlement automation

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** (LTS recommended)
- **npm** or **yarn**
- **Hedera Testnet Account** ([Get one here](https://portal.hedera.com/))
- **PostgreSQL Database** (Neon recommended)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/greenloop-yield.git
cd "GreenLoop Yield"

# Install dependencies
npm install

# Install global dependencies
npm install -g pm2 drizzle-kit
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Hedera Testnet Configuration
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=your_ed25519_private_key
HEDERA_NETWORK=testnet

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_AUTH_TOKEN=your_neon_auth_token

# API Configuration
API_BASE_URL=http://localhost:5173
NODE_ENV=development

# Feature Flags
USE_REAL_HEDERA=false  # Set to true for testnet integration
ENABLE_WORKERS=true
ENABLE_ANALYTICS=true

# Security
JWT_SECRET=your_jwt_secret_key
IDEMPOTENCY_TTL=3600

# External Services
NDVI_API_KEY=your_ndvi_api_key
NOTIFICATION_WEBHOOK=your_webhook_url
```

### 3. Database Setup

```bash
# Push database schema
npm run db:push

# Seed initial data (optional)
node scripts/seed-database.js
```

### 4. Start Development

```bash
# Start frontend and API
npm run dev

# In another terminal, start workers
npm run workers:dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:5173/api

### 5. Verify Installation

Test the API endpoints:

```bash
# Health check
curl http://localhost:5173/api/health

# Get lots
curl http://localhost:5173/api/lots
```

## 📁 Project Structure

```
├── api/                    # Backend API endpoints
│   ├── lots.ts            # Lot management API
│   ├── proofs/            # Proof upload endpoints
│   │   └── upload.ts      # Main proof upload handler
│   └── home.ts            # Dashboard API
├── client/                # Frontend React application
│   └── src/
│       ├── components/    # React components
│       │   ├── ui/        # UI components
│       │   │   └── proof-pill.jsx  # Proof status indicators
│       │   ├── marketplace.jsx     # Marketplace with PDI filter
│       │   └── lot-card.jsx        # Lot display with proof info
│       └── contexts/      # React contexts
├── shared/                # Shared utilities and schemas
│   ├── schema.js         # Database schema and validation
│   ├── database.js       # Database query helpers
│   └── proof-link.js     # Hedera proof link utilities
└── workers/              # Background workers
    ├── audit-feed.js     # Audit log processing worker
    └── hcs-events.js     # HCS events monitoring worker
```

## 🔄 Background Workers

### Audit Feed Worker

Processes audit logs and system events for compliance tracking.

```bash
# Start audit feed worker
node workers/audit-feed.js
```

**Features:**
- Real-time audit log processing
- Event categorization and severity classification
- Automated compliance reporting
- Integration with monitoring systems

### HCS Events Worker

Monitors Hedera Consensus Service for blockchain events.

```bash
# Start HCS events worker
node workers/hcs-events.js
```

**Features:**
- Real-time HCS topic monitoring
- Event parsing and validation
- Timeline reconstruction
- Consensus timestamp tracking

### Running All Workers

```bash
# Start all workers in development
npm run workers:dev

# Start all workers in production
npm run workers:start

# Stop all workers
npm run workers:stop
```

**Worker Configuration:**

Add to your `.env` file:

```env
# Worker Configuration
WORKER_AUDIT_INTERVAL=5000      # Audit processing interval (ms)
WORKER_HCS_INTERVAL=3000        # HCS polling interval (ms)
WORKER_LOG_LEVEL=info           # Logging level
WORKER_RETRY_ATTEMPTS=3         # Retry attempts on failure

# HCS Topic Configuration
HCS_TOPIC_ID=0.0.123456         # Main HCS topic for events
HCS_AUDIT_TOPIC_ID=0.0.789012   # Audit-specific HCS topic
```

## 🔧 API Endpoints

### Proof Upload

**POST** `/api/proofs/upload`

Upload proof documents for carbon credit lots.

**Request Body:**
```json
{
  "lotId": "lot-123",
  "type": "photo|ndvi|qc",
  "title": "Proof document title",
  "description": "Detailed description",
  "file": "base64-encoded-file-content",
  "fileName": "document.jpg",
  "fileType": "image/jpeg",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proof-456",
    "fileId": "0.0.123456",
    "hcsTransactionId": "0.0.789@1234567890.123456789",
    "pdi": 85,
    "status": "pending"
  },
  "links": {
    "file": "https://hashscan.io/testnet/file/0.0.123456",
    "transaction": "https://hashscan.io/testnet/transaction/0.0.789@1234567890.123456789"
  }
}
```

### Lot Status Transition

**PUT** `/api/lots/{lotId}?action=transition`

Transition lot status with validation.

**Request Body:**
```json
{
  "newStatus": "listed",
  "userId": "user-123",
  "hasValidUploads": true
}
```

## 🎯 Proof Density Index (PDI)

The PDI is calculated based on:
- **Photo proofs**: 30 points each
- **NDVI data**: 40 points each  
- **QC documents**: 30 points each
- **Verification bonus**: +20 points for verified proofs

**Minimum Requirements:**
- PDI ≥70% required to list lots on marketplace
- At least one proof required to transition from DRAFT to PROOFED

## 🔗 Hedera Integration

### File Storage (HFS)
- All proof files stored on Hedera File Service
- Immutable file storage with cryptographic hashes
- Public accessibility via HashScan explorer

### Consensus Service (HCS)
- Proof metadata recorded on Hedera Consensus Service
- Tamper-proof audit trail
- Real-time consensus timestamps

### Network Configuration
- **Testnet**: For development and testing
- **Mainnet**: For production deployment

## 🎨 UI Components

### ProofPill
Displays proof status with visual indicators:
- 🟡 Pending verification
- 🟢 Verified
- 🔴 Rejected
- ⚪ No proof uploaded

### PDI Filter
Marketplace slider filter for Proof Density Index:
- Range: 0-100%
- Step: 10%
- Real-time filtering

### Lot Status Flow
Visual state machine showing lot progression through verification stages.

## 🎬 Demo Workflow (8-Minute Demo)

### Step 1: Upload Parcel + Proof (2 minutes)

1. **Create New Project**
   ```bash
   curl -X POST http://localhost:5173/api/projects \
     -H "Content-Type: application/json" \
     -d '{
       "projectName": "Kenyan Agroforestry Initiative",
       "location": "Nakuru County, Kenya",
       "type": "agroforestry",
       "area": 500,
       "rate": 12.5,
       "bufferPercent": 20,
       "forwardPercent": 30,
       "pricePerTon": 18,
       "developerId": "dev-001"
     }'
   ```

2. **Upload GeoJSON Parcel**
   ```bash
   curl -X POST http://localhost:5173/api/proofs/upload \
     -H "Content-Type: application/json" \
     -d '{
       "projectId": "proj-001",
       "type": "qc",
       "title": "Project Boundary GeoJSON",
       "description": "Verified project boundaries with GPS coordinates",
       "fileContent": "base64-encoded-geojson",
       "fileName": "boundary.geojson",
       "fileType": "application/json",
       "userId": "dev-001"
     }'
   ```

### Step 2: Mint & List Lot (1.5 minutes)

1. **Create Carbon Lot**
   ```bash
   curl -X POST http://localhost:5173/api/lots \
     -H "Content-Type: application/json" \
     -d '{
       "projectId": "proj-001",
       "totalTons": 1000,
       "pricePerTon": 18,
       "developerId": "dev-001"
     }'
   ```

2. **Upload Multiple Proofs**
   ```bash
   # Photo proof
   curl -X POST http://localhost:5173/api/proofs/upload \
     -d '{"lotId":"lot-001","type":"photo","title":"Tree Planting Evidence"}'
   
   # NDVI proof
   curl -X POST http://localhost:5173/api/proofs/upload \
     -d '{"lotId":"lot-001","type":"ndvi","title":"Satellite NDVI Data"}'
   
   # QC proof
   curl -X POST http://localhost:5173/api/proofs/upload \
     -d '{"lotId":"lot-001","type":"qc","title":"Third-party Verification"}'
   ```

3. **Transition to Listed**
   ```bash
   curl -X PUT http://localhost:5173/api/lots/lot-001?action=transition \
     -d '{"newStatus":"listed","userId":"dev-001"}'
   ```

### Step 3: Buy Carbon Credits (1 minute)

```bash
curl -X POST http://localhost:5173/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "lotId": "lot-001",
    "tons": 100,
    "buyerId": "buyer-001",
    "pricePerTon": 18
  }'
```

### Step 4: Deliver & Settle (1.5 minutes)

1. **Process Order**
   ```bash
   curl -X PUT http://localhost:5173/api/orders/order-001?action=process \
     -d '{"userId":"dev-001"}'
   ```

2. **Deliver Credits**
   ```bash
   curl -X PUT http://localhost:5173/api/orders/order-001?action=deliver \
     -d '{"deliveryRef":"HTS-TOKEN-001","userId":"dev-001"}'
   ```

3. **Complete Settlement**
   ```bash
   curl -X PUT http://localhost:5173/api/orders/order-001?action=settle \
     -d '{"payoutTxHash":"0x123abc","userId":"system"}'
   ```

### Step 5: Investor Deposit (1 minute)

```bash
curl -X POST http://localhost:5173/api/investor/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "investor-001",
    "amount": 5000,
    "txHash": "0x456def"
  }'
```

### Step 6: Audit Feed Demo (1 minute)

1. **View Audit Trail**
   ```bash
   curl http://localhost:5173/api/audit?entityId=lot-001
   ```

2. **Check HCS Events**
   ```bash
   curl http://localhost:5173/api/hcs-events?topicId=0.0.123456
   ```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:e2e
```

### Real Hedera Testing
```bash
npm run test:real-hedera
```

### Test Coverage
```bash
npm run test:coverage
```

## 🔒 Security

- **File Validation**: Size limits and type checking
- **Authentication**: Required for all write operations
- **Rate Limiting**: Prevents abuse of upload endpoints
- **Audit Logging**: All actions tracked for compliance

## 📊 Analytics

The platform tracks:
- Proof upload events
- PDI calculations
- Status transitions
- Marketplace interactions
- User engagement metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@greenloopyield.com

---

**Built for Hedera Hackathon Africa 2024** 🌍

Track: Onchain Finance & Real-World Assets (RWA) - Asset Tokenization