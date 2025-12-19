# @ggterm/solid

Solid.js integration for ggterm - Grammar of Graphics for terminals.

## Installation

```bash
npm install @ggterm/solid @ggterm/core solid-js
```

## Quick Start

### Using the GGTerm Component

```tsx
import { createSignal } from 'solid-js'
import { GGTerm } from '@ggterm/solid'
import { geom_point, geom_line } from '@ggterm/core'

function MyChart() {
  const [data] = createSignal([
    { x: 1, y: 10 },
    { x: 2, y: 25 },
    { x: 3, y: 18 },
    { x: 4, y: 35 },
    { x: 5, y: 28 }
  ])

  return (
    <GGTerm
      data={data()}
      aes={{ x: 'x', y: 'y' }}
      geoms={[geom_line(), geom_point()]}
      width={60}
      height={20}
    />
  )
}
```

### Using Primitives for More Control

```tsx
import { createGGTerm, createPlotData } from '@ggterm/solid'
import { geom_line, geom_point } from '@ggterm/core'

function StreamingChart() {
  // Create reactive data store with windowing
  const plotData = createPlotData({
    maxPoints: 100,
    timeWindowMs: 60000  // 1 minute window
  })

  // Create reactive plot
  const plot = createGGTerm({
    data: plotData.windowedData(),
    aes: { x: 'time', y: 'value' },
    geoms: [geom_line(), geom_point()],
    options: { width: 80, height: 24 }
  })

  // Stream data
  setInterval(() => {
    plotData.push({
      time: Date.now(),
      value: Math.random() * 100
    })
  }, 100)

  return <pre>{plot.rendered()}</pre>
}
```

## API Reference

### Components

#### `<GGTerm>`

The main component for rendering ggterm plots.

```tsx
interface GGTermProps {
  // Data & Grammar
  data: DataSource | Accessor<DataSource>
  aes: AestheticMapping
  geoms?: Geom[]
  scales?: Scale[]
  coord?: Coord
  facet?: Facet
  theme?: Theme | Partial<Theme>
  labs?: Labels

  // Render options
  width?: number      // Default: 70
  height?: number     // Default: 20
  renderer?: 'braille' | 'block' | 'sixel' | 'auto'
  colorMode?: 'none' | '16' | '256' | 'truecolor' | 'auto'

  // Event handlers
  onHover?: (index: number, record: DataRecord | null) => void
  onClick?: (index: number, record: DataRecord) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onRender?: (rendered: string) => void

  // Ref for imperative access
  ref?: (handle: GGTermHandle) => void
}
```

### Primitives

#### `createGGTerm(props)`

Creates a reactive plot manager with automatic re-rendering.

```tsx
const plot = createGGTerm({
  data: myData,
  aes: { x: 'x', y: 'y', color: 'group' },
  geoms: [geom_point()],
  options: { width: 80, height: 24 }
})

// Reactive state
plot.rendered()        // Current rendered output
plot.data()           // Current data
plot.isRendering()    // Render in progress
plot.renderCount()    // Total renders

// Actions
plot.setData(newData)
plot.pushData(record)
plot.clearData()
plot.refresh()
```

#### `createPlotData(options)`

Creates a reactive data store with windowing and limiting.

```tsx
const plotData = createPlotData({
  maxPoints: 100,           // Keep last 100 points
  timeWindowMs: 60000,      // 1 minute window
  timeField: 'timestamp',   // Field for time filtering
  initialData: []
})

// Reactive state
plotData.data()           // All data
plotData.windowedData()   // Filtered/windowed data
plotData.count()          // Point count
plotData.isDirty()        // Changed since last mark

// Actions
plotData.setData(data)
plotData.push(record)
plotData.updateAt(index, updates)
plotData.removeWhere(predicate)
plotData.clear()
plotData.markClean()
```

#### `createPlotInteraction(options)`

Creates a reactive interaction manager for selection, hover, and zoom.

```tsx
const interaction = createPlotInteraction({
  selectionMode: 'multiple',  // 'none' | 'single' | 'multiple' | 'brush'
  enableZoom: true,
  enableKeyboard: true,
  onSelectionChange: (indices) => console.log('Selected:', indices)
})

// Reactive state
interaction.hoveredIndex()
interaction.selectedIndices()
interaction.viewport()
interaction.isFocused()

// Actions
interaction.select(index)
interaction.toggleSelect(index)
interaction.clearSelection()
interaction.zoom(factor)
interaction.pan(dx, dy)
interaction.handleKeyDown(event)
```

## Examples

### Colored Scatter Plot

```tsx
import { GGTerm } from '@ggterm/solid'
import { geom_point, scale_color_viridis } from '@ggterm/core'

function ScatterPlot() {
  const data = [
    { x: 1, y: 10, group: 'A' },
    { x: 2, y: 25, group: 'B' },
    { x: 3, y: 18, group: 'A' },
    { x: 4, y: 35, group: 'B' }
  ]

  return (
    <GGTerm
      data={data}
      aes={{ x: 'x', y: 'y', color: 'group' }}
      geoms={[geom_point()]}
      scales={[scale_color_viridis()]}
      labs={{ title: 'Scatter Plot', x: 'X Value', y: 'Y Value' }}
    />
  )
}
```

### Real-Time Dashboard

```tsx
import { createSignal, onCleanup } from 'solid-js'
import { createGGTerm, createPlotData } from '@ggterm/solid'
import { geom_line, geom_point, themeDark } from '@ggterm/core'

function Dashboard() {
  const metrics = createPlotData({ maxPoints: 50 })

  const cpuPlot = createGGTerm({
    data: metrics.windowedData(),
    aes: { x: 'time', y: 'cpu' },
    geoms: [geom_line(), geom_point()],
    theme: themeDark(),
    labs: { title: 'CPU Usage' },
    options: { width: 60, height: 15 }
  })

  // Simulate metrics
  const interval = setInterval(() => {
    metrics.push({
      time: Date.now(),
      cpu: 30 + Math.random() * 40
    })
  }, 500)

  onCleanup(() => clearInterval(interval))

  return (
    <div>
      <pre>{cpuPlot.rendered()}</pre>
      <p>Points: {metrics.count()}</p>
    </div>
  )
}
```

### Faceted Plot

```tsx
import { GGTerm } from '@ggterm/solid'
import { geom_point, facet_wrap } from '@ggterm/core'

function FacetedPlot() {
  const data = [
    { x: 1, y: 10, category: 'A' },
    { x: 2, y: 20, category: 'A' },
    { x: 1, y: 15, category: 'B' },
    { x: 2, y: 25, category: 'B' }
  ]

  return (
    <GGTerm
      data={data}
      aes={{ x: 'x', y: 'y' }}
      geoms={[geom_point()]}
      facet={facet_wrap('category', { ncol: 2 })}
      width={80}
      height={20}
    />
  )
}
```

## TypeScript Support

Full TypeScript support with type inference:

```tsx
import type { GGTermProps, GGTermHandle, CreateGGTermProps } from '@ggterm/solid'
import type { DataSource, AestheticMapping } from '@ggterm/core'

// Type-safe props
const props: GGTermProps = {
  data: myData,
  aes: { x: 'time', y: 'value' },
  geoms: [geom_line()]
}

// Type-safe handle
let handle: GGTermHandle
<GGTerm {...props} ref={(h) => handle = h} />
```

## See Also

- [@ggterm/core](../core/README.md) - Core grammar engine
- [API Reference](../../docs/API.md) - Full API documentation
- [Gallery](../../docs/GALLERY.md) - Visual examples
