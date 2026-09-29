/**
 * Default theme for ggterm
 */

import type { Theme } from '@ggterm/spec/types'

/**
 * Minimal default theme
 */
export function defaultTheme(): Theme {
  return {
    panel: {
      background: '',
      border: 'single',
      grid: { major: '·', minor: null },
    },
    axis: {
      text: { color: '' },
      ticks: { char: '┼', length: 1 },
      title: { color: '', bold: false },
    },
    legend: {
      position: 'right',
      title: { bold: true },
    },
    title: {
      align: 'center',
      bold: true,
    },
    facet: {
      strip: {
        text: '#c8c8c8',  // Light gray text
        background: '',   // No background
      },
    },
  }
}

/**
 * Minimal theme with no decorations
 */
export function themeMinimal(): Theme {
  return {
    panel: {
      background: '',
      border: 'none',
      grid: { major: null, minor: null },
    },
    axis: {
      text: { color: '' },
      ticks: { char: '│', length: 1 },
      title: { color: '', bold: false },
    },
    legend: {
      position: 'right',
      title: { bold: false },
    },
    title: {
      align: 'left',
      bold: false,
    },
    facet: {
      strip: {
        text: '#999999',
        background: '',
      },
    },
  }
}

/**
 * Dark theme
 */
export function themeDark(): Theme {
  return {
    panel: {
      background: '#1e1e1e',
      border: 'rounded',
      grid: { major: '·', minor: null },
    },
    axis: {
      text: { color: '#ccc' },
      ticks: { char: '┼', length: 1 },
      title: { color: '#fff', bold: true },
    },
    legend: {
      position: 'right',
      title: { bold: true },
    },
    title: {
      align: 'center',
      bold: true,
    },
    facet: {
      strip: {
        text: '#ffffff',
        background: '#333333',
      },
    },
  }
}

/**
 * Classic theme (ggplot2 style)
 */
export function themeClassic(): Theme {
  return {
    panel: {
      background: '',
      border: 'single',
      grid: { major: null, minor: null },
    },
    axis: {
      text: { color: '' },
      ticks: { char: '─', length: 1 },
      title: { color: '', bold: true },
    },
    legend: {
      position: 'right',
      title: { bold: true },
    },
    title: {
      align: 'center',
      bold: true,
    },
    facet: {
      strip: {
        text: '#c8c8c8',
        background: '',
      },
    },
  }
}

/**
 * Empty theme (just the plot area)
 */
export function themeVoid(): Theme {
  return {
    panel: {
      background: '',
      border: 'none',
      grid: { major: null, minor: null },
    },
    axis: {
      text: { color: '' },
      ticks: { char: '', length: 0 },
      title: { color: '', bold: false },
    },
    legend: {
      position: 'none',
      title: { bold: false },
    },
    title: {
      align: 'left',
      bold: false,
    },
    facet: {
      strip: {
        text: '#888888',
        background: '',
      },
    },
  }
}
