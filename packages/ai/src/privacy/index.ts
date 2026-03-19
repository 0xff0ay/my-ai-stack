// ============================================================================
// Privacy Guardian - PII Detection and Masking
// ============================================================================

// Common PII patterns
const PII_PATTERNS = {
  // Email addresses
  email: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (match: string) => {
      const parts = match.split("@");
      if (parts.length !== 2) return "[EMAIL REDACTED]";
      const [local, domain] = parts;
      const maskedLocal = (local?.slice(0, 2) || "") + "***";
      const domainParts = domain?.split(".") || [];
      const domainName = domainParts[0] || "";
      const tld = domainParts[domainParts.length - 1] || "";
      const maskedDomain = domainName.slice(0, 2) + "***" + "." + tld;
      return `${maskedLocal}@${maskedDomain}`;
    },
    type: "email",
    severity: "high",
  },

  // Phone numbers (various formats)
  phone: {
    pattern: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
    mask: () => "***-***-****",
    type: "phone",
    severity: "high",
  },

  // SSN
  ssn: {
    pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    mask: () => "***-**-****",
    type: "ssn",
    severity: "critical",
  },

  // Credit card numbers
  creditCard: {
    pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
    mask: (match: string) => {
      const digits = match.replace(/\D/g, "");
      return "****-****-****-" + digits.slice(-4);
    },
    type: "credit_card",
    severity: "critical",
  },

  // IP addresses
  ipAddress: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: () => "***.***.***.***",
    type: "ip_address",
    severity: "medium",
  },

  // API keys (common patterns)
  apiKey: {
    pattern: /\b(?:api[_-]?key|apikey|token)\s*[:=]\s*["']?[a-zA-Z0-9]{32,}["']?/gi,
    mask: () => "API_KEY_REDACTED",
    type: "api_key",
    severity: "critical",
  },

  // URLs with credentials
  urlWithCredentials: {
    pattern: /https?:\/\/[^:]+:[^@]+@[^\s]+/gi,
    mask: (match: string) => {
      try {
        if (typeof URL !== "undefined") {
          const url = new URL(match);
          url.password = "***";
          url.username = "***";
          return url.toString();
        }
        return match.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@");
      } catch {
        return match.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@");
      }
    },
    type: "url_credentials",
    severity: "high",
  },

  // Names (basic patterns - would use NLP in production)
  fullName: {
    pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    mask: (match: string) => {
      const parts = match.split(" ");
      return parts.map(p => p[0] + ".").join(" ");
    },
    type: "name",
    severity: "medium",
  },

  // Physical addresses (basic patterns)
  address: {
    pattern: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Trail|Trl|Highway|Hwy|Expressway|Expy|Freeway|Fwy|Parkway|Pkwy|Turnpike|Tpke|Bridge|Brg|Alley|Aly|Plaza|Plz|Square|Sq|Loop|Lp|Terrace|Ter|Place|Pl)[,.\s]/gi,
    mask: () => "[ADDRESS REDACTED]",
    type: "address",
    severity: "high",
  },
};

// PII detection result
export interface PIIDetection {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  match: string;
  index: number;
  length: number;
  masked: string;
}

// Detection options
export interface DetectionOptions {
  types?: string[]; // Specific types to detect, or all if undefined
  mask?: boolean; // Whether to mask detected PII
  severityThreshold?: "low" | "medium" | "high" | "critical";
}

// ============================================================================
// PII Detector Class
// ============================================================================

export class PIIDetector {
  private patterns: typeof PII_PATTERNS;

  constructor() {
    this.patterns = PII_PATTERNS;
  }

  // Detect PII in text
  detect(text: string, options: DetectionOptions = {}): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    const thresholdValue = options.severityThreshold 
      ? severityOrder[options.severityThreshold] 
      : -1;

    for (const [key, config] of Object.entries(this.patterns)) {
      // Skip if specific types requested and this isn't one
      if (options.types && !options.types.includes(key)) {
        continue;
      }

      // Skip if below severity threshold
      const severityValue = severityOrder[config.severity] ?? 0;
      if (thresholdValue > -1 && severityValue < thresholdValue) {
        continue;
      }

      // Find all matches
      let match: RegExpExecArray | null;
      const pattern = new RegExp(config.pattern.source, config.pattern.flags);
      
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          type: config.type,
          severity: config.severity,
          match: match[0],
          index: match.index,
          length: match[0].length,
          masked: config.mask(match[0]),
        });
      }
    }

    // Sort by index to maintain order
    return detections.sort((a, b) => a.index - b.index);
  }

  // Mask all detected PII
  mask(text: string, options: DetectionOptions = {}): string {
    const detections = this.detect(text, { ...options, mask: true });
    
    if (detections.length === 0) {
      return text;
    }

    // Build masked text from end to start to preserve indices
    let result = text;
    for (let i = detections.length - 1; i >= 0; i--) {
      const detection = detections[i];
      result = 
        result.slice(0, detection.index) + 
        detection.masked + 
        result.slice(detection.index + detection.length);
    }

    return result;
  }

  // Check if text contains any PII
  containsPII(text: string, options: DetectionOptions = {}): boolean {
    return this.detect(text, options).length > 0;
  }

  // Get PII statistics
  getStats(detections: PIIDetection[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const detection of detections) {
      stats[detection.type] = (stats[detection.type] || 0) + 1;
    }

    return stats;
  }

  // Get severity score (0-100)
  getSeverityScore(detections: PIIDetection[]): number {
    if (detections.length === 0) return 0;

    const severityWeights = { low: 10, medium: 25, high: 50, critical: 100 };
    const totalWeight = detections.reduce(
      (sum, d) => sum + severityWeights[d.severity], 
      0
    );

    // Cap at 100
    return Math.min(100, totalWeight);
  }
}

// ============================================================================
// Privacy Guardian Service
// ============================================================================

export interface PrivacySettings {
  autoMask: boolean;
  maskTypes: string[];
  severityThreshold: "low" | "medium" | "high" | "critical";
  logDetections: boolean;
  notifyUser: boolean;
}

export class PrivacyGuardian {
  private detector: PIIDetector;
  private settings: PrivacySettings;

  constructor(settings: Partial<PrivacySettings> = {}) {
    this.detector = new PIIDetector();
    this.settings = {
      autoMask: true,
      maskTypes: Object.keys(PII_PATTERNS),
      severityThreshold: "low",
      logDetections: true,
      notifyUser: true,
      ...settings,
    };
  }

  // Process text for privacy
  process(text: string): {
    original: string;
    processed: string;
    hasPII: boolean;
    detections: PIIDetection[];
    severityScore: number;
    stats: Record<string, number>;
  } {
    const detections = this.detector.detect(text, {
      types: this.settings.maskTypes,
      severityThreshold: this.settings.severityThreshold,
    });

    const hasPII = detections.length > 0;
    const processed = this.settings.autoMask 
      ? this.detector.mask(text, { types: this.settings.maskTypes })
      : text;

    return {
      original: text,
      processed,
      hasPII,
      detections,
      severityScore: this.detector.getSeverityScore(detections),
      stats: this.detector.getStats(detections),
    };
  }

  // Sanitize for storage (always mask)
  sanitizeForStorage(text: string): string {
    return this.detector.mask(text, {
      types: this.settings.maskTypes,
    });
  }

  // Sanitize for display (respect user settings)
  sanitizeForDisplay(text: string): string {
    if (!this.settings.autoMask) {
      return text;
    }
    return this.detector.mask(text, {
      types: this.settings.maskTypes,
    });
  }

  // Check if safe to process
  isSafe(text: string): boolean {
    const detections = this.detector.detect(text, {
      severityThreshold: "critical",
    });
    return detections.length === 0;
  }

  // Update settings
  updateSettings(settings: Partial<PrivacySettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // Get current settings
  getSettings(): PrivacySettings {
    return { ...this.settings };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const privacyGuardian = new PrivacyGuardian();
export const piiDetector = new PIIDetector();
