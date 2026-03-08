# ggterm Academic Publication Strategy

## Current Status

- **npm**: @ggterm/core@0.3.10 published
- **Repo**: https://github.com/shandley/ggterm (public)
- **Preprint**: Draft ready in `paper/drafts/paper-v2.md` with figures

## Novel Contribution

### Traditional Framing (Weak)
"A plotting library for terminals" — competes with plotext, asciichart, termgraph

### AI-Tool Framing (Moderate)
"A visualization layer enabling AI agents to perform exploratory data analysis"

### Specification Framing (Strong)
"A Grammar of Graphics **primitive catalog** — 65 geometry types as a backend-agnostic `PlotSpec` specification — designed for programmatic composition by AI agents. The first GoG implementation that treats the specification as the primary artifact and renderers as pluggable consumers."

## Key Differentiators

| Feature | ggterm | Competitors |
|---------|--------|-------------|
| Grammar of Graphics | Full implementation | None |
| PlotSpec (backend-agnostic spec) | JSON-serializable IR | None |
| LLM-friendly API | Declarative, composable | Imperative |
| Geometry types | 65 | 1-15 |
| Rendering backends | 2 (terminal + Vega-Lite) | 1 |
| Agent Skills | Built-in (8 skills) | None |
| Plot history | With provenance | None |
| Reproducibility | PlotSpec JSON + Vega-Lite | None |

## Publication Pipeline

```
Week 1-2               Week 3-4              Week 5+
 │                        │                    │
 ▼                        ▼                    ▼
Soft launch           bioRxiv               JOSS
(colleagues)          preprint            submission
```

## bioRxiv Preprint

**Location**: `paper/drafts/paper-v2.md`

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
- [x] Comprehensive tests (2,158)
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
