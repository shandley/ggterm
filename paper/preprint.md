# ggterm: Enabling Conversational Data Visualization for AI-Assisted Computational Biology

**Authors:** Scott A. Handley^1^

^1^ [Affiliation to be added]

**Corresponding author:** [email]

**Keywords:** data visualization, grammar of graphics, artificial intelligence, terminal interface, exploratory data analysis

---

## Abstract

The emergence of AI coding assistants has transformed computational workflows, yet a critical gap remains: these agents cannot perform visual exploratory data analysis in terminal environments where most bioinformatics work occurs. We present ggterm, a TypeScript implementation of Wilkinson's Grammar of Graphics designed specifically for terminal rendering and AI agent integration. Unlike existing terminal plotting libraries that require memorization of imperative commands, ggterm provides a declarative, composable API that maps naturally to conversational interaction. Users describe visualizations in natural language ("show me the distribution of expression values by treatment group"), and AI assistants generate the corresponding ggterm code. The library implements 30 geometry types, comprehensive scale systems, faceting, and annotation layers. Plot specifications are stored as JSON with full provenance metadata, enabling reproducibility and retrieval. We demonstrate ggterm's utility through integration with Claude Code, providing deterministic skills for data loading, visualization, and publication-quality export. ggterm is freely available under the MIT license at https://github.com/shandley/ggterm and as @ggterm/core on npm.

---

## Introduction

Exploratory data analysis (EDA) is fundamental to computational biology, from initial quality assessment of sequencing runs to hypothesis generation in multi-omics studies. Visualization is the primary tool for EDA, yet the environments where bioinformaticians work—remote servers, compute clusters, containerized pipelines—often lack graphical display capabilities. Terminal-based visualization addresses this constraint, but existing tools offer limited functionality through imperative APIs that require memorizing specific syntax for each plot type.

Simultaneously, AI coding assistants have become increasingly integrated into computational workflows. Large language models (LLMs) can generate code, explain analyses, and iterate on implementations through natural language conversation. However, these assistants face a fundamental limitation: they cannot *see*. When a user asks "what does the distribution look like?", the AI can generate plotting code but cannot interpret the result, breaking the conversational analysis loop that makes these assistants valuable.

We identified three gaps in the current landscape:

1. **No Grammar of Graphics for terminals.** The Grammar of Graphics, formalized by Wilkinson and popularized through R's ggplot2, provides a declarative framework for constructing visualizations from composable layers. This approach is well-suited to LLM code generation—specifications describe *what* to display, not *how* to render it—yet no terminal-native implementation exists.

2. **Imperative APIs hinder AI assistance.** Existing terminal plotting tools (plotext, termgraph, asciichart) use imperative APIs where each plot type has distinct function signatures. LLMs can generate this code, but the lack of compositional structure means modifications require rewriting rather than layering.

3. **No provenance or reproducibility.** Terminal plots are ephemeral. Once scrolled off-screen, they are lost. There is no standard mechanism to store, retrieve, or reproduce previous visualizations.

ggterm addresses these gaps through a Grammar of Graphics implementation designed for terminal rendering with first-class support for AI agent integration.

---

## Design and Implementation

### Grammar of Graphics Architecture

ggterm implements the layered grammar of graphics with seven core components:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Data** | Input dataset | CSV, JSON, JSONL files |
| **Aesthetics** | Variable mappings | x, y, color, size, shape |
| **Geometries** | Visual marks | Points, lines, bars, histograms |
| **Statistics** | Data transformations | Binning, smoothing, density |
| **Scales** | Value-to-visual mappings | Linear, log, color palettes |
| **Coordinates** | Coordinate systems | Cartesian, polar |
| **Facets** | Small multiples | Wrap, grid layouts |

Visualizations are constructed by composing these layers:

```typescript
gg(data)
  .aes({ x: 'sepal_length', y: 'petal_length', color: 'species' })
  .geom(geom_point())
  .scale(scale_color_viridis())
  .facet(facet_wrap('species'))
  .labs({ title: 'Iris Morphology' })
```

This declarative specification describes the visualization without prescribing rendering details. The same specification renders appropriately across terminal widths, color capabilities, and output formats.

### Geometry Types

ggterm implements 30 geometry types spanning common analytical needs:

- **Distributions:** histogram, density, freqpoly, boxplot, violin, qq
- **Relationships:** point, line, smooth, contour, density_2d
- **Comparisons:** bar, col, errorbar, pointrange, crossbar
- **Annotations:** hline, vline, abline, text, label, segment
- **Spatial:** tile, raster, rect, contour_filled

Each geometry computes appropriate statistics automatically. For example, `geom_histogram()` bins continuous data, `geom_boxplot()` calculates quartiles and outliers, and `geom_smooth()` fits regression models.

### Terminal Rendering

ggterm renders to Unicode text optimized for terminal display. The renderer:

1. Detects terminal dimensions and color capabilities
2. Computes data-to-pixel mappings via scales
3. Renders geometries to a character canvas
4. Draws axes, labels, and legends
5. Outputs ANSI-colored text

Point markers use Unicode symbols (●, ▲, ■, ◆) to encode categorical variables. Axes use box-drawing characters for clean alignment. Colors use 24-bit ANSI sequences where supported, with graceful degradation to 256-color or monochrome terminals.

### Plot History and Provenance

Every rendered plot is automatically stored with provenance metadata:

```json
{
  "id": "2024-01-28-001",
  "timestamp": "2024-01-28T10:30:00Z",
  "spec": { /* full plot specification */ },
  "dataFile": "expression_data.csv",
  "command": "gg(data).aes({x:'gene',y:'expression'}).geom(geom_boxplot())",
  "description": "Boxplot of expression by gene"
}
```

Users can search history ("find my volcano plots"), retrieve previous visualizations by ID, and export any historical plot to publication formats. This addresses the ephemeral nature of terminal output and enables reproducibility.

### Publication Export

ggterm exports visualizations to interactive HTML files containing Vega-Lite specifications. These exports provide:

- Pan and zoom interaction
- PNG and SVG download buttons
- Tooltips showing data values
- Editable Vega-Lite JSON for further customization

This bridges the gap between rapid terminal exploration and publication-quality figures.

---

## AI Agent Integration

### The Conversational Analysis Loop

ggterm's primary design goal is enabling AI assistants to perform visual EDA through conversation. The declarative Grammar of Graphics API maps directly to natural language:

| User says | AI generates |
|-----------|--------------|
| "Load the expression data" | Data loading code |
| "Show me expression by treatment" | `gg(data).aes({x:'treatment', y:'expression'}).geom(geom_boxplot())` |
| "Add significance markers" | Annotation layer with p-values |
| "Split by timepoint" | `.facet(facet_wrap('timepoint'))` |
| "Export for the paper" | HTML export with SVG download |

Each modification layers onto the existing specification rather than rewriting. This compositional structure matches how humans describe iterative refinements.

### Deterministic Skills

We implemented ggterm integration for Claude Code through six specialized skills:

1. **data-load**: Loads CSV, JSON, or JSONL files with automatic type inference
2. **ggterm-plot**: Creates visualizations from natural language descriptions
3. **ggterm-customize**: Modifies aesthetics (colors, labels, themes) conversationally
4. **ggterm-history**: Searches and retrieves previous plots
5. **ggterm-publish**: Exports to publication formats
6. **ggterm-markdown**: Generates analysis reports with embedded visualizations

These skills provide deterministic entry points for AI agents, ensuring consistent behavior regardless of how requests are phrased.

### Bundled Datasets

ggterm includes classic datasets for immediate exploration:

| Dataset | Rows | Variables | Use case |
|---------|------|-----------|----------|
| **iris** | 150 | sepal_length, sepal_width, petal_length, petal_width, species | Classification, species comparison |
| **mtcars** | 16 | mpg, cyl, hp, wt, name | Regression, continuous relationships |
| **sample** | n | x, y, group, size | Testing, prototyping |

These enable users to immediately explore ggterm capabilities without preparing data files.

---

## Results

### Example: Iris Species Classification

We demonstrate ggterm's capabilities through analysis of Fisher's iris dataset, a canonical example in statistical visualization.

**Loading and initial exploration:**

```
User: Load the iris dataset and show me petal dimensions.

AI: [Loads iris data, creates scatter plot of petal_length vs petal_width]
```

The resulting visualization immediately reveals the clustering structure: *I. setosa* forms a distinct group with small petals, while *I. versicolor* and *I. virginica* show overlap but remain separable.

**Iterative refinement:**

```
User: Color by species and add classification boundaries at petal_length=2.5

AI: [Adds color encoding and reference line annotation]
```

The colored plot with reference lines demonstrates that a simple threshold on petal length perfectly separates *setosa* from the other species—a finding that emerges visually before any statistical modeling.

**Faceted comparison:**

```
User: Show each species in its own panel.

AI: [Applies facet_wrap('species')]
```

Faceting reveals within-species variation: *setosa* shows tight clustering while *virginica* exhibits greater morphological diversity.

**Publication export:**

```
User: Export for the methods figure.

AI: [Generates HTML with SVG download, dimensions suitable for journal submission]
```

The complete analysis—from data loading through publication figure—required six natural language prompts and produced reproducible, citable output.

### Comparison with Existing Tools

We compared ggterm against existing terminal visualization libraries:

| Feature | ggterm | plotext | termgraph | asciichart |
|---------|--------|---------|-----------|------------|
| Grammar of Graphics | ✓ | - | - | - |
| Geometry types | 30 | 15 | 3 | 1 |
| Color encoding | ✓ | ✓ | - | - |
| Faceting | ✓ | - | - | - |
| Statistical transforms | ✓ | Limited | - | - |
| Plot history | ✓ | - | - | - |
| Publication export | ✓ | ✓ | - | - |
| AI agent skills | ✓ | - | - | - |
| Declarative API | ✓ | - | - | - |

ggterm provides the only Grammar of Graphics implementation for terminals and the only library designed for AI agent integration.

---

## Discussion

### Implications for Computational Biology Workflows

Terminal-based visualization has traditionally been a compromise—useful for quick checks but inadequate for real analysis. ggterm changes this calculus by providing publication-quality visualization capabilities in terminal environments. For bioinformaticians working on remote clusters, this means EDA can happen where the data lives, without transferring files or switching contexts.

The AI integration amplifies this benefit. As coding assistants become standard tools in computational biology, the ability to perform visual analysis conversationally removes a significant friction point. Researchers can explore data through natural language, with the AI handling implementation details while they focus on biological interpretation.

### Reproducibility and Provenance

The automatic capture of plot history with provenance metadata addresses a persistent challenge in computational research. Terminal output is ephemeral; ggterm makes it persistent and reproducible. Every visualization can be retrieved, regenerated, and exported months after initial creation.

### Limitations

ggterm's terminal rendering, while capable, cannot match the resolution of graphical displays. Dense datasets may require aggregation or sampling. The 30 geometry types, while comprehensive, do not cover all specialized visualization needs (e.g., genome browsers, phylogenetic trees).

The AI integration depends on the capabilities of the underlying language model. Complex analytical requests may require multiple conversational turns to specify correctly.

### Future Directions

We plan to extend ggterm with additional geometry types for biological data (MA plots, volcano plots, heatmaps with clustering). Integration with additional AI assistants beyond Claude Code is planned. A companion R package providing ggplot2-compatible syntax is under consideration.

---

## Availability

- **Source code:** https://github.com/shandley/ggterm
- **npm package:** @ggterm/core
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

4. Morel, P. (2018). Gramm: grammar of graphics plotting in Matlab. *Journal of Open Source Software*, 3(23), 568.

5. Satyanarayan, A., Moritz, D., Wongsuphasawat, K., & Heer, J. (2017). Vega-Lite: A grammar of interactive graphics. *IEEE Transactions on Visualization and Computer Graphics*, 23(1), 341-350.

6. Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems. *Annals of Eugenics*, 7(2), 179-188.

7. [AI coding assistant references to be added]

---

## Figures

**Figure 1.** ggterm architecture showing the flow from data through grammar layers to terminal rendering and export.

**Figure 2.** Comparison of visualization capabilities across terminal plotting libraries.

**Figure 3.** Example ggterm output showing iris dataset analysis: (A) initial scatter plot, (B) colored by species with classification boundary, (C) faceted by species, (D) exported SVG.

**Figure 4.** Conversational analysis workflow demonstrating AI agent integration.
