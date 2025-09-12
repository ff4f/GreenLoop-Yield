// @ts-ignore
import { QueryHelpers } from '../shared/database.js';
// @ts-ignore
import mirrorWorker from '../workers/mirror-worker.js';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function logAnalytics(event: string, metadata: any = {}): void {
  QueryHelpers.logAnalytics(event, 1, {
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

function logAudit(userId: string, action: string, entityType: string, entityId: string, changes: any = {}): void {
  QueryHelpers.logAudit(userId, action, entityType, entityId, {
    timestamp: new Date().toISOString(),
    ...changes
  });
}

export default async function handler(req: any, res: any) {
  const { method, query } = req;
  const userId = req.headers['x-user-id'] || 'anonymous';
  const userRole = req.headers['x-user-role'] || 'user';

  try {
    if (method === 'GET') {
      const { type, limit = '50', topicId, entityType, entityId } = query;

      // Get audit logs
      if (type === 'audit') {
        const filters: any = { limit: parseInt(limit) };
        if (entityType) filters.entityType = entityType;
        if (entityId) filters.entityId = entityId;

        const auditLogs = await QueryHelpers.getAuditLogs(filters);
        
        logAnalytics('audit_logs_viewed', {
          userId,
          userRole,
          filters,
          resultCount: auditLogs.length
        });

        return res.status(200).json({
          success: true,
          data: auditLogs,
          meta: {
            count: auditLogs.length,
            limit: parseInt(limit),
            filters
          }
        });
      }

      // Get HCS events from Mirror Node
      if (type === 'hcs') {
        const filters: any = { limit: parseInt(limit) };
        if (topicId) filters.topicId = topicId;

        const hcsEvents = await QueryHelpers.getHcsEvents(filters);
        
        logAnalytics('hcs_events_viewed', {
          userId,
          userRole,
          filters,
          resultCount: hcsEvents.length
        });

        return res.status(200).json({
          success: true,
          data: hcsEvents,
          meta: {
            count: hcsEvents.length,
            limit: parseInt(limit),
            filters
          }
        });
      }

      // Get Mirror Worker status
      if (type === 'mirror-status') {
        // Only allow admin users to view mirror worker status
        if (userRole !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Admin role required.'
          });
        }

        const status = mirrorWorker.getStatus();
        
        logAnalytics('mirror_status_viewed', {
          userId,
          userRole,
          status
        });

        return res.status(200).json({
          success: true,
          data: status
        });
      }

      // Get analytics data
      if (type === 'analytics') {
        const { metric, startDate, endDate } = query;
        const filters: any = { limit: parseInt(limit) };
        
        if (metric) filters.metric = metric;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const analytics = await QueryHelpers.getAnalytics(filters);
        
        logAnalytics('analytics_viewed', {
          userId,
          userRole,
          filters,
          resultCount: analytics.length
        });

        return res.status(200).json({
          success: true,
          data: analytics,
          meta: {
            count: analytics.length,
            limit: parseInt(limit),
            filters
          }
        });
      }

      // Get audit summary/dashboard data
      if (type === 'summary') {
        // Only allow admin and auditor roles
        if (!['admin', 'auditor'].includes(userRole)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Admin or Auditor role required.'
          });
        }

        const summary = await getAuditSummary();
        
        logAnalytics('audit_summary_viewed', {
          userId,
          userRole
        });

        return res.status(200).json({
          success: true,
          data: summary
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid type parameter. Use: audit, hcs, mirror-status, analytics, or summary'
      });
    }

    if (method === 'POST') {
      const { action, entityType, entityId, changes = {} } = req.body;

      if (!action || !entityType || !entityId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: action, entityType, entityId'
        });
      }

      // Create audit log entry
      const auditId = generateId('audit');
      await QueryHelpers.createAuditLog({
        id: auditId,
        userId,
        action,
        entityType,
        entityId,
        changes,
        timestamp: new Date()
      });

      logAnalytics('audit_log_created', {
        userId,
        userRole,
        action,
        entityType,
        entityId
      });

      return res.status(201).json({
        success: true,
        data: {
          id: auditId,
          message: 'Audit log created successfully'
        }
      });
    }

    // Mirror Worker control endpoints (Admin only)
    if (method === 'PUT') {
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.'
        });
      }

      const { action } = req.body;

      if (action === 'start') {
        await mirrorWorker.start();
        
        logAudit(userId, 'MIRROR_WORKER_STARTED', 'system', 'mirror-worker');
        logAnalytics('mirror_worker_started', { userId });

        return res.status(200).json({
          success: true,
          message: 'Mirror worker started successfully'
        });
      }

      if (action === 'stop') {
        await mirrorWorker.stop();
        
        logAudit(userId, 'MIRROR_WORKER_STOPPED', 'system', 'mirror-worker');
        logAnalytics('mirror_worker_stopped', { userId });

        return res.status(200).json({
          success: true,
          message: 'Mirror worker stopped successfully'
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: start or stop'
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${method} not allowed`
    });

  } catch (error: any) {
    console.error('Audit API error:', error);
    
    logAnalytics('audit_api_error', {
      userId,
      userRole,
      error: error.message,
      method,
      query
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Helper function to get audit summary
async function getAuditSummary() {
  try {
    const [recentAuditLogs, recentHcsEvents, analytics] = await Promise.all([
      QueryHelpers.getAuditLogs({ limit: 10 }),
      QueryHelpers.getHcsEvents({ limit: 10 }),
      QueryHelpers.getAnalytics({ limit: 20 })
    ]);

    // Calculate summary statistics
    const auditStats = {
      totalAuditLogs: recentAuditLogs.length,
      recentActions: recentAuditLogs.slice(0, 5),
      actionTypes: getActionTypeCounts(recentAuditLogs)
    };

    const hcsStats = {
      totalHcsEvents: recentHcsEvents.length,
      recentEvents: recentHcsEvents.slice(0, 5),
      topicCounts: getTopicCounts(recentHcsEvents)
    };

    const analyticsStats = {
      totalMetrics: analytics.length,
      topMetrics: getTopMetrics(analytics)
    };

    return {
      audit: auditStats,
      hcs: hcsStats,
      analytics: analyticsStats,
      mirrorWorker: mirrorWorker.getStatus(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting audit summary:', error);
    throw error;
  }
}

function getActionTypeCounts(auditLogs: any[]) {
  const counts: { [key: string]: number } = {};
  auditLogs.forEach(log => {
    counts[log.action] = (counts[log.action] || 0) + 1;
  });
  return counts;
}

function getTopicCounts(hcsEvents: any[]) {
  const counts: { [key: string]: number } = {};
  hcsEvents.forEach(event => {
    const topicName = event.topicName || 'unknown';
    counts[topicName] = (counts[topicName] || 0) + 1;
  });
  return counts;
}

function getTopMetrics(analytics: any[]) {
  const metricCounts: { [key: string]: number } = {};
  analytics.forEach(metric => {
    metricCounts[metric.metric] = (metricCounts[metric.metric] || 0) + 1;
  });
  
  return Object.entries(metricCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([metric, count]) => ({ metric, count }));
}