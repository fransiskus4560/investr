/* ═══════════════════════════════════════════════════════════
   INVESTR — DRIP Simulator v1.0
   Compound interest + dividend reinvestment projection.
   Fully functional (real math) — recalculates live on input.
═══════════════════════════════════════════════════════════ */

'use strict';

const DRIP = {
  theme: localStorage.getItem('investr-theme') || 'dark',
  reinvest: true,
};

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(DRIP.theme);
  bindDripEvents();
  calculate();
});

function applyTheme(theme) {
  DRIP.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(DRIP.theme==='dark'?'light':'dark'); }

/* ── Core calculation ───────────────────────────────────── */
function calculate() {
  const initial   = num('dripInitial');
  const monthly   = num('dripMonthly');
  const years     = num('dripYears');
  const divYield  = num('dripYield') / 100;       // annual dividend yield
  const priceGrow = num('dripGrowth') / 100;      // annual price appreciation
  const divGrowth = num('dripDivGrowth') / 100;   // annual dividend growth
  const taxRate   = num('dripTax') / 100;
  const reinvest  = DRIP.reinvest;

  // update slider value labels
  setText('dripYearsVal', years + ' tahun');
  setText('dripYieldVal', (divYield*100).toFixed(1).replace('.',',') + '%');
  setText('dripGrowthVal', (priceGrow*100).toFixed(1).replace('.',',') + '%');

  // simulate year by year
  // DRIP scenario: dividends (after tax) reinvested + monthly DCA
  // No-DRIP scenario: dividends taken out (not reinvested), only price growth + DCA
  let dripValue   = initial;
  let noDripValue = initial;
  let totalContributed = initial;
  let totalDividends   = 0;     // cumulative dividends received (DRIP, after tax)
  let currentYield = divYield;

  const yearlyData = [{ year:0, drip:initial, noDrip:initial, contributed:initial, divThisYear:0 }];

  for (let y = 1; y <= years; y++) {
    const annualDCA = monthly * 12;

    // ── DRIP scenario ──
    // price appreciation on existing value
    dripValue = dripValue * (1 + priceGrow);
    // add this year's DCA
    dripValue += annualDCA;
    // dividends earned this year (after tax), reinvested
    const dripDiv = dripValue * currentYield * (1 - taxRate);
    if (reinvest) dripValue += dripDiv;
    totalDividends += dripDiv;

    // ── No-DRIP scenario ──
    noDripValue = noDripValue * (1 + priceGrow);
    noDripValue += annualDCA;
    // dividends taken out (not added to value)

    totalContributed += annualDCA;
    // dividend yield grows over time (companies raise dividends)
    currentYield = currentYield * (1 + divGrowth);

    yearlyData.push({
      year: y,
      drip: dripValue,
      noDrip: noDripValue,
      contributed: totalContributed,
      divThisYear: dripDiv,
    });
  }

  const finalDrip   = dripValue;
  const finalNoDrip = noDripValue;
  const dripAdvantage = finalDrip - finalNoDrip;
  const totalGain = finalDrip - totalContributed;
  const lastYearDiv = yearlyData[yearlyData.length-1].divThisYear;

  // ── Render hero ──
  setText('resultFinal', formatRp(finalDrip));
  setText('resultContributed', 'Modal disetor: ' + formatRp(totalContributed));
  setText('resultGain', '+' + formatRp(totalGain));
  const gainPct = totalContributed ? (totalGain/totalContributed*100) : 0;
  setText('resultGainPct', '+' + gainPct.toFixed(0) + '% dari modal');
  setText('resultDivIncome', formatRp(lastYearDiv));
  setText('resultDivSub', 'di tahun ke-' + years + ' (≈ ' + formatRp(lastYearDiv/12) + '/bln)');

  // ── Render comparison chart (sample years) ──
  renderChart(yearlyData, years);

  // ── Render insight ──
  renderInsight(dripAdvantage, finalDrip, finalNoDrip, years, reinvest);

  // ── Render milestones ──
  renderMilestones(yearlyData, years);
}

function renderChart(data, years) {
  const chart = document.getElementById('dripChart');
  if (!chart) return;
  // build full yearly series (every year for a smooth line)
  const dripSeries = [], noDripSeries = [], labels = [];
  const labelStep = Math.max(1, Math.round(years / 6));
  for (let y = 0; y <= years; y++) {
    if (!data[y]) continue;
    dripSeries.push(data[y].drip);
    noDripSeries.push(data[y].noDrip);
    labels.push((y % labelStep === 0 || y === years) ? ('Thn ' + y) : '');
  }
  if (typeof renderComparisonLine === 'function') {
    renderComparisonLine('dripChart', dripSeries, noDripSeries, labels, {
      height: 190,
      colorA: 'var(--green)',
      colorB: 'var(--text-muted)',
    });
  }
}

function renderInsight(advantage, finalDrip, finalNoDrip, years, reinvest) {
  const el = document.getElementById('dripInsight');
  if (!el) return;
  if (!reinvest) {
    el.innerHTML = `<i class="ti ti-info-circle" aria-hidden="true"></i>
      <div class="drip-insight-text">Reinvest dividen <strong>dimatikan</strong>. Dividen diterima sebagai kas, tidak diputar kembali. Aktifkan reinvest untuk melihat kekuatan bunga berbunga.</div>`;
    el.style.borderColor = 'var(--border)';
    el.style.background = 'var(--bg-elevated)';
    return;
  }
  const pct = finalNoDrip ? (advantage/finalNoDrip*100) : 0;
  el.style.borderColor = 'var(--green)';
  el.style.background = 'var(--green-dim)';
  el.innerHTML = `<i class="ti ti-bulb" aria-hidden="true"></i>
    <div class="drip-insight-text">Dengan reinvestasi dividen selama <strong>${years} tahun</strong>, portofoliomu jadi <strong>${formatRp(advantage)} lebih besar</strong> (+${pct.toFixed(0)}%) dibanding kalau dividen hanya diambil. Inilah kekuatan bunga berbunga — uang yang bekerja menghasilkan uang lagi.</div>`;
}

function renderMilestones(data, years) {
  const tbody = document.getElementById('milestoneBody');
  if (!tbody) return;
  const picks = [];
  [1,3,5,10,15,20,25,30].forEach(y => { if (y <= years && data[y]) picks.push(data[y]); });
  if (picks[picks.length-1]?.year !== years && data[years]) picks.push(data[years]);

  tbody.innerHTML = picks.map(p => {
    const gain = p.drip - p.contributed;
    return `<tr>
      <td class="left">Tahun ${p.year}</td>
      <td>${formatRp(p.contributed)}</td>
      <td style="color:var(--green)">${formatRp(p.drip)}</td>
      <td class="${gain>=0?'text-up':'text-down'}">+${formatRp(gain)}</td>
      <td>${formatRp(p.divThisYear)}</td>
    </tr>`;
  }).join('');
}

/* ── Formatting ─────────────────────────────────────────── */
function formatRp(n) {
  if (n >= 1e9)  return 'Rp ' + (n/1e9).toFixed(2).replace('.',',') + ' M';
  if (n >= 1e6)  return 'Rp ' + (n/1e6).toFixed(1).replace('.',',') + ' jt';
  if (n >= 1e3)  return 'Rp ' + Math.round(n/1e3) + 'rb';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}
function num(id) { return parseFloat(document.getElementById(id)?.value) || 0; }
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

/* ── Events ─────────────────────────────────────────────── */
function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindDripEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));

  // recalc on any input
  ['dripInitial','dripMonthly','dripYears','dripYield','dripGrowth','dripDivGrowth','dripTax']
    .forEach(id => document.getElementById(id)?.addEventListener('input', calculate));

  // reinvest toggle
  document.getElementById('reinvestToggle')?.addEventListener('change', e => {
    DRIP.reinvest = e.target.checked;
    calculate();
  });

  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();} });
}
