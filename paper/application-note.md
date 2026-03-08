---
title: "ggterm: Grammar of Graphics visualization for terminal-based bioinformatics workflows"
authors:
  - name: Scott A. Handley
    orcid: 0000-0000-0000-0000
    affiliation: 1
affiliations:
  - name: Department of Pathology and Immunology, Washington University School of Medicine, St. Louis, MO, USA
    index: 1
date: 2026
bibliography: references.bib
---

## Abstract

**Motivation:** Bioinformatics workflows increasingly run on remote servers, compute clusters, and containerized environments where graphical displays are unavailable. Researchers who need to visualize results during analysis must either transfer data to a local machine or rely on unreliable X11 forwarding. Existing terminal plotting tools support only basic chart types and lack the scientific visualizations that bioinformatics and clinical research require.

**Results:** We present ggterm, a Grammar of Graphics implementation for terminal environments with 66 geometry types, including 14 domain-specific visualizations for genomics, clinical research, and statistical diagnostics. ggterm renders publication-quality plots directly in the terminal using Unicode and ANSI color, and exports to PNG, SVG, and PDF through Vega-Lite. A companion browser viewer provides interactive visualization alongside terminal sessions. Eight integration skills for Claude Code enable researchers to create and refine visualizations through natural language rather than programming syntax. In feature comparison against five terminal plotting alternatives, ggterm is the only tool combining Grammar of Graphics composition, scientific plot types, and publication-quality export.

**Availability and implementation:** ggterm is implemented in TypeScript and freely available under the MIT license at https://github.com/shandley/ggterm. The package is distributed via npm (`npm install @ggterm/core`) and includes 2,158 automated tests. Documentation and built-in datasets are provided for immediate use.

## 1. Introduction

Computational biology relies heavily on remote computing. Researchers SSH into high-performance clusters to run differential expression analyses, process sequencing data, and fit statistical models. Inspecting results at each stage requires visualization, from quality control through final interpretation. Yet the standard approach remains transferring output files to a local workstation for plotting in R or Python, interrupting the analytical workflow.

Terminal-based plotting tools exist but have significant limitations. plotext (Python) provides scatter, line, bar, histogram, and heatmap plots through an imperative API. UnicodePlots.jl (Julia) supports 12 plot types including scatter, line, bar, histogram, boxplot, and density. gnuplot renders to a "dumb terminal" mode with ASCII characters. None of these tools offer the scientific visualizations that bioinformatics researchers use daily: volcano plots for differential expression, Manhattan plots for genome-wide association, Kaplan-Meier curves for survival analysis, or forest plots for meta-analysis. None implement the Grammar of Graphics, which enables compositional plot construction by specifying data mappings, geometries, scales, and facets as independent layers.

We developed ggterm to fill this gap. ggterm is a TypeScript Grammar of Graphics engine with 66 geometry types and 75 scale functions. It renders directly in the terminal and exports to publication-quality formats through Vega-Lite. The library includes specialized visualizations for genomics, clinical research, and statistical diagnostics. Researchers can explore and publish results from the same environment where they run their analyses.

## 2. Implementation

### 2.1 Architecture

ggterm implements Wilkinson's Grammar of Graphics through a seven-layer pipeline: data, aesthetics, geometries, statistics, scales, coordinates, and facets. Each visualization is represented internally as a `PlotSpec`, a JSON-serializable specification that separates what to visualize from how to render it. Two backends consume this specification. A terminal renderer uses Unicode block characters, Braille symbols, and ANSI 256-color or 24-bit color codes. A Vega-Lite exporter produces interactive browser-based visualizations and static PNG, SVG, or PDF output.

### 2.2 Geometry types

The 66 geometry types span bioinformatics and clinical research workflows (Table 1). Beyond standard visualizations (scatter, line, bar, histogram, density, boxplot, violin), ggterm provides 14 domain-specific types. For genomics, volcano plots show differential expression, MA plots display expression ratios, and Manhattan plots summarize genome-wide association results. Kaplan-Meier survival curves, forest plots for meta-analysis, ROC curves, and Bland-Altman plots serve clinical research. Statistical diagnostics (Q-Q plots, ECDF curves, funnel plots, control charts, scree plots) and set analysis types (UpSet plots, dendrograms) round out the collection.

### 2.3 Terminal rendering

The terminal renderer adapts to the host terminal's capabilities. On terminals supporting 24-bit color (most modern terminals including iTerm2, Windows Terminal, and GNOME Terminal), ggterm uses full RGB color encoding. A Braille rendering mode uses Unicode Braille characters to achieve 2x4 sub-character resolution, providing eight times the effective pixel density of standard character-cell rendering. Automatic aspect ratio correction accounts for the rectangular shape of terminal characters.

### 2.4 Publication export

ggterm converts its internal specifications to Vega-Lite, enabling export to PNG, SVG, and PDF. Six style presets produce publication-ready output: a default clean style following Wilke's recommendations, a Tufte-inspired high data-ink ratio style, Nature journal format, The Economist chart style, APA academic format, and a minimal style. Any preset can be applied before export to produce figures suitable for journal submission without switching tools.

### 2.5 Live viewer

A companion browser panel connects to the ggterm server via Server-Sent Events. Each plot appears as an interactive Vega-Lite visualization with tooltips and pan/zoom controls. A command palette provides fuzzy search across all 66 geometry types, export actions, and style presets. A history sidebar allows browsing and retrieving any previous plot from the session. The terminal handles data and commands; the browser provides high-resolution interactive output.

### 2.6 AI agent integration

Eight deterministic skills for Claude Code enable natural language interaction with the visualization engine. Researchers describe what they want to see ("show a volcano plot of the differential expression results, colored by significance") and the AI invokes specific CLI commands and file operations rather than generating arbitrary code. Skills cover data loading, plot creation, style application, customization, publication export, history retrieval, markdown report generation, and feature reference. Each skill operates within a defined tool-permission boundary.

## 3. Comparison

Table 1 compares ggterm against five terminal-capable plotting tools across features relevant to bioinformatics workflows. ggterm is the only tool that combines Grammar of Graphics composition, domain-specific scientific visualizations, and publication-quality export in a terminal environment. plotext offers the closest alternative for basic charts but lacks scientific types and compositional design. ggplot2 provides full Grammar of Graphics support and scientific plot types through extension packages, but requires a graphical display and cannot render in terminal environments.

**Table 1.** Feature comparison of terminal-capable plotting tools.

| Feature | ggterm | plotext | UnicodePlots.jl | gnuplot | ggplot2 |
|---------|--------|---------|----------------|---------|---------|
| Grammar of Graphics | Yes | No | No | No | Yes |
| Terminal rendering | Yes | Yes | Yes | Yes (dumb) | No |
| Geometry types | 66 | ~15 | 12 | ~30 | 50+ (with extensions) |
| Volcano plot | Yes | No | No | No | Yes (EnhancedVolcano) |
| Kaplan-Meier | Yes | No | No | No | Yes (survminer) |
| Forest plot | Yes | No | No | No | Yes (forestplot) |
| Manhattan plot | Yes | No | No | No | Yes (qqman) |
| Q-Q plot | Yes | No | No | No | Yes |
| Publication export | PNG/SVG/PDF | No | PNG/TXT | Multiple | Multiple |
| Style presets | 6 presets | Themes | No | No | Themes |
| Plot history | Automatic | No | No | No | No |
| AI integration | 8 skills | MCP server | No | No | No |
| Language | TypeScript | Python | Julia | C | R |

## 4. Usage example

A typical bioinformatics workflow with ggterm begins with a single setup command:

```bash
npx ggterm-plot setup
```

This installs the package, starts the live viewer, and configures AI skills. The researcher can then create visualizations by talking to Claude Code:

```
User: Load the differential expression results and show a volcano plot
Claude: [Creates volcano plot from DESeq2 output, appears in viewer]

User: Highlight genes with adjusted p-value below 0.01
Claude: [Updates plot with significance threshold]

User: Style for Nature and export as SVG
Claude: [Applies Nature preset, exports publication figure]
```

The same workflow works with the CLI directly:

```bash
npx ggterm-plot results.csv log2FoldChange negLog10Padj significant "DE Results" volcano
```

Built-in datasets (iris, 150 rows; mtcars, 16 rows) allow immediate exploration without file preparation.

## Acknowledgements

[To be added]

## Funding

[To be added]

## References
