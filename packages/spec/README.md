# @ggterm/spec

The declarative core of [ggterm](https://github.com/shandley/ggterm), extracted as a standalone package with no runtime dependencies and no terminal rendering.

It contains:

- **`PlotSpec` types** (`types.ts`): the JSON-serializable plot specification (data, aesthetics, geoms, stats, scales, coord, facet, theme, labels)
- **Geometry builders** (`geoms/`): 66 `geom_*` functions that construct `Geom` objects, including domain-specific types (volcano, Kaplan-Meier, Manhattan, forest, ROC, Bland-Altman, UpSet)
- **Position adjustments** (`positions/`): dodge, stack, fill, jitter
- **Annotation helpers** (`annotations.ts`)
- **Vega-Lite converter** (`export/`): `plotSpecToVegaLite()` turns a `PlotSpec` into a Vega-Lite specification for interactive rendering or PNG/SVG/PDF export

```typescript
import { geom_point, plotSpecToVegaLite, type PlotSpec } from '@ggterm/spec'
```

`@ggterm/core` builds on this package and adds the terminal renderer, fluent `gg()` API, CLI, and live viewer. Use `@ggterm/spec` directly when you want to generate or transform plot specifications (for example, from an AI agent or another tool) without pulling in terminal rendering.

## Known limitations

- A few statistics (Kaplan-Meier estimation, volcano significance classification) are computed independently here and in the terminal backend in `@ggterm/core`. If you change one, check the other.
- `geom_volcano` accepts a `classify` function in `params`, which is not JSON-serializable; use the threshold parameters instead when the spec must round-trip through JSON.
- The package currently ships TypeScript source (`exports` point at `src/`). In-repo workspace consumers and bundlers handle this; publishing to npm for plain Node consumers would need a build step producing `dist/`.
