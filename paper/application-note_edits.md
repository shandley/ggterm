---
title: "ggterm: Grammar of Graphics Visualization for Terminal-Base Data Visualization"
authors:
  - name: Scott A. Handley
    orcid: 0000-0002-2143-6570
    affiliation: 1
  - name: Lindsay N Droit
    orcid: 0000-0002-5771-1490
    affiliation: 1
  - name: Megan R. Johnson
    orcid: 0009-0009-2735-3272
    affiliation: 1
  - name: Leran Wang 
    orcid: 0009-0003-6928-9893
    affiliation: 1
affiliations:
  - name: Department of Pathology and Immunology, Washington University School of Medicine, St. Louis, MO, USA
    index: 1
date: 2026
bibliography: references.bib
---

## Abstract

**Motivation:** AI coding assistants are transforming computational biology workflows, but they operate in terminal environments that lack visualization tools designed for programmatic composition. Researchers who use these assistants for data analysis must still switch to R or Python for plotting, breaking the conversational loop between analyst and assistant. Terminal plotting libraries exist but support only basic chart types through imperative APIs, offering neither the Grammar of Graphics nor the domain-specific visualizations that genomics and clinical research require.

**Results:** We present ggterm, a Grammar of Graphics implementation that brings compositional visualization into the terminal where AI assistants operate. ggterm provides 66 geometry types, including 14 domain-specific visualizations for genomics, clinical research, and statistical diagnostics. Every plot is a declarative JSON specification that AI agents can generate, modify, and layer through conversation. A companion browser viewer renders plots as interactive Vega-Lite visualizations alongside the terminal session, and exports to PNG, SVG, and PDF for publication. Eight integration skills for Claude Code enable researchers to create and refine visualizations through natural language. In feature comparison against five terminal plotting alternatives, ggterm is the only tool combining Grammar of Graphics composition, scientific plot types, AI agent integration, and publication-quality export.

**Availability and Implementation:** ggterm is implemented in TypeScript and freely available under the MIT license at https://github.com/shandley/ggterm. The package is distributed via npm as @ggterm/core.

## 1. Introduction

AI coding assistants are changing how researchers do computational biology. Tools like OpenAI Codex and Claude Code operate within terminal sessions, generating and executing code through conversation. A researcher can ask an assistant to run a differential expression analysis, filter results, and fit a statistical model, all without leaving the terminal. But when the researcher wants to see the results, the conversation breaks. The assistant cannot produce a volcano plot or survival curve because no visualization toolkit in the terminal environment was designed for programmatic composition.

The standard workaround is to leave the terminal. Researchers switch to R, Python, or Jupyter to produce figures using ggplot2 or matplotlib. Each visualization requires opening a different tool, loading the data again, and writing plotting code in a different language. This context switch discourages frequent inspection, so researchers batch their visualization at the end of a pipeline rather than checking intermediate results. Errors propagate further, and exploratory patterns go unnoticed until late in the analysis. The visualization libraries themselves are excellent; the problem is that they live outside the environment where the analytical conversation is happening.

A visualization toolkit designed for AI agents would need three properties. First, a declarative specification that agents can generate and modify without maintaining rendering state. Second, the Grammar of Graphics, which enables compositional construction by specifying data mappings, geometries, scales, and facets as independent layers. Third, the domain-specific chart types that bioinformatics and clinical research require: volcano plots for differential expression, Manhattan plots for genome-wide association, Kaplan-Meier curves for survival analysis, forest plots for meta-analysis.

Terminal-based plotting tools exist but meet none of these requirements. plotext (Python) provides scatter, line, bar, histogram, and heatmap plots through an imperative API. UnicodePlots.jl (Julia) supports 12 plot types including scatter, line, bar, histogram, boxplot, and density. gnuplot renders to a "dumb terminal" mode with ASCII characters. None implement the Grammar of Graphics. None offer scientific chart types. None produce a declarative specification that external tools or AI agents can consume and modify.

We developed ggterm to fill this gap. ggterm is a TypeScript Grammar of Graphics engine with 66 geometry types and 75 scale functions. Every visualization is represented as a backend-agnostic PlotSpec, a JSON-serializable specification that separates what to visualize from how to render it. This specification can be rendered in the terminal, exported to Vega-Lite for interactive browser visualization, or converted to PNG, SVG, and PDF for publication. Eight integration skills for Claude Code allow researchers to create and refine visualizations through natural language. During setup, ggterm scans the working directory for CSV, TSV, JSON, and JSONL files, infers column types and value ranges, and writes a data catalog that the assistant reads at conversation start. A researcher with a deseq2_results.csv file can begin a session and immediately hear "I see 20,000 genes with log2FoldChange and adjusted p-values — want a volcano plot?". Plotting history is maintained and easily accessible to users. The result is a system where an AI assistant can produce a volcano plot, adjust its thresholds, apply a publication style, and export a figure, all within a single conversational session.

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

Four built-in datasets allow immediate exploration without file preparation (Table 2). Two general-purpose datasets, iris (Fisher 1936; 150 rows, 5 columns) and mtcars (16 rows, 5 columns), support standard visualization tasks. Two biological datasets provide domain-specific examples. The airway dataset contains DESeq2 differential expression results from the Himes et al. (2014) RNA-seq study of airway smooth muscle cells treated with dexamethasone, subset to 500 genes with gene symbol annotation. This dataset includes baseMean, log2FoldChange, lfcSE, p-value, and adjusted p-value columns, and contains a representative mix of significant and non-significant genes suitable for volcano and MA plot demonstrations. The lung dataset contains survival data from the North Central Cancer Treatment Group (Loprinzi et al., 1994), with 227 patients and columns for time, censoring status, age, sex, and ECOG performance score. These datasets let researchers produce a volcano plot or Kaplan-Meier curve within seconds of installation:

```bash
npx ggterm-plot airway log2FoldChange padj gene "DESeq2 Results" volcano
npx ggterm-plot lung time status sex "Lung Survival" kaplan_meier
```

**Table 2.** Built-in datasets.

| Dataset | Rows | Columns | Source | Use case |
|---------|------|---------|--------|----------|
| iris | 150 | sepal_length, sepal_width, petal_length, petal_width, species | Fisher (1936) | Scatter, density, boxplot |
| mtcars | 16 | name, mpg, cyl, hp, wt | Henderson & Velleman (1981) | Scatter, bar |
| airway | 500 | gene, baseMean, log2FoldChange, lfcSE, pvalue, padj | Himes et al. (2014) | Volcano, MA plot |
| lung | 227 | time, status, age, sex, ph_ecog | Loprinzi et al. (1994) | Kaplan-Meier, forest plot |

## Acknowledgements

We would like to thank members of the Handley lab for comments and suggestions.

## Funding

[To be added]

## References
