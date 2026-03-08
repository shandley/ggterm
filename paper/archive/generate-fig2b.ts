/**
 * Generate Figure 2B panels: actual ggterm terminal renderings
 * Produces volcano plot, Kaplan-Meier curve, and forest plot
 */
import { gg, geom_volcano, geom_kaplan_meier, geom_forest, renderToString } from '../packages/core/src/index.ts';

// === VOLCANO PLOT DATA ===
const volcanoData: any[] = [];
for (let i = 0; i < 2000; i++) {
  const log2fc = (Math.random() - 0.5) * 8;
  const basePval = Math.random();
  // Make extreme fold changes more significant
  const pval = Math.abs(log2fc) > 1.5
    ? Math.pow(10, -Math.random() * 8)
    : Math.pow(10, -Math.random() * 2);
  volcanoData.push({
    gene: `Gene${i}`,
    log2FoldChange: log2fc,
    pvalue: pval,
  });
}

const volcanoPlot = gg(volcanoData)
  .aes({ x: 'log2FoldChange', y: 'pvalue', label: 'gene' })
  .geom(geom_volcano({
    fc_threshold: 1,
    p_threshold: 0.05,
    show_thresholds: true,
    n_labels: 0,
  }))
  .labs({
    title: 'Differential Expression',
    x: 'log2 Fold Change',
    y: 'P-value',
  })
  .spec();

console.log('===VOLCANO===');
console.log(renderToString(volcanoPlot, { width: 60, height: 22 }));

// === KAPLAN-MEIER DATA ===
const survivalData: any[] = [];
for (let i = 0; i < 80; i++) {
  // Treatment arm - better survival
  const tTime = Math.random() * 24;
  const tStatus = Math.random() < 0.4 ? 1 : 0;
  survivalData.push({ time: tTime, status: tStatus, arm: 'Treatment' });

  // Control arm - worse survival
  const cTime = Math.random() * 18;
  const cStatus = Math.random() < 0.6 ? 1 : 0;
  survivalData.push({ time: cTime, status: cStatus, arm: 'Control' });
}

const kmPlot = gg(survivalData)
  .aes({ x: 'time', y: 'status', color: 'arm' })
  .geom(geom_kaplan_meier({
    show_ci: true,
    show_censored: true,
  }))
  .labs({
    title: 'Overall Survival',
    x: 'Time (months)',
    y: 'Survival Probability',
  })
  .spec();

console.log('===KAPLAN_MEIER===');
console.log(renderToString(kmPlot, { width: 60, height: 22 }));

// === FOREST PLOT DATA ===
const forestData = [
  { study: 'Smith 2019',  estimate: 1.82, ci_lower: 1.21, ci_upper: 2.74, weight: 12 },
  { study: 'Jones 2020',  estimate: 1.45, ci_lower: 1.05, ci_upper: 2.00, weight: 18 },
  { study: 'Lee 2021',    estimate: 0.92, ci_lower: 0.65, ci_upper: 1.30, weight: 22 },
  { study: 'Chen 2022',   estimate: 1.28, ci_lower: 0.88, ci_upper: 1.86, weight: 25 },
  { study: 'Wang 2023',   estimate: 1.55, ci_lower: 1.12, ci_upper: 2.14, weight: 23 },
  { study: 'Pooled',      estimate: 1.35, ci_lower: 1.15, ci_upper: 1.58, weight: 100 },
];

const forestPlot = gg(forestData)
  .aes({ x: 'estimate', y: 'study', xmin: 'ci_lower', xmax: 'ci_upper', size: 'weight' })
  .geom(geom_forest({
    null_line: 1,
    show_summary: false,
  }))
  .labs({
    title: 'Treatment Effect',
    x: 'Odds Ratio (95% CI)',
    y: 'Study',
  })
  .spec();

console.log('===FOREST===');
console.log(renderToString(forestPlot, { width: 60, height: 22 }));
