// ============================================================================
// Observability Suite - Metrics, tracing, and monitoring
// ============================================================================

// Metric types
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  type: "counter" | "gauge" | "histogram";
}

// Trace span
export interface TraceSpan {
  id: string;
  parentId?: string;
  traceId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: "ok" | "error" | "in_progress";
  attributes: Record<string, unknown>;
  events: Array<{
    timestamp: Date;
    name: string;
    attributes?: Record<string, unknown>;
  }>;
}

// Log entry
export interface LogEntry {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  source: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
}

// Performance metrics
export interface PerformanceMetrics {
  responseTime: number;
  tokensPerSecond: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  queueDepth: number;
}

// ============================================================================
// Metrics Collector
// ============================================================================

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private maxMetricsPerName = 10000;

  // Record a metric
  record(
    name: string,
    value: number,
    type: "counter" | "gauge" | "histogram" = "gauge",
    labels: Record<string, string> = {}
  ): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      labels,
      type,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const series = this.metrics.get(name)!;
    series.push(metric);

    // Keep only recent metrics
    if (series.length > this.maxMetricsPerName) {
      series.shift();
    }
  }

  // Increment counter
  increment(name: string, value = 1, labels: Record<string, string> = {}): void {
    this.record(name, value, "counter", labels);
  }

  // Set gauge
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, value, "gauge", labels);
  }

  // Record histogram value
  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, value, "histogram", labels);
  }

  // Get metrics series
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  // Get all metric names
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  // Aggregate metrics
  aggregate(
    name: string,
    timeWindow: number, // milliseconds
    aggregation: "sum" | "avg" | "min" | "max" | "count" = "avg"
  ): number | null {
    const series = this.metrics.get(name);
    if (!series || series.length === 0) return null;

    const now = Date.now();
    const windowed = series.filter((m) => now - m.timestamp.getTime() <= timeWindow);

    if (windowed.length === 0) return null;

    switch (aggregation) {
      case "sum":
        return windowed.reduce((sum, m) => sum + m.value, 0);
      case "avg":
        return windowed.reduce((sum, m) => sum + m.value, 0) / windowed.length;
      case "min":
        return Math.min(...windowed.map((m) => m.value));
      case "max":
        return Math.max(...windowed.map((m) => m.value));
      case "count":
        return windowed.length;
      default:
        return null;
    }
  }

  // Export metrics in Prometheus format
  exportPrometheus(): string {
    const lines: string[] = [];

    for (const [name, series] of this.metrics) {
      if (series.length === 0) continue;

      const latest = series[series.length - 1];
      const labels = Object.entries(latest.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");

      lines.push(`# HELP ${name} ${latest.type} metric`);
      lines.push(`# TYPE ${name} ${latest.type}`);
      lines.push(`${name}{${labels}} ${latest.value} ${latest.timestamp.getTime()}`);
    }

    return lines.join("\n");
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }
}

// ============================================================================
// Tracer
// ============================================================================

export class Tracer {
  private spans: Map<string, TraceSpan> = new Map();
  private activeSpans: Map<string, string> = new Map(); // traceId -> activeSpanId

  // Start a new trace
  startTrace(name: string, attributes: Record<string, unknown> = {}): TraceSpan {
    const traceId = this.generateId();
    const spanId = this.generateId();

    const span: TraceSpan = {
      id: spanId,
      traceId,
      name,
      startTime: new Date(),
      status: "in_progress",
      attributes,
      events: [],
    };

    this.spans.set(spanId, span);
    this.activeSpans.set(traceId, spanId);

    return span;
  }

  // Start a child span
  startSpan(
    name: string,
    parentId: string,
    attributes: Record<string, unknown> = {}
  ): TraceSpan {
    const parent = this.spans.get(parentId);
    if (!parent) {
      throw new Error("Parent span not found");
    }

    const spanId = this.generateId();

    const span: TraceSpan = {
      id: spanId,
      parentId,
      traceId: parent.traceId,
      name,
      startTime: new Date(),
      status: "in_progress",
      attributes,
      events: [],
    };

    this.spans.set(spanId, span);
    this.activeSpans.set(parent.traceId, spanId);

    return span;
  }

  // End a span
  endSpan(spanId: string, status: "ok" | "error" = "ok"): TraceSpan {
    const span = this.spans.get(spanId);
    if (!span) {
      throw new Error("Span not found");
    }

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    return span;
  }

  // Add event to span
  addEvent(
    spanId: string,
    name: string,
    attributes?: Record<string, unknown>
  ): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.events.push({
      timestamp: new Date(),
      name,
      attributes,
    });
  }

  // Get span
  getSpan(spanId: string): TraceSpan | undefined {
    return this.spans.get(spanId);
  }

  // Get trace (all spans for a trace)
  getTrace(traceId: string): TraceSpan[] {
    return Array.from(this.spans.values()).filter((s) => s.traceId === traceId);
  }

  // Get active span for trace
  getActiveSpan(traceId: string): TraceSpan | undefined {
    const spanId = this.activeSpans.get(traceId);
    if (!spanId) return undefined;
    return this.spans.get(spanId);
  }

  // Export trace in Jaeger format
  exportTrace(traceId: string): Record<string, unknown> | null {
    const spans = this.getTrace(traceId);
    if (spans.length === 0) return null;

    return {
      traceID: traceId,
      spans: spans.map((s) => ({
        spanID: s.id,
        parentSpanID: s.parentId || "",
        operationName: s.name,
        startTime: s.startTime.getTime() * 1000, // microseconds
        duration: (s.duration || 0) * 1000, // microseconds
        tags: Object.entries(s.attributes).map(([key, value]) => ({
          key,
          value: String(value),
        })),
        logs: s.events.map((e) => ({
          timestamp: e.timestamp.getTime() * 1000,
          fields: [{ key: "event", value: e.name }],
        })),
      })),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// ============================================================================
// Logger
// ============================================================================

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  // Log methods
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.log("fatal", message, metadata);
  }

  private log(
    level: LogEntry["level"],
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      source: this.source,
      metadata,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also output to console in development
    if (process.env.NODE_ENV === "development") {
      const timestamp = entry.timestamp.toISOString();
      console.log(`[${timestamp}] ${level.toUpperCase()} [${this.source}] ${message}`);
    }
  }

  // Get logs with filtering
  getLogs(options: {
    level?: LogEntry["level"];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): LogEntry[] {
    let filtered = this.logs;

    if (options.level) {
      filtered = filtered.filter((l) => l.level === options.level);
    }

    if (options.startTime) {
      filtered = filtered.filter((l) => l.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      filtered = filtered.filter((l) => l.timestamp <= options.endTime!);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  // Export logs
  exportLogs(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = "timestamp,level,source,message\n";
      const rows = this.logs.map(
        (l) => `${l.timestamp.toISOString()},${l.level},${l.source},"${l.message}"`
      );
      return headers + rows.join("\n");
    }
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clear(): void {
    this.logs = [];
  }
}

// ============================================================================
// Performance Monitor
// ============================================================================

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    responseTime: 0,
    tokensPerSecond: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    queueDepth: 0,
  };

  private history: Array<{ timestamp: Date; metrics: PerformanceMetrics }> = [];
  private maxHistory = 1000;

  // Update metrics
  updateMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };

    this.history.push({
      timestamp: new Date(),
      metrics: { ...this.metrics },
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get metrics history
  getHistory(timeWindow?: number): Array<{ timestamp: Date; metrics: PerformanceMetrics }> {
    if (!timeWindow) return [...this.history];

    const now = Date.now();
    return this.history.filter((h) => now - h.timestamp.getTime() <= timeWindow);
  }

  // Calculate average response time
  getAverageResponseTime(timeWindow: number): number {
    const history = this.getHistory(timeWindow);
    if (history.length === 0) return 0;

    const sum = history.reduce((acc, h) => acc + h.metrics.responseTime, 0);
    return sum / history.length;
  }

  // Get throughput (requests per minute)
  getThroughput(): number {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recent = this.history.filter((h) => h.timestamp.getTime() >= oneMinuteAgo);
    return recent.length;
  }
}

// ============================================================================
// Observability Service
// ============================================================================

export class ObservabilityService {
  metrics: MetricsCollector;
  tracer: Tracer;
  logger: Logger;
  performance: PerformanceMonitor;

  constructor(source: string) {
    this.metrics = new MetricsCollector();
    this.tracer = new Tracer();
    this.logger = new Logger(source);
    this.performance = new PerformanceMonitor();
  }

  // Health check
  healthCheck(): {
    status: "healthy" | "degraded" | "unhealthy";
    metrics: PerformanceMetrics;
  } {
    const metrics = this.performance.getMetrics();

    // Simple health logic
    if (metrics.responseTime > 5000 || metrics.queueDepth > 100) {
      return { status: "unhealthy", metrics };
    }

    if (metrics.responseTime > 2000 || metrics.queueDepth > 50) {
      return { status: "degraded", metrics };
    }

    return { status: "healthy", metrics };
  }

  // Export all observability data
  exportAll(): {
    metrics: string;
    traces: Record<string, unknown>[];
    logs: string;
    performance: PerformanceMetrics;
  } {
    // Get all trace IDs
    const traceIds = new Set<string>();
    for (const span of this.tracer["spans"].values()) {
      traceIds.add(span.traceId);
    }

    return {
      metrics: this.metrics.exportPrometheus(),
      traces: Array.from(traceIds)
        .map((id) => this.tracer.exportTrace(id))
        .filter(Boolean) as Record<string, unknown>[],
      logs: this.logger.exportLogs(),
      performance: this.performance.getMetrics(),
    };
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const observability = new ObservabilityService("ai-agent-platform");
