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
| core | Grammar engine, 30+ geoms, 50+ scales, pipeline, CLI |
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
bun test packages/core        # Core tests (~1220 tests)
bun test packages/opentui     # React hooks (~100 tests)
bun test packages/vue         # Vue composables
bun test packages/svelte      # Svelte stores
bun test packages/solid       # Solid primitives
```

## Current Status

Version: 0.2.0 (beta)
Maturity: 7.5/10
See `docs/PUBLISHING-PLAN.md` for roadmap.

## Recent Changes

**Latest features**:
- Faceting support in CLI and Vega-Lite export (`facet_wrap`, `facet_grid`)
- CLI now exposes 29 geom types (added col, ribbon, errorbarh, crossbar, linerange, pointrange, raster, label, contour_filled, density_2d)
- Interactive HTML export with Vega-Lite (PNG/SVG download buttons)
- Plot history with provenance tracking
- 1221+ tests passing

**CLI geom types**: point, line, path, step, bar, col, histogram, freqpoly, boxplot, violin, area, ribbon, rug, errorbar, errorbarh, crossbar, linerange, pointrange, smooth, segment, rect, raster, tile, text, label, contour, contour_filled, density_2d, qq

**Publishing**: Ready for npm publish
1. Create granular access token via CLI: `npm token create` or at https://www.npmjs.com/settings/~/tokens
   - Enable "Bypass 2FA" for CI/CD workflows
   - Note: Tokens with write permissions are limited to 90-day max lifetime
2. Run in packages/core: `npm publish --access public`
3. Verify at https://www.npmjs.com/package/@ggterm/core

Alternative: Use [OIDC trusted publishing](https://docs.npmjs.com/generating-provenance-statements) for GitHub Actions (no token needed)

## Claude Code Skills

Six skills are available in `.claude/skills/` for AI-assisted data analysis:

| Skill | Purpose | Invoke |
|-------|---------|--------|
| `data-load` | Load CSV, JSON, JSONL data | Auto or `/data-load` |
| `ggterm-plot` | Create terminal visualizations | Auto or `/ggterm-plot` |
| `ggterm-history` | Search and retrieve historical plots | Auto or `/ggterm-history` |
| `ggterm-markdown` | Generate reports with plots | Auto or `/ggterm-markdown` |
| `ggterm-publish` | Export plots to PNG/SVG/PDF/HTML | Auto or `/ggterm-publish` |
| `ggterm-customize` | Natural language plot customization | Auto or `/ggterm-customize` |

**History**: All plots are saved to `.ggterm/plots/` with provenance metadata. Use `history`, `show <id>`, and `export <id>` commands to retrieve past plots.

**Publication workflow**: Use `/ggterm-customize` for natural language edits, then `/ggterm-publish` for export.

Skills enable deterministic visualization workflows for AI agents. See `docs/PAPER-STRATEGY.md` for academic publication plans.
