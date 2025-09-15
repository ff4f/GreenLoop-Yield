# Hedera Configuration Guide

This guide explains how to configure Hedera Hashgraph integration for the GreenLoop Yield platform.

## Environment Variables

### Required Variables

#### Hedera Network Configuration
```bash
# Hedera network to connect to
HEDERA_NETWORK=testnet  # Options: testnet, mainnet, previewnet

# Your Hedera account credentials
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY_HERE
```

#### Service Selection
```bash
# Use real Hedera services (true) or mock services (false)
USE_REAL_HEDERA=false  # Set to 'true' for production
```

### Optional Variables

#### HCS Topic Configuration
```bash
# Hedera Consensus Service topic IDs for audit logs
HCS_AUDIT_TOPIC_ID=0.0.123456
HCS_PROOF_TOPIC_ID=0.0.123457
```

#### Mirror Node Configuration
```bash
# Mirror node URL for querying blockchain data
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
```

#### Testing Configuration
```bash
# Test-specific settings
TEST_TIMEOUT=30000
VERBOSE_TESTS=false
LOG_LEVEL=error
```

## Setup Instructions

### 1. Create Hedera Account

1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Create a new account or use existing credentials
3. Note your Account ID (format: 0.0.XXXXXX)
4. Generate or retrieve your private key

### 2. Configure Environment

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your credentials
vim .env
```

Example `.env` configuration:

```bash
# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420abcdef...
USE_REAL_HEDERA=true

# HCS Topics (create these first)
HCS_AUDIT_TOPIC_ID=0.0.789012
HCS_PROOF_TOPIC_ID=0.0.789013

# Mirror Node
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
```

### 3. Create HCS Topics

Before using the application, create the required HCS topics:

```javascript
// Using the API endpoint
POST /api/hedera-consensus/topics
{
  "memo": "GreenLoop Audit Topic",
  "adminKey": true,
  "submitKey": true
}
```

Or use the Hedera SDK directly:

```javascript
import { HederaRealService } from './shared/hedera-real.js';

// Create audit topic
const auditTopic = await HederaRealService.consensus.createTopic(
  'GreenLoop Audit Topic'
);
console.log('Audit Topic ID:', auditTopic.topicId);

// Create proof topic
const proofTopic = await HederaRealService.consensus.createTopic(
  'GreenLoop Proof Topic'
);
console.log('Proof Topic ID:', proofTopic.topicId);
```

### 4. Fund Your Account

Ensure your Hedera account has sufficient HBAR for transactions:

- **Testnet**: Get free HBAR from [Hedera Faucet](https://portal.hedera.com/faucet)
- **Mainnet**: Purchase HBAR from exchanges

Recommended minimum balance: **10 HBAR**

## Service Modes

### Mock Mode (Development)

```bash
USE_REAL_HEDERA=false
```

- Uses simulated Hedera services
- No real blockchain transactions
- Faster development and testing
- No HBAR costs
- Consistent demo data

### Real Mode (Production)

```bash
USE_REAL_HEDERA=true
```

- Uses actual Hedera network
- Real blockchain transactions
- Requires valid credentials and HBAR
- Production-ready

## Error Handling

The platform includes comprehensive error handling for Hedera operations:

### Automatic Retry
- Network connectivity issues
- Rate limiting
- Temporary service unavailability

### Circuit Breaker
- Prevents cascading failures
- Automatic recovery
- Configurable thresholds

### Error Categories
- **NETWORK_ERROR**: Connectivity issues
- **RATE_LIMIT**: Too many requests
- **INSUFFICIENT_BALANCE**: Not enough HBAR
- **AUTHENTICATION_ERROR**: Invalid credentials
- **TRANSACTION_ERROR**: Transaction failures

## Testing

### Unit Tests

```bash
# Test with mock services
npm run test:mock

# Test with real Hedera (requires valid credentials)
npm run test:real-hedera
```

### E2E Tests

```bash
# Full end-to-end testing
npm run test:e2e

# With coverage
npm run test:coverage
```

### Configuration Validation

The platform automatically validates your configuration:

```javascript
import { HederaRealService } from './shared/hedera-real.js';

// Check configuration
const validation = HederaRealService.errorHandler.validateConfiguration();
if (!validation.valid) {
  console.error('Configuration issues:', validation.issues);
}
```

## Monitoring

### Network Status

Check Hedera network connectivity:

```bash
# API endpoint
GET /api/network-status

# Response
{
  "connected": true,
  "network": "testnet",
  "operatorId": "0.0.123456",
  "balance": "50.0 ℏ",
  "responseTime": 245
}
```

### Transaction Monitoring

All transactions are logged with:
- Transaction ID
- File ID (for HFS operations)
- Topic ID (for HCS operations)
- Error details (if any)

### HashScan Integration

View transactions on HashScan:
- **Testnet**: https://hashscan.io/testnet/
- **Mainnet**: https://hashscan.io/mainnet/

## Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use different credentials for different environments
- Rotate keys regularly

### Private Key Management
- Store private keys securely
- Use environment variables, not hardcoded values
- Consider using key management services for production

### Network Security
- Use HTTPS for all API calls
- Validate all inputs
- Implement rate limiting

## Troubleshooting

### Common Issues

#### "Invalid operator ID format"
```bash
# Ensure format is 0.0.XXXXXX
HEDERA_OPERATOR_ID=0.0.123456
```

#### "Insufficient balance"
```bash
# Check account balance
GET /api/network-status

# Add HBAR to your account
```

#### "Network connectivity failed"
```bash
# Check network configuration
HEDERA_NETWORK=testnet

# Verify internet connectivity
# Check Hedera network status
```

#### "Authentication failed"
```bash
# Verify private key format
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...

# Ensure key matches account ID
```

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug
VERBOSE_TESTS=true
```

### Support Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera Discord](https://discord.com/invite/hedera)
- [GitHub Issues](https://github.com/your-repo/issues)

## Cost Estimation

### Testnet (Free)
- All operations are free
- Unlimited testing

### Mainnet Costs
- **File Upload**: ~$0.05 per file
- **HCS Message**: ~$0.0001 per message
- **Token Creation**: ~$1.00 per token
- **Token Transfer**: ~$0.001 per transfer

*Costs are approximate and may vary based on network conditions*

## Migration Guide

### From Mock to Real Hedera

1. Set up Hedera account and credentials
2. Create required HCS topics
3. Update environment variables:
   ```bash
   USE_REAL_HEDERA=true
   HEDERA_OPERATOR_ID=0.0.YOUR_ID
   HEDERA_OPERATOR_KEY=YOUR_KEY
   ```
4. Test configuration:
   ```bash
   npm run test:real-hedera
   ```
5. Deploy with real Hedera integration

### From Testnet to Mainnet

1. Create mainnet account
2. Fund account with HBAR
3. Update environment:
   ```bash
   HEDERA_NETWORK=mainnet
   HEDERA_OPERATOR_ID=0.0.MAINNET_ID
   HEDERA_OPERATOR_KEY=MAINNET_KEY
   MIRROR_NODE_URL=https://mainnet.mirrornode.hedera.com
   ```
4. Create production HCS topics
5. Update topic IDs in configuration
6. Deploy to production

---

*For additional support, please refer to the [Hedera documentation](https://docs.hedera.com/) or contact the development team.*