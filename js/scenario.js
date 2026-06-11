/* ═══════════════════════════════════════════════════════════
   INVESTR — Skenario Investasi v1.0
   Bull / Base / Bear projection with probability weighting.
   Fully functional math — recalculates live.
═══════════════════════════════════════════════════════════ */

'use strict';

const SCN = { theme: localStorage.getItem('investr-theme') || 'dark' };

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(SCN.theme);
  bindScnEvents();
  calcScenario();
});

function applyTheme(theme) {
  SCN.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  Store.set('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(SCN.theme==='dark'?'light':'dark'); }

function calcScenario() {
  const price   = num('scnPrice');
  const eps     = num('scnEps');
  const years   = num('scnYears');
  const div     = num('scnDiv');

  // scenario assumptions (growth %, exit P/E)
  const scenarios = {
    bull: { growth:0.20, exitPE:25, prob:0.25, label:'Bullish', sub:'Optimis', icon:'ti-trending-up' },
    base: { growth:0.12, exitPE:18, prob:0.50, label:'Base',    sub:'Moderat', icon:'ti-arrow-right' },
    bear: { growth:-0.05,exitPE:10, prob:0.25, label:'Bearish', sub:'Pesimis', icon:'ti-trending-down' },
  };

  const results = {};
  let expectedValue = 0;

  for (const key in scenarios) {
    const s = scenarios[key];
    const futureEps = eps * Math.pow(1 + s.growth, years);
    const targetPrice = futureEps * s.exitPE;
    const totalDiv = div * years; // simplified cumulative dividend
    const totalReturn = (targetPrice + totalDiv - price) / price;
    const cagr = Math.pow((targetPrice + totalDiv) / price, 1/years) - 1;
    results[key] = { targetPrice, totalReturn, cagr, futureEps };
    expectedValue += s.prob * targetPrice;
  }

  // render cards
  renderScnCard('bull', scenarios.bull, results.bull);
  renderScnCard('base', scenarios.base, results.base);
  renderScnCard('bear', scenarios.bear, results.bear);

  // projection chart — year-by-year price path per scenario
  const labels = [];
  const bullPath = [], basePath = [], bearPath = [];
  for (let y = 0; y <= years; y++) {
    labels.push(y === 0 ? 'Kini' : ('Thn ' + y));
    bullPath.push(eps * Math.pow(1 + scenarios.bull.growth, y) * scenarios.bull.exitPE);
    basePath.push(eps * Math.pow(1 + scenarios.base.growth, y) * scenarios.base.exitPE);
    bearPath.push(eps * Math.pow(1 + scenarios.bear.growth, y) * scenarios.bear.exitPE);
  }
  // anchor all at current price at year 0
  bullPath[0] = basePath[0] = bearPath[0] = price;
  if (typeof renderMultiLine === 'function') {
    renderMultiLine('scnProjChart', [
      { values: bullPath, color: 'var(--green)', width: 2.5 },
      { values: basePath, color: 'var(--blue)',  width: 3 },
      { values: bearPath, color: 'var(--red)',   width: 2.5 },
    ], labels, { height: 200 });
  }

  // probability bar
  document.getElementById('probBull').style.width = (scenarios.bull.prob*100)+'%';
  document.getElementById('probBase').style.width = (scenarios.base.prob*100)+'%';
  document.getElementById('probBear').style.width = (scenarios.bear.prob*100)+'%';
  setText('probBull', Math.round(scenarios.bull.prob*100)+'%');
  setText('probBase', Math.round(scenarios.base.prob*100)+'%');
  setText('probBear', Math.round(scenarios.bear.prob*100)+'%');

  // expected value insight
  const evReturn = (expectedValue - price) / price * 100;
  const el = document.getElementById('scnInsight');
  if (el) {
    const cls = evReturn >= 0 ? 'text-up' : 'text-down';
    el.innerHTML = `<i class="ti ti-calculator" aria-hidden="true"></i>
      <div class="scn-insight-text">Dengan menimbang ketiga skenario sesuai probabilitasnya, <strong>nilai harapan (expected value)</strong> harga dalam ${years} tahun adalah <strong>${fmtRp(expectedValue)}</strong> — potensi return <strong class="${cls}">${evReturn>=0?'+':''}${evReturn.toFixed(0)}%</strong> dari harga sekarang. Ingat: ini proyeksi berbasis asumsi, bukan ramalan. Skenario bear penting untuk menguji ketahanan rencanamu.</div>`;
  }
}

function renderScnCard(key, scn, res) {
  setText(key+'Value', fmtRp(res.targetPrice));
  setText(key+'Cagr', 'CAGR ' + (res.cagr*100).toFixed(1).replace('.',',') + '%/thn');
  setText(key+'Return', (res.totalReturn>=0?'+':'') + (res.totalReturn*100).toFixed(0) + '%');
  setText(key+'Growth', (scn.growth*100).toFixed(0) + '%/thn');
  setText(key+'PE', scn.exitPE + 'x');
}

function fmtRp(n) {
  if (n >= 1e6) return 'Rp ' + (n/1e6).toFixed(1).replace('.',',') + ' jt';
  if (n >= 1e3) return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  return 'Rp ' + Math.round(n);
}
function num(id){ return parseFloat(document.getElementById(id)?.value) || 0; }
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindScnEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));
  ['scnPrice','scnEps','scnYears','scnDiv'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', calcScenario));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();} });
}
