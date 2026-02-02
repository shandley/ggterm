# ggterm REPL

An interactive shell for exploring data and building plots with the grammar of graphics.

## Quick Start

```bash
# Start the interactive REPL
npx ggterm

# Or with options
npx ggterm --width 100 --height 30
```

## CLI Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --version` | Show version |
| `-e, --execute <code>` | Execute code and exit |
| `-w, --width <n>` | Set plot width (default: 70) |
| `-H, --height <n>` | Set plot height (default: 20) |
| `--no-colors` | Disable colors |

## REPL Commands

Commands start with a dot (`.`):

### Data Management

```
.data                   Show current data summary
.data clear             Clear current data
.data sample <n>        Generate n sample rows
.data iris              Load Iris dataset
.data mtcars            Load mtcars dataset
.load <file.json>       Load data from JSON file
```

### Plotting

```
.plot                   Render current plot
.size <width> <height>  Set plot dimensions
.theme <name>           Set theme (default, minimal, dark)
.save <filename>        Save plot to file
```

### General

```
.help                   Show help
.help <topic>           Show topic help (geoms, scales, aes)
.examples               Show example code
.history                Show command history
.vars                   Show defined variables
.clear                  Clear screen
.reset                  Reset state
.quit                   Exit REPL
```

## Building Plots

The REPL provides all ggterm functions in scope. Build plots using the grammar of graphics:

```javascript
// Load sample data
.data sample 50

// Create a scatter plot
p = gg(data).aes({x: "x", y: "y"}).geom(geom_point())

// Add color by group
p = gg(data).aes({x: "x", y: "y", color: "group"}).geom(geom_point())

// Add labels
p = gg(data)
  .aes({x: "x", y: "y"})
  .geom(geom_point())
  .labs({title: "My Plot", x: "X Axis", y: "Y Axis"})
```

## Available Functions

### Geometries

| Function | Description |
|----------|-------------|
| `geom_point()` | Scatter plot |
| `geom_line()` | Line chart |
| `geom_bar()` | Bar chart |
| `geom_histogram()` | Histogram |
| `geom_boxplot()` | Box plot |
| `geom_area()` | Area chart |
| `geom_tile()` | Heatmap tiles |
| `geom_errorbar()` | Error bars |
| `geom_hline()` | Horizontal line |
| `geom_vline()` | Vertical line |
| `geom_text()` | Text labels |

### Scales

| Function | Description |
|----------|-------------|
| `scale_x_continuous()` | Continuous X axis |
| `scale_y_continuous()` | Continuous Y axis |
| `scale_x_log10()` | Log scale X |
| `scale_y_log10()` | Log scale Y |
| `scale_color_viridis()` | Viridis color palette |
| `scale_color_discrete()` | Discrete colors |
| `scale_fill_viridis()` | Viridis fill palette |

### Faceting

| Function | Description |
|----------|-------------|
| `facet_wrap("var")` | Wrap by variable |
| `facet_grid({rows, cols})` | Grid faceting |

### Themes

| Function | Description |
|----------|-------------|
| `defaultTheme()` | Default theme |
| `themeMinimal()` | Minimal theme |
| `themeDark()` | Dark theme |

## Utility Functions

The REPL includes helper functions for generating data:

```javascript
// Range of integers
range(0, 10)        // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Random numbers
random(5)           // [0.23, 0.87, 0.12, 0.95, 0.44]

// Sequence with step
seq(0, 10, 2)       // [0, 2, 4, 6, 8, 10]

// Normal distribution
rnorm(100, 0, 1)    // 100 samples from N(0,1)
```

## Sample Datasets

### Iris Dataset

Classic iris flower dataset with sepal/petal measurements:

```
.data iris
```

Columns: `sepal_length`, `sepal_width`, `petal_length`, `petal_width`, `species`

```javascript
gg(data)
  .aes({x: "sepal_length", y: "petal_length", color: "species"})
  .geom(geom_point())
```

### mtcars Dataset

Car performance data:

```
.data mtcars
```

Columns: `name`, `mpg`, `cyl`, `hp`, `wt`

```javascript
gg(data)
  .aes({x: "wt", y: "mpg", color: "cyl"})
  .geom(geom_point())
  .labs({title: "Fuel Efficiency", x: "Weight", y: "MPG"})
```

## Examples

### Basic Scatter Plot

```javascript
.data sample 30
gg(data).aes({x: "x", y: "y"}).geom(geom_point())
```

### Line Chart with Points

```javascript
.data sample 20
gg(data)
  .aes({x: "x", y: "y"})
  .geom(geom_line())
  .geom(geom_point())
```

### Colored by Group

```javascript
.data sample 50
gg(data)
  .aes({x: "x", y: "y", color: "group"})
  .geom(geom_point())
  .scale(scale_color_viridis())
```

### Histogram

```javascript
// Generate random data
data = rnorm(100, 50, 10).map(v => ({value: v}))
gg(data).aes({x: "value"}).geom(geom_histogram({bins: 20}))
```

### Bar Chart

```javascript
data = [{cat: "A", val: 30}, {cat: "B", val: 45}, {cat: "C", val: 25}]
gg(data).aes({x: "cat", y: "val"}).geom(geom_bar({stat: "identity"}))
```

### With Theme

```javascript
.data iris
gg(data)
  .aes({x: "sepal_length", y: "petal_length", color: "species"})
  .geom(geom_point())
  .theme(themeDark())
```

### Save Plot

```javascript
.data sample 50
gg(data).aes({x: "x", y: "y"}).geom(geom_point())
.save myplot.txt
```

## One-Liner Execution

Execute code directly without entering the REPL:

```bash
# Quick scatter plot
npx ggterm -e ".data sample 30; gg(data).aes({x:'x',y:'y'}).geom(geom_point())"

# Custom dimensions
npx ggterm -w 100 -H 30 -e ".data iris; gg(data).aes({x:'sepal_length',y:'petal_length',color:'species'}).geom(geom_point())"
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Auto-complete commands and functions |
| `Up/Down` | Navigate command history |
| `Ctrl+C` | Cancel current input |
| `Ctrl+D` | Exit REPL |

## Tips

1. **Auto-render**: By default, plots render automatically when you create them. The last plot is stored and can be re-rendered with `.plot`.

2. **Variables**: Assign plots to variables for later modification:
   ```javascript
   p = gg(data).aes({x: "x", y: "y"}).geom(geom_point())
   p.labs({title: "Updated Title"})
   ```

3. **Data exploration**: Use `.data` to see a summary of your current data including column names.

4. **Theme switching**: Apply themes to existing plots:
   ```javascript
   .theme dark
   ```

5. **Resize plots**: Adjust dimensions on the fly:
   ```javascript
   .size 100 30
   .plot
   ```

## See Also

- [Quick Start Guide](./QUICKSTART.md)
- [API Reference](./API.md)
- [Geometry Reference](./GEOM-REFERENCE.md)
