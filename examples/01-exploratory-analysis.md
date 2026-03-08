# Exploratory Data Analysis

Discover patterns in the **mtcars** dataset through conversation with Claude Code. Plots appear in the live browser viewer as interactive Vega-Lite visualizations.

**Prerequisites:** Run `npx ggterm-plot setup` to start the live viewer.

## Dataset: mtcars

Performance data for 16 cars from Motor Trend magazine:

| Column | Description |
|--------|-------------|
| name | Car model name |
| mpg | Miles per gallon |
| cyl | Number of cylinders (4, 6, or 8) |
| hp | Horsepower |
| wt | Weight (1000 lbs) |

---

## Conversation

### Round 1: Understanding the Data

**You:** Load the mtcars dataset. What's in it?

**Claude:** Loads the data and summarizes the structure.

> 16 cars with 5 variables. MPG ranges from 10.4 to 24.4, horsepower from 62 to 245. Three cylinder groups: 4, 6, and 8.

---

### Round 2: First Visualization

**You:** Show me the relationship between weight and fuel efficiency.

**Claude:** Creates a scatter plot via `/ggterm-plot`.

> **In the viewer:** A scatter plot with weight on the x-axis and MPG on the y-axis. Hover any point to see the car name and exact values. A clear negative correlation — heavier cars get worse mileage.

---

### Round 3: Adding Context

**You:** Color by number of cylinders.

**Claude:** Adds color encoding — the plot updates in the viewer.

> **In the viewer:** Points are now colored by cylinder count with a legend showing 4-cyl, 6-cyl, and 8-cyl groups. Three clear clusters emerge:
> - **4-cylinder cars** (light, fuel-efficient) — top-left
> - **6-cylinder cars** (moderate) — middle
> - **8-cylinder cars** (heavy, thirsty) — bottom-right
>
> Hover reveals names: the Datsun 710 and Merc 240D lead efficiency, while the Cadillac Fleetwood and Lincoln Continental anchor the heavy end.

---

### Round 4: Adding a Trend Line

**You:** Add a trend line to show the overall pattern.

**Claude:** Adds a regression line overlay.

> **In the viewer:** A dashed trend line appears across the scatter plot, confirming the negative correlation. Cars above the line are more efficient than expected for their weight; cars below are less efficient.

---

### Round 5: Distribution

**You:** What's the distribution of horsepower?

**Claude:** Creates a histogram.

> **In the viewer:** A histogram of horsepower with automatic binning. Most cars cluster between 90–180 HP, with a few high-performance outliers above 200. The distribution is right-skewed.

---

### Round 6: Grouped Comparison

**You:** Compare horsepower across cylinder counts with box plots.

**Claude:** Creates grouped box plots.

> **In the viewer:** Three box plots side by side. 4-cylinder cars have the lowest HP (median ~90), 8-cylinder the highest (median ~180). The IQR for 8-cylinder is widest, showing more variation. Hover the boxes to see exact quartile values.

---

### Round 7: Revisiting Earlier Work

**You:** Go back to the weight vs MPG scatter — I want to see that again.

**Claude:** Retrieves it via `/ggterm-history`.

> **In the viewer:** The colored scatter plot from Round 3 reappears with all styling intact. You can also press `h` in the viewer to open the history sidebar and browse all plots from this session with arrow keys.

---

### Round 8: Customizing for a Report

**You:** Clean up the axis labels — use "Weight (1000 lbs)" and "Fuel Efficiency (MPG)". Add a subtitle "Motor Trend 1974".

**Claude:** Applies customizations via `/ggterm-customize`.

> **In the viewer:** Labels update in place. The plot now reads as a polished figure with proper axis labels and subtitle.

---

## Key Insights

This exploratory session revealed:

1. **Strong weight-MPG inverse correlation** — heavier cars consistently get worse mileage
2. **Clear clustering by cylinder count** — 4/6/8 cylinder groups occupy distinct regions
3. **4-cylinder cars dominate efficiency** — Datsun 710 and Merc 240D are the efficiency leaders
4. **Horsepower distribution is right-skewed** — most cars are moderate, a few are high-performance

All discovered through conversation. The interactive viewer made it easy to hover for details, zoom into clusters, and browse through the analysis history.

## Skills Used

- `/ggterm-plot` — creating all visualizations
- `/ggterm-customize` — refining labels and titles
- `/ggterm-history` — revisiting earlier plots
