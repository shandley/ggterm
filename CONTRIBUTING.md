# Contributing to ggterm

Thank you for your interest in contributing to ggterm! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+) - for package management and running
- Node.js 18+ (for compatibility testing)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/shandley/ggterm.git
cd ggterm

# Install dependencies
bun install

# Run tests
bun test

# Build all packages
bun run build
```

## Project Structure

```
ggterm/
├── packages/
│   ├── core/           # Grammar engine, scales, statistics
│   ├── render-braille/ # Braille dot matrix renderer
│   ├── render-block/   # Block character renderer
│   ├── render-sixel/   # Sixel/Kitty graphics renderer
│   └── opentui/        # OpenTUI React integration
├── examples/           # Usage examples
├── docs/               # Documentation
└── tests/              # Integration tests
```

## Development Workflow

### Branches

- `main` - stable release branch
- `develop` - integration branch for features
- `feature/*` - feature branches
- `fix/*` - bug fix branches

### Making Changes

1. **Fork** the repository
2. **Create a branch** from `develop`:
   ```bash
   git checkout -b feature/my-feature develop
   ```
3. **Make your changes** with clear, incremental commits
4. **Write tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request** to `develop`

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation
- `style` - formatting, missing semicolons
- `refactor` - code restructuring
- `test` - adding tests
- `chore` - maintenance tasks

Examples:
```
feat(core): add geom_bar geometry
fix(render-braille): correct aspect ratio calculation
docs(api): add scale_color_viridis examples
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Export types alongside implementations
- Use descriptive variable names

```typescript
// Good
interface ScaleOptions {
  limits?: [number, number]
  breaks?: number[]
}

function createScale(options: ScaleOptions): Scale {
  // ...
}

// Avoid
type Opts = { l?: number[], b?: number[] }
```

### Formatting

We use Prettier with the following settings:
- 2 space indentation
- Single quotes
- No semicolons
- 100 character line width

```bash
bun run format       # Format all files
bun run format:check # Check formatting
```

### Linting

ESLint is configured for TypeScript:

```bash
bun run lint        # Run linter
bun run lint:fix    # Auto-fix issues
```

## Testing

### Running Tests

```bash
# All tests
bun test

# Specific package
bun test --filter @ggterm/core

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Writing Tests

Place tests in `__tests__` directories or use `.test.ts` suffix:

```typescript
import { describe, it, expect } from 'bun:test'
import { gg, geom_point } from '../src'

describe('gg builder', () => {
  it('creates a plot with data', () => {
    const data = [{ x: 1, y: 2 }]
    const plot = gg(data).aes({ x: 'x', y: 'y' })
    expect(plot.data).toEqual(data)
  })

  it('adds geom layers', () => {
    const plot = gg([]).aes({ x: 'x', y: 'y' }).geom(geom_point())
    expect(plot.geoms).toHaveLength(1)
  })
})
```

### Visual Testing

For renderer tests, we use snapshot testing:

```typescript
import { expect, it } from 'bun:test'
import { renderToString } from '@ggterm/render-braille'

it('renders scatter plot correctly', () => {
  const output = renderToString(plot, { width: 40, height: 20 })
  expect(output).toMatchSnapshot()
})
```

## Adding New Features

### New Geometry

1. Create file in `packages/core/src/geoms/`
2. Implement the geometry interface:
   ```typescript
   export interface Geom {
     type: string
     render(data: DataPoint[], scales: Scales, canvas: Canvas): void
   }
   ```
3. Add tests
4. Export from `packages/core/src/geoms/index.ts`
5. Update documentation

### New Scale

1. Create file in `packages/core/src/scales/`
2. Implement the scale interface:
   ```typescript
   export interface Scale {
     type: 'continuous' | 'discrete'
     aesthetic: string
     domain: Domain
     range: Range
     map(value: unknown): number | string
     invert(position: number): unknown
   }
   ```
3. Add tests
4. Export and document

### New Renderer

1. Create new package: `packages/render-{name}/`
2. Implement renderer interface:
   ```typescript
   export interface Renderer {
     render(canvas: Canvas, options: RenderOptions): string
   }
   ```
3. Add capability detection
4. Update main package to include renderer

## Documentation

- Update `docs/API.md` for API changes
- Update `docs/ARCHITECTURE.md` for structural changes
- Add examples for new features
- Keep `README.md` current

## Pull Request Process

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Tests**: Ensure all tests pass
4. **Review**: Address feedback promptly

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
```

## Release Process

Releases follow semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features, backwards compatible
- **Patch**: Bug fixes

Releases are automated via GitHub Actions when tags are pushed:

```bash
# Create release
git tag v0.1.0
git push origin v0.1.0
```

## Getting Help

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Discord**: For real-time chat (link TBD)

## Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
