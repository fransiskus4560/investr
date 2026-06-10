/* ═══════════════════════════════════════════════════════════
   INVESTR — Portfolio Tracker v1.0
   Holdings, P&L, allocation donut, position sizing calculator
═══════════════════════════════════════════════════════════ */

'use strict';

const PF = {
  theme:  localStorage.getItem('investr-theme')  || 'dark',
  market: localStorage.getItem('investr-market') || 'IDX',
};

/* ── Holdings per market (avg buy price, lots, current price) ── */
/* lot: IDX=100 shares/lot. US/ASX/Crypto: treat "lots" as units    */
const HOLDINGS = {
  IDX: {
    cur: 'Rp', unit: 'lot', sharesPerLot: 100,
    items: [
      { ticker:'BBCA', name:'Bank BCA',     buy:8200, now:9700, lots:20 },
      { ticker:'BBRI', name:'Bank BRI',     buy:4350, now:5125, lots:60 },
      { ticker:'TLKM', name:'Telkom',       buy:3450, now:3220, lots:40 },
      { ticker:'PGAS', name:'Perush. Gas',  buy:1480, now:1665, lots:80 },
      { ticker:'ASII', name:'Astra Intl',   buy:5400, now:5175, lots:25 },
    ],
  },
  US: {
    cur: '$', unit: 'shares', sharesPerLot: 1,
    items: [
      { ticker:'AAPL', name:'Apple',      buy:172.50, now:196.45, lots:12 },
      { ticker:'MSFT', name:'Microsoft',  buy:385.00, now:420.12, lots:6  },
      { ticker:'NVDA', name:'Nvidia',     buy:620.00, now:875.30, lots:4  },
      { ticker:'GOOGL',name:'Alphabet',   buy:182.00, now:178.60, lots:8  },
    ],
  },
  ASX: {
    cur: 'A$', unit: 'shares', sharesPerLot: 1,
    items: [
      { ticker:'CBA', name:'Commonwealth', buy:115.00, now:128.40, lots:30 },
      { ticker:'BHP', name:'BHP Group',    buy:41.20,  now:44.82,  lots:120 },
      { ticker:'RIO', name:'Rio Tinto',    buy:121.00, now:128.90, lots:25 },
    ],
  },
  Crypto: {
    cur: '$', unit: 'units', sharesPerLot: 1,
    items: [
      { ticker:'BTC', name:'Bitcoin',  buy:52000, now:67420, lots:0.08 },
      { ticker:'ETH', name:'Ethereum', buy:2900,  now:3520,  lots:1.2  },
      { ticker:'SOL', name:'Solana',   buy:145,   now:172,   lots:8    },
    ],
  },
};

/* sector tags for allocation (simple mapping) */
const SECTOR = {
  BBCA:'Perbankan', BBRI:'Perbankan', BMRI:'Perbankan',
  TLKM:'Telko', PGAS:'Energi', ASII:'Otomotif',
  AAPL:'Technology', MSFT:'Technology', NVDA:'Technology', GOOGL:'Technology',
  CBA:'Banking', BHP:'Resources', RIO:'Resources',
  BTC:'Crypto', ETH:'Crypto', SOL:'Crypto',
};
const SECTOR_COLOR = {
  'Perbankan':'#3b82f6','Telko':'#10b981','Energi':'#f59e0b','Otomotif':'#8b5cf6',
  'Technology':'#3b82f6','Banking':'#3b82f6','Resources':'#f59e0b',
  'Crypto':'#f59e0b','Lainnya':'#64748b',
};

/* ── Number helpers ─────────────────────────────────────── */
function fmt(cur, n) {
  if (Math.abs(n) >= 1e9) return cur + ' ' + (n/1e9).toFixed(1).replace('.',',') + ' M';
  if (Math.abs(n) >= 1e6) return cur + ' ' + (n/1e6).toFixed(1).replace('.',',') + ' jt';
  if (Math.abs(n) >= 1e3) return cur + ' ' + Math.round(n).toLocaleString('id-ID');
  return cur + ' ' + n.toLocaleString('id-ID', {maximumFractionDigits:2});
}
function fmtFull(cur, n) {
  return cur + ' ' + Math.round(n).toLocaleString('id-ID');
}
function pct(n) { return (n>=0?'+':'') + n.toFixed(1).replace('.',',') + '%'; }

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(PF.theme);
  setActiveMarketPF(PF.market);
  bindPFEvents();
  initSizing();
});

function applyTheme(theme) {
  PF.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(PF.theme==='dark'?'light':'dark'); }

function setActiveMarketPF(market) {
  PF.market = market;
  localStorage.setItem('investr-market', market);
  document.querySelectorAll('.market-pill').forEach(b => b.classList.toggle('active', b.dataset.market===market));
  renderPortfolio();
}

/* ── Render ─────────────────────────────────────────────── */
function renderPortfolio() {
  const data = HOLDINGS[PF.market];
  const cur = data.cur;

  // compute each holding
  const rows = data.items.map(h => {
    const shares = h.lots * data.sharesPerLot;
    const costVal = h.buy * shares;
    const nowVal  = h.now * shares;
    const pnl     = nowVal - costVal;
    const pnlPct  = costVal ? (pnl / costVal * 100) : 0;
    return { ...h, shares, costVal, nowVal, pnl, pnlPct };
  });

  const totalCost = rows.reduce((s,r)=>s+r.costVal,0);
  const totalNow  = rows.reduce((s,r)=>s+r.nowVal,0);
  const totalPnl  = totalNow - totalCost;
  const totalPct  = totalCost ? (totalPnl/totalCost*100) : 0;

  // weights
  rows.forEach(r => r.weight = totalNow ? (r.nowVal/totalNow*100) : 0);

  // summary cards
  setText('sumTotalValue', fmt(cur, totalNow));
  setText('sumTotalCost',  'Modal: ' + fmt(cur, totalCost));
  const pnlEl = document.getElementById('sumPnl');
  pnlEl.textContent = (totalPnl>=0?'+':'') + fmt(cur, Math.abs(totalPnl)).replace(cur, cur);
  pnlEl.className = 'porto-sum-value ' + (totalPnl>=0?'text-up':'text-down');
  const pnlPctEl = document.getElementById('sumPnlPct');
  pnlPctEl.textContent = pct(totalPct) + ' total return';
  pnlPctEl.className = 'porto-sum-sub ' + (totalPnl>=0?'text-up':'text-down');

  // best & worst
  const best = [...rows].sort((a,b)=>b.pnlPct-a.pnlPct)[0];
  const worst= [...rows].sort((a,b)=>a.pnlPct-b.pnlPct)[0];
  setText('sumBest', best.ticker);
  const bestSub = document.getElementById('sumBestPct');
  bestSub.textContent = pct(best.pnlPct); bestSub.className='porto-sum-sub '+(best.pnlPct>=0?'text-up':'text-down');
  setText('sumWorst', worst.ticker);
  const worstSub = document.getElementById('sumWorstPct');
  worstSub.textContent = pct(worst.pnlPct); worstSub.className='porto-sum-sub '+(worst.pnlPct>=0?'text-up':'text-down');

  // holdings table (desktop)
  renderHoldingsTable(rows, cur, data.unit, {totalCost,totalNow,totalPnl,totalPct});
  renderHoldingsMobile(rows, cur, data.unit);

  // allocation
  renderAllocation(rows, totalNow);
}

function renderHoldingsTable(rows, cur, unit, totals) {
  const tbody = document.getElementById('holdingsBody');
  if (!tbody) return;
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="left"><div class="porto-tkr">${r.ticker}</div><div class="porto-tkr-name">${r.name}</div></td>
      <td class="porto-num">${r.lots}</td>
      <td class="porto-num">${fmtFull(cur, r.buy)}</td>
      <td class="porto-num">${fmtFull(cur, r.now)}</td>
      <td class="porto-num">${fmt(cur, r.nowVal)}</td>
      <td class="porto-num ${r.pnl>=0?'text-up':'text-down'}">${(r.pnl>=0?'+':'')}${fmt(cur, Math.abs(r.pnl))}</td>
      <td class="porto-num ${r.pnl>=0?'text-up':'text-down'}">${pct(r.pnlPct)}</td>
      <td class="porto-num">${r.weight.toFixed(1).replace('.',',')}%</td>
    </tr>`).join('') + `
    <tr class="porto-total-row">
      <td class="left">TOTAL</td>
      <td></td><td></td><td></td>
      <td class="porto-num">${fmt(cur, totals.totalNow)}</td>
      <td class="porto-num ${totals.totalPnl>=0?'text-up':'text-down'}">${(totals.totalPnl>=0?'+':'')}${fmt(cur, Math.abs(totals.totalPnl))}</td>
      <td class="porto-num ${totals.totalPnl>=0?'text-up':'text-down'}">${pct(totals.totalPct)}</td>
      <td class="porto-num">100%</td>
    </tr>`;
}

function renderHoldingsMobile(rows, cur, unit) {
  const el = document.getElementById('holdingsMobile');
  if (!el) return;
  el.innerHTML = rows.map(r => `
    <div class="porto-m-item">
      <div class="porto-m-top">
        <div class="porto-m-tkr">${r.ticker}<span>${r.lots} ${unit}</span></div>
        <div>
          <div class="porto-m-pnl ${r.pnl>=0?'text-up':'text-down'}">${(r.pnl>=0?'+':'')}${fmt(cur, Math.abs(r.pnl))}</div>
          <div class="porto-m-pnl-pct ${r.pnl>=0?'text-up':'text-down'}" style="text-align:right">${pct(r.pnlPct)}</div>
        </div>
      </div>
      <div class="porto-m-grid">
        <div class="porto-m-cell"><div class="porto-m-cell-label">Avg beli</div><div class="porto-m-cell-value">${fmtFull(cur, r.buy)}</div></div>
        <div class="porto-m-cell"><div class="porto-m-cell-label">Harga kini</div><div class="porto-m-cell-value">${fmtFull(cur, r.now)}</div></div>
        <div class="porto-m-cell"><div class="porto-m-cell-label">Nilai kini</div><div class="porto-m-cell-value">${fmt(cur, r.nowVal)}</div></div>
      </div>
      <div class="porto-m-weight">
        <div class="porto-m-cell-label">Bobot porto · ${r.weight.toFixed(1).replace('.',',')}%</div>
        <div class="porto-m-weight-track"><div class="porto-m-weight-fill" style="width:${r.weight}%"></div></div>
      </div>
    </div>`).join('');
}

function renderAllocation(rows, totalNow) {
  // group by sector
  const bySector = {};
  rows.forEach(r => {
    const sec = SECTOR[r.ticker] || 'Lainnya';
    bySector[sec] = (bySector[sec]||0) + r.nowVal;
  });
  const alloc = Object.entries(bySector)
    .map(([name,val]) => ({ name, pct: totalNow ? (val/totalNow*100) : 0, color: SECTOR_COLOR[name]||'#64748b' }))
    .sort((a,b)=>b.pct-a.pct);

  // donut
  const svg = document.getElementById('portoDonut');
  if (svg) {
    const r=34, cx=44, cy=44, circ=2*Math.PI*r;
    let offset=0;
    const slices = alloc.map(a => {
      const dash=(a.pct/100)*circ, gap=circ-dash;
      const s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${a.color}" stroke-width="13" stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset+=dash; return s;
    });
    svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="13"/>` + slices.join('');
  }
  const legend = document.getElementById('portoDonutLegend');
  if (legend) {
    legend.innerHTML = alloc.map(a => `
      <div class="porto-legend-row">
        <div class="porto-legend-dot" style="background:${a.color}"></div>
        <span class="porto-legend-name">${a.name}</span>
        <span class="porto-legend-pct">${a.pct.toFixed(1).replace('.',',')}%</span>
      </div>`).join('');
  }
}

/* ── Position Sizing Calculator ─────────────────────────── */
function initSizing() {
  ['szCapital','szPrice','szStopPct','szRiskPct'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calcSizing);
  });
  calcSizing();
}
function calcSizing() {
  const cap   = parseFloat(document.getElementById('szCapital')?.value) || 0;
  const price = parseFloat(document.getElementById('szPrice')?.value) || 0;
  const stopP = parseFloat(document.getElementById('szStopPct')?.value) || 0;
  const riskP = parseFloat(document.getElementById('szRiskPct')?.value) || 0;

  const riskRp = cap * (riskP/100);                 // max loss in currency
  const riskPerShare = price * (stopP/100);          // loss per share at stop
  const shares = riskPerShare>0 ? Math.floor(riskRp/riskPerShare) : 0;
  const capNeeded = shares * price;
  const capPct = cap>0 ? (capNeeded/cap*100) : 0;

  const cur = HOLDINGS[PF.market].cur;
  setText('szRiskRp',  fmtFull(cur, riskRp));
  setText('szShares',  shares.toLocaleString('id-ID') + ' lembar');
  setText('szCapNeeded', fmtFull(cur, capNeeded));
  setText('szCapPct', capPct.toFixed(1).replace('.',',') + '% dari modal');
}

/* ── Helpers ────────────────────────────────────────────── */
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindPFEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.market-pill').forEach(b=> b.addEventListener('click', ()=>setActiveMarketPF(b.dataset.market)));
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();} });
}
