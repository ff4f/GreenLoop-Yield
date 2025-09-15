// Mirror Worker - Pulls messages from Hedera Mirror Node and stores in database
// This worker provides audit trail and real-time sync with Hedera network

import { QueryHelpers } from '../shared/database.js';
import { HederaRealService } from '../shared/hedera-real.js';
import { HederaMockService } from '../shared/hedera-mock.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;

// Mirror Node API configuration
const MIRROR_NODE_URL = process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
const POLL_INTERVAL = parseInt(process.env.MIRROR_POLL_INTERVAL) || 30000; // 30 seconds
const MAX_MESSAGES_PER_POLL = parseInt(process.env.MIRROR_MAX_MESSAGES) || 100;

// Topic IDs to monitor - Subscribe to all gly.* topics
const MONITORED_TOPICS = {
  CARBON_LOTS: process.env.HEDERA_TOPIC_CARBON_LOTS || '0.0.789012',
  ORDERS: process.env.HEDERA_TOPIC_ORDERS || '0.0.789013', 
  PROOFS: process.env.HEDERA_TOPIC_PROOFS || '0.0.789014',
  SETTLEMENTS: process.env.HEDERA_TOPIC_SETTLEMENTS || '0.0.789015',
  // Additional gly.* topics
  GLY_LOTS: process.env.HEDERA_TOPIC_GLY_LOTS || '0.0.789016',
  GLY_ORDERS: process.env.HEDERA_TOPIC_GLY_ORDERS || '0.0.789017',
  GLY_PROOFS: process.env.HEDERA_TOPIC_GLY_PROOFS || '0.0.789018',
  GLY_SETTLEMENTS: process.env.HEDERA_TOPIC_GLY_SETTLEMENTS || '0.0.789019'
};

// Topic name patterns to monitor
const TOPIC_PATTERNS = ['gly.', 'carbon.', 'proof.', 'order.', 'settlement.'];

// Last processed sequence numbers for each topic
const lastProcessedSequence = {};

class MirrorWorker {
  constructor() {
    this.isRunning = false;
    this.pollTimeout = null;
  }

  async start() {
    if (this.isRunning) {
      console.log('Mirror worker is already running');
      return;
    }

    console.log('Starting Mirror Worker...');
    this.isRunning = true;

    // Initialize last processed sequence numbers
    await this.initializeSequenceNumbers();

    // Start polling
    this.poll();
  }

  async stop() {
    console.log('Stopping Mirror Worker...');
    this.isRunning = false;
    
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  async initializeSequenceNumbers() {
    for (const [topicName, topicId] of Object.entries(MONITORED_TOPICS)) {
      try {
        // Get last processed message from database
        const lastEvent = await QueryHelpers.getLastHcsEvent(topicId);
        lastProcessedSequence[topicId] = lastEvent ? parseInt(lastEvent.sequenceNumber) : 0;
        
        console.log(`Initialized ${topicName} (${topicId}) from sequence ${lastProcessedSequence[topicId]}`);
      } catch (error) {
        console.error(`Failed to initialize sequence for ${topicName}:`, error);
        lastProcessedSequence[topicId] = 0;
      }
    }
  }

  async poll() {
    if (!this.isRunning) return;

    try {
      console.log('Polling Mirror Node for new messages...');
      
      // Process each monitored topic
      for (const [topicName, topicId] of Object.entries(MONITORED_TOPICS)) {
        await this.processTopicMessages(topicName, topicId);
      }
    } catch (error) {
      console.error('Mirror worker poll error:', error);
    }

    // Schedule next poll
    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.poll(), POLL_INTERVAL);
    }
  }

  async processTopicMessages(topicName, topicId) {
    try {
      const fromSequence = lastProcessedSequence[topicId] + 1;
      const messages = await this.fetchMessagesFromMirror(topicId, fromSequence);
      
      if (messages.length === 0) {
        return;
      }

      console.log(`Processing ${messages.length} new messages for ${topicName}`);

      for (const message of messages) {
        await this.processMessage(topicName, topicId, message);
        lastProcessedSequence[topicId] = parseInt(message.sequence_number);
      }

      console.log(`Processed ${messages.length} messages for ${topicName}, last sequence: ${lastProcessedSequence[topicId]}`);
    } catch (error) {
      console.error(`Error processing ${topicName} messages:`, error);
    }
  }

  async fetchMessagesFromMirror(topicId, fromSequence) {
    try {
      const url = `${MIRROR_NODE_URL}/api/v1/topics/${topicId}/messages?sequencenumber=gte:${fromSequence}&limit=${MAX_MESSAGES_PER_POLL}&order=asc`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error(`Failed to fetch messages from Mirror Node:`, error);
      return [];
    }
  }

  async processMessage(topicName, topicId, message) {
    try {
      // Decode message content from base64
      const messageContent = Buffer.from(message.message, 'base64').toString('utf-8');
      
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(messageContent);
      } catch (parseError) {
        console.warn(`Failed to parse message content as JSON:`, messageContent);
        parsedMessage = { raw: messageContent };
      }

      // Extract additional fields for audit trail
      const lotId = parsedMessage.lotId || null;
      const orderId = parsedMessage.orderId || null;
      const proofType = parsedMessage.proofType || parsedMessage.type || null;
      const userId = parsedMessage.userId || parsedMessage.submittedBy || null;

      // Store HCS event in database with all required fields
      const hcsEvent = {
        id: QueryHelpers.genId('hcs'),
        topicId,
        sequenceNumber: message.sequence_number.toString(),
        consensusTimestamp: message.consensus_timestamp,
        runningHash: message.running_hash,
        messageContent,
        parsedMessage: {
          ...parsedMessage,
          lotId,
          orderId,
          proofType,
          userId,
          timestamp: new Date().toISOString()
        },
        topicName,
        hcsEventId: `${topicId}-${message.sequence_number}`,
        confirmed: true,
        createdAt: new Date(),
        processedAt: new Date()
      };

      await QueryHelpers.createHcsEvent(hcsEvent);

      // Process specific message types
      await this.handleMessageType(parsedMessage, hcsEvent);

      console.log(`Stored HCS event: ${topicName} seq=${message.sequence_number} type=${parsedMessage.type || 'unknown'} lotId=${lotId} orderId=${orderId}`);
    } catch (error) {
      console.error(`Failed to process message:`, error);
    }
  }

  async handleMessageType(parsedMessage, hcsEvent) {
    try {
      const messageType = parsedMessage.type;
      
      switch (messageType) {
        case 'PROOF_ADDED':
          await this.handleProofAdded(parsedMessage, hcsEvent);
          break;
        case 'ORDER_CREATED':
        case 'ORDER_DELIVERED':
        case 'ORDER_SETTLED':
          await this.handleOrderEvent(parsedMessage, hcsEvent);
          break;
        case 'CARBON_LOT_CREATED':
        case 'CARBON_LOT_UPDATED':
          await this.handleCarbonLotEvent(parsedMessage, hcsEvent);
          break;
        case 'SETTLEMENT_COMPLETED':
          await this.handleSettlementEvent(parsedMessage, hcsEvent);
          break;
        default:
          console.log(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error(`Failed to handle message type:`, error);
    }
  }

  async handleProofAdded(message, hcsEvent) {
    // Update proof record with HCS confirmation
    if (message.lotId && message.proofType) {
      await QueryHelpers.updateProofByLotAndType(message.lotId, message.proofType, {
        hcsEventId: hcsEvent.id,
        consensusTimestamp: hcsEvent.consensusTimestamp,
        confirmed: true
      });
    }
  }

  async handleOrderEvent(message, hcsEvent) {
    // Update order with HCS confirmation
    if (message.orderId) {
      await QueryHelpers.updateOrder(message.orderId, {
        lastHcsEventId: hcsEvent.id,
        lastConsensusTimestamp: hcsEvent.consensusTimestamp
      });
    }
  }

  async handleCarbonLotEvent(message, hcsEvent) {
    // Update carbon lot with HCS confirmation
    if (message.lotId) {
      await QueryHelpers.updateCarbonLot(message.lotId, {
        lastHcsEventId: hcsEvent.id,
        lastConsensusTimestamp: hcsEvent.consensusTimestamp
      });
    }
  }

  async handleSettlementEvent(message, hcsEvent) {
    // Log settlement analytics
    await QueryHelpers.logAnalytics('settlement_confirmed', {
      orderId: message.orderId,
      amount: message.amount,
      hcsEventId: hcsEvent.id,
      consensusTimestamp: hcsEvent.consensusTimestamp
    });
  }

  // Health check method
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastProcessedSequence: { ...lastProcessedSequence },
      monitoredTopics: MONITORED_TOPICS,
      pollInterval: POLL_INTERVAL,
      mirrorNodeUrl: MIRROR_NODE_URL,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  // Health endpoint handler
  async getHealthStatus() {
    try {
      const status = this.getStatus();
      const dbHealth = await QueryHelpers.testConnection?.() || { success: true };
      
      return {
        success: true,
        status: 'healthy',
        worker: status,
        database: dbHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const mirrorWorker = new MirrorWorker();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await mirrorWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await mirrorWorker.stop();
  process.exit(0);
});

// Start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Mirror Worker as standalone process...');
  mirrorWorker.start().catch(error => {
    console.error('Failed to start Mirror Worker:', error);
    process.exit(1);
  });
}

export default mirrorWorker;
export { MirrorWorker };