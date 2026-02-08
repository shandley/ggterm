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
import {
  getHistory,
  getLatestPlotId,
  loadPlotFromHistory,
  getPlotsDir,
  getGGTermDir,
  ensureHistoryDirs,
} from './history'
import { plotSpecToVegaLite } from './export'
import type { HistoricalPlot } from './history'
import type { VegaLiteSpec } from './export'

// Composite marks in Vega-Lite that don't support selection parameters
const COMPOSITE_MARKS = new Set(['boxplot', 'violin', 'errorband', 'errorbar'])

function plotToVegaLite(plot: HistoricalPlot): { spec: VegaLiteSpec; provenance: HistoricalPlot['_provenance'] } {
  const geomTypes = plot._provenance.geomTypes
  const hasCompositeMark = geomTypes.some(t => COMPOSITE_MARKS.has(t))
  const spec = plotSpecToVegaLite(plot.spec, { interactive: !hasCompositeMark })
  return { spec, provenance: plot._provenance }
}

function getLatestPayload(): string | null {
  const id = getLatestPlotId()
  if (!id) return null
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
  }
  #vis .vega-embed { width: 100%; }
  #vis .vega-embed canvas,
  #vis .vega-embed svg {
    max-width: 100%;
    max-height: calc(100vh - 80px);
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
  #shortcuts {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 20px 24px;
    z-index: 20;
    font-size: 12px;
    min-width: 220px;
  }
  #shortcuts.open { display: block; }
  #shortcuts h3 { font-size: 13px; margin-bottom: 12px; color: #c9d1d9; }
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
      <button onclick="toggleShortcuts()" title="Keyboard shortcuts (?)">?</button>
    </div>
  </div>
</div>
<div id="overlay" onclick="closeOverlays()"></div>
<div id="shortcuts">
  <h3>Keyboard Shortcuts</h3>
  <div class="shortcut-row"><span>Previous plot</span><kbd>&larr;</kbd></div>
  <div class="shortcut-row"><span>Next plot</span><kbd>&rarr;</kbd></div>
  <div class="shortcut-row"><span>Latest plot</span><kbd>End</kbd></div>
  <div class="shortcut-row"><span>First plot</span><kbd>Home</kbd></div>
  <div class="shortcut-row"><span>Toggle history</span><kbd>h</kbd></div>
  <div class="shortcut-row"><span>Download SVG</span><kbd>s</kbd></div>
  <div class="shortcut-row"><span>Download PNG</span><kbd>p</kbd></div>
  <div class="shortcut-row"><span>Fullscreen</span><kbd>f</kbd></div>
  <div class="shortcut-row"><span>Show shortcuts</span><kbd>?</kbd></div>
  <div class="shortcut-row"><span>Close panel</span><kbd>Esc</kbd></div>
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
const shortcutsEl = document.getElementById('shortcuts');
const overlayEl = document.getElementById('overlay');

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
    const result = await vegaEmbed(vis, cleanSpec, embedOpts);
    view = result.view;
  }
}

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

function toggleShortcuts() {
  const open = shortcutsEl.classList.toggle('open');
  overlayEl.classList.toggle('open', open);
}

function closeOverlays() {
  shortcutsEl.classList.remove('open');
  overlayEl.classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  // Ignore when typing in an input
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
    case '?': toggleShortcuts(); break;
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
    }
  };
}

// Load initial history then connect
fetch('/api/history')
  .then(r => r.json())
  .then(entries => {
    // Populate history with provenance-only stubs (lazy-load specs on navigate)
    history = entries.map(e => ({ provenance: e, spec: null }));
    rebuildHistoryList();
  })
  .then(() => connect());
</script>
</body>
</html>`

export function handleServe(port?: number): void {
  const p = port || 4242
  ensureHistoryDirs()

  const clients = new Set<ServerResponse>()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function broadcast(payload: string) {
    const sseData = `data: ${payload}\n\n`
    for (const client of clients) {
      try { client.write(sseData) } catch { clients.delete(client) }
    }
  }

  // Watch for new plots in history
  const plotsDir = getPlotsDir()
  watch(plotsDir, (_event, filename) => {
    if (!filename || !filename.endsWith('.json')) return

    // Debounce rapid writes
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const payload = getLatestPayload()
      if (payload) broadcast(payload)
    }, 150)
  })

  // Watch for style/customize changes to the Vega-Lite spec
  const vegaLitePath = join(getGGTermDir(), 'last-plot-vegalite.json')
  let styleDebounce: ReturnType<typeof setTimeout> | null = null
  watch(getGGTermDir(), (_event, filename) => {
    if (filename !== 'last-plot-vegalite.json') return

    if (styleDebounce) clearTimeout(styleDebounce)
    styleDebounce = setTimeout(() => {
      if (!existsSync(vegaLitePath)) return
      try {
        const spec = JSON.parse(readFileSync(vegaLitePath, 'utf-8'))
        const latestId = getLatestPlotId()
        const provenance = latestId ? { id: latestId, description: 'Styled plot', timestamp: new Date().toISOString(), geomTypes: [] } : { id: 'styled', description: 'Styled plot', timestamp: new Date().toISOString(), geomTypes: [] }
        broadcast(JSON.stringify({ type: 'plot', spec, provenance }))
      } catch { /* ignore parse errors during partial writes */ }
    }, 200)
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

      // Send latest plot immediately
      const payload = getLatestPayload()
      if (payload) res.write(`data: ${payload}\n\n`)

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
      console.error(`Port ${p} is already in use.`)
      console.error(`Kill the existing server: lsof -ti:${p} | xargs kill`)
      console.error(`Or use a different port: npx ggterm-plot serve ${p + 1}`)
      process.exit(1)
    }
    throw err
  })

  server.listen(p, () => {
    const url = `http://localhost:${p}`
    console.log(`ggterm live viewer running at ${url}`)

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
    } else {
      console.log(`Open in browser or Wave panel: wsh web open ${url}`)
    }

    console.log(`Watching ${plotsDir} for new plots...`)
    console.log(`Press Ctrl+C to stop`)
  })
}
