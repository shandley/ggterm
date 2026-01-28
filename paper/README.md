# ggterm Paper

Academic preprint for bioRxiv submission.

## Files

| File | Description |
|------|-------------|
| `preprint.md` | Main manuscript (~2500 words) |
| `references.bib` | BibTeX bibliography |

## Submission Checklist

### Before bioRxiv Submission

- [ ] Fill in author affiliation
- [ ] Add corresponding author email
- [ ] Add ORCID
- [ ] Create figures (1-4)
- [ ] Add acknowledgments
- [ ] Review and finalize references
- [ ] Convert to PDF (bioRxiv accepts PDF, Word, or LaTeX)

### Figures to Create

1. **Architecture diagram** - Data → Grammar Layers → Renderer → Output
2. **Feature comparison table** - ggterm vs plotext vs termgraph vs asciichart
3. **Iris analysis example** - 4-panel showing progression
4. **Conversational workflow** - User/AI interaction diagram

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
