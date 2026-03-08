# ggterm Publishing Plan

## Current Status

| Item | Status |
|------|--------|
| npm package | @ggterm/core@0.3.10 published |
| GitHub repo | Public at github.com/shandley/ggterm |
| Documentation | README, examples, API docs, architecture |
| Tests | 2,158 tests passing |
| CI/CD | GitHub Actions for npm publish |
| bioRxiv preprint | Draft ready in `paper/` |

## Package

Single package: `@ggterm/core`

Contains everything:
- Grammar engine with fluent API and PlotSpec specification
- 65 geometry types (basic, distribution, specialized, scientific)
- 73 scale functions
- Terminal ASCII rendering backend
- Vega-Lite export backend
- CLI tool with setup/serve/init/inspect/suggest
- Live plot viewer (SSE-powered)
- Plot history with provenance
- 8 Claude Code skills for AI-assisted workflows

## Completed Milestones

- [x] Initial npm publication (v0.2.0)
- [x] GitHub Actions automated publishing
- [x] Package optimization (414KB → 134KB)
- [x] Repository made public
- [x] AI-forward examples with bundled datasets
- [x] User-focused README
- [x] bioRxiv preprint draft
- [x] Publication-quality SVG figures
- [x] Live plot viewer with SSE
- [x] 8 Claude Code skills
- [x] One-command onboarding (`npx ggterm-plot setup`)
- [x] Documentation rewrite with primitives-first narrative

## Next Steps

### Immediate
1. **Share with colleagues** — Get feedback on workflow
2. **Finalize bioRxiv preprint** — Add affiliation, convert to PDF
3. **Submit to bioRxiv** — Bioinformatics category

### After bioRxiv
4. **Announce** — HN, Twitter, Reddit
5. **JOSS submission** — Condense preprint to ~1000 words
6. **Iterate based on feedback**

## Version History

| Version | Changes |
|---------|---------|
| 0.3.10 | Documentation rewrite, setup command, welcome plot |
| 0.3.8 | Help system, command palette |
| 0.3.6 | Style/customize watcher in live viewer |
| 0.3.5 | Live plot viewer with SSE |
| 0.2.5 | Fixed repo URLs, working npm publish |
| 0.2.0 | Initial public release |

## Success Metrics

1. **Adoption**: npm downloads
2. **Feedback**: GitHub issues/discussions
3. **Citations**: After bioRxiv/JOSS publication
