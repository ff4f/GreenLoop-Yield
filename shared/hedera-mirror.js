// Hedera Mirror Node Service - Real-time blockchain data integration
// Provides live data from Hedera network via Mirror Node REST API

const MIRROR_NODE_BASE_URL = 'https://testnet.mirrornode.hedera.com/api/v1';
const HASHSCAN_BASE_URL = 'https://hashscan.io/testnet';

// Mirror Node API client
export class HederaMirrorNodeService {
  static async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // Get topic messages for live proof feed
  static async getTopicMessages(topicId, limit = 50, order = 'desc') {
    try {
      const url = `${MIRROR_NODE_BASE_URL}/topics/${topicId}/messages?limit=${limit}&order=${order}`;
      const response = await this.fetchWithRetry(url);
      
      return {
        success: true,
        messages: response.messages?.map(msg => ({
          consensusTimestamp: msg.consensus_timestamp,
          sequenceNumber: msg.sequence_number,
          message: msg.message ? atob(msg.message) : null, // Base64 decode
          runningHash: msg.running_hash,
          topicId: msg.topic_id,
          payerAccountId: msg.payer_account_id,
          validStartTimestamp: msg.valid_start_timestamp
        })) || [],
        links: response.links || {}
      };
    } catch (error) {
      console.error('Failed to fetch topic messages:', error);
      return {
        success: false,
        error: error.message,
        messages: []
      };
    }
  }

  // Get specific message by sequence number
  static async getTopicMessage(topicId, sequenceNumber) {
    try {
      const url = `${MIRROR_NODE_BASE_URL}/topics/${topicId}/messages/${sequenceNumber}`;
      const response = await this.fetchWithRetry(url);
      
      return {
        success: true,
        message: {
          consensusTimestamp: response.consensus_timestamp,
          sequenceNumber: response.sequence_number,
          message: response.message ? atob(response.message) : null,
          runningHash: response.running_hash,
          topicId: response.topic_id,
          payerAccountId: response.payer_account_id,
          validStartTimestamp: response.valid_start_timestamp
        }
      };
    } catch (error) {
      console.error('Failed to fetch topic message:', error);
      return {
        success: false,
        error: error.message,
        message: null
      };
    }
  }

  // Get transaction details
  static async getTransaction(transactionId) {
    try {
      const url = `${MIRROR_NODE_BASE_URL}/transactions/${transactionId}`;
      const response = await this.fetchWithRetry(url);
      
      const transaction = response.transactions?.[0];
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      return {
        success: true,
        transaction: {
          transactionId: transaction.transaction_id,
          consensusTimestamp: transaction.consensus_timestamp,
          result: transaction.result,
          name: transaction.name,
          payerAccountId: transaction.payer_account_id,
          chargedTxFee: transaction.charged_tx_fee,
          validStartTimestamp: transaction.valid_start_timestamp,
          transfers: transaction.transfers || []
        }
      };
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      return {
        success: false,
        error: error.message,
        transaction: null
      };
    }
  }

  // Get account information
  static async getAccount(accountId) {
    try {
      const url = `${MIRROR_NODE_BASE_URL}/accounts/${accountId}`;
      const response = await this.fetchWithRetry(url);
      
      return {
        success: true,
        account: {
          accountId: response.account,
          balance: response.balance?.balance || 0,
          createdTimestamp: response.created_timestamp,
          publicKey: response.key?.key,
          autoRenewPeriod: response.auto_renew_period,
          memo: response.memo
        }
      };
    } catch (error) {
      console.error('Failed to fetch account:', error);
      return {
        success: false,
        error: error.message,
        account: null
      };
    }
  }

  // Get token information
  static async getToken(tokenId) {
    try {
      const url = `${MIRROR_NODE_BASE_URL}/tokens/${tokenId}`;
      const response = await this.fetchWithRetry(url);
      
      return {
        success: true,
        token: {
          tokenId: response.token_id,
          name: response.name,
          symbol: response.symbol,
          decimals: response.decimals,
          totalSupply: response.total_supply,
          treasuryAccountId: response.treasury_account_id,
          adminKey: response.admin_key,
          supplyKey: response.supply_key,
          createdTimestamp: response.created_timestamp,
          type: response.type
        }
      };
    } catch (error) {
      console.error('Failed to fetch token:', error);
      return {
        success: false,
        error: error.message,
        token: null
      };
    }
  }

  // Get file information
  static async getFile(fileId) {
    try {
      const url = `${MIRROR_NODE_BASE_URL}/files/${fileId}`;
      const response = await this.fetchWithRetry(url);
      
      return {
        success: true,
        file: {
          fileId: response.file_id,
          size: response.size,
          createdTimestamp: response.created_timestamp,
          modifiedTimestamp: response.modified_timestamp,
          memo: response.memo,
          keys: response.keys || []
        }
      };
    } catch (error) {
      console.error('Failed to fetch file:', error);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  // Generate HashScan links
  static generateHashScanLinks(data) {
    const links = {};
    
    if (data.transactionId) {
      links.transaction = `${HASHSCAN_BASE_URL}/transaction/${data.transactionId}`;
    }
    
    if (data.topicId && data.sequenceNumber) {
      links.topic = `${HASHSCAN_BASE_URL}/topic/${data.topicId}/message/${data.sequenceNumber}`;
    }
    
    if (data.tokenId) {
      links.token = `${HASHSCAN_BASE_URL}/token/${data.tokenId}`;
    }
    
    if (data.fileId) {
      links.file = `${HASHSCAN_BASE_URL}/file/${data.fileId}`;
    }
    
    if (data.accountId) {
      links.account = `${HASHSCAN_BASE_URL}/account/${data.accountId}`;
    }
    
    return links;
  }

  // Parse proof message from HCS topic
  static parseProofMessage(messageData) {
    try {
      const parsed = JSON.parse(messageData);
      
      // Validate proof message structure
      if (!parsed.type || !parsed.lotId || !parsed.projectId) {
        throw new Error('Invalid proof message structure');
      }
      
      return {
        success: true,
        proof: {
          type: parsed.type,
          lotId: parsed.lotId,
          projectId: parsed.projectId,
          title: parsed.title || `${parsed.type} proof`,
          description: parsed.description || '',
          fileId: parsed.fileId,
          metadata: parsed.metadata || {},
          submittedBy: parsed.submittedBy || 'unknown',
          verified: parsed.verified || false
        }
      };
    } catch (error) {
      console.error('Failed to parse proof message:', error);
      return {
        success: false,
        error: error.message,
        proof: null
      };
    }
  }

  // Get live proof feed from multiple topics
  static async getLiveProofFeed(topicIds = [], limit = 50) {
    try {
      const allProofs = [];
      
      // Fetch messages from all topics in parallel
      const topicPromises = topicIds.map(topicId => 
        this.getTopicMessages(topicId, limit)
      );
      
      const topicResults = await Promise.allSettled(topicPromises);
      
      // Process messages from all topics
      topicResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          const topicId = topicIds[index];
          
          result.value.messages.forEach(msg => {
            const parseResult = this.parseProofMessage(msg.message);
            
            if (parseResult.success) {
              allProofs.push({
                id: `${topicId}-${msg.sequenceNumber}`,
                ...parseResult.proof,
                topicId,
                sequenceNumber: msg.sequenceNumber,
                timestamp: msg.consensusTimestamp,
                consensusTimestamp: msg.consensusTimestamp,
                runningHash: msg.runningHash,
                payerAccountId: msg.payerAccountId,
                source: 'Mirror Node',
                operator: msg.payerAccountId
              });
            }
          });
        }
      });
      
      // Sort by consensus timestamp (newest first)
      allProofs.sort((a, b) => 
        new Date(b.consensusTimestamp).getTime() - new Date(a.consensusTimestamp).getTime()
      );
      
      return {
        success: true,
        proofs: allProofs.slice(0, limit),
        meta: {
          total: allProofs.length,
          topicsQueried: topicIds.length,
          source: 'Hedera Mirror Node'
        }
      };
    } catch (error) {
      console.error('Failed to get live proof feed:', error);
      return {
        success: false,
        error: error.message,
        proofs: []
      };
    }
  }
}

export default HederaMirrorNodeService;