---
title: 'ggterm: A Grammar of Graphics for Terminal-Based Scientific Visualization'
tags:
  - TypeScript
  - visualization
  - grammar of graphics
  - terminal
  - scientific computing
  - bioinformatics
authors:
  - name: Scott A. Handley
    orcid: 0000-0000-0000-0000
    affiliation: 1
affiliations:
  - name: Washington University School of Medicine, St. Louis, MO, USA
    index: 1
date: 31 January 2026
bibliography: references.bib
---

# Summary

`ggterm` is a TypeScript implementation of Wilkinson's Grammar of Graphics [@wilkinson2005grammar] designed for terminal environments. The library provides 68 geometry types spanning general-purpose visualization, genomics (volcano plots, Manhattan plots), clinical research (Kaplan-Meier survival curves, forest plots), and statistical diagnostics (Q-Q plots, control charts). Visualizations are constructed through a declarative, composable API where users specify data mappings, geometries, scales, and facets as layered components. This architecture enables natural language interaction with AI assistants, allowing researchers to create and refine visualizations through conversation rather than memorizing syntax.

All plots are automatically persisted with full provenance metadata (data source, specification, timestamp), enabling reproducibility without manual save actions. The library exports to Vega-Lite [@satyanarayan2017vegalite] for publication-quality PNG, SVG, and PDF output. `ggterm` bridges the gap between rapid terminal-based exploration and reproducible scientific figures.

# Statement of Need

Scientific computing increasingly occurs in terminal environments: remote servers, compute clusters, and containerized pipelines. In these settings, graphical display is limited or absent. Researchers SSH into analysis servers, run batch jobs, and inspect results through text interfaces. Yet visualization tools for these environments remain primitive compared to graphical options.

Existing terminal plotting libraries use imperative APIs that limit both depth and integration with AI-assisted workflows. When researchers work with AI assistants [@perkel2023ai], they need visualization tools with declarative specifications that can be generated, modified, and composed through natural language requests.

Additionally, scientific visualization has field-specific requirements. Genomics researchers need volcano plots and Manhattan plots. Clinical trialists need Kaplan-Meier curves and forest plots. Statisticians need Q-Q plots and control charts. These specialized visualizations encode field knowledge that standard plotting tools cannot express.

`ggterm` addresses these gaps by providing a Grammar of Graphics architecture [@wickham2010layered] with complete scientific visualization support. The declarative layer system (data, aesthetics, geometries, scales, coordinates, facets) maps naturally to how humans describe visualizations, enabling effective AI-assisted analysis.

# Key Features

**Grammar of Graphics Architecture.** Visualizations compose from independent layers. Users specify *what* to visualize (map `expression` to y-axis, color by `treatment`) without prescribing rendering details:

```typescript
gg(data)
  .aes({ x: 'log2FoldChange', y: 'negLog10Pvalue', color: 'significant' })
  .geom(geom_volcano())
  .labs({ title: 'Differential Expression' })
```

**68 Geometry Types.** The library includes:

- Standard visualizations: scatter, line, bar, histogram, boxplot [@tukey1977exploratory], violin, density
- Scientific: volcano, MA, Manhattan, heatmap, correlation, biplot
- Clinical: Kaplan-Meier [@kaplan1958nonparametric], forest, ROC, Bland-Altman [@bland1986statistical]
- Statistical diagnostics: Q-Q, ECDF, funnel, control charts, scree plots
- Set/hierarchical: UpSet [@lex2014upset], dendrogram, treemap, sankey
- Terminal-native: braille (8x resolution), sparkline, bullet, waffle

**Plot History and Provenance.** Every plot is automatically saved to `~/.ggterm/history/` with JSON specifications capturing data source, aesthetic mappings, and parameters. Researchers can search, retrieve, and re-render any historical plot months later.

**Publication Export.** Plots export to Vega-Lite specifications, then convert to PNG, SVG, or PDF via standard tools. Style presets (Tufte [@tufte2001], Nature, Economist) apply publication-appropriate formatting.

**AI Integration.** Seven deterministic skills for Claude Code [@anthropic2024claude] enable natural language workflows from data loading through publication export. The Grammar of Graphics design supports iterative refinement: each modification layers onto existing specifications.

# Comparison with Related Software

Grammar of Graphics implementations such as ggplot2 [@wickham2016ggplot2] in R and gramm [@morel2018gramm] in Matlab provide compositional visualization design but require graphical displays. Terminal visualization libraries like `plotext` [@plotext2023] (Python) and `termgraph` (Python) provide basic chart types through imperative APIs. `gnuplot` offers more geometry types but lacks the Grammar of Graphics' compositional design. None of these tools combine scientific visualization support (survival curves, forest plots), plot history for reproducibility, and AI agent integration in a terminal-native package.

`ggterm` uniquely combines Grammar of Graphics architecture, 68 geometry types covering scientific fields, automatic provenance tracking, and first-class AI assistant support in a terminal-native package.

# Acknowledgements

[To be added]

# References
