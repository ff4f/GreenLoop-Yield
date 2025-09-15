// Network Status API - Shows Hedera network connection status
// GET /api/network/status

import { Client, AccountBalanceQuery } from '@hashgraph/sdk';

// Environment configuration
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;
const USE_REAL_HEDERA = process.env.USE_REAL_HEDERA === 'true';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    const networkStatus = {
      network: HEDERA_NETWORK,
      useRealHedera: USE_REAL_HEDERA,
      operatorId: OPERATOR_ID,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      connectionTest: null,
      error: null
    };

    if (!USE_REAL_HEDERA) {
      networkStatus.status = 'mock';
      networkStatus.connectionTest = {
        success: true,
        message: 'Using mock Hedera service - no real network connection'
      };
      
      return res.status(200).json(networkStatus);
    }

    // Test real Hedera connection
    if (!OPERATOR_ID) {
      networkStatus.status = 'error';
      networkStatus.error = 'HEDERA_OPERATOR_ID not configured';
      return res.status(500).json(networkStatus);
    }

    try {
      // Create client and test connection
      let client;
      if (HEDERA_NETWORK === 'mainnet') {
        client = Client.forMainnet();
      } else {
        client = Client.forTestnet();
      }

      // Test connection by querying operator account balance
      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(OPERATOR_ID);
      
      const balance = await balanceQuery.execute(client);
      
      networkStatus.status = 'connected';
      networkStatus.connectionTest = {
        success: true,
        message: `Successfully connected to Hedera ${HEDERA_NETWORK}`,
        operatorBalance: balance.hbars.toString(),
        testTimestamp: new Date().toISOString()
      };
      
      client.close();
      
    } catch (connectionError) {
      console.error('Hedera connection test failed:', connectionError);
      
      networkStatus.status = 'error';
      networkStatus.connectionTest = {
        success: false,
        message: 'Failed to connect to Hedera network',
        error: connectionError.message
      };
      networkStatus.error = connectionError.message;
    }

    return res.status(200).json(networkStatus);
    
  } catch (error) {
    console.error('Network status API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Additional utility function to get network info
export function getNetworkInfo() {
  return {
    network: HEDERA_NETWORK,
    useRealHedera: USE_REAL_HEDERA,
    operatorId: OPERATOR_ID,
    mirrorNodeUrl: process.env.MIRROR_NODE_URL,
    topics: {
      carbonLots: process.env.HEDERA_TOPIC_CARBON_LOTS,
      orders: process.env.HEDERA_TOPIC_ORDERS,
      proofs: process.env.HEDERA_TOPIC_PROOFS,
      settlements: process.env.HEDERA_TOPIC_SETTLEMENTS
    }
  };
}