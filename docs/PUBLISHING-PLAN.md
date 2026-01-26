# ggterm Publishing Plan

## Executive Summary

ggterm is a TypeScript implementation of the Grammar of Graphics for terminal interfaces. Current maturity assessment: **7.5/10** - ready for beta publication with targeted improvements.

## Competitive Landscape

| Library | Language | Stars | Approach | ggterm Advantage |
|---------|----------|-------|----------|------------------|
| plotext | Python | 3.3k | Imperative API | Declarative, composable layers |
| asciichart | JS | 2k | Line charts only | Full geometry set (20+ types) |
| termgraph | Python | 3k | Bar charts only | Multi-geometry, faceting |
| uniplot | Python | 2.1k | Scatter/line only | Stats, transformations |

**Unique Value Proposition**: First true ggplot2-equivalent for terminals with multi-framework support.

## Package Inventory

| Package | Purpose | Status |
|---------|---------|--------|
| @ggterm/core | Grammar engine, rendering, CLI | Production-ready |
| @ggterm/render-braille | 2x4 dot Braille rendering | Partial (rendering works) |
| @ggterm/render-block | Half-block character rendering | Complete |
| @ggterm/render-sixel | Sixel/Kitty/iTerm2 pixel rendering | Complete |
| @ggterm/opentui | React/Ink integration hooks | Complete |
| @ggterm/vue | Vue 3 composables | Complete |
| @ggterm/svelte | Svelte stores | Complete |
| @ggterm/solid | Solid.js primitives | Complete |

## Phase 1: Publication Readiness (Priority: High)

### 1.1 Package Metadata Updates
- [x] Bump version from 0.0.1 to 0.2.0 (all packages)
- [x] Add author: "Scott Handley"
- [x] Update repository URL: `https://github.com/handleylab/ggterm`
- [x] Add homepage URL
- [x] Add bugs URL

### 1.2 Documentation Cleanup
- [x] Replace all `your-org` placeholders with actual org name
- [ ] Verify all internal links work
- [ ] Add npm badge to README

### 1.3 Quality Verification
- [x] Run full test suite (1168 core tests pass)
- [x] Verify builds for all 8 packages
  - core, render-braille, render-block, render-sixel, opentui, svelte: ✅
  - solid: ⚠️ tsconfig rootDir issue (tests pass)
  - vue: ⚠️ vue-tsc compatibility issue (tests pass)
- [x] Test `npm publish --dry-run` for @ggterm/core
- [x] Optimize @ggterm/core package (414KB → 134KB, 68% reduction)

### 1.4 npm Publication
- [ ] **NEXT**: Publish @ggterm/core to npm (requires npm token with 2FA bypass)
  - Create granular access token at https://www.npmjs.com/settings/tokens
  - Enable "Bypass two-factor authentication for automation"
  - Run: `npm publish --access public` in packages/core
- [ ] Publish remaining packages after core is live

## Phase 2: Documentation Enhancement (Priority: Medium)

### 2.1 API Documentation
- [ ] Add JSDoc to all public APIs in @ggterm/core
- [ ] Generate API documentation
- [ ] Add usage examples to each geom type

### 2.2 Tutorials
- [ ] Getting Started guide
- [ ] Framework integration guides (React, Vue, Svelte, Solid)
- [ ] Streaming data tutorial

## Phase 3: Feature Completion (Priority: Medium)

### 3.1 Braille Renderer
- [ ] Complete missing geom implementations
- [ ] Add tests for edge cases
- [ ] Performance optimization

### 3.2 Testing Gaps
- [ ] Integration tests for framework packages
- [ ] Visual regression tests
- [ ] Performance benchmarks

## Phase 4: Ecosystem Growth (Priority: Lower)

### 4.1 New Features
- [ ] Additional color palettes
- [ ] More statistical transformations
- [ ] Animation support

### 4.2 Community
- [ ] Contributing guide
- [ ] Issue templates
- [ ] GitHub Actions CI/CD

## Version Strategy

| Version | Milestone |
|---------|-----------|
| 0.2.0 | Initial npm publication (Phase 1 complete) |
| 0.3.0 | Documentation enhancement (Phase 2 complete) |
| 0.5.0 | Feature completion (Phase 3 complete) |
| 1.0.0 | Production ready with stable API |

## Success Metrics

1. **Adoption**: 100 npm downloads/week within 3 months
2. **Quality**: 90%+ test coverage
3. **Community**: 50+ GitHub stars
4. **Stability**: Zero critical bugs post-1.0

## Phase 5: AI Agent Integration (Priority: High)

### 5.1 Claude Code Skills

ggterm can serve as the visualization layer for AI coding agents performing data analysis. Skills provide deterministic behavior.

| Skill | Purpose | Status |
|-------|---------|--------|
| `data-load` | Universal data input (CSV, JSON, Parquet) | ✅ Complete |
| `ggterm-plot` | Terminal visualization with Grammar of Graphics | ✅ Complete |
| `ggterm-markdown` | Report generation with embedded plots | ✅ Complete |

**Skill Location**: `.claude/skills/` (project-level) or distributed as plugin

### 5.2 Key Integration Features

- **PlotSpec JSON**: Already built-in via `.spec()` for reproducibility/tracking
- **Declarative API**: Maps naturally to LLM code generation
- **Auto-renderer selection**: Adapts to terminal capabilities without agent knowledge

### 5.3 Distribution Strategy

```
@ggterm/core          → npm (the library)
.claude/skills/       → Bundled in repo for users
ggterm-claude-plugin  → Future: standalone plugin distribution
```

## Phase 6: Academic Publication (Priority: Medium)

### 6.1 Target Venues

| Venue | Format | Cost | Fit |
|-------|--------|------|-----|
| **JOSS** | ~1000 words + software review | Free | ⭐⭐⭐ Best for software |
| **Bioinformatics App Notes** | 4 pages | ~$2,800 | ⭐⭐ If bio angle |
| **SoftwareX** | 6 pages | $1,560 | ⭐⭐ Domain-independent |
| **F1000Research** | Flexible | $1,350 | ⭐⭐ Fast publication |

### 6.2 Paper Framing

> **ggterm: A Grammar of Graphics Implementation Enabling Data Visualization in AI Coding Agents**

Key contributions:
1. First Grammar of Graphics for terminal environments
2. Agent Skills for deterministic AI-assisted data analysis
3. Built-in PlotSpec export for reproducibility

### 6.3 Requirements Checklist

- [ ] 6+ months public development history (JOSS requirement)
- [ ] Comparison with existing tools (plotext, asciichart, termgraph)
- [ ] Usage examples with AI agent workflows
- [ ] PlotSpec JSON schema documentation

See [PAPER-STRATEGY.md](./PAPER-STRATEGY.md) for detailed publication strategy.

## Timeline

Phase 1 is the immediate focus before any npm publication. Phases 2-4 can proceed iteratively after the initial release. Phase 5 (AI Agent Integration) runs in parallel with npm publication. Phase 6 (Academic Publication) follows after npm is live and skills are complete.
