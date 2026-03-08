# ggterm Architecture

## Overview

ggterm implements Leland Wilkinson's Grammar of Graphics as a layered system that transforms data into a backend-agnostic `PlotSpec`. This specification is then consumed by rendering backends — currently terminal ASCII art and Vega-Lite — but the grammar layer has no knowledge of how plots are rendered.

## The Seven Layers

```
┌─────────────────────────────────────────────────────────────┐
│                           Theme                                │
│                    (non-data styling)                          │
├─────────────────────────────────────────────────────────────┤
│                          Facets                                │
│                    (small multiples)                           │
├─────────────────────────────────────────────────────────────┤
│                        Coordinates                              │
│                   (coordinate system)                          │
├─────────────────────────────────────────────────────────────┤
│                          Scales                                │
│               (data domain → visual range)                     │
├─────────────────────────────────────────────────────────────┤
│                        Statistics                               │
│                  (data transformations)                        │
├─────────────────────────────────────────────────────────────┤
│                        Geometries                               │
│                     (visual marks)                             │
├─────────────────────────────────────────────────────────────┤
│                        Aesthetics                               │
│              (variable → visual mapping)                       │
├─────────────────────────────────────────────────────────────┤
│                           Data                                  │
│                     (input dataset)                            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Details

#### 1. Data Layer
The foundation. Accepts arrays of records.

```typescript
interface DataSource {
  records: Record<string, unknown>[]
}
```

#### 2. Aesthetics Layer
Maps data variables to visual properties.

```typescript
interface AestheticMapping {
  x: string          // Required: x-axis variable
  y: string          // Required: y-axis variable
  color?: string     // Point/line color
  fill?: string      // Fill color (bars, areas)
  size?: string      // Point size
  shape?: string     // Point shape
  alpha?: string     // Transparency
  group?: string     // Grouping variable
}
```

#### 3. Geometries Layer
66 geometry types determine the visual representation of data. See [GEOM-REFERENCE.md](./GEOM-REFERENCE.md) for the complete catalog.

| Category | Examples |
|----------|---------|
| Basic | point, line, bar, area, histogram, density, smooth, step, text |
| Distribution | boxplot, violin, ridgeline, beeswarm, ecdf, qq |
| Specialized | heatmap, treemap, sankey, calendar, flame, waffle, upset, dendrogram |
| Scientific | volcano, manhattan, kaplan-meier, forest, roc, bland-altman, ma, biplot |

#### 4. Statistics Layer
Transforms data before rendering.

```typescript
stat_bin({ bins: 30 })              // Histogram binning
stat_smooth({ method: 'loess' })    // Smoothing
stat_density({ kernel: 'gaussian' }) // Density estimation
stat_summary({ fun: 'mean' })       // Group summaries
```

#### 5. Scales Layer
75 scale functions map data domain to visual range.

**Position:** `scale_x_continuous()`, `scale_x_log10()`, `scale_x_discrete()`, `scale_x_datetime()`
**Color:** `scale_color_viridis()`, `scale_color_discrete()`, `scale_color_manual()`
**Other:** `scale_size_continuous()`, `scale_shape_manual()`, `scale_alpha_continuous()`

#### 6. Coordinates Layer

```typescript
coord_cartesian()     // Default: x horizontal, y vertical
coord_flip()          // Swap x and y
coord_polar()         // Polar coordinates
```

#### 7. Facets Layer

```typescript
facet_wrap('variable', { ncol: 3 })
facet_grid({ rows: 'var1', cols: 'var2' })
```

#### 8. Theme Layer
Controls non-data visual elements: panel background, borders, grid, axis text/ticks/titles, legend position, title alignment.

---

## PlotSpec: The Clean Boundary

All seven layers converge into a single specification:

```typescript
interface PlotSpec {
  data: DataSource
  aes: AestheticMapping
  geoms: Geom[]
  stats: Stat[]
  scales: Scale[]
  coord: Coord
  facet?: Facet
  theme: Theme
  labels: Labels
}
```

**Location:** `packages/core/src/types.ts:195-205`

`PlotSpec` is the clean boundary between grammar and rendering. It is:

- **Declarative** — describes *what* to visualize, not *how* to render it
- **JSON-serializable** — can be stored, transmitted, or converted to any format
- **Backend-agnostic** — no terminal codes, no Vega-Lite constructs, no rendering logic

The fluent API (`grammar.ts`) builds a PlotSpec. The `.spec()` method extracts it. The `.render()` method passes it to a backend.

```typescript
const plot = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point())

plot.spec()    // → PlotSpec (pure data)
plot.render()  // → PlotSpec → Terminal Backend → ANSI string
```

---

## Rendering Backends

```
                    PlotSpec
                   (types.ts)
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
  ┌─────────────────┐    ┌─────────────────┐
  │    Terminal      │    │   Vega-Lite     │
  │    Backend       │    │    Backend      │
  │  pipeline.ts     │    │  vega-lite.ts   │
  │                  │    │                 │
  │  PlotSpec →      │    │  PlotSpec →     │
  │  Stats →         │    │  Mark mapping → │
  │  Scales →        │    │  Encoding →     │
  │  Canvas →        │    │  VegaLiteSpec → │
  │  ANSI string     │    │  JSON / HTML    │
  └─────────────────┘    └─────────────────┘
```

### Backend: Terminal Renderer

**Location:** `packages/core/src/pipeline/pipeline.ts`

Transforms a `PlotSpec` into ANSI-colored terminal output:

1. **Stat transforms** — apply binning, density, smoothing to data
2. **Scale computation** — map data values to canvas positions
3. **Geometry rendering** — each geom writes to an abstract `Canvas` buffer
4. **Canvas output** — convert cell buffer to ANSI escape sequences

The canvas is a 2D grid of cells:

```typescript
interface CanvasCell {
  char: string           // Character to display
  fg: RGBA              // Foreground color (24-bit truecolor)
  bg: RGBA              // Background color
  attrs: CellAttributes  // Bold, italic, etc.
}
```

Resolution is enhanced using Unicode braille patterns (U+2800-U+28FF), where each character cell is a 2x4 dot matrix — an 80x24 terminal becomes 160x96 effective dots.

### Backend: Vega-Lite Exporter

**Location:** `packages/core/src/export/vega-lite.ts`

Converts a `PlotSpec` to a [Vega-Lite](https://vega.github.io/vega-lite/) JSON specification:

1. **Mark mapping** — geom types → Vega-Lite mark types (point, line, bar, etc.)
2. **Encoding** — aesthetic mappings → Vega-Lite encoding channels
3. **Field type inference** — introspect data to determine quantitative/nominal/temporal
4. **Multi-layer support** — multiple geoms → layered Vega-Lite spec
5. **Faceting** — facet specs → Vega-Lite facet/repeat

The Vega-Lite spec is used by:
- **Live viewer** (`serve.ts`) — SSE-powered browser panel that auto-displays new plots
- **HTML export** — standalone HTML files with embedded Vega-Embed
- **Publication pipeline** — PNG/SVG/PDF via `vl2png`/`vl2svg`/`vl2pdf`
- **Style/customize skills** — modify the Vega-Lite config without re-running the grammar

---

## Adding a New Backend

A new backend is a function that consumes `PlotSpec` and produces output in a target format:

```typescript
import { PlotSpec } from './types'

function renderToSVG(spec: PlotSpec, options: RenderOptions): string {
  // 1. Apply stat transforms (reusable from pipeline)
  // 2. Build scale contexts (reusable from pipeline)
  // 3. Map geoms to SVG primitives (backend-specific)
  // 4. Assemble SVG document
  return svgString
}
```

The stat computation and scale building logic in `pipeline.ts` can be reused. Only the final mark rendering step is backend-specific.

Reference implementations:
- `pipeline/pipeline.ts` — terminal backend (~500 lines)
- `export/vega-lite.ts` — Vega-Lite backend (~400 lines)

---

## Color System (Terminal Backend)

The terminal backend supports multiple color capability levels:

| Level | Colors | Detection |
|-------|--------|-----------|
| None | Monochrome | No `TERM` variable |
| Basic | 16 ANSI | `TERM` set |
| Extended | 256 | `TERM` includes `256color` |
| TrueColor | 16.7M | `COLORTERM=truecolor` |

Built-in color palettes optimized for terminal rendering:

- **Sequential**: viridis, plasma, inferno, magma
- **Diverging**: RdBu, BrBG, PiYG
- **Categorical**: category10, Set1, Set2, Dark2

---

## File Structure

```
packages/
└── core/
    └── src/
        ├── types.ts           # PlotSpec and all core interfaces
        ├── grammar.ts         # gg() fluent builder API
        ├── geoms/             # 66 geometry implementations
        ├── scales/            # 75 scale implementations
        ├── stats/             # Statistical transforms
        ├── coords/            # Coordinate systems
        ├── facets/            # Faceting (wrap, grid)
        ├── themes/            # Theme definitions
        ├── pipeline/          # Terminal rendering backend
        │   └── pipeline.ts    # PlotSpec → Canvas → ANSI
        ├── export/            # Vega-Lite backend
        │   └── vega-lite.ts   # PlotSpec → VegaLiteSpec
        ├── canvas/            # Abstract canvas buffer
        ├── history/           # Plot history with provenance
        ├── cli-plot.ts        # CLI tool (npx ggterm-plot)
        ├── cli.ts             # Interactive REPL (npx ggterm)
        ├── serve.ts           # Live viewer server (SSE)
        └── init.ts            # Skill/project installer
```

---

## History and Provenance

Every plot is saved with provenance metadata:

```typescript
interface HistoricalPlot {
  _provenance: {
    id: string            // e.g., "2026-03-07-001"
    timestamp: string
    dataFile: string
    command: string
    description: string
    geomTypes: string[]
    aesthetics: string[]
  }
  spec: PlotSpec
}
```

Stored as JSON in `.ggterm/plots/` with an append-only index in `.ggterm/history.jsonl`. The raw `PlotSpec` is preserved — plots can be re-rendered with any backend at any time.
