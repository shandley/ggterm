# ggterm Paper

Dual submission: JOSS (peer review) + bioRxiv (preprint).

## Files

| File | Purpose | Target |
|------|---------|--------|
| `paper.md` | Short paper (~1000 words) | JOSS |
| `preprint.md` | Extended paper (~3500 words) | bioRxiv |
| `references.bib` | BibTeX bibliography | Both |

## Submission Strategy

1. **bioRxiv** - Submit `preprint.md` as preprint for immediate visibility
2. **JOSS** - Submit `paper.md` for peer review (can reference bioRxiv DOI)

---

## bioRxiv Submission

### Checklist
- [ ] Fill in author affiliation in `preprint.md`
- [ ] Add corresponding author email
- [ ] Add ORCID
- [ ] Convert to PDF
- [ ] Add acknowledgements

### Steps
1. Go to https://www.biorxiv.org/submit-a-manuscript
2. Select "New Manuscript"
3. Choose subject area: **Bioinformatics**
4. Upload PDF (convert with pandoc - see below)
5. Add metadata (title, authors, abstract)
6. Select license: **CC-BY**
7. Submit

### Convert to PDF
```bash
pandoc preprint.md -o preprint.pdf \
  --bibliography=references.bib \
  --citeproc \
  -V geometry:margin=1in
```

---

## JOSS Submission

### Paper Checklist
- [x] Title
- [x] Author with ORCID (placeholder - needs real ORCID)
- [x] Affiliation
- [x] Summary section
- [x] Statement of Need section
- [x] Key Features section
- [x] References in BibTeX format
- [ ] Acknowledgements

### Repository Checklist
- [x] Open source license (MIT)
- [x] README with installation instructions
- [x] Example usage documentation
- [x] Automated tests (2158 tests)
- [x] Contributing guidelines (CONTRIBUTING.md)
- [ ] Code of conduct (CODE_OF_CONDUCT.md) - get from contributor-covenant.org
- [x] Version number in package.json

### Steps
1. Go to https://joss.theoj.org/papers/new
2. Enter repository URL: `https://github.com/shandley/ggterm`
3. Complete submission form
4. Wait for editor assignment
5. Address reviewer feedback

### Preview Paper
```bash
pandoc paper.md -o paper.pdf \
  --bibliography=references.bib \
  --citeproc \
  -V geometry:margin=1in
```

---

## Figures

All figures in `figures/` directory:

| Figure | File | Description |
|--------|------|-------------|
| 1 | `figure1-architecture.svg` | ggterm architecture |
| 2 | `figure2-comparison.svg` | Geometry taxonomy + scientific examples |
| 3 | `figure3-provenance.svg` | Plot history and provenance system |
| 4 | `figure4-workflow.svg` | AI-assisted workflow |

**Supplementary:**
- `figure3-iris-supplementary.svg` - Iris analysis example

## Timeline

1. Submit to **bioRxiv** first (immediate DOI)
2. Add bioRxiv DOI to JOSS paper
3. Submit to **JOSS** (peer review)
4. Update bioRxiv with JOSS acceptance
