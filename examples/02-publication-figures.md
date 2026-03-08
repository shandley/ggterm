# Publication Figures

Iteratively refine iris plots to publication quality using style presets, customization, and export. This vignette showcases the full style → customize → publish pipeline.

**Prerequisites:** Run `npx ggterm-plot setup` to start the live viewer.

## Dataset: iris

Fisher's classic iris dataset with measurements for 150 flowers across 3 species:

| Column | Description |
|--------|-------------|
| sepal_length | Sepal length in cm |
| sepal_width | Sepal width in cm |
| petal_length | Petal length in cm |
| petal_width | Petal width in cm |
| species | setosa, versicolor, or virginica |

---

## Conversation

### Round 1: Initial Plot

**You:** Load the iris dataset. Show me petal length vs petal width.

**Claude:** Creates a scatter plot via `/ggterm-plot`.

> **In the viewer:** 150 points showing the relationship between petal length and width. Two clear clusters are immediately visible — a tight group of small petals and a larger spread of bigger petals. Hover any point to see exact measurements.

---

### Round 2: Adding Species

**You:** Color by species to see the groupings.

**Claude:** Adds species color encoding.

> **In the viewer:** Points separate into three colored groups with a legend:
> - **Setosa** — small, tightly clustered in the bottom-left (short petals)
> - **Versicolor** — intermediate, some overlap with virginica
> - **Virginica** — largest petals, top-right cluster
>
> The species boundaries become obvious: setosa is completely separable, while versicolor and virginica overlap slightly.

---

### Round 3: Classification Boundaries

**You:** Add reference lines at petal length 2.5 and petal width 0.75 to show the species boundaries.

**Claude:** Adds horizontal and vertical reference lines.

> **In the viewer:** Two dashed lines divide the plot into regions. Setosa sits entirely below petal_width = 0.75 and left of petal_length = 2.5. The boundary achieves perfect separation for setosa.

---

### Round 4: Faceted View

**You:** Show each species in its own panel for clearer comparison.

**Claude:** Creates a faceted plot.

> **In the viewer:** Three panels side by side, one per species. Each shows the petal length vs width relationship within that species only. The scale differences become apparent — setosa petals range 1–2 cm, while virginica spans 4.5–7 cm. Pan and zoom work independently in each panel.

---

### Round 5: Applying a Style Preset

**You:** Style this like Claus Wilke's book.

**Claude:** Applies the Wilke preset via `/ggterm-style`.

> **In the viewer:** The plot transforms in place:
> - Clean sans-serif font (Helvetica Neue)
> - Subtle horizontal gridlines only
> - No bold titles — understated, academic tone
> - Colorblind-safe palette
> - Left-aligned title
>
> The data stands out without visual clutter. This is the recommended style for academic papers.

---

### Round 6: Comparing Styles

**You:** Try Tufte style instead.

**Claude:** Switches to Tufte via `/ggterm-style`.

> **In the viewer:** A dramatic shift:
> - No gridlines, no borders, no tick marks
> - Serif font (Georgia) — elegant and literary
> - Grayscale palette with different point shapes per species
> - Maximum data-ink ratio — nothing that doesn't represent data
>
> *"Above all else, show the data."* — Edward Tufte

**You:** Show me Economist style.

**Claude:** Switches to Economist via `/ggterm-style`.

> **In the viewer:** The distinctive editorial look:
> - Light blue-gray background (#d5e4eb)
> - White horizontal gridlines
> - Bold black baseline on x-axis
> - Deep, saturated colors
> - Legend at top-right
>
> Designed for magazine publication — high visual impact.

**You:** Go back to Wilke — that's best for my paper.

**Claude:** Reapplies Wilke preset.

---

### Round 7: Fine-Tuning

**You:** Change the title to "Figure 1: Petal Morphology Across Iris Species". Make axis labels italic. Add a caption with the sample size.

**Claude:** Applies refinements via `/ggterm-customize`.

> **In the viewer:** Title, labels, and caption update in place. The figure now looks ready for a journal methods section — properly labeled with italicized axis text and an "n = 150 (50 per species)" caption.

---

### Round 8: Export

**You:** Export as SVG for journal submission.

**Claude:** Generates output via `/ggterm-publish`.

```
Created: iris-petal-morphology.svg (vector, infinite resolution)
Also created: iris-petal-morphology.png (600x400px, 300 DPI)
Also created: iris-petal-morphology.html (interactive)
```

> The SVG is suitable for Nature/Science figure requirements. Vector graphics scale perfectly at any size.

---

## Style Presets Reference

All 6 publication-quality presets, with their design philosophy:

### Wilke (Recommended for Academic Papers)
- Subtle Y-axis gridlines only — guides the eye without clutter
- Clean sans-serif typography (Helvetica Neue)
- Colorblind-safe palettes
- No bold titles — the data speaks for itself
- Based on Claus Wilke's *Fundamentals of Data Visualization*

### Tufte (Maximum Data-Ink Ratio)
- No grid, no borders, no tick marks — only data
- Serif typography (Georgia) — elegant, literary
- Grayscale with redundant shape encoding
- Direct labeling preferred over legends
- Based on Edward Tufte's *The Visual Display of Quantitative Information*

### Nature (Journal Submission)
- Compact dimensions (180x150px) — fits journal column width
- Small fonts (8–10pt) for dense layouts
- No grid — minimal decoration
- Publication-ready without modifications

### Economist (Editorial/Magazine)
- Signature blue-gray background
- White horizontal gridlines — distinctive look
- Bold colors and titles — high visual impact
- Legend at top-right

### APA (Psychology/Social Science)
- Times New Roman — APA style guide requirement
- Italic titles and axis labels
- Grayscale — APA recommends avoiding color when possible
- Figure numbering support

### Minimal (Web/Presentations)
- No decoration, no grid, no borders
- System fonts — works everywhere
- Maximum whitespace — clean presentation slides

---

## Figure Evolution

The figure evolved through 8 conversation rounds:

1. Basic scatter plot → saw two clusters
2. Added species coloring → identified three groups
3. Added classification boundaries → perfect setosa separation
4. Faceted by species → compared within-group patterns
5. Applied Wilke style → academic tone
6. Compared Tufte and Economist → chose Wilke
7. Fine-tuned labels and caption → publication-ready
8. Exported as SVG → ready for submission

## Skills Used

- `/ggterm-plot` — creating visualizations
- `/ggterm-style` — applying publication presets (Wilke, Tufte, Economist)
- `/ggterm-customize` — fine-tuning titles, labels, captions
- `/ggterm-publish` — exporting SVG/PNG for journal submission
