# ggterm

TypeScript implementation of the Grammar of Graphics for terminal interfaces.

## Quick Start

```bash
bun install          # Install dependencies
bun run build        # Build all packages
bun test             # Run all tests
bun run packages/core/src/demo.ts  # Run demo
```

## Architecture

**Monorepo** with 8 packages in `packages/`:

| Package | Purpose |
|---------|---------|
| core | Grammar engine, 18+ geoms, 50+ scales, pipeline, CLI |
| render-braille | 2x4 dot Braille characters |
| render-block | Half-block Unicode rendering |
| render-sixel | Sixel/Kitty/iTerm2 pixel protocols |
| opentui | React hooks (useGGTerm, usePlotData, usePlotInteraction) |
| vue | Vue 3 composables |
| svelte | Svelte stores |
| solid | Solid.js primitives |

## Core Concepts

```typescript
import { gg, geom_point, geom_line, renderToString } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'time', y: 'value', color: 'category' })
  .geom(geom_point())
  .geom(geom_line())
  .labs({ title: 'My Plot' })
  .spec()

console.log(renderToString(plot, { width: 80, height: 24 }))
```

## Key Files

- `packages/core/src/grammar.ts` - GGPlot fluent API
- `packages/core/src/pipeline/pipeline.ts` - Rendering pipeline
- `packages/core/src/geoms/` - All geometry implementations
- `packages/core/src/scales/` - Scale system
- `packages/core/src/annotations.ts` - Annotation API

## Testing

```bash
bun test packages/core        # Core tests (~160 tests)
bun test packages/opentui     # React hooks (~100 tests)
bun test packages/vue         # Vue composables
bun test packages/svelte      # Svelte stores
bun test packages/solid       # Solid primitives
```

## Current Status

Version: 0.2.0 (beta)
Maturity: 7.5/10
See `docs/PUBLISHING-PLAN.md` for roadmap.

## Next Session TODO

**Immediate**: Publish @ggterm/core to npm
1. Create npm granular access token with "Bypass 2FA" at https://www.npmjs.com/settings/tokens
2. Run in packages/core: `npm publish --access public`
3. Verify at https://www.npmjs.com/package/@ggterm/core

**Package optimizations done**:
- Added `.npmignore` to exclude tests
- Changed `files` field to only include `dist/`
- Package size: 134KB (was 414KB)

**After core is published**:
- Publish remaining 7 packages
- Add npm badges to README
