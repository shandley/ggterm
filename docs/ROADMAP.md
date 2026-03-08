# ggterm Roadmap

## Vision

ggterm is a comprehensive Grammar of Graphics primitive catalog for programmatic data visualization. The durable core is the grammar specification (`PlotSpec`) — a backend-agnostic, JSON-serializable intermediate representation that any rendering system can consume. Renderers and tooling are pluggable layers built on top.

## What Has Been Built

### Layer 1: Grammar & Primitives

- [x] `PlotSpec` — clean, declarative, JSON-serializable specification (`types.ts`)
- [x] `gg()` fluent builder API with `.aes()`, `.geom()`, `.scale()`, `.coord()`, `.facet()`, `.theme()`, `.labs()`
- [x] 65 geometry types across 4 categories:
  - Basic: point, line, bar, area, histogram, density, smooth, step, segment, text, rug
  - Distribution: boxplot, violin, ridgeline, beeswarm, ecdf, qq
  - Specialized: heatmap, treemap, sankey, calendar, flame, waffle, upset, dendrogram, corrmat, contour, sparkline, lollipop, dumbbell, bullet
  - Scientific: volcano, manhattan, kaplan-meier, forest, roc, bland-altman, ma, biplot, scree, funnel, control
- [x] 73 scale functions (continuous, discrete, log, sqrt, reverse, datetime, color, size, shape, alpha, manual)
- [x] Statistical transforms (bin, density, smooth, summary, boxplot, beeswarm, QQ)
- [x] Coordinate systems (cartesian, flip, polar)
- [x] Faceting (wrap, grid, free scales, labellers)
- [x] Theme system

### Layer 2: Backends & Tooling

- [x] Terminal ASCII renderer (braille + block characters, ANSI truecolor)
- [x] Vega-Lite export backend (`PlotSpec` → Vega-Lite JSON)
- [x] CLI tool (`npx ggterm-plot`) with `setup`, `serve`, `init`, `inspect`, `suggest`, `history`, `export`
- [x] Interactive REPL (`npx ggterm`)
- [x] Live plot viewer — SSE-powered browser panel with history sidebar, keyboard shortcuts, SVG/PNG export
- [x] Plot history with provenance tracking (`.ggterm/plots/`, `.ggterm/history.jsonl`)
- [x] HTML export with embedded Vega-Embed
- [x] Publication style presets (Wilke, Tufte, Nature, Economist, Minimal, APA)
- [x] Built-in datasets (iris, mtcars, sample generator)
- [x] One-command onboarding (`npx ggterm-plot setup`)

### Layer 3: AI Integration

- [x] 8 Claude Code skills (data-load, ggterm-plot, ggterm-history, ggterm-publish, ggterm-customize, ggterm-style, ggterm-markdown, ggterm-help)
- [x] Skill installer (`npx ggterm-plot init`)
- [x] Generated project CLAUDE.md for Claude Code context
- [x] Welcome plot for new projects
- [x] AI-forward example vignettes (4 complete workflows)

### Quality & Publishing

- [x] 2158 tests passing
- [x] npm published at `@ggterm/core@0.3.10`
- [x] Public GitHub repository
- [x] API documentation, quickstart, migration guides
- [x] bioRxiv preprint draft with figures

## Current Focus

1. **Documentation alignment** — Ensuring docs reflect the primitives-first architecture
2. **Academic publication** — Finalize bioRxiv preprint, prepare JOSS submission
3. **User testing** — Share with colleagues for feedback on workflows

## Future Directions

### Additional Backends
- SVG-native renderer (direct SVG without Vega-Lite intermediary)
- Canvas2D renderer (for web embedding)
- WebGL renderer (for large dataset visualization)

### Data & Performance
- Arrow/Parquet data source support
- Large dataset optimization (>100k points: binning, sampling, LOD)
- Streaming data refinement

### Viewer Enhancements
- Plot diffing / side-by-side comparison mode
- Interactive click-to-annotate saved to provenance
- Wave terminal widget auto-install (`~/.waveterm/config/widgets.json`)

### Ecosystem
- Additional built-in datasets (penguins, gapminder, diamonds)
- CITATION.cff for academic use
- Gallery of plot type examples

## Design Principles

1. **Specification-first** — `PlotSpec` is the durable core; renderers are replaceable consumers
2. **Familiar API** — ggplot2 users feel at home with the fluent builder pattern
3. **AI-composable** — Declarative spec is ideal for programmatic construction by AI agents
4. **Two backends, one spec** — Terminal for speed, Vega-Lite for quality
5. **Type-safe** — Full TypeScript with strict mode and comprehensive type definitions
