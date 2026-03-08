# Streaming Dashboard

Build a real-time monitoring display using the live browser viewer. This vignette showcases the SSE-powered live update capability — plots refresh automatically as new data arrives.

**Prerequisites:** Run `npx ggterm-plot setup` to start the live viewer.

## How Live Streaming Works

The live viewer connects to the ggterm server via Server-Sent Events (SSE). When Claude creates or updates a plot, it appears instantly in the browser — no page refresh needed. For streaming data, each new data batch triggers a plot update that pushes to the viewer automatically.

---

## Conversation

### Round 1: Initial Data

**You:** Generate 50 sample points and show me x vs y.

**Claude:** Generates data and creates a scatter plot via `/ggterm-plot`.

> **In the viewer:** 50 points appear in an interactive scatter plot. The x-y correlation is visible immediately. Hover any point to see exact coordinates and group membership.

---

### Round 2: Group Segmentation

**You:** Color by group to see if there are different patterns.

**Claude:** Adds group color encoding.

> **In the viewer:** Points separate into three groups (A, B, C) with distinct colors and a legend. All three groups follow the same general trend — the grouping is categorical, not structural. Interactive legend: click a group name to toggle its visibility.

---

### Round 3: Alert Thresholds

**You:** Add a warning line at y=40 and a critical line at y=45. I want to monitor for anomalies.

**Claude:** Adds horizontal reference lines with annotations.

> **In the viewer:** Two reference lines appear across the plot:
> - **Yellow dashed line** at y=40 labeled "WARNING"
> - **Red dashed line** at y=45 labeled "CRITICAL"
>
> Points above the warning threshold are immediately visible. The viewer's tooltip shows which points exceed thresholds when you hover.

---

### Round 4: Streaming Updates

**You:** Now generate new batches of 10 points every few seconds to simulate live monitoring. Update the plot each time.

**Claude:** Sets up a streaming loop — each batch triggers a plot update.

> **In the viewer:** The plot updates in real-time as new data arrives:
> - New points appear without page refresh
> - The axes rescale automatically as data expands
> - Threshold lines remain fixed
> - The viewer maintains your current zoom level between updates
>
> This is the core streaming experience — the SSE connection pushes each new plot to the browser instantly.

---

### Round 5: Historical Comparison

**You:** Pause the stream. I want to compare the current state with the initial 50-point plot.

**Claude:** Stops streaming and retrieves the earlier plot via `/ggterm-history`.

> **In the viewer:** Press `h` to open the history sidebar. The timeline shows every plot created during this session — scroll back to the initial scatter plot from Round 1 and the current monitoring view. Use arrow keys to flip between them for quick visual comparison.

---

### Round 6: Dashboard Styling

**You:** Style the monitoring view for a dark dashboard — high contrast colors on a dark background.

**Claude:** Applies dark theme customizations via `/ggterm-customize`.

> **In the viewer:** The plot transforms into a dark-mode monitoring display:
> - Dark background with high-contrast data points
> - Warning line in bright yellow, critical in bright red
> - White axis labels and grid lines
> - Group colors adjusted for dark background visibility
>
> This is optimized for a dedicated monitoring panel in Wave terminal or a wall-mounted display.

---

### Round 7: Multi-Panel Layout

**You:** Split into three panels: the main scatter plot, a histogram of x values, and a histogram of y values.

**Claude:** Creates a multi-panel layout.

> **In the viewer:** Three coordinated panels appear:
> - **Main panel:** The scatter plot with threshold lines
> - **Bottom panel:** Distribution of x values
> - **Right panel:** Distribution of y values
>
> All three panels share the same data and update together during streaming. The distributions show where data concentrates and whether new points are shifting the overall pattern.

---

### Round 8: Export Snapshot

**You:** Export this dashboard for the status report.

**Claude:** Creates a timestamped export via `/ggterm-publish`.

```
Created: monitoring-dashboard-2024-01-28.html (interactive)
Created: monitoring-dashboard-2024-01-28.png (static snapshot)
```

> The HTML export preserves full interactivity — pan, zoom, tooltips. The PNG captures the current state for embedding in reports or slides.

---

## Dashboard Patterns

This session demonstrated:

1. **Live streaming** — plots update in real-time via SSE without page refresh
2. **Threshold monitoring** — reference lines for warning/critical levels
3. **Group segmentation** — color encoding to track different data streams
4. **Historical comparison** — viewer history to compare current vs baseline
5. **Dark mode** — high-contrast styling for monitoring panels
6. **Multi-panel layouts** — coordinated scatter + distribution views
7. **Snapshot export** — capture current state for reports

## Viewer Shortcuts for Monitoring

| Key | Action |
|-----|--------|
| `h` | Toggle history sidebar |
| `←` `→` | Browse historical snapshots |
| `f` | Fullscreen (ideal for wall displays) |
| `s` | Download current view as SVG |
| `p` | Download current view as PNG |

## Skills Used

- `/ggterm-plot` — creating and updating visualizations
- `/ggterm-customize` — dark theme and styling
- `/ggterm-history` — comparing historical snapshots
