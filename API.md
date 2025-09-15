# GreenLoop Yield API Documentation

## Overview

GreenLoop Yield provides a comprehensive REST API for managing carbon credit lots, orders, and proof uploads on the Hedera network. All endpoints support idempotency and include comprehensive audit logging.

## Base URL

```
Development: http://localhost:5173/api
Production: https://your-domain.com/api
```

## Authentication

Currently, the API uses JWT-based authentication for protected endpoints. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Headers

```
Content-Type: application/json
Idempotency-Key: <unique-key-for-request>
X-Request-ID: <optional-request-tracking-id>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": []
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

## Rate Limiting

- **Rate Limit**: 100 requests per 15-minute window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Endpoints

### 1. Proof Upload API

#### Upload Proof Document

**Endpoint**: `POST /api/proofs/upload`

**Description**: Upload proof documents (satellite imagery, NDVI data, etc.) for carbon credit verification.

**Request Body**:
```json
{
  "parcelId": "string (required)",
  "proofType": "satellite_imagery | ndvi_data | soil_analysis | field_report",
  "file": "base64-encoded file content",
  "fileName": "string",
  "fileSize": "number (bytes)",
  "mimeType": "string",
  "metadata": {
    "captureDate": "ISO 8601 date",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    },
    "resolution": "string (optional)",
    "sensor": "string (optional)"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "proofId": "proof_abc123",
    "hederaFileId": "0.0.123456",
    "hcsMessageId": "msg_789012",
    "uploadTimestamp": "2024-01-15T10:30:00Z",
    "fileHash": "sha256_hash",
    "status": "uploaded",
    "pdiScore": 0.85
  }
}
```

**Validation Rules**:
- File size: Max 10MB
- Supported formats: JPEG, PNG, TIFF, PDF, JSON
- parcelId must be valid UUID
- Coordinates must be within valid ranges

**Error Codes**:
- `FILE_TOO_LARGE`: File exceeds 10MB limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `INVALID_PARCEL_ID`: Parcel ID not found
- `UPLOAD_FAILED`: Hedera file upload failed

---

### 2. Carbon Lots API

#### Create Carbon Lot

**Endpoint**: `POST /api/lots`

**Description**: Create a new carbon credit lot from verified proofs.

**Request Body**:
```json
{
  "parcelId": "string (required)",
  "proofIds": ["proof_id1", "proof_id2"],
  "carbonCredits": "number (required)",
  "pricePerCredit": "number (required)",
  "vintage": "number (year)",
  "methodology": "string",
  "projectDetails": {
    "name": "string",
    "description": "string",
    "location": "string",
    "area": "number (hectares)"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "lotId": "lot_xyz789",
    "status": "minted",
    "hederaTokenId": "0.0.234567",
    "totalValue": "number",
    "createdAt": "2024-01-15T10:30:00Z",
    "pdiScore": 0.92
  }
}
```

#### Get Lot Details

**Endpoint**: `GET /api/lots/{lotId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "lotId": "lot_xyz789",
    "parcelId": "parcel_123",
    "status": "listed",
    "carbonCredits": 100,
    "pricePerCredit": 25.50,
    "totalValue": 2550.00,
    "vintage": 2024,
    "pdiScore": 0.92,
    "proofs": [
      {
        "proofId": "proof_abc123",
        "type": "satellite_imagery",
        "uploadDate": "2024-01-15T10:30:00Z",
        "hederaFileId": "0.0.123456"
      }
    ],
    "transactions": [
      {
        "type": "mint",
        "timestamp": "2024-01-15T10:30:00Z",
        "hederaTransactionId": "0.0.123@1642248600.123456789"
      }
    ]
  }
}
```

#### List Lots

**Endpoint**: `GET /api/lots`

**Query Parameters**:
- `status`: Filter by status (minted, listed, sold, delivered)
- `minPdi`: Minimum PDI score (0.0 - 1.0)
- `maxPrice`: Maximum price per credit
- `vintage`: Filter by vintage year
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "lots": [
      {
        "lotId": "lot_xyz789",
        "carbonCredits": 100,
        "pricePerCredit": 25.50,
        "status": "listed",
        "pdiScore": 0.92,
        "vintage": 2024
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Update Lot Status

**Endpoint**: `PATCH /api/lots/{lotId}/status`

**Request Body**:
```json
{
  "status": "listed | sold | delivered | retired",
  "reason": "string (optional)",
  "metadata": {}
}
```

---

### 3. Orders API

#### Create Order

**Endpoint**: `POST /api/orders`

**Description**: Create a purchase order for carbon credits.

**Request Body**:
```json
{
  "lotId": "string (required)",
  "quantity": "number (required)",
  "buyerInfo": {
    "name": "string",
    "email": "string",
    "organization": "string",
    "hederaAccountId": "string"
  },
  "paymentMethod": "hedera_token | bank_transfer | crypto"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_def456",
    "status": "pending",
    "totalAmount": 2550.00,
    "expiresAt": "2024-01-15T11:30:00Z",
    "paymentInstructions": {
      "method": "hedera_token",
      "recipientAccount": "0.0.345678",
      "amount": "2550.00",
      "memo": "order_def456"
    }
  }
}
```

#### Get Order Details

**Endpoint**: `GET /api/orders/{orderId}`

#### List Orders

**Endpoint**: `GET /api/orders`

**Query Parameters**:
- `status`: Filter by status
- `buyerId`: Filter by buyer
- `lotId`: Filter by lot
- `page`, `limit`: Pagination

#### Update Order Status

**Endpoint**: `PATCH /api/orders/{orderId}/status`

---

### 4. Analytics API

#### Get Platform Statistics

**Endpoint**: `GET /api/analytics/stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalLots": 1250,
    "totalCredits": 125000,
    "totalValue": 3187500.00,
    "averagePdi": 0.87,
    "activeOrders": 45,
    "completedTransactions": 890
  }
}
```

#### Get PDI Distribution

**Endpoint**: `GET /api/analytics/pdi-distribution`

---

### 5. Audit API

#### Get Audit Trail

**Endpoint**: `GET /api/audit/{entityId}`

**Query Parameters**:
- `entityType`: lot | order | proof
- `startDate`, `endDate`: Date range
- `action`: Filter by action type

**Response**:
```json
{
  "success": true,
  "data": {
    "auditTrail": [
      {
        "id": "audit_123",
        "entityId": "lot_xyz789",
        "entityType": "lot",
        "action": "status_change",
        "oldValue": "minted",
        "newValue": "listed",
        "timestamp": "2024-01-15T10:30:00Z",
        "userId": "user_456",
        "hederaTransactionId": "0.0.123@1642248600.123456789"
      }
    ]
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `HEDERA_ERROR` | Hedera network error |
| `DATABASE_ERROR` | Database operation failed |
| `FILE_UPLOAD_ERROR` | File upload failed |
| `INVALID_PDI_SCORE` | PDI calculation failed |

---

## Webhooks

### Event Types

- `lot.created`
- `lot.status_changed`
- `order.created`
- `order.completed`
- `proof.uploaded`
- `proof.verified`

### Webhook Payload

```json
{
  "event": "lot.status_changed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "lotId": "lot_xyz789",
    "oldStatus": "minted",
    "newStatus": "listed"
  },
  "signature": "webhook_signature"
}
```

---

## SDKs and Examples

### JavaScript/Node.js

```javascript
const GreenLoopAPI = require('@greenloop/api-client');

const client = new GreenLoopAPI({
  baseURL: 'https://api.greenloopyield.com',
  apiKey: 'your-api-key'
});

// Upload proof
const proof = await client.proofs.upload({
  parcelId: 'parcel_123',
  proofType: 'satellite_imagery',
  file: fileBuffer,
  fileName: 'satellite_image.tiff'
});

// Create lot
const lot = await client.lots.create({
  parcelId: 'parcel_123',
  proofIds: [proof.proofId],
  carbonCredits: 100,
  pricePerCredit: 25.50
});
```

### cURL Examples

```bash
# Upload proof
curl -X POST https://api.greenloopyield.com/api/proofs/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "parcelId": "parcel_123",
    "proofType": "satellite_imagery",
    "file": "base64-encoded-content",
    "fileName": "satellite.tiff"
  }'

# Get lot details
curl -X GET https://api.greenloopyield.com/api/lots/lot_xyz789 \
  -H "Authorization: Bearer your-jwt-token"

# Create order
curl -X POST https://api.greenloopyield.com/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "lotId": "lot_xyz789",
    "quantity": 50,
    "buyerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "hederaAccountId": "0.0.456789"
    }
  }'
```

---

## Testing

### Test Environment

```
Base URL: https://testnet-api.greenloopyield.com
Hedera Network: Testnet
```

### Test Data

The API provides test endpoints for generating sample data:

- `POST /api/test/generate-parcel`
- `POST /api/test/generate-proof`
- `POST /api/test/generate-lot`

---

## Support

For API support and questions:

- **Documentation**: [https://docs.greenloopyield.com](https://docs.greenloopyield.com)
- **Email**: api-support@greenloopyield.com
- **Discord**: [GreenLoop Community](https://discord.gg/greenloop)
- **GitHub Issues**: [https://github.com/greenloop/yield-api/issues](https://github.com/greenloop/yield-api/issues)

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Proof upload functionality
- Carbon lot management
- Order processing
- Hedera integration
- PDI calculation system