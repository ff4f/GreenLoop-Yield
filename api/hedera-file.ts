import { VercelRequest, VercelResponse } from '@vercel/node';

import { ProofLink } from '../shared/schema.js';
import { HederaMockService } from '../shared/hedera-mock.js';

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function logAnalytics(event: string, value: number, metadata: any) {
  console.log('Analytics:', { event, value, metadata, timestamp: new Date().toISOString() });
}

function logAudit(userId: string, action: string, resourceType: string, resourceId: string, metadata: any) {
  console.log('Audit:', {
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    timestamp: new Date().toISOString()
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const action = query.action as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (method) {
      case 'POST':
        if (action === 'upload-file') {
          // Upload File to HFS
          const { userId, fileContent, contentType, fileName } = req.body;
          
          if (!userId || !fileContent) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, fileContent' 
            });
          }
          
          // Validate file size (max 1MB for demo)
          const fileSizeBytes = Buffer.byteLength(fileContent, 'utf8');
          if (fileSizeBytes > 1024 * 1024) {
            return res.status(400).json({ 
              error: 'File size exceeds 1MB limit',
              toast: {
                type: 'error',
                message: 'File size must be less than 1MB.'
              }
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(2500);
          
          // Upload file
          const file = await HederaMockService.file.uploadFile(
            fileContent,
            contentType || 'application/octet-stream'
          );
          
          // Log analytics and audit
          logAnalytics('file_uploaded', fileSizeBytes, { 
            fileId: file.fileId,
            fileName,
            contentType,
            size: fileSizeBytes,
            userId 
          });
          
          logAudit(userId, 'upload_file', 'file', file.fileId, {
            fileName,
            contentType,
            size: fileSizeBytes,
            transactionId: file.transactionId
          });
          
          return res.status(201).json({
            success: true,
            data: {
              fileId: file.fileId,
              fileName,
              contentType,
              size: fileSizeBytes,
              transactionId: file.transactionId,
              uploadedAt: new Date().toISOString()
            },
            proofOutputs: {
              fileId: file.fileId,
              transactionId: file.transactionId,
              size: `${(fileSizeBytes / 1024).toFixed(2)} KB`,
              status: 'File uploaded successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(file.transactionId),
              file: ProofLink.buildFileLink(file.fileId)
            },
            toast: {
              type: 'success',
              message: `File uploaded successfully! ID: ${file.fileId}`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(file.transactionId)
                },
                {
                  text: 'View File',
                  url: ProofLink.buildFileLink(file.fileId)
                }
              ]
            }
          });
        } else if (action === 'upload-proof') {
          // Upload Proof Document to HFS
          const { userId, proofData, proofType, projectId, lotId } = req.body;
          
          if (!userId || !proofData || !proofType) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, proofData, proofType' 
            });
          }
          
          // Create structured proof document
          const proofDocument = {
            type: proofType,
            projectId,
            lotId,
            data: proofData,
            timestamp: new Date().toISOString(),
            submittedBy: userId,
            version: '1.0'
          };
          
          const proofContent = JSON.stringify(proofDocument, null, 2);
          const fileSizeBytes = Buffer.byteLength(proofContent, 'utf8');
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(3000);
          
          // Upload proof file
          const file = await HederaMockService.file.uploadFile(
            proofContent,
            'application/json'
          );
          
          // Log analytics and audit
          logAnalytics('proof_uploaded', 1, { 
            fileId: file.fileId,
            proofType,
            projectId,
            lotId,
            size: fileSizeBytes,
            userId 
          });
          
          logAudit(userId, 'upload_proof', 'file', file.fileId, {
            proofType,
            projectId,
            lotId,
            size: fileSizeBytes,
            transactionId: file.transactionId
          });
          
          return res.status(201).json({
            success: true,
            data: {
              fileId: file.fileId,
              proofType,
              projectId,
              lotId,
              size: fileSizeBytes,
              transactionId: file.transactionId,
              uploadedAt: new Date().toISOString()
            },
            proofOutputs: {
              fileId: file.fileId,
              transactionId: file.transactionId,
              proofType,
              size: `${(fileSizeBytes / 1024).toFixed(2)} KB`,
              status: 'Proof uploaded successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(file.transactionId),
              file: ProofLink.buildFileLink(file.fileId)
            },
            toast: {
              type: 'success',
              message: `${proofType} proof uploaded successfully!`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(file.transactionId)
                },
                {
                  text: 'View Proof',
                  url: ProofLink.buildFileLink(file.fileId)
                }
              ]
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'GET':
        if (action === 'get-file') {
          // Get File from HFS
          const fileId = query.fileId as string;
          
          if (!fileId) {
            return res.status(400).json({ 
              error: 'Missing required parameter: fileId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1500);
          
          // Get file
          const file = await HederaMockService.file.getFile(fileId);
          
          if (!file) {
            return res.status(404).json({ 
              error: 'File not found',
              toast: {
                type: 'error',
                message: 'The requested file could not be found.'
              }
            });
          }
          
          // Log analytics
          logAnalytics('file_retrieved', 1, { 
            fileId,
            size: file.content.length 
          });
          
          return res.status(200).json({
            success: true,
            data: {
              fileId,
              content: file.content,
              contentType: file.contentType,
              size: file.content.length,
              retrievedAt: new Date().toISOString()
            },
            proofLinks: {
              file: ProofLink.buildFileLink(fileId)
            }
          });
        } else if (action === 'get-info') {
          // Get File Info from HFS
          const fileId = query.fileId as string;
          
          if (!fileId) {
            return res.status(400).json({ 
              error: 'Missing required parameter: fileId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1000);
          
          // Get file info
          const fileInfo = await HederaMockService.file.getFileInfo(fileId);
          
          if (!fileInfo) {
            return res.status(404).json({ 
              error: 'File not found',
              toast: {
                type: 'error',
                message: 'The requested file could not be found.'
              }
            });
          }
          
          // Log analytics
          logAnalytics('file_info_retrieved', 1, { fileId });
          
          return res.status(200).json({
            success: true,
            data: fileInfo,
            proofLinks: {
              file: ProofLink.buildFileLink(fileId)
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'PUT':
        if (action === 'update-file') {
          // Update File in HFS
          const fileId = query.fileId as string;
          const { userId, fileContent, contentType } = req.body;
          
          if (!fileId || !userId || !fileContent) {
            return res.status(400).json({ 
              error: 'Missing required fields: fileId, userId, fileContent' 
            });
          }
          
          // Validate file size (max 1MB for demo)
          const fileSizeBytes = Buffer.byteLength(fileContent, 'utf8');
          if (fileSizeBytes > 1024 * 1024) {
            return res.status(400).json({ 
              error: 'File size exceeds 1MB limit',
              toast: {
                type: 'error',
                message: 'File size must be less than 1MB.'
              }
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(2000);
          
          // Update file
          const updatedFile = await HederaMockService.file.updateFile(
            fileId,
            fileContent,
            contentType || 'application/octet-stream'
          );
          
          // Log analytics and audit
          logAnalytics('file_updated', fileSizeBytes, { 
            fileId,
            size: fileSizeBytes,
            userId 
          });
          
          logAudit(userId, 'update_file', 'file', fileId, {
            size: fileSizeBytes,
            contentType,
            transactionId: updatedFile.transactionId
          });
          
          return res.status(200).json({
            success: true,
            data: {
              fileId,
              contentType,
              size: fileSizeBytes,
              transactionId: updatedFile.transactionId,
              updatedAt: new Date().toISOString()
            },
            proofOutputs: {
              fileId,
              transactionId: updatedFile.transactionId,
              size: `${(fileSizeBytes / 1024).toFixed(2)} KB`,
              status: 'File updated successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(updatedFile.transactionId),
              file: ProofLink.buildFileLink(fileId)
            },
            toast: {
              type: 'success',
              message: 'File updated successfully!',
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(updatedFile.transactionId)
                }
              ]
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'DELETE':
        if (action === 'delete-file') {
          // Delete File from HFS
          const fileId = query.fileId as string;
          const { userId } = req.body;
          
          if (!fileId || !userId) {
            return res.status(400).json({ 
              error: 'Missing required fields: fileId, userId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1500);
          
          // Delete file
          const deletion = await HederaMockService.file.deleteFile(fileId);
          
          // Log analytics and audit
          logAnalytics('file_deleted', 1, { fileId, userId });
          
          logAudit(userId, 'delete_file', 'file', fileId, {
            transactionId: deletion.transactionId
          });
          
          return res.status(200).json({
            success: true,
            data: {
              fileId,
              transactionId: deletion.transactionId,
              deletedAt: new Date().toISOString()
            },
            proofOutputs: {
              fileId,
              transactionId: deletion.transactionId,
              status: 'File deleted successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(deletion.transactionId)
            },
            toast: {
              type: 'success',
              message: 'File deleted successfully!',
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(deletion.transactionId)
                }
              ]
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hedera File API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      toast: {
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
}