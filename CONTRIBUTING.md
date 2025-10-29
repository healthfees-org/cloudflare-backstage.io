# Contributing to Cloudflare Backstage Plugin

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Yarn 3.6.0 or higher
- Git

### Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/healthfees-org/cloudflare-backstage.io.git
cd cloudflare-backstage.io
```

2. **Install dependencies**

```bash
yarn install
```

3. **Build all packages**

```bash
yarn build
```

## Project Structure

```
cloudflare-backstage.io/
├── packages/
│   ├── cloudflare-client/           # API client library
│   │   ├── src/
│   │   │   ├── base.ts             # Base HTTP client
│   │   │   ├── workers.ts          # Workers API client
│   │   │   ├── pages.ts            # Pages API client
│   │   │   ├── r2.ts               # R2 API client
│   │   │   ├── data.ts             # D1, KV, Queues clients
│   │   │   ├── ai-services.ts      # AI services clients
│   │   │   └── zero-trust.ts       # Zero Trust client
│   │   └── package.json
│   │
│   └── cloudflare-entity-provider/  # Catalog integration
│       ├── src/
│       │   ├── CloudflareEntityProvider.ts
│       │   └── mappers.ts          # Entity mappers for resources
│       └── package.json
│
├── plugins/
│   ├── cloudflare-backend/          # Backend API
│   │   ├── src/
│   │   │   ├── router.ts           # Main router
│   │   │   └── routers/            # Route handlers by service
│   │   └── package.json
│   │
│   └── cloudflare/                   # Frontend UI
│       ├── src/
│       │   ├── api/                # API client
│       │   ├── components/         # React components
│       │   └── plugin.ts           # Plugin definition
│       └── package.json
│
├── docs/                             # Documentation
│   ├── implementation_spec.md
│   ├── blueprint.md
│   └── scaffolder.md
│
└── examples/                         # Example catalog files
```

## Development Workflow

### Making Changes

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

Follow the code style and patterns established in existing files.

3. **Build and test**

```bash
# Build all packages
yarn build

# Lint code
yarn lint

# Run tests (when available)
yarn test
```

4. **Commit your changes**

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add support for XYZ feature"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Adding a New Cloudflare Service

To add support for a new Cloudflare service:

1. **Add types** in `packages/cloudflare-client/src/types.ts`:

```typescript
export type CfNewService = {
  id: string;
  name: string;
  // ... other fields
};
```

2. **Create client** in `packages/cloudflare-client/src/new-service.ts`:

```typescript
import { CloudflareBaseClient } from './base';
import { CfNewService } from './types';

export class NewServiceClient extends CloudflareBaseClient {
  async listServices(): Promise<CfNewService[]> {
    const response = await this.get<CfNewService[]>(
      `/accounts/${this.accountId}/new-service`
    );
    return response.result || [];
  }
}
```

3. **Add to main client** in `packages/cloudflare-client/src/index.ts`:

```typescript
import { NewServiceClient } from './new-service';

export class CloudflareClient {
  public newService: NewServiceClient;

  constructor(config: CloudflareClientConfig) {
    // ...
    this.newService = new NewServiceClient(config);
  }
}
```

4. **Add entity mapper** in `packages/cloudflare-entity-provider/src/mappers.ts`:

```typescript
export class NewServiceEntityMapper extends BaseEntityMapper<CfNewService> {
  map(service: CfNewService): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-new-service',
      `cf-new-service-${service.id}`,
      `Cloudflare New Service: ${service.name}`,
      ['cloudflare', 'new-service'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      serviceId: service.id,
      name: service.name,
    };

    return entity;
  }
}
```

5. **Add discovery** in `packages/cloudflare-entity-provider/src/CloudflareEntityProvider.ts`:

```typescript
private async discoverNewService(): Promise<ResourceEntity[]> {
  const mapper = new NewServiceEntityMapper({
    accountId: this.config.accountId,
    defaultOwner: this.config.defaultOwner,
    defaultSystem: this.config.defaultSystem,
  });

  const services = await this.client.newService.listServices();
  return services.map(s => mapper.map(s)).filter(Boolean) as ResourceEntity[];
}
```

6. **Add backend routes** in `plugins/cloudflare-backend/src/routers/`:

Create a new router file or add to an existing one.

7. **Update documentation** in relevant README files.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises
- Add JSDoc comments for public APIs
- Use descriptive variable names

### React

- Use functional components with hooks
- Use TypeScript for props
- Follow Material-UI patterns
- Keep components small and focused

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` for React components
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types**: `PascalCase`

## Testing

### Writing Tests

(Tests to be added in future iterations)

```typescript
// Example test structure
describe('WorkersClient', () => {
  it('should list workers', async () => {
    const client = new WorkersClient(config);
    const scripts = await client.listScripts();
    expect(scripts).toBeDefined();
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments to all public APIs
- Include examples in documentation
- Document parameters and return types
- Explain complex logic with inline comments

### README Updates

When adding features, update relevant README files:
- `README.md` - Main project README
- `packages/*/README.md` - Package-specific docs
- `plugins/*/README.md` - Plugin-specific docs

## Pull Request Process

1. **Ensure all checks pass**
   - Code builds successfully
   - Linting passes
   - Tests pass (when available)

2. **Update documentation**
   - Update README files
   - Add examples if needed
   - Update CHANGELOG (future)

3. **Create pull request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Include screenshots for UI changes

4. **Code review**
   - Address reviewer feedback
   - Keep discussions constructive
   - Be open to suggestions

## Release Process

(To be defined - currently manual releases)

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing documentation first

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
