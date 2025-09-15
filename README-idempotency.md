# GreenLoop Yield - Idempotency Implementation

## Quick Start

This implementation adds robust idempotency protection to critical financial operations and file uploads in the GreenLoop Yield platform.

### 🚀 Features

- ✅ **Duplicate Request Prevention** - Prevents accidental duplicate transactions
- ✅ **Financial Operation Protection** - Secures deposits, withdrawals, and settlements
- ✅ **File Upload Security** - Validates and protects file upload operations
- ✅ **Automatic Cleanup** - Removes expired idempotency keys automatically
- ✅ **Performance Monitoring** - Tracks usage patterns and system health
- ✅ **Comprehensive Testing** - Full test coverage for all scenarios

### 📋 Prerequisites

- Node.js 16+
- PostgreSQL database
- Existing GreenLoop Yield platform

### 🛠️ Installation

1. **Database Setup**
   ```bash
   # Run the migration to create idempotency table
   psql -d your_database -f migrations/001_create_idempotency_table.sql
   ```

2. **Environment Configuration**
   ```bash
   # Add to your .env file
   IDEMPOTENCY_TTL_MINUTES=60
   IDEMPOTENCY_MAX_KEY_LENGTH=255
   MAX_FILE_SIZE_MB=10
   ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx
   ```

3. **Install Dependencies**
   ```bash
   npm install crypto
   # Dependencies should already be available in your project
   ```

### 🎯 Protected Endpoints

The following endpoints now require an `Idempotency-Key` header:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/orders/buy` | POST | Purchase orders |
| `/api/investor/deposit` | POST | Investor deposits |
| `/api/investor/withdraw` | POST | Investor withdrawals |
| `/api/orders/resolve` | POST | Dispute resolution |
| `/api/orders/release-escrow` | POST | Settlement operations |
| `/api/proofs/upload` | POST | Proof document uploads |

### 📝 Usage Examples

#### Client-Side Implementation

```javascript
// Generate unique idempotency key
const generateIdempotencyKey = (userId, operation) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${userId}_${operation}_${timestamp}_${random}`;
};

// Make idempotent request
const makeDeposit = async (amount, poolId) => {
  const idempotencyKey = generateIdempotencyKey('user123', 'deposit');
  
  const response = await fetch('/api/investor/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ amount, poolId })
  });
  
  const data = await response.json();
  
  // Handle duplicate response
  if (data.message === 'Request already processed') {
    console.log('Duplicate request detected, returning cached result');
    return data.data;
  }
  
  return data;
};
```

#### File Upload with Idempotency

```javascript
const uploadProof = async (file, proofType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('proofType', proofType);
  
  const idempotencyKey = generateIdempotencyKey('user123', 'upload');
  
  const response = await fetch('/api/proofs/upload', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
      'Authorization': 'Bearer ' + token
    },
    body: formData
  });
  
  return await response.json();
};
```

### 🔧 Management Scripts

#### Cleanup Expired Keys

```bash
# Manual cleanup
node scripts/cleanup-idempotency.js

# Dry run (preview what would be cleaned)
node scripts/cleanup-idempotency.js --dry-run

# Verbose output
node scripts/cleanup-idempotency.js --verbose

# Setup automatic cleanup (cron job)
# Add to crontab: 0 * * * * cd /path/to/project && node scripts/cleanup-idempotency.js
crontab -e
```

#### Performance Monitoring

```bash
# Generate performance report
node scripts/monitor-idempotency.js

# Setup daily monitoring
# Add to crontab: 0 9 * * * cd /path/to/project && node scripts/monitor-idempotency.js > /var/log/idempotency-report.log
crontab -e
```

### 🧪 Testing

```bash
# Run idempotency tests
npm test tests/integration/idempotency.test.js

# Run file validation tests
npm test tests/integration/file-validation.test.js

# Run all tests
npm test
```

### 📊 Monitoring Dashboard

The monitoring script provides detailed insights:

- **Overall Statistics** - Total keys, usage rates, expiration rates
- **Endpoint Usage** - Request patterns by endpoint
- **User Activity** - Top users and their patterns
- **Time Analysis** - Hourly activity trends
- **Performance Insights** - Efficiency scores and recommendations

### 🚨 Error Handling

#### Common Error Responses

```javascript
// Missing idempotency key
{
  "error": "Idempotency-Key header is required",
  "code": "MISSING_IDEMPOTENCY_KEY"
}

// Invalid key format
{
  "error": "Invalid idempotency key format",
  "code": "INVALID_KEY_FORMAT"
}

// Duplicate request (success case)
{
  "message": "Request already processed",
  "data": { /* original response */ }
}

// File validation error
{
  "error": "File type not allowed",
  "code": "INVALID_FILE_TYPE",
  "allowedTypes": ["pdf", "jpg", "png"]
}
```

#### Client Error Handling

```javascript
const handleApiResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    switch (data.code) {
      case 'MISSING_IDEMPOTENCY_KEY':
        throw new Error('Please retry the request');
      case 'INVALID_KEY_FORMAT':
        throw new Error('Invalid request format');
      case 'INVALID_FILE_TYPE':
        throw new Error(`File type not supported. Allowed: ${data.allowedTypes.join(', ')}`);
      default:
        throw new Error(data.error || 'Request failed');
    }
  }
  
  // Handle duplicate response
  if (data.message === 'Request already processed') {
    console.log('Duplicate request detected');
    return data.data;
  }
  
  return data;
};
```

### 🔒 Security Features

- **Key Hashing** - SHA-256 hashing of idempotency keys
- **User Binding** - Keys are bound to specific users
- **Endpoint Scoping** - Keys are scoped to specific endpoints
- **File Validation** - Comprehensive file type and size validation
- **Content Security** - Malicious file detection

### ⚡ Performance Tips

1. **Key Generation**
   ```javascript
   // Good: Include user, operation, and timestamp
   const key = `${userId}_${operation}_${Date.now()}_${nonce}`;
   
   // Avoid: Too generic or too long
   const badKey = 'generic_key'; // Too generic
   const tooLong = 'very_long_key_that_exceeds_limits...'; // Too long
   ```

2. **TTL Configuration**
   ```javascript
   // Adjust TTL based on operation type
   const ttlConfig = {
     'deposit': 60 * 60 * 1000,    // 1 hour for deposits
     'withdraw': 30 * 60 * 1000,   // 30 minutes for withdrawals
     'upload': 24 * 60 * 60 * 1000 // 24 hours for uploads
   };
   ```

3. **Cleanup Schedule**
   ```bash
   # Recommended: Every hour
   0 * * * * cd /path/to/project && node scripts/cleanup-idempotency.js
   
   # For high-traffic: Every 30 minutes
   */30 * * * * cd /path/to/project && node scripts/cleanup-idempotency.js
   ```

### 🐛 Troubleshooting

#### High Database Growth
```bash
# Check current database size
psql -c "SELECT COUNT(*) as total_keys, COUNT(CASE WHEN expiresAt < NOW() THEN 1 END) as expired_keys FROM idempotencyKeys;"

# Manual cleanup if needed
node scripts/cleanup-idempotency.js --force
```

#### Performance Issues
```bash
# Check database indexes
psql -c "\d idempotencyKeys"

# Analyze query performance
psql -c "EXPLAIN ANALYZE SELECT * FROM idempotencyKeys WHERE keyHash = 'sample_hash';"
```

#### Debug Mode
```bash
# Enable verbose logging
DEBUG=idempotency* node your-app.js

# Check recent activity
node scripts/monitor-idempotency.js
```

### 📚 Additional Resources

- **Full Documentation**: `/docs/idempotency-implementation.md`
- **Database Schema**: `/migrations/001_create_idempotency_table.sql`
- **Test Examples**: `/tests/integration/`
- **Monitoring Scripts**: `/scripts/`

### 🤝 Contributing

When adding new protected endpoints:

1. Import the middleware:
   ```javascript
   const { idempotencyMiddleware, requireIdempotencyKey } = require('../middleware/idempotency.js');
   ```

2. Apply to your endpoint:
   ```javascript
   export default async function handler(req, res) {
     await idempotencyMiddleware(req, res);
     await requireIdempotencyKey(req, res);
     
     // Your business logic here
   }
   ```

3. Add tests:
   ```javascript
   // Add test cases to appropriate test file
   describe('New Endpoint Idempotency', () => {
     // Test duplicate prevention
     // Test key validation
     // Test error handling
   });
   ```

### 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the full documentation in `/docs/`
3. Run the monitoring script for insights
4. Check test files for usage examples

---

**Built for GreenLoop Yield Platform** 🌱

*Securing financial operations with robust idempotency protection*