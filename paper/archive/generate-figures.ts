/**
 * Generate figures for bioRxiv preprint
 */
import { gg, geom_point, geom_hline, geom_vline, facet_wrap, renderToString } from '../packages/core/src/index.ts';

// Generate iris-like data
const data: any[] = [];
const species = ['setosa', 'versicolor', 'virginica'];
for (const sp of species) {
  const base = species.indexOf(sp);
  for (let i = 0; i < 50; i++) {
    data.push({
      sepal_length: 5 + base * 0.7 + Math.random() * 0.8,
      sepal_width: 3 + Math.random() * 0.5,
      petal_length: 1.5 + base * 2 + Math.random(),
      petal_width: 0.2 + base * 0.8 + Math.random() * 0.3,
      species: sp,
    });
  }
}

// Strip ANSI codes
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Figure 3A: Initial scatter plot
const fig3a = gg(data)
  .aes({ x: 'petal_length', y: 'petal_width' })
  .geom(geom_point())
  .labs({ title: 'A) Petal Dimensions' })
  .spec();

console.log('=== FIGURE 3A ===');
console.log(stripAnsi(renderToString(fig3a, { width: 55, height: 16 })));
console.log('');

// Figure 3B: Colored by species
const fig3b = gg(data)
  .aes({ x: 'petal_length', y: 'petal_width', color: 'species' })
  .geom(geom_point())
  .labs({ title: 'B) Colored by Species' })
  .spec();

console.log('=== FIGURE 3B ===');
console.log(stripAnsi(renderToString(fig3b, { width: 55, height: 16 })));
console.log('');

// Figure 3C: Faceted by species
const fig3c = gg(data)
  .aes({ x: 'petal_length', y: 'petal_width' })
  .geom(geom_point())
  .facet(facet_wrap('species'))
  .labs({ title: 'C) Faceted by Species' })
  .spec();

console.log('=== FIGURE 3C ===');
console.log(stripAnsi(renderToString(fig3c, { width: 70, height: 20 })));
console.log('');

// Figure 3D description
console.log('=== FIGURE 3D ===');
console.log('D) Publication Export');
console.log('');
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│                                                         │');
console.log('│     [Interactive Vega-Lite Visualization]               │');
console.log('│                                                         │');
console.log('│     ┌─────────────────────────────────────┐             │');
console.log('│     │                           ■■■       │             │');
console.log('│     │                       ■■■■■■■■      │             │');
console.log('│     │                   ▲▲▲▲▲▲▲■■■       │             │');
console.log('│     │               ▲▲▲▲▲▲▲▲▲            │             │');
console.log('│     │           ●●●●●●●                  │             │');
console.log('│     │       ●●●●●●●                      │             │');
console.log('│     └─────────────────────────────────────┘             │');
console.log('│                                                         │');
console.log('│     [Download PNG]  [Download SVG]  [View Spec]         │');
console.log('│                                                         │');
console.log('└─────────────────────────────────────────────────────────┘');
console.log('');
console.log('HTML export with interactive pan/zoom and download buttons.');
