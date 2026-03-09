# Motivation Rewrite — Final (Option C: AI Agent Lead)

## Abstract

**Motivation:** AI coding assistants are transforming computational biology workflows, but they operate in terminal environments that lack visualization tools designed for programmatic composition. Researchers who use these assistants for data analysis must still switch to R or Python for plotting, breaking the conversational loop between analyst and assistant. Terminal plotting libraries exist but support only basic chart types through imperative APIs, offering neither the Grammar of Graphics nor the domain-specific visualizations that genomics and clinical research require.

**Results:** We present ggterm, a Grammar of Graphics implementation that brings compositional visualization into the terminal where AI assistants operate. ggterm provides 66 geometry types, including 14 domain-specific visualizations for genomics, clinical research, and statistical diagnostics. Every plot is a declarative JSON specification that AI agents can generate, modify, and layer through conversation. A companion browser viewer renders plots as interactive Vega-Lite visualizations alongside the terminal session, and exports to PNG, SVG, and PDF for publication. Eight integration skills for Claude Code enable researchers to create and refine visualizations through natural language. Bundled datasets including DESeq2 differential expression results and survival data allow immediate exploration without file preparation. In feature comparison against five terminal plotting alternatives, ggterm is the only tool combining Grammar of Graphics composition, scientific plot types, AI agent integration, and publication-quality export.

**Availability and implementation:** ggterm is implemented in TypeScript and freely available under the MIT license at https://github.com/shandley/ggterm. The package is distributed via npm as `@ggterm/core`.

---

## 1. Introduction

AI coding assistants are changing how researchers do computational biology. Tools like GitHub Copilot and Claude Code operate within terminal sessions, generating and executing code through conversation. A researcher can ask an assistant to run a differential expression analysis, filter results, and fit a statistical model, all without leaving the terminal. But when the researcher wants to see the results, the conversation breaks. The assistant cannot produce a volcano plot or survival curve because no visualization toolkit in the terminal environment was designed for programmatic composition.

The standard workaround is to leave the terminal. Researchers switch to R, Python, or Jupyter to produce figures using ggplot2 or matplotlib. Each visualization requires opening a different tool, loading the data again, and writing plotting code in a different API. This context switch discourages frequent inspection, so researchers batch their visualization at the end of a pipeline rather than checking intermediate results. Errors propagate further, and exploratory patterns go unnoticed until late in the analysis. The visualization libraries themselves are excellent; the problem is that they live outside the environment where the analytical conversation is happening.

A visualization toolkit designed for AI agents would need three properties. First, a declarative specification that agents can generate and modify without maintaining rendering state. Second, the Grammar of Graphics, which enables compositional construction by specifying data mappings, geometries, scales, and facets as independent layers. Third, the domain-specific chart types that bioinformatics and clinical research require: volcano plots for differential expression, Manhattan plots for genome-wide association, Kaplan-Meier curves for survival analysis, forest plots for meta-analysis.

Terminal-based plotting tools exist but meet none of these requirements. plotext (Python) provides scatter, line, bar, histogram, and heatmap plots through an imperative API. UnicodePlots.jl (Julia) supports 12 plot types including scatter, line, bar, histogram, boxplot, and density. gnuplot renders to a "dumb terminal" mode with ASCII characters. None implement the Grammar of Graphics. None offer scientific chart types. None produce a declarative specification that external tools or AI agents can consume and modify.

We developed ggterm to fill this gap. ggterm is a TypeScript Grammar of Graphics engine with 66 geometry types and 75 scale functions. Every visualization is represented as a backend-agnostic PlotSpec, a JSON-serializable specification that separates what to visualize from how to render it. This specification can be rendered in the terminal, exported to Vega-Lite for interactive browser visualization, or converted to PNG, SVG, and PDF for publication. Eight integration skills for Claude Code allow researchers to create and refine visualizations through natural language. The result is a system where an AI assistant can produce a volcano plot, adjust its thresholds, apply a publication style, and export a figure, all within a single conversational session.

---

## Previous Options (archived)

### Option A: Tool-Switching Overhead Lead

**Motivation:** Visualizing results during bioinformatics analysis means switching from the terminal to R, Python, or Jupyter, loading data into a plotting library, and writing code in a different language than the analysis itself. This context switch discourages iterative inspection: researchers batch their visualization rather than checking results at each analytical step, reducing opportunities to catch errors or discover patterns early. AI coding assistants that now operate within terminal sessions lack a visualization toolkit designed for programmatic composition, limiting their ability to help researchers explore data interactively. Existing terminal plotting tools provide basic chart types through imperative APIs but do not implement the Grammar of Graphics and do not include the scientific visualizations (volcano plots, Kaplan-Meier curves, forest plots) that bioinformatics and clinical research require.

### Option B: Tighter, Three-Sentence Version

**Motivation:** Bioinformatics visualization typically requires switching from the terminal to R or Python, a context switch that discourages the iterative inspection needed to catch errors and discover patterns during analysis. AI coding assistants now operate within terminal sessions but lack a compositional visualization toolkit, and existing terminal plotting tools offer neither the Grammar of Graphics nor the scientific chart types (volcano plots, survival curves, forest plots) that researchers use daily. No current tool bridges the gap between terminal-based analysis and publication-quality visualization.
