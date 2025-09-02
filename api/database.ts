// Database Management API Endpoint
// Provides database health checks, seeding, and management operations

import { DatabaseService } from '../shared/database.js';
import { DatabaseSeeder } from '../scripts/seed-database.js';

export default async function handler(req, res) {
  const { method, query } = req;
  const { action } = query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (action) {
      case 'health':
        return await handleHealthCheck(req, res);
      
      case 'seed':
        return await handleSeedDatabase(req, res);
      
      case 'clear':
        return await handleClearDatabase(req, res);
      
      case 'counts':
        return await handleTableCounts(req, res);
      
      case 'test-connection':
        return await handleTestConnection(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Available actions: health, seed, clear, counts, test-connection'
        });
    }
  } catch (error) {
    console.error('Database API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Health check endpoint
async function handleHealthCheck(req, res) {
  const health = await DatabaseService.healthCheck();
  
  return res.status(health.success ? 200 : 500).json({
    ...health,
    endpoint: 'database/health',
    timestamp: new Date().toISOString()
  });
}

// Database seeding endpoint
async function handleSeedDatabase(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST for seeding.'
    });
  }

  const { clearExisting = true, verbose = false } = req.body || {};
  
  const seeder = new DatabaseSeeder({ clearExisting, verbose });
  const result = await seeder.run();
  
  return res.status(result.success ? 200 : 500).json({
    ...result,
    endpoint: 'database/seed',
    timestamp: new Date().toISOString()
  });
}

// Clear database endpoint
async function handleClearDatabase(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST for clearing.'
    });
  }

  const result = await DatabaseService.clearAllTables();
  
  return res.status(result.success ? 200 : 500).json({
    ...result,
    endpoint: 'database/clear',
    timestamp: new Date().toISOString()
  });
}

// Table counts endpoint
async function handleTableCounts(req, res) {
  const result = await DatabaseService.getTableCounts();
  
  return res.status(result.success ? 200 : 500).json({
    ...result,
    endpoint: 'database/counts',
    timestamp: new Date().toISOString()
  });
}

// Test connection endpoint
async function handleTestConnection(req, res) {
  const result = await DatabaseService.testConnection();
  
  return res.status(result.success ? 200 : 500).json({
    ...result,
    endpoint: 'database/test-connection',
    timestamp: new Date().toISOString()
  });
}