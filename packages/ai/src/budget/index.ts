// ============================================================================
// Budget Optimizer - Token tracking and cost management
// ============================================================================

// Model pricing (per 1K tokens)
const MODEL_PRICING: Record<string, { input: number; output: number; currency: string }> = {
  // OpenAI
  "gpt-4": { input: 0.03, output: 0.06, currency: "USD" },
  "gpt-4-turbo": { input: 0.01, output: 0.03, currency: "USD" },
  "gpt-4o": { input: 0.005, output: 0.015, currency: "USD" },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015, currency: "USD" },
  
  // Anthropic
  "claude-3-opus": { input: 0.015, output: 0.075, currency: "USD" },
  "claude-3-sonnet": { input: 0.003, output: 0.015, currency: "USD" },
  "claude-3-haiku": { input: 0.00025, output: 0.00125, currency: "USD" },
  
  // Google
  "gemini-pro": { input: 0.0005, output: 0.0015, currency: "USD" },
  "gemini-ultra": { input: 0.0035, output: 0.0105, currency: "USD" },
  
  // Ollama (local models - free)
  "llama2": { input: 0, output: 0, currency: "USD" },
  "mistral": { input: 0, output: 0, currency: "USD" },
  "codellama": { input: 0, output: 0, currency: "USD" },
};

// Usage record
export interface TokenUsage {
  timestamp: Date;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  conversationId?: string;
  agentId?: string;
}

// Budget alert
export interface BudgetAlert {
  type: "warning" | "critical";
  message: string;
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
}

// Budget settings
export interface BudgetSettings {
  monthlyLimit: number;
  alertThresholds: number[]; // Percentages (e.g., [50, 75, 90])
  autoDowngrade: boolean;
  downgradeModel: string;
  trackByAgent: boolean;
  trackByConversation: boolean;
}

// ============================================================================
// Budget Optimizer Class
// ============================================================================

export class BudgetOptimizer {
  private usage: TokenUsage[] = [];
  private settings: BudgetSettings;
  private alerts: BudgetAlert[] = [];

  constructor(settings: Partial<BudgetSettings> = {}) {
    this.settings = {
      monthlyLimit: 100, // $100 default
      alertThresholds: [50, 75, 90, 100],
      autoDowngrade: true,
      downgradeModel: "gpt-3.5-turbo",
      trackByAgent: true,
      trackByConversation: true,
      ...settings,
    };
  }

  // Calculate cost for a request
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-3.5-turbo"];
    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;
    return inputCost + outputCost;
  }

  // Record token usage
  recordUsage(usage: Omit<TokenUsage, "cost" | "totalTokens">): TokenUsage {
    const totalTokens = usage.promptTokens + usage.completionTokens;
    const cost = this.calculateCost(usage.model, usage.promptTokens, usage.completionTokens);
    
    const record: TokenUsage = {
      ...usage,
      totalTokens,
      cost,
    };
    
    this.usage.push(record);
    this.checkBudgetAlerts();
    
    return record;
  }

  // Get current month spend
  getCurrentMonthSpend(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.usage
      .filter((u) => u.timestamp >= monthStart)
      .reduce((sum, u) => sum + u.cost, 0);
  }

  // Get spend by model
  getSpendByModel(): Record<string, { tokens: number; cost: number; requests: number }> {
    const stats: Record<string, { tokens: number; cost: number; requests: number }> = {};
    
    for (const usage of this.usage) {
      if (!stats[usage.model]) {
        stats[usage.model] = { tokens: 0, cost: 0, requests: 0 };
      }
      stats[usage.model].tokens += usage.totalTokens;
      stats[usage.model].cost += usage.cost;
      stats[usage.model].requests += 1;
    }
    
    return stats;
  }

  // Get spend by agent
  getSpendByAgent(): Record<string, { tokens: number; cost: number; requests: number }> {
    const stats: Record<string, { tokens: number; cost: number; requests: number }> = {};
    
    for (const usage of this.usage) {
      if (!usage.agentId) continue;
      if (!stats[usage.agentId]) {
        stats[usage.agentId] = { tokens: 0, cost: 0, requests: 0 };
      }
      stats[usage.agentId].tokens += usage.totalTokens;
      stats[usage.agentId].cost += usage.cost;
      stats[usage.agentId].requests += 1;
    }
    
    return stats;
  }

  // Check budget alerts
  private checkBudgetAlerts(): BudgetAlert[] {
    const currentSpend = this.getCurrentMonthSpend();
    const percentage = (currentSpend / this.settings.monthlyLimit) * 100;
    
    const newAlerts: BudgetAlert[] = [];
    
    for (const threshold of this.settings.alertThresholds) {
      if (percentage >= threshold && !this.hasAlertForThreshold(threshold)) {
        const alert: BudgetAlert = {
          type: threshold >= 90 ? "critical" : "warning",
          message: `Budget ${threshold}% exhausted: $${currentSpend.toFixed(2)} of $${this.settings.monthlyLimit}`,
          currentSpend,
          budgetLimit: this.settings.monthlyLimit,
          percentage,
        };
        this.alerts.push(alert);
        newAlerts.push(alert);
      }
    }
    
    return newAlerts;
  }

  private hasAlertForThreshold(threshold: number): boolean {
    return this.alerts.some(
      (a) => Math.abs((a.percentage / 100) * this.settings.monthlyLimit - (threshold / 100) * this.settings.monthlyLimit) < 0.01
    );
  }

  // Get recommendations for cost savings
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const modelStats = this.getSpendByModel();
    const totalCost = Object.values(modelStats).reduce((sum, s) => sum + s.cost, 0);
    
    // Check for expensive model usage
    for (const [model, stats] of Object.entries(modelStats)) {
      const percentage = (stats.cost / totalCost) * 100;
      if (percentage > 50 && MODEL_PRICING[model]?.input > 0.01) {
        recommendations.push(
          `Consider using a cheaper model for ${model} - it accounts for ${percentage.toFixed(1)}% of costs`
        );
      }
    }
    
    // Check budget status
    const currentSpend = this.getCurrentMonthSpend();
    const remaining = this.settings.monthlyLimit - currentSpend;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - new Date().getDate();
    const dailyBudget = remaining / daysRemaining;
    
    if (dailyBudget < 1) {
      recommendations.push(
        `Budget nearly exhausted. Daily allowance: $${dailyBudget.toFixed(2)}. Consider reducing usage or increasing budget.`
      );
    }
    
    return recommendations;
  }

  // Get optimal model based on budget
  getOptimalModel(preferredModel: string): string {
    const currentSpend = this.getCurrentMonthSpend();
    const percentage = (currentSpend / this.settings.monthlyLimit) * 100;
    
    // If over budget and auto-downgrade enabled, use cheaper model
    if (percentage >= 100 && this.settings.autoDowngrade) {
      return this.settings.downgradeModel;
    }
    
    // If approaching budget limit, suggest downgrade
    if (percentage >= 90 && this.settings.autoDowngrade) {
      // Check if preferred model is expensive
      if (MODEL_PRICING[preferredModel]?.input > 0.01) {
        return this.settings.downgradeModel;
      }
    }
    
    return preferredModel;
  }

  // Forecast monthly spend
  forecastMonthlySpend(): {
    projected: number;
    trend: "increasing" | "decreasing" | "stable";
    confidence: number;
  } {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const currentSpend = this.getCurrentMonthSpend();
    const dailyAverage = currentSpend / dayOfMonth;
    const projected = dailyAverage * daysInMonth;
    
    // Simple trend analysis based on last 7 days vs previous 7 days
    const recent7Days = this.usage.filter(
      (u) => u.timestamp >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const previous7Days = this.usage.filter(
      (u) =>
        u.timestamp >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
        u.timestamp < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const recentCost = recent7Days.reduce((sum, u) => sum + u.cost, 0);
    const previousCost = previous7Days.reduce((sum, u) => sum + u.cost, 0);
    
    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (recentCost > previousCost * 1.2) {
      trend = "increasing";
    } else if (recentCost < previousCost * 0.8) {
      trend = "decreasing";
    }
    
    return {
      projected,
      trend,
      confidence: 0.8,
    };
  }

  // Get alerts
  getAlerts(): BudgetAlert[] {
    return [...this.alerts];
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
  }

  // Update settings
  updateSettings(settings: Partial<BudgetSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // Get settings
  getSettings(): BudgetSettings {
    return { ...this.settings };
  }

  // Get all usage
  getUsage(): TokenUsage[] {
    return [...this.usage];
  }

  // Export usage data
  exportUsage(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = "timestamp,model,provider,promptTokens,completionTokens,totalTokens,cost,conversationId,agentId\n";
      const rows = this.usage.map(
        (u) =>
          `${u.timestamp.toISOString()},${u.model},${u.provider},${u.promptTokens},${u.completionTokens},${u.totalTokens},${u.cost.toFixed(6)},${u.conversationId || ""},${u.agentId || ""}`
      );
      return headers + rows.join("\n");
    }
    return JSON.stringify(this.usage, null, 2);
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const budgetOptimizer = new BudgetOptimizer();
