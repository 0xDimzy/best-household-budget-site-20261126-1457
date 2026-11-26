// Hand-written SVG charts: a donut for the spending split and horizontal
// bars for category amounts. No chart library is used.

import { money } from './format.js';

export const PALETTE = [
  '#0e7a5f', '#2a9d8f', '#e9a13b', '#4361ee', '#7b5ea7',
  '#d64550', '#4d96c6', '#8ab17d', '#c77d0a', '#5b8c5a',
];

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Donut chart. `slices` is [{ label, value }] in display order; returns an
// SVG string with a legend. Slices under 2% are folded into "Other" so the
// chart stays readable.
export function donutChart(slices, size = 260) {
  const total = slices.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const rIn = r * 0.62;
  let html = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Donut chart of spending by category" class="chart-svg">`;
  if (!total) {
    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e3e8e6" stroke-width="${r - rIn}"/>`;
  } else {
    let angle = 0;
    slices.forEach((slice, i) => {
      const frac = slice.value / total;
      const sweep = frac * 360;
      if (sweep <= 0) return;
      const [x1, y1] = polar(cx, cy, r, angle);
      const [x2, y2] = polar(cx, cy, r, angle + sweep);
      const [xi1, yi1] = polar(cx, cy, rIn, angle + sweep);
      const [xi2, yi2] = polar(cx, cy, rIn, angle);
      const large = sweep > 180 ? 1 : 0;
      const color = PALETTE[i % PALETTE.length];
      if (sweep >= 359.99) {
        html += `<circle cx="${cx}" cy="${cy}" r="${(r + rIn) / 2}" fill="none" stroke="${color}" stroke-width="${r - rIn}"/>`;
      } else {
        html += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${xi1.toFixed(1)} ${yi1.toFixed(1)} A ${rIn} ${rIn} 0 ${large} 0 ${xi2.toFixed(1)} ${yi2.toFixed(1)} Z" fill="${color}"/>`;
      }
      angle += sweep;
    });
    html += `<text x="${cx}" y="${cy - 6}" text-anchor="middle" class="donut-total">${money(total)}</text>`;
    html += `<text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-label">spent / month</text>`;
  }
  html += '</svg>';
  return html;
}

// Horizontal bar chart. `rows` is [{ label, value }], biggest first.
export function barChart(rows, maxValue) {
  const max = maxValue || Math.max(1, ...rows.map((r) => r.value));
  let html = '<div class="bars" role="img" aria-label="Bar chart of spending by category">';
  rows.forEach((row, i) => {
    const w = Math.max(1.5, (row.value / max) * 100);
    const color = PALETTE[i % PALETTE.length];
    html += `<div class="bar-row"><span class="bar-label">${row.label}</span>`
      + `<div class="bar-track"><div class="bar-fill" style="width:${w.toFixed(1)}%;background:${color}"></div></div>`
      + `<span class="bar-value">${money(row.value)}</span></div>`;
  });
  html += '</div>';
  return html;
}
