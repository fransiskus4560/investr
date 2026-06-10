/* ═══════════════════════════════════════════════════════════
   INVESTR — Line/Area Chart Module v1.0
   For portfolio value & aggregate trends (NOT price → use candles).
   Clean SVG line+area with adaptive X-axis. No bar charts.
═══════════════════════════════════════════════════════════ */

'use strict';

/* Render a line/area chart.
   opts: {
     values: [numbers],
     labels: [strings] (x-axis, optional, auto-sampled),
     up: bool (color),
     height: px (default 200),
     fill: bool (area fill, default true)
   }                                                          */
function renderLineChart(containerId, opts) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const vals = opts.values || [];
  if (vals.length < 2) { container.innerHTML = ''; return; }

  const W = container.clientWidth || 600;
  const H = opts.height || 200;
  const padL = 6, padR = 54, padT = 10, padB = opts.labels ? 30 : 12;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 1;
  const pad = range * 0.1;
  const lo = min - pad, hi = max + pad, rng = hi - lo;

  const x = i => padL + (i / (vals.length - 1)) * plotW;
  const y = v => padT + plotH - ((v - lo) / rng) * plotH;

  const up = opts.up !== undefined ? opts.up : (vals[vals.length-1] >= vals[0]);
  const color = up ? 'var(--green)' : 'var(--red)';

  // grid + price labels (4 levels)
  let grid = '';
  for (let g = 0; g <= 3; g++) {
    const v = lo + (rng * g / 3);
    const yy = y(v);
    grid += `<line class="candle-grid-line" x1="${padL}" y1="${yy.toFixed(1)}" x2="${padL+plotW}" y2="${yy.toFixed(1)}"/>`;
    grid += `<text class="candle-axis-label" x="${padL+plotW+6}" y="${(yy+3).toFixed(1)}">${fmtAxis(v)}</text>`;
  }

  // line path
  let d = '';
  vals.forEach((v, i) => { d += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; });

  // area fill path
  let area = '';
  if (opts.fill !== false) {
    area = d + `L${x(vals.length-1).toFixed(1)} ${(padT+plotH).toFixed(1)} L${x(0).toFixed(1)} ${(padT+plotH).toFixed(1)} Z`;
  }

  // x-axis labels (sampled)
  let axisX = '';
  if (opts.labels && opts.labels.length) {
    const n = opts.labels.length;
    const target = 6, step = Math.max(1, Math.round(n / target));
    for (let i = 0; i < n; i++) {
      if (i % step !== 0 && i !== n - 1) continue;
      let cx = x(i), anchor = 'middle';
      if (i === 0) { anchor = 'start'; cx = padL; }
      else if (i === n - 1) { anchor = 'end'; cx = padL + plotW; }
      axisX += `<text class="candle-axis-label" x="${cx.toFixed(1)}" y="${(H-padB+16)}" text-anchor="${anchor}">${opts.labels[i]}</text>`;
    }
  }

  // last-point dot
  const lastX = x(vals.length-1), lastY = y(vals[vals.length-1]);
  const gradId = containerId + '-grad';

  container.innerHTML = `<div class="candle-chart-wrap">
    <svg class="candle-svg" viewBox="0 0 ${W} ${H}" height="${H}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${up ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.22)'}"/>
          <stop offset="100%" stop-color="${up ? 'rgba(16,185,129,0)' : 'rgba(239,68,68,0)'}"/>
        </linearGradient>
      </defs>
      ${grid}
      ${axisX}
      ${area ? `<path d="${area}" fill="url(#${gradId})" stroke="none"/>` : ''}
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.5" fill="${color}"/>
    </svg>
  </div>`;
}

function fmtAxis(v) {
  if (Math.abs(v) >= 1e9) return (v/1e9).toFixed(1).replace('.',',') + 'M';
  if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(0) + 'jt';
  if (Math.abs(v) >= 1e3) return Math.round(v/1e3) + 'rb';
  return Math.round(v).toString();
}

/* Comparison line chart: two series (e.g. DRIP vs no-DRIP) */
function renderComparisonLine(containerId, seriesA, seriesB, labels, opts) {
  opts = opts || {};
  const container = document.getElementById(containerId);
  if (!container) return;
  const all = seriesA.concat(seriesB);
  if (all.length < 2) { container.innerHTML=''; return; }

  const W = container.clientWidth || 600;
  const H = opts.height || 200;
  const padL = 6, padR = 54, padT = 10, padB = labels ? 30 : 12;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const min = Math.min(...all), max = Math.max(...all);
  const rng = (max - min) * 1.1 || 1;
  const lo = min - (max-min)*0.05;
  const x = i => padL + (i / (seriesA.length - 1)) * plotW;
  const y = v => padT + plotH - ((v - lo) / rng) * plotH;

  let grid = '';
  for (let g = 0; g <= 3; g++) {
    const v = lo + (rng * g / 3), yy = y(v);
    grid += `<line class="candle-grid-line" x1="${padL}" y1="${yy.toFixed(1)}" x2="${padL+plotW}" y2="${yy.toFixed(1)}"/>`;
    grid += `<text class="candle-axis-label" x="${padL+plotW+6}" y="${(yy+3).toFixed(1)}">${fmtAxis(v)}</text>`;
  }
  const path = (s) => { let d=''; s.forEach((v,i)=>{ d+=(i===0?'M':'L')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' '; }); return d; };

  let axisX = '';
  if (labels && labels.length) {
    const n = labels.length, step = Math.max(1, Math.round(n/6));
    for (let i=0;i<n;i++){ if(i%step!==0 && i!==n-1) continue;
      let cx=x(i),a='middle'; if(i===0){a='start';cx=padL;} else if(i===n-1){a='end';cx=padL+plotW;}
      axisX += `<text class="candle-axis-label" x="${cx.toFixed(1)}" y="${H-padB+16}" text-anchor="${a}">${labels[i]}</text>`;
    }
  }

  const cA = opts.colorA || 'var(--green)';
  const cB = opts.colorB || 'var(--text-muted)';

  container.innerHTML = `<div class="candle-chart-wrap">
    <svg class="candle-svg" viewBox="0 0 ${W} ${H}" height="${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}${axisX}
      <path d="${path(seriesB)}" fill="none" stroke="${cB}" stroke-width="2" stroke-dasharray="4 3" opacity="0.7" stroke-linejoin="round"/>
      <path d="${path(seriesA)}" fill="none" stroke="${cA}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(seriesA.length-1).toFixed(1)}" cy="${y(seriesA[seriesA.length-1]).toFixed(1)}" r="3.5" fill="${cA}"/>
    </svg>
  </div>`;
}

/* Multi-line chart: N series sharing one scale (e.g. 3 scenarios) */
function renderMultiLine(containerId, series, labels, opts) {
  opts = opts || {};
  const container = document.getElementById(containerId);
  if (!container) return;
  const flat = series.reduce((a,s)=>a.concat(s.values),[]);
  if (flat.length < 2) { container.innerHTML=''; return; }

  const W = container.clientWidth || 600;
  const H = opts.height || 200;
  const padL = 6, padR = 54, padT = 12, padB = labels ? 30 : 12;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const min = Math.min(...flat), max = Math.max(...flat);
  const rng = (max - min) * 1.12 || 1;
  const lo = min - (max-min)*0.06;
  const len = series[0].values.length;
  const x = i => padL + (i/(len-1))*plotW;
  const y = v => padT + plotH - ((v-lo)/rng)*plotH;

  let grid = '';
  for (let g=0; g<=3; g++){ const v=lo+(rng*g/3), yy=y(v);
    grid += `<line class="candle-grid-line" x1="${padL}" y1="${yy.toFixed(1)}" x2="${padL+plotW}" y2="${yy.toFixed(1)}"/>`;
    grid += `<text class="candle-axis-label" x="${padL+plotW+6}" y="${(yy+3).toFixed(1)}">${fmtAxis(v)}</text>`;
  }
  const pathOf = s => { let d=''; s.forEach((v,i)=>{ d+=(i===0?'M':'L')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' '; }); return d; };

  let axisX='';
  if (labels && labels.length){ const n=labels.length, step=Math.max(1,Math.round(n/6));
    for(let i=0;i<n;i++){ if(i%step!==0 && i!==n-1) continue;
      let cx=x(i),a='middle'; if(i===0){a='start';cx=padL;} else if(i===n-1){a='end';cx=padL+plotW;}
      axisX += `<text class="candle-axis-label" x="${cx.toFixed(1)}" y="${H-padB+16}" text-anchor="${a}">${labels[i]}</text>`;
    }
  }

  const lines = series.map(s => {
    const dash = s.dash ? 'stroke-dasharray="4 3"' : '';
    const lx = x(len-1), ly = y(s.values[len-1]);
    return `<path d="${pathOf(s.values)}" fill="none" stroke="${s.color}" stroke-width="${s.width||2.5}" ${dash} stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3" fill="${s.color}"/>`;
  }).join('');

  container.innerHTML = `<div class="candle-chart-wrap">
    <svg class="candle-svg" viewBox="0 0 ${W} ${H}" height="${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}${axisX}${lines}
    </svg>
  </div>`;
}
