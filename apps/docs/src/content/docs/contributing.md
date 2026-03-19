# Contributing to My AI Stack

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.0.0+)
- [Docker](https://docker.com) (for PostgreSQL/Redis)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/my-ai-stack.git
cd my-ai-stack

# Install dependencies
bun install

# Start services
docker-compose up -d

# Run database migrations
bun db:migrate

# Start development server
bun dev
```

## Project Structure

```
my-ai-stack/
├── apps/
│   └── web/           # Nuxt 4 frontend
├── packages/
│   ├── db/           # Database schema
│   ├── api/          # oRPC API
│   └── ai/           # AI engine
└── docs/             # Documentation
```

## Workflow

### Branching

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Commit with clear messages:
   ```bash
   git commit -m "feat: add new AI provider integration"
   ```

4. Push and create a Pull Request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Build process, dependencies

Examples:
```
feat: add support for Claude 3
fix: resolve memory search timeout issue
docs: update API reference for tools
```

## Code Standards

### TypeScript

- Enable strict mode
- No `any` types (use `unknown` if necessary)
- Explicit return types on public functions
- Use type inference where appropriate

### Vue Components

- Composition API with `<script setup>`
- Props with validation
- Emits declared explicitly
- Scoped styles

### Database

- All schema changes require migrations
- Index foreign keys and frequently queried fields
- Use proper column types (not just `text`)

## Testing

```bash
# Run all tests
bun test

# Run specific test
bun test packages/ai/src/memory

# Run with coverage
bun test --coverage
```

### Test Guidelines

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

## Linting & Formatting

```bash
# Check and fix all
bun run check

# Check specific package
bun run check --filter=@my-ai-stack/api
```

## Documentation

- Update docs for any API changes
- Add JSDoc comments to public functions
- Update README if adding features

## Feature Request

For new features:

1. Open an issue first for discussion
2. Include use case and expected behavior
3. Reference any related issues

## Bug Reports

When reporting bugs, include:

- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version)
- Error messages/stack traces

## Code Review Process

1. All PRs require at least one review
2. CI checks must pass
3. No merge conflicts
4. Branch up-to-date with main

## Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/my-ai-stack/discussions)
- Join our Discord: [link]

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
