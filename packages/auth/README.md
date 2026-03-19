# @my-ai-stack/auth

Authentication package using Better Auth. Handles user sessions, OAuth providers, and API key management.

## Structure

```
src/
├── index.ts      # Auth client configuration
└── server.ts     # Server-side auth utilities
```

## Installation

```bash
bun install @my-ai-stack/auth
```

## Usage

### Client-Side

```typescript
import { authClient } from "@my-ai-stack/auth";

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Sign out
await authClient.signOut();
```

### Server-Side

```typescript
import { auth } from "@my-ai-stack/auth/server";

// Get session
const session = await auth.api.getSession({
  headers: request.headers,
});
```

## Environment Variables

```env
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3001"
```
