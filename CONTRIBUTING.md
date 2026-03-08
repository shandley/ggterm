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

# Build
bun run build
```

## Project Structure

ggterm is a single package with a layered architecture. The grammar primitives (Layer 1) produce a `PlotSpec` that rendering backends (Layer 2) consume independently.

```
ggterm/
├── packages/
│   └── core/                # Everything: grammar, renderers, CLI, export
│       └── src/
│           ├── types.ts         # PlotSpec and all core interfaces
│           ├── grammar.ts       # gg() fluent builder API
│           ├── geoms/           # 66 geometry implementations
│           ├── scales/          # 75 scale implementations
│           ├── stats/           # Statistical transforms
│           ├── coords/          # Coordinate systems
│           ├── facets/          # Faceting (wrap, grid)
│           ├── themes/          # Theme definitions
│           ├── pipeline/        # Terminal rendering backend
│           │   └── pipeline.ts  # PlotSpec → Canvas → ANSI string
│           ├── export/          # Vega-Lite backend
│           │   └── vega-lite.ts # PlotSpec → VegaLiteSpec → JSON
│           ├── canvas/          # Abstract canvas buffer
│           ├── history/         # Plot history with provenance
│           ├── cli-plot.ts      # CLI tool (npx ggterm-plot)
│           ├── cli.ts           # Interactive REPL (npx ggterm)
│           ├── serve.ts         # Live viewer server (SSE)
│           ├── init.ts          # Skill/project installer
│           └── __tests__/       # All tests (2158)
├── examples/                # AI-forward vignettes
├── docs/                    # Technical documentation
└── paper/                   # bioRxiv preprint
```

## Development Workflow

### Branches

- `main` - primary branch
- `feature/*` - feature branches (merge to `main`)
- `fix/*` - bug fix branches

### Making Changes

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature main
   ```
3. **Make your changes** with clear, incremental commits
4. **Write tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request** to `main`

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
- `style` - formatting
- `refactor` - code restructuring
- `test` - adding tests
- `chore` - maintenance tasks

Examples:
```
feat(geoms): add geom_waterfall geometry
fix(pipeline): correct aspect ratio calculation for faceted plots
docs(architecture): update PlotSpec boundary diagram
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

- 2 space indentation
- Single quotes
- No semicolons
- 100 character line width

## Testing

### Running Tests

```bash
# All tests
bun test

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

For renderer tests, use snapshot testing:

```typescript
import { expect, it } from 'bun:test'
import { gg, geom_point } from '../src'

it('renders scatter plot correctly', () => {
  const plot = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point())
  const output = plot.render({ width: 40, height: 20, colorMode: 'truecolor' })
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

### New Rendering Backend

New backends consume `PlotSpec` from `types.ts` and produce output in a target format. There are no separate renderer packages — backends live inside `packages/core/src/`.

Reference implementations:
- **Terminal backend**: `pipeline/pipeline.ts` — `PlotSpec` → Canvas → ANSI string
- **Vega-Lite backend**: `export/vega-lite.ts` — `PlotSpec` → Vega-Lite JSON

To add a new backend:
1. Create a new file (e.g., `export/svg.ts`)
2. Write a function that takes `PlotSpec` and returns your target format
3. Reuse stat/scale computation from `pipeline.ts` where possible
4. Add tests and export

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
git tag v0.3.10
git push origin v0.3.10
```

## Getting Help

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas

## Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
