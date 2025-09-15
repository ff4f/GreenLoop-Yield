#!/usr/bin/env node

// Monitoring script for idempotency middleware performance
// Provides insights into usage patterns and performance metrics

const { db } = require('../shared/database.js');

async function generateReport() {
  console.log('=== IDEMPOTENCY MIDDLEWARE MONITORING REPORT ===');
  console.log('Generated at:', new Date().toISOString());
  console.log('');
  
  try {
    // Overall statistics
    const overallStats = await db.query(`
      SELECT 
        COUNT(*) as total_keys,
        COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_keys,
        COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_keys,
        COUNT(CASE WHEN used = true THEN 1 END) as used_keys,
        COUNT(CASE WHEN used = false THEN 1 END) as unused_keys,
        MIN(createdAt) as oldest_key,
        MAX(createdAt) as newest_key
      FROM idempotencyKeys
    `);
    
    const stats = overallStats.rows[0];
    
    console.log('📊 OVERALL STATISTICS');
    console.log('─'.repeat(50));
    console.log(`Total idempotency keys: ${stats.total_keys}`);
    console.log(`Active keys: ${stats.active_keys}`);
    console.log(`Expired keys: ${stats.expired_keys}`);
    console.log(`Used keys: ${stats.used_keys}`);
    console.log(`Unused keys: ${stats.unused_keys}`);
    
    if (stats.total_keys > 0) {
      const usageRate = ((parseInt(stats.used_keys) / parseInt(stats.total_keys)) * 100).toFixed(2);
      const expirationRate = ((parseInt(stats.expired_keys) / parseInt(stats.total_keys)) * 100).toFixed(2);
      console.log(`Usage rate: ${usageRate}%`);
      console.log(`Expiration rate: ${expirationRate}%`);
      console.log(`Oldest key: ${stats.oldest_key}`);
      console.log(`Newest key: ${stats.newest_key}`);
    }
    
    console.log('');
    
    // Endpoint usage statistics
    const endpointStats = await db.query(`
      SELECT 
        method,
        endpoint,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN used = true THEN 1 END) as duplicate_requests,
        COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_keys,
        AVG(EXTRACT(EPOCH FROM (NOW() - createdAt))) as avg_age_seconds
      FROM idempotencyKeys
      GROUP BY method, endpoint
      ORDER BY total_requests DESC
    `);
    
    console.log('🎯 ENDPOINT USAGE STATISTICS');
    console.log('─'.repeat(80));
    console.log('Method'.padEnd(8) + 'Endpoint'.padEnd(30) + 'Total'.padEnd(8) + 'Dupes'.padEnd(8) + 'Active'.padEnd(8) + 'Avg Age');
    console.log('─'.repeat(80));
    
    endpointStats.rows.forEach(row => {
      const duplicateRate = ((parseInt(row.duplicate_requests) / parseInt(row.total_requests)) * 100).toFixed(1);
      const avgAge = Math.round(row.avg_age_seconds);
      
      console.log(
        row.method.padEnd(8) + 
        row.endpoint.padEnd(30) + 
        row.total_requests.toString().padEnd(8) + 
        `${row.duplicate_requests} (${duplicateRate}%)`.padEnd(8) + 
        row.active_keys.toString().padEnd(8) + 
        `${avgAge}s`
      );
    });
    
    console.log('');
    
    // User activity patterns
    const userStats = await db.query(`
      SELECT 
        userId,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN used = true THEN 1 END) as duplicate_requests,
        COUNT(DISTINCT endpoint) as unique_endpoints,
        MIN(createdAt) as first_request,
        MAX(createdAt) as last_request
      FROM idempotencyKeys
      WHERE userId IS NOT NULL
      GROUP BY userId
      ORDER BY total_requests DESC
      LIMIT 10
    `);
    
    console.log('👥 TOP USER ACTIVITY (Top 10)');
    console.log('─'.repeat(80));
    console.log('User ID'.padEnd(20) + 'Total'.padEnd(8) + 'Dupes'.padEnd(8) + 'Endpoints'.padEnd(12) + 'First Request');
    console.log('─'.repeat(80));
    
    userStats.rows.forEach(row => {
      const duplicateRate = ((parseInt(row.duplicate_requests) / parseInt(row.total_requests)) * 100).toFixed(1);
      const firstRequest = new Date(row.first_request).toISOString().split('T')[0];
      
      console.log(
        row.userid.toString().padEnd(20) + 
        row.total_requests.toString().padEnd(8) + 
        `${row.duplicate_requests} (${duplicateRate}%)`.padEnd(8) + 
        row.unique_endpoints.toString().padEnd(12) + 
        firstRequest
      );
    });
    
    console.log('');
    
    // Time-based analysis (last 24 hours)
    const timeAnalysis = await db.query(`
      SELECT 
        DATE_TRUNC('hour', createdAt) as hour,
        COUNT(*) as requests,
        COUNT(CASE WHEN used = true THEN 1 END) as duplicates
      FROM idempotencyKeys
      WHERE createdAt >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', createdAt)
      ORDER BY hour DESC
      LIMIT 24
    `);
    
    console.log('⏰ HOURLY ACTIVITY (Last 24 Hours)');
    console.log('─'.repeat(50));
    console.log('Hour'.padEnd(20) + 'Requests'.padEnd(12) + 'Duplicates');
    console.log('─'.repeat(50));
    
    timeAnalysis.rows.forEach(row => {
      const hour = new Date(row.hour).toISOString().split('T')[1].split(':')[0] + ':00';
      const date = new Date(row.hour).toISOString().split('T')[0];
      const duplicateRate = parseInt(row.requests) > 0 ? 
        ((parseInt(row.duplicates) / parseInt(row.requests)) * 100).toFixed(1) : '0.0';
      
      console.log(
        `${date} ${hour}`.padEnd(20) + 
        row.requests.toString().padEnd(12) + 
        `${row.duplicates} (${duplicateRate}%)`
      );
    });
    
    console.log('');
    
    // Performance insights
    const performanceInsights = await db.query(`
      SELECT 
        COUNT(*) as total_keys,
        COUNT(CASE WHEN used = true THEN 1 END) as prevented_duplicates,
        AVG(EXTRACT(EPOCH FROM (expiresAt - createdAt))) as avg_ttl_seconds,
        COUNT(CASE WHEN createdAt >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_keys
      FROM idempotencyKeys
    `);
    
    const perf = performanceInsights.rows[0];
    
    console.log('🚀 PERFORMANCE INSIGHTS');
    console.log('─'.repeat(50));
    
    if (parseInt(perf.total_keys) > 0) {
      const preventionRate = ((parseInt(perf.prevented_duplicates) / parseInt(perf.total_keys)) * 100).toFixed(2);
      const avgTtl = Math.round(perf.avg_ttl_seconds);
      
      console.log(`Duplicate prevention rate: ${preventionRate}%`);
      console.log(`Average TTL: ${avgTtl} seconds (${Math.round(avgTtl/60)} minutes)`);
      console.log(`Recent activity (1h): ${perf.recent_keys} requests`);
      
      // Calculate estimated storage savings
      const estimatedSavings = parseInt(perf.prevented_duplicates) * 0.1; // Assume 0.1KB per prevented duplicate
      console.log(`Estimated storage savings: ${estimatedSavings.toFixed(2)} KB`);
      
      // Calculate efficiency score
      const efficiencyScore = Math.min(100, (parseInt(perf.prevented_duplicates) / Math.max(1, parseInt(perf.total_keys))) * 100);
      console.log(`Efficiency score: ${efficiencyScore.toFixed(1)}/100`);
    } else {
      console.log('No data available for performance analysis.');
    }
    
    console.log('');
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('─'.repeat(50));
    
    const recommendations = [];
    
    if (parseInt(stats.expired_keys) > parseInt(stats.active_keys)) {
      recommendations.push('• Consider running cleanup script more frequently');
    }
    
    if (parseInt(stats.unused_keys) > parseInt(stats.used_keys) * 2) {
      recommendations.push('• High number of unused keys - consider reducing TTL');
    }
    
    const duplicateRate = parseInt(stats.total_keys) > 0 ? 
      (parseInt(stats.used_keys) / parseInt(stats.total_keys)) * 100 : 0;
    
    if (duplicateRate < 5) {
      recommendations.push('• Low duplicate rate - idempotency is working well');
    } else if (duplicateRate > 20) {
      recommendations.push('• High duplicate rate - investigate client retry behavior');
    }
    
    if (parseInt(perf.recent_keys) === 0) {
      recommendations.push('• No recent activity - system may be idle');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• System is operating within normal parameters');
    }
    
    recommendations.forEach(rec => console.log(rec));
    
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Idempotency Monitoring Script

Usage: node monitor-idempotency.js [options]

Options:
  --help, -h    Show this help message

This script generates a comprehensive report on idempotency middleware
performance, including usage statistics, user patterns, and recommendations.

Example cron job (daily report at 9 AM):
  0 9 * * * cd /path/to/project && node scripts/monitor-idempotency.js > /var/log/idempotency-report.log
`);
    process.exit(0);
  }
  
  await generateReport();
  
  // Close database connection
  await db.end();
  console.log('\n📋 Report generation completed.');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});