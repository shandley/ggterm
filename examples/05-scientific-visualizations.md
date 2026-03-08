# Scientific Visualizations

Domain-specific plot types for genomics, clinical research, and statistical diagnostics. These are ggterm's key differentiators: specialized visualizations that no other terminal plotting tool provides.

**Prerequisites:** Run `npx ggterm-plot setup` to start the live viewer.

## Overview

ggterm includes 14 domain-specific geometry types across three categories:

| Category | Types |
|----------|-------|
| **Genomics** | volcano, MA, Manhattan, heatmap, biplot |
| **Clinical** | Kaplan-Meier, forest, ROC, Bland-Altman |
| **Diagnostics** | Q-Q, ECDF, funnel, control chart, scree |

This vignette walks through the most common scientific workflows using your own data files.

---

## Conversation

### Round 1: Differential Expression (Volcano Plot)

**You:** Load the DESeq2 results from `deseq2_results.csv`. Show me a volcano plot.

**Claude:** Loads the CSV and creates a volcano plot via `/ggterm-plot`. The file contains columns: gene, log2FoldChange, pvalue, padj.

> **In the viewer:** A scatter plot of log2 fold change (x-axis) vs -log10(p-value) (y-axis). Points are colored by significance:
> - **Red** (right side): up-regulated genes exceeding both fold-change and p-value thresholds
> - **Blue** (left side): down-regulated genes
> - **Gray** (center): non-significant genes
>
> Dashed vertical lines mark the fold-change threshold (default |log2FC| > 1) and a horizontal line marks the p-value cutoff (p < 0.05). Hover any point to see the gene name, fold change, and adjusted p-value.

---

### Round 2: Refining the Volcano Plot

**You:** Use adjusted p-value < 0.01 and fold change > 2. Label the top 10 most significant genes.

**Claude:** Adjusts thresholds and enables gene labeling.

> **In the viewer:** Fewer genes pass the stricter thresholds. The top 10 genes by significance are labeled with their names, spread across the upper extremes of the plot. The labeled genes are clearly the most biologically interesting hits.

**You:** What are the key options for volcano plots?

**Claude:** Invokes `/ggterm-help` and summarizes:

> Volcano plot options: `fc_threshold` (fold-change cutoff, default 1), `p_threshold` (p-value cutoff, default 0.05), `n_labels` (number of genes to label), `up_color`/`down_color`/`ns_color` (point colors), `y_is_neglog10` (if your p-values are pre-transformed).

---

### Round 3: Genome-Wide Association (Manhattan Plot)

**You:** Now load the GWAS summary statistics from `gwas_results.csv`. Create a Manhattan plot.

**Claude:** Loads the file (columns: SNP, CHR, BP, P) and creates a Manhattan plot.

> **In the viewer:** A classic GWAS Manhattan plot with chromosomes arrayed along the x-axis. Points alternate between two shades of blue by chromosome. Two horizontal threshold lines mark significance levels:
> - **Red dashed line:** genome-wide significance (p < 5e-8)
> - **Orange dashed line:** suggestive significance (p < 1e-5)
>
> SNPs exceeding genome-wide significance appear as red points above the top threshold. Hover any point to see the SNP ID, chromosome, position, and p-value.

---

### Round 4: Survival Analysis (Kaplan-Meier Curves)

**You:** Load the clinical trial data from `survival_data.csv`. Show Kaplan-Meier curves by treatment group.

**Claude:** Loads the file (columns: time, status, treatment) and creates survival curves.

> **In the viewer:** Step-function curves showing survival probability over time for each treatment group. Each group is a distinct color with a legend. Key features:
> - **Vertical drops** at each event (death/progression)
> - **Censored observations** marked with `+` symbols along the curves
> - **Y-axis** ranges from 0 to 1.0 (survival probability)
>
> The separation between curves shows whether the treatment affects survival. If the curves diverge early and stay apart, the treatment effect is strong.

**You:** Add confidence intervals and show the number at risk.

**Claude:** Updates with `show_ci: true` and `show_risk_table: true`.

> **In the viewer:** Shaded bands around each curve show 95% confidence intervals. A risk table below the plot shows how many patients remain at risk at each time point. The overlapping CI bands between groups suggest whether the difference is statistically significant.

---

### Round 5: Meta-Analysis (Forest Plot)

**You:** Load the meta-analysis results from `meta_analysis.csv`. Create a forest plot.

**Claude:** Loads the file (columns: study, estimate, ci_lower, ci_upper, weight) and creates a forest plot.

> **In the viewer:** A horizontal plot with one row per study:
> - **Square markers** at the point estimate (odds ratio or hazard ratio)
> - **Horizontal lines** extending from lower to upper CI bounds
> - **Study names** labeled on the left
> - **Vertical dashed line** at the null value (1.0 for ratios, 0 for differences)
>
> Studies whose CI crosses the null line show no significant effect. Studies entirely to one side show a clear effect. Square size scales with study weight. Hover any study to see the exact estimate and CI.

**You:** Show log scale and add the pooled summary diamond.

**Claude:** Updates with `log_scale: true` and `show_summary: true`.

> **In the viewer:** The x-axis switches to log scale (appropriate for odds ratios). A diamond shape at the bottom represents the pooled estimate across all studies. If the diamond doesn't cross the null line, the overall effect is statistically significant.

---

### Round 6: Classifier Performance (ROC Curve)

**You:** Load the classifier predictions from `predictions.csv`. Show me an ROC curve comparing the three models.

**Claude:** Loads the file (columns: fpr, tpr, model) and creates ROC curves.

> **In the viewer:** Three curves in different colors, one per model, plotted as TPR (sensitivity) vs FPR (1-specificity):
> - **Diagonal dashed line** represents a random classifier (AUC = 0.5)
> - Curves bowing toward the top-left corner indicate better discrimination
> - **AUC values** displayed in the legend for each model
>
> The model with the highest AUC (closest to 1.0) has the best overall discrimination. Hover along any curve to see the exact TPR/FPR at each threshold.

**You:** Mark the optimal threshold on the best model.

**Claude:** Updates with `show_optimal: true` for the best model.

> **In the viewer:** A red dot marks the optimal operating point (maximum Youden's J = TPR - FPR). This is the threshold where sensitivity and specificity are jointly maximized. Hover the point to see the exact threshold value.

---

### Round 7: Method Agreement (Bland-Altman Plot)

**You:** I have two measurement methods in `assay_comparison.csv`. Create a Bland-Altman plot to check agreement.

**Claude:** Loads the file (columns: method1, method2) and creates the agreement plot.

> **In the viewer:** A scatter plot where:
> - **X-axis:** mean of the two methods ((m1 + m2) / 2)
> - **Y-axis:** difference between methods (m1 - m2)
> - **Blue horizontal line:** mean bias (systematic difference)
> - **Red dashed lines:** 95% limits of agreement (bias +/- 1.96 SD)
>
> Points scattered uniformly within the limits indicate acceptable agreement. A trend (funnel shape or slope) suggests proportional bias. Hover points to see individual measurements from both methods.

---

### Round 8: Styling and Export

**You:** Go back to the volcano plot. Style it for Nature and export.

**Claude:** Retrieves the volcano plot via `/ggterm-history`, applies Nature style via `/ggterm-style`, and exports via `/ggterm-publish`.

> **In the viewer:** The volcano plot reappears with Nature journal formatting: compact dimensions, small fonts, minimal decoration. The three-color significance scheme remains clear at publication size.

```
Created: volcano-de-results.svg (vector)
Created: volcano-de-results.png (600x400px, 300 DPI)
```

> Ready for journal submission. The SVG scales to any column width without quality loss.

---

## Data Format Reference

Each scientific geom expects specific columns. Here are the typical file formats:

### Volcano Plot (DESeq2 output)
```csv
gene,log2FoldChange,pvalue,padj
BRCA1,-2.3,0.00001,0.001
TP53,3.1,0.0000001,0.00001
MYC,0.2,0.45,0.89
```

### Manhattan Plot (GWAS summary statistics)
```csv
SNP,CHR,BP,P
rs12345,1,100000,0.03
rs67890,1,200000,5e-9
rs11111,2,150000,0.42
```

### Kaplan-Meier (survival data)
```csv
time,status,treatment
12.5,1,drug
24.0,0,placebo
18.3,1,drug
```
Where `status`: 1 = event occurred, 0 = censored.

### Forest Plot (meta-analysis)
```csv
study,estimate,ci_lower,ci_upper,weight
Smith 2020,1.45,1.10,1.90,15.2
Jones 2021,1.22,0.95,1.57,22.8
Lee 2022,1.68,1.30,2.17,18.5
```

### ROC Curve (classifier output)
```csv
fpr,tpr,model
0.0,0.0,logistic
0.1,0.65,logistic
0.2,0.80,logistic
```

### Bland-Altman (paired measurements)
```csv
method1,method2
10.2,10.5
15.8,15.3
22.1,22.4
```

---

## CLI Direct Usage

For power users who prefer the command line:

```bash
# Volcano plot
npx ggterm-plot results.csv log2FoldChange pvalue gene "DE Results" volcano

# Manhattan plot
npx ggterm-plot gwas.csv BP P CHR "GWAS" manhattan

# Kaplan-Meier
npx ggterm-plot survival.csv time status treatment "Survival" kaplan_meier

# Forest plot
npx ggterm-plot meta.csv estimate study - "Meta-Analysis" forest

# ROC curve
npx ggterm-plot predictions.csv fpr tpr model "ROC" roc

# Bland-Altman
npx ggterm-plot assay.csv method1 method2 - "Agreement" bland_altman
```

---

## Key Insights

Scientific visualizations in ggterm follow the same conversational workflow as standard charts:

1. **Load your data** in whatever format your analysis pipeline produces
2. **Ask for the plot type by name** and Claude handles column mapping
3. **Refine thresholds and options** through follow-up conversation
4. **Style and export** using the same presets and skills as any other plot

The difference is domain knowledge: ggterm understands what fold-change thresholds mean, how to compute Kaplan-Meier estimates, where to place null lines in forest plots, and how to calculate AUC for ROC curves. You describe what you want in scientific terms, not plotting syntax.

## Skills Used

- `/ggterm-plot` — creating all scientific visualizations
- `/ggterm-help` — quick reference for geom options
- `/ggterm-history` — retrieving earlier plots
- `/ggterm-style` — Nature journal formatting
- `/ggterm-publish` — SVG/PNG export for publication
