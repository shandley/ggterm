# ggterm: A Grammar of Graphics for Terminal-Based Scientific Visualization and AI-Assisted Analysis

**Authors:** Scott A. Handley^1^

^1^ [Affiliation to be added]

**Corresponding author:** [email]

**Keywords:** data visualization, grammar of graphics, scientific computing, artificial intelligence, terminal interface, reproducibility, bioinformatics

---

## Abstract

Visual exploratory data analysis is fundamental to scientific computing, yet terminal environments—where most computational research occurs—lack sophisticated visualization capabilities. We present ggterm, a TypeScript implementation of Wilkinson's Grammar of Graphics featuring 68 geometry types designed for terminal rendering and AI agent integration. ggterm provides comprehensive scientific visualization support including genomics plots (volcano, MA, Manhattan), clinical trial graphics (Kaplan-Meier survival curves, forest plots, ROC curves), statistical diagnostics (Q-Q plots, ECDF, control charts, funnel plots), and hierarchical visualizations (dendrograms, UpSet plots for set intersections). The library implements a declarative, composable API where visualizations are specified as layered grammar components—data, aesthetics, geometries, scales, coordinates, and facets—enabling natural language interaction with AI assistants. All plots are automatically persisted with full provenance metadata in a structured history system, enabling search, retrieval, and reproducibility. Plot specifications are stored as JSON documents that capture the complete analytical context, from data source to visual encoding decisions. We provide seven deterministic skills for Claude Code integration, supporting workflows from data loading through publication-quality export via Vega-Lite. ggterm bridges the gap between rapid terminal exploration and reproducible scientific figures, available under the MIT license at https://github.com/shandley/ggterm.

---

## Introduction

Scientific computing increasingly occurs in terminal environments—remote servers, compute clusters, containerized pipelines, and cloud instances—where graphical display capabilities are limited or absent. Researchers routinely SSH into analysis servers, submit batch jobs, and inspect results through text interfaces. Yet visualization, the primary tool for exploratory data analysis (EDA), has remained poorly supported in these environments.

Existing terminal plotting libraries offer basic functionality through imperative APIs: call a function, pass arrays, receive output. This approach limits both the sophistication of visualizations and their integration with modern AI-assisted workflows. When a researcher asks an AI assistant "show me the survival curves stratified by treatment arm," the assistant must translate this request into tool-specific syntax that varies across libraries and offers no compositional structure for iterative refinement.

Simultaneously, scientific visualization has domain-specific requirements that general-purpose plotting tools often neglect. Genomics researchers need volcano plots and Manhattan plots. Clinical trialists need Kaplan-Meier curves and forest plots. Statisticians need Q-Q plots and control charts. These specialized visualizations encode domain knowledge—significance thresholds, hazard ratios, theoretical distributions—that generic scatter plots cannot express.

We identified four gaps in the current landscape:

1. **No Grammar of Graphics for terminals.** The Grammar of Graphics, formalized by Wilkinson (2005) and popularized through R's ggplot2 (Wickham, 2016), provides a declarative framework for constructing visualizations from composable layers. This approach maps naturally to both human reasoning and AI code generation, yet no terminal-native implementation exists.

2. **Limited scientific visualization support.** Terminal plotting libraries focus on basic chart types. Domain-specific visualizations—essential for genomics, clinical research, and statistical analysis—require graphical environments or specialized tools.

3. **No reproducibility infrastructure.** Terminal plots are ephemeral. Once scrolled off-screen, they are lost. There is no standard mechanism to store, retrieve, or reproduce previous visualizations, undermining the reproducibility that scientific workflows require.

4. **No AI agent integration.** As AI coding assistants become standard tools in scientific computing, visualization libraries need APIs designed for conversational interaction—declarative specifications that AI can generate, modify, and compose.

ggterm addresses these gaps through a comprehensive Grammar of Graphics implementation featuring 68 geometry types, structured plot history with provenance tracking, and first-class support for AI agent integration.

---

## Design and Implementation

### Grammar of Graphics Architecture

ggterm implements the layered grammar of graphics (Wickham, 2010) with seven core components that compose to create arbitrarily complex visualizations:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Data** | Input dataset as array of records | CSV, JSON, JSONL files; API responses |
| **Aesthetics** | Variable-to-visual mappings | x, y, color, size, shape, fill, alpha |
| **Geometries** | Visual mark types | Points, lines, bars, survival curves |
| **Statistics** | Data transformations | Binning, density estimation, survival |
| **Scales** | Value-to-visual encoding | Linear, log, color palettes, datetime |
| **Coordinates** | Coordinate systems | Cartesian, polar, flipped |
| **Facets** | Small multiples | Wrap by variable, grid by two variables |

Visualizations are constructed by composing these layers through a fluent API:

```typescript
gg(expressionData)
  .aes({ x: 'log2FoldChange', y: 'negLog10Pvalue', color: 'significant' })
  .geom(geom_point({ alpha: 0.6 }))
  .geom(geom_hline({ yintercept: -Math.log10(0.05) }))
  .geom(geom_vline({ xintercept: [-1, 1] }))
  .scale(scale_color_manual({ values: { true: '#e41a1c', false: '#999999' } }))
  .labs({ title: 'Differential Expression', x: 'log2 Fold Change', y: '-log10(p-value)' })
```

This declarative specification describes *what* to visualize without prescribing rendering details. The same specification renders appropriately across terminal widths, color capabilities, and output formats.

### Data Handling

ggterm operates on arrays of records (objects), the natural data structure for tabular data in JavaScript/TypeScript:

```typescript
const data = [
  { gene: 'BRCA1', expression: 12.5, treatment: 'control' },
  { gene: 'BRCA1', expression: 8.2, treatment: 'drug' },
  { gene: 'TP53', expression: 15.1, treatment: 'control' },
  // ...
]
```

The library provides flexible data loading for common formats:

| Format | Characteristics | Use Case |
|--------|-----------------|----------|
| **CSV** | Comma-separated, ubiquitous | Exported from Excel, R, pandas |
| **JSON** | Native JavaScript, typed | API responses, structured data |
| **JSONL** | Newline-delimited JSON | Streaming data, log files |

Type inference automatically detects numeric, categorical, and datetime columns. Explicit type coercion handles edge cases:

```typescript
// Automatic type inference
const data = loadCSV('results.csv')  // Numbers parsed, dates detected

// Explicit coercion for ambiguous cases
const typed = data.map(row => ({
  ...row,
  pvalue: Number(row.pvalue),
  date: new Date(row.date).getTime()
}))
```

Aesthetic mappings reference column names as strings, enabling dynamic specification:

```typescript
// Column names as strings enable AI-generated specifications
gg(data).aes({ x: userSpecifiedX, y: userSpecifiedY, color: groupingVar })
```

### Geometry Types

ggterm implements 68 geometry types organized by analytical domain:

#### Core Visualizations (20 types)
Basic building blocks for general-purpose visualization:

- **Point/Line:** `geom_point`, `geom_line`, `geom_path`, `geom_step`, `geom_segment`, `geom_curve`
- **Distribution:** `geom_histogram`, `geom_density`, `geom_freqpoly`, `geom_boxplot`, `geom_violin`
- **Comparison:** `geom_bar`, `geom_col`, `geom_errorbar`, `geom_pointrange`, `geom_crossbar`
- **Area:** `geom_area`, `geom_ribbon`
- **Reference:** `geom_hline`, `geom_vline`, `geom_abline`

#### Scientific Visualizations (15 types)
Domain-specific plots for research applications:

- **Genomics:** `geom_volcano` (differential expression), `geom_ma` (MA plots), `geom_manhattan` (GWAS)
- **Matrices:** `geom_heatmap` (expression matrices), `geom_corrmat` (correlation), `geom_biplot` (PCA)
- **Hierarchy:** `geom_treemap`, `geom_sankey` (flow), `geom_flame`/`geom_icicle` (profiling)
- **Temporal:** `geom_calendar` (activity heatmaps)

#### Clinical and Biostatistical (4 types)
Visualizations for clinical trials and medical research:

- `geom_kaplan_meier`: Survival curves with confidence intervals and risk tables
- `geom_forest`: Meta-analysis forest plots with effect sizes and confidence intervals
- `geom_roc`: Receiver operating characteristic curves with AUC
- `geom_bland_altman`: Method comparison plots with limits of agreement

#### Statistical Diagnostics (6 types)
Tools for model checking and statistical assessment:

- `geom_qq`: Quantile-quantile plots for distribution comparison
- `geom_ecdf`: Empirical cumulative distribution functions
- `geom_funnel`: Funnel plots for publication bias assessment
- `geom_control`: Shewhart control charts for process monitoring
- `geom_scree`: Scree plots for PCA component selection

#### Set and Hierarchical (2 types)
Visualizations for categorical and hierarchical relationships:

- `geom_upset`: UpSet plots for set intersections (superior to Venn diagrams for >3 sets)
- `geom_dendrogram`: Hierarchical clustering trees

#### Distribution Variants (8 types)
Extended distribution visualizations:

- `geom_ridgeline`/`geom_joy`: Stacked density ridgelines
- `geom_beeswarm`/`geom_quasirandom`: Jittered point distributions
- `geom_dumbbell`: Before-after comparisons
- `geom_lollipop`: Sparse bar alternatives

#### Terminal-Optimized (4 types)
Visualizations designed specifically for character-cell rendering:

- `geom_sparkline`: Inline word-sized charts
- `geom_bullet`: KPI progress indicators
- `geom_waffle`: Grid-based proportions
- `geom_braille`: High-resolution using Braille Unicode (8x density)

#### 2D and Spatial (9 types)
Visualizations for continuous 2D data:

- `geom_tile`, `geom_raster`, `geom_rect`
- `geom_bin2d`, `geom_density_2d`
- `geom_contour`, `geom_contour_filled`
- `geom_text`, `geom_label`

Each geometry computes appropriate statistics automatically. For example, `geom_kaplan_meier()` calculates survival probabilities and confidence intervals from time-to-event data, `geom_volcano()` identifies significant genes based on fold-change and p-value thresholds, and `geom_control()` computes control limits from process data.

### Terminal Rendering

ggterm renders to Unicode text optimized for terminal display:

1. **Dimension detection:** Queries terminal size and adapts layout
2. **Scale computation:** Maps data values to character positions
3. **Geometry rendering:** Draws marks to a character canvas
4. **Decoration:** Adds axes, labels, legends using box-drawing characters
5. **Color output:** Emits ANSI escape sequences for 24-bit color

Point markers use Unicode symbols (●, ▲, ■, ◆, ○) to encode categorical variables without color. Axes use box-drawing characters (─, │, ┌, ┐, └, ┘) for clean alignment. The Braille renderer (`geom_braille`) achieves 8x resolution by encoding 2x4 pixel blocks into single Braille characters.

Color support adapts to terminal capabilities:
- **24-bit truecolor:** Full RGB palette (modern terminals)
- **256-color:** Approximate colors via ANSI palette
- **Monochrome:** Shape-only encoding for basic terminals

### Plot History and Provenance

Every rendered plot is automatically persisted to a structured history system. The history captures complete provenance enabling reproducibility:

```
~/.ggterm/
├── history/
│   ├── 2024-01-28-001.json    # Plot specification
│   ├── 2024-01-28-002.json
│   └── ...
├── last-plot.json              # Most recent plot
└── last-plot-vegalite.json     # Vega-Lite export
```

Each history entry contains:

```json
{
  "id": "2024-01-28-001",
  "timestamp": "2024-01-28T10:30:00.000Z",
  "spec": {
    "data": { "source": "expression_data.csv", "rows": 20000 },
    "layers": [
      {
        "geom": "volcano",
        "aes": { "x": "log2FoldChange", "y": "negLog10Pvalue" },
        "params": { "fc_threshold": 1, "p_threshold": 0.05 }
      }
    ],
    "scales": { "color": { "type": "manual", "values": {...} } },
    "labels": { "title": "Differential Expression Analysis" }
  },
  "command": "gg(data).aes({...}).geom(geom_volcano())",
  "description": "Volcano plot of RNA-seq differential expression",
  "tags": ["rnaseq", "differential-expression", "figure-2"]
}
```

The history system supports:

- **Chronological browsing:** List recent plots with timestamps
- **Search:** Find plots by description, tags, or geom type
- **Retrieval:** Load any historical plot by ID
- **Re-rendering:** Regenerate plots at different dimensions
- **Export:** Convert historical plots to publication formats

This addresses the ephemeral nature of terminal output. Plots created during exploratory analysis remain accessible for inclusion in papers, presentations, or further refinement.

### Publication Export

ggterm exports visualizations to Vega-Lite specifications (Satyanarayan et al., 2017), enabling publication-quality output:

```bash
# Export to interactive HTML
ggterm export 2024-01-28-001 figure2.html

# Convert to static formats via Vega CLI
npx vl2png figure2.html > figure2.png
npx vl2svg figure2.html > figure2.svg
npx vl2pdf figure2.html > figure2.pdf
```

HTML exports include:
- Interactive pan and zoom
- Tooltips showing data values
- PNG and SVG download buttons
- Editable Vega-Lite specification

Style presets apply publication-appropriate formatting:

| Preset | Characteristics |
|--------|-----------------|
| **wilke** | Claus Wilke's principles: minimal, high data-ink ratio |
| **tufte** | Edward Tufte's principles: no chartjunk, direct labeling |
| **nature** | Nature journal style: specific fonts and dimensions |
| **economist** | The Economist style: distinctive colors and layout |
| **apa** | APA guidelines: grayscale-friendly, academic formatting |

---

## AI Agent Integration

### The Conversational Analysis Loop

ggterm's declarative API enables AI assistants to perform visual EDA through natural conversation. The Grammar of Graphics structure maps directly to how humans describe visualizations:

| User Request | Grammar Translation |
|--------------|---------------------|
| "Show expression by treatment" | `aes({ x: 'treatment', y: 'expression' })` |
| "Use a boxplot" | `.geom(geom_boxplot())` |
| "Color by response status" | `aes({ ..., color: 'response' })` |
| "Split into panels by timepoint" | `.facet(facet_wrap('timepoint'))` |
| "Add a significance threshold line" | `.geom(geom_hline({ yintercept: threshold }))` |

Each modification layers onto the existing specification. This compositional structure matches iterative refinement—users don't restart, they adjust.

### Deterministic Skills

We implemented ggterm integration for Claude Code through seven specialized skills:

| Skill | Purpose |
|-------|---------|
| **data-load** | Load CSV, JSON, JSONL with type inference |
| **ggterm-plot** | Create visualizations from natural language |
| **ggterm-customize** | Modify aesthetics conversationally |
| **ggterm-style** | Apply publication style presets |
| **ggterm-history** | Search and retrieve previous plots |
| **ggterm-publish** | Export to PNG, SVG, PDF, HTML |
| **ggterm-markdown** | Generate reports with embedded plots |

These skills provide deterministic entry points ensuring consistent behavior regardless of request phrasing. The AI invokes specific tools rather than generating arbitrary code, improving reliability.

### Bundled Datasets

ggterm includes datasets for immediate exploration:

| Dataset | Rows | Variables | Domain |
|---------|------|-----------|--------|
| **iris** | 150 | sepal_length, sepal_width, petal_length, petal_width, species | Classification |
| **mtcars** | 16 | mpg, cyl, hp, wt, name | Regression |
| **sample(n)** | n | x, y, group, size | Synthetic testing |

Users can explore ggterm capabilities immediately without data preparation.

---

## Results

### Example: Genomics Workflow

We demonstrate ggterm's scientific visualization capabilities through a differential expression analysis workflow.

**Volcano plot for hit identification:**

```
User: Load the RNA-seq results and show me a volcano plot.

AI: [Loads data, creates volcano plot with fold-change and p-value thresholds]
```

The volcano plot immediately identifies significantly differentially expressed genes: points in the upper corners represent genes with both large fold changes and statistical significance. The built-in `geom_volcano()` automatically draws threshold lines and colors significant hits.

**MA plot for bias assessment:**

```
User: Show me an MA plot to check for intensity-dependent bias.

AI: [Creates MA plot with mean expression vs. log fold change]
```

The MA plot reveals whether fold-change estimates depend on expression level—a common technical artifact. Ideally, points scatter symmetrically around zero across all intensity values.

**Survival analysis:**

```
User: Show survival curves for responders vs non-responders.

AI: [Creates Kaplan-Meier plot with confidence intervals]
```

The Kaplan-Meier visualization shows time-to-event data with censoring handled appropriately. Confidence bands indicate uncertainty, and the log-rank p-value quantifies group differences.

**Forest plot for meta-analysis:**

```
User: Summarize the treatment effects across all studies as a forest plot.

AI: [Creates forest plot with effect sizes, CIs, and pooled estimate]
```

The forest plot displays individual study effects with confidence intervals, plus a diamond showing the pooled meta-analytic estimate. Heterogeneity is visible in the spread of point estimates.

### Comparison with Existing Tools

| Feature | ggterm | plotext | termgraph | gnuplot |
|---------|--------|---------|-----------|---------|
| Grammar of Graphics | ✓ | - | - | - |
| Geometry types | 68 | 15 | 3 | 20+ |
| Scientific plots | ✓ | - | - | Limited |
| Clinical plots | ✓ | - | - | - |
| Statistical diagnostics | ✓ | - | - | Limited |
| Plot history | ✓ | - | - | - |
| Provenance tracking | ✓ | - | - | - |
| AI agent skills | ✓ | - | - | - |
| Publication export | ✓ | ✓ | - | ✓ |
| Declarative API | ✓ | - | - | Partial |

ggterm uniquely combines Grammar of Graphics architecture, comprehensive scientific visualization support, reproducibility infrastructure, and AI integration.

---

## Discussion

### Enabling Visual Analysis in Terminal Environments

Terminal-based workflows dominate scientific computing. Researchers SSH into clusters, run analyses in containers, and manage remote servers through text interfaces. ggterm brings sophisticated visualization to these environments, enabling EDA where data lives rather than requiring file transfers to local graphical tools.

The 68 geometry types cover analytical needs across domains. Genomics researchers can create volcano plots and Manhattan plots directly on the analysis server. Clinical researchers can generate Kaplan-Meier curves and forest plots during data review. Statisticians can assess model assumptions with Q-Q plots and residual diagnostics. This domain coverage reduces context-switching between exploration and specialized visualization tools.

### Reproducibility Through Structured History

Scientific visualization often occurs during exploratory phases when documentation is minimal. The automatic history system captures every plot with full provenance—data source, specification, timestamp—without requiring explicit save actions. Months later, researchers can retrieve the exact visualization shown in a committee meeting or regenerate a figure at publication resolution.

The JSON specification format ensures plots remain reproducible across ggterm versions. Specifications describe intent (show these variables with this geometry) rather than implementation (draw pixels at these coordinates), enabling forward compatibility as rendering improves.

### AI Integration as Primary Interface

The Grammar of Graphics' declarative nature proves ideal for AI-assisted analysis. Users describe visualizations in domain terms ("show survival by treatment arm"), and AI assistants translate to layered specifications. Modifications compose—adding color encoding doesn't require rewriting, just extending. This matches conversational refinement patterns.

The deterministic skill system ensures AI assistants invoke specific, tested code paths rather than generating arbitrary implementations. This improves reliability for scientific applications where visualization errors could mislead analysis.

### Limitations

Terminal rendering, while capable, cannot match graphical display resolution. Dense datasets may require aggregation or sampling. The character-cell grid limits precision for quantitative reading, though the Braille renderer partially addresses this.

Scientific visualizations implement common conventions but may not cover all domain-specific requirements. The Kaplan-Meier implementation shows survival curves with confidence intervals but does not include all clinical trial embellishments (risk tables beneath, landmark analyses). Users with specialized needs can extend geometries or export to Vega-Lite for customization.

AI integration quality depends on the underlying language model. Complex analytical requests may require multiple turns to specify correctly. The skill system mitigates this by providing structured entry points, but novel visualization requests still require AI interpretation.

### Future Directions

We plan to extend ggterm in several directions:

1. **Interactive terminal graphics:** Explore cursor-based interaction for pan, zoom, and point selection in terminals supporting mouse events.

2. **Additional scientific domains:** Phylogenetic trees, genome browsers, and mass spectrometry visualizations would extend coverage to additional research areas.

3. **Real-time streaming:** Support for updating plots as data arrives would enable monitoring dashboards and live experimental tracking.

4. **Cross-language bindings:** Python and R wrappers would enable ggterm use from familiar scientific computing environments.

---

## Availability

- **Source code:** https://github.com/shandley/ggterm
- **npm package:** @ggterm/core (v0.2.20)
- **License:** MIT
- **Documentation:** https://github.com/shandley/ggterm#readme

---

## Acknowledgments

[To be added]

---

## References

1. Wilkinson, L. (2005). *The Grammar of Graphics* (2nd ed.). Springer.

2. Wickham, H. (2010). A layered grammar of graphics. *Journal of Computational and Graphical Statistics*, 19(1), 3-28.

3. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis* (2nd ed.). Springer.

4. Satyanarayan, A., Moritz, D., Wongsuphasawat, K., & Heer, J. (2017). Vega-Lite: A grammar of interactive graphics. *IEEE Transactions on Visualization and Computer Graphics*, 23(1), 341-350.

5. Wilke, C. O. (2019). *Fundamentals of Data Visualization*. O'Reilly Media.

6. Kaplan, E. L., & Meier, P. (1958). Nonparametric estimation from incomplete observations. *Journal of the American Statistical Association*, 53(282), 457-481.

7. Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. *The Lancet*, 327(8476), 307-310.

8. Lex, A., Gehlenborg, N., Strobelt, H., Vuillemot, R., & Pfister, H. (2014). UpSet: Visualization of intersecting sets. *IEEE Transactions on Visualization and Computer Graphics*, 20(12), 1983-1992.

9. Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems. *Annals of Eugenics*, 7(2), 179-188.

---

## Figures

**Figure 1.** ggterm architecture showing the Grammar of Graphics layer system and rendering pipeline from data through terminal output and publication export.

**Figure 2.** Geometry type coverage across analytical domains: (A) taxonomy of 68 geometry types organized by purpose, (B) examples of scientific visualizations including volcano plot, Kaplan-Meier curve, and forest plot.

**Figure 3.** Plot history and provenance system: (A) directory structure, (B) JSON specification schema, (C) search and retrieval workflow.

**Figure 4.** AI-assisted analysis workflow demonstrating conversational visualization refinement from initial exploration through publication export.

**Figure 5.** Comparison of terminal plotting capabilities across libraries, showing ggterm's unique combination of Grammar of Graphics architecture, scientific visualization support, and reproducibility infrastructure.
