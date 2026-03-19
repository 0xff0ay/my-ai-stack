// ============================================================================
// Agent Collaboration Network - Multi-agent orchestration
// ============================================================================

import { nanoid } from "nanoid";
import type { Agent } from "../agent";

// Agent roles
export type AgentRole = 
  | "researcher"
  | "coder"
  | "writer"
  | "analyst"
  | "planner"
  | "reviewer"
  | "coordinator"
  | "specialist";

// Agent capability
export interface AgentCapability {
  name: string;
  description: string;
  confidence: number; // 0-1
  examples: string[];
}

// Agent reputation
export interface AgentReputation {
  agentId: string;
  tasksCompleted: number;
  successRate: number;
  averageQuality: number; // 0-5
  helpfulness: number; // 0-5
  collaboration: number; // 0-5
  lastUpdated: Date;
}

// Task assignment
export interface TaskAssignment {
  id: string;
  taskId: string;
  agentId: string;
  role: AgentRole;
  confidence: number;
  estimatedTime: number; // minutes
  dependencies: string[];
}

// Sub-task
export interface SubTask {
  id: string;
  parentId?: string;
  description: string;
  assignedTo?: string;
  role: AgentRole;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Agent message
export interface AgentMessage {
  id: string;
  from: string;
  to: string | "broadcast";
  type: "request" | "response" | "notification" | "consensus";
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// Collaboration session
export interface CollaborationSession {
  id: string;
  name: string;
  coordinatorId: string;
  agentIds: string[];
  task: string;
  status: "planning" | "executing" | "reviewing" | "completed";
  subTasks: SubTask[];
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Consensus proposal
export interface ConsensusProposal {
  id: string;
  sessionId: string;
  proposal: string;
  proposerId: string;
  votes: Record<string, "for" | "against" | "abstain">;
  threshold: number; // 0-1
  deadline: Date;
  result?: "passed" | "rejected" | "pending";
}

// ============================================================================
// Role Definitions
// ============================================================================

export const ROLE_DEFINITIONS: Record<AgentRole, {
  description: string;
  responsibilities: string[];
  capabilities: string[];
  promptTemplate: string;
}> = {
  researcher: {
    description: "Gathers and analyzes information from various sources",
    responsibilities: ["Information gathering", "Fact checking", "Source validation"],
    capabilities: ["Web search", "Document analysis", "Data extraction"],
    promptTemplate: "You are a Researcher. Your role is to find and analyze information thoroughly. Be precise and cite your sources.",
  },
  coder: {
    description: "Writes, reviews, and debugs code",
    responsibilities: ["Code implementation", "Debugging", "Code review"],
    capabilities: ["Programming", "Testing", "Documentation"],
    promptTemplate: "You are a Coder. Your role is to write clean, efficient, and well-documented code. Follow best practices.",
  },
  writer: {
    description: "Creates and edits written content",
    responsibilities: ["Content creation", "Editing", "Style consistency"],
    capabilities: ["Copywriting", "Technical writing", "Creative writing"],
    promptTemplate: "You are a Writer. Your role is to create clear, engaging, and well-structured content.",
  },
  analyst: {
    description: "Analyzes data and provides insights",
    responsibilities: ["Data analysis", "Pattern recognition", "Reporting"],
    capabilities: ["Statistical analysis", "Visualization", "Forecasting"],
    promptTemplate: "You are an Analyst. Your role is to analyze data objectively and provide actionable insights.",
  },
  planner: {
    description: "Creates strategies and plans",
    responsibilities: ["Strategy development", "Resource allocation", "Timeline planning"],
    capabilities: ["Project planning", "Risk assessment", "Prioritization"],
    promptTemplate: "You are a Planner. Your role is to create comprehensive plans and identify optimal approaches.",
  },
  reviewer: {
    description: "Reviews and validates work quality",
    responsibilities: ["Quality assurance", "Validation", "Feedback"],
    capabilities: ["Critical analysis", "Error detection", "Improvement suggestions"],
    promptTemplate: "You are a Reviewer. Your role is to critically evaluate work and provide constructive feedback.",
  },
  coordinator: {
    description: "Manages collaboration and communication",
    responsibilities: ["Task coordination", "Conflict resolution", "Progress tracking"],
    capabilities: ["Leadership", "Communication", "Decision making"],
    promptTemplate: "You are a Coordinator. Your role is to ensure smooth collaboration and effective communication among agents.",
  },
  specialist: {
    description: "Domain-specific expert",
    responsibilities: ["Expert consultation", "Specialized tasks"],
    capabilities: ["Domain expertise", "Advanced techniques"],
    promptTemplate: "You are a Specialist. Your role is to provide deep expertise in your domain.",
  },
};

// ============================================================================
// Collaboration Manager
// ============================================================================

export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private reputations: Map<string, AgentReputation> = new Map();
  private proposals: Map<string, ConsensusProposal> = new Map();

  // Create a collaboration session
  createSession(
    name: string,
    coordinatorId: string,
    agentIds: string[],
    task: string
  ): CollaborationSession {
    const session: CollaborationSession = {
      id: nanoid(),
      name,
      coordinatorId,
      agentIds,
      task,
      status: "planning",
      subTasks: [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  // Add a sub-task
  addSubTask(
    sessionId: string,
    description: string,
    role: AgentRole,
    options: {
      parentId?: string;
      dependencies?: string[];
    } = {}
  ): SubTask {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const subTask: SubTask = {
      id: nanoid(),
      parentId: options.parentId,
      description,
      role,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    session.subTasks.push(subTask);
    session.updatedAt = new Date();

    return subTask;
  }

  // Assign task to agent
  assignTask(sessionId: string, subTaskId: string, agentId: string): SubTask {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const subTask = session.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) {
      throw new Error("Sub-task not found");
    }

    subTask.assignedTo = agentId;
    subTask.status = "in_progress";
    subTask.updatedAt = new Date();
    session.updatedAt = new Date();

    return subTask;
  }

  // Complete a sub-task
  completeTask(sessionId: string, subTaskId: string, result: string): SubTask {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const subTask = session.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) {
      throw new Error("Sub-task not found");
    }

    subTask.status = "completed";
    subTask.result = result;
    subTask.completedAt = new Date();
    subTask.updatedAt = new Date();
    session.updatedAt = new Date();

    // Check if all tasks are complete
    this.checkSessionCompletion(session);

    return subTask;
  }

  // Check if session can be marked complete
  private checkSessionCompletion(session: CollaborationSession): void {
    const allCompleted = session.subTasks.every(
      (t) => t.status === "completed" || t.status === "failed"
    );

    if (allCompleted && session.status === "executing") {
      session.status = "reviewing";
    }
  }

  // Send message between agents
  sendMessage(
    sessionId: string,
    from: string,
    to: string | "broadcast",
    type: AgentMessage["type"],
    content: string,
    metadata?: Record<string, unknown>
  ): AgentMessage {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const message: AgentMessage = {
      id: nanoid(),
      from,
      to,
      type,
      content,
      metadata,
      timestamp: new Date(),
    };

    session.messages.push(message);
    session.updatedAt = new Date();

    return message;
  }

  // Create consensus proposal
  createProposal(
    sessionId: string,
    proposal: string,
    proposerId: string,
    threshold = 0.5
  ): ConsensusProposal {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const consensus: ConsensusProposal = {
      id: nanoid(),
      sessionId,
      proposal,
      proposerId,
      votes: {},
      threshold,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      result: "pending",
    };

    this.proposals.set(consensus.id, consensus);
    return consensus;
  }

  // Vote on proposal
  vote(proposalId: string, agentId: string, vote: "for" | "against" | "abstain"): ConsensusProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.result !== "pending") {
      throw new Error("Voting has closed");
    }

    proposal.votes[agentId] = vote;

    // Check if threshold reached
    const session = this.sessions.get(proposal.sessionId);
    if (session) {
      const totalAgents = session.agentIds.length;
      const votesFor = Object.values(proposal.votes).filter((v) => v === "for").length;
      const participation = Object.keys(proposal.votes).length / totalAgents;

      if (votesFor / totalAgents >= proposal.threshold) {
        proposal.result = "passed";
      } else if (participation > 0.5 && votesFor / totalAgents < proposal.threshold) {
        proposal.result = "rejected";
      }
    }

    return proposal;
  }

  // Get optimal agent for role
  getOptimalAgentForRole(
    role: AgentRole,
    availableAgents: string[]
  ): { agentId: string; confidence: number } | null {
    let bestAgent: { agentId: string; confidence: number } | null = null;

    for (const agentId of availableAgents) {
      const reputation = this.reputations.get(agentId);
      if (!reputation) continue;

      // Calculate confidence based on reputation metrics
      const confidence = (reputation.successRate * 0.4) + 
                        (reputation.averageQuality / 5 * 0.3) + 
                        (reputation.collaboration / 5 * 0.3);

      if (!bestAgent || confidence > bestAgent.confidence) {
        bestAgent = { agentId, confidence };
      }
    }

    return bestAgent;
  }

  // Update agent reputation
  updateReputation(agentId: string, update: Partial<Omit<AgentReputation, "agentId" | "lastUpdated">>): void {
    const existing = this.reputations.get(agentId);
    
    if (existing) {
      this.reputations.set(agentId, {
        ...existing,
        ...update,
        lastUpdated: new Date(),
      });
    } else {
      this.reputations.set(agentId, {
        agentId,
        tasksCompleted: update.tasksCompleted || 0,
        successRate: update.successRate || 1,
        averageQuality: update.averageQuality || 3,
        helpfulness: update.helpfulness || 3,
        collaboration: update.collaboration || 3,
        lastUpdated: new Date(),
      });
    }
  }

  // Get session
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Get all sessions for an agent
  getAgentSessions(agentId: string): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.agentIds.includes(agentId) || s.coordinatorId === agentId
    );
  }

  // Get session progress
  getSessionProgress(sessionId: string): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const total = session.subTasks.length;
    const completed = session.subTasks.filter((t) => t.status === "completed").length;
    const inProgress = session.subTasks.filter((t) => t.status === "in_progress").length;
    const pending = session.subTasks.filter((t) => t.status === "pending").length;

    return {
      total,
      completed,
      inProgress,
      pending,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  // Execute collaboration (coordinator orchestrates)
  async executeCollaboration(sessionId: string): Promise<{
    session: CollaborationSession;
    summary: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Move to executing
    session.status = "executing";

    // Execute sub-tasks in dependency order
    const executedTasks = new Set<string>();
    
    while (executedTasks.size < session.subTasks.length) {
      const readyTasks = session.subTasks.filter(
        (t) =>
          t.status === "pending" &&
          t.assignedTo &&
          (t.dependencies || []).every((dep: string) => executedTasks.has(dep))
      );

      if (readyTasks.length === 0) break;

      for (const task of readyTasks) {
        task.status = "in_progress";
        task.updatedAt = new Date();
        
        // In a real implementation, this would call the agent to execute
        // For now, we just mark it as completed
        await this.simulateTaskExecution(task);
        
        task.status = "completed";
        task.completedAt = new Date();
        task.updatedAt = new Date();
        task.result = `Completed by ${task.assignedTo}`;
        executedTasks.add(task.id);
      }
    }

    // Generate summary
    const summary = this.generateSessionSummary(session);
    session.status = "completed";
    session.updatedAt = new Date();

    return { session, summary };
  }

  private async simulateTaskExecution(task: SubTask): Promise<void> {
    // Simulate execution time based on complexity
    const estimatedTime = 1000 + Math.random() * 2000;
    await new Promise<void>((resolve) => setTimeout(resolve, estimatedTime));
  }

  private generateSessionSummary(session: CollaborationSession): string {
    const completed = session.subTasks.filter((t) => t.status === "completed").length;
    const failed = session.subTasks.filter((t) => t.status === "failed").length;
    
    return `
Collaboration Session: ${session.name}
Task: ${session.task}
Status: ${session.status}
Agents: ${session.agentIds.length}
Completed Tasks: ${completed}/${session.subTasks.length}
Failed Tasks: ${failed}
Created: ${session.createdAt.toISOString()}
Completed: ${session.updatedAt.toISOString()}
    `.trim();
  }

  // Get collaboration statistics
  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    averageCompletionTime: number;
    totalAgents: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const completed = sessions.filter((s) => s.status === "completed");
    
    const completionTimes = completed.map(
      (s) => s.updatedAt.getTime() - s.createdAt.getTime()
    );
    
    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    const allAgents = new Set<string>();
    for (const session of sessions) {
      session.agentIds.forEach((id) => allAgents.add(id));
    }

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.status === "executing").length,
      completedSessions: completed.length,
      averageCompletionTime,
      totalAgents: allAgents.size,
    };
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const collaborationManager = new CollaborationManager();
