# API Reference

The API uses **oRPC** for type-safe RPC calls over HTTP.

## Base URL

```
Production: https://api.my-aistack.com
Development: http://localhost:3001
```

## Authentication

All endpoints (except health check) require authentication via:
- **Session Cookie**: Better Auth session
- **API Key**: Header `X-API-Key: your-key`

## Endpoints

### Agents

#### List Agents
```http
POST /api/agents.list
Content-Type: application/json

{
  "limit": 20,
  "cursor": "optional-cursor"
}
```

#### Create Agent
```http
POST /api/agents.create
Content-Type: application/json

{
  "name": "My Agent",
  "description": "A helpful assistant",
  "systemPrompt": "You are a helpful AI assistant...",
  "modelProvider": "openai",
  "modelName": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

#### Update Agent
```http
POST /api/agents.update
Content-Type: application/json

{
  "id": "agent_123",
  "data": {
    "name": "Updated Name",
    "systemPrompt": "New prompt..."
  }
}
```

#### Delete Agent
```http
POST /api/agents.delete
Content-Type: application/json

{
  "id": "agent_123"
}
```

### Chat

#### Send Message (Streaming)
```http
POST /api/chat.send
Content-Type: application/json

{
  "agentId": "agent_123",
  "conversationId": "conv_456",
  "message": "Hello, agent!",
  "stream": true
}
```

Response (SSE):
```
data: {"type": "content", "content": "Hello"}
data: {"type": "content", "content": " there"}
data: {"type": "done"}
```

### Memories

#### Search Memories
```http
POST /api/memories.search
Content-Type: application/json

{
  "query": "project requirements",
  "agentId": "agent_123",
  "limit": 10,
  "threshold": 0.8
}
```

#### Create Memory
```http
POST /api/memories.create
Content-Type: application/json

{
  "content": "Important fact to remember",
  "agentId": "agent_123",
  "type": "semantic",
  "importance": "high"
}
```

### Tools

#### List Tools
```http
POST /api/tools.list
Content-Type: application/json

{
  "limit": 20,
  "status": "active"
}
```

#### Execute Tool
```http
POST /api/tools.execute
Content-Type: application/json

{
  "toolId": "tool_123",
  "agentId": "agent_456",
  "input": {
    "param1": "value1"
  }
}
```

#### Create Tool
```http
POST /api/tools.create
Content-Type: application/json

{
  "name": "Calculator",
  "description": "Perform calculations",
  "code": "export default function(input) { return input.a + input.b; }",
  "parameters": {
    "a": { "type": "number" },
    "b": { "type": "number" }
  }
}
```

### Workflows

#### List Workflows
```http
POST /api/workflows.list
Content-Type: application/json

{
  "limit": 20,
  "isActive": true
}
```

#### Create Workflow
```http
POST /api/workflows.create
Content-Type: application/json

{
  "name": "Daily Report",
  "description": "Generate daily analytics report",
  "nodes": [...],
  "edges": [...],
  "triggerType": "scheduled",
  "scheduleConfig": {
    "cron": "0 9 * * *"
  }
}
```

#### Trigger Workflow
```http
POST /api/workflows.trigger
Content-Type: application/json

{
  "workflowId": "wf_123",
  "input": {
    "date": "2024-01-01"
  }
}
```

### Documents

#### List Documents
```http
POST /api/documents.list
Content-Type: application/json

{
  "limit": 20,
  "status": "indexed"
}
```

#### Create Document
```http
POST /api/documents.create
Content-Type: application/json

{
  "title": "Project Spec",
  "content": "Document content...",
  "sourceType": "manual",
  "tags": ["spec", "v1"]
}
```

#### Process Document
```http
POST /api/documents.process
Content-Type: application/json

{
  "documentId": "doc_123",
  "chunkSize": 1000,
  "chunkOverlap": 200
}
```

### Knowledge Graph

#### Create Node
```http
POST /api/knowledgeGraph.createNode
Content-Type: application/json

{
  "name": "Artificial Intelligence",
  "type": "concept",
  "description": "AI systems and applications",
  "properties": {
    "field": "Computer Science"
  }
}
```

#### Create Edge
```http
POST /api/knowledgeGraph.createEdge
Content-Type: application/json

{
  "sourceNodeId": "node_1",
  "targetNodeId": "node_2",
  "relationshipType": "is-a",
  "strength": 1.0
}
```

#### Search Nodes
```http
POST /api/knowledgeGraph.searchNodes
Content-Type: application/json

{
  "query": "machine learning",
  "type": "concept",
  "limit": 10
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with id 'agent_123' not found",
    "status": 404
  }
}
```

## Rate Limiting

- **Authenticated**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## TypeScript Client

```typescript
import { createORPCClient } from "@orpc/client";
import type { AppRouter } from "@my-ai-stack/api";

const client = createORPCClient<AppRouter>({
  baseURL: "https://api.my-aistack.com",
});

// Type-safe API calls
const agents = await client.agents.list({ limit: 10 });
const agent = await client.agents.create({
  name: "New Agent",
  modelProvider: "openai",
  modelName: "gpt-4",
});
```
