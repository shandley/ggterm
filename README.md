# ggterm

A Grammar of Graphics for Terminal User Interfaces.

**ggterm** is a TypeScript library implementing Leland Wilkinson's Grammar of Graphics for terminal-based rendering. Designed to integrate with [OpenTUI](https://github.com/sst/opentui), it enables declarative, publication-aware data visualization directly in the terminal.

## Why ggterm?

Current terminal plotting tools are either:
- **Imperative** (plotext, bashplotlib) — require manual coordinate management
- **Low-level** (direct curses/ncurses) — no abstraction for statistical graphics
- **Output-only** (gnuplot to ASCII) — no interactivity or reactive updates

ggterm provides:
- Declarative specification of visual mappings
- Composable layers that build complex plots incrementally
- Automatic handling of scales, legends, and axes
- Familiar API for R/Python users (ggplot2, plotnine)
- Native OpenTUI integration for reactive terminal UIs

## Quick Example

```typescript
import { gg, geom_point, scale_color_viridis } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'pc1', y: 'pc2', color: 'group' })
  .geom(geom_point({ size: 2 }))
  .scale(scale_color_viridis())
  .labs({
    title: 'PCA Analysis',
    x: 'PC1 (45%)',
    y: 'PC2 (23%)'
  })

// Render to string
console.log(plot.render({ width: 80, height: 24 }))
```

## OpenTUI Integration

```tsx
import { GGTerm } from '@ggterm/opentui'

function Dashboard({ data }) {
  return (
    <box flexDirection="row">
      <GGTerm
        data={data}
        aes={{ x: 'time', y: 'value', color: 'series' }}
        geoms={[geom_line()]}
        width="50%"
        height={20}
      />
    </box>
  )
}
```

## Interactive REPL

Explore data and build plots interactively:

```bash
npx ggterm
```

```
ggterm> .data sample 30
Generated 30 sample rows with columns: x, y, group, size

ggterm> gg(data).aes({x: "x", y: "y", color: "group"}).geom(geom_point())

  My First Plot
  40 ┤                                    ●
     │                        ●       ●
  30 ┤    ●   ●       ●   ●       ●
     │        ●   ●           ●       ●
  20 ┤●           ●   ●   ●
     │    ●           ●
  10 ┤
     └────────────────────────────────────
      0    5    10   15   20   25   30
```

## Features

- **Interactive REPL**: Build plots interactively with `npx ggterm`
- **Multiple Renderers**: Braille (high-res), Block (compatible), Sixel/Kitty (pixel-perfect)
- **Grammar Layers**: Data, Aesthetics, Geometries, Statistics, Scales, Coordinates, Facets, Themes
- **Streaming Data**: Real-time updates with `plot.push(newData)`
- **Terminal Detection**: Automatic color capability detection and graceful degradation
- **Framework Support**: React, Solid.js components and reactive primitives

## Packages

| Package | Description |
|---------|-------------|
| `@ggterm/core` | Grammar engine, scales, statistics |
| `@ggterm/solid` | Solid.js components and primitives |
| `@ggterm/render-braille` | Braille dot matrix renderer (2x4 per cell) |
| `@ggterm/render-block` | Block character renderer (universal compatibility) |
| `@ggterm/render-sixel` | Sixel/Kitty graphics protocol renderer |
| `@ggterm/opentui` | OpenTUI/React integration components |

## Installation

```bash
bun add @ggterm/core @ggterm/opentui
```

## Documentation

- [Quick Start](./docs/QUICKSTART.md) - Get started in 5 minutes
- [Interactive REPL](./docs/REPL.md) - Interactive plotting guide
- [Gallery](./docs/GALLERY.md) - Visual examples of all plot types
- [API Reference](./docs/API.md) - Full API documentation
- [Architecture](./docs/ARCHITECTURE.md) - Technical design
- [Roadmap](./docs/ROADMAP.md) - Development phases

### Migration Guides

- [From ggplot2](./docs/MIGRATION-GGPLOT2.md) - For R users
- [From Vega-Lite](./docs/MIGRATION-VEGALITE.md) - For Vega-Lite users

### Contributing

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## Prior Art

- [ggplot2](https://ggplot2.tidyverse.org/) (R) - The original grammar of graphics
- [Vega-Lite](https://vega.github.io/vega-lite/) - JSON grammar for web
- [OpenTUI](https://github.com/sst/opentui) - Terminal UI framework
- [plotext](https://github.com/piccolomo/plotext) (Python) - Terminal plotting

## License

MIT
