# ggterm

Grammar of Graphics primitive catalog with terminal and Vega-Lite backends.

## Quick Start

```bash
bun install          # Install dependencies
bun run build        # Build
bun test             # Run all tests
bun run examples/demo.ts  # Run demo
```

## Architecture

Single package: `@ggterm/core` in `packages/core/`

### Three Layers

```
Layer 3: AI Integration — 8 Claude Code skills, natural language workflows
Layer 2: Backends & Tooling — Terminal renderer, Vega-Lite exporter, live viewer, CLI, history
Layer 1: Grammar & Primitives — PlotSpec, 66 geoms, 75 scales, stats, coords, facets, themes
```

The clean boundary is `PlotSpec` (`packages/core/src/types.ts:195-205`). Everything in Layer 1 produces a PlotSpec. Everything in Layer 2 consumes one.

### Contains

- **Layer 1**: Grammar engine with fluent API, 66 geometry types, 75 scales, stats, coords, facets, themes
- **Layer 2**: Terminal ASCII renderer, Vega-Lite export backend, CLI, live viewer, plot history with automatic metadata
- **Layer 3**: 8 Claude Code skills for AI-assisted data analysis workflows

## Current Status

- **Version**: 0.3.10
- **npm**: https://www.npmjs.com/package/@ggterm/core
- **Repo**: https://github.com/shandley/ggterm (public)

## Bundled Datasets

Built-in datasets work by name in the CLI — no CSV files needed:

```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot mtcars mpg hp cyl "Cars" point
```

| Dataset | Rows | Columns |
|---------|------|---------|
| `iris` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| `mtcars` | 16 | mpg, cyl, hp, wt, name |

Also available via programmatic API:
```bash
.data iris     # 150 rows
.data mtcars   # 16 rows
.data sample N # N random rows: x, y, group, size
```

## Key Files

- `packages/core/src/types.ts` - PlotSpec interface (the clean boundary)
- `packages/core/src/grammar.ts` - GGPlot fluent API
- `packages/core/src/geoms/` - 66 geometry implementations
- `packages/core/src/scales/` - 75 scale implementations
- `packages/core/src/pipeline/pipeline.ts` - Terminal rendering backend
- `packages/core/src/export/vega-lite.ts` - Vega-Lite export backend
- `packages/core/src/cli-plot.ts` - CLI tool
- `packages/core/src/serve.ts` - Live plot viewer server

## CLI Usage

```bash
# Quick start (new projects):
npx ggterm-plot setup             # init + welcome plot + open browser + serve

# Using npx (after npm install @ggterm/core):
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot data.csv x y color "Title" point
npx ggterm-plot data.json x y - - histogram

# Reference lines
npx ggterm-plot data.csv x y - - point+hline@50+vline@2

# History and export
npx ggterm-plot history
npx ggterm-plot show 2024-01-26-001
npx ggterm-plot export 2024-01-26-001 output.html

# Live plot viewer (companion panel for Wave terminal or browser)
npx ggterm-plot serve          # default port 4242 (auto-inits skills)
npx ggterm-plot serve 8080     # custom port

# Initialize skills for Claude Code (also run automatically by serve/setup)
npx ggterm-plot init

# Inspect and suggest
npx ggterm-plot inspect data.csv
npx ggterm-plot suggest data.csv

# Development (using bun directly):
bun packages/core/src/cli-plot.ts data.csv x y
```

## End-User Setup (Fresh Directory)

```bash
mkdir my-analysis && cd my-analysis
npx ggterm-plot setup   # Init skills, welcome plot, open browser, start server
```

Or step-by-step:
```bash
npm init -y
npm install @ggterm/core
npx ggterm-plot init    # Install skills + CLAUDE.md + .gitignore
npx ggterm-plot serve   # Start live viewer (port 4242, auto-inits if needed)
```

## Testing

```bash
bun test             # Run all tests (2158 tests)
```

## Claude Code Skills

Eight skills in `.claude/skills/` for AI-assisted data analysis:

| Skill | Purpose |
|-------|---------|
| `data-load` | Load CSV, JSON, JSONL data |
| `ggterm-plot` | Create terminal visualizations |
| `ggterm-history` | Search and retrieve historical plots |
| `ggterm-markdown` | Generate reports with plots |
| `ggterm-publish` | Export plots to PNG/SVG/PDF/HTML |
| `ggterm-customize` | Natural language plot customization |
| `ggterm-style` | Apply publication-quality style presets (Wilke, Tufte, Nature, Economist) |
| `ggterm-help` | Quick reference for capabilities, geom types, shortcuts |

## Documentation

- `examples/` - AI-forward vignettes using bundled datasets
- `paper/` - bioRxiv preprint draft with figures
- `docs/` - Technical documentation

## Live Plot Viewer (`ggterm serve`)

SSE-powered companion panel for real-time plot visualization. Creates a minimal
data analysis IDE: terminal (Claude Code) + live plot viewer (Wave panel or browser).

**Architecture**: `serve.ts` uses `node:http` + Server-Sent Events, `fs.watch()`
on `.ggterm/plots/` (new plots) and `.ggterm/last-plot-vegalite.json` (style changes).
Embeds a dark-themed HTML client with Vega-Lite CDN rendering. Node.js compatible
(works with `npx`).

**Features**:
- Auto-display of new plots via SSE push
- Style/customize changes auto-update in viewer (watches `last-plot-vegalite.json`)
- History panel sidebar (press `h`)
- Keyboard shortcuts (`h`/`s`/`p`/`f`/`?`/arrows)
- SVG/PNG export from viewer
- ResizeObserver for responsive plot reflow
- Plot ID deduplication to prevent duplicate history entries
- Wave terminal auto-detection (`wsh web open`)
- EADDRINUSE friendly error with kill command

**Style/Customize workflow**: Skills edit `.ggterm/last-plot-vegalite.json` (Vega-Lite
config). The serve watcher detects the change and pushes an `update` SSE message
that replaces the current plot in-place (no new history entry). Skills must NEVER
edit `.ggterm/last-plot.json` (ggterm terminal format — changes won't appear in viewer).

### Future Enhancements

1. **Plot diffing** - Side-by-side comparison mode for iterating on visualizations
2. **Wave widget auto-install** - Write to `~/.waveterm/config/widgets.json` for permanent sidebar button
3. **Plot annotations** - Click to add notes saved to history provenance

## `npx ggterm-plot setup` (Recommended for New Users)

One-command onboarding: runs `init`, generates a welcome plot (iris scatter),
opens the browser, and starts the live viewer. Ideal for new projects.

## `npx ggterm-plot init`

Generates `.claude/skills/` (8 skills), `CLAUDE.md`, and `.gitignore` in the
current directory. CLAUDE.md is read by Claude Code at conversation start, ensuring
immediate awareness of built-in datasets and plotting commands. Skills are lazy-loaded
on demand. Safe to re-run — only overwrites ggterm-generated files. Also run
automatically by `serve` and `setup`.

## Next Steps

1. **Testing** - Share with colleagues for feedback
2. **bioRxiv** - Finalize and submit preprint
3. **JOSS** - Submit for peer review after bioRxiv
