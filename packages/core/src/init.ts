/**
 * Initialize ggterm skills in the current directory
 *
 * Creates .claude/skills/ with all ggterm skills configured for npx usage
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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

## Quick Patterns by Format

### CSV

\`\`\`typescript
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

const text = readFileSync('data.csv', 'utf-8')
const data = parse(text, {
  columns: true,        // First row as headers
  cast: true,           // Auto-convert numbers
  skip_empty_lines: true
})
\`\`\`

**Alternative with d3-dsv** (lighter weight):

\`\`\`typescript
import { csvParse, autoType } from 'd3-dsv'

const data = csvParse(readFileSync('data.csv', 'utf-8'), autoType)
\`\`\`

### JSON

\`\`\`typescript
import { readFileSync } from 'fs'

// JSON array
const data = JSON.parse(readFileSync('data.json', 'utf-8'))
\`\`\`

### JSONL (Newline-delimited JSON)

\`\`\`typescript
const data = readFileSync('data.jsonl', 'utf-8')
  .trim()
  .split('\\n')
  .map(line => JSON.parse(line))
\`\`\`

## Verification

After loading, always verify the data structure:

\`\`\`typescript
console.log(\`Loaded \${data.length} rows\`)
console.log('Columns:', Object.keys(data[0]))
console.log('Sample row:', data[0])
\`\`\`

## Integration with ggterm

Once data is loaded, pass directly to ggterm:

\`\`\`typescript
import { gg, geom_point } from '@ggterm/core'

const data = loadData('measurements.csv')

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_point())

console.log(plot.render({ width: 80, height: 24 }))
\`\`\`
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

Create plots using the CLI tool. Start by inspecting the data, then plot.

## Step 1: Inspect Data (Recommended)

\`\`\`bash
npx ggterm-plot inspect <data.csv>
\`\`\`

Shows column names, types (numeric/categorical/date), unique counts, and sample values.

## Step 2: Get Suggestions (Optional)

\`\`\`bash
npx ggterm-plot suggest <data.csv>
\`\`\`

Returns ready-to-run plot commands based on column types.

## Step 3: Create Plot

\`\`\`bash
npx ggterm-plot <data.csv> <x> <y> [color] [title] [geom]
\`\`\`

Arguments:
- \`data.csv\` - Path to CSV file
- \`x\` - Column name for x-axis
- \`y\` - Column name for y-axis (use \`-\` for histogram)
- \`color\` - Column name for color (optional, use \`-\` to skip)
- \`title\` - Plot title (optional, use \`-\` to skip)
- \`geom\` - Geometry type: \`point\` (default), \`line\`, \`histogram\`, \`boxplot\`, \`bar\`, \`violin\`, \`area\`, etc.

## Examples

Scatter plot:
\`\`\`bash
npx ggterm-plot data.csv sepal_length sepal_width species "Iris Dataset" point
\`\`\`

Histogram:
\`\`\`bash
npx ggterm-plot data.csv sepal_width - - "Sepal Width Distribution" histogram
\`\`\`

Box plot:
\`\`\`bash
npx ggterm-plot data.csv treatment response_time - "Response by Treatment" boxplot
\`\`\`

## Workflow

1. Identify the data file from $ARGUMENTS or ask user
2. Run \`inspect\` to see column names and types
3. Run \`suggest\` to get recommended visualizations (or choose based on user request)
4. Run the plot command
5. Briefly describe what the plot shows

$ARGUMENTS

## Geom Selection Guide

| Data Question | Geom | Example |
|---------------|------|---------|
| Relationship between 2 variables | \`point\` | Scatter plot |
| Trend over time | \`line\` | Time series |
| Distribution of 1 variable | \`histogram\` | Frequency distribution |
| Distribution by group | \`boxplot\` | Compare medians |
| Category comparison | \`bar\` | Counts per category |
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
allowed-tools: Read, Write
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

1. User asks to customize plot (e.g., "make the points blue and increase font size")
2. Read \`.ggterm/last-plot-vegalite.json\`
3. Apply the requested modifications
4. Write the updated spec
5. Optionally show preview or suggest export

$ARGUMENTS
`
    }
  },
  'ggterm-style': {
    files: {
      'SKILL.md': `---
name: ggterm-style
description: Apply publication-quality style presets to plots. Use when the user wants to style a plot like Wilke, Tufte, Nature, The Economist, or apply minimal/publication styling.
allowed-tools: Read, Write
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
2. Apply the requested style preset
3. Write the updated spec
4. Inform user they can export with \`/ggterm-publish\`

## Style Configurations

### Wilke Style (Recommended Default)

\`\`\`javascript
const wilkeStyle = {
  config: {
    font: "Helvetica Neue, Helvetica, Arial, sans-serif",
    background: "white",
    view: { stroke: null },
    title: { fontSize: 14, fontWeight: "normal", anchor: "start" },
    axis: { grid: false, labelFontSize: 11, titleFontSize: 12 },
    axisY: { grid: true, gridColor: "#ebebeb" }
  }
}
\`\`\`

### Tufte Style

\`\`\`javascript
const tufteStyle = {
  config: {
    font: "Georgia, serif",
    view: { stroke: null },
    axis: { domain: false, grid: false, ticks: false }
  }
}
\`\`\`

### Economist Style

\`\`\`javascript
const economistStyle = {
  config: {
    background: "#d5e4eb",
    axis: { grid: true, gridColor: "#ffffff" },
    axisX: { grid: false, domain: true }
  }
}
\`\`\`

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

## Embedding Plots

\`\`\`markdown
## Visualization

\\\`\\\`\\\`
[terminal plot output here]
\\\`\\\`\\\`

**Interpretation**: The scatter plot shows [describe the relationship observed].
\`\`\`

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

export function handleInit(): void {
  const cwd = process.cwd()
  const skillsDir = join(cwd, '.claude', 'skills')

  // Check if skills already exist
  if (existsSync(skillsDir)) {
    console.log('⚠️  .claude/skills/ already exists')
    console.log('')
    console.log('To reinstall, remove the directory first:')
    console.log('  rm -rf .claude/skills')
    console.log('  npx ggterm-plot init')
    return
  }

  console.log('Initializing ggterm skills...')
  console.log('')

  // Create skills directory
  mkdirSync(skillsDir, { recursive: true })

  // Write each skill
  for (const [skillName, skill] of Object.entries(SKILLS)) {
    const skillDir = join(skillsDir, skillName)
    mkdirSync(skillDir, { recursive: true })

    for (const [fileName, content] of Object.entries(skill.files)) {
      writeFileSync(join(skillDir, fileName), content)
    }
    console.log(`  ✓ ${skillName}`)
  }

  console.log('')
  console.log('Done! ggterm skills installed to .claude/skills/')
  console.log('')
  console.log('You can now use Claude Code to create visualizations:')
  console.log('  "Load my data and show me a scatter plot of x vs y"')
  console.log('  "Create a histogram of the age column"')
  console.log('  "Style this like Tufte and export as PNG"')
  console.log('')
  console.log('Make sure @ggterm/core is installed:')
  console.log('  npm install @ggterm/core')
}
