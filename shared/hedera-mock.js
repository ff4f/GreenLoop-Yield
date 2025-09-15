// Hedera Mock Service - Provides consistent demo IDs and utilities
// This service simulates Hedera Hashgraph services for demo purposes

import { MOCK_IDS } from './schema.js';

// Hedera File Service (HFS) Mock
export class HederaFileService {
  static async uploadFile(content, contentType = 'application/octet-stream') {
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fileIds = Object.values(MOCK_IDS.HFS_FILES);
    const randomFileId = fileIds[Math.floor(Math.random() * fileIds.length)];
    
    return {
      fileId: randomFileId,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      size: content.length,
      timestamp: new Date().toISOString(),
      contentType
    };
  }
  
  static async getFile(fileId) {
    // Simulate file retrieval delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock content based on file type
    if (fileId === MOCK_IDS.HFS_FILES.CONTRACT) {
      return 'Mock contract content for carbon credit purchase...';
    } else if (fileId === MOCK_IDS.HFS_FILES.DELIVERY_CERT) {
      return 'Mock delivery certificate content...';
    } else if (fileId === MOCK_IDS.HFS_FILES.CLAIM_PDF) {
      return 'Mock claim PDF content...';
    } else if (fileId === MOCK_IDS.HFS_FILES.CLAIM_JSON) {
      return JSON.stringify({ claimData: 'mock claim data' });
    }
    
    return 'Mock file content';
  }
  
  static async getFileContents(fileId) {
    // Simulate file contents retrieval delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const contents = await this.getFile(fileId);
    
    return {
      fileId,
      contents,
      size: contents.length,
      timestamp: new Date().toISOString()
    };
  }
  
  static async updateFile(fileId, content, contentType = 'application/octet-stream') {
    // Simulate file update delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      fileId,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      size: content.length,
      timestamp: new Date().toISOString(),
      contentType
    };
  }
}

// Hedera Consensus Service (HCS) Mock
export class HederaConsensusService {
  static sequenceCounters = {};
  
  static async createTopic(memo = '') {
    // Simulate topic creation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const topicId = `0.0.${Math.floor(Math.random() * 1000000) + 100000}`;
    this.sequenceCounters[topicId] = 0;
    
    return {
      topicId,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      memo,
      timestamp: new Date().toISOString()
    };
  }
  
  static async submitMessage(topicId, message) {
    // Simulate consensus delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Increment sequence number for this topic
    if (!this.sequenceCounters[topicId]) {
      this.sequenceCounters[topicId] = 0;
    }
    this.sequenceCounters[topicId]++;
    
    return {
      topicId,
      sequenceNumber: this.sequenceCounters[topicId],
      timestamp: new Date().toISOString(),
      message,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`
    };
  }
  
  static async getMessages(topicId, limit = 10) {
    // Simulate retrieval delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const messages = [];
    const currentSequence = this.sequenceCounters[topicId] || 0;
    
    for (let i = Math.max(1, currentSequence - limit + 1); i <= currentSequence; i++) {
      messages.push({
        topicId,
        sequenceNumber: i,
        timestamp: new Date(Date.now() - (currentSequence - i) * 60000).toISOString(),
        message: `Mock message ${i} for topic ${topicId}`
      });
    }
    
    return messages;
  }
  
  static async getTopicInfo(topicId) {
    // Simulate topic info retrieval delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      topicId,
      memo: `Mock topic for ${topicId}`,
      adminKey: null,
      submitKey: null,
      autoRenewPeriod: 7776000, // 90 days in seconds
      autoRenewAccount: null,
      runningHash: '0x1234567890abcdef',
      sequenceNumber: this.sequenceCounters[topicId] || 0
    };
  }
}

// Hedera Token Service (HTS) Mock
export class HederaTokenService {
  static async createToken(name, symbol, decimals, initialSupply) {
    // Simulate token creation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tokenId = `0.0.${Math.floor(Math.random() * 1000000) + 400000}`;
    
    return {
      tokenId,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      name,
      symbol,
      decimals,
      totalSupply: initialSupply,
      timestamp: new Date().toISOString()
    };
  }
  
  static async createFungibleToken(name, symbol, initialSupply) {
    // Simulate token creation delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      tokenId: MOCK_IDS.HTS_TOKENS.FT_TONS,
      name,
      symbol,
      totalSupply: initialSupply.toString(),
      tokenType: 'FUNGIBLE_COMMON'
    };
  }
  
  static async createNFT(name, symbol) {
    // Simulate NFT creation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      tokenId: MOCK_IDS.HTS_TOKENS.NFT_BADGE,
      name,
      symbol,
      tokenType: 'NON_FUNGIBLE_UNIQUE'
    };
  }
  
  static async mintToken(tokenId, amount) {
    // Simulate token minting delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      tokenId,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      newTotalSupply: amount,
      timestamp: new Date().toISOString()
    };
  }
  
  static async transferToken(tokenId, fromAccount, toAccount, amount) {
    // Simulate transfer delay
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const txHashes = Object.values(MOCK_IDS.TX_HASHES);
    const randomTxHash = txHashes[Math.floor(Math.random() * txHashes.length)];
    
    return {
      txHash: randomTxHash,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      fee: '0.001'
    };
  }
}

// Transaction Service Mock
export class HederaTransactionService {
  static async submitTransaction(type, amount) {
    // Simulate transaction processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let txHash;
    switch (type) {
      case 'ESCROW':
        txHash = MOCK_IDS.TX_HASHES.ESCROW;
        break;
      case 'DELIVERY':
        txHash = MOCK_IDS.TX_HASHES.DELIVERY;
        break;
      case 'PAYOUT':
        txHash = MOCK_IDS.TX_HASHES.PAYOUT;
        break;
      default:
        txHash = MOCK_IDS.TX_HASHES.ESCROW;
    }
    
    return {
      txHash,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      fee: '0.001'
    };
  }
  
  static async getTransaction(txHash) {
    // Simulate transaction lookup delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      txHash,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      fee: '0.001'
    };
  }
}

// Unified Hedera Mock Service
export class HederaMockService {
  static file = HederaFileService;
  static consensus = HederaConsensusService;
  static token = HederaTokenService;
  static transaction = HederaTransactionService;
  
  static async testConnection() {
    // Simulate connection test delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      network: 'mock',
      timestamp: new Date().toISOString()
    };
  }
  
  // Generate demo proof with consistent IDs
  static generateDemoProof(type) {
    const proofHashes = {
      'PHOTO': MOCK_IDS.PROOF_HASHES.PHOTO,
      'NDVI': MOCK_IDS.PROOF_HASHES.NDVI,
      'QC': MOCK_IDS.PROOF_HASHES.QC
    };
    return proofHashes[type] || MOCK_IDS.PROOF_HASHES.PHOTO;
  }
  
  static async simulateNetworkDelay(ms = 500) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static async testConnection() {
     // Simulate connection test delay
     await new Promise(resolve => setTimeout(resolve, 200));
     
     return {
       success: true,
       network: 'mock',
       timestamp: new Date().toISOString()
     };
   }
}

export default HederaMockService;

// ES module exports only