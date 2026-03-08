/**
 * Convert ANSI terminal output to PNG images using ansi-to-html
 * Renders each plot panel in a terminal-styled HTML page and screenshots it
 */

// Simple ANSI to HTML converter (no dependencies needed)
function ansiToHtml(ansi: string): string {
  let html = '';
  let i = 0;
  let openSpans = 0;

  while (i < ansi.length) {
    if (ansi[i] === '\x1b' && ansi[i + 1] === '[') {
      // Parse escape sequence
      let j = i + 2;
      while (j < ansi.length && ansi[j] !== 'm') j++;
      const codes = ansi.slice(i + 2, j).split(';').map(Number);
      i = j + 1;

      if (codes[0] === 0) {
        // Reset
        while (openSpans > 0) { html += '</span>'; openSpans--; }
      } else if (codes[0] === 38 && codes[1] === 2) {
        // 24-bit foreground color
        const r = codes[2], g = codes[3], b = codes[4];
        html += `<span style="color:rgb(${r},${g},${b})">`;
        openSpans++;
      } else if (codes[0] === 48 && codes[1] === 2) {
        // 24-bit background color
        const r = codes[2], g = codes[3], b = codes[4];
        html += `<span style="background:rgb(${r},${g},${b})">`;
        openSpans++;
      }
    } else if (ansi[i] === '<') {
      html += '&lt;'; i++;
    } else if (ansi[i] === '>') {
      html += '&gt;'; i++;
    } else if (ansi[i] === '&') {
      html += '&amp;'; i++;
    } else {
      html += ansi[i]; i++;
    }
  }
  while (openSpans > 0) { html += '</span>'; openSpans--; }
  return html;
}

// Read ANSI output from generate-fig2b.ts
const proc = Bun.spawn(['bun', 'run', 'paper/generate-fig2b.ts'], {
  cwd: '/Users/scotthandley/Code/tools/ggterm',
  stdout: 'pipe',
  stderr: 'pipe',
});

const output = await new Response(proc.stdout).text();
await proc.exited;

// Split into panels
const panels: Record<string, string> = {};
let currentPanel = '';
for (const line of output.split('\n')) {
  if (line.startsWith('===') && line.endsWith('===')) {
    currentPanel = line.replace(/===/g, '').trim();
    panels[currentPanel] = '';
  } else if (currentPanel) {
    panels[currentPanel] += line + '\n';
  }
}

// Generate HTML for each panel
for (const [name, ansi] of Object.entries(panels)) {
  const htmlContent = ansiToHtml(ansi.trimEnd());
  const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { margin: 0; padding: 0; background: #1a1a2e; }
pre {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.25;
  padding: 16px 20px;
  margin: 0;
  background: #1a1a2e;
  color: #e0e0e0;
  white-space: pre;
  display: inline-block;
}
</style></head>
<body><pre>${htmlContent}</pre></body>
</html>`;

  const filename = `paper/figures/fig2b-${name.toLowerCase().replace(/_/g, '-')}.html`;
  await Bun.write(filename, fullHtml);
  console.log(`Wrote ${filename}`);
}

console.log('\nHTML files ready. Use Playwright to screenshot them.');
