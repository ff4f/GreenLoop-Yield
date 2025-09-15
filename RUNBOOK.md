# GreenLoop Yield - Demo Runbook

## 🎯 Hackathon Demo Script (8 Minutes)

**Target**: Hedera Hackathon Africa 2024 - Onchain Finance & Real-World Assets Track

### Demo Overview
This runbook demonstrates GreenLoop Yield's complete carbon credit lifecycle on Hedera, showcasing real-world asset tokenization and decentralized finance for environmental impact.

---

## 🚀 Pre-Demo Setup (5 minutes before presentation)

### 1. Environment Preparation

```bash
# Clone and setup
git clone https://github.com/greenloop/yield
cd "GreenLoop Yield"
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Hedera testnet credentials

# Start database and seed demo data
npm run db:push
npm run seed:demo

# Start development server
npm run dev
```

### 2. Demo Data Verification

```bash
# Verify demo data is loaded
curl http://localhost:5173/api/lots | jq '.data.lots | length'
# Should return: 5 (demo lots)

curl http://localhost:5173/api/analytics/stats | jq '.data'
# Should show platform statistics
```

### 3. Browser Setup
- Open browser to `http://localhost:5173`
- Open Hedera testnet explorer: `https://hashscan.io/testnet`
- Prepare demo files in `/demo-assets/` folder

---

## 🎬 8-Minute Demo Script

### **Minute 1-2: Problem & Solution Introduction**

**Script**: 
> "Africa faces a $2.8 trillion climate finance gap. Small farmers can't access carbon credit markets due to complex verification processes. GreenLoop Yield solves this by using Hedera's fast, low-cost infrastructure to democratize carbon credit access."

**Actions**:
1. Show homepage with problem statement
2. Navigate to platform overview
3. Highlight key metrics dashboard

**Demo Points**:
- 🌍 **Real-World Impact**: Direct farmer access to carbon markets
- ⚡ **Hedera Advantage**: Sub-second finality, $0.0001 transaction costs
- 🔒 **Trust**: Immutable proof verification on HCS

---

### **Minute 3-4: Proof Upload & Verification**

**Script**:
> "Let's see how a farmer in Kenya uploads satellite imagery to prove carbon sequestration. Our PDI algorithm automatically calculates proof density for transparent verification."

**Actions**:
1. Navigate to Proof Upload page
2. Upload demo satellite image (`demo-assets/satellite-kenya-farm.tiff`)
3. Show real-time Hedera File Service upload
4. Display PDI calculation (Proof Density Index)

```bash
# Demo API call
curl -X POST http://localhost:5173/api/proofs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "parcel_kenya_001",
    "proofType": "satellite_imagery",
    "file": "base64_encoded_satellite_data",
    "fileName": "kenya_farm_2024.tiff",
    "metadata": {
      "captureDate": "2024-01-15T10:00:00Z",
      "coordinates": {"lat": -1.2921, "lng": 36.8219},
      "resolution": "10m",
      "sensor": "Sentinel-2"
    }
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "proofId": "proof_kenya_001",
    "hederaFileId": "0.0.123456",
    "pdiScore": 0.87,
    "status": "verified"
  }
}
```

**Show in Hedera Explorer**:
- File upload transaction
- HCS message with proof metadata

---

### **Minute 5-6: Carbon Lot Creation & Tokenization**

**Script**:
> "With verified proofs, we automatically mint carbon credit tokens on Hedera. Each token represents 1 tonne of CO2 sequestered, backed by cryptographic proof."

**Actions**:
1. Navigate to Lot Creation page
2. Create lot from uploaded proof
3. Show Hedera Token Service minting
4. Display lot on marketplace

```bash
# Create carbon lot
curl -X POST http://localhost:5173/api/lots \
  -H "Content-Type: application/json" \
  -d '{
    "parcelId": "parcel_kenya_001",
    "proofIds": ["proof_kenya_001"],
    "carbonCredits": 50,
    "pricePerCredit": 12.50,
    "vintage": 2024,
    "projectDetails": {
      "name": "Kenya Agroforestry Project",
      "location": "Nairobi County, Kenya",
      "area": 25.5
    }
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "lotId": "lot_kenya_001",
    "hederaTokenId": "0.0.234567",
    "status": "minted",
    "totalValue": 625.00,
    "pdiScore": 0.87
  }
}
```

**Show in Hedera Explorer**:
- Token creation transaction
- Token mint transaction
- HCS consensus message

---

### **Minute 7: Marketplace & Purchase Flow**

**Script**:
> "Corporate buyers can now purchase verified carbon credits directly. Payments are instant via Hedera, with automatic settlement and delivery."

**Actions**:
1. Browse marketplace with PDI filters
2. Select Kenya lot (PDI: 0.87)
3. Create purchase order
4. Show payment flow

```bash
# Create purchase order
curl -X POST http://localhost:5173/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "lotId": "lot_kenya_001",
    "quantity": 25,
    "buyerInfo": {
      "name": "EcoTech Solutions",
      "email": "procurement@ecotech.com",
      "hederaAccountId": "0.0.345678"
    },
    "paymentMethod": "hedera_token"
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_001",
    "status": "pending",
    "totalAmount": 312.50,
    "paymentInstructions": {
      "recipientAccount": "0.0.456789",
      "amount": "312.50",
      "memo": "order_001"
    }
  }
}
```

**Demo Payment**:
- Show Hedera payment transaction
- Automatic token transfer
- Order completion

---

### **Minute 8: Impact & Audit Trail**

**Script**:
> "Every transaction is recorded on Hedera Consensus Service for full transparency. Farmers get paid instantly, buyers get verified credits, and the planet benefits from real carbon sequestration."

**Actions**:
1. Show audit trail page
2. Display HCS message history
3. Show platform impact metrics
4. Highlight Hedera integration benefits

```bash
# Get audit trail
curl http://localhost:5173/api/audit/lot_kenya_001

# Platform statistics
curl http://localhost:5173/api/analytics/stats
```

**Final Impact Slide**:
- ✅ **50 tonnes CO2** sequestered and tokenized
- ✅ **$625** direct payment to Kenyan farmer
- ✅ **25 carbon credits** delivered to corporate buyer
- ✅ **$0.05** total transaction costs on Hedera
- ✅ **100% transparent** audit trail on HCS

---

## 🧪 Test Cases & Scenarios

### Test Case 1: End-to-End Happy Path

**Objective**: Verify complete carbon credit lifecycle

**Steps**:
1. Upload valid satellite imagery
2. Verify PDI calculation (>0.7)
3. Create carbon lot
4. List on marketplace
5. Create purchase order
6. Process payment
7. Deliver tokens
8. Verify audit trail

**Expected Results**:
- All Hedera transactions succeed
- PDI score calculated correctly
- Tokens minted and transferred
- Audit trail complete

**Test Script**:
```bash
#!/bin/bash
# Run end-to-end test
npm run test:e2e:happy-path
```

### Test Case 2: Low PDI Rejection

**Objective**: Verify system rejects low-quality proofs

**Steps**:
1. Upload low-quality satellite image
2. Verify PDI calculation (<0.5)
3. Attempt lot creation
4. Verify rejection

**Expected Results**:
- PDI score below threshold
- Lot creation blocked
- Clear error message

### Test Case 3: Hedera Network Resilience

**Objective**: Test system behavior during network issues

**Steps**:
1. Simulate Hedera network delay
2. Upload proof during delay
3. Verify retry mechanism
4. Confirm eventual consistency

**Expected Results**:
- Graceful error handling
- Automatic retries
- User feedback
- Transaction completion

### Test Case 4: High Volume Stress Test

**Objective**: Verify system performance under load

**Steps**:
1. Upload 100 proofs simultaneously
2. Create 50 lots concurrently
3. Process 25 orders in parallel
4. Monitor system performance

**Expected Results**:
- All transactions processed
- Response times <2 seconds
- No data corruption
- Hedera rate limits respected

---

## 🔧 Demo Troubleshooting

### Common Issues

#### 1. Hedera Connection Failed

**Symptoms**: API errors, failed uploads

**Solutions**:
```bash
# Check Hedera credentials
echo $HEDERA_OPERATOR_ID
echo $HEDERA_OPERATOR_KEY

# Test connection
npm run test:hedera-connection

# Use mock mode for demo
export USE_REAL_HEDERA=false
npm run dev
```

#### 2. Database Connection Issues

**Symptoms**: 500 errors, data not loading

**Solutions**:
```bash
# Reset database
npm run db:reset
npm run db:push
npm run seed:demo

# Check connection
npm run db:status
```

#### 3. File Upload Failures

**Symptoms**: Upload errors, missing files

**Solutions**:
```bash
# Check file permissions
ls -la demo-assets/

# Verify file sizes (<10MB)
du -h demo-assets/*

# Test with smaller file
cp demo-assets/small-sample.jpg test-upload.jpg
```

#### 4. PDI Calculation Errors

**Symptoms**: Invalid PDI scores, calculation failures

**Solutions**:
```bash
# Test PDI algorithm
npm run test:pdi-calculation

# Use mock PDI for demo
export USE_MOCK_PDI=true
```

---

## 📊 Demo Metrics & KPIs

### Success Metrics

- **Transaction Speed**: <3 seconds end-to-end
- **Cost Efficiency**: <$0.10 per carbon credit
- **PDI Accuracy**: >95% correlation with manual verification
- **System Uptime**: >99.9% availability
- **User Experience**: <5 clicks to complete transaction

### Demo Performance Targets

| Metric | Target | Measurement |
|--------|--------|--------------|
| Proof Upload | <5 seconds | Time to Hedera confirmation |
| PDI Calculation | <2 seconds | Algorithm execution time |
| Lot Creation | <10 seconds | Including token minting |
| Order Processing | <15 seconds | Payment to delivery |
| Audit Query | <1 second | HCS message retrieval |

---

## 🎯 Hackathon Judging Criteria Alignment

### 1. Technical Innovation
- ✅ **Novel PDI Algorithm**: Automated proof verification
- ✅ **Hedera Integration**: HCS + HFS + HTS utilization
- ✅ **Real-time Processing**: Sub-second transaction finality

### 2. Real-World Impact
- ✅ **Financial Inclusion**: Direct farmer access to carbon markets
- ✅ **Environmental Benefit**: Verified carbon sequestration
- ✅ **Economic Empowerment**: Instant payments to rural communities

### 3. Hedera Utilization
- ✅ **Consensus Service**: Immutable audit trail
- ✅ **File Service**: Decentralized proof storage
- ✅ **Token Service**: Carbon credit tokenization
- ✅ **Smart Contracts**: Automated settlement logic

### 4. African Context
- ✅ **Local Relevance**: Kenya agroforestry use case
- ✅ **Infrastructure Awareness**: Works with limited connectivity
- ✅ **Economic Development**: Direct farmer payments
- ✅ **Scalability**: Multi-country expansion ready

---

## 🚀 Post-Demo Next Steps

### Immediate (Week 1)
1. Deploy to Hedera mainnet
2. Partner with African agricultural cooperatives
3. Integrate with satellite data providers
4. Launch pilot program in Kenya

### Short-term (Month 1-3)
1. Scale to 1,000 farmers
2. Process 10,000 carbon credits
3. Integrate with major carbon registries
4. Add mobile app for farmers

### Long-term (Month 6-12)
1. Expand to 10 African countries
2. Support multiple asset types (biodiversity, water)
3. Launch institutional investor platform
4. Achieve carbon neutrality certification

---

## 📞 Demo Support

### During Hackathon
- **Lead Developer**: Available on Discord @greenloop-dev
- **Demo Backup**: All demo data pre-loaded
- **Technical Support**: Real-time monitoring dashboard

### Resources
- **Live Demo**: https://demo.greenloopyield.com
- **API Docs**: https://docs.greenloopyield.com
- **GitHub**: https://github.com/greenloop/yield
- **Video Demo**: https://youtu.be/greenloop-demo

---

**🏆 Ready to win Hedera Hackathon Africa 2024! 🌍**