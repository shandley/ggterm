#!/usr/bin/env node
/**
 * ggterm CLI - Interactive Grammar of Graphics for terminals
 *
 * Usage:
 *   npx ggterm              Start interactive REPL
 *   npx ggterm --help       Show help
 *   npx ggterm --version    Show version
 *   npx ggterm -e "code"    Execute code and exit
 *   npx ggterm script.ts    Run a script file
 */

import { startREPL, GGTermREPL } from './repl'
import * as fs from 'fs'
import * as path from 'path'

const VERSION = '0.0.1'

interface CLIOptions {
  help: boolean
  version: boolean
  execute?: string
  noColors: boolean
  width?: number
  height?: number
  file?: string
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    help: false,
    version: false,
    noColors: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true
        break

      case '-v':
      case '--version':
        options.version = true
        break

      case '-e':
      case '--execute':
        options.execute = args[++i]
        break

      case '--no-colors':
        options.noColors = true
        break

      case '-w':
      case '--width':
        options.width = parseInt(args[++i])
        break

      case '-H':
      case '--height':
        options.height = parseInt(args[++i])
        break

      default:
        if (!arg.startsWith('-')) {
          options.file = arg
        }
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
ggterm - Grammar of Graphics for Terminal UIs

Usage:
  ggterm                    Start interactive REPL
  ggterm [options]          Start with options
  ggterm <script.ts>        Run a script file
  ggterm -e "code"          Execute code and exit

Options:
  -h, --help                Show this help
  -v, --version             Show version
  -e, --execute <code>      Execute code and exit
  -w, --width <n>           Set plot width (default: 70)
  -H, --height <n>          Set plot height (default: 20)
  --no-colors               Disable colors

REPL Commands:
  .help                     Show REPL help
  .data sample <n>          Generate sample data
  .data iris                Load Iris dataset
  .data mtcars              Load mtcars dataset
  .plot                     Render current plot
  .size <w> <h>             Set plot dimensions
  .theme <name>             Set theme (default, minimal, dark)
  .save <file>              Save plot to file
  .quit                     Exit REPL

Examples:
  # Start interactive REPL
  $ ggterm

  # Quick plot
  $ ggterm -e ".data sample 30; gg(data).aes({x:'x',y:'y'}).geom(geom_point())"

  # Run a script
  $ ggterm plot.ts

  # Set custom dimensions
  $ ggterm -w 100 -H 30

Documentation: https://github.com/yourusername/ggterm
`)
}

function printVersion(): void {
  console.log(`ggterm v${VERSION}`)
}

async function executeCode(code: string, options: CLIOptions): Promise<void> {
  // Create a temporary REPL to execute the code
  const repl = new GGTermREPL({
    width: options.width,
    height: options.height,
    showWelcome: false,
    colors: !options.noColors,
    autoRender: true,
  })

  // Split by semicolon and execute each statement
  const statements = code.split(';').map(s => s.trim()).filter(Boolean)

  for (const statement of statements) {
    await repl.processLine(statement)
  }
}

async function executeFile(filePath: string, options: CLIOptions): Promise<void> {
  const absolutePath = path.resolve(filePath)

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`)
    process.exit(1)
  }

  const ext = path.extname(absolutePath)

  if (ext === '.json') {
    // Load as data file
    try {
      const content = fs.readFileSync(absolutePath, 'utf-8')
      const data = JSON.parse(content)
      console.log(`Loaded ${data.length} rows from ${filePath}`)
      console.log('Starting REPL with data...')
      startREPL({
        width: options.width,
        height: options.height,
        colors: !options.noColors,
      })
    } catch (error) {
      console.error(`Error loading JSON: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  } else if (ext === '.ts' || ext === '.js') {
    // Execute TypeScript/JavaScript file using dynamic import
    try {
      // For ts files, we need Bun or tsx to run them
      const module = await import(absolutePath)
      if (typeof module.default === 'function') {
        await module.default()
      }
    } catch (error) {
      console.error(`Error executing file: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  } else {
    // Try to execute as commands
    const content = fs.readFileSync(absolutePath, 'utf-8')
    await executeCode(content, options)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const options = parseArgs(args)

  if (options.help) {
    printHelp()
    return
  }

  if (options.version) {
    printVersion()
    return
  }

  if (options.execute) {
    await executeCode(options.execute, options)
    return
  }

  if (options.file) {
    await executeFile(options.file, options)
    return
  }

  // Start interactive REPL
  startREPL({
    width: options.width,
    height: options.height,
    colors: !options.noColors,
  })
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
