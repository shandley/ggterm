/**
 * Terminal utilities
 *
 * Provides terminal capability detection, color management, and rendering optimization.
 */

export {
  detectCapabilities,
  getCapabilities,
  clearCapabilityCache,
  detectColorCapability,
  detectGraphicsProtocol,
  detectUnicodeSupport,
  detectTerminalSize,
  isCI,
  getTerminalName,
  getRecommendedRenderer,
  querySixelSupport,
} from './capabilities'

export type {
  ColorCapability,
  GraphicsProtocol,
  TerminalCapabilities,
} from './capabilities'

export {
  ANSI_16_COLORS,
  generate256Palette,
  getPalette256,
  colorDistance,
  findClosestPaletteColor,
  rgbToAnsi256,
  rgbToAnsi16,
  fgEscape,
  bgEscape,
  quantizeColor,
  ditherPixels,
  createOptimizedPalette,
  getColorEscape,
  RESET,
  RESET_FG,
  RESET_BG,
} from './colors'

export type { ColorMode } from './colors'

export {
  isRendererAvailable,
  selectRenderer,
  selectColorMode,
  RendererChain,
  createRendererChain,
  autoRenderer,
  getTerminalInfo,
} from './renderer-chain'

export type { RendererType, RendererConfig } from './renderer-chain'
