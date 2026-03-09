---
name: ggterm-style
description: Apply publication-quality style presets to plots. Use when the user wants to style a plot like Wilke, Tufte, Nature, The Economist, or apply minimal/publication styling.
allowed-tools: Read, Write, Bash(npx:*)
---

# Plot Style Presets

Apply expert-curated style presets to Vega-Lite specifications for publication-quality output.

## CRITICAL: Which File to Edit

**ALWAYS read and write `.ggterm/last-plot-vegalite.json`** — this is the Vega-Lite spec that the viewer renders.

**NEVER modify `.ggterm/last-plot.json`** — that is the ggterm terminal format. Changes to it will NOT appear in the viewer.

## Workflow

1. Read `.ggterm/last-plot-vegalite.json` (NOT last-plot.json)
2. Parse as JSON
3. Set `spec.config` to the style config below — do NOT change `encoding`, `data`, or `mark`
4. Write the updated JSON back to `.ggterm/last-plot-vegalite.json`
5. **DONE** — the live viewer auto-detects the change and displays the styled plot

**IMPORTANT**: Do NOT re-create the plot with `npx ggterm-plot` after styling. Re-running would overwrite your style changes.

## Style Configs (Vega-Lite `config` property)

### Wilke (default for "publication ready")

```json
{
  "font": "Helvetica Neue, Helvetica, Arial, sans-serif",
  "background": "white",
  "view": { "stroke": null },
  "title": { "fontSize": 14, "fontWeight": "normal", "anchor": "start", "offset": 12 },
  "axis": { "domain": true, "domainColor": "#333333", "domainWidth": 1, "grid": false, "labelColor": "#333333", "labelFontSize": 11, "tickColor": "#333333", "tickSize": 5, "titleColor": "#333333", "titleFontSize": 12, "titleFontWeight": "normal", "titlePadding": 10 },
  "axisY": { "grid": true, "gridColor": "#ebebeb", "gridWidth": 0.5 },
  "legend": { "labelFontSize": 11, "titleFontSize": 11, "titleFontWeight": "normal", "symbolSize": 100 },
  "range": { "category": ["#4C78A8", "#F58518", "#E45756", "#72B7B2", "#54A24B", "#EECA3B", "#B279A2", "#FF9DA6"] }
}
```

### Tufte

```json
{
  "font": "Georgia, serif",
  "background": "white",
  "view": { "stroke": null },
  "title": { "fontSize": 13, "fontWeight": "normal", "anchor": "start" },
  "axis": { "domain": false, "grid": false, "labelColor": "#333333", "labelFontSize": 10, "ticks": false, "titleColor": "#333333", "titleFontSize": 11, "titleFontWeight": "normal" },
  "legend": { "labelFontSize": 10, "titleFontSize": 10, "titleFontWeight": "normal" },
  "range": { "category": ["#333333", "#666666", "#999999", "#CCCCCC"] }
}
```

### Nature

```json
{
  "font": "Arial, Helvetica, sans-serif",
  "background": "white",
  "view": { "stroke": null },
  "title": { "fontSize": 10, "fontWeight": "bold" },
  "axis": { "domain": true, "domainColor": "#000000", "domainWidth": 0.5, "grid": false, "labelColor": "#000000", "labelFontSize": 8, "tickColor": "#000000", "tickSize": 4, "tickWidth": 0.5, "titleColor": "#000000", "titleFontSize": 9, "titleFontWeight": "normal" },
  "legend": { "labelFontSize": 8, "titleFontSize": 8, "symbolSize": 50 }
}
```

### Economist

```json
{
  "font": "Officina Sans, Arial, sans-serif",
  "background": "#d5e4eb",
  "view": { "stroke": null },
  "title": { "fontSize": 14, "fontWeight": "bold", "color": "#000000", "anchor": "start" },
  "axis": { "domain": false, "grid": true, "gridColor": "#ffffff", "gridWidth": 1, "labelColor": "#000000", "labelFontSize": 11, "titleFontSize": 12, "titleFontWeight": "bold" },
  "axisX": { "grid": false, "domain": true, "domainColor": "#000000" },
  "legend": { "orient": "top", "labelFontSize": 11, "titleFontSize": 11 },
  "range": { "category": ["#006BA2", "#3EBCD2", "#379A8B", "#EBB434", "#B4BA39", "#9A607F", "#D73F3F"] }
}
```

### Minimal

```json
{
  "font": "system-ui, -apple-system, sans-serif",
  "background": "white",
  "view": { "stroke": null },
  "title": { "fontSize": 14, "fontWeight": "normal" },
  "axis": { "domain": false, "grid": false, "ticks": false, "labelColor": "#666666", "labelFontSize": 11, "titleColor": "#333333", "titleFontSize": 12, "titleFontWeight": "normal" },
  "legend": { "labelFontSize": 11, "titleFontSize": 11, "titleFontWeight": "normal" }
}
```

### APA

```json
{
  "font": "Times New Roman, serif",
  "background": "white",
  "view": { "stroke": null },
  "title": { "fontSize": 12, "fontWeight": "bold", "anchor": "middle" },
  "axis": { "domain": true, "domainColor": "#000000", "grid": false, "labelColor": "#000000", "labelFontSize": 10, "tickColor": "#000000", "titleColor": "#000000", "titleFontSize": 11, "titleFontWeight": "normal", "titleFontStyle": "italic" },
  "legend": { "labelFontSize": 10, "titleFontSize": 10, "titleFontStyle": "italic" },
  "range": { "category": ["#000000", "#666666", "#999999", "#CCCCCC"] }
}
```

## Response Format

After applying a style:

```
Applied **{style}** style to your plot.

Changes:
- {list key visual changes}

Export with `/ggterm-publish` to generate PNG/SVG/PDF.
```

$ARGUMENTS
