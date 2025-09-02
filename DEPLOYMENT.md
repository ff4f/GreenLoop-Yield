# GreenLoop Yield - Deployment Guide

## Environment Variables Setup

### For Local Development
1. Copy `.env.example` to `.env`
2. Update the following variables:
   - `REACT_APP_HEDERA_OPERATOR_ID`: Your Hedera testnet account ID
   - `REACT_APP_HEDERA_OPERATOR_KEY`: Your Hedera private key
   - `DATABASE_URL`: Your PostgreSQL connection string

### For Vercel Deployment

#### Required Environment Variables in Vercel Dashboard:

```bash
# Hedera Configuration
REACT_APP_HEDERA_NETWORK=testnet
REACT_APP_HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
REACT_APP_HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
REACT_APP_HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Application Configuration
REACT_APP_API_BASE_URL=/api
REACT_APP_ENVIRONMENT=production

# DeFi Configuration
REACT_APP_DEFAULT_PLATFORM_FEE=0.03
REACT_APP_DEFAULT_RETIREMENT_FEE=0.05
REACT_APP_DEFAULT_STAKING_APY=0.12
REACT_APP_DEFAULT_LP_APY=0.18

# UI Configuration
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_ENABLE_HEDERA_INTEGRATION=true
REACT_APP_ENABLE_YIELD_FEATURES=true

# Security
REACT_APP_ENABLE_DEBUG_MODE=false
REACT_APP_LOG_LEVEL=error

# Database (Neon PostgreSQL recommended)
DATABASE_URL=postgresql://username:password@host:5432/database

# Vercel
VERCEL_ENV=production
```

## Deployment Steps

### 1. Database Setup (Neon PostgreSQL)
1. Create account at [Neon](https://neon.tech)
2. Create new database
3. Copy connection string to `DATABASE_URL`

### 2. Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### 3. Database Migration
After deployment, run database seeding:
```bash
# Access your deployed API endpoint
curl -X POST https://your-app.vercel.app/api/database -H "Content-Type: application/json" -d '{"action": "seed"}'
```

## Local Development

```bash
# Install dependencies
npm install

# Run database migrations (if using local PostgreSQL)
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

## Project Structure

- `/api/` - Vercel serverless functions
- `/client/` - React frontend
- `/shared/` - Shared utilities and schema
- `/migrations/` - Database migrations

## Key Features

- **Hedera Integration**: HCS, HFS, HTS services
- **Carbon Credit Trading**: Marketplace for carbon lots
- **Yield Farming**: Staking and liquidity pools
- **Proof System**: Verification and claims
- **Real-time Analytics**: Dashboard and reporting

## Hackathon Tracks

This project targets:
- **💸 Onchain Finance & RWA**: Asset tokenization and DeFi
- **⚙️ DLT for Operations**: Sustainability & Impact Tech
- **🤖 AI & DePIN**: Global DePIN Solutions