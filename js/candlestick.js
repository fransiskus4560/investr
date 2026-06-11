/* ═══════════════════════════════════════════════════════════
   INVESTR — Candlestick Chart Module v1.0
   Reusable OHLC candlestick renderer (pure SVG, no library).
   v1: generates realistic synthetic OHLC seeded per ticker+timeframe.
   v2: feed real OHLC arrays from API into renderCandles().
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Seeded RNG so the same ticker+timeframe looks consistent ── */
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
}
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

/* ── Generate synthetic but realistic OHLC ──────────────────
   basePrice: starting price · bars: number of candles
   trend: -1..1 (bias) · volatility: 0..1                     */
function generateOHLC(ticker, timeframe, basePrice, trend, bars) {
  const rng = seededRandom(hashStr(ticker + timeframe));
  const vol = basePrice * 0.025;            // per-bar volatility
  const drift = trend * basePrice * 0.004;  // directional bias
  const data = [];
  let prevClose = basePrice * (1 - trend * 0.15); // start lower if uptrend

  for (let i = 0; i < bars; i++) {
    const open = prevClose;
    const change = (rng() - 0.5) * 2 * vol + drift;
    let close = open + change;
    if (close < basePrice * 0.3) close = basePrice * 0.3; // floor
    const high = Math.max(open, close) + rng() * vol * 0.8;
    const low  = Math.min(open, close) - rng() * vol * 0.8;
    const volume = 0.4 + rng() * 0.6;       // normalized 0..1
    data.push({ open, high, low, close, volume });
    prevClose = close;
  }
  // normalize last close to ~basePrice (current price)
  return data;
}

/* ── Timeframe → number of bars ─────────────────────────── */
const TF_BARS = { '1D':24, '1W':35, '1M':30, '3M':45, '6M':52, '1Y':52, '3Y':60, '5Y':60, 'All':72 };

/* ── Generate adaptive X-axis labels per timeframe ──────────
   Returns array of {i, label} where i = candle index to label.
   Pro apps label at intervals, not every candle.             */
function generateAxisLabels(timeframe, bars) {
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now = new Date();
  const labels = [];
  // how many labels to show (avoid crowding)
  const targetLabels = 6;
  const step = Math.max(1, Math.round(bars / targetLabels));

  for (let i = 0; i < bars; i++) {
    if (i % step !== 0 && i !== bars - 1) continue;
    let label = '';
    if (timeframe === '1D') {
      // intraday hours: market 09:00–16:00 → spread across bars
      const startMin = 9 * 60;
      const totalMin = 7 * 60;
      const min = startMin + Math.round((i / (bars - 1)) * totalMin);
      const hh = Math.floor(min / 60), mm = min % 60;
      label = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    } else if (timeframe === '1W' || timeframe === '1M') {
      // days back from now
      const daysBack = Math.round((1 - i / (bars - 1)) * (timeframe === '1W' ? 7 : 30));
      const d = new Date(now); d.setDate(d.getDate() - daysBack);
      label = d.getDate() + ' ' + months[d.getMonth()];
    } else if (timeframe === '3M' || timeframe === '6M') {
      const monthsBack = Math.round((1 - i / (bars - 1)) * (timeframe === '3M' ? 3 : 6));
      const d = new Date(now); d.setMonth(d.getMonth() - monthsBack);
      label = months[d.getMonth()] + " '" + String(d.getFullYear()).slice(2);
    } else {
      // 1Y, 3Y, 5Y, All → months/years
      const yearsSpan = timeframe === '1Y' ? 1 : timeframe === '3Y' ? 3 : timeframe === '5Y' ? 5 : 8;
      const monthsBack = Math.round((1 - i / (bars - 1)) * yearsSpan * 12);
      const d = new Date(now); d.setMonth(d.getMonth() - monthsBack);
      if (yearsSpan <= 1) label = months[d.getMonth()];
      else label = months[d.getMonth()] + " '" + String(d.getFullYear()).slice(2);
    }
    labels.push({ i, label });
  }
  return labels;
}

/* ── Render candlestick SVG into a container ────────────────
   opts: { ticker, timeframe, basePrice, up }                 */
function renderCandles(containerId, opts) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const bars = TF_BARS[opts.timeframe] || 30;
  const trend = opts.up ? 0.6 : -0.6;
  const data = generateOHLC(opts.ticker, opts.timeframe, opts.basePrice, trend, bars);

  // dimensions
  const W = container.clientWidth || 640;
  const H = 220;
  const padL = 6, padR = 52, padT = 8, padB = 36;
  const volH = 38;                          // volume area height
  const priceH = H - padT - padB - volH - 6;
  const plotW = W - padL - padR;

  // price range
  const highs = data.map(d => d.high), lows = data.map(d => d.low);
  const maxP = Math.max(...highs), minP = Math.min(...lows);
  const rangeP = (maxP - minP) || 1;
  const maxVol = Math.max(...data.map(d => d.volume)) || 1;

  const cw = plotW / data.length;           // candle slot width
  const bodyW = Math.max(1.5, cw * 0.6);

  const yPrice = p => padT + priceH - ((p - minP) / rangeP) * priceH;
  const volTop = padT + priceH + 6;
  const yVol = v => volTop + volH - (v / maxVol) * volH;

  // grid lines + price labels (5 levels)
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const p = minP + (rangeP * g / 4);
    const y = yPrice(p);
    grid += `<line class="candle-grid-line" x1="${padL}" y1="${y.toFixed(1)}" x2="${padL+plotW}" y2="${y.toFixed(1)}"/>`;
    grid += `<text class="candle-axis-label" x="${padL+plotW+6}" y="${(y+3).toFixed(1)}">${fmtPrice(p)}</text>`;
  }

  // candles + volume
  let candles = '', vols = '', bands = '';
  data.forEach((d, i) => {
    const cx = padL + i * cw + cw / 2;
    const up = d.close >= d.open;
    const cls = up ? 'candle-up' : 'candle-down';
    const volCls = up ? 'candle-vol-up' : 'candle-vol-down';
    // wick
    candles += `<line class="candle-wick ${cls}" x1="${cx.toFixed(1)}" y1="${yPrice(d.high).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yPrice(d.low).toFixed(1)}"/>`;
    // body
    const bodyTop = yPrice(Math.max(d.open, d.close));
    const bodyBot = yPrice(Math.min(d.open, d.close));
    const bh = Math.max(1, bodyBot - bodyTop);
    candles += `<rect class="candle-body ${cls}" x="${(cx-bodyW/2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${bodyW.toFixed(1)}" height="${bh.toFixed(1)}"/>`;
    // volume
    const vy = yVol(d.volume);
    vols += `<rect class="${volCls}" x="${(cx-bodyW/2).toFixed(1)}" y="${vy.toFixed(1)}" width="${bodyW.toFixed(1)}" height="${(volTop+volH-vy).toFixed(1)}"/>`;
    // hover band (full height, transparent until hover)
    bands += `<rect class="candle-hover-band" data-i="${i}" x="${(padL+i*cw).toFixed(1)}" y="${padT}" width="${cw.toFixed(1)}" height="${H-padB}"
      data-o="${d.open.toFixed(0)}" data-h="${d.high.toFixed(0)}" data-l="${d.low.toFixed(0)}" data-c="${d.close.toFixed(0)}"/>`;
  });

  // X-axis date/time labels (adaptive per timeframe)
  let axisX = '';
  const axisLabels = generateAxisLabels(opts.timeframe, data.length);
  const axisY = H - padB + 16;
  axisLabels.forEach(({i, label}) => {
    let cx = padL + i * cw + cw / 2;
    // keep edge labels inside plot
    let anchor = 'middle';
    if (i === 0) { anchor = 'start'; cx = padL; }
    else if (i === data.length - 1) { anchor = 'end'; cx = padL + plotW; }
    axisX += `<text class="candle-axis-label" x="${cx.toFixed(1)}" y="${axisY}" text-anchor="${anchor}">${label}</text>`;
    // subtle tick
    axisX += `<line class="candle-grid-line" x1="${(padL+i*cw+cw/2).toFixed(1)}" y1="${padT}" x2="${(padL+i*cw+cw/2).toFixed(1)}" y2="${(padT+priceH).toFixed(1)}" opacity="0.4"/>`;
  });

  const svg = `<div class="candle-chart-wrap">
    <svg class="candle-svg" viewBox="0 0 ${W} ${H}" height="${H}" preserveAspectRatio="xMidYMid meet" id="${containerId}-svg">
      ${grid}
      ${axisX}
      ${vols}
      ${candles}
      ${bands}
    </svg>
    <div class="candle-tooltip" id="${containerId}-tip"></div>
  </div>`;

  container.innerHTML = svg;

  // update meta row (last candle)
  const last = data[data.length-1];
  updateMeta(containerId, last);

  // hover interaction
  attachCandleHover(containerId, data);
}

function fmtPrice(p) {
  if (p >= 1000) return Math.round(p).toLocaleString('id-ID');
  if (p >= 1)    return p.toFixed(0);
  return p.toFixed(2);
}

function updateMeta(containerId, candle) {
  const meta = document.getElementById(containerId + '-meta');
  if (!meta) return;
  const up = candle.close >= candle.open;
  const c = up ? 'text-up' : 'text-down';
  meta.innerHTML = `
    <span class="chart-meta"><span class="mlabel">O</span><strong>${fmtPrice(candle.open)}</strong></span>
    <span class="chart-meta"><span class="mlabel">H</span><strong class="text-up">${fmtPrice(candle.high)}</strong></span>
    <span class="chart-meta"><span class="mlabel">L</span><strong class="text-down">${fmtPrice(candle.low)}</strong></span>
    <span class="chart-meta"><span class="mlabel">C</span><strong class="${c}">${fmtPrice(candle.close)}</strong></span>`;
}

function attachCandleHover(containerId, data) {
  const svg = document.getElementById(containerId + '-svg');
  const tip = document.getElementById(containerId + '-tip');
  if (!svg || !tip) return;
  const bands = svg.querySelectorAll('.candle-hover-band');
  bands.forEach(band => {
    band.addEventListener('mouseenter', () => {
      bands.forEach(b => b.classList.remove('active'));
      band.classList.add('active');
      const o=+band.dataset.o, h=+band.dataset.h, l=+band.dataset.l, c=+band.dataset.c;
      const up = c >= o;
      tip.innerHTML = `
        <div class="candle-tooltip-row"><span class="candle-tooltip-label">Open</span><span>${fmtPrice(o)}</span></div>
        <div class="candle-tooltip-row"><span class="candle-tooltip-label">High</span><span class="text-up">${fmtPrice(h)}</span></div>
        <div class="candle-tooltip-row"><span class="candle-tooltip-label">Low</span><span class="text-down">${fmtPrice(l)}</span></div>
        <div class="candle-tooltip-row"><span class="candle-tooltip-label">Close</span><span class="${up?'text-up':'text-down'}">${fmtPrice(c)}</span></div>`;
      tip.classList.add('show');
      updateMeta(containerId, {open:o,high:h,low:l,close:c});
    });
    band.addEventListener('mousemove', e => {
      const wrap = svg.closest('.candle-chart-wrap');
      const r = wrap.getBoundingClientRect();
      let x = e.clientX - r.left + 12;
      if (x > r.width - 120) x = e.clientX - r.left - 120;
      tip.style.left = x + 'px';
      tip.style.top = (e.clientY - r.top + 8) + 'px';
    });
  });
  const wrap = svg.closest('.candle-chart-wrap');
  wrap.addEventListener('mouseleave', () => {
    tip.classList.remove('show');
    bands.forEach(b => b.classList.remove('active'));
    updateMeta(containerId, data[data.length-1]);
  });
}
