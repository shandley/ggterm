---
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
3. **Save specs** - Include PlotSpec JSON for re-rendering

$ARGUMENTS
