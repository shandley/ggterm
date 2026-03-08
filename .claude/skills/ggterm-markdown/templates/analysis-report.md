# Analysis Report Template

Use this template structure for data analysis reports with ggterm visualizations.

---

# [Report Title]

**Date**: [Date]
**Author**: [Author]
**Dataset**: [Dataset name/source]

## Executive Summary

[2-3 sentence summary of key findings]

## Data Overview

### Dataset Description

| Property | Value |
|----------|-------|
| Rows | [N] |
| Columns | [N] |
| Time Period | [Start] to [End] |
| Source | [Data source] |

### Variables

| Variable | Type | Description |
|----------|------|-------------|
| var1 | numeric | Description |
| var2 | categorical | Description |
| var3 | datetime | Description |

## Exploratory Analysis

### Distribution Analysis

> **Histogram** — [Describe distribution shape, center, spread, and any notable features like skewness or outliers]

<details>
<summary>Plot Specification</summary>

```json
{
  "data": "...",
  "aes": { "x": "variable" },
  "geoms": [{ "type": "histogram", "params": { "bins": 20 } }]
}
```

</details>

**Key observations**:
- Observation 1
- Observation 2

### Relationship Analysis

> **Scatter plot** — [Describe relationship direction, strength, clusters, and outliers. Note any grouping patterns visible in the color encoding]

<details>
<summary>Plot Specification</summary>

```json
{
  "data": "...",
  "aes": { "x": "var1", "y": "var2", "color": "group" },
  "geoms": [{ "type": "point" }]
}
```

</details>

**Key observations**:
- Observation 1
- Observation 2

### Group Comparisons

> **Box plot** — [Describe median differences, spread within groups, overlap between groups, and any outliers]

<details>
<summary>Plot Specification</summary>

```json
{
  "data": "...",
  "aes": { "x": "group", "y": "value" },
  "geoms": [{ "type": "boxplot" }]
}
```

</details>

**Key observations**:
- Observation 1
- Observation 2

## Findings

### Finding 1: [Title]

[Detailed description with supporting evidence]

### Finding 2: [Title]

[Detailed description with supporting evidence]

### Finding 3: [Title]

[Detailed description with supporting evidence]

## Recommendations

1. **Recommendation 1**: [Description]
2. **Recommendation 2**: [Description]
3. **Recommendation 3**: [Description]

## Methodology

### Data Preparation

- [Step 1]
- [Step 2]

### Analysis Approach

[Description of methods used]

## Appendix

### A. Data Quality Notes

- [Any data quality issues encountered]
- [Missing value handling]
- [Outlier treatment]

---

*Report generated with ggterm — Grammar of Graphics for Terminal*
