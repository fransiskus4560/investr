/* ═══════════════════════════════════════════════════════════
   INVESTR — Akun & Sekuritas v1.0
   Saham & Crypto terpisah. Fee default (editable). 
   PRINSIP: fee disnapshot ke transaksi saat dibuat (di modul transaksi),
   bukan dirujuk dari sini. Setting di sini = default transaksi BERIKUTNYA.
═══════════════════════════════════════════════════════════ */

'use strict';

const AC = {
  theme: localStorage.getItem('investr-theme') || 'dark',
  tab:   'saham',   // saham | crypto
  editId: null,
};

/* ── Popular apps with DEFAULT fees ─────────────────────────
   PENTING: angka fee ini adalah ESTIMASI titik awal dari
   pengetahuan umum, WAJIB diverifikasi user dgn app aslinya.
   Disimpan sebagai default; user bisa edit kapan saja.
─────────────────────────────────────────────────────────── */
const POPULAR_APPS = {
  saham: [
    { id:'stockbit', name:'Stockbit Sekuritas', color:'#1a9c5b', logo:'SB', feeType:'pct', feeBuy:0.10, feeSell:0.20, feeMin:0 },
    { id:'ajaib',    name:'Ajaib Sekuritas',    color:'#6c5ce7', logo:'AJ', feeType:'pct', feeBuy:0.15, feeSell:0.25, feeMin:0 },
    { id:'ipot',     name:'IPOT (Indo Premier)',color:'#e63946', logo:'IP', feeType:'pct', feeBuy:0.19, feeSell:0.29, feeMin:0 },
    { id:'bibit',    name:'Bibit (Stockbit)',   color:'#00b894', logo:'BB', feeType:'pct', feeBuy:0.10, feeSell:0.20, feeMin:0 },
    { id:'mirae',    name:'Mirae (MOST)',       color:'#0984e3', logo:'MR', feeType:'pct', feeBuy:0.15, feeSell:0.25, feeMin:0 },
    { id:'bions',    name:'BNI Bions',          color:'#e17055', logo:'BN', feeType:'pct', feeBuy:0.17, feeSell:0.27, feeMin:0 },
    { id:'mnc',      name:'MNC Sekuritas',      color:'#fdcb6e', logo:'MN', feeType:'pct', feeBuy:0.18, feeSell:0.28, feeMin:0 },
  ],
  crypto: [
    { id:'pintu',      name:'Pintu',        color:'#0a84ff', logo:'PT', feeType:'pct', feeBuy:0.10, feeSell:0.10, feeMin:0 },
    { id:'tokocrypto', name:'Tokocrypto',   color:'#00c2ff', logo:'TC', feeType:'pct', feeBuy:0.10, feeSell:0.10, feeMin:0 },
    { id:'indodax',    name:'Indodax',      color:'#1e3a8a', logo:'ID', feeType:'pct', feeBuy:0.10, feeSell:0.20, feeMin:0 },
    { id:'binance',    name:'Binance',      color:'#f0b90b', logo:'BN', feeType:'pct', feeBuy:0.10, feeSell:0.10, feeMin:0 },
    { id:'reku',       name:'Reku',         color:'#6c5ce7', logo:'RK', feeType:'pct', feeBuy:0.19, feeSell:0.19, feeMin:0 },
    { id:'bitget',     name:'Bitget',       color:'#00f0ff', logo:'BG', feeType:'pct', feeBuy:0.10, feeSell:0.10, feeMin:0 },
  ],
};

/* ── Default user accounts (sample for v1) ──────────────── */
const DEFAULT_ACCOUNTS = {
  saham: [
    { id:'a1', appId:'stockbit', name:'Stockbit Sekuritas', color:'#1a9c5b', logo:'SB', feeType:'pct', feeBuy:0.10, feeSell:0.20, feeMin:0, holdings:5, value:'Rp 52,4 jt' },
    { id:'a2', appId:'ajaib',    name:'Ajaib Sekuritas',    color:'#6c5ce7', logo:'AJ', feeType:'pct', feeBuy:0.15, feeSell:0.25, feeMin:0, holdings:3, value:'Rp 21,8 jt' },
  ],
  crypto: [
    { id:'c1', appId:'pintu', name:'Pintu', color:'#0a84ff', logo:'PT', feeType:'pct', feeBuy:0.10, feeSell:0.10, feeMin:0, holdings:3, value:'$ 8.340' },
  ],
};

function getAccounts(tab) {
  const key = 'investr-accounts-' + tab;
  const saved = localStorage.getItem(key);
  if (saved) { try { return JSON.parse(saved); } catch(e){} }
  return [...DEFAULT_ACCOUNTS[tab]];
}
function saveAccounts(tab, list) {
  localStorage.setItem('investr-accounts-' + tab, JSON.stringify(list));
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(AC.theme);
  bindACEvents();
  renderAccounts();
});

function applyTheme(theme) {
  AC.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(AC.theme==='dark'?'light':'dark'); }

function switchTab(tab) {
  AC.tab = tab;
  document.querySelectorAll('.acc-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  renderAccounts();
}

/* ── Render ─────────────────────────────────────────────── */
function renderAccounts() {
  const list = getAccounts(AC.tab);
  const grid = document.getElementById('accGrid');
  if (!grid) return;

  const cards = list.map(a => {
    const feeText = a.feeType === 'pct'
      ? { buy: a.feeBuy.toLocaleString('id-ID',{minimumFractionDigits:2}) + '%',
          sell: a.feeSell.toLocaleString('id-ID',{minimumFractionDigits:2}) + '%' }
      : { buy: 'Rp ' + a.feeBuy.toLocaleString('id-ID'),
          sell: 'Rp ' + a.feeSell.toLocaleString('id-ID') };
    return `<div class="acc-card">
      <div class="acc-actions">
        <button class="acc-icon-btn" onclick="editAccount('${a.id}')" aria-label="Edit"><i class="ti ti-pencil" aria-hidden="true"></i></button>
        <button class="acc-icon-btn danger" onclick="deleteAccount('${a.id}')" aria-label="Hapus"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>
      <div class="acc-card-head">
        <div class="acc-logo" style="background:${a.color}">${a.logo}</div>
        <div>
          <div class="acc-name">${a.name}</div>
          <div class="acc-type">${AC.tab === 'saham' ? 'Sekuritas Saham' : 'Exchange Crypto'}</div>
        </div>
      </div>
      <div class="acc-fees">
        <div class="acc-fee-row"><span class="acc-fee-label">Fee beli</span><span class="acc-fee-value">${feeText.buy}</span></div>
        <div class="acc-fee-row"><span class="acc-fee-label">Fee jual</span><span class="acc-fee-value">${feeText.sell}</span></div>
        ${a.feeMin>0 ? `<div class="acc-fee-row"><span class="acc-fee-label">Min. fee</span><span class="acc-fee-value">Rp ${a.feeMin.toLocaleString('id-ID')}</span></div>` : ''}
      </div>
      <div class="acc-stats">
        <div class="acc-stat"><div class="acc-stat-value">${a.holdings||0}</div><div class="acc-stat-label">Aset</div></div>
        <div class="acc-stat"><div class="acc-stat-value">${a.value||'—'}</div><div class="acc-stat-label">Nilai</div></div>
      </div>
      <div class="acc-verify-badge"><i class="ti ti-alert-circle" aria-hidden="true"></i>Cek & sesuaikan fee terbaru</div>
    </div>`;
  }).join('');

  const addCard = `<button class="acc-add-card" onclick="openAddAccount()">
    <i class="ti ti-plus" aria-hidden="true"></i>
    <span>Tambah ${AC.tab==='saham'?'Sekuritas':'Exchange'}</span>
  </button>`;

  grid.innerHTML = cards + addCard;
}

/* ── Add / Edit modal ───────────────────────────────────── */
function openAddAccount() {
  AC.editId = null;
  document.getElementById('accModalTitle').textContent =
    'Tambah ' + (AC.tab==='saham' ? 'Sekuritas Saham' : 'Exchange Crypto');
  // reset form
  document.getElementById('accNameInput').value = '';
  document.getElementById('accFeeBuy').value = '';
  document.getElementById('accFeeSell').value = '';
  document.getElementById('accFeeMin').value = '0';
  setFeeType('pct');
  buildAppPicker();
  document.getElementById('accModal').classList.add('open');
}

function editAccount(id) {
  const list = getAccounts(AC.tab);
  const a = list.find(x => x.id === id);
  if (!a) return;
  AC.editId = id;
  document.getElementById('accModalTitle').textContent = 'Edit ' + a.name;
  document.getElementById('accNameInput').value = a.name;
  document.getElementById('accFeeBuy').value = a.feeBuy;
  document.getElementById('accFeeSell').value = a.feeSell;
  document.getElementById('accFeeMin').value = a.feeMin || 0;
  setFeeType(a.feeType);
  document.getElementById('appPicker').innerHTML =
    '<p style="font-size:11px;color:var(--text-muted)">Mengedit akun yang sudah ada</p>';
  document.getElementById('accModal').classList.add('open');
}

function closeAccModal() {
  document.getElementById('accModal').classList.remove('open');
}

function buildAppPicker() {
  const el = document.getElementById('appPicker');
  if (!el) return;
  const apps = POPULAR_APPS[AC.tab];
  el.innerHTML = apps.map(app =>
    `<button class="app-chip" onclick="pickApp('${app.id}')">
      <span class="app-mini-logo" style="background:${app.color}">${app.logo}</span>
      ${app.name}
    </button>`
  ).join('') + `<button class="app-chip" onclick="pickApp('other')">
      <span class="app-mini-logo" style="background:#64748b"><i class="ti ti-plus" style="font-size:11px" aria-hidden="true"></i></span>
      Lainnya
    </button>`;
}

function pickApp(appId) {
  document.querySelectorAll('.app-chip').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  if (appId === 'other') {
    document.getElementById('accNameInput').value = '';
    document.getElementById('accFeeBuy').value = '';
    document.getElementById('accFeeSell').value = '';
    document.getElementById('accFeeMin').value = '0';
    setFeeType('pct');
    document.getElementById('accNameInput').focus();
    AC.pickedApp = 'other';
    return;
  }
  const app = POPULAR_APPS[AC.tab].find(a => a.id === appId);
  if (!app) return;
  AC.pickedApp = appId;
  document.getElementById('accNameInput').value = app.name;
  document.getElementById('accFeeBuy').value = app.feeBuy;
  document.getElementById('accFeeSell').value = app.feeSell;
  document.getElementById('accFeeMin').value = app.feeMin || 0;
  setFeeType(app.feeType);
}

function setFeeType(type) {
  AC.feeType = type;
  document.querySelectorAll('.fee-type-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.feetype === type));
  // update unit hints
  const isPct = type === 'pct';
  document.getElementById('feeBuyUnit').textContent = isPct ? '%' : 'Rp';
  document.getElementById('feeSellUnit').textContent = isPct ? '%' : 'Rp';
}

function saveAccount() {
  const name = document.getElementById('accNameInput').value.trim();
  if (!name) { document.getElementById('accNameInput').focus(); return; }
  const feeBuy = parseFloat(document.getElementById('accFeeBuy').value) || 0;
  const feeSell= parseFloat(document.getElementById('accFeeSell').value) || 0;
  const feeMin = parseFloat(document.getElementById('accFeeMin').value) || 0;

  const list = getAccounts(AC.tab);
  if (AC.editId) {
    const a = list.find(x => x.id === AC.editId);
    if (a) { a.name=name; a.feeType=AC.feeType; a.feeBuy=feeBuy; a.feeSell=feeSell; a.feeMin=feeMin; }
  } else {
    const picked = POPULAR_APPS[AC.tab].find(a => a.id === AC.pickedApp);
    list.push({
      id: 'acc_' + Date.now(),
      appId: AC.pickedApp || 'other',
      name,
      color: picked ? picked.color : '#64748b',
      logo: picked ? picked.logo : name.substring(0,2).toUpperCase(),
      feeType: AC.feeType, feeBuy, feeSell, feeMin,
      holdings: 0, value: '—',
    });
  }
  saveAccounts(AC.tab, list);
  closeAccModal();
  renderAccounts();
}

function deleteAccount(id) {
  if (!confirm('Hapus akun ini? Riwayat transaksi terkait tidak ikut terhapus (tetap tersimpan).')) return;
  const list = getAccounts(AC.tab).filter(a => a.id !== id);
  saveAccounts(AC.tab, list);
  renderAccounts();
}

/* ── Drawer / settings ──────────────────────────────────── */
function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindACEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));

  document.querySelectorAll('.acc-tab').forEach(b =>
    b.addEventListener('click', ()=>switchTab(b.dataset.tab)));

  document.querySelectorAll('.fee-type-btn').forEach(b =>
    b.addEventListener('click', ()=>setFeeType(b.dataset.feetype)));

  document.getElementById('accModalClose')?.addEventListener('click', closeAccModal);
  document.getElementById('accModalCancel')?.addEventListener('click', closeAccModal);
  document.getElementById('accModalSave')?.addEventListener('click', saveAccount);
  document.getElementById('accModal')?.addEventListener('click', e=>{ if(e.target.id==='accModal') closeAccModal(); });

  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();closeAccModal();} });
}
