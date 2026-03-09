---
name: ggterm-history
description: Search and retrieve plots from history. Use when the user asks about previous plots, wants to find a plot they made earlier, re-display a past visualization, or export a historical plot.
allowed-tools: Bash(npx:ggterm-plot*), Read
---

# Plot History Management

Search, retrieve, and export plots from the persistent history.

## CLI Commands

### List All Plots

```bash
npx ggterm-plot history
```

### Search History

```bash
npx ggterm-plot history <search-term>
```

### Re-render a Plot

```bash
npx ggterm-plot show <plot-id>
```

### Export a Plot

```bash
npx ggterm-plot export <plot-id> [output.html]
```

## Natural Language → Commands

| User Request | Command |
|-------------|---------|
| "What plots have I made?" | `history` |
| "Show me my scatter plots" | `history scatter` |
| "Find the plot with sales data" | `history sales` |
| "Display plot 2024-01-26-001" | `show 2024-01-26-001` |
| "Export the iris plot" | `history iris` → `export <id> iris-plot.html` |

## Plot ID Format

IDs follow the pattern: `YYYY-MM-DD-NNN`

$ARGUMENTS
