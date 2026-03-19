// ============================================================================
// Self-Healing System - Circuit breakers and auto-recovery
// ============================================================================

// Circuit breaker states
type CircuitState = "closed" | "open" | "half-open";

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Milliseconds before attempting reset
  halfOpenMaxCalls: number; // Max calls in half-open state
  successThreshold: number; // Successes needed to close
}

// Operation result
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  cached?: boolean;
  retryCount: number;
  duration: number;
}

// Circuit breaker stats
export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  totalCalls: number;
  rejectedCalls: number;
}

// ============================================================================
// Circuit Breaker
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private consecutiveSuccesses = 0;
  private consecutiveFailures = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private totalCalls = 0;
  private rejectedCalls = 0;
  private halfOpenCalls = 0;
  private nextAttempt?: number;

  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenMaxCalls: 3,
      successThreshold: 2,
      ...config,
    };
  }

  // Execute function with circuit breaker protection
  async execute<T>(operation: () => Promise<T>, fallback?: () => T): Promise<OperationResult<T>> {
    const startTime = Date.now();
    this.totalCalls++;

    // Check if circuit is open
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        this.rejectedCalls++;
        if (fallback) {
          return {
            success: true,
            data: fallback(),
            retryCount: 0,
            duration: Date.now() - startTime,
            cached: true,
          };
        }
        return {
          success: false,
          error: new Error("Circuit breaker is open"),
          retryCount: 0,
          duration: Date.now() - startTime,
        };
      }
    }

    // Check half-open call limit
    if (this.state === "half-open") {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.rejectedCalls++;
        if (fallback) {
          return {
            success: true,
            data: fallback(),
            retryCount: 0,
            duration: Date.now() - startTime,
            cached: true,
          };
        }
        return {
          success: false,
          error: new Error("Circuit breaker half-open call limit reached"),
          retryCount: 0,
          duration: Date.now() - startTime,
        };
      }
      this.halfOpenCalls++;
    }

    // Execute operation
    try {
      const result = await operation();
      this.onSuccess();
      return {
        success: true,
        data: result,
        retryCount: 0,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.onFailure();
      
      if (fallback) {
        return {
          success: true,
          data: fallback(),
          retryCount: 0,
          duration: Date.now() - startTime,
          cached: true,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        retryCount: 0,
        duration: Date.now() - startTime,
      };
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) return false;
    return Date.now() >= this.nextAttempt;
  }

  private transitionToHalfOpen(): void {
    this.state = "half-open";
    this.halfOpenCalls = 0;
    this.consecutiveSuccesses = 0;
  }

  private onSuccess(): void {
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = new Date();

    if (this.state === "half-open") {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.closeCircuit();
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = new Date();

    if (this.state === "half-open") {
      this.openCircuit();
    } else if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = "open";
    this.nextAttempt = Date.now() + this.config.resetTimeout;
    this.halfOpenCalls = 0;
  }

  private closeCircuit(): void {
    this.state = "closed";
    this.failures = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.halfOpenCalls = 0;
    this.nextAttempt = undefined;
  }

  // Get current stats
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      consecutiveSuccesses: this.consecutiveSuccesses,
      consecutiveFailures: this.consecutiveFailures,
      totalCalls: this.totalCalls,
      rejectedCalls: this.rejectedCalls,
    };
  }

  // Force open circuit (for maintenance)
  forceOpen(): void {
    this.openCircuit();
  }

  // Force close circuit (manual reset)
  forceClose(): void {
    this.closeCircuit();
  }

  // Get current state
  getState(): CircuitState {
    return this.state;
  }
}

// ============================================================================
// Retry Manager with Exponential Backoff
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors?: string[]; // Error messages that should trigger retry
}

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "EAI_AGAIN"],
      ...config,
    };
  }

  // Execute with retry logic
  async execute<T>(operation: () => Promise<T>): Promise<OperationResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          retryCount: attempt,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (attempt < this.config.maxRetries && this.shouldRetry(lastError)) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        // No more retries
        break;
      }
    }

    return {
      success: false,
      error: lastError,
      retryCount: this.config.maxRetries,
      duration: Date.now() - startTime,
    };
  }

  private shouldRetry(error: Error): boolean {
    if (!this.config.retryableErrors) return true;
    
    return this.config.retryableErrors.some(
      (retryableError) => 
        error.message.includes(retryableError) ||
        error.name === retryableError
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt),
      this.config.maxDelay
    );
    // Add jitter
    return delay + Math.random() * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Health Monitor
// ============================================================================

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean> | boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
}

export interface HealthStatus {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  lastCheck: Date;
  responseTime: number;
  consecutiveFailures: number;
  message?: string;
}

export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private statuses: Map<string, HealthStatus> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Register a health check
  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.statuses.set(check.name, {
      name: check.name,
      status: "healthy",
      lastCheck: new Date(),
      responseTime: 0,
      consecutiveFailures: 0,
    });

    // Start monitoring
    this.startMonitoring(check.name);
  }

  // Start monitoring a check
  private startMonitoring(name: string): void {
    const check = this.checks.get(name);
    if (!check) return;

    const interval = setInterval(async () => {
      await this.runCheck(name);
    }, check.interval);

    this.intervals.set(name, interval);
  }

  // Run a health check
  private async runCheck(name: string): Promise<void> {
    const check = this.checks.get(name);
    const status = this.statuses.get(name);
    if (!check || !status) return;

    const startTime = Date.now();
    
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Health check timeout")), check.timeout);
      });

      const result = await Promise.race([check.check(), timeoutPromise]);
      const responseTime = Date.now() - startTime;

      if (result) {
        status.status = "healthy";
        status.consecutiveFailures = 0;
      } else {
        status.consecutiveFailures++;
        if (status.consecutiveFailures >= 3) {
          status.status = "unhealthy";
        } else if (status.consecutiveFailures >= 1) {
          status.status = "degraded";
        }
      }

      status.lastCheck = new Date();
      status.responseTime = responseTime;
    } catch (error) {
      status.consecutiveFailures++;
      if (status.consecutiveFailures >= 3) {
        status.status = "unhealthy";
      } else {
        status.status = "degraded";
      }
      status.lastCheck = new Date();
      status.responseTime = Date.now() - startTime;
      status.message = error instanceof Error ? error.message : String(error);
    }

    this.statuses.set(name, status);
  }

  // Get health status for a check
  getStatus(name: string): HealthStatus | undefined {
    return this.statuses.get(name);
  }

  // Get all health statuses
  getAllStatuses(): HealthStatus[] {
    return Array.from(this.statuses.values());
  }

  // Get overall health
  getOverallHealth(): {
    status: "healthy" | "unhealthy" | "degraded";
    checks: HealthStatus[];
  } {
    const statuses = this.getAllStatuses();
    
    if (statuses.every((s) => s.status === "healthy")) {
      return { status: "healthy", checks: statuses };
    }
    
    if (statuses.some((s) => s.status === "unhealthy")) {
      return { status: "unhealthy", checks: statuses };
    }
    
    return { status: "degraded", checks: statuses };
  }

  // Unregister a health check
  unregister(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
    this.checks.delete(name);
    this.statuses.delete(name);
  }

  // Stop all monitoring
  stopAll(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}

// ============================================================================
// Self-Healing Service
// ============================================================================

export class SelfHealingService {
  circuitBreakers: Map<string, CircuitBreaker> = new Map();
  retryManager: RetryManager;
  healthMonitor: HealthMonitor;

  constructor() {
    this.retryManager = new RetryManager();
    this.healthMonitor = new HealthMonitor();
  }

  // Create or get circuit breaker
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(config));
    }
    return this.circuitBreakers.get(name)!;
  }

  // Execute with circuit breaker and retry
  async executeWithProtection<T>(
    name: string,
    operation: () => Promise<T>,
    options: {
      circuitBreaker?: Partial<CircuitBreakerConfig>;
      retry?: Partial<RetryConfig>;
      fallback?: () => T;
    } = {}
  ): Promise<OperationResult<T>> {
    const circuitBreaker = this.getCircuitBreaker(name, options.circuitBreaker);

    // Execute with circuit breaker
    const result = await circuitBreaker.execute(operation, options.fallback);

    // If failed and not rejected by circuit breaker, try with retry
    if (!result.success && !result.cached && options.retry) {
      const retryManager = new RetryManager(options.retry);
      return await retryManager.execute(operation);
    }

    return result;
  }

  // Get all circuit breaker stats
  getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, cb] of this.circuitBreakers) {
      stats[name] = cb.getStats();
    }
    return stats;
  }

  // Reset all circuit breakers
  resetAllCircuitBreakers(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.forceClose();
    }
  }

  // Get health report
  getHealthReport(): {
    circuitBreakers: Record<string, CircuitBreakerStats>;
    health: ReturnType<HealthMonitor["getOverallHealth"]>;
  } {
    return {
      circuitBreakers: this.getAllCircuitBreakerStats(),
      health: this.healthMonitor.getOverallHealth(),
    };
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const selfHealing = new SelfHealingService();
