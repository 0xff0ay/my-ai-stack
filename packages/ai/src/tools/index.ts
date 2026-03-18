// ============================================================================
// Tools - Dynamic tool registration and execution
// ============================================================================

import { nanoid } from "nanoid";
import { z } from "zod";

// Tool definition
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  schema: z.ZodSchema;
  code: string;
  category?: string;
  tags?: string[];
}

// Tool parameter validation result
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
  data?: unknown;
}

// Execution result
export interface ExecutionResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}

// Tool context passed to tool execution
export interface ToolContext {
  userId: string;
  agentId?: string;
  conversationId?: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Built-in Tools Registry
// ============================================================================

// Tool schemas for common operations
export const toolSchemas = {
  // Web search tool
  webSearch: z.object({
    query: z.string().describe("The search query"),
    numResults: z.number().optional().default(10).describe("Number of results to return"),
  }),

  // Calculator tool
  calculator: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  }),

  // Current date/time
  getCurrentTime: z.object({
    timezone: z.string().optional().default("UTC").describe("IANA timezone"),
    format: z
      .enum(["full", "date", "time"])
      .optional()
      .default("full")
      .describe("Format of the output"),
  }),

  // URL fetcher
  fetchUrl: z.object({
    url: z.string().url().describe("URL to fetch"),
    method: z
      .enum(["GET", "POST"])
      .optional()
      .default("GET")
      .describe("HTTP method"),
    headers: z.record(z.string()).optional().describe("Request headers"),
  }),

  // File read (simulated)
  readFile: z.object({
    path: z.string().describe("File path to read"),
    encoding: z
      .enum(["utf-8", "base64"])
      .optional()
      .default("utf-8")
      .describe("File encoding"),
  }),

  // Code execution
  executeCode: z.object({
    code: z.string().describe("Code to execute"),
    language: z
      .enum(["javascript", "python", "bash"])
      .describe("Programming language"),
    timeout: z.number().optional().default(30000).describe("Execution timeout in ms"),
  }),

  // Generate random data
  generateId: z.object({
    length: z.number().optional().default(16).describe("ID length"),
    charset: z
      .enum(["alphanumeric", "numeric", "alpha", "hex"])
      .optional()
      .default("alphanumeric")
      .describe("Character set"),
  }),
} as const;

// Built-in tool implementations
const builtInTools: Record<string, (params: unknown, context: ToolContext) => Promise<unknown>> = {
  // Calculator
  calculator: async (params: unknown) => {
    const { expression } = params as { expression: string };
    // Safe mathematical evaluation
    const sanitized = expression.replace(/[^0-9+\-*/.()% ]/g, "");
    // eslint-disable-next-line no-eval
    const result = eval(sanitized); // Safe in this context due to sanitization
    return { result };
  },

  // Get current time
  getCurrentTime: async (params: unknown) => {
    const { timezone, format } = params as { timezone: string; format: string };
    const now = new Date();

    const options: Intl.DateTimeFormatOptions = {};
    if (format === "date" || format === "full") {
      options.dateStyle = "long";
    }
    if (format === "time" || format === "full") {
      options.timeStyle = "long";
    }

    return {
      datetime: now.toLocaleString("en-US", { timeZone: timezone, ...options }),
      timestamp: now.toISOString(),
      timezone,
      format,
    };
  },

  // URL fetcher
  fetchUrl: async (params: unknown) => {
    const { url, method, headers } = params as {
      url: string;
      method: string;
      headers?: Record<string, string>;
    };

    const response = await fetch(url, {
      method,
      headers: {
        "User-Agent": "AI-Agent-Platform/1.0",
        ...headers,
      },
    });

    const text = await response.text();
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text.slice(0, 10000), // Limit response size
    };
  },

  // Generate ID
  generateId: async (params: unknown) => {
    const { length, charset } = params as {
      length: number;
      charset: string;
    };

    let id = "";
    const charsets: Record<string, string> = {
      alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      numeric: "0123456789",
      alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      hex: "0123456789abcdef",
    };

    const chars = charsets[charset] || charsets.alphanumeric;
    for (let i = 0; i < length; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }

    return { id };
  },
};

// ============================================================================
// Tool Registry
// ============================================================================

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private builtIn: Set<string> = new Set(Object.keys(builtInTools));

  constructor() {
    // Register built-in tools
    this.registerBuiltInTools();
  }

  // Register built-in tools
  private registerBuiltInTools(): void {
    this.register({
      id: "web_search",
      name: "webSearch",
      description: "Search the web for information",
      schema: toolSchemas.webSearch,
      code: "",
      category: "search",
      tags: ["search", "web", "information"],
    });

    this.register({
      id: "calculator",
      name: "calculator",
      description: "Evaluate a mathematical expression",
      schema: toolSchemas.calculator,
      code: "",
      category: "utilities",
      tags: ["math", "calculator", "utilities"],
    });

    this.register({
      id: "get_current_time",
      name: "getCurrentTime",
      description: "Get the current date and time",
      schema: toolSchemas.getCurrentTime,
      code: "",
      category: "utilities",
      tags: ["time", "date", "utilities"],
    });

    this.register({
      id: "fetch_url",
      name: "fetchUrl",
      description: "Fetch content from a URL",
      schema: toolSchemas.fetchUrl,
      code: "",
      category: "network",
      tags: ["fetch", "http", "network"],
    });

    this.register({
      id: "generate_id",
      name: "generateId",
      description: "Generate a random ID",
      schema: toolSchemas.generateId,
      code: "",
      category: "utilities",
      tags: ["id", "random", "utilities"],
    });
  }

  // Register a new tool
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  // Unregister a tool
  unregister(name: string): boolean {
    // Don't allow unregistering built-in tools
    if (this.builtIn.has(name)) {
      return false;
    }
    return this.tools.delete(name);
  }

  // Get a tool by name
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  // Get all tools
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  // Get tools by category
  listByCategory(category: string): ToolDefinition[] {
    return this.list().filter((tool) => tool.category === category);
  }

  // Get all tool names
  listNames(): string[] {
    return this.list().map((t) => t.name);
  }

  // Check if tool exists
  has(name: string): boolean {
    return this.tools.has(name) || this.builtIn.has(name);
  }

  // Validate tool parameters
  validate(name: string, params: unknown): ValidationResult {
    const tool = this.tools.get(name);
    if (!tool) {
      // Check if it's a built-in tool
      if (this.builtIn.has(name)) {
        const schema = Object.entries(toolSchemas).find(
          ([key]) => key.toLowerCase() === name.toLowerCase()
        );
        if (schema) {
          const result = schema[1].safeParse(params);
          if (result.success) {
            return { valid: true, data: result.data };
          }
          return {
            valid: false,
            errors: result.error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          };
        }
      }
      return { valid: false, errors: [{ path: "", message: `Tool ${name} not found` }] };
    }

    try {
      const result = tool.schema.parse(params);
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        };
      }
      return { valid: false, errors: [{ path: "", message: String(error) }] };
    }
  }
}

// ============================================================================
// Tool Executor
// ============================================================================

export class ToolExecutor {
  private registry: ToolRegistry;
  private customExecutors: Map<string, (params: unknown, context: ToolContext) => Promise<unknown>>;

  constructor(registry?: ToolRegistry) {
    this.registry = registry || new ToolRegistry();
    this.customExecutors = new Map();
  }

  // Register a custom executor for a tool
  registerExecutor(name: string, executor: (params: unknown, context: ToolContext) => Promise<unknown>): void {
    this.customExecutors.set(name, executor);
  }

  // Execute a tool
  async execute(
    toolName: string,
    params: unknown,
    context: ToolContext,
    options?: { timeout?: number; retryCount?: number }
  ): Promise<ExecutionResult> {
    const toolCallId = `call_${nanoid(12)}`;
    const startTime = Date.now();

    // Validate parameters
    const validation = this.registry.validate(toolName, params);
    if (!validation.valid) {
      return {
        toolCallId,
        toolName,
        success: false,
        error: `Validation failed: ${validation.errors?.map((e) => e.message).join(", ")}`,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      let result: unknown;

      // Check for custom executor first
      const customExecutor = this.customExecutors.get(toolName);
      if (customExecutor) {
        result = await this.executeWithTimeout(
          () => customExecutor(validation.data, context),
          options?.timeout || 30000
        );
      }
      // Check for built-in tool
      else if (builtInTools[toolName]) {
        result = await this.executeWithTimeout(
          () => builtInTools[toolName](validation.data, context),
          options?.timeout || 30000
        );
      }
      // Check for custom tool with code
      else {
        const tool = this.registry.get(toolName);
        if (tool?.code) {
          result = await this.executeCustomTool(tool, validation.data, context, options?.timeout || 30000);
        } else {
          throw new Error(`No executor found for tool: ${toolName}`);
        }
      }

      return {
        toolCallId,
        toolName,
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        toolCallId,
        toolName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  // Execute multiple tools in parallel
  async executeMany(
    tools: Array<{ name: string; params: unknown }>,
    context: ToolContext,
    options?: { timeout?: number }
  ): Promise<ExecutionResult[]> {
    const promises = tools.map((tool) =>
      this.execute(tool.name, tool.params, context, options)
    );
    return Promise.all(promises);
  }

  // Execute tool with timeout
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Execute custom tool code (sandboxed)
  private async executeCustomTool(
    tool: ToolDefinition,
    params: unknown,
    context: ToolContext,
    timeout: number
  ): Promise<unknown> {
    // Create a sandboxed function execution
    // In production, this would use a proper sandbox like VM2 or isolated-vm
    const sandbox = {
      params,
      context,
      console: {
        log: () => {},
        error: () => {},
        warn: () => {},
      },
      result: undefined as unknown,
    };

    try {
      // Create and execute the function
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "params",
        "context",
        "console",
        `
        "use strict";
        ${tool.code}
        `
      );

      const result = await this.executeWithTimeout(
        () => Promise.resolve(fn(sandbox.params, sandbox.context, sandbox.console)),
        timeout
      );

      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${error}`);
    }
  }

  // Get registry
  getRegistry(): ToolRegistry {
    return this.registry;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// Create tool definition from code
export function createToolDefinition(
  name: string,
  description: string,
  schema: z.ZodSchema,
  code: string,
  options?: { id?: string; category?: string; tags?: string[] }
): ToolDefinition {
  return {
    id: options?.id || `tool_${nanoid(12)}`,
    name,
    description,
    schema,
    code,
    category: options?.category,
    tags: options?.tags,
  };
}

// Convert tool to AI SDK format
export function toAISDKTools(registry: ToolRegistry): Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}> {
  return registry.list().map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.schema instanceof z.ZodType ? tool.schema._def : {},
  }));
}