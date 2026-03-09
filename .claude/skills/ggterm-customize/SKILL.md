---
name: ggterm-customize
description: Customize plot aesthetics using natural language. Use when the user wants to change colors, fonts, titles, labels, themes, or any visual aspect of a plot before publication.
allowed-tools: Read, Write, Bash(npx:*)
---

# Natural Language Plot Customization

Modify Vega-Lite specifications based on natural language requests.

## CRITICAL: Which File to Edit

**ALWAYS read and write `.ggterm/last-plot-vegalite.json`** — this is the Vega-Lite spec that the viewer renders.

**NEVER modify `.ggterm/last-plot.json`** — that is the ggterm terminal format. Changes to it will NOT appear in the viewer.

## Common Customizations

All examples below modify properties of the Vega-Lite spec read from `.ggterm/last-plot-vegalite.json`:

### Title and Labels

```javascript
spec.title = "New Title"
spec.title = { text: "Title", subtitle: "Subtitle" }
spec.encoding.x.title = "X Axis Label"
spec.encoding.y.title = "Y Axis Label"
spec.encoding.color.title = "Legend Title"
```

### Colors

```javascript
spec.encoding.color.scale = { scheme: "category10" }  // categorical
spec.encoding.color.scale = { scheme: "viridis" }     // continuous
spec.mark.color = "#3366cc"                            // single color
```

### Fonts and Config

```javascript
spec.config = spec.config || {}
spec.config.font = "Helvetica"
spec.config.title = { fontSize: 18, fontWeight: "bold" }
spec.config.axis = { labelFontSize: 12, titleFontSize: 14 }
```

### Dimensions

```javascript
spec.width = 600
spec.height = 400
```

## Workflow

1. Read `.ggterm/last-plot-vegalite.json` (NOT last-plot.json)
2. Parse as JSON, apply the requested modifications
3. Write the updated JSON back to `.ggterm/last-plot-vegalite.json`
4. **DONE** — the live viewer auto-detects the change and displays the customized plot

**IMPORTANT**: Do NOT re-create the plot with `npx ggterm-plot` after customizing. The viewer watches the spec file and auto-updates. Re-running the plot command would overwrite your customizations.

$ARGUMENTS
