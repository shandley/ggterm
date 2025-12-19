# @ggterm/vue

Vue 3 integration for ggterm - Grammar of Graphics for terminals.

## Installation

```bash
npm install @ggterm/vue @ggterm/core vue
```

## Quick Start

### Using the GGTerm Component

```vue
<script setup>
import { ref } from 'vue'
import { GGTerm } from '@ggterm/vue'
import { geom_point, geom_line } from '@ggterm/core'

const data = ref([
  { x: 1, y: 10 },
  { x: 2, y: 25 },
  { x: 3, y: 18 },
  { x: 4, y: 35 },
  { x: 5, y: 28 }
])
</script>

<template>
  <GGTerm
    :data="data"
    :aes="{ x: 'x', y: 'y' }"
    :geoms="[geom_line(), geom_point()]"
    :width="60"
    :height="20"
  />
</template>
```

### Using Composables for More Control

```vue
<script setup>
import { onUnmounted } from 'vue'
import { useGGTerm, usePlotData } from '@ggterm/vue'
import { geom_line, geom_point } from '@ggterm/core'

// Create data store with windowing
const plotData = usePlotData({
  maxPoints: 100,
  timeWindowMs: 60000
})

// Create plot manager
const { rendered, setData } = useGGTerm({
  aes: { x: 'time', y: 'value' },
  geoms: [geom_line(), geom_point()],
  width: 80,
  height: 24
})

// Stream data
const interval = setInterval(() => {
  plotData.push({
    time: Date.now(),
    value: Math.random() * 100
  })
  setData(plotData.windowed.value)
}, 100)

onUnmounted(() => clearInterval(interval))
</script>

<template>
  <pre>{{ rendered }}</pre>
  <p>Points: {{ plotData.count.value }}</p>
</template>
```

## API Reference

### Components

#### `<GGTerm>`

The main component for rendering ggterm plots.

```vue
<GGTerm
  :data="DataSource"
  :aes="AestheticMapping"
  :geoms="Geom[]"
  :scales="Scale[]"
  :coord="Coord"
  :facet="Facet"
  :theme="Theme"
  :labs="Labels"
  :width="number"
  :height="number"
  :renderer="'braille' | 'block' | 'sixel' | 'auto'"
  :colorMode="'none' | '16' | '256' | 'truecolor' | 'auto'"
  @render="handleRender"
  @hover="handleHover"
  @click="handleClick"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataSource` | `[]` | Data array |
| `aes` | `AestheticMapping` | required | Aesthetic mapping |
| `geoms` | `Geom[]` | `[]` | Geometry layers |
| `scales` | `Scale[]` | `[]` | Scale definitions |
| `coord` | `Coord` | - | Coordinate system |
| `facet` | `Facet` | - | Faceting spec |
| `theme` | `Theme` | - | Theme config |
| `labs` | `Labels` | - | Plot labels |
| `width` | `number` | `70` | Width in chars |
| `height` | `number` | `20` | Height in chars |
| `renderer` | `string` | `'auto'` | Renderer type |
| `colorMode` | `string` | `'auto'` | Color mode |

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `render` | `string` | Rendered output |
| `hover` | `{ index, record }` | Point hovered |
| `click` | `{ index, record }` | Point clicked |

**Exposed Methods:**

```vue
<script setup>
import { ref } from 'vue'
import { GGTerm } from '@ggterm/vue'

const ggterm = ref()

function handleRefresh() {
  ggterm.value.refresh()
}

function handleGetOutput() {
  console.log(ggterm.value.getRendered())
}
</script>

<template>
  <GGTerm ref="ggterm" ... />
</template>
```

### Composables

#### `useGGTerm(options)`

Creates a reactive plot manager.

```typescript
const {
  // Reactive refs
  rendered,      // Ref<string>
  data,          // Ref<DataSource>
  isRendering,   // Ref<boolean>
  renderCount,   // Ref<number>
  plot,          // ComputedRef<GGPlot | null>

  // Methods
  setData,       // (data: DataSource) => void
  pushData,      // (record) => void
  clearData,     // () => void
  refresh,       // () => void
  setOptions,    // (options) => void
} = useGGTerm({
  data: DataSource,           // Initial data (or Ref)
  aes: AestheticMapping,      // Required
  geoms: Geom[],
  scales: Scale[],
  coord: Coord,
  facet: Facet,
  theme: Theme,
  labs: Labels,
  width: number,              // Default: 70
  height: number,             // Default: 20
  renderer: string,           // Default: 'auto'
  colorMode: string,          // Default: 'auto'
  debounceMs: number,         // Default: 16
  autoRender: boolean         // Default: true
})
```

#### `usePlotData(options)`

Creates a reactive data store with windowing.

```typescript
const {
  // Reactive refs
  data,          // Ref<DataSource>
  windowed,      // ComputedRef<DataSource>
  count,         // ComputedRef<number>
  isDirty,       // Ref<boolean>

  // Methods
  set,           // (data: DataSource) => void
  push,          // (record) => void
  updateAt,      // (index, updates) => void
  removeWhere,   // (predicate) => void
  clear,         // () => void
  markClean,     // () => void
  applyTimeWindow,
  applyMaxPoints,
} = usePlotData({
  maxPoints: 100,           // Max points to keep
  timeWindowMs: 60000,      // Time window in ms
  timeField: 'time',        // Field for time filtering
  initialData: []           // Initial data
})
```

#### `usePlotInteraction(options)`

Creates a reactive interaction manager.

```typescript
const {
  // Reactive refs
  hoveredIndex,     // Ref<number>
  selectedIndices,  // Ref<number[]>
  viewport,         // Ref<Viewport | null>
  brush,            // Ref<BrushRect | null>
  isFocused,        // Ref<boolean>
  selectionMode,    // Ref<SelectionMode>

  // Methods
  setHovered,
  clearHover,
  select,
  toggleSelect,
  setSelected,
  clearSelection,
  setViewport,
  resetViewport,
  zoom,
  pan,
  startBrush,
  updateBrush,
  endBrush,
  cancelBrush,
  handleKeyDown,
} = usePlotInteraction({
  selectionMode: 'multiple',  // 'none' | 'single' | 'multiple' | 'brush'
  enableZoom: true,
  enableKeyboard: true,
  initialViewport: { xMin, xMax, yMin, yMax },
  onSelectionChange: (indices) => {},
  onViewportChange: (viewport) => {},
  onBrushEnd: (rect, indices) => {}
})
```

## Examples

### Colored Scatter Plot

```vue
<script setup>
import { GGTerm } from '@ggterm/vue'
import { geom_point, scale_color_viridis } from '@ggterm/core'

const data = [
  { x: 1, y: 10, group: 'A' },
  { x: 2, y: 25, group: 'B' },
  { x: 3, y: 18, group: 'A' },
  { x: 4, y: 35, group: 'B' }
]
</script>

<template>
  <GGTerm
    :data="data"
    :aes="{ x: 'x', y: 'y', color: 'group' }"
    :geoms="[geom_point()]"
    :scales="[scale_color_viridis()]"
    :labs="{ title: 'Scatter Plot', x: 'X Value', y: 'Y Value' }"
  />
</template>
```

### Real-Time Dashboard

```vue
<script setup>
import { onUnmounted } from 'vue'
import { usePlotData, useGGTerm } from '@ggterm/vue'
import { geom_line, geom_point, themeDark } from '@ggterm/core'

const metrics = usePlotData({ maxPoints: 50 })

const { rendered, setData } = useGGTerm({
  aes: { x: 'time', y: 'cpu' },
  geoms: [geom_line(), geom_point()],
  theme: themeDark(),
  labs: { title: 'CPU Usage' },
  width: 60,
  height: 15
})

const interval = setInterval(() => {
  metrics.push({
    time: Date.now(),
    cpu: 30 + Math.random() * 40
  })
  setData(metrics.windowed.value)
}, 500)

onUnmounted(() => clearInterval(interval))
</script>

<template>
  <div>
    <pre>{{ rendered }}</pre>
    <p>Points: {{ metrics.count.value }}</p>
  </div>
</template>
```

### Faceted Plot

```vue
<script setup>
import { GGTerm } from '@ggterm/vue'
import { geom_point, facet_wrap } from '@ggterm/core'

const data = [
  { x: 1, y: 10, category: 'A' },
  { x: 2, y: 20, category: 'A' },
  { x: 1, y: 15, category: 'B' },
  { x: 2, y: 25, category: 'B' }
]
</script>

<template>
  <GGTerm
    :data="data"
    :aes="{ x: 'x', y: 'y' }"
    :geoms="[geom_point()]"
    :facet="facet_wrap('category', { ncol: 2 })"
    :width="80"
    :height="20"
  />
</template>
```

### Interactive Selection

```vue
<script setup>
import { GGTerm, usePlotInteraction } from '@ggterm/vue'
import { geom_point } from '@ggterm/core'

const data = [/* ... */]

const {
  selectedIndices,
  toggleSelect,
  clearSelection
} = usePlotInteraction({
  selectionMode: 'multiple',
  onSelectionChange: (indices) => {
    console.log('Selected:', indices)
  }
})

function handleClick(payload) {
  toggleSelect(payload.index)
}
</script>

<template>
  <GGTerm
    :data="data"
    :aes="{ x: 'x', y: 'y' }"
    :geoms="[geom_point()]"
    @click="handleClick"
  />
  <p>Selected: {{ selectedIndices.length }} points</p>
  <button @click="clearSelection">Clear</button>
</template>
```

## TypeScript Support

Full TypeScript support with Vue's type inference:

```vue
<script setup lang="ts">
import type { DataSource, AestheticMapping } from '@ggterm/vue'
import { GGTerm } from '@ggterm/vue'
import { geom_line } from '@ggterm/core'
import { ref } from 'vue'

const data = ref<DataSource>([
  { time: 1, value: 10 },
  { time: 2, value: 20 }
])

const aes: AestheticMapping = { x: 'time', y: 'value' }
</script>

<template>
  <GGTerm :data="data" :aes="aes" :geoms="[geom_line()]" />
</template>
```

## Nuxt Integration

Works with Nuxt 3:

```vue
<!-- pages/chart.vue -->
<script setup>
import { GGTerm } from '@ggterm/vue'
import { geom_point } from '@ggterm/core'

const { data: chartData } = await useFetch('/api/chart-data')
</script>

<template>
  <GGTerm
    :data="chartData"
    :aes="{ x: 'x', y: 'y' }"
    :geoms="[geom_point()]"
  />
</template>
```

## See Also

- [@ggterm/core](../core/README.md) - Core grammar engine
- [API Reference](../../docs/API.md) - Full API documentation
- [Gallery](../../docs/GALLERY.md) - Visual examples
