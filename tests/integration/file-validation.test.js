// Integration tests for file validation middleware
// Tests file type and size validation

const request = require('supertest');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const path = require('path');
const fs = require('fs');
const app = require('../../api/app.js'); // Assuming we have an Express app

describe('File Validation Middleware Integration Tests', () => {
  let authToken;
  
  beforeEach(() => {
    authToken = 'test-auth-token';
  });
  
  describe('File Type Validation', () => {
    it('should accept valid image files', async () => {
      // Create a small test image buffer (1x1 PNG)
      const validPngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-image-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test Image',
          description: 'Valid image upload test',
          fileContent: validPngBuffer.toString('base64'),
          fileName: 'test.png',
          fileType: 'image/png',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should accept valid PDF files', async () => {
      // Minimal PDF content
      const validPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
      
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-pdf-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test PDF',
          description: 'Valid PDF upload test',
          fileContent: Buffer.from(validPdfContent).toString('base64'),
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-invalid-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test Invalid File',
          description: 'Invalid file type test',
          fileContent: Buffer.from('test content').toString('base64'),
          fileName: 'test.exe',
          fileType: 'application/x-executable',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid file type');
      expect(response.body.toast.type).toBe('error');
    });
    
    it('should reject files with mismatched extension and type', async () => {
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-mismatch-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test Mismatch',
          description: 'File extension mismatch test',
          fileContent: Buffer.from('test content').toString('base64'),
          fileName: 'test.pdf',
          fileType: 'image/jpeg', // Mismatch: PDF extension but JPEG type
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid file type');
    });
  });
  
  describe('File Size Validation', () => {
    it('should accept files under 1MB', async () => {
      // Create content just under 1MB (1024 * 1024 bytes)
      const contentSize = 1024 * 1000; // 1000KB
      const content = 'a'.repeat(contentSize);
      
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-size-ok-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test Size OK',
          description: 'Valid size test',
          fileContent: Buffer.from(content).toString('base64'),
          fileName: 'test.txt',
          fileType: 'text/plain',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should reject files over 1MB', async () => {
      // Create content over 1MB
      const contentSize = 1024 * 1024 + 1000; // 1MB + 1000 bytes
      const content = 'a'.repeat(contentSize);
      
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-size-large-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test Large File',
          description: 'Large file test',
          fileContent: Buffer.from(content).toString('base64'),
          fileName: 'test.txt',
          fileType: 'text/plain',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('File size exceeds 1MB limit');
      expect(response.body.toast.type).toBe('error');
      expect(response.body.toast.message).toContain('1MB limit');
    });
    
    it('should reject empty files', async () => {
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-empty-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test Empty File',
          description: 'Empty file test',
          fileContent: '', // Empty content
          fileName: 'test.txt',
          fileType: 'text/plain',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('File size exceeds 1MB limit'); // Empty base64 will fail size validation
    });
  });
  
  describe('Multiple File Validation', () => {
    it('should validate all files in multi-file upload', async () => {
      // This test would be for endpoints that accept multiple files
      // Currently our upload endpoint accepts single files, but this shows the pattern
      
      const validFiles = [
        {
          fieldName: 'file1',
          content: Buffer.from('test content 1').toString('base64'),
          fileName: 'test1.txt',
          fileType: 'text/plain'
        },
        {
          fieldName: 'file2', 
          content: Buffer.from('test content 2').toString('base64'),
          fileName: 'test2.pdf',
          fileType: 'application/pdf'
        }
      ];
      
      // For now, test individual files
      for (const file of validFiles) {
        const response = await request(app)
          .post('/api/proofs/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-idempotency-key', `test-multi-${file.fieldName}-` + Date.now())
          .send({
            lotId: 'test-lot-123',
            projectId: 'test-project-123',
            type: 'CARBON_CERTIFICATE',
            title: `Test ${file.fieldName}`,
            description: 'Multi-file test',
            fileContent: file.content,
            fileName: file.fileName,
            fileType: file.fileType,
            userId: 'test-user-123'
          });
        
        expect(response.status).toBe(200);
      }
    });
  });
  
  describe('File Extension Utilities', () => {
    it('should correctly map MIME types to extensions', async () => {
      const { getFileExtension } = require('../../api/middleware/file-validation.js');
      
      expect(getFileExtension('image/jpeg')).toBe('.jpg');
      expect(getFileExtension('image/png')).toBe('.png');
      expect(getFileExtension('application/pdf')).toBe('.pdf');
      expect(getFileExtension('text/plain')).toBe('.txt');
      expect(getFileExtension('unknown/type')).toBe('');
    });
    
    it('should format file sizes correctly', async () => {
      const { formatFileSize } = require('../../api/middleware/file-validation.js');
      
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });
  
  describe('Security Validation', () => {
    it('should reject potentially malicious file types', async () => {
      const maliciousTypes = [
        { fileName: 'script.js', fileType: 'application/javascript' },
        { fileName: 'malware.exe', fileType: 'application/x-executable' },
        { fileName: 'virus.bat', fileType: 'application/x-bat' },
        { fileName: 'shell.sh', fileType: 'application/x-sh' }
      ];
      
      for (const malicious of maliciousTypes) {
        const response = await request(app)
          .post('/api/proofs/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-idempotency-key', `test-malicious-${Date.now()}-${Math.random()}`)
          .send({
            lotId: 'test-lot-123',
            projectId: 'test-project-123',
            type: 'CARBON_CERTIFICATE',
            title: 'Test Malicious',
            description: 'Security test',
            fileContent: Buffer.from('malicious content').toString('base64'),
            fileName: malicious.fileName,
            fileType: malicious.fileType,
            userId: 'test-user-123'
          });
        
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid file type');
      }
    });
    
    it('should handle file bombs (zip bombs) by size limit', async () => {
      // Simulate a file that claims to be small but expands to large size
      // Our size validation should catch this at the base64 level
      
      const largeFakeContent = 'a'.repeat(2 * 1024 * 1024); // 2MB of 'a'
      
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', 'test-bomb-' + Date.now())
        .send({
          lotId: 'test-lot-123',
          projectId: 'test-project-123',
          type: 'CARBON_CERTIFICATE',
          title: 'Test File Bomb',
          description: 'File bomb test',
          fileContent: Buffer.from(largeFakeContent).toString('base64'),
          fileName: 'bomb.txt',
          fileType: 'text/plain',
          userId: 'test-user-123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('File size exceeds 1MB limit');
    });
  });
});