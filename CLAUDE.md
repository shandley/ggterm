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
- 68 geometry types (including specialized visualizations and statistical diagnostics)
- 50+ scales (continuous, discrete, color)
- CLI for plotting CSV/JSON/JSONL files
- Vega-Lite export for publication-quality output
- Plot history with provenance tracking

## Current Status

- **Version**: 0.2.20
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
- `packages/core/src/serve.ts` - Live plot viewer server

## CLI Usage

```bash
# After npm install (use npx):
bun packages/core/src/cli-plot.ts data.csv x y
bun packages/core/src/cli-plot.ts data.json x y color "Title" point
bun packages/core/src/cli-plot.ts data.jsonl x y - - histogram

# Reference lines
bun packages/core/src/cli-plot.ts data.csv x y - - point+hline@50+vline@2

# History and export
bun packages/core/src/cli-plot.ts history
bun packages/core/src/cli-plot.ts show 2024-01-26-001
bun packages/core/src/cli-plot.ts export 2024-01-26-001 output.html

# Live plot viewer (companion panel for Wave terminal or browser)
bun packages/core/src/cli-plot.ts serve          # default port 4242
bun packages/core/src/cli-plot.ts serve 8080     # custom port
# In Wave terminal: wsh web open http://localhost:4242

# Inspect and suggest
bun packages/core/src/cli-plot.ts inspect data.csv
bun packages/core/src/cli-plot.ts suggest data.csv
```

## Testing

```bash
bun test             # Run all tests (~1969 tests)
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

## Live Plot Viewer (`ggterm serve`)

WebSocket-powered companion panel for real-time plot visualization. Watches
`.ggterm/plots/` for new files and auto-pushes interactive Vega-Lite specs to
connected browsers. Designed for use with Wave terminal to create a minimal
data analysis IDE: terminal (Claude Code) + plot viewer.

**Architecture**: `serve.ts` uses `Bun.serve()` for HTTP + WebSocket, `fs.watch()`
on the plots directory, and embeds a dark-themed HTML client with Vega-Lite CDN.
When `savePlotToHistory()` writes a new plot file, the watcher fires, converts the
spec to Vega-Lite, and pushes it to all connected clients.

**Current features**: auto-display of new plots, history panel sidebar (press `h`),
keyboard shortcuts (`h`/`s`/`p`/`f`/`?`/arrows), SVG/PNG export, dark theme,
metadata bar (plot ID, description, timestamp), Wave terminal auto-detection.

### Future Enhancements

1. ~~**Full history panel**~~ — Done (c3bf2bb)
2. ~~**Auto `wsh` detection**~~ — Done (73924e0)
3. **Plot diffing** - Side-by-side comparison mode for iterating on visualizations
4. ~~**Keyboard shortcuts**~~ — Done (c3bf2bb)
5. **Wave widget auto-install** - Write to `~/.waveterm/config/widgets.json` on first run for permanent sidebar button
6. **Plot annotations** - Click to add notes (e.g., "version for paper") saved to history provenance

## Next Steps

1. **Testing** - Share with colleagues for feedback
2. **bioRxiv** - Finalize and submit preprint
3. **JOSS** - Submit for peer review after bioRxiv
