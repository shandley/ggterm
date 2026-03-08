# Comparative Analysis

Compare distributions across groups using the **iris** dataset with statistical annotations, faceting, and interactive exploration in the live viewer.

**Prerequisites:** Run `npx ggterm-plot setup` to start the live viewer.

## Dataset: iris

Fisher's iris dataset with measurements for 150 flowers across 3 species:

| Column | Description |
|--------|-------------|
| sepal_length | Sepal length in cm |
| sepal_width | Sepal width in cm |
| petal_length | Petal length in cm |
| petal_width | Petal width in cm |
| species | setosa, versicolor, or virginica |

---

## Conversation

### Round 1: Initial Comparison

**You:** Load the iris dataset. Compare sepal length across the three species.

**Claude:** Creates a grouped bar chart of means via `/ggterm-plot`.

> **In the viewer:** Three bars showing mean sepal length — setosa (5.0 cm), versicolor (5.9 cm), virginica (6.6 cm). A clear increasing trend across species. Hover each bar to see the exact mean and sample size (n=50 each).

---

### Round 2: Full Distributions

**You:** Show me the full distribution, not just the means. Box plots would be better.

**Claude:** Creates grouped box plots.

> **In the viewer:** Three box plots side by side showing quartiles, median, and whiskers:
> - **Setosa:** median 5.0, tight IQR (4.8–5.2), range 4.3–5.8
> - **Versicolor:** median 5.9, moderate spread (5.6–6.3), range 4.9–7.0
> - **Virginica:** median 6.5, widest spread (6.2–6.9), range 4.9–7.9
>
> Hover the boxes to see exact quartile values. The overlap between versicolor and virginica is clear — their ranges overlap substantially.

---

### Round 3: Overlaid Density

**You:** Overlay the distributions so I can compare them directly.

**Claude:** Creates overlaid density curves.

> **In the viewer:** Three colored density curves on the same axes, one per species. The shape of each distribution is now visible:
> - Setosa: narrow, symmetric, peaked at 5.0
> - Versicolor: moderate width, centered at 5.9
> - Virginica: widest, centered at 6.5
>
> The overlap zones between species are immediately apparent. Semi-transparent fills let you see where distributions cross.

---

### Round 4: Multi-Variable Comparison

**You:** Compare all four measurements across species side by side.

**Claude:** Creates a 2x2 faceted panel of box plots.

> **In the viewer:** Four panels in a grid — sepal length, sepal width, petal length, petal width — each with three box plots by species:
> - **Petal measurements** show the strongest species separation — almost no overlap for petal length
> - **Sepal width** is the least discriminating — all three species overlap heavily
> - **Sepal length** has moderate separation
>
> Each panel is independently interactive — zoom into any panel for detail. This layout makes it immediately obvious that petal measurements are the best discriminators.

---

### Round 5: Statistical Annotations

**You:** Add statistical significance — which differences are meaningful?

**Claude:** Adds statistical test annotations to the petal length panel.

> **In the viewer:** The petal length box plot now shows significance brackets:
> - Setosa vs Versicolor: *** (p < 0.001)
> - Versicolor vs Virginica: *** (p < 0.001)
> - Setosa vs Virginica: *** (p < 0.001)
>
> Annotation below: "ANOVA F = 1180, p < 0.001, η² = 0.94 (very large effect)"
>
> All pairwise comparisons are highly significant. Petal length alone explains 94% of the variance between species.

---

### Round 6: Feature Importance

**You:** Which measurement best separates the species?

**Claude:** Creates a feature discriminability summary.

> **In the viewer:** A horizontal bar chart ranking the four measurements by separation score:
> - **petal_length:** 0.94 — best single discriminator
> - **petal_width:** 0.92 — nearly as good
> - **sepal_length:** 0.62 — moderate
> - **sepal_width:** 0.36 — weakest
>
> Petal length alone achieves 100% accuracy for separating setosa from the other two species using a threshold of 2.5 cm.

---

### Round 7: Refinement

**You:** Clean up the 4-panel comparison — use proper axis labels, add a title "Figure 2: Morphometric Comparison Across Iris Species", and style it for a paper.

**Claude:** Applies customizations via `/ggterm-customize` and Wilke style via `/ggterm-style`.

> **In the viewer:** The 4-panel layout updates in place with proper formatting:
> - Clean sans-serif font, subtle gridlines
> - Each panel titled with the measurement name
> - Axis labels include units (cm)
> - Figure title and caption with sample size
> - Colorblind-safe species palette

---

### Round 8: Export and Report

**You:** Export this figure and generate a summary for the methods section.

**Claude:** Exports via `/ggterm-publish` and generates a summary via `/ggterm-markdown`.

```
Created: iris-morphometric-comparison.svg (vector)
Created: iris-morphometric-comparison.png (600x400px)
```

> Claude also generates a markdown summary:
>
> *"Figure 2 shows morphometric comparisons across three iris species (n=50 each). Petal measurements showed the strongest species separation (petal length η²=0.94, petal width η²=0.92), while sepal width was least discriminating (η²=0.36). All pairwise comparisons were significant (p<0.001, ANOVA). Petal length ≥2.5 cm perfectly separates I. setosa from I. versicolor and I. virginica."*

---

## Analysis Patterns

This session demonstrated:

1. **Progressive complexity** — means → distributions → overlaid → multi-panel → statistical
2. **Distribution comparison** — box plots and density curves for different perspectives
3. **Multi-variable faceting** — 2x2 grid to compare all measurements simultaneously
4. **Statistical annotations** — significance brackets, effect sizes, ANOVA results
5. **Feature ranking** — identifying the most discriminating variables
6. **Report generation** — export figures and generate methods text together

## Skills Used

- `/ggterm-plot` — creating all visualizations
- `/ggterm-style` — Wilke preset for academic styling
- `/ggterm-customize` — titles, labels, formatting
- `/ggterm-publish` — SVG/PNG export
- `/ggterm-markdown` — generating methods section summary
