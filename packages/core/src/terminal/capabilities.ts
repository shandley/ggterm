/**
 * Terminal Capability Detection
 *
 * Detects terminal features for optimal rendering:
 * - Color support (16, 256, truecolor)
 * - Graphics protocols (Sixel, Kitty, iTerm2)
 * - Unicode support
 * - Terminal dimensions
 */

/**
 * Color capability levels
 */
export type ColorCapability = 'none' | '16' | '256' | 'truecolor'

/**
 * Graphics protocol support
 */
export type GraphicsProtocol = 'none' | 'sixel' | 'kitty' | 'iterm2'

/**
 * Terminal capabilities
 */
export interface TerminalCapabilities {
  /** Color support level */
  colors: ColorCapability
  /** Graphics protocol (if any) */
  graphics: GraphicsProtocol
  /** Unicode/UTF-8 support */
  unicode: boolean
  /** Braille character support */
  braille: boolean
  /** Terminal width in characters */
  width: number
  /** Terminal height in characters */
  height: number
  /** Terminal name/program */
  terminal: string
  /** Is running in CI environment */
  isCI: boolean
  /** Is a TTY (interactive terminal) */
  isTTY: boolean
}

/**
 * Detect color capability from environment
 */
export function detectColorCapability(): ColorCapability {
  // Explicit color mode
  const colorTerm = process.env.COLORTERM ?? ''
  if (colorTerm === 'truecolor' || colorTerm === '24bit') {
    return 'truecolor'
  }

  // TERM variable analysis
  const term = process.env.TERM ?? ''

  // Truecolor terminals
  if (
    term.includes('truecolor') ||
    term.includes('24bit') ||
    term.includes('direct') ||
    term === 'xterm-direct' ||
    term === 'iterm2'
  ) {
    return 'truecolor'
  }

  // 256 color terminals
  if (
    term.includes('256color') ||
    term.includes('256') ||
    term === 'xterm' ||
    term === 'screen' ||
    term === 'tmux'
  ) {
    return '256'
  }

  // Known truecolor terminal programs
  const termProgram = process.env.TERM_PROGRAM ?? ''
  if (
    termProgram === 'iTerm.app' ||
    termProgram === 'Apple_Terminal' ||
    termProgram === 'Hyper' ||
    termProgram === 'vscode' ||
    process.env.WT_SESSION || // Windows Terminal
    process.env.KITTY_WINDOW_ID
  ) {
    return 'truecolor'
  }

  // Basic 16 color for dumb terminals
  if (term === 'dumb' || term === '') {
    return 'none'
  }

  return '16'
}

/**
 * Detect graphics protocol support
 */
export function detectGraphicsProtocol(): GraphicsProtocol {
  // Kitty terminal
  if (process.env.KITTY_WINDOW_ID) {
    return 'kitty'
  }

  // iTerm2
  if (process.env.TERM_PROGRAM === 'iTerm.app') {
    return 'iterm2'
  }

  // Sixel support detection
  const term = process.env.TERM ?? ''

  // Known Sixel-capable terminals
  const sixelTerms = [
    'xterm', // XTerm (if compiled with sixel)
    'mlterm',
    'foot',
    'yaft',
    'mintty',
    'contour',
    'wezterm',
  ]

  for (const sixelTerm of sixelTerms) {
    if (term.includes(sixelTerm)) {
      // Note: We can't definitively detect sixel without querying the terminal
      // This is a best-effort detection
      return 'sixel'
    }
  }

  return 'none'
}

/**
 * Detect Unicode support
 */
export function detectUnicodeSupport(): boolean {
  const lang = process.env.LANG ?? ''
  const lcAll = process.env.LC_ALL ?? ''
  const lcCtype = process.env.LC_CTYPE ?? ''

  // Check for UTF-8 in locale
  const locale = lcAll || lcCtype || lang
  if (locale.toLowerCase().includes('utf-8') || locale.toLowerCase().includes('utf8')) {
    return true
  }

  // Check TERM for unicode hints
  const term = process.env.TERM ?? ''
  if (term.includes('utf') || term.includes('unicode')) {
    return true
  }

  // Modern terminals generally support Unicode
  const termProgram = process.env.TERM_PROGRAM ?? ''
  if (
    termProgram === 'iTerm.app' ||
    termProgram === 'Apple_Terminal' ||
    termProgram === 'vscode' ||
    process.env.WT_SESSION ||
    process.env.KITTY_WINDOW_ID
  ) {
    return true
  }

  // Default to true for most systems
  return true
}

/**
 * Detect terminal dimensions
 */
export function detectTerminalSize(): { width: number; height: number } {
  // Try to get size from process.stdout
  if (process.stdout.columns && process.stdout.rows) {
    return {
      width: process.stdout.columns,
      height: process.stdout.rows,
    }
  }

  // Fallback defaults
  return {
    width: 80,
    height: 24,
  }
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.JENKINS_URL ||
    process.env.BUILDKITE
  )
}

/**
 * Get terminal name/program
 */
export function getTerminalName(): string {
  return (
    process.env.TERM_PROGRAM ||
    process.env.TERMINAL_EMULATOR ||
    process.env.TERM ||
    'unknown'
  )
}

/**
 * Detect all terminal capabilities
 */
export function detectCapabilities(): TerminalCapabilities {
  const size = detectTerminalSize()

  return {
    colors: detectColorCapability(),
    graphics: detectGraphicsProtocol(),
    unicode: detectUnicodeSupport(),
    braille: detectUnicodeSupport(), // Braille requires Unicode
    width: size.width,
    height: size.height,
    terminal: getTerminalName(),
    isCI: isCI(),
    isTTY: process.stdout.isTTY ?? false,
  }
}

/**
 * Query terminal for sixel support using DA1 escape sequence
 * Note: This is async and requires terminal interaction
 */
export async function querySixelSupport(): Promise<boolean> {
  // This would require:
  // 1. Send CSI c (Primary Device Attributes)
  // 2. Parse response for "4" (sixel) in the attributes
  // For now, rely on environment detection
  return detectGraphicsProtocol() === 'sixel'
}

/**
 * Get recommended renderer based on capabilities
 */
export function getRecommendedRenderer(caps: TerminalCapabilities): string {
  // Graphics protocols take priority if available
  if (caps.graphics === 'kitty') return 'kitty'
  if (caps.graphics === 'iterm2') return 'iterm2'
  if (caps.graphics === 'sixel') return 'sixel'

  // Fall back to text renderers
  if (caps.braille) return 'braille'
  if (caps.unicode) return 'block'

  return 'ascii'
}

// Cache capabilities (they don't change during execution)
let cachedCapabilities: TerminalCapabilities | null = null

/**
 * Get cached terminal capabilities
 */
export function getCapabilities(): TerminalCapabilities {
  if (!cachedCapabilities) {
    cachedCapabilities = detectCapabilities()
  }
  return cachedCapabilities
}

/**
 * Clear capability cache (useful for testing)
 */
export function clearCapabilityCache(): void {
  cachedCapabilities = null
}
