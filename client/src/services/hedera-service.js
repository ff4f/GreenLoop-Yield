import { 
  Client, 
  PrivateKey, 
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
  Hbar,
  Status
} from '@hashgraph/sdk';

// Hedera network configuration
const HEDERA_NETWORK = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
const OPERATOR_ID = import.meta.env.VITE_HEDERA_OPERATOR_ID;
const OPERATOR_KEY = import.meta.env.VITE_HEDERA_OPERATOR_KEY;

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    this.isInitialized = false;
  }

  // Initialize Hedera client
  async initialize() {
    try {
      if (OPERATOR_ID && OPERATOR_KEY) {
        this.operatorId = AccountId.fromString(OPERATOR_ID);
        this.operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        
        this.client = Client.forTestnet();
        this.client.setOperator(this.operatorId, this.operatorKey);
        
        this.isInitialized = true;
        console.log('Hedera client initialized successfully');
      } else {
        console.warn('Hedera credentials not found, using mock mode');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      this.isInitialized = false;
    }
  }

  // HTS (Hedera Token Service) Functions
  
  /**
   * Create a carbon credit token
   * @param {string} name - Token name
   * @param {string} symbol - Token symbol
   * @param {number} decimals - Token decimals
   * @param {number} initialSupply - Initial token supply
   * @param {string} treasuryAccountId - Treasury account ID
   * @returns {Promise<Object>} Token creation result
   */
  async createCarbonToken(name, symbol, decimals = 2, initialSupply = 0, treasuryAccountId = null) {
    if (!this.isInitialized) {
      return this._mockTokenCreation(name, symbol);
    }

    try {
      const treasuryAccount = treasuryAccountId ? AccountId.fromString(treasuryAccountId) : this.operatorId;
      
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(treasuryAccount)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(this.operatorKey)
        .setAdminKey(this.operatorKey)
        .setFreezeDefault(false)
        .setMaxTransactionFee(new Hbar(30));

      const tokenCreateSubmit = await tokenCreateTx.execute(this.client);
      const tokenCreateRx = await tokenCreateSubmit.getReceipt(this.client);
      const tokenId = tokenCreateRx.tokenId;

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionId: tokenCreateSubmit.transactionId.toString(),
        name,
        symbol,
        decimals,
        initialSupply
      };
    } catch (error) {
      console.error('Token creation failed:', error);
      return {
        success: false,
        error: error.message,
        tokenId: null
      };
    }
  }

  /**
   * Mint carbon credit tokens
   * @param {string} tokenId - Token ID to mint
   * @param {number} amount - Amount to mint
   * @param {string} metadata - Optional metadata
   * @returns {Promise<Object>} Mint result
   */
  async mintCarbonTokens(tokenId, amount, metadata = '') {
    if (!this.isInitialized) {
      return this._mockTokenMint(tokenId, amount);
    }

    try {
      const tokenMintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount * 100) // Convert to smallest unit
        .setMaxTransactionFee(new Hbar(20));

      if (metadata) {
        tokenMintTx.setMetadata([Buffer.from(metadata)]);
      }

      const tokenMintSubmit = await tokenMintTx.execute(this.client);
      const tokenMintRx = await tokenMintSubmit.getReceipt(this.client);

      return {
        success: true,
        transactionId: tokenMintSubmit.transactionId.toString(),
        newTotalSupply: tokenMintRx.totalSupply.toString(),
        amount
      };
    } catch (error) {
      console.error('Token minting failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Transfer carbon credit tokens
   * @param {string} tokenId - Token ID
   * @param {string} fromAccountId - Sender account ID
   * @param {string} toAccountId - Receiver account ID
   * @param {number} amount - Amount to transfer
   * @returns {Promise<Object>} Transfer result
   */
  async transferCarbonTokens(tokenId, fromAccountId, toAccountId, amount) {
    if (!this.isInitialized) {
      return this._mockTokenTransfer(tokenId, fromAccountId, toAccountId, amount);
    }

    try {
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, fromAccountId, -amount * 100)
        .addTokenTransfer(tokenId, toAccountId, amount * 100)
        .setMaxTransactionFee(new Hbar(10));

      const transferSubmit = await transferTx.execute(this.client);
      const transferRx = await transferSubmit.getReceipt(this.client);

      return {
        success: true,
        transactionId: transferSubmit.transactionId.toString(),
        status: transferRx.status.toString(),
        amount,
        from: fromAccountId,
        to: toAccountId
      };
    } catch (error) {
      console.error('Token transfer failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // HFS (Hedera File Service) Functions
  
  /**
   * Create a file on Hedera File Service
   * @param {string} content - File content
   * @param {string} memo - File memo/description
   * @returns {Promise<Object>} File creation result
   */
  async createFile(content, memo = '') {
    if (!this.isInitialized) {
      return this._mockFileCreation(content, memo);
    }

    try {
      const fileCreateTx = new FileCreateTransaction()
        .setContents(content)
        .setKeys([this.operatorKey])
        .setMaxTransactionFee(new Hbar(5));

      if (memo) {
        fileCreateTx.setFileMemo(memo);
      }

      const fileCreateSubmit = await fileCreateTx.execute(this.client);
      const fileCreateRx = await fileCreateSubmit.getReceipt(this.client);
      const fileId = fileCreateRx.fileId;

      return {
        success: true,
        fileId: fileId.toString(),
        transactionId: fileCreateSubmit.transactionId.toString(),
        memo,
        size: content.length
      };
    } catch (error) {
      console.error('File creation failed:', error);
      return {
        success: false,
        error: error.message,
        fileId: null
      };
    }
  }

  /**
   * Append content to an existing file
   * @param {string} fileId - File ID
   * @param {string} content - Content to append
   * @returns {Promise<Object>} Append result
   */
  async appendToFile(fileId, content) {
    if (!this.isInitialized) {
      return this._mockFileAppend(fileId, content);
    }

    try {
      const fileAppendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(content)
        .setMaxTransactionFee(new Hbar(5));

      const fileAppendSubmit = await fileAppendTx.execute(this.client);
      const fileAppendRx = await fileAppendSubmit.getReceipt(this.client);

      return {
        success: true,
        transactionId: fileAppendSubmit.transactionId.toString(),
        status: fileAppendRx.status.toString(),
        appendedSize: content.length
      };
    } catch (error) {
      console.error('File append failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // HCS (Hedera Consensus Service) Functions
  
  /**
   * Create a consensus topic
   * @param {string} memo - Topic memo/description
   * @param {string} adminKey - Admin key (optional)
   * @returns {Promise<Object>} Topic creation result
   */
  async createTopic(memo = '', adminKey = null) {
    if (!this.isInitialized) {
      return this._mockTopicCreation(memo);
    }

    try {
      const topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setMaxTransactionFee(new Hbar(5));

      if (adminKey) {
        topicCreateTx.setAdminKey(adminKey);
      }

      const topicCreateSubmit = await topicCreateTx.execute(this.client);
      const topicCreateRx = await topicCreateSubmit.getReceipt(this.client);
      const topicId = topicCreateRx.topicId;

      return {
        success: true,
        topicId: topicId.toString(),
        transactionId: topicCreateSubmit.transactionId.toString(),
        memo
      };
    } catch (error) {
      console.error('Topic creation failed:', error);
      return {
        success: false,
        error: error.message,
        topicId: null
      };
    }
  }

  /**
   * Submit a message to a consensus topic
   * @param {string} topicId - Topic ID
   * @param {string} message - Message content
   * @returns {Promise<Object>} Message submission result
   */
  async submitTopicMessage(topicId, message) {
    if (!this.isInitialized) {
      return this._mockTopicMessage(topicId, message);
    }

    try {
      const topicMessageTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .setMaxTransactionFee(new Hbar(2));

      const topicMessageSubmit = await topicMessageTx.execute(this.client);
      const topicMessageRx = await topicMessageSubmit.getReceipt(this.client);

      return {
        success: true,
        transactionId: topicMessageSubmit.transactionId.toString(),
        status: topicMessageRx.status.toString(),
        sequenceNumber: topicMessageRx.topicSequenceNumber.toString(),
        runningHash: topicMessageRx.topicRunningHash.toString()
      };
    } catch (error) {
      console.error('Topic message submission failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mock functions for development/testing
  
  _mockTokenCreation(name, symbol) {
    const mockTokenId = `0.0.${Math.floor(Math.random() * 999999) + 100000}`;
    return {
      success: true,
      tokenId: mockTokenId,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      name,
      symbol,
      decimals: 2,
      initialSupply: 0
    };
  }

  _mockTokenMint(tokenId, amount) {
    return {
      success: true,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      newTotalSupply: (amount * 100).toString(),
      amount
    };
  }

  _mockTokenTransfer(tokenId, fromAccountId, toAccountId, amount) {
    return {
      success: true,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      status: 'SUCCESS',
      amount,
      from: fromAccountId,
      to: toAccountId
    };
  }

  _mockFileCreation(content, memo) {
    const mockFileId = `0.0.${Math.floor(Math.random() * 999999) + 100000}`;
    return {
      success: true,
      fileId: mockFileId,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      memo,
      size: content.length
    };
  }

  _mockFileAppend(fileId, content) {
    return {
      success: true,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      status: 'SUCCESS',
      appendedSize: content.length
    };
  }

  _mockTopicCreation(memo) {
    const mockTopicId = `0.0.${Math.floor(Math.random() * 999999) + 100000}`;
    return {
      success: true,
      topicId: mockTopicId,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      memo
    };
  }

  _mockTopicMessage(topicId, message) {
    return {
      success: true,
      transactionId: `0.0.${Math.floor(Math.random() * 999999)}@${Date.now()}.${Math.floor(Math.random() * 999999999)}`,
      status: 'SUCCESS',
      sequenceNumber: Math.floor(Math.random() * 1000).toString(),
      runningHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };
  }

  // Utility functions
  
  /**
   * Get network status
   * @returns {Object} Network status
   */
  getNetworkStatus() {
    return {
      network: HEDERA_NETWORK,
      isInitialized: this.isInitialized,
      operatorId: this.operatorId?.toString() || null,
      client: this.client ? 'Connected' : 'Disconnected'
    };
  }

  /**
   * Format Hedera transaction ID for display
   * @param {string} transactionId - Transaction ID
   * @returns {string} Formatted transaction ID
   */
  formatTransactionId(transactionId) {
    if (!transactionId) return 'N/A';
    return transactionId.length > 20 ? `${transactionId.substring(0, 20)}...` : transactionId;
  }

  /**
   * Generate Hedera explorer URL
   * @param {string} type - Type (transaction, account, token, file, topic)
   * @param {string} id - ID to link to
   * @returns {string} Explorer URL
   */
  getExplorerUrl(type, id) {
    const baseUrl = HEDERA_NETWORK === 'mainnet' 
      ? 'https://hashscan.io/mainnet'
      : 'https://hashscan.io/testnet';
    
    switch (type) {
      case 'transaction':
        return `${baseUrl}/transaction/${id}`;
      case 'account':
        return `${baseUrl}/account/${id}`;
      case 'token':
        return `${baseUrl}/token/${id}`;
      case 'file':
        return `${baseUrl}/file/${id}`;
      case 'topic':
        return `${baseUrl}/topic/${id}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Generate HashScan link for transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Object} HashScan link object
   */
  getTransactionLink(transactionId) {
    return {
      url: this.getExplorerUrl('transaction', transactionId),
      label: this.formatTransactionId(transactionId),
      type: 'transaction',
      id: transactionId
    };
  }

  /**
   * Generate HashScan link for file
   * @param {string} fileId - File ID
   * @returns {Object} HashScan link object
   */
  getFileLink(fileId) {
    return {
      url: this.getExplorerUrl('file', fileId),
      label: fileId,
      type: 'file',
      id: fileId
    };
  }

  /**
   * Generate HashScan link for topic
   * @param {string} topicId - Topic ID
   * @param {string} sequenceNumber - Optional sequence number
   * @returns {Object} HashScan link object
   */
  getTopicLink(topicId, sequenceNumber = null) {
    const url = sequenceNumber 
      ? `${this.getExplorerUrl('topic', topicId)}/message/${sequenceNumber}`
      : this.getExplorerUrl('topic', topicId);
    
    const label = sequenceNumber 
      ? `${topicId}#${sequenceNumber}`
      : topicId;
    
    return {
      url,
      label,
      type: 'topic',
      id: topicId,
      sequenceNumber
    };
  }

  /**
   * Generate HashScan link for token
   * @param {string} tokenId - Token ID
   * @returns {Object} HashScan link object
   */
  getTokenLink(tokenId) {
    return {
      url: this.getExplorerUrl('token', tokenId),
      label: tokenId,
      type: 'token',
      id: tokenId
    };
  }

  /**
   * Generate multiple HashScan links from operation result
   * @param {Object} result - Operation result from HTS/HFS/HCS methods
   * @param {string} operationType - Type of operation (create, mint, transfer, etc.)
   * @returns {Array} Array of HashScan link objects
   */
  getOperationLinks(result, operationType) {
    const links = [];
    
    // Always include transaction link if available
    if (result.transactionId) {
      links.push(this.getTransactionLink(result.transactionId));
    }
    
    // Add specific links based on operation type and result
    switch (operationType) {
      case 'createToken':
        if (result.tokenId) {
          links.push(this.getTokenLink(result.tokenId));
        }
        break;
      case 'createFile':
        if (result.fileId) {
          links.push(this.getFileLink(result.fileId));
        }
        break;
      case 'createTopic':
        if (result.topicId) {
          links.push(this.getTopicLink(result.topicId));
        }
        break;
      case 'submitTopicMessage':
        if (result.topicId && result.sequenceNumber) {
          links.push(this.getTopicLink(result.topicId, result.sequenceNumber));
        }
        break;
    }
    
    return links;
  }
}

// Create singleton instance
const hederaService = new HederaService();

// Initialize on import
hederaService.initialize();

export default hederaService;