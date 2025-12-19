<!--
  GGTerm - Vue component for ggterm plots

  A declarative component for rendering grammar of graphics plots.

  @example
  ```vue
  <script setup>
  import { GGTerm } from '@ggterm/vue'
  import { geom_point, geom_line } from '@ggterm/core'
  import { ref } from 'vue'

  const data = ref([
    { x: 1, y: 10 },
    { x: 2, y: 25 },
    { x: 3, y: 18 }
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
-->
<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import {
  gg,
  type DataSource,
  type AestheticMapping,
  type Geom,
  type Scale,
  type Coord,
  type Facet,
  type Theme,
  type Labels,
  type RenderOptions,
} from '@ggterm/core'

// Props
interface Props {
  data?: DataSource
  aes: AestheticMapping
  geoms?: Geom[]
  scales?: Scale[]
  coord?: Coord
  facet?: Facet
  theme?: Theme | Partial<Theme>
  labs?: Labels
  width?: number
  height?: number
  renderer?: 'braille' | 'block' | 'sixel' | 'auto'
  colorMode?: 'none' | '16' | '256' | 'truecolor' | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  geoms: () => [],
  scales: () => [],
  width: 70,
  height: 20,
  renderer: 'auto',
  colorMode: 'auto',
})

// Emits
const emit = defineEmits<{
  render: [rendered: string]
  hover: [payload: { index: number; record: DataSource[number] | null }]
  click: [payload: { index: number; record: DataSource[number] }]
}>()

// Rendered output
const rendered = ref('')

// Build and render plot
const plot = computed(() => {
  if (!props.data || props.data.length === 0) {
    return null
  }

  let p = gg(props.data).aes(props.aes)

  for (const g of props.geoms) {
    p = p.geom(g)
  }

  for (const s of props.scales) {
    p = p.scale(s)
  }

  if (props.coord) {
    p = p.coord(props.coord)
  }

  if (props.facet) {
    p = p.facet(props.facet)
  }

  if (props.theme) {
    p = p.theme(props.theme)
  }

  if (props.labs) {
    p = p.labs(props.labs)
  }

  return p
})

// Watch for changes and render
watch(
  [() => props.data, () => props.aes, () => props.geoms, () => props.width, () => props.height, plot],
  () => {
    if (!plot.value) {
      rendered.value = ''
      return
    }

    const opts: RenderOptions = {
      width: props.width,
      height: props.height,
      renderer: props.renderer,
      colorMode: props.colorMode,
    }

    rendered.value = plot.value.render(opts)
    emit('render', rendered.value)
  },
  { immediate: true, deep: true }
)

// Expose methods
const refresh = () => {
  if (!plot.value) return

  const opts: RenderOptions = {
    width: props.width,
    height: props.height,
    renderer: props.renderer,
    colorMode: props.colorMode,
  }

  rendered.value = plot.value.render(opts)
  emit('render', rendered.value)
}

const getRendered = () => rendered.value

const getPlot = () => plot.value

defineExpose({
  refresh,
  getRendered,
  getPlot,
})
</script>

<template>
  <pre
    class="ggterm"
    tabindex="0"
    @keydown="$emit('keydown', $event)"
  >{{ rendered }}</pre>
</template>

<style scoped>
.ggterm {
  font-family: monospace;
  white-space: pre;
  margin: 0;
  padding: 0;
  line-height: 1;
}
</style>
