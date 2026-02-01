# ggterm Paper

Academic preprint for bioRxiv submission.

## Files

| File | Description |
|------|-------------|
| `preprint.md` | Main manuscript (~3500 words) |
| `references.bib` | BibTeX bibliography |

## Submission Checklist

### Before bioRxiv Submission

- [ ] Fill in author affiliation
- [ ] Add corresponding author email
- [ ] Add ORCID
- [ ] Convert ASCII figures to publication graphics
- [ ] Add acknowledgments
- [ ] Review and finalize references
- [ ] Convert to PDF (bioRxiv accepts PDF, Word, or LaTeX)

### Figures

All figures are in `figures/` directory as ASCII art (to be converted to proper graphics):

| Figure | File | Description |
|--------|------|-------------|
| 1 | `figure1-architecture.txt` | ggterm architecture: Data → Grammar Layers → Renderer → Output |
| 2 | `figure2-comparison.txt` | (A) Taxonomy of 68 geometry types by domain, (B) Scientific visualization examples |
| 3 | `figure3-panels.txt` | Plot history and provenance: (A) Directory structure, (B) JSON schema, (C) Retrieval workflow |
| 4 | `figure4-workflow.txt` | AI-assisted conversational analysis workflow |

**Supplementary:**
- `figure3-iris-analysis.txt` - Example iris analysis (4-panel progression, can be used as supplementary)

To convert to publication graphics:
- Use Lucidchart, draw.io, or Figma for diagrams (Figures 1, 3, 4)
- Recreate with actual ggterm output for Figure 2B examples
- SVG versions exist but need regeneration after ASCII updates

### bioRxiv Submission

1. Go to https://www.biorxiv.org/submit-a-manuscript
2. Select "New Manuscript"
3. Choose subject area: **Bioinformatics**
4. Upload PDF
5. Add metadata (title, authors, abstract)
6. Select license (recommend CC-BY)
7. Submit

### After bioRxiv

- [ ] Share DOI on social media
- [ ] Post to Hacker News
- [ ] Condense for JOSS submission

## Converting to PDF

Using pandoc:

```bash
pandoc preprint.md -o preprint.pdf \
  --bibliography=references.bib \
  --citeproc \
  -V geometry:margin=1in
```

Or use a Markdown editor with PDF export (Typora, VS Code with extensions).
