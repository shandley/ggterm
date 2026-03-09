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
