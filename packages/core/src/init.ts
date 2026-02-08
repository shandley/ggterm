/**
 * Initialize ggterm skills in the current directory
 *
 * Creates .claude/skills/ with all ggterm skills configured for npx usage
 * Safe to run multiple times - updates skills if version changed
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

// Current version - update when skills change
const SKILLS_VERSION = '0.3.4'

// Skill templates - these use npx ggterm-plot for portability
const SKILLS: Record<string, { files: Record<string, string> }> = {
  'data-load': {
    files: {
      'SKILL.md': `---
name: data-load
description: Load data from files (CSV, JSON, JSONL, Parquet) or stdin for analysis and visualization with ggterm. Use when reading datasets, importing data, opening files, or when the user mentions loading, reading, or opening data.
allowed-tools: Bash(npx:*), Read, Write
---

# Data Loading for ggterm

Load data into arrays of records for use with ggterm plotting and analysis.

## Built-in Datasets (No files needed!)

ggterm includes built-in datasets that can be used directly by name:

| Dataset | Rows | Columns |
|---------|------|---------|
| \`iris\` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| \`mtcars\` | 16 | mpg, cyl, hp, wt, name |

Use them directly in plot commands:

\`\`\`bash
npx ggterm-plot iris sepal_length sepal_width species "Iris Dataset" point
npx ggterm-plot mtcars mpg hp cyl "Motor Trend Cars" point
\`\`\`

**IMPORTANT**: When the user asks about iris, mtcars, or bundled/built-in datasets, use these names directly with \`npx ggterm-plot\`. Do NOT try to generate CSV files or install Python packages.

## External Files

\`\`\`bash
npx ggterm-plot data.csv x_column y_column color_column "Title" point
npx ggterm-plot data.json x_column y_column
npx ggterm-plot data.jsonl x_column y_column
\`\`\`

## Verification

Inspect any data file to see columns and types:

\`\`\`bash
npx ggterm-plot inspect data.csv
\`\`\`

$ARGUMENTS
`
    }
  },
  'ggterm-plot': {
    files: {
      'SKILL.md': `---
name: ggterm-plot
description: Create terminal data visualizations using Grammar of Graphics. Use when plotting data, creating charts, graphing, visualizing distributions, or when the user mentions plot, chart, graph, histogram, scatter, boxplot, or visualize.
allowed-tools: Bash(npx:ggterm-plot*), Read
---

# Terminal Plotting with ggterm

Create plots using the CLI tool. Supports both built-in datasets and external files.

## Built-in Datasets

ggterm includes datasets that work by name — no CSV files needed:

| Dataset | Rows | Columns |
|---------|------|---------|
| \`iris\` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| \`mtcars\` | 16 | mpg, cyl, hp, wt, name |

\`\`\`bash
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot mtcars mpg hp cyl "Cars" point
\`\`\`

**IMPORTANT**: When the user mentions iris, mtcars, or asks for demo/sample data, use these built-in names directly. Do NOT look for CSV files or generate data.

## Live Plot Viewer

Start the companion viewer for high-resolution interactive plots:

\`\`\`bash
npx ggterm-plot serve        # default port 4242
npx ggterm-plot serve 8080   # custom port
\`\`\`

When serve is running, plots auto-display in the browser/Wave panel instead of ASCII art.

## CLI Command

\`\`\`bash
npx ggterm-plot <data> <x> <y> [color] [title] [geom]
\`\`\`

Arguments:
- \`data\` - Built-in dataset name (\`iris\`, \`mtcars\`) OR path to CSV/JSON/JSONL file
- \`x\` - Column name for x-axis
- \`y\` - Column name for y-axis (use \`-\` for histogram)
- \`color\` - Column name for color (optional, use \`-\` to skip)
- \`title\` - Plot title (optional, use \`-\` to skip)
- \`geom\` - Geometry type: \`point\` (default), \`line\`, \`histogram\`, \`boxplot\`, \`bar\`, \`violin\`, \`density\`, \`area\`, etc.

## Inspect & Suggest (for external files)

\`\`\`bash
npx ggterm-plot inspect <data.csv>
npx ggterm-plot suggest <data.csv>
\`\`\`

## Examples

Built-in data:
\`\`\`bash
npx ggterm-plot iris sepal_length sepal_width species "Iris Dataset" point
npx ggterm-plot iris petal_length - species "Petal Length" histogram
npx ggterm-plot mtcars mpg hp cyl "MPG vs HP" point
\`\`\`

External files:
\`\`\`bash
npx ggterm-plot data.csv x y color "Title" point
npx ggterm-plot data.json date value - "Time Series" line
\`\`\`

## Workflow

1. If user asks for iris/mtcars/demo data, use built-in dataset names directly
2. For external files: run \`inspect\` to see columns, then \`suggest\` for recommendations
3. Run the plot command
4. Briefly describe what the plot shows

$ARGUMENTS

## Geom Selection Guide

| Data Question | Geom | Example |
|---------------|------|---------|
| Relationship between 2 variables | \`point\` | Scatter plot |
| Trend over time | \`line\` | Time series |
| Distribution of 1 variable | \`histogram\` | Frequency distribution |
| Distribution by group | \`boxplot\` | Compare medians |
| Category comparison | \`bar\` | Counts per category |
| Smoothed distribution | \`density\` | Kernel density estimate |
| Density shape | \`violin\` | Distribution shape |
| Stacked distributions | \`ridgeline\` | Joy plot |
| Filled region | \`area\` | Cumulative or stacked |
| Cumulative distribution | \`ecdf\` | Empirical CDF |
`
    }
  },
  'ggterm-history': {
    files: {
      'SKILL.md': `---
name: ggterm-history
description: Search and retrieve plots from history. Use when the user asks about previous plots, wants to find a plot they made earlier, re-display a past visualization, or export a historical plot.
allowed-tools: Bash(npx:ggterm-plot*), Read
---

# Plot History Management

Search, retrieve, and export plots from the persistent history.

## CLI Commands

### List All Plots

\`\`\`bash
npx ggterm-plot history
\`\`\`

### Search History

\`\`\`bash
npx ggterm-plot history <search-term>
\`\`\`

### Re-render a Plot

\`\`\`bash
npx ggterm-plot show <plot-id>
\`\`\`

### Export a Plot

\`\`\`bash
npx ggterm-plot export <plot-id> [output.html]
\`\`\`

## Natural Language → Commands

| User Request | Command |
|-------------|---------|
| "What plots have I made?" | \`history\` |
| "Show me my scatter plots" | \`history scatter\` |
| "Find the plot with sales data" | \`history sales\` |
| "Display plot 2024-01-26-001" | \`show 2024-01-26-001\` |
| "Export the iris plot" | \`history iris\` → \`export <id> iris-plot.html\` |

## Plot ID Format

IDs follow the pattern: \`YYYY-MM-DD-NNN\`

$ARGUMENTS
`
    }
  },
  'ggterm-publish': {
    files: {
      'SKILL.md': `---
name: ggterm-publish
description: Export terminal plots to publication-quality formats (PNG, SVG, PDF, HTML). Use when the user wants to save, export, publish, or create a high-quality version of a plot.
allowed-tools: Bash(npx:*), Read, Write
---

# Publication Export with ggterm

Export terminal plots to publication-quality formats using Vega-Lite.

## Prerequisites

The Vega-Lite CLI tools must be installed:

\`\`\`bash
npm install -g vega-lite vega-cli canvas
\`\`\`

## How It Works

When a plot is created with the CLI, ggterm saves:
- \`.ggterm/last-plot.json\` - The PlotSpec (ggterm format)
- \`.ggterm/last-plot-vegalite.json\` - The Vega-Lite spec

## Export Commands

### To PNG (Raster)

\`\`\`bash
npx vl2png .ggterm/last-plot-vegalite.json > plot.png
\`\`\`

### To SVG (Vector)

\`\`\`bash
npx vl2svg .ggterm/last-plot-vegalite.json > plot.svg
\`\`\`

### To PDF

\`\`\`bash
npx vl2pdf .ggterm/last-plot-vegalite.json > plot.pdf
\`\`\`

## Workflow

1. User creates a terminal plot using \`/ggterm-plot\`
2. User asks to export it for publication
3. This skill exports to the requested format

$ARGUMENTS
`
    }
  },
  'ggterm-customize': {
    files: {
      'SKILL.md': `---
name: ggterm-customize
description: Customize plot aesthetics using natural language. Use when the user wants to change colors, fonts, titles, labels, themes, or any visual aspect of a plot before publication.
allowed-tools: Read, Write, Bash(npx:*)
---

# Natural Language Plot Customization

Modify Vega-Lite specifications based on natural language requests.

## Files

After creating a plot, these files exist:
- \`.ggterm/last-plot.json\` - Original PlotSpec
- \`.ggterm/last-plot-vegalite.json\` - Vega-Lite spec to modify

## Common Customizations

### Title and Labels

\`\`\`javascript
spec.title = "New Title"
spec.encoding.x.title = "X Axis Label"
spec.encoding.y.title = "Y Axis Label"
\`\`\`

### Colors

\`\`\`javascript
// Color scheme for categorical data
spec.encoding.color.scale = { scheme: "category10" }

// Color scheme for continuous data
spec.encoding.color.scale = { scheme: "viridis" }
\`\`\`

### Dimensions

\`\`\`javascript
spec.width = 600
spec.height = 400
\`\`\`

## Workflow

1. Read \`.ggterm/last-plot-vegalite.json\`
2. Apply the requested modifications
3. Write the updated spec back to \`.ggterm/last-plot-vegalite.json\`
4. **DONE** — the live viewer auto-detects the change and displays the customized plot

**IMPORTANT**: Do NOT re-create the plot with \`npx ggterm-plot\` after customizing. The viewer watches the spec file and auto-updates. Re-running the plot command would overwrite your customizations.

$ARGUMENTS
`
    }
  },
  'ggterm-style': {
    files: {
      'SKILL.md': `---
name: ggterm-style
description: Apply publication-quality style presets to plots. Use when the user wants to style a plot like Wilke, Tufte, Nature, The Economist, or apply minimal/publication styling.
allowed-tools: Read, Write, Bash(npx:*)
---

# Plot Style Presets

Apply expert-curated style presets to Vega-Lite specifications for publication-quality output.

## Available Presets

| Preset | Inspiration | Key Characteristics |
|--------|-------------|---------------------|
| \`wilke\` | Claus Wilke's *Fundamentals of Data Visualization* | Minimal, clean, no chartjunk, subtle gridlines |
| \`tufte\` | Edward Tufte's data-ink ratio principles | Maximum data-ink, no grid, no borders |
| \`nature\` | Nature journal style | Clean, serif fonts, specific dimensions |
| \`economist\` | The Economist charts | Bold colors, distinctive style |
| \`minimal\` | Generic minimal style | No grid, no borders, clean |
| \`apa\` | APA publication guidelines | Academic papers, grayscale-friendly |

## Workflow

1. Read \`.ggterm/last-plot-vegalite.json\`
2. Apply the requested style preset (only modify \`config\` — do NOT change \`encoding\`, \`data\`, or \`mark\` structure)
3. Write the updated spec back to \`.ggterm/last-plot-vegalite.json\`
4. **DONE** — the live viewer auto-detects the change and displays the styled plot
5. Inform user they can export with \`/ggterm-publish\`

**IMPORTANT**: Do NOT re-create the plot with \`npx ggterm-plot\` after styling. The viewer watches the spec file and auto-updates. Re-running the plot command would overwrite your style changes.

## Response Format

After applying a style:

\`\`\`
Applied **{style}** style to your plot.

Changes:
- {list key visual changes}

Export with \`/ggterm-publish\` to generate PNG/SVG/PDF.
\`\`\`

$ARGUMENTS
`
    }
  },
  'ggterm-markdown': {
    files: {
      'SKILL.md': `---
name: ggterm-markdown
description: Generate markdown reports with embedded ggterm visualizations. Use when creating analysis reports, documenting results, exporting findings, or when the user wants plots in markdown format for sharing or documentation.
allowed-tools: Write, Read, Bash(npx:*)
---

# Markdown Reports with ggterm

Generate analysis reports with embedded terminal visualizations.

## Report Structure

1. **Title and Overview** - What was analyzed and why
2. **Data Summary** - Shape, columns, key statistics
3. **Visualizations** - Embedded plots with interpretations
4. **Findings** - Key insights from the analysis

## Width Guidelines

| Context | Width | Height |
|---------|-------|--------|
| GitHub README | 72-80 | 16-20 |
| GitHub Issues | 72 | 14-18 |
| Documentation | 80-100 | 20-24 |

## Tips

1. **Keep plots compact** - Use 16-20 lines height for readability
2. **Include interpretations** - Don't just show plots, explain them
3. **Save specs** - Include PlotSpec JSON for reproducibility

$ARGUMENTS
`
    }
  }
}

/**
 * Scan directory for data files (CSV, JSON, JSONL)
 */
function findDataFiles(dir: string, maxDepth = 2): string[] {
  const dataFiles: string[] = []
  const dataExtensions = ['.csv', '.json', '.jsonl']

  function scan(currentDir: string, depth: number) {
    if (depth > maxDepth) return

    try {
      const entries = readdirSync(currentDir)
      for (const entry of entries) {
        // Skip hidden directories and node_modules
        if (entry.startsWith('.') || entry === 'node_modules') continue

        const fullPath = join(currentDir, entry)
        try {
          const stat = statSync(fullPath)
          if (stat.isDirectory()) {
            scan(fullPath, depth + 1)
          } else if (dataExtensions.includes(extname(entry).toLowerCase())) {
            dataFiles.push(fullPath)
          }
        } catch {
          // Skip files we can't stat
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  scan(dir, 0)
  return dataFiles
}

/**
 * Get basic info about a data file (fast, no full parse)
 */
function getDataFileInfo(filePath: string): { rows: number; cols: number } | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const ext = extname(filePath).toLowerCase()

    if (ext === '.csv') {
      const lines = content.trim().split('\n')
      const headerCols = lines[0]?.split(',').length || 0
      return { rows: Math.max(0, lines.length - 1), cols: headerCols }
    } else if (ext === '.json') {
      const data = JSON.parse(content)
      if (Array.isArray(data) && data.length > 0) {
        return { rows: data.length, cols: Object.keys(data[0]).length }
      }
    } else if (ext === '.jsonl') {
      const lines = content.trim().split('\n').filter(l => l.trim())
      if (lines.length > 0) {
        const first = JSON.parse(lines[0])
        return { rows: lines.length, cols: Object.keys(first).length }
      }
    }
  } catch {
    // Skip files we can't parse
  }
  return null
}

/**
 * Get recent plots from history
 */
function getRecentPlots(dir: string, limit = 3): Array<{ id: string; description: string }> {
  const historyDir = join(dir, '.ggterm', 'plots')
  if (!existsSync(historyDir)) return []

  try {
    const files = readdirSync(historyDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit)

    return files.map(f => {
      try {
        const content = JSON.parse(readFileSync(join(historyDir, f), 'utf-8'))
        const description = content._provenance?.description || content.description || 'Plot'
        return {
          id: f.replace('.json', ''),
          description
        }
      } catch {
        return { id: f.replace('.json', ''), description: 'Plot' }
      }
    })
  } catch {
    return []
  }
}

export function handleInit(): void {
  const cwd = process.cwd()
  const skillsDir = join(cwd, '.claude', 'skills')
  const ggtermDir = join(cwd, '.ggterm')
  const versionFile = join(ggtermDir, 'version.json')

  // Check current installed version
  let installedVersion: string | null = null
  if (existsSync(versionFile)) {
    try {
      const versionData = JSON.parse(readFileSync(versionFile, 'utf-8'))
      installedVersion = versionData.version
    } catch {
      // Ignore parse errors
    }
  }

  const needsInstall = !existsSync(skillsDir)
  const needsUpdate = installedVersion !== SKILLS_VERSION

  // Install or update skills if needed
  if (needsInstall || needsUpdate) {
    if (needsInstall) {
      console.log('Installing ggterm skills...')
    } else {
      console.log(`Updating ggterm skills (${installedVersion} → ${SKILLS_VERSION})...`)
    }
    console.log('')

    // Create directories
    mkdirSync(skillsDir, { recursive: true })
    mkdirSync(ggtermDir, { recursive: true })

    // Write each skill
    for (const [skillName, skill] of Object.entries(SKILLS)) {
      const skillDir = join(skillsDir, skillName)
      mkdirSync(skillDir, { recursive: true })

      for (const [fileName, content] of Object.entries(skill.files)) {
        writeFileSync(join(skillDir, fileName), content)
      }
      console.log(`  ✓ ${skillName}`)
    }

    // Write version file
    writeFileSync(versionFile, JSON.stringify({ version: SKILLS_VERSION }, null, 2))
    console.log('')
  } else {
    console.log(`ggterm v${SKILLS_VERSION} ready`)
    console.log('')
  }

  // Generate or update CLAUDE.md — this is what Claude Code reads on every conversation start
  const claudeMdPath = join(cwd, 'CLAUDE.md')
  const claudeMdContent = `# ggterm Data Analysis Project

This project uses ggterm (@ggterm/core) for data visualization.

## IMPORTANT: Built-in Datasets

ggterm has built-in datasets that work by name — NO CSV files or Python packages needed:

\`\`\`bash
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot mtcars mpg hp cyl "Cars" point
\`\`\`

| Dataset | Rows | Columns |
|---------|------|---------|
| \`iris\` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| \`mtcars\` | 16 | mpg, cyl, hp, wt, name |

When asked about iris, mtcars, or sample data, use these names directly as the first argument to \`npx ggterm-plot\`. Do NOT search for CSV files or generate data.

## Plotting Commands

\`\`\`bash
npx ggterm-plot <data> <x> <y> [color] [title] [geom]
npx ggterm-plot serve              # Start live viewer (port 4242)
npx ggterm-plot inspect <file>     # Show column types
npx ggterm-plot suggest <file>     # Suggest visualizations
npx ggterm-plot history            # List previous plots
npx ggterm-plot export <id> out.html  # Export plot
\`\`\`

## Geom Types

point, line, histogram, boxplot, bar, violin, density, area, ridgeline, heatmap, scatter, ecdf, smooth, and 50+ more.

## Live Viewer

When \`npx ggterm-plot serve\` is running, plots auto-display in the browser/Wave panel as high-resolution interactive Vega-Lite visualizations instead of ASCII art.

**Style and customize changes also auto-display.** When you modify \`.ggterm/last-plot-vegalite.json\` (via /ggterm-style or /ggterm-customize), the viewer updates automatically. Do NOT re-run \`npx ggterm-plot\` after styling — that would overwrite your changes.
`

  // Only write if doesn't exist or is a ggterm-generated file
  const GGTERM_MARKER = '# ggterm Data Analysis Project'
  let shouldWriteClaudeMd = !existsSync(claudeMdPath)
  if (!shouldWriteClaudeMd) {
    try {
      const existing = readFileSync(claudeMdPath, 'utf-8')
      shouldWriteClaudeMd = existing.startsWith(GGTERM_MARKER)
    } catch {}
  }

  if (shouldWriteClaudeMd) {
    writeFileSync(claudeMdPath, claudeMdContent)
    console.log('  ✓ CLAUDE.md (project instructions for Claude Code)')
    console.log('')
  }

  // Show built-in datasets
  console.log('Built-in datasets:')
  console.log('  • iris (150 rows: sepal_length, sepal_width, petal_length, petal_width, species)')
  console.log('  • mtcars (16 rows: mpg, cyl, hp, wt, name)')
  console.log('')

  // Discover data files
  const dataFiles = findDataFiles(cwd)
  if (dataFiles.length > 0) {
    console.log('Data files:')
    for (const file of dataFiles.slice(0, 10)) {
      const relativePath = file.replace(cwd + '/', '')
      const info = getDataFileInfo(file)
      if (info) {
        console.log(`  • ${relativePath} (${info.rows} rows × ${info.cols} cols)`)
      } else {
        console.log(`  • ${relativePath}`)
      }
    }
    if (dataFiles.length > 10) {
      console.log(`  ... and ${dataFiles.length - 10} more`)
    }
    console.log('')
  }

  // Show recent plots
  const recentPlots = getRecentPlots(cwd)
  if (recentPlots.length > 0) {
    console.log('Recent plots:')
    for (const plot of recentPlots) {
      console.log(`  • ${plot.id}: ${plot.description}`)
    }
    console.log('')
  }

  // Quick tips on first install
  if (needsInstall) {
    console.log('Try:')
    console.log('  npx ggterm-plot iris sepal_length sepal_width species "Iris" point')
    console.log('  npx ggterm-plot serve   # Start live viewer')
    console.log('  "Plot the iris dataset"  # Ask Claude Code')
    console.log('')
  }
}
