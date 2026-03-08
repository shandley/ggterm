# Live Plot Viewer

The ggterm live viewer is an interactive browser panel that displays your plots as Vega-Lite visualizations. It connects to the ggterm server via Server-Sent Events (SSE) and updates automatically as you create or modify plots.

## Starting the Viewer

```bash
npx ggterm-plot serve          # default port 4242
npx ggterm-plot serve 8080     # custom port
```

Or use the one-command setup which starts the viewer automatically:

```bash
npx ggterm-plot setup
```

The viewer opens at `http://localhost:4242`. In [Wave terminal](https://www.waveterm.dev/), it auto-detects and opens as a side panel.

## Keyboard Shortcuts

All shortcuts work when the viewer has focus. Shortcuts are disabled while typing in the command palette.

| Key | Action |
|-----|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `h` | Toggle history sidebar |
| `←` | Previous plot |
| `→` | Next plot |
| `Home` | Jump to first plot |
| `End` | Jump to latest plot |
| `s` | Download current plot as SVG |
| `p` | Download current plot as PNG (2x resolution) |
| `f` | Toggle fullscreen |
| `?` | Open help panel |
| `Esc` | Close any open panel (palette, help, history) |

## Command Palette

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the command palette. It provides fuzzy search across all viewer actions and every geometry type.

### How It Works

1. Start typing to filter — matches against command names, categories, and descriptions
2. Use **Arrow Up/Down** to navigate results
3. Press **Enter** to execute the selected command
4. Press **Esc** to close

### Available Commands

The palette contains 80+ commands organized into categories:

| Category | Commands | What they do |
|----------|----------|-------------|
| **Export** | Export as SVG, Export as PNG | Download the current plot |
| **View** | Toggle Fullscreen, Toggle History Panel, Open Help | Control viewer panels |
| **Navigate** | Previous Plot, Next Plot, First Plot, Latest Plot | Browse plot history |
| **Style** | Wilke, Tufte, Nature, Economist, Minimal, APA | Open the Styles help tab |
| **Point/Line** | geom_point, geom_line, geom_path, geom_step, ... | Browse geometry reference |
| **Bar/Area** | geom_bar, geom_histogram, geom_density, ... | Browse geometry reference |
| **Distribution** | geom_boxplot, geom_violin, geom_ridgeline, ... | Browse geometry reference |
| **+ 7 more categories** | All 66 geometry types searchable | Browse geometry reference |

### Fuzzy Matching

The palette uses fuzzy matching — you don't need to type exact names:

- Type `scat` to find `geom_point` (via "Scatter plot" description)
- Type `surv` to find `geom_kaplan_meier` (via "Survival curves" description)
- Type `svg` to find the SVG export command
- Type `wil` to find the Wilke style preset

## History Sidebar

Press **h** to toggle the history sidebar. It slides in from the left and shows your recent plots.

### What Each Entry Shows

- **Plot ID** — date-based identifier (e.g., `2026-03-07-001`)
- **Description** — auto-generated summary (e.g., "Scatter plot of sepal_length vs petal_length by species")
- **Geom types** — badge showing the geometry used (e.g., `point`, `histogram+smooth`)
- **Timestamp** — when the plot was created

### Navigation

- Click any history entry to display that plot
- Use **←** / **→** arrow keys to step through plots sequentially
- Use **Home** / **End** to jump to the first or most recent plot
- The active plot is highlighted in the sidebar and auto-scrolls into view

### Lazy Loading

The sidebar loads plot metadata immediately but fetches full plot specifications on demand. When you navigate to an older plot, the viewer requests the full spec from the server — this keeps the initial load fast even with hundreds of plots in history.

### Persistence

Plot history is stored in `.ggterm/plots/` as individual JSON files with an append-only index at `.ggterm/history.jsonl`. History persists across sessions — restart the server and all your previous plots are still available.

## Help Panel

Press **?** to open the help panel. It's organized into five tabs:

| Tab | Contents |
|-----|----------|
| **Getting Started** | Welcome overview, Claude Code tips, CLI examples, built-in datasets |
| **Plot Types** | Visual grid of all 66 geometry types organized by category, with descriptions |
| **Shortcuts** | Complete keyboard shortcut reference |
| **Styles** | All 6 publication style presets with descriptions and usage examples |
| **Export** | Export options from viewer, CLI, and Claude Code, including prerequisites |

Click the tab headers to switch between sections.

## Exporting Plots

### From the Viewer

- Press **s** to download SVG (vector, scalable)
- Press **p** to download PNG (raster, 2x resolution for sharp display)

Files are named using the plot ID (e.g., `2026-03-07-001.svg`).

### From Claude Code

```
You: Export this plot as PNG
You: Save as SVG for my paper
```

Or use the `/ggterm-publish` skill directly.

### From the CLI

```bash
npx ggterm-plot export <plot-id> output.html    # Interactive HTML
npx vl2png .ggterm/last-plot-vegalite.json > plot.png
npx vl2svg .ggterm/last-plot-vegalite.json > plot.svg
```

PNG/SVG CLI export requires: `npm install -g vega-lite vega-cli canvas`

## How It Works

### Architecture

```
Terminal (Claude Code)          Browser (Live Viewer)
        │                              │
        ├── npx ggterm-plot ...        │
        │   writes to .ggterm/plots/   │
        │                              │
        │      ┌─── SSE push ──────────┤
        │      │                       │
   serve.ts ───┤  fs.watch() detects   │
               │  new plot files       ├── vegaEmbed() renders
               │                       │   Vega-Lite spec
               └─── SSE push ─────────┤
                    (style changes)    ├── auto-updates in place
```

1. **Plot creation**: When you create a plot via CLI or Claude Code, ggterm writes the spec to `.ggterm/plots/<id>.json` and `.ggterm/last-plot-vegalite.json`
2. **File watching**: The server watches `.ggterm/plots/` for new files and `.ggterm/last-plot-vegalite.json` for style changes
3. **SSE push**: New plots trigger a `plot` event (added to history). Style changes trigger an `update` event (replaces current plot in-place, no new history entry)
4. **Rendering**: The viewer uses [Vega-Embed](https://github.com/vega/vega-embed) to render interactive Vega-Lite specifications with a GitHub Dark theme

### Auto-Reconnection

If the connection drops (e.g., server restart), the viewer automatically reconnects via the EventSource API's built-in retry mechanism.

### Responsive Layout

The viewer uses a `ResizeObserver` to detect container size changes and reflows the plot automatically. Plots use `width: 'container'` and `height: 'container'` for fluid sizing.

## Style Changes

When you apply a style preset or customize a plot, the viewer updates in place without creating a new history entry:

1. The `/ggterm-style` or `/ggterm-customize` skill edits `.ggterm/last-plot-vegalite.json`
2. The server detects the file change and pushes an `update` SSE event
3. The viewer re-renders the current plot with the new styling

This means you can iterate on styles rapidly without cluttering your history.

## Troubleshooting

### Port Already in Use

```
Error: EADDRINUSE: port 4242 is already in use
Kill existing process: kill $(lsof -ti:4242)
```

### Plots Not Appearing

- Ensure the server is running (`npx ggterm-plot serve`)
- Check that the browser tab is connected (green dot in the status bar)
- Verify `.ggterm/` directory exists in your working directory

### Export Buttons Not Working

SVG and PNG export require a rendered plot. If the viewer shows "waiting for plots...", create a plot first.
