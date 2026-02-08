/**
 * Live plot viewer server
 *
 * Watches .ggterm/plots/ for new plots and pushes them to connected
 * browsers via WebSocket. Renders interactive Vega-Lite in a dark-themed page.
 */

import { watch } from 'fs'
import {
  getHistory,
  getLatestPlotId,
  loadPlotFromHistory,
  getPlotsDir,
  ensureHistoryDirs,
} from './history'
import { plotSpecToVegaLite } from './export'
import type { HistoricalPlot } from './history'
import type { VegaLiteSpec } from './export'

function plotToVegaLite(plot: HistoricalPlot): { spec: VegaLiteSpec; provenance: HistoricalPlot['_provenance'] } {
  const spec = plotSpecToVegaLite(plot.spec, { interactive: true })
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
    flex-direction: column;
    overflow: hidden;
  }
  #vis {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  #vis .vega-embed {
    width: 100%;
  }
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
  #nav button {
    background: #21262d;
    border: 1px solid #30363d;
    color: #c9d1d9;
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }
  #nav button:hover { background: #30363d; }
  #nav button:disabled { opacity: 0.3; cursor: default; }
  #nav button:disabled:hover { background: #21262d; }
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
</style>
</head>
<body>
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
    <button id="prev" disabled>&larr;</button>
    <button id="next" disabled>&rarr;</button>
  </div>
  <div id="actions">
    <button onclick="downloadSVG()">SVG</button>
    <button onclick="downloadPNG()">PNG</button>
  </div>
</div>
<script>
const vis = document.getElementById('vis');
const statusEl = document.getElementById('status');
const idEl = document.getElementById('plot-id');
const descEl = document.getElementById('plot-desc');
const timeEl = document.getElementById('plot-time');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

let history = [];
let currentIdx = -1;
let view = null;
let ws = null;

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

async function renderSpec(spec) {
  vis.innerHTML = '';
  const vegaSpec = { ...spec, width: 'container', height: 'container', autosize: { type: 'fit', contains: 'padding' } };
  const result = await vegaEmbed(vis, vegaSpec, {
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
  });
  view = result.view;
}

async function showPlot(data) {
  await renderSpec(data.spec);
  updateMeta(data.provenance);
}

function navigate(idx) {
  if (idx < 0 || idx >= history.length) return;
  currentIdx = idx;
  showPlot(history[idx]);
  updateNav();
}

prevBtn.onclick = () => navigate(currentIdx - 1);
nextBtn.onclick = () => navigate(currentIdx + 1);

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') navigate(currentIdx - 1);
  if (e.key === 'ArrowRight') navigate(currentIdx + 1);
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
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto + '//' + location.host + '/ws');

  ws.onopen = () => { statusEl.classList.add('connected'); };
  ws.onclose = () => {
    statusEl.classList.remove('connected');
    setTimeout(connect, 2000);
  };
  ws.onerror = () => ws.close();

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'plot') {
      history.push(data);
      currentIdx = history.length - 1;
      showPlot(data);
      updateNav();
    }
  };
}

// Load initial history then connect
fetch('/api/history')
  .then(r => r.json())
  .then(entries => {
    // Preload just the IDs; full specs loaded on navigate
    history = [];
    return entries;
  })
  .then(() => connect());
</script>
</body>
</html>`

export function handleServe(port?: number): void {
  const p = port || 4242
  ensureHistoryDirs()

  const clients = new Set<any>()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Watch for new plots
  const plotsDir = getPlotsDir()
  watch(plotsDir, (event, filename) => {
    if (!filename || !filename.endsWith('.json')) return

    // Debounce rapid writes
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const payload = getLatestPayload()
      if (!payload) return
      for (const client of clients) {
        try { client.send(payload) } catch { clients.delete(client) }
      }
    }, 150)
  })

  const server = Bun.serve({
    port: p,
    fetch(req, server) {
      const url = new URL(req.url)

      // WebSocket upgrade
      if (url.pathname === '/ws') {
        if (server.upgrade(req)) return
        return new Response('WebSocket upgrade failed', { status: 400 })
      }

      // API routes
      if (url.pathname === '/api/latest') {
        const payload = getLatestPayload()
        if (!payload) return Response.json({ type: 'empty' })
        return new Response(payload, { headers: { 'content-type': 'application/json' } })
      }

      if (url.pathname === '/api/history') {
        const entries = getHistory().slice(-50)
        return Response.json(entries)
      }

      if (url.pathname.startsWith('/api/plot/')) {
        const id = url.pathname.slice('/api/plot/'.length)
        const plot = loadPlotFromHistory(id)
        if (!plot) return Response.json({ error: 'not found' }, { status: 404 })
        const { spec, provenance } = plotToVegaLite(plot)
        return Response.json({ type: 'plot', spec, provenance })
      }

      // Serve client HTML
      return new Response(CLIENT_HTML, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    },
    websocket: {
      open(ws) {
        clients.add(ws)
        // Send latest plot immediately
        const payload = getLatestPayload()
        if (payload) ws.send(payload)
      },
      close(ws) {
        clients.delete(ws)
      },
      message() {
        // Client doesn't send messages; ignore
      },
    },
  })

  const url = `http://localhost:${server.port}`
  console.log(`ggterm live viewer running at ${url}`)

  // Auto-open Wave panel if running inside Wave terminal
  if (process.env.TERM_PROGRAM === 'waveterm') {
    Bun.spawn(['wsh', 'web', 'open', url])
    console.log(`Opened Wave panel`)
  } else {
    console.log(`Open in browser or Wave panel: wsh web open ${url}`)
  }

  console.log(`Watching ${plotsDir} for new plots...`)
  console.log(`Press Ctrl+C to stop`)
}
