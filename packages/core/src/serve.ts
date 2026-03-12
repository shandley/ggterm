/**
 * Live plot viewer server
 *
 * Watches .ggterm/plots/ for new plots and pushes them to connected
 * browsers via WebSocket. Renders interactive Vega-Lite in a dark-themed page.
 *
 * Uses node:http and a minimal WebSocket implementation for Node.js compatibility.
 */

import { watch, readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { spawn } from 'child_process'
import { hostname } from 'os'
import {
  getHistory,
  getLatestPlotId,
  loadPlotFromHistory,
  getPlotsDir,
  getGGTermDir,
  ensureHistoryDirs,
} from './history'
import { plotSpecToVegaLite } from './export'
import { ensureInit } from './init'
import type { HistoricalPlot } from './history'
import type { VegaLiteSpec } from './export'

// Composite marks in Vega-Lite that don't support selection parameters
const COMPOSITE_MARKS = new Set([
  'boxplot', 'violin', 'errorband', 'errorbar',
  // Multi-layer scientific/specialized geoms that use per-layer data
  'volcano', 'kaplan_meier', 'ma', 'manhattan', 'forest', 'roc', 'heatmap',
  'density', 'ecdf', 'bland_altman', 'corrmat', 'biplot',
  'ridgeline', 'joy', 'lollipop', 'dumbbell',
])

function plotToVegaLite(plot: HistoricalPlot): { spec: VegaLiteSpec; provenance: HistoricalPlot['_provenance'] } {
  const geomTypes = plot._provenance.geomTypes
  const hasCompositeMark = geomTypes.some(t => COMPOSITE_MARKS.has(t))
  const spec = plotSpecToVegaLite(plot.spec, { interactive: !hasCompositeMark })
  return { spec, provenance: plot._provenance }
}

function getLatestPayload(): string | null {
  const id = getLatestPlotId()
  if (!id) return null

  // Prefer the Vega-Lite spec on disk — it may have been styled/customized
  const vlPath = join(getGGTermDir(), 'last-plot-vegalite.json')
  if (existsSync(vlPath)) {
    try {
      const spec = JSON.parse(readFileSync(vlPath, 'utf-8'))
      const plot = loadPlotFromHistory(id)
      const provenance = plot?._provenance ?? {
        id,
        description: '',
        timestamp: new Date().toISOString(),
        geomTypes: [] as string[],
      }
      return JSON.stringify({ type: 'plot', spec, provenance })
    } catch { /* fall through to regeneration */ }
  }

  const plot = loadPlotFromHistory(id)
  if (!plot) return null
  const { spec, provenance } = plotToVegaLite(plot)
  return JSON.stringify({ type: 'plot', spec, provenance })
}

function jsonResponse(res: ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(body)
}

const CLIENT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ggterm</title>
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Menlo, monospace;
    background: #0d1117;
    color: #c9d1d9;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  #sidebar {
    width: 260px;
    background: #161b22;
    border-right: 1px solid #30363d;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transform: translateX(-260px);
    transition: transform 0.2s ease;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 10;
  }
  #sidebar.open { transform: translateX(0); }
  #sidebar-header {
    padding: 12px;
    border-bottom: 1px solid #30363d;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: #c9d1d9;
  }
  #sidebar-header button {
    background: none;
    border: none;
    color: #8b949e;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 6px;
  }
  #sidebar-header button:hover { color: #c9d1d9; }
  #history-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }
  #history-list::-webkit-scrollbar { width: 6px; }
  #history-list::-webkit-scrollbar-track { background: transparent; }
  #history-list::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  .history-item {
    padding: 8px 12px;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: background 0.1s;
  }
  .history-item:hover { background: #21262d; }
  .history-item.active { background: #1c2128; border-left-color: #58a6ff; }
  .history-item .hi-id { font-size: 11px; color: #58a6ff; font-weight: 600; }
  .history-item .hi-desc { font-size: 11px; color: #8b949e; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .history-item .hi-meta { font-size: 10px; color: #484f58; margin-top: 2px; display: flex; gap: 8px; }
  .history-item .hi-geom {
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 3px;
    padding: 0 4px;
    font-size: 10px;
    color: #8b949e;
  }
  #main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  #vis {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
    min-height: 0;
  }
  #vis .vega-embed { width: 100%; height: 100%; }
  #vis .vega-embed canvas,
  #vis .vega-embed svg {
    max-width: 100%;
    max-height: 100%;
  }
  #bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: #161b22;
    border-top: 1px solid #30363d;
    font-size: 12px;
    gap: 12px;
    min-height: 40px;
    flex-shrink: 0;
  }
  #meta { display: flex; gap: 16px; align-items: center; flex: 1; min-width: 0; }
  #plot-id { color: #58a6ff; font-weight: 600; }
  #plot-desc { color: #8b949e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #plot-time { color: #484f58; }
  #nav { display: flex; gap: 4px; align-items: center; }
  .bar-btn {
    background: #21262d;
    border: 1px solid #30363d;
    color: #c9d1d9;
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }
  .bar-btn:hover { background: #30363d; }
  .bar-btn:disabled { opacity: 0.3; cursor: default; }
  .bar-btn:disabled:hover { background: #21262d; }
  .bar-btn.active { background: #30363d; border-color: #58a6ff; }
  #actions { display: flex; gap: 4px; align-items: center; }
  #actions button {
    background: none;
    border: 1px solid #30363d;
    color: #8b949e;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
  }
  #actions button:hover { color: #c9d1d9; border-color: #58a6ff; }
  #status {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #f85149;
    flex-shrink: 0;
  }
  #status.connected { background: #3fb950; }
  .waiting {
    color: #484f58;
    font-size: 14px;
    text-align: center;
  }
  .waiting .hint { font-size: 12px; margin-top: 8px; color: #30363d; }
  /* Command Palette */
  #palette {
    display: none;
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    width: 480px;
    max-width: 90vw;
    max-height: 60vh;
    z-index: 25;
    font-size: 13px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    flex-direction: column;
    overflow: hidden;
  }
  #palette.open { display: flex; }
  #palette-input {
    background: #0d1117;
    border: none;
    border-bottom: 1px solid #30363d;
    color: #c9d1d9;
    font-family: inherit;
    font-size: 14px;
    padding: 12px 16px;
    outline: none;
    width: 100%;
  }
  #palette-input::placeholder { color: #484f58; }
  #palette-results {
    overflow-y: auto;
    max-height: calc(60vh - 48px);
    padding: 4px 0;
  }
  #palette-results::-webkit-scrollbar { width: 6px; }
  #palette-results::-webkit-scrollbar-track { background: transparent; }
  #palette-results::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  .palette-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .palette-item:hover, .palette-item.selected { background: #21262d; }
  .palette-item .pi-icon { color: #58a6ff; width: 16px; text-align: center; flex-shrink: 0; }
  .palette-item .pi-label { flex: 1; color: #c9d1d9; }
  .palette-item .pi-hint { color: #484f58; font-size: 11px; }
  .palette-group {
    padding: 6px 16px 2px;
    font-size: 10px;
    font-weight: 600;
    color: #484f58;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  /* Tabbed Help Panel */
  #help-panel {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    z-index: 20;
    font-size: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    flex-direction: column;
    overflow: hidden;
  }
  #help-panel.open { display: flex; }
  #help-tabs {
    display: flex;
    border-bottom: 1px solid #30363d;
    flex-shrink: 0;
  }
  .help-tab {
    padding: 10px 16px;
    cursor: pointer;
    color: #8b949e;
    border-bottom: 2px solid transparent;
    font-size: 12px;
    font-family: inherit;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
  }
  .help-tab:hover { color: #c9d1d9; }
  .help-tab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
  #help-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }
  #help-content::-webkit-scrollbar { width: 6px; }
  #help-content::-webkit-scrollbar-track { background: transparent; }
  #help-content::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  #help-content h3 { font-size: 14px; margin-bottom: 10px; color: #c9d1d9; }
  #help-content h4 { font-size: 12px; margin: 12px 0 6px; color: #58a6ff; }
  #help-content p { color: #8b949e; line-height: 1.5; margin-bottom: 8px; }
  #help-content code {
    background: #21262d;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: 'SF Mono', Menlo, monospace;
    font-size: 11px;
    color: #c9d1d9;
  }
  #help-content pre {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 4px;
    padding: 10px 12px;
    font-family: 'SF Mono', Menlo, monospace;
    font-size: 11px;
    color: #c9d1d9;
    overflow-x: auto;
    margin: 6px 0 12px;
    white-space: pre-wrap;
  }
  .shortcut-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .shortcut-row kbd {
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 3px;
    padding: 1px 6px;
    font-family: inherit;
    font-size: 11px;
    color: #c9d1d9;
  }
  .shortcut-row span { color: #8b949e; }
  .geom-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 4px;
    margin-bottom: 12px;
  }
  .geom-chip {
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    color: #c9d1d9;
  }
  .geom-chip .gc-name { font-weight: 600; }
  .geom-chip .gc-desc { color: #8b949e; font-size: 10px; }
  #overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 15;
  }
  #overlay.open { display: block; }
</style>
</head>
<body>
<div id="sidebar">
  <div id="sidebar-header">
    <span>History</span>
    <button onclick="toggleHistory()">&times;</button>
  </div>
  <div id="history-list"></div>
</div>
<div id="main">
  <div id="vis">
    <div class="waiting">
      <div>waiting for plots...</div>
      <div class="hint">create a plot in ggterm and it will appear here</div>
    </div>
  </div>
  <div id="bar">
    <div id="status"></div>
    <div id="meta">
      <span id="plot-id"></span>
      <span id="plot-desc"></span>
      <span id="plot-time"></span>
    </div>
    <div id="nav">
      <button id="hist-btn" class="bar-btn" onclick="toggleHistory()" title="History (h)">H</button>
      <button id="prev" class="bar-btn" disabled title="Previous plot (&larr;)">&larr;</button>
      <button id="next" class="bar-btn" disabled title="Next plot (&rarr;)">&rarr;</button>
    </div>
    <div id="actions">
      <button onclick="downloadSVG()" title="Download SVG (s)">SVG</button>
      <button onclick="downloadPNG()" title="Download PNG (p)">PNG</button>
      <button onclick="toggleHelp()" title="Help (?)">?</button>
    </div>
  </div>
</div>
<div id="overlay" onclick="closeOverlays()"></div>
<div id="palette">
  <input id="palette-input" type="text" placeholder="Type a command... (geom, export, style, shortcut)" autocomplete="off">
  <div id="palette-results"></div>
</div>
<div id="help-panel">
  <div id="help-tabs">
    <button class="help-tab active" data-tab="start">Getting Started</button>
    <button class="help-tab" data-tab="geoms">Plot Types</button>
    <button class="help-tab" data-tab="shortcuts">Shortcuts</button>
    <button class="help-tab" data-tab="styles">Styles</button>
    <button class="help-tab" data-tab="export">Export</button>
  </div>
  <div id="help-content"></div>
</div>
<script>
const vis = document.getElementById('vis');
const main = document.getElementById('main');
const statusEl = document.getElementById('status');
const idEl = document.getElementById('plot-id');
const descEl = document.getElementById('plot-desc');
const timeEl = document.getElementById('plot-time');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const histBtn = document.getElementById('hist-btn');
const sidebar = document.getElementById('sidebar');
const historyList = document.getElementById('history-list');
const overlayEl = document.getElementById('overlay');
const paletteEl = document.getElementById('palette');
const paletteInput = document.getElementById('palette-input');
const paletteResults = document.getElementById('palette-results');
const helpPanel = document.getElementById('help-panel');
const helpTabs = document.getElementById('help-tabs');
const helpContent = document.getElementById('help-content');

let history = [];
let historyIndex = {};
let currentIdx = -1;
let view = null;

function updateMeta(prov) {
  if (!prov) return;
  idEl.textContent = prov.id;
  descEl.textContent = prov.description || '';
  timeEl.textContent = prov.timestamp ? new Date(prov.timestamp).toLocaleTimeString() : '';
}

function updateNav() {
  prevBtn.disabled = currentIdx <= 0;
  nextBtn.disabled = currentIdx >= history.length - 1;
}

function updateHistoryHighlight() {
  historyList.querySelectorAll('.history-item').forEach((el, i) => {
    el.classList.toggle('active', i === currentIdx);
  });
  const active = historyList.querySelector('.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function addHistoryItem(data, idx) {
  const prov = data.provenance;
  if (!prov) return;
  const div = document.createElement('div');
  div.className = 'history-item' + (idx === currentIdx ? ' active' : '');
  div.innerHTML =
    '<div class="hi-id">' + prov.id + '</div>' +
    '<div class="hi-desc">' + (prov.description || '') + '</div>' +
    '<div class="hi-meta">' +
      '<span class="hi-geom">' + (prov.geomTypes ? prov.geomTypes.join('+') : '') + '</span>' +
      '<span>' + (prov.timestamp ? new Date(prov.timestamp).toLocaleTimeString() : '') + '</span>' +
    '</div>';
  div.onclick = () => navigate(idx);
  historyList.appendChild(div);
}

function rebuildHistoryList() {
  historyList.innerHTML = '';
  history.forEach((data, i) => addHistoryItem(data, i));
}

const embedOpts = {
  actions: false,
  theme: 'dark',
  renderer: 'svg',
  config: {
    background: '#0d1117',
    axis: { domainColor: '#30363d', gridColor: '#21262d', tickColor: '#30363d', labelColor: '#8b949e', titleColor: '#c9d1d9' },
    legend: { labelColor: '#c9d1d9', titleColor: '#c9d1d9' },
    title: { color: '#c9d1d9', subtitleColor: '#8b949e' },
    view: { stroke: null }
  }
};

async function renderSpec(spec) {
  vis.innerHTML = '';
  const vegaSpec = { ...spec, width: 'container', height: 'container', autosize: { type: 'fit', contains: 'padding' } };
  try {
    const result = await vegaEmbed(vis, vegaSpec, embedOpts);
    view = result.view;
  } catch (e) {
    // Retry without interactive params (composite marks like boxplot don't support selections)
    console.warn('Render failed, retrying without params:', e.message);
    const { params, ...cleanSpec } = vegaSpec;
    // Also strip param-dependent encoding from layers
    if (cleanSpec.layer) {
      cleanSpec.layer = cleanSpec.layer.map(l => {
        if (!l.encoding) return l;
        const enc = { ...l.encoding };
        for (const [k, v] of Object.entries(enc)) {
          if (v && v.condition && v.condition.param) delete enc[k];
        }
        return { ...l, encoding: enc };
      });
    }
    // Strip from top-level encoding too
    if (cleanSpec.encoding) {
      const enc = { ...cleanSpec.encoding };
      for (const [k, v] of Object.entries(enc)) {
        if (v && v.condition && v.condition.param) delete enc[k];
      }
      cleanSpec.encoding = enc;
    }
    const result = await vegaEmbed(vis, cleanSpec, embedOpts);
    view = result.view;
  }
}

// Re-render on container resize so plot reflows correctly
let resizeTimer = null;
new ResizeObserver(() => {
  if (!view) return;
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { view.resize(); }, 150);
}).observe(vis);

async function showPlot(data) {
  await renderSpec(data.spec);
  updateMeta(data.provenance);
}

function navigate(idx) {
  if (idx < 0 || idx >= history.length) return;
  currentIdx = idx;
  const data = history[idx];
  if (data.spec) {
    showPlot(data);
  } else {
    // Lazy-load full spec from server
    fetch('/api/plot/' + data.provenance.id)
      .then(r => r.json())
      .then(full => {
        history[idx] = full;
        showPlot(full);
      });
  }
  updateNav();
  updateHistoryHighlight();
}

prevBtn.onclick = () => navigate(currentIdx - 1);
nextBtn.onclick = () => navigate(currentIdx + 1);

function toggleHistory() {
  const open = sidebar.classList.toggle('open');
  histBtn.classList.toggle('active', open);
}

// --- Geom catalog and command palette data ---
var GEOM_CATALOG = {
  'Point/Line': [['point','Scatter plot'],['line','Line chart'],['path','Connected path'],['step','Step function'],['smooth','Fitted trend'],['segment','Line segment'],['curve','Curved segment']],
  'Bar/Area': [['bar','Category counts'],['col','Bar from values'],['histogram','Distribution'],['freqpoly','Frequency polygon'],['density','Kernel density'],['area','Filled area'],['ribbon','Uncertainty band']],
  'Distribution': [['boxplot','Box-and-whisker'],['violin','Density shape'],['ridgeline','Stacked densities'],['joy','Joy plot'],['beeswarm','Non-overlapping'],['quasirandom','Quasi-random'],['density_2d','2D density'],['qq','Q-Q plot']],
  'Comparison': [['dumbbell','Before/after'],['lollipop','Sparse rankings'],['waffle','Part-of-whole'],['sparkline','Inline trend'],['bullet','KPI progress'],['braille','High-res braille']],
  'Specialized': [['calendar','Activity heatmap'],['flame','Flame graph'],['icicle','Inverted flame'],['corrmat','Correlation matrix'],['sankey','Flow diagram'],['treemap','Hierarchical'],['volcano','Volcano plot'],['ma','MA plot'],['manhattan','Manhattan plot'],['heatmap','Grid heatmap'],['biplot','PCA biplot']],
  'Clinical': [['kaplan_meier','Survival curves'],['forest','Effect sizes'],['roc','ROC curve'],['bland_altman','Method comparison']],
  'Diagnostics': [['ecdf','Empirical CDF'],['funnel','Publication bias'],['control','Control chart'],['scree','PCA variance'],['upset','Set intersections'],['dendrogram','Cluster tree']],
  'Error/Reference': [['errorbar','Vertical error'],['errorbarh','Horizontal error'],['crossbar','Cross bar'],['linerange','Line range'],['pointrange','Point + range'],['rug','Marginal ticks'],['hline','Horizontal line'],['vline','Vertical line'],['abline','Slope-intercept']],
  'Text': [['text','Text labels'],['label','Boxed labels']],
  '2D/Tile': [['tile','Tiled grid'],['raster','Raster grid'],['bin2d','2D binning'],['rect','Rectangle'],['contour','Contour lines'],['contour_filled','Filled contours']]
};

var COMMANDS = [
  { id:'svg', label:'Export as SVG', cat:'Export', hint:'s', icon:'\\u2913', action: function(){ downloadSVG(); } },
  { id:'png', label:'Export as PNG', cat:'Export', hint:'p', icon:'\\u2913', action: function(){ downloadPNG(); } },
  { id:'fullscreen', label:'Toggle Fullscreen', cat:'View', hint:'f', icon:'\\u26F6', action: function(){ document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } },
  { id:'history', label:'Toggle History Panel', cat:'View', hint:'h', icon:'\\u2630', action: function(){ toggleHistory(); } },
  { id:'help', label:'Open Help', cat:'View', hint:'?', icon:'?', action: function(){ toggleHelp(); } },
  { id:'prev', label:'Previous Plot', cat:'Navigate', hint:'\\u2190', icon:'\\u2190', action: function(){ navigate(currentIdx - 1); } },
  { id:'next', label:'Next Plot', cat:'Navigate', hint:'\\u2192', icon:'\\u2192', action: function(){ navigate(currentIdx + 1); } },
  { id:'first', label:'First Plot', cat:'Navigate', hint:'Home', icon:'\\u21E4', action: function(){ navigate(0); } },
  { id:'last', label:'Latest Plot', cat:'Navigate', hint:'End', icon:'\\u21E5', action: function(){ navigate(history.length - 1); } },
  { id:'style-wilke', label:'Wilke Style', cat:'Style', hint:'Clean academic', icon:'\\u25CB', action: function(){ showHelpTab('styles'); } },
  { id:'style-tufte', label:'Tufte Style', cat:'Style', hint:'Max data-ink', icon:'\\u25CB', action: function(){ showHelpTab('styles'); } },
  { id:'style-nature', label:'Nature Style', cat:'Style', hint:'Journal format', icon:'\\u25CB', action: function(){ showHelpTab('styles'); } },
  { id:'style-economist', label:'Economist Style', cat:'Style', hint:'Distinctive', icon:'\\u25CB', action: function(){ showHelpTab('styles'); } },
  { id:'style-minimal', label:'Minimal Style', cat:'Style', hint:'Clean', icon:'\\u25CB', action: function(){ showHelpTab('styles'); } },
  { id:'style-apa', label:'APA Style', cat:'Style', hint:'Academic', icon:'\\u25CB', action: function(){ showHelpTab('styles'); } }
];

// Generate geom commands from catalog
Object.keys(GEOM_CATALOG).forEach(function(cat) {
  GEOM_CATALOG[cat].forEach(function(g) {
    COMMANDS.push({ id:'geom-'+g[0], label:'geom_'+g[0], cat:cat, hint:g[1], icon:'\\u25CB', action: function(){ showHelpTab('geoms'); } });
  });
});

// --- Command Palette ---
var paletteSelectedIdx = 0;
var filteredCommands = [];

function fuzzyMatch(query, text) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  if (text.indexOf(query) >= 0) return true;
  var qi = 0;
  for (var i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function filterCommands(query) {
  if (!query) return COMMANDS.slice(0, 20);
  return COMMANDS.filter(function(c) {
    return fuzzyMatch(query, c.label) || fuzzyMatch(query, c.cat) || fuzzyMatch(query, c.hint);
  });
}

function renderPalette() {
  var query = paletteInput.value.trim();
  filteredCommands = filterCommands(query);
  paletteSelectedIdx = Math.min(paletteSelectedIdx, Math.max(0, filteredCommands.length - 1));
  var groups = {};
  filteredCommands.forEach(function(cmd) {
    if (!groups[cmd.cat]) groups[cmd.cat] = [];
    groups[cmd.cat].push(cmd);
  });
  var html = '';
  var gi = 0;
  Object.keys(groups).forEach(function(cat) {
    html += '<div class="palette-group">' + cat + '</div>';
    groups[cat].forEach(function(cmd) {
      var sel = gi === paletteSelectedIdx ? ' selected' : '';
      html += '<div class="palette-item' + sel + '" data-idx="' + gi + '">'
        + '<span class="pi-icon">' + cmd.icon + '</span>'
        + '<span class="pi-label">' + cmd.label + '</span>'
        + '<span class="pi-hint">' + cmd.hint + '</span>'
        + '</div>';
      gi++;
    });
  });
  paletteResults.innerHTML = html || '<div style="padding:12px 16px;color:#484f58">No results</div>';
  paletteResults.querySelectorAll('.palette-item').forEach(function(el) {
    el.onclick = function() { executePaletteItem(parseInt(el.dataset.idx)); };
  });
  var selected = paletteResults.querySelector('.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

function executePaletteItem(idx) {
  var cmd = filteredCommands[idx];
  if (cmd) { closePalette(); cmd.action(); }
}

function openPalette() {
  paletteInput.value = '';
  paletteSelectedIdx = 0;
  closeOverlays();
  paletteEl.classList.add('open');
  overlayEl.classList.add('open');
  renderPalette();
  paletteInput.focus();
}

function closePalette() {
  paletteEl.classList.remove('open');
  overlayEl.classList.remove('open');
}

paletteInput.addEventListener('input', function() {
  paletteSelectedIdx = 0;
  renderPalette();
});

paletteInput.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    paletteSelectedIdx = Math.min(paletteSelectedIdx + 1, filteredCommands.length - 1);
    renderPalette();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    paletteSelectedIdx = Math.max(paletteSelectedIdx - 1, 0);
    renderPalette();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    executePaletteItem(paletteSelectedIdx);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closePalette();
  }
});

// --- Tabbed Help Panel ---
var HELP_TABS = {
  start: '<h3>Welcome to ggterm</h3>'
    + '<p>ggterm is a Grammar of Graphics engine for terminal data visualization. This viewer displays interactive, publication-quality plots powered by Vega-Lite.</p>'
    + '<h4>With Claude Code</h4>'
    + '<p>Ask Claude to plot data naturally:</p>'
    + '<pre>"Plot the iris dataset"\\n"Show a histogram of sepal_length by species"\\n"Create a scatter plot of mpg vs hp"</pre>'
    + '<h4>With the CLI</h4>'
    + '<pre>npx ggterm-plot iris sepal_length sepal_width species "Iris" point\\nnpx ggterm-plot data.csv x y color "Title" histogram</pre>'
    + '<h4>Built-in Datasets</h4>'
    + '<p><code>iris</code> (150 rows), <code>mtcars</code> (16 rows), <code>airway</code> (500 genes), and <code>lung</code> (227 patients) work by name &mdash; no CSV files needed.</p>'
    + '<h4>Quick Tips</h4>'
    + '<p>Press <code>\\u2318K</code> or <code>Ctrl+K</code> to open the command palette. Use <code>\\u2190</code>/<code>\\u2192</code> to navigate plots. Press <code>h</code> for history.</p>',

  shortcuts: '<h3>Keyboard Shortcuts</h3>'
    + '<div class="shortcut-row"><span>Command palette</span><kbd>\\u2318K / Ctrl+K</kbd></div>'
    + '<div class="shortcut-row"><span>Previous plot</span><kbd>\\u2190</kbd></div>'
    + '<div class="shortcut-row"><span>Next plot</span><kbd>\\u2192</kbd></div>'
    + '<div class="shortcut-row"><span>Latest plot</span><kbd>End</kbd></div>'
    + '<div class="shortcut-row"><span>First plot</span><kbd>Home</kbd></div>'
    + '<div class="shortcut-row"><span>Toggle history</span><kbd>h</kbd></div>'
    + '<div class="shortcut-row"><span>Download SVG</span><kbd>s</kbd></div>'
    + '<div class="shortcut-row"><span>Download PNG</span><kbd>p</kbd></div>'
    + '<div class="shortcut-row"><span>Fullscreen</span><kbd>f</kbd></div>'
    + '<div class="shortcut-row"><span>Show help</span><kbd>?</kbd></div>'
    + '<div class="shortcut-row"><span>Close panel</span><kbd>Esc</kbd></div>',

  styles: '<h3>Publication Style Presets</h3>'
    + '<p>Apply styles via <code>/ggterm-style</code> in Claude Code or by editing <code>.ggterm/last-plot-vegalite.json</code>.</p>'
    + '<h4>Wilke</h4><p>Clean academic style. Helvetica, subtle Y-gridlines, warm color palette. Best all-around choice.</p>'
    + '<h4>Tufte</h4><p>Maximum data-ink ratio. Georgia serif, no gridlines, no ticks, grayscale. Inspired by Edward Tufte.</p>'
    + '<h4>Nature</h4><p>Compact journal format. Arial, small fonts (8pt), thin axis lines. Matches Nature standards.</p>'
    + '<h4>Economist</h4><p>Light blue background, bold titles, white horizontal gridlines. Matches The Economist style.</p>'
    + '<h4>Minimal</h4><p>Ultra-clean. System font, no axes, no grids. Lets the data speak.</p>'
    + '<h4>APA</h4><p>Times New Roman, italic axis titles, grayscale palette. Academic standard.</p>'
    + '<h4>Usage</h4>'
    + '<pre>"Apply Wilke style to this plot"\\n"Style this like a Nature paper"\\n/ggterm-style Wilke</pre>',

  export: '<h3>Exporting Plots</h3>'
    + '<h4>From the Viewer</h4>'
    + '<p>Press <kbd>s</kbd> to download SVG or <kbd>p</kbd> to download PNG directly.</p>'
    + '<h4>From the CLI</h4>'
    + '<pre>npx ggterm-plot export &lt;plot-id&gt; output.html\\nnpx vl2png .ggterm/last-plot-vegalite.json &gt; plot.png\\nnpx vl2svg .ggterm/last-plot-vegalite.json &gt; plot.svg</pre>'
    + '<h4>From Claude Code</h4>'
    + '<pre>"Export this plot as PNG"\\n"Save as SVG"\\n/ggterm-publish</pre>'
    + '<h4>Prerequisites for CLI Export</h4>'
    + '<pre>npm install -g vega-lite vega-cli canvas</pre>'
};

// Build geoms tab HTML from catalog
(function() {
  var html = '<h3>All 66 Plot Types</h3>';
  Object.keys(GEOM_CATALOG).forEach(function(cat) {
    html += '<h4>' + cat + '</h4><div class="geom-grid">';
    GEOM_CATALOG[cat].forEach(function(g) {
      html += '<div class="geom-chip"><span class="gc-name">' + g[0] + '</span><br><span class="gc-desc">' + g[1] + '</span></div>';
    });
    html += '</div>';
  });
  HELP_TABS.geoms = html;
})();

function showHelpTab(tabId) {
  if (!helpPanel.classList.contains('open')) {
    closePalette();
    helpPanel.classList.add('open');
    overlayEl.classList.add('open');
  }
  helpTabs.querySelectorAll('.help-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  var html = HELP_TABS[tabId];
  if (html) helpContent.innerHTML = html;
}

helpTabs.addEventListener('click', function(e) {
  var tab = e.target.closest('.help-tab');
  if (tab) showHelpTab(tab.dataset.tab);
});

function toggleHelp() {
  if (helpPanel.classList.contains('open')) {
    closeOverlays();
  } else {
    closeOverlays();
    helpPanel.classList.add('open');
    overlayEl.classList.add('open');
    showHelpTab('start');
  }
}

function closeOverlays() {
  helpPanel.classList.remove('open');
  paletteEl.classList.remove('open');
  overlayEl.classList.remove('open');
}

// Initialize help content
showHelpTab('start');
helpPanel.classList.remove('open');
overlayEl.classList.remove('open');

document.addEventListener('keydown', function(e) {
  // Cmd+K / Ctrl+K opens palette (works everywhere)
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (paletteEl.classList.contains('open')) {
      closePalette();
    } else {
      closeOverlays();
      openPalette();
    }
    return;
  }

  // Ignore when typing in palette input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key) {
    case 'ArrowLeft': navigate(currentIdx - 1); break;
    case 'ArrowRight': navigate(currentIdx + 1); break;
    case 'Home': e.preventDefault(); navigate(0); break;
    case 'End': e.preventDefault(); navigate(history.length - 1); break;
    case 'h': toggleHistory(); break;
    case 's': downloadSVG(); break;
    case 'p': downloadPNG(); break;
    case 'f':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      break;
    case '?': toggleHelp(); break;
    case 'Escape': closeOverlays(); if (sidebar.classList.contains('open')) toggleHistory(); break;
  }
});

function downloadSVG() {
  if (!view) return;
  view.toSVG().then(svg => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = (idEl.textContent || 'plot') + '.svg';
    a.click();
  });
}

function downloadPNG() {
  if (!view) return;
  view.toCanvas(2).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = (idEl.textContent || 'plot') + '.png';
    a.click();
  });
}

function connect() {
  const es = new EventSource('/events');

  es.onopen = () => { statusEl.classList.add('connected'); };
  es.onerror = () => { statusEl.classList.remove('connected'); };

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'plot') {
      history.push(data);
      currentIdx = history.length - 1;
      addHistoryItem(data, history.length - 1);
      showPlot(data);
      updateNav();
      updateHistoryHighlight();
    } else if (data.type === 'update') {
      // Style/customize change — replace current plot, don't add to history
      if (currentIdx >= 0 && currentIdx < history.length) {
        history[currentIdx] = data;
      }
      showPlot(data);
    }
  };
}

// Load initial history then connect
fetch('/api/history')
  .then(r => r.json())
  .then(entries => {
    // Populate history with provenance-only stubs (lazy-load specs on navigate)
    history = entries.map(e => ({ provenance: e, spec: null }));
    if (history.length > 0) {
      currentIdx = history.length - 1;
      // Eager-load and render the latest plot
      navigate(currentIdx);
    }
    rebuildHistoryList();
    updateNav();
  })
  .then(() => connect());
</script>
</body>
</html>`

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function handleServe(port?: number, options?: { openBrowser?: boolean; fromSetup?: boolean }): void {
  const requestedPort = port || 4242

  // Check if a server is already running
  const markerPath = join(getGGTermDir(), 'serve.json')
  if (existsSync(markerPath)) {
    try {
      const marker = JSON.parse(readFileSync(markerPath, 'utf-8'))
      if (marker.pid && isProcessAlive(marker.pid)) {
        const url = `http://localhost:${marker.port}`
        console.log(`ggterm viewer already running at ${url} (pid ${marker.pid})`)
        if (options?.openBrowser) {
          const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
          const child = spawn(openCmd, [url], { stdio: 'ignore', detached: true })
          child.on('error', () => {})
          child.unref()
        }
        if (options?.fromSetup) {
          console.log('')
          console.log(`Next steps:`)
          console.log(`  1. Open a new terminal in this directory`)
          console.log(`  2. Run: claude`)
          console.log(`  3. Try: "Plot the iris dataset as a scatter plot"`)
          console.log('')
        }
        return
      }
      // Stale marker — process is dead, clean up
      try { unlinkSync(markerPath) } catch {}
    } catch {
      // Corrupted marker, remove it
      try { unlinkSync(markerPath) } catch {}
    }
  }

  const maxRetries = 10
  startServer(requestedPort, 0, maxRetries, options)
}

function startServer(p: number, attempt: number, maxRetries: number, options?: { openBrowser?: boolean; fromSetup?: boolean }): void {
  ensureInit()
  ensureHistoryDirs()

  const clients = new Set<ServerResponse>()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function broadcast(payload: string) {
    const sseData = `data: ${payload}\n\n`
    for (const client of clients) {
      try { client.write(sseData) } catch { clients.delete(client) }
    }
  }

  // Track last broadcast to suppress duplicates
  let lastNewPlotTime = 0
  let lastBroadcastPlotId: string | null = null

  // Watch for new plots in history
  const plotsDir = getPlotsDir()
  watch(plotsDir, (_event, filename) => {
    if (!filename || !filename.endsWith('.json')) return

    // Debounce rapid writes (macOS emits multiple events per file write)
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const latestId = getLatestPlotId()
      if (!latestId || latestId === lastBroadcastPlotId) return // already broadcast
      lastBroadcastPlotId = latestId
      lastNewPlotTime = Date.now()
      const payload = getLatestPayload()
      if (payload) broadcast(payload)
    }, 150)
  })

  // Watch for style/customize changes to the Vega-Lite spec
  // Only watches last-plot-vegalite.json since that's what the viewer renders
  let styleDebounce: ReturnType<typeof setTimeout> | null = null
  watch(getGGTermDir(), (_event, filename) => {
    if (filename !== 'last-plot-vegalite.json') return

    if (styleDebounce) clearTimeout(styleDebounce)
    styleDebounce = setTimeout(() => {
      // Suppress if a new plot was just created (avoid duplicate on initial save)
      if (Date.now() - lastNewPlotTime < 2000) return

      const vegaLitePath = join(getGGTermDir(), 'last-plot-vegalite.json')
      if (!existsSync(vegaLitePath)) return

      try {
        const spec = JSON.parse(readFileSync(vegaLitePath, 'utf-8'))
        const latestId = getLatestPlotId()
        const provenance = {
          id: latestId || 'styled',
          description: 'Styled plot',
          timestamp: new Date().toISOString(),
          geomTypes: [] as string[],
        }
        // Use 'update' type so the client replaces the current plot instead of adding to history
        broadcast(JSON.stringify({ type: 'update', spec, provenance }))
      } catch { /* ignore parse errors during partial writes */ }
    }, 300)
  })

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${p}`)

    // SSE endpoint for live updates
    if (url.pathname === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
      })

      clients.add(res)

      // Send latest plot immediately (as 'update' so client doesn't duplicate history)
      const payload = getLatestPayload()
      if (payload) {
        // Replace 'plot' with 'update' — client already has this in history from /api/history
        const data = JSON.parse(payload)
        data.type = 'update'
        res.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      req.on('close', () => clients.delete(res))
      return
    }

    // API routes
    if (url.pathname === '/api/latest') {
      const payload = getLatestPayload()
      if (!payload) return jsonResponse(res, { type: 'empty' })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(payload)
      return
    }

    if (url.pathname === '/api/history') {
      const entries = getHistory().slice(-50)
      jsonResponse(res, entries)
      return
    }

    if (url.pathname.startsWith('/api/plot/')) {
      const id = url.pathname.slice('/api/plot/'.length)
      const plot = loadPlotFromHistory(id)
      if (!plot) return jsonResponse(res, { error: 'not found' }, 404)
      const { spec, provenance } = plotToVegaLite(plot)
      jsonResponse(res, { type: 'plot', spec, provenance })
      return
    }

    // Serve client HTML
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(CLIENT_HTML)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt < maxRetries) {
        const nextPort = p + 1
        console.log(`Port ${p} in use, trying ${nextPort}...`)
        startServer(nextPort, attempt + 1, maxRetries, options)
      } else {
        console.error(`Ports ${p - attempt}–${p} all in use.`)
        console.error(`Kill an existing server: lsof -ti:4242 | xargs kill`)
        process.exit(1)
      }
      return
    }
    throw err
  })

  server.listen(p, () => {
    const url = `http://localhost:${p}`
    const host = hostname()

    // Detect HPC compute node environment
    const isComputeNode = !!(
      process.env.SLURM_NODELIST ||
      process.env.SLURM_JOB_ID ||
      process.env.PBS_JOBID ||
      process.env.LSB_JOBID ||
      process.env.SGE_TASK_ID
    )

    if (isComputeNode) {
      // Try to detect the login node hostname for a complete tunnel command
      const loginNode = process.env.SLURM_SUBMIT_HOST
        || process.env.PBS_O_HOST
        || ''

      // Try to detect username
      const user = process.env.USER || process.env.LOGNAME || '<user>'

      const loginDest = loginNode ? `${user}@${loginNode}` : `${user}@<login-node>`

      console.log(`ggterm live viewer running on ${host}:${p}`)
      console.log(`\nYou appear to be on a compute node.`)
      console.log(`To view in your browser, run on your LOCAL machine:\n`)
      console.log(`  ssh -L ${p}:${host}:${p} ${loginDest}\n`)
      console.log(`Then open ${url}`)
    } else {
      console.log(`ggterm live viewer running at ${url}`)
    }

    // Write marker file so CLI can detect serve is running
    const markerPath = join(getGGTermDir(), 'serve.json')
    writeFileSync(markerPath, JSON.stringify({ port: p, pid: process.pid }))

    // Clean up marker on exit
    const cleanup = () => { try { unlinkSync(markerPath) } catch {} }
    process.on('SIGINT', () => { cleanup(); process.exit(0) })
    process.on('SIGTERM', () => { cleanup(); process.exit(0) })
    process.on('exit', cleanup)

    // Auto-open Wave panel if running inside Wave terminal
    if (process.env.TERM_PROGRAM === 'waveterm') {
      spawn('wsh', ['web', 'open', url], { stdio: 'ignore', detached: true }).unref()
      console.log(`Opened Wave panel`)
    } else if (options?.openBrowser && !isComputeNode) {
      const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
      const child = spawn(openCmd, [url], { stdio: 'ignore', detached: true })
      child.on('error', () => {
        console.log(`Open in browser: ${url}`)
        console.log(`For remote servers, use SSH port forwarding: ssh -L ${p}:localhost:${p} <user>@<host>`)
      })
      child.unref()
      console.log(`Opened browser at ${url}`)
    } else if (!isComputeNode) {
      console.log(`Open in browser or Wave panel: wsh web open ${url}`)
    }

    console.log(`Watching ${plotsDir} for new plots...`)

    if (options?.fromSetup) {
      console.log('')
      console.log(`Next steps:`)
      console.log(`  1. Open a new terminal in this directory`)
      console.log(`  2. Run: claude`)
      console.log(`  3. Try: "Plot the iris dataset as a scatter plot"`)
      console.log('')
      console.log(`Or plot directly:`)
      console.log(`  npx ggterm-plot iris sepal_length sepal_width species "Iris" point`)
      console.log('')
    }

    console.log(`Press Ctrl+C to stop`)
  })
}
