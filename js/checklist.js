/* ═══════════════════════════════════════════════════════════
   INVESTR — Checklist Beli Saham v1.0
   Behavioral discipline tool. Weighted scoring → go/caution/stop.
   The "Behavioral Coach" role made concrete.
═══════════════════════════════════════════════════════════ */

'use strict';

const CHK = { theme: localStorage.getItem('investr-theme') || 'dark' };

/* checklist items grouped by category, each with weight */
const CHECKLIST = [
  { cat:'Fundamental', icon:'ti-building-bank', items:[
    { id:'f1', w:3, q:'Saya paham bagaimana bisnis ini menghasilkan uang', hint:'Kalau tidak bisa menjelaskan dalam 1 kalimat, jangan beli.' },
    { id:'f2', w:2, q:'Valuasi masih wajar atau murah (P/E, P/B tidak berlebihan)', hint:'Bisnis bagus dengan harga terlalu mahal = investasi buruk.' },
    { id:'f3', w:2, q:'Perusahaan punya keunggulan kompetitif (moat)', hint:'Apa yang mencegah pesaing merebut pasarnya?' },
    { id:'f4', w:2, q:'Neraca sehat — utang terkendali', hint:'Debt/Equity tidak berlebihan, arus kas positif.' },
  ]},
  { cat:'Strategi & Risiko', icon:'ti-shield-check', items:[
    { id:'r1', w:3, q:'Saya sudah tentukan ini untuk INVESTASI atau TRADING', hint:'Niat yang jelas mencegah "terpaksa jadi investor" saat rugi.' },
    { id:'r2', w:3, q:'Saya sudah tahu di harga berapa akan cut loss', hint:'Tentukan stop loss SEBELUM beli, bukan setelah rugi.' },
    { id:'r3', w:2, q:'Posisi ini tidak lebih dari 5-10% total portofolio', hint:'Diversifikasi melindungi dari kesalahan tunggal.' },
    { id:'r4', w:2, q:'Saya punya target jual / take profit yang realistis', hint:'Tahu kapan keluar sama pentingnya dengan kapan masuk.' },
  ]},
  { cat:'Psikologi (Anti-FOMO)', icon:'ti-brain', items:[
    { id:'p1', w:3, q:'Saya beli karena analisa, BUKAN karena takut ketinggalan', hint:'FOMO adalah musuh terbesar investor. Saham akan selalu ada.' },
    { id:'p2', w:2, q:'Saya tidak sedang membeli hanya karena harga naik terus', hint:'Mengejar harga yang sudah tinggi sering berakhir buruk.' },
    { id:'p3', w:2, q:'Uang ini bukan uang yang saya butuhkan dalam waktu dekat', hint:'Jangan investasikan dana darurat atau uang kebutuhan.' },
    { id:'p4', w:2, q:'Saya tenang dengan keputusan ini, tidak terburu-buru', hint:'Keputusan terburu-buru jarang jadi keputusan terbaik.' },
  ]},
];

const TOTAL_WEIGHT = CHECKLIST.reduce((s,c)=> s + c.items.reduce((a,i)=>a+i.w,0), 0);

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(CHK.theme);
  renderChecklist();
  bindChkEvents();
});

function applyTheme(theme) {
  CHK.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(CHK.theme==='dark'?'light':'dark'); }

function getChecked() {
  const saved = localStorage.getItem('investr-checklist');
  if (saved) { try { return JSON.parse(saved); } catch(e){} }
  return {};
}
function saveChecked(state) { localStorage.setItem('investr-checklist', JSON.stringify(state)); }

function renderChecklist() {
  const container = document.getElementById('chkSections');
  if (!container) return;
  const checked = getChecked();
  container.innerHTML = CHECKLIST.map(cat => `
    <div class="chk-section">
      <div class="chk-section-head"><i class="ti ${cat.icon}" aria-hidden="true"></i>${cat.cat}</div>
      ${cat.items.map(it => `
        <div class="chk-item ${checked[it.id]?'checked':''}" data-id="${it.id}">
          <div class="chk-checkbox"><i class="ti ti-check" aria-hidden="true"></i></div>
          <div class="chk-item-body">
            <div class="chk-item-q">${it.q}</div>
            <div class="chk-item-hint">${it.hint}</div>
          </div>
          <span class="chk-weight">bobot ${it.w}</span>
        </div>`).join('')}
    </div>`).join('');

  container.querySelectorAll('.chk-item').forEach(item =>
    item.addEventListener('click', () => toggleItem(item.dataset.id)));

  updateScore();
}

function toggleItem(id) {
  const checked = getChecked();
  checked[id] = !checked[id];
  saveChecked(checked);
  const el = document.querySelector(`.chk-item[data-id="${id}"]`);
  if (el) el.classList.toggle('checked', checked[id]);
  updateScore();
}

function updateScore() {
  const checked = getChecked();
  let score = 0;
  CHECKLIST.forEach(cat => cat.items.forEach(it => { if (checked[it.id]) score += it.w; }));
  const pct = Math.round(score / TOTAL_WEIGHT * 100);

  setText('chkScore', pct + '%');
  const scoreEl = document.getElementById('chkScore');
  setText('chkScoreLabel', score + ' dari ' + TOTAL_WEIGHT + ' poin bobot terpenuhi');

  const verdict = document.getElementById('chkVerdict');
  if (!verdict) return;
  if (pct >= 80) {
    verdict.textContent = '✓ Siap — pertimbangan matang';
    verdict.className = 'chk-verdict chk-verdict-go';
    if (scoreEl) scoreEl.style.color = 'var(--green)';
  } else if (pct >= 50) {
    verdict.textContent = '⚠ Hati-hati — masih ada yang perlu dipikirkan';
    verdict.className = 'chk-verdict chk-verdict-caution';
    if (scoreEl) scoreEl.style.color = 'var(--amber)';
  } else {
    verdict.textContent = '✕ Belum siap — tunda dulu keputusanmu';
    verdict.className = 'chk-verdict chk-verdict-stop';
    if (scoreEl) scoreEl.style.color = 'var(--red)';
  }
}

function resetChecklist() {
  if (confirm('Reset semua centang checklist?')) {
    localStorage.removeItem('investr-checklist');
    renderChecklist();
  }
}

function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindChkEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));
  document.getElementById('chkResetBtn')?.addEventListener('click', resetChecklist);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();} });
}
