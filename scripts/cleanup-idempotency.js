#!/usr/bin/env node

// Cleanup script for expired idempotency keys
// Can be run as a cron job or scheduled task

const { cleanupExpiredKeys } = require('../api/middleware/idempotency.js');
const { db } = require('../shared/database.js');

async function runCleanup() {
  console.log('Starting idempotency key cleanup...');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Get count before cleanup
    const beforeCount = await db.query(
      'SELECT COUNT(*) as count FROM idempotencyKeys WHERE expiresAt < NOW()'
    );
    const expiredCount = parseInt(beforeCount.rows[0].count);
    
    console.log(`Found ${expiredCount} expired keys to clean up`);
    
    if (expiredCount === 0) {
      console.log('No expired keys found. Cleanup complete.');
      return;
    }
    
    // Run cleanup
    const result = await cleanupExpiredKeys();
    
    console.log(`Successfully cleaned up ${result.deletedCount} expired idempotency keys`);
    
    // Get remaining count
    const afterCount = await db.query(
      'SELECT COUNT(*) as count FROM idempotencyKeys'
    );
    const remainingCount = parseInt(afterCount.rows[0].count);
    
    console.log(`${remainingCount} idempotency keys remaining in database`);
    
    // Log statistics
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_keys,
        COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_keys,
        COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_keys,
        MIN(createdAt) as oldest_key,
        MAX(createdAt) as newest_key
      FROM idempotencyKeys
    `);
    
    if (stats.rows[0].total_keys > 0) {
      const row = stats.rows[0];
      console.log('\nDatabase statistics:');
      console.log(`- Total keys: ${row.total_keys}`);
      console.log(`- Active keys: ${row.active_keys}`);
      console.log(`- Expired keys: ${row.expired_keys}`);
      console.log(`- Oldest key: ${row.oldest_key}`);
      console.log(`- Newest key: ${row.newest_key}`);
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const forceCleanup = args.includes('--force');

if (isDryRun) {
  console.log('DRY RUN MODE - No changes will be made');
}

if (isVerbose) {
  console.log('Verbose mode enabled');
}

async function dryRunCleanup() {
  console.log('\n=== DRY RUN ANALYSIS ===');
  
  try {
    // Analyze what would be cleaned up
    const analysis = await db.query(`
      SELECT 
        COUNT(*) as expired_count,
        MIN(createdAt) as oldest_expired,
        MAX(createdAt) as newest_expired,
        AVG(EXTRACT(EPOCH FROM (NOW() - expiresAt))) as avg_seconds_expired
      FROM idempotencyKeys 
      WHERE expiresAt < NOW()
    `);
    
    const row = analysis.rows[0];
    
    if (parseInt(row.expired_count) === 0) {
      console.log('No expired keys found.');
      return;
    }
    
    console.log(`Would delete ${row.expired_count} expired keys`);
    console.log(`Oldest expired key: ${row.oldest_expired}`);
    console.log(`Newest expired key: ${row.newest_expired}`);
    console.log(`Average expiration age: ${Math.round(row.avg_seconds_expired)} seconds`);
    
    // Show breakdown by endpoint
    const endpointBreakdown = await db.query(`
      SELECT 
        endpoint,
        method,
        COUNT(*) as count
      FROM idempotencyKeys 
      WHERE expiresAt < NOW()
      GROUP BY endpoint, method
      ORDER BY count DESC
    `);
    
    if (endpointBreakdown.rows.length > 0) {
      console.log('\nBreakdown by endpoint:');
      endpointBreakdown.rows.forEach(row => {
        console.log(`- ${row.method} ${row.endpoint}: ${row.count} keys`);
      });
    }
    
    // Show breakdown by user
    const userBreakdown = await db.query(`
      SELECT 
        userId,
        COUNT(*) as count
      FROM idempotencyKeys 
      WHERE expiresAt < NOW()
      GROUP BY userId
      ORDER BY count DESC
      LIMIT 10
    `);
    
    if (userBreakdown.rows.length > 0) {
      console.log('\nTop users with expired keys:');
      userBreakdown.rows.forEach(row => {
        console.log(`- ${row.userid}: ${row.count} keys`);
      });
    }
    
  } catch (error) {
    console.error('Error during dry run analysis:', error);
  }
}

async function main() {
  if (isDryRun) {
    await dryRunCleanup();
  } else {
    await runCleanup();
  }
  
  // Close database connection
  await db.end();
  console.log('\nCleanup script completed.');
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Idempotency Key Cleanup Script

Usage: node cleanup-idempotency.js [options]

Options:
  --dry-run     Show what would be cleaned up without making changes
  --verbose     Enable verbose output
  --force       Force cleanup even if many keys would be deleted
  --help, -h    Show this help message

Examples:
  node cleanup-idempotency.js                    # Run cleanup
  node cleanup-idempotency.js --dry-run          # Preview cleanup
  node cleanup-idempotency.js --verbose          # Run with detailed output
  
Cron job example (run every hour):
  0 * * * * cd /path/to/project && node scripts/cleanup-idempotency.js

Cron job example (run daily at 2 AM):
  0 2 * * * cd /path/to/project && node scripts/cleanup-idempotency.js
`);
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});