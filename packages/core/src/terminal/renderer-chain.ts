/**
 * Automatic Renderer Fallback Chain
 *
 * Provides intelligent renderer selection based on terminal capabilities.
 * Automatically falls back to simpler renderers when advanced features aren't available.
 */

import type { Canvas, RenderOptions, Renderer } from '../types'
import {
  detectCapabilities,
  getCapabilities,
  type TerminalCapabilities,
  type GraphicsProtocol,
  type ColorCapability,
} from './capabilities'
import { type ColorMode, getColorEscape, RESET } from './colors'

/**
 * Renderer types in order of preference (best to worst)
 */
export type RendererType =
  | 'kitty'
  | 'iterm2'
  | 'sixel'
  | 'braille'
  | 'block-subpixel'
  | 'block'
  | 'ascii'

/**
 * Renderer configuration
 */
export interface RendererConfig {
  /** Preferred renderer (will be used if available) */
  preferred?: RendererType
  /** Force a specific renderer (ignores capability detection) */
  force?: RendererType
  /** Minimum acceptable renderer in fallback chain */
  minimum?: RendererType
  /** Color mode override */
  colorMode?: ColorMode
  /** Enable dithering for color reduction */
  dithering?: boolean
}

/**
 * Maps renderer types to required capabilities
 */
interface RendererRequirements {
  graphics?: GraphicsProtocol
  unicode?: boolean
  braille?: boolean
  colors?: ColorCapability
}

const RENDERER_REQUIREMENTS: Record<RendererType, RendererRequirements> = {
  kitty: { graphics: 'kitty' },
  iterm2: { graphics: 'iterm2' },
  sixel: { graphics: 'sixel' },
  braille: { unicode: true, braille: true },
  'block-subpixel': { unicode: true },
  block: { unicode: true },
  ascii: {}, // No requirements - always available
}

/**
 * Fallback order for each renderer type
 */
const FALLBACK_ORDER: RendererType[] = [
  'kitty',
  'iterm2',
  'sixel',
  'braille',
  'block-subpixel',
  'block',
  'ascii',
]

/**
 * Check if a renderer is available given terminal capabilities
 */
export function isRendererAvailable(type: RendererType, caps: TerminalCapabilities): boolean {
  const reqs = RENDERER_REQUIREMENTS[type]

  if (reqs.graphics) {
    if (caps.graphics !== reqs.graphics) return false
  }

  if (reqs.unicode && !caps.unicode) return false
  if (reqs.braille && !caps.braille) return false

  return true
}

/**
 * Select the best available renderer based on capabilities
 */
export function selectRenderer(
  config: RendererConfig = {},
  caps?: TerminalCapabilities
): RendererType {
  // Force specific renderer
  if (config.force) {
    return config.force
  }

  const capabilities = caps || getCapabilities()

  // Check preferred renderer first
  if (config.preferred && isRendererAvailable(config.preferred, capabilities)) {
    return config.preferred
  }

  // Find the minimum acceptable position in fallback order
  const minimumIdx = config.minimum ? FALLBACK_ORDER.indexOf(config.minimum) : FALLBACK_ORDER.length

  // Walk fallback order and find first available
  for (let i = 0; i <= minimumIdx && i < FALLBACK_ORDER.length; i++) {
    const renderer = FALLBACK_ORDER[i]
    if (isRendererAvailable(renderer, capabilities)) {
      return renderer
    }
  }

  // Always return ascii as last resort
  return 'ascii'
}

/**
 * Get the appropriate color mode for capabilities
 */
export function selectColorMode(caps?: TerminalCapabilities): ColorMode {
  const capabilities = caps || getCapabilities()

  switch (capabilities.colors) {
    case 'truecolor':
      return 'truecolor'
    case '256':
      return '256'
    case '16':
      return '16'
    default:
      return 'none'
  }
}

/**
 * Renderer chain - manages automatic fallback
 */
export class RendererChain {
  private capabilities: TerminalCapabilities
  private selectedRenderer: RendererType
  private colorMode: ColorMode
  private renderers: Map<RendererType, Renderer>

  constructor(config: RendererConfig = {}) {
    this.capabilities = detectCapabilities()
    this.selectedRenderer = selectRenderer(config, this.capabilities)
    this.colorMode = config.colorMode || selectColorMode(this.capabilities)
    this.renderers = new Map()
  }

  /**
   * Get current capabilities
   */
  getCapabilities(): TerminalCapabilities {
    return this.capabilities
  }

  /**
   * Get selected renderer type
   */
  getSelectedRenderer(): RendererType {
    return this.selectedRenderer
  }

  /**
   * Get selected color mode
   */
  getColorMode(): ColorMode {
    return this.colorMode
  }

  /**
   * Register a renderer implementation
   */
  registerRenderer(type: RendererType, renderer: Renderer): void {
    this.renderers.set(type, renderer)
  }

  /**
   * Check if a renderer is registered
   */
  hasRenderer(type: RendererType): boolean {
    return this.renderers.has(type)
  }

  /**
   * Render using the selected renderer
   */
  render(canvas: Canvas, options: RenderOptions): string {
    // Try to use selected renderer
    let renderer = this.renderers.get(this.selectedRenderer)

    // Fall back if not registered
    if (!renderer) {
      for (const type of FALLBACK_ORDER) {
        if (this.renderers.has(type) && isRendererAvailable(type, this.capabilities)) {
          renderer = this.renderers.get(type)
          break
        }
      }
    }

    // Last resort: use built-in ASCII renderer
    if (!renderer) {
      return this.renderASCII(canvas, options)
    }

    return renderer.render(canvas, options)
  }

  /**
   * Built-in ASCII fallback renderer
   */
  private renderASCII(canvas: Canvas, _options: RenderOptions): string {
    const lines: string[] = []
    const useColor = this.colorMode !== 'none'

    for (let y = 0; y < canvas.height; y++) {
      let line = ''
      let lastColor = ''

      for (let x = 0; x < canvas.width; x++) {
        const cell = canvas.getCell(x, y)

        if (useColor) {
          const colorEscape = getColorEscape(cell.fg, this.colorMode, 'fg')
          if (colorEscape !== lastColor) {
            if (lastColor) line += RESET
            line += colorEscape
            lastColor = colorEscape
          }
        }

        line += cell.char
      }

      if (lastColor) {
        line += RESET
      }

      lines.push(line)
    }

    return lines.join('\n')
  }

  /**
   * Get a description of current rendering setup
   */
  describe(): string {
    const parts = [
      `Renderer: ${this.selectedRenderer}`,
      `Colors: ${this.colorMode}`,
      `Terminal: ${this.capabilities.terminal}`,
      `Graphics: ${this.capabilities.graphics}`,
      `Size: ${this.capabilities.width}x${this.capabilities.height}`,
    ]

    if (this.capabilities.isCI) {
      parts.push('CI: yes')
    }

    return parts.join(' | ')
  }
}

/**
 * Create a renderer chain with sensible defaults
 */
export function createRendererChain(config: RendererConfig = {}): RendererChain {
  return new RendererChain(config)
}

/**
 * Auto-detect and create the best renderer for the current terminal
 */
export function autoRenderer(): { type: RendererType; colorMode: ColorMode } {
  const caps = getCapabilities()
  return {
    type: selectRenderer({}, caps),
    colorMode: selectColorMode(caps),
  }
}

/**
 * Get terminal info summary
 */
export function getTerminalInfo(): {
  terminal: string
  renderer: RendererType
  colorMode: ColorMode
  size: { width: number; height: number }
  graphics: GraphicsProtocol
  unicode: boolean
  isCI: boolean
  isTTY: boolean
} {
  const caps = getCapabilities()
  return {
    terminal: caps.terminal,
    renderer: selectRenderer({}, caps),
    colorMode: selectColorMode(caps),
    size: { width: caps.width, height: caps.height },
    graphics: caps.graphics,
    unicode: caps.unicode,
    isCI: caps.isCI,
    isTTY: caps.isTTY,
  }
}
