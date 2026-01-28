# ggterm Academic Publication Strategy

## Current Status

- **npm**: @ggterm/core@0.2.5 published
- **Repo**: https://github.com/shandley/ggterm (public)
- **Preprint**: Draft ready in `paper/preprint.md` with SVG figures

## Novel Contribution

### Traditional Framing (Weak)
"A plotting library for terminals" - competes with plotext, asciichart, termgraph

### AI-Agent Framing (Strong)
"A visualization layer enabling AI agents to perform exploratory data analysis" - first of its kind

## Key Differentiators

| Feature | ggterm | Competitors |
|---------|--------|-------------|
| Grammar of Graphics | Full implementation | None |
| LLM-friendly API | Declarative, composable | Imperative |
| Geometry types | 30 | 1-15 |
| Agent Skills | Built-in (6 skills) | None |
| Plot history | With provenance | None |
| Reproducibility | PlotSpec JSON + Vega-Lite | None |

## Publication Pipeline

```
Now                    Week 2-3              Week 4+
 │                        │                    │
 ▼                        ▼                    ▼
Soft launch           bioRxiv               JOSS
(colleagues)          preprint            submission
```

## bioRxiv Preprint

**Location**: `paper/preprint.md`

**Figures** (SVG, publication-ready):
1. `figure1-architecture.svg` - Data flow through grammar layers
2. `figure2-comparison.svg` - Feature matrix vs competitors
3. `figure3-iris.svg` - 4-panel iris analysis example
4. `figure4-workflow.svg` - Conversational AI workflow

**Before submission**:
- [ ] Add author affiliation
- [ ] Add ORCID
- [ ] Final review of text
- [ ] Convert to PDF
- [ ] Submit to bioRxiv (Bioinformatics category)

## JOSS Submission (After bioRxiv)

**Why JOSS**:
- Free (no APC)
- Code-focused peer review on GitHub
- Precedent: "Gramm: grammar of graphics plotting in Matlab"

**Requirements**:
- [x] OSI-approved license (MIT)
- [x] Good documentation
- [x] Comprehensive tests (1,220+)
- [x] Feature-complete
- [ ] 6+ months public development history

**Checklist**:
- [ ] paper.md in repository root (condense from preprint)
- [ ] paper.bib with references
- [ ] CITATION.cff file
- [ ] Statement of need
- [ ] Suggest 5+ reviewers

## Author Information

- **Author**: Scott Handley
- **Affiliation**: [To be added]
- **ORCID**: [To be added]
