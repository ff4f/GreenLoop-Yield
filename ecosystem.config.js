module.exports = {
  apps: [
    {
      name: 'audit-feed-worker',
      script: 'workers/audit-feed.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        WORKER_LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_LOG_LEVEL: 'warn'
      },
      error_file: './logs/audit-feed-error.log',
      out_file: './logs/audit-feed-out.log',
      log_file: './logs/audit-feed-combined.log',
      time: true
    },
    {
      name: 'hcs-events-worker',
      script: 'workers/hcs-events.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        WORKER_LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_LOG_LEVEL: 'warn'
      },
      error_file: './logs/hcs-events-error.log',
      out_file: './logs/hcs-events-out.log',
      log_file: './logs/hcs-events-combined.log',
      time: true
    }
  ]
};