# ggterm

TypeScript implementation of the Grammar of Graphics for terminal interfaces.

## Quick Start

```bash
bun install          # Install dependencies
bun run build        # Build
bun test             # Run all tests
bun run packages/core/src/demo.ts  # Run demo
```

## Architecture

Single package: `@ggterm/core` in `packages/core/`

Contains:
- Grammar engine with fluent API
- 30 geometry types
- 50+ scales (continuous, discrete, color)
- CLI for plotting CSV/JSON/JSONL files
- Vega-Lite export for publication-quality output
- Plot history with provenance tracking

## Current Status

- **Version**: 0.2.6
- **npm**: https://www.npmjs.com/package/@ggterm/core
- **Repo**: https://github.com/shandley/ggterm (public)

## Bundled Datasets

```bash
.data iris     # 150 rows: sepal_length, sepal_width, petal_length, petal_width, species
.data mtcars   # 16 rows: mpg, cyl, hp, wt, name
.data sample N # N random rows: x, y, group, size
```

## Key Files

- `packages/core/src/grammar.ts` - GGPlot fluent API
- `packages/core/src/pipeline/pipeline.ts` - Rendering pipeline
- `packages/core/src/geoms/` - All geometry implementations
- `packages/core/src/scales/` - Scale system
- `packages/core/src/cli-plot.ts` - CLI tool

## CLI Usage

```bash
# After npm install (use npx):
npx ggterm-plot data.csv x y
npx ggterm-plot data.json x y color "Title" point
npx ggterm-plot data.jsonl x y - - histogram

# Reference lines
npx ggterm-plot data.csv x y - - point+hline@50+vline@2

# History and export
npx ggterm-plot history
npx ggterm-plot show 2024-01-26-001
npx ggterm-plot export 2024-01-26-001 output.html

# Inspect and suggest
npx ggterm-plot inspect data.csv
npx ggterm-plot suggest data.csv
```

## Testing

```bash
bun test             # Run all tests (~1843 tests)
```

## Claude Code Skills

Seven skills in `.claude/skills/` for AI-assisted data analysis:

| Skill | Purpose |
|-------|---------|
| `data-load` | Load CSV, JSON, JSONL data |
| `ggterm-plot` | Create terminal visualizations |
| `ggterm-history` | Search and retrieve historical plots |
| `ggterm-markdown` | Generate reports with plots |
| `ggterm-publish` | Export plots to PNG/SVG/PDF/HTML |
| `ggterm-customize` | Natural language plot customization |
| `ggterm-style` | Apply publication-quality style presets (Wilke, Tufte, Nature, Economist) |

## Documentation

- `examples/` - AI-forward vignettes using bundled datasets
- `paper/` - bioRxiv preprint draft with figures
- `docs/` - Technical documentation

## Next Steps

1. **Testing** - Share with colleagues for feedback
2. **bioRxiv** - Finalize and submit preprint
3. **JOSS** - Submit for peer review after bioRxiv
