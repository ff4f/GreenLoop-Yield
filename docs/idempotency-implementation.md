# Idempotency Middleware Implementation

## Overview

This document describes the implementation of idempotency middleware for the GreenLoop Yield platform. The middleware prevents duplicate processing of critical financial operations by using unique request identifiers.

## Architecture

### Core Components

1. **Idempotency Middleware** (`/api/middleware/idempotency.js`)
   - Main middleware function for request deduplication
   - Database storage for idempotency keys
   - Automatic cleanup of expired keys

2. **File Validation Middleware** (`/api/middleware/file-validation.js`)
   - File upload validation and security checks
   - Support for multiple file types and size limits
   - Integration with idempotency for upload operations

3. **Management Scripts** (`/scripts/`)
   - Cleanup script for expired keys
   - Monitoring and reporting tools

## Database Schema

```sql
CREATE TABLE idempotencyKeys (
  id SERIAL PRIMARY KEY,
  keyHash VARCHAR(64) UNIQUE NOT NULL,
  userId VARCHAR(255),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  responseData JSONB,
  statusCode INTEGER,
  used BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP NOT NULL,
  INDEX idx_key_hash (keyHash),
  INDEX idx_expires_at (expiresAt),
  INDEX idx_user_endpoint (userId, endpoint)
);
```

## Implementation Details

### Protected Endpoints

The following endpoints are protected with idempotency middleware:

#### Financial Operations
- `POST /api/orders/buy` - Purchase orders
- `POST /api/investor/deposit` - Investor deposits
- `POST /api/investor/withdraw` - Investor withdrawals
- `POST /api/orders/resolve` - Dispute resolution
- `POST /api/orders/release-escrow` - Settlement operations

#### File Operations
- `POST /api/proofs/upload` - Proof document uploads

### Usage Example

```javascript
// Client-side request with idempotency key
const response = await fetch('/api/investor/deposit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': 'user123_deposit_20241201_001',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    amount: 1000,
    poolId: 'pool_456'
  })
});
```

### Server-side Implementation

```javascript
// Endpoint with idempotency protection
export default async function handler(req, res) {
  // Apply idempotency middleware
  await idempotencyMiddleware(req, res);
  await requireIdempotencyKey(req, res);
  
  // Your business logic here
  const result = await processDeposit(req.body);
  
  res.status(200).json(result);
}
```

## Configuration

### Environment Variables

```bash
# Idempotency settings
IDEMPOTENCY_TTL_MINUTES=60
IDEMPOTENCY_MAX_KEY_LENGTH=255
IDEMPOTENCY_CLEANUP_INTERVAL=3600000

# File validation settings
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx
MAX_IMAGE_SIZE_MB=5
```

### Middleware Configuration

```javascript
// Custom TTL for specific endpoints
const customTTL = {
  '/api/orders/buy': 30 * 60 * 1000,      // 30 minutes
  '/api/investor/deposit': 60 * 60 * 1000, // 1 hour
  '/api/proofs/upload': 24 * 60 * 60 * 1000 // 24 hours
};
```

## Security Features

### Key Generation
- SHA-256 hashing of idempotency keys
- User ID binding to prevent cross-user access
- Endpoint-specific key scoping

### Validation
- Key format validation (alphanumeric, hyphens, underscores)
- Maximum key length enforcement
- Required key validation for protected endpoints

### File Upload Security
- File type validation using MIME types
- File size limits
- Content scanning for malicious files
- Secure filename handling

## Monitoring and Maintenance

### Cleanup Script

```bash
# Run cleanup manually
node scripts/cleanup-idempotency.js

# Dry run to see what would be cleaned
node scripts/cleanup-idempotency.js --dry-run

# Cron job for automatic cleanup (every hour)
0 * * * * cd /path/to/project && node scripts/cleanup-idempotency.js
```

### Monitoring Script

```bash
# Generate performance report
node scripts/monitor-idempotency.js

# Daily monitoring cron job
0 9 * * * cd /path/to/project && node scripts/monitor-idempotency.js > /var/log/idempotency-report.log
```

### Key Metrics

- **Duplicate Prevention Rate**: Percentage of requests that were duplicates
- **Key Usage Rate**: Percentage of keys that were actually used
- **Average TTL**: Average time-to-live for idempotency keys
- **Storage Efficiency**: Database storage optimization metrics

## Error Handling

### Common Error Scenarios

1. **Missing Idempotency Key**
   ```json
   {
     "error": "Idempotency-Key header is required",
     "code": "MISSING_IDEMPOTENCY_KEY"
   }
   ```

2. **Invalid Key Format**
   ```json
   {
     "error": "Invalid idempotency key format",
     "code": "INVALID_KEY_FORMAT"
   }
   ```

3. **Duplicate Request**
   ```json
   {
     "message": "Request already processed",
     "data": { /* original response */ }
   }
   ```

4. **File Validation Errors**
   ```json
   {
     "error": "File type not allowed",
     "code": "INVALID_FILE_TYPE",
     "allowedTypes": ["pdf", "jpg", "png"]
   }
   ```

## Testing

### Integration Tests

Run the test suite to verify idempotency behavior:

```bash
# Run idempotency tests
npm test tests/integration/idempotency.test.js

# Run file validation tests
npm test tests/integration/file-validation.test.js
```

### Test Scenarios

1. **Duplicate Request Handling**
   - Send identical requests with same idempotency key
   - Verify second request returns cached response

2. **Key Expiration**
   - Test behavior when keys expire
   - Verify cleanup process

3. **File Upload Validation**
   - Test various file types and sizes
   - Verify security validations

4. **Error Conditions**
   - Missing headers
   - Invalid key formats
   - Database connection issues

## Performance Considerations

### Database Optimization

- Indexed columns for fast lookups
- Automatic cleanup of expired keys
- Connection pooling for high throughput

### Memory Management

- Limited response caching
- Efficient key hashing
- Garbage collection of expired data

### Scalability

- Horizontal scaling support
- Database sharding considerations
- Load balancer compatibility

## Best Practices

### Client Implementation

1. **Generate Unique Keys**
   ```javascript
   const idempotencyKey = `${userId}_${operation}_${timestamp}_${nonce}`;
   ```

2. **Handle Responses Appropriately**
   ```javascript
   if (response.status === 200 && response.data.message === 'Request already processed') {
     // Handle duplicate response
     return response.data.data;
   }
   ```

3. **Retry Logic**
   ```javascript
   // Use same idempotency key for retries
   const retryWithSameKey = async (key, requestData) => {
     for (let i = 0; i < 3; i++) {
       try {
         return await makeRequest(key, requestData);
       } catch (error) {
         if (i === 2) throw error;
         await delay(1000 * Math.pow(2, i));
       }
     }
   };
   ```

### Server Implementation

1. **Apply to Critical Operations Only**
   - Financial transactions
   - State-changing operations
   - File uploads

2. **Set Appropriate TTL**
   - Consider operation complexity
   - Balance storage vs. functionality
   - Account for retry patterns

3. **Monitor Performance**
   - Track duplicate rates
   - Monitor database growth
   - Analyze usage patterns

## Troubleshooting

### Common Issues

1. **High Database Growth**
   - Check cleanup script execution
   - Verify TTL settings
   - Monitor key generation patterns

2. **Performance Degradation**
   - Check database indexes
   - Monitor connection pool
   - Analyze query performance

3. **False Duplicates**
   - Verify key generation logic
   - Check client retry behavior
   - Review TTL settings

### Debug Commands

```bash
# Check database size
psql -c "SELECT COUNT(*) FROM idempotencyKeys;"

# View recent activity
psql -c "SELECT * FROM idempotencyKeys ORDER BY createdAt DESC LIMIT 10;"

# Check expired keys
psql -c "SELECT COUNT(*) FROM idempotencyKeys WHERE expiresAt < NOW();"
```

## Migration Guide

### From No Idempotency

1. **Deploy Database Schema**
   ```bash
   psql -f migrations/001_create_idempotency_table.sql
   ```

2. **Update Endpoints Gradually**
   - Start with critical financial operations
   - Add to file uploads
   - Extend to other operations

3. **Monitor and Adjust**
   - Watch for performance impact
   - Adjust TTL based on usage
   - Fine-tune cleanup frequency

### Client Updates

1. **Add Header Support**
   ```javascript
   // Before
   fetch('/api/deposit', { method: 'POST', body: data })
   
   // After
   fetch('/api/deposit', {
     method: 'POST',
     headers: { 'Idempotency-Key': generateKey() },
     body: data
   })
   ```

2. **Handle New Response Format**
   ```javascript
   // Check for duplicate response
   if (response.data.message === 'Request already processed') {
     return response.data.data;
   }
   ```

## Conclusion

The idempotency middleware provides robust protection against duplicate processing of critical operations in the GreenLoop Yield platform. By following the implementation guidelines and best practices outlined in this document, you can ensure reliable and secure operation of financial transactions and file uploads.

For additional support or questions, refer to the test files and monitoring scripts included in the implementation.