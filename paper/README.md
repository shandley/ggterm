# ggterm Paper

JOSS (Journal of Open Source Software) submission.

## Files

| File | Description |
|------|-------------|
| `paper.md` | JOSS paper (~1000 words) |
| `preprint.md` | Extended preprint (~3500 words, supplementary) |
| `references.bib` | BibTeX bibliography |

## JOSS Submission Checklist

### Paper Requirements
- [x] Title
- [x] Author with ORCID (placeholder - needs real ORCID)
- [x] Affiliation
- [x] Summary section
- [x] Statement of Need section
- [x] Key Features section
- [x] References in BibTeX format
- [ ] Acknowledgements (to be added)

### Repository Requirements
- [x] Open source license (MIT)
- [x] README with installation instructions
- [x] Example usage documentation
- [x] Automated tests (2158 tests)
- [ ] Contributing guidelines (CONTRIBUTING.md)
- [ ] Code of conduct (CODE_OF_CONDUCT.md)
- [x] Version number in package.json

### Before Submission
- [ ] Add real ORCID to paper.md
- [ ] Verify affiliation
- [ ] Add acknowledgements
- [ ] Create CONTRIBUTING.md
- [ ] Create CODE_OF_CONDUCT.md
- [ ] Final review of paper.md

## Figures

All figures are in `figures/` directory:

| Figure | File | Description |
|--------|------|-------------|
| 1 | `figure1-architecture.svg` | ggterm architecture |
| 2 | `figure2-comparison.svg` | Geometry taxonomy + scientific examples |
| 3 | `figure3-provenance.svg` | Plot history and provenance system |
| 4 | `figure4-workflow.svg` | AI-assisted workflow |

**Supplementary:**
- `figure3-iris-supplementary.svg` - Iris analysis example
- `preprint.md` - Extended paper with full details

## JOSS Submission

1. Go to https://joss.theoj.org/papers/new
2. Enter repository URL: https://github.com/shandley/ggterm
3. Complete submission form
4. Wait for editor assignment
5. Address reviewer feedback

## Building the Paper

JOSS uses their own build system, but you can preview locally:

```bash
# Install pandoc and dependencies
# Then generate PDF preview
pandoc paper.md -o paper.pdf \
  --bibliography=references.bib \
  --citeproc \
  -V geometry:margin=1in
```

## Word Count

JOSS papers should be ~1000 words. Check with:

```bash
# Approximate word count (excluding code blocks and YAML)
grep -v '```' paper.md | grep -v '^---' | wc -w
```
