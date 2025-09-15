// Hedera Error Handler
// Provides comprehensive error handling for Hedera network operations

class HederaErrorHandler {
  constructor(logger = console) {
    this.logger = logger;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.maxRetryDelay = 10000; // 10 seconds
  }

  /**
   * Handle Hedera network errors with retry logic
   * @param {Function} operation - The operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise} - Result of the operation
   */
  async withRetry(operation, options = {}) {
    const {
      maxAttempts = this.retryAttempts,
      delay = this.retryDelay,
      exponentialBackoff = true,
      context = 'Hedera operation'
    } = options;

    let lastError;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.info(`${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        const errorInfo = this.categorizeError(error);
        
        // Don't retry for certain error types
        if (!errorInfo.retryable || attempt === maxAttempts) {
          this.logger.error(`${context} failed after ${attempt} attempts:`, {
            error: error.message,
            category: errorInfo.category,
            retryable: errorInfo.retryable,
            suggestion: errorInfo.suggestion
          });
          throw this.enhanceError(error, errorInfo, attempt);
        }
        
        this.logger.warn(`${context} failed on attempt ${attempt}/${maxAttempts}:`, {
          error: error.message,
          category: errorInfo.category,
          retryingIn: `${currentDelay}ms`
        });
        
        // Wait before retrying
        await this.delay(currentDelay);
        
        // Exponential backoff
        if (exponentialBackoff) {
          currentDelay = Math.min(currentDelay * 2, this.maxRetryDelay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Categorize Hedera errors for better handling
   * @param {Error} error - The error to categorize
   * @returns {Object} - Error category information
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.code;
    
    // Network connectivity errors (retryable)
    if (message.includes('network') || 
        message.includes('timeout') || 
        message.includes('connection') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')) {
      return {
        category: 'NETWORK_ERROR',
        retryable: true,
        suggestion: 'Check network connectivity and Hedera network status'
      };
    }
    
    // Rate limiting errors (retryable)
    if (message.includes('rate limit') || 
        message.includes('too many requests') ||
        status === 429) {
      return {
        category: 'RATE_LIMIT',
        retryable: true,
        suggestion: 'Reduce request frequency or implement exponential backoff'
      };
    }
    
    // Insufficient balance errors (not retryable)
    if (message.includes('insufficient') && 
        (message.includes('balance') || message.includes('funds'))) {
      return {
        category: 'INSUFFICIENT_BALANCE',
        retryable: false,
        suggestion: 'Add HBAR to your account or reduce transaction amounts'
      };
    }
    
    // Authentication errors (not retryable)
    if (message.includes('unauthorized') || 
        message.includes('invalid key') ||
        message.includes('authentication') ||
        status === 401) {
      return {
        category: 'AUTHENTICATION_ERROR',
        retryable: false,
        suggestion: 'Check HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY environment variables'
      };
    }
    
    // Transaction errors (context dependent)
    if (message.includes('transaction') && 
        (message.includes('failed') || message.includes('invalid'))) {
      return {
        category: 'TRANSACTION_ERROR',
        retryable: false,
        suggestion: 'Review transaction parameters and account permissions'
      };
    }
    
    // Service unavailable (retryable)
    if (message.includes('service unavailable') || 
        message.includes('server error') ||
        status >= 500) {
      return {
        category: 'SERVICE_ERROR',
        retryable: true,
        suggestion: 'Hedera network may be experiencing issues, try again later'
      };
    }
    
    // Default: unknown error (retryable with caution)
    return {
      category: 'UNKNOWN_ERROR',
      retryable: true,
      suggestion: 'Check error details and Hedera network status'
    };
  }

  /**
   * Enhance error with additional context
   * @param {Error} originalError - The original error
   * @param {Object} errorInfo - Error categorization info
   * @param {number} attempts - Number of attempts made
   * @returns {Error} - Enhanced error
   */
  enhanceError(originalError, errorInfo, attempts) {
    const enhancedError = new Error(
      `Hedera ${errorInfo.category}: ${originalError.message} (after ${attempts} attempts)`
    );
    
    enhancedError.originalError = originalError;
    enhancedError.category = errorInfo.category;
    enhancedError.retryable = errorInfo.retryable;
    enhancedError.suggestion = errorInfo.suggestion;
    enhancedError.attempts = attempts;
    enhancedError.stack = originalError.stack;
    
    return enhancedError;
  }

  /**
   * Check Hedera network connectivity
   * @param {Object} hederaService - Hedera service instance
   * @returns {Promise<Object>} - Network status
   */
  async checkNetworkConnectivity(hederaService) {
    try {
      const startTime = Date.now();
      const status = await this.withRetry(
        () => hederaService.getNetworkStatus(),
        {
          maxAttempts: 2,
          context: 'Network connectivity check'
        }
      );
      const responseTime = Date.now() - startTime;
      
      return {
        connected: true,
        network: process.env.HEDERA_NETWORK,
        responseTime,
        status
      };
    } catch (error) {
      return {
        connected: false,
        network: process.env.HEDERA_NETWORK,
        error: error.message,
        category: this.categorizeError(error).category,
        suggestion: this.categorizeError(error).suggestion
      };
    }
  }

  /**
   * Validate Hedera environment configuration
   * @returns {Object} - Validation result
   */
  validateConfiguration() {
    const issues = [];
    const warnings = [];
    
    // Check required environment variables
    if (!process.env.HEDERA_OPERATOR_ID) {
      issues.push('HEDERA_OPERATOR_ID is not set');
    } else if (!/^0\.0\.[0-9]+$/.test(process.env.HEDERA_OPERATOR_ID)) {
      issues.push('HEDERA_OPERATOR_ID format is invalid (should be 0.0.XXXXXX)');
    }
    
    if (!process.env.HEDERA_OPERATOR_KEY) {
      issues.push('HEDERA_OPERATOR_KEY is not set');
    } else if (process.env.HEDERA_OPERATOR_KEY.length < 64) {
      warnings.push('HEDERA_OPERATOR_KEY appears to be too short');
    }
    
    if (!process.env.HEDERA_NETWORK) {
      warnings.push('HEDERA_NETWORK is not set, defaulting to testnet');
    } else if (!['testnet', 'mainnet', 'previewnet'].includes(process.env.HEDERA_NETWORK)) {
      issues.push('HEDERA_NETWORK must be one of: testnet, mainnet, previewnet');
    }
    
    // Check HCS topic IDs
    if (!process.env.HCS_AUDIT_TOPIC_ID) {
      warnings.push('HCS_AUDIT_TOPIC_ID is not set');
    }
    
    if (!process.env.HCS_PROOF_TOPIC_ID) {
      warnings.push('HCS_PROOF_TOPIC_ID is not set');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings,
      configuration: {
        operatorId: process.env.HEDERA_OPERATOR_ID ? 'set' : 'not set',
        operatorKey: process.env.HEDERA_OPERATOR_KEY ? 'set' : 'not set',
        network: process.env.HEDERA_NETWORK || 'not set',
        auditTopicId: process.env.HCS_AUDIT_TOPIC_ID || 'not set',
        proofTopicId: process.env.HCS_PROOF_TOPIC_ID || 'not set'
      }
    };
  }

  /**
   * Create a circuit breaker for Hedera operations
   * @param {Object} options - Circuit breaker options
   * @returns {Object} - Circuit breaker instance
   */
  createCircuitBreaker(options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000, // 1 minute
      monitoringPeriod = 300000 // 5 minutes
    } = options;
    
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let failures = 0;
    let lastFailureTime = null;
    let successCount = 0;
    
    return {
      async execute(operation, context = 'Circuit breaker operation') {
        // Check if circuit should be reset
        if (state === 'OPEN' && 
            Date.now() - lastFailureTime > resetTimeout) {
          state = 'HALF_OPEN';
          successCount = 0;
          this.logger.info(`Circuit breaker transitioning to HALF_OPEN for ${context}`);
        }
        
        // Reject if circuit is open
        if (state === 'OPEN') {
          throw new Error(`Circuit breaker is OPEN for ${context}. Try again later.`);
        }
        
        try {
          const result = await operation();
          
          // Success in HALF_OPEN state
          if (state === 'HALF_OPEN') {
            successCount++;
            if (successCount >= 3) {
              state = 'CLOSED';
              failures = 0;
              this.logger.info(`Circuit breaker reset to CLOSED for ${context}`);
            }
          } else {
            failures = 0; // Reset failure count on success
          }
          
          return result;
        } catch (error) {
          failures++;
          lastFailureTime = Date.now();
          
          // Open circuit if threshold reached
          if (failures >= failureThreshold) {
            state = 'OPEN';
            this.logger.error(`Circuit breaker opened for ${context} after ${failures} failures`);
          }
          
          throw error;
        }
      },
      
      getState: () => ({ state, failures, lastFailureTime, successCount })
    };
  }

  /**
   * Utility function to create delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default HederaErrorHandler;