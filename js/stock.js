/* ═══════════════════════════════════════════════════════════
   INVESTR — Analisis Saham (deep-dive) v1.0
   Dual verdict: Investor lens + Trader lens.
   Metrics with auto-judging (good/ok/bad). Fair value bar.
═══════════════════════════════════════════════════════════ */

'use strict';

const SA = {
  theme: localStorage.getItem('investr-theme') || 'dark',
  current: 'BBRI',
  timeframe: '1M',
};

/* ── Stock database (sample for v1) ─────────────────────── */
const STOCKS = {
  BBRI: {
    name:'Bank Rakyat Indonesia', color:'#1a9c5b', logo:'BR', price:5125, chg:1.24, up:true,
    metrics:{ pe:12.3, pb:2.1, roe:19.5, der:0.6, npm:24, divYield:3.8, eps:380, marketCap:'Rp 760 T' },
    fairValue:{ low:4500, fair:6200, high:7000, current:5125 },
    investor:{ action:'BUY', cls:'text-up', reason:'Valuasi menarik (P/E 12,3x di bawah rata-rata sektor), ROE tinggi 19,5%, dividen 3,8%. Fundamental solid untuk dipegang jangka panjang. Margin of safety memadai.' },
    trader:{ action:'HOLD', cls:'text-up', reason:'Harga di atas MA-50, tren naik. RSI 58 (netral, belum overbought). Tunggu pullback ke support 5.000 untuk entry yang lebih baik, atau breakout di atas 5.200.' },
  },
  BBCA: {
    name:'Bank Central Asia', color:'#0046a8', logo:'BC', price:9700, chg:-0.51, up:false,
    metrics:{ pe:23.5, pb:4.2, roe:18.0, der:0.8, npm:28, divYield:1.8, eps:413, marketCap:'Rp 1.195 T' },
    fairValue:{ low:8000, fair:9200, high:10500, current:9700 },
    investor:{ action:'HOLD', cls:'text-muted', reason:'Bank berkualitas terbaik, tapi valuasi sudah premium (P/E 23,5x, P/B 4,2x). Harga mendekati fair value. Bagus untuk hold, kurang menarik untuk entry baru di harga ini.' },
    trader:{ action:'HOLD', cls:'text-muted', reason:'Konsolidasi di kisaran 9.500-9.900. Momentum melemah, RSI 48. Tidak ada sinyal jelas. Tunggu breakout atau breakdown sebelum ambil posisi.' },
  },
  TLKM: {
    name:'Telkom Indonesia', color:'#e2231a', logo:'TL', price:3220, chg:0.62, up:true,
    metrics:{ pe:14.1, pb:2.8, roe:15.5, der:0.55, npm:18, divYield:4.5, eps:228, marketCap:'Rp 319 T' },
    fairValue:{ low:2900, fair:3800, high:4400, current:3220 },
    investor:{ action:'BUY', cls:'text-up', reason:'Dividend yield menarik 4,5%, valuasi wajar (P/E 14x). Pemain telko dominan dengan arus kas stabil. Cocok untuk income investor jangka panjang.' },
    trader:{ action:'BUY', cls:'text-up', reason:'Baru breakout dari konsolidasi, volume meningkat. Tren naik dimulai. Target terdekat 3.400, stop loss di 3.100. Momentum mendukung.' },
  },
  ASII: {
    name:'Astra International', color:'#003d7a', logo:'AS', price:5175, chg:-0.48, up:false,
    metrics:{ pe:10.2, pb:1.5, roe:11.2, der:0.95, npm:12, divYield:3.0, eps:507, marketCap:'Rp 210 T' },
    fairValue:{ low:4800, fair:6000, high:7000, current:5175 },
    investor:{ action:'BUY', cls:'text-up', reason:'Valuasi murah (P/E 10x, P/B 1,5x), konglomerat terdiversifikasi. ROE moderat 11%. Diskon dari fair value cukup menarik untuk akumulasi bertahap.' },
    trader:{ action:'WATCH', cls:'text-muted', reason:'Tren menurun jangka pendek, di bawah MA-50. RSI 42 mendekati oversold. Belum ada sinyal pembalikan. Tunggu konfirmasi bottom sebelum entry.' },
  },
  GOTO: {
    name:'GoTo Gojek Tokopedia', color:'#00aa13', logo:'GO', price:56, chg:-3.44, up:false,
    metrics:{ pe:0, pb:2.8, roe:-5, der:0.3, npm:-8, divYield:0, eps:-2, marketCap:'Rp 67 T' },
    fairValue:{ low:45, fair:62, high:85, current:56 },
    investor:{ action:'AVOID', cls:'text-down', reason:'Belum profit (EPS negatif, ROE -5%), tidak ada dividen. Terlalu spekulatif untuk investasi fundamental jangka panjang. Tunggu bukti profitabilitas berkelanjutan dulu.' },
    trader:{ action:'REDUCE', cls:'text-down', reason:'Tren turun kuat, di bawah semua MA. Momentum negatif, volume jual tinggi. Untuk yang sudah pegang: pertimbangkan cut loss. Hindari menangkap pisau jatuh.' },
  },
};

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(SA.theme);
  bindSAEvents();
  renderStock();
});

function applyTheme(theme) {
  SA.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  Store.set('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(SA.theme==='dark'?'light':'dark'); }

function selectStock(ticker) {
  ticker = ticker.toUpperCase().trim();
  if (STOCKS[ticker]) { SA.current = ticker; renderStock(); }
}

/* ── Metric judging logic (the "quant brain") ───────────── */
function judgePE(v)   { if(v<=0) return ['EPS negatif','judge-bad']; if(v<15) return ['Murah','judge-good']; if(v<25) return ['Wajar','judge-ok']; return ['Mahal','judge-bad']; }
function judgePB(v)   { if(v<1) return ['Murah','judge-good']; if(v<3) return ['Wajar','judge-ok']; return ['Mahal','judge-bad']; }
function judgeROE(v)  { if(v>=15) return ['Bagus','judge-good']; if(v>=10) return ['Cukup','judge-ok']; return ['Lemah','judge-bad']; }
function judgeDER(v)  { if(v<0.5) return ['Aman','judge-good']; if(v<1.5) return ['Wajar','judge-ok']; return ['Berisiko','judge-bad']; }
function judgeNPM(v)  { if(v>=15) return ['Bagus','judge-good']; if(v>=5) return ['Wajar','judge-ok']; return ['Tipis','judge-bad']; }
function judgeDY(v)   { if(v>=4) return ['Menarik','judge-good']; if(v>=2) return ['Wajar','judge-ok']; if(v>0) return ['Rendah','judge-ok']; return ['Tidak ada','judge-bad']; }

/* ── Render ─────────────────────────────────────────────── */
function renderStock() {
  const s = STOCKS[SA.current];
  if (!s) return;
  const cur = 'Rp';

  // header
  setText('saLogo', s.logo);
  document.getElementById('saLogo').style.background = s.color;
  setText('saTicker', SA.current);
  setText('saName', s.name);
  setText('saPrice', cur + ' ' + s.price.toLocaleString('id-ID'));
  const chgEl = document.getElementById('saChange');
  chgEl.textContent = (s.up?'▲ +':'▼ ') + Math.abs(s.chg).toFixed(2).replace('.',',') + '%';
  chgEl.className = 'stock-change ' + (s.up?'text-up':'text-down');

  // candlestick chart
  drawChart();

  // dual verdict
  setText('investorAction', s.investor.action);
  document.getElementById('investorAction').className = 'verdict-lens-action ' + s.investor.cls;
  setText('investorReason', s.investor.reason);
  setText('traderAction', s.trader.action);
  document.getElementById('traderAction').className = 'verdict-lens-action ' + s.trader.cls;
  setText('traderReason', s.trader.reason);

  // metrics
  renderMetrics(s.metrics);

  // fair value bar
  renderFairValue(s.fairValue, cur);
}

function drawChart() {
  const s = STOCKS[SA.current];
  if (!s) return;
  renderCandles('saChart', {
    ticker: SA.current,
    timeframe: SA.timeframe,
    basePrice: s.price,
    up: s.up,
  });
}

function renderMetrics(m) {
  const el = document.getElementById('metricsGrid');
  if (!el) return;
  const items = [
    { label:'P/E Ratio',  value:m.pe>0?m.pe.toFixed(1).replace('.',',')+'x':'—', judge:judgePE(m.pe) },
    { label:'P/B Ratio',  value:m.pb.toFixed(1).replace('.',',')+'x', judge:judgePB(m.pb) },
    { label:'ROE',        value:m.roe.toFixed(1).replace('.',',')+'%', judge:judgeROE(m.roe) },
    { label:'Debt/Equity',value:m.der.toFixed(1).replace('.',',')+'x', judge:judgeDER(m.der) },
    { label:'Net Margin', value:m.npm+'%', judge:judgeNPM(m.npm) },
    { label:'Div Yield',  value:m.divYield.toFixed(1).replace('.',',')+'%', judge:judgeDY(m.divYield) },
    { label:'EPS',        value:m.eps>0?'Rp '+m.eps:'Rp '+m.eps, judge:null },
    { label:'Market Cap', value:m.marketCap, judge:null },
  ];
  el.innerHTML = items.map(it => `
    <div class="metric-box">
      <div class="metric-box-label">${it.label}</div>
      <div class="metric-box-value">${it.value}</div>
      ${it.judge ? `<div class="metric-box-judge ${it.judge[1]}">${it.judge[0]}</div>` : '<div class="metric-box-judge text-muted">&nbsp;</div>'}
    </div>`).join('');
}

function renderFairValue(fv, cur) {
  // position current price on a scale from low to high
  const range = fv.high - fv.low;
  const pos = range>0 ? Math.max(0, Math.min(100, (fv.current - fv.low)/range*100)) : 50;
  const fairPos = range>0 ? (fv.fair - fv.low)/range*100 : 50;

  document.getElementById('fvMarker').style.left = pos + '%';
  document.getElementById('fvMarkerLabel').style.left = pos + '%';
  setText('fvMarkerLabel', cur + ' ' + fv.current.toLocaleString('id-ID'));

  setText('fvLow', cur + ' ' + fv.low.toLocaleString('id-ID'));
  setText('fvFair', cur + ' ' + fv.fair.toLocaleString('id-ID'));
  setText('fvHigh', cur + ' ' + fv.high.toLocaleString('id-ID'));

  // verdict text
  const el = document.getElementById('fvVerdict');
  if (el) {
    let txt, cls;
    if (fv.current < fv.fair * 0.92)      { txt = 'Undervalue — harga di bawah nilai wajar'; cls='text-up'; }
    else if (fv.current > fv.fair * 1.08) { txt = 'Overvalue — harga di atas nilai wajar';   cls='text-down'; }
    else                                  { txt = 'Fairly valued — harga mendekati nilai wajar'; cls='text-muted'; }
    el.textContent = txt;
    el.className = 'metric-box-judge ' + cls;
    el.style.fontSize = '12px';
  }
}

/* ── Helpers ────────────────────────────────────────────── */
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindSAEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));

  // stock search
  const input = document.getElementById('stockSearchInput');
  input?.addEventListener('keydown', e => { if (e.key==='Enter') selectStock(input.value); });
  // quick chips
  document.querySelectorAll('[data-stock]').forEach(c =>
    c.addEventListener('click', ()=>{ selectStock(c.dataset.stock); if(input) input.value=''; }));

  // timeframe buttons → redraw candlestick
  document.querySelectorAll('#saTimeframes [data-tf]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#saTimeframes [data-tf]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      SA.timeframe = btn.dataset.tf;
      drawChart();
    }));

  // redraw on resize (debounced)
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawChart, 200); });

  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();} });
}
