/**
 * ggterm REPL - Interactive plotting environment
 *
 * Provides an interactive shell for building and exploring plots.
 */

import * as readline from 'readline'
import { gg, GGPlot } from '../grammar'
import type { DataSource } from '../types'
import { defaultTheme, themeMinimal, themeDark } from '../themes/default'
import {
  geom_point,
  geom_line,
  geom_bar,
  geom_histogram,
  geom_boxplot,
  geom_area,
  geom_text,
  geom_hline,
  geom_vline,
  geom_tile,
  geom_errorbar,
} from '../geoms'
import {
  scale_x_continuous,
  scale_y_continuous,
  scale_x_log10,
  scale_y_log10,
  scale_color_viridis,
  scale_color_discrete,
  scale_fill_viridis,
} from '../scales'
import { facet_wrap, facet_grid } from '../facets'

export interface REPLOptions {
  /** Terminal width */
  width?: number
  /** Terminal height */
  height?: number
  /** Show welcome message */
  showWelcome?: boolean
  /** Enable colors */
  colors?: boolean
  /** Auto-render on changes */
  autoRender?: boolean
}

export interface REPLState {
  data: DataSource
  plot: GGPlot | null
  history: string[]
  lastResult: string
  variables: Record<string, unknown>
}

/**
 * Interactive REPL for ggterm
 */
export class GGTermREPL {
  private rl: readline.Interface | null = null
  private state: REPLState
  private options: Required<REPLOptions>
  private running = false

  constructor(options: REPLOptions = {}) {
    this.options = {
      width: options.width ?? 70,
      height: options.height ?? 20,
      showWelcome: options.showWelcome ?? true,
      colors: options.colors ?? true,
      autoRender: options.autoRender ?? true,
    }

    this.state = {
      data: [],
      plot: null,
      history: [],
      lastResult: '',
      variables: {},
    }
  }

  /**
   * Start the REPL
   */
  async start(): Promise<void> {
    this.running = true

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer.bind(this),
      terminal: true,
    })

    if (this.options.showWelcome) {
      this.printWelcome()
    }

    this.prompt()

    this.rl.on('line', async (line) => {
      await this.processLine(line.trim())
      if (this.running) {
        this.prompt()
      }
    })

    this.rl.on('close', () => {
      this.running = false
      console.log('\nGoodbye!')
      process.exit(0)
    })
  }

  /**
   * Stop the REPL
   */
  stop(): void {
    this.running = false
    if (this.rl) {
      this.rl.close()
    }
  }

  /**
   * Process a line of input
   */
  async processLine(line: string): Promise<void> {
    if (!line) return

    this.state.history.push(line)

    // Check for commands (start with .)
    if (line.startsWith('.')) {
      await this.processCommand(line)
      return
    }

    // Try to evaluate as JavaScript/TypeScript
    try {
      await this.evaluate(line)
    } catch (error) {
      this.printError(error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Process a dot command
   */
  private async processCommand(line: string): Promise<void> {
    const parts = line.slice(1).split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    switch (cmd) {
      case 'help':
      case 'h':
      case '?':
        this.printHelp(args[0])
        break

      case 'data':
      case 'd':
        this.handleDataCommand(args)
        break

      case 'plot':
      case 'p':
        this.renderCurrentPlot()
        break

      case 'clear':
      case 'c':
        this.clearScreen()
        break

      case 'reset':
        this.resetState()
        break

      case 'size':
        this.handleSizeCommand(args)
        break

      case 'theme':
        this.handleThemeCommand(args)
        break

      case 'save':
        this.handleSaveCommand(args)
        break

      case 'load':
        await this.handleLoadCommand(args)
        break

      case 'history':
        this.printHistory()
        break

      case 'vars':
      case 'variables':
        this.printVariables()
        break

      case 'examples':
      case 'ex':
        this.printExamples()
        break

      case 'quit':
      case 'q':
      case 'exit':
        this.stop()
        break

      default:
        this.printError(`Unknown command: .${cmd}. Type .help for available commands.`)
    }
  }

  /**
   * Evaluate JavaScript expression in REPL context
   */
  private async evaluate(code: string): Promise<void> {
    // Create evaluation context with ggterm functions
    const context = this.createEvalContext()

    // Handle assignment
    const assignMatch = code.match(/^(let|const|var)?\s*(\w+)\s*=\s*(.+)$/)
    if (assignMatch) {
      const [, , varName, expr] = assignMatch
      try {
        const result = this.evalInContext(expr, context)
        this.state.variables[varName] = result

        // If it's a GGPlot, store and optionally render
        if (result instanceof GGPlot) {
          this.state.plot = result
          if (this.options.autoRender) {
            this.renderCurrentPlot()
          } else {
            this.print(`Plot stored as '${varName}'. Use .plot to render.`)
          }
        } else if (Array.isArray(result)) {
          this.state.data = result
          this.print(`Data loaded: ${result.length} rows`)
        } else {
          this.print(`${varName} = ${this.formatValue(result)}`)
        }
      } catch (e) {
        throw e
      }
      return
    }

    // Direct evaluation
    const result = this.evalInContext(code, context)

    if (result instanceof GGPlot) {
      this.state.plot = result
      if (this.options.autoRender) {
        this.renderCurrentPlot()
      }
    } else if (result !== undefined) {
      this.print(this.formatValue(result))
    }
  }

  /**
   * Create evaluation context with ggterm functions
   */
  private createEvalContext(): Record<string, unknown> {
    return {
      // Core
      gg,
      data: this.state.data,
      plot: this.state.plot,

      // Geoms
      geom_point,
      geom_line,
      geom_bar,
      geom_histogram,
      geom_boxplot,
      geom_area,
      geom_text,
      geom_hline,
      geom_vline,
      geom_tile,
      geom_errorbar,

      // Scales
      scale_x_continuous,
      scale_y_continuous,
      scale_x_log10,
      scale_y_log10,
      scale_color_viridis,
      scale_color_discrete,
      scale_fill_viridis,

      // Facets
      facet_wrap,
      facet_grid,

      // Themes
      defaultTheme,
      themeMinimal,
      themeDark,

      // User variables
      ...this.state.variables,

      // Utilities
      range: (start: number, end: number) =>
        Array.from({ length: end - start }, (_, i) => start + i),
      random: (n: number) =>
        Array.from({ length: n }, () => Math.random()),
      seq: (from: number, to: number, by: number = 1) => {
        const result: number[] = []
        for (let i = from; i <= to; i += by) result.push(i)
        return result
      },
      rnorm: (n: number, mean: number = 0, sd: number = 1) =>
        Array.from({ length: n }, () => {
          const u1 = Math.random()
          const u2 = Math.random()
          return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        }),
    }
  }

  /**
   * Evaluate code in context
   */
  private evalInContext(code: string, context: Record<string, unknown>): unknown {
    const keys = Object.keys(context)
    const values = Object.values(context)

    // Create function with context variables as parameters
    const fn = new Function(...keys, `return (${code})`)
    return fn(...values)
  }

  /**
   * Render the current plot
   */
  private renderCurrentPlot(): void {
    if (!this.state.plot) {
      this.printError('No plot to render. Create one with gg(data).aes({...}).geom(...)')
      return
    }

    try {
      const rendered = this.state.plot.render({
        width: this.options.width,
        height: this.options.height,
      })
      this.state.lastResult = rendered
      console.log()
      console.log(rendered)
      console.log()
    } catch (error) {
      this.printError(`Render error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Handle .data command
   */
  private handleDataCommand(args: string[]): void {
    if (args.length === 0) {
      // Show current data summary
      if (this.state.data.length === 0) {
        this.print('No data loaded. Use .data <json> or assign: data = [{...}]')
      } else {
        this.print(`Data: ${this.state.data.length} rows`)
        if (this.state.data.length > 0) {
          const cols = Object.keys(this.state.data[0])
          this.print(`Columns: ${cols.join(', ')}`)
          this.print('\nFirst 3 rows:')
          this.state.data.slice(0, 3).forEach((row, i) => {
            this.print(`  ${i + 1}: ${JSON.stringify(row)}`)
          })
        }
      }
      return
    }

    const subCmd = args[0].toLowerCase()

    switch (subCmd) {
      case 'clear':
        this.state.data = []
        this.print('Data cleared')
        break

      case 'sample':
        const n = parseInt(args[1]) || 10
        this.generateSampleData(n)
        break

      case 'iris':
        this.loadIrisData()
        break

      case 'mtcars':
        this.loadMtcarsData()
        break

      default:
        // Try to parse as JSON
        try {
          const json = args.join(' ')
          this.state.data = JSON.parse(json)
          this.print(`Loaded ${this.state.data.length} rows`)
        } catch {
          this.printError('Invalid JSON. Use .data sample <n> for sample data.')
        }
    }
  }

  /**
   * Generate sample data
   */
  private generateSampleData(n: number): void {
    this.state.data = Array.from({ length: n }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.5) * 10 + Math.random() * 5 + 20,
      group: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
      size: Math.random() * 10 + 5,
    }))
    this.print(`Generated ${n} sample rows with columns: x, y, group, size`)
  }

  /**
   * Load Iris dataset
   */
  private loadIrisData(): void {
    // Simplified Iris data
    const species = ['setosa', 'versicolor', 'virginica']
    this.state.data = Array.from({ length: 150 }, (_, i) => {
      const sp = species[Math.floor(i / 50)]
      const base = sp === 'setosa' ? 0 : sp === 'versicolor' ? 1 : 2
      return {
        sepal_length: 5 + base * 0.5 + Math.random(),
        sepal_width: 3 + Math.random() * 0.5,
        petal_length: 1.5 + base * 2 + Math.random(),
        petal_width: 0.2 + base * 0.8 + Math.random() * 0.3,
        species: sp,
      }
    })
    this.print('Loaded Iris dataset: 150 rows, 5 columns')
  }

  /**
   * Load mtcars dataset
   */
  private loadMtcarsData(): void {
    this.state.data = [
      { name: 'Mazda RX4', mpg: 21, cyl: 6, hp: 110, wt: 2.62 },
      { name: 'Mazda RX4 Wag', mpg: 21, cyl: 6, hp: 110, wt: 2.875 },
      { name: 'Datsun 710', mpg: 22.8, cyl: 4, hp: 93, wt: 2.32 },
      { name: 'Hornet 4 Drive', mpg: 21.4, cyl: 6, hp: 110, wt: 3.215 },
      { name: 'Hornet Sportabout', mpg: 18.7, cyl: 8, hp: 175, wt: 3.44 },
      { name: 'Valiant', mpg: 18.1, cyl: 6, hp: 105, wt: 3.46 },
      { name: 'Duster 360', mpg: 14.3, cyl: 8, hp: 245, wt: 3.57 },
      { name: 'Merc 240D', mpg: 24.4, cyl: 4, hp: 62, wt: 3.19 },
      { name: 'Merc 230', mpg: 22.8, cyl: 4, hp: 95, wt: 3.15 },
      { name: 'Merc 280', mpg: 19.2, cyl: 6, hp: 123, wt: 3.44 },
      { name: 'Merc 280C', mpg: 17.8, cyl: 6, hp: 123, wt: 3.44 },
      { name: 'Merc 450SE', mpg: 16.4, cyl: 8, hp: 180, wt: 4.07 },
      { name: 'Merc 450SL', mpg: 17.3, cyl: 8, hp: 180, wt: 3.73 },
      { name: 'Merc 450SLC', mpg: 15.2, cyl: 8, hp: 180, wt: 3.78 },
      { name: 'Cadillac Fleetwood', mpg: 10.4, cyl: 8, hp: 205, wt: 5.25 },
      { name: 'Lincoln Continental', mpg: 10.4, cyl: 8, hp: 215, wt: 5.424 },
    ]
    this.print('Loaded mtcars dataset: 16 rows, 5 columns (mpg, cyl, hp, wt, name)')
  }

  /**
   * Handle .size command
   */
  private handleSizeCommand(args: string[]): void {
    if (args.length === 0) {
      this.print(`Current size: ${this.options.width}x${this.options.height}`)
      return
    }

    if (args.length === 2) {
      const width = parseInt(args[0])
      const height = parseInt(args[1])
      if (!isNaN(width) && !isNaN(height)) {
        this.options.width = width
        this.options.height = height
        this.print(`Size set to ${width}x${height}`)
        return
      }
    }

    this.printError('Usage: .size <width> <height>')
  }

  /**
   * Handle .theme command
   */
  private handleThemeCommand(args: string[]): void {
    if (args.length === 0 || !this.state.plot) {
      this.print('Available themes: default, minimal, dark')
      return
    }

    const themeName = args[0].toLowerCase()
    let theme

    switch (themeName) {
      case 'default':
        theme = defaultTheme()
        break
      case 'minimal':
        theme = themeMinimal()
        break
      case 'dark':
        theme = themeDark()
        break
      default:
        this.printError(`Unknown theme: ${themeName}`)
        return
    }

    this.state.plot = this.state.plot.theme(theme)
    this.print(`Theme set to '${themeName}'`)

    if (this.options.autoRender) {
      this.renderCurrentPlot()
    }
  }

  /**
   * Handle .save command
   */
  private handleSaveCommand(args: string[]): void {
    if (args.length === 0) {
      this.printError('Usage: .save <filename>')
      return
    }

    if (!this.state.lastResult) {
      this.printError('No plot to save. Render a plot first.')
      return
    }

    const filename = args[0]
    try {
      const fs = require('fs')
      // Strip ANSI codes for text file
      const cleanOutput = this.state.lastResult.replace(/\x1b\[[0-9;]*m/g, '')
      fs.writeFileSync(filename, cleanOutput)
      this.print(`Saved to ${filename}`)
    } catch (error) {
      this.printError(`Save failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Handle .load command
   */
  private async handleLoadCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.printError('Usage: .load <filename.json>')
      return
    }

    const filename = args[0]
    try {
      const fs = require('fs')
      const content = fs.readFileSync(filename, 'utf-8')
      this.state.data = JSON.parse(content)
      this.print(`Loaded ${this.state.data.length} rows from ${filename}`)
    } catch (error) {
      this.printError(`Load failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tab completion
   */
  private completer(line: string): [string[], string] {
    const completions = [
      // Commands
      '.help', '.data', '.plot', '.clear', '.reset', '.size',
      '.theme', '.save', '.load', '.history', '.vars', '.examples',
      '.quit',
      // Functions
      'gg(', 'geom_point(', 'geom_line(', 'geom_bar(', 'geom_histogram(',
      'geom_boxplot(', 'geom_area(', 'geom_tile(', 'geom_errorbar(',
      'scale_x_continuous(', 'scale_y_continuous(', 'scale_x_log10(',
      'scale_color_viridis(', 'scale_fill_viridis(',
      'facet_wrap(', 'facet_grid(',
      '.aes(', '.geom(', '.scale(', '.labs(', '.theme(', '.render(',
      // Data commands
      '.data sample', '.data iris', '.data mtcars', '.data clear',
    ]

    const hits = completions.filter(c => c.startsWith(line))
    return [hits.length ? hits : completions, line]
  }

  /**
   * Print welcome message
   */
  private printWelcome(): void {
    console.log()
    console.log(this.color('cyan', '  ggterm REPL - Interactive Grammar of Graphics'))
    console.log(this.color('gray', '  Type .help for commands, .examples for sample code'))
    console.log()
  }

  /**
   * Print help
   */
  private printHelp(topic?: string): void {
    if (topic) {
      this.printTopicHelp(topic)
      return
    }

    console.log()
    console.log(this.color('cyan', 'Commands:'))
    console.log('  .help [topic]     Show help (topics: geoms, scales, aes)')
    console.log('  .data             Show/manage data')
    console.log('  .data sample <n>  Generate sample data')
    console.log('  .data iris        Load Iris dataset')
    console.log('  .data mtcars      Load mtcars dataset')
    console.log('  .plot             Render current plot')
    console.log('  .size <w> <h>     Set plot dimensions')
    console.log('  .theme <name>     Set theme (default, minimal, dark)')
    console.log('  .clear            Clear screen')
    console.log('  .reset            Reset state')
    console.log('  .save <file>      Save plot to file')
    console.log('  .load <file>      Load data from JSON file')
    console.log('  .history          Show command history')
    console.log('  .vars             Show variables')
    console.log('  .examples         Show example code')
    console.log('  .quit             Exit REPL')
    console.log()
    console.log(this.color('cyan', 'Quick Start:'))
    console.log('  .data sample 50')
    console.log('  p = gg(data).aes({x: "x", y: "y"}).geom(geom_point())')
    console.log()
  }

  /**
   * Print topic-specific help
   */
  private printTopicHelp(topic: string): void {
    switch (topic.toLowerCase()) {
      case 'geoms':
        console.log()
        console.log(this.color('cyan', 'Geometries:'))
        console.log('  geom_point()      Scatter plot')
        console.log('  geom_line()       Line chart')
        console.log('  geom_bar()        Bar chart')
        console.log('  geom_histogram()  Histogram')
        console.log('  geom_boxplot()    Box plot')
        console.log('  geom_area()       Area chart')
        console.log('  geom_tile()       Heatmap tiles')
        console.log('  geom_errorbar()   Error bars')
        console.log('  geom_hline()      Horizontal line')
        console.log('  geom_vline()      Vertical line')
        console.log()
        break

      case 'scales':
        console.log()
        console.log(this.color('cyan', 'Scales:'))
        console.log('  scale_x_continuous()   Continuous X axis')
        console.log('  scale_y_continuous()   Continuous Y axis')
        console.log('  scale_x_log10()        Log scale X')
        console.log('  scale_y_log10()        Log scale Y')
        console.log('  scale_color_viridis()  Viridis color palette')
        console.log('  scale_color_discrete() Discrete colors')
        console.log('  scale_fill_viridis()   Viridis fill palette')
        console.log()
        break

      case 'aes':
        console.log()
        console.log(this.color('cyan', 'Aesthetics:'))
        console.log('  x       X position (required)')
        console.log('  y       Y position (required)')
        console.log('  color   Point/line color')
        console.log('  fill    Fill color')
        console.log('  size    Point size')
        console.log('  shape   Point shape')
        console.log('  alpha   Transparency')
        console.log('  group   Grouping variable')
        console.log('  label   Text labels')
        console.log()
        break

      default:
        this.print(`No help for topic: ${topic}`)
    }
  }

  /**
   * Print examples
   */
  private printExamples(): void {
    console.log()
    console.log(this.color('cyan', 'Examples:'))
    console.log()
    console.log(this.color('yellow', '# Basic scatter plot'))
    console.log('.data sample 30')
    console.log('gg(data).aes({x: "x", y: "y"}).geom(geom_point())')
    console.log()
    console.log(this.color('yellow', '# Colored by group'))
    console.log('gg(data).aes({x: "x", y: "y", color: "group"}).geom(geom_point())')
    console.log()
    console.log(this.color('yellow', '# Line chart'))
    console.log('gg(data).aes({x: "x", y: "y"}).geom(geom_line())')
    console.log()
    console.log(this.color('yellow', '# With labels'))
    console.log('gg(data).aes({x: "x", y: "y"}).geom(geom_point()).labs({title: "My Plot"})')
    console.log()
    console.log(this.color('yellow', '# Iris dataset'))
    console.log('.data iris')
    console.log('gg(data).aes({x: "sepal_length", y: "petal_length", color: "species"}).geom(geom_point())')
    console.log()
  }

  /**
   * Print command history
   */
  private printHistory(): void {
    if (this.state.history.length === 0) {
      this.print('No history')
      return
    }

    console.log()
    this.state.history.slice(-20).forEach((cmd, i) => {
      console.log(`  ${i + 1}: ${cmd}`)
    })
    console.log()
  }

  /**
   * Print variables
   */
  private printVariables(): void {
    const vars = Object.keys(this.state.variables)
    if (vars.length === 0) {
      this.print('No variables defined')
      return
    }

    console.log()
    vars.forEach(name => {
      const value = this.state.variables[name]
      const type = value instanceof GGPlot ? 'GGPlot' : Array.isArray(value) ? `Array[${value.length}]` : typeof value
      console.log(`  ${name}: ${type}`)
    })
    console.log()
  }

  /**
   * Reset state
   */
  private resetState(): void {
    this.state = {
      data: [],
      plot: null,
      history: this.state.history, // Keep history
      lastResult: '',
      variables: {},
    }
    this.print('State reset')
  }

  /**
   * Clear screen
   */
  private clearScreen(): void {
    console.clear()
  }

  /**
   * Print prompt
   */
  private prompt(): void {
    if (this.rl) {
      this.rl.setPrompt(this.color('green', 'ggterm> '))
      this.rl.prompt()
    }
  }

  /**
   * Print message
   */
  private print(msg: string): void {
    console.log(msg)
  }

  /**
   * Print error
   */
  private printError(msg: string): void {
    console.log(this.color('red', `Error: ${msg}`))
  }

  /**
   * Color text
   */
  private color(color: string, text: string): string {
    if (!this.options.colors) return text

    const colors: Record<string, string> = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
      reset: '\x1b[0m',
    }

    return `${colors[color] ?? ''}${text}${colors.reset}`
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'
    if (typeof value === 'string') return `"${value}"`
    if (Array.isArray(value)) {
      if (value.length <= 5) {
        return JSON.stringify(value)
      }
      return `Array[${value.length}]`
    }
    if (typeof value === 'object') {
      if (value instanceof GGPlot) return '[GGPlot]'
      return JSON.stringify(value)
    }
    return String(value)
  }
}

/**
 * Create and start a REPL instance
 */
export function startREPL(options?: REPLOptions): GGTermREPL {
  const repl = new GGTermREPL(options)
  repl.start()
  return repl
}
