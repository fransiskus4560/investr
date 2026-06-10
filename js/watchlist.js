/* ═══════════════════════════════════════════════════════════
   INVESTR — Watchlist v1.0
   Custom order (drag), add/remove, sort, localStorage persist
═══════════════════════════════════════════════════════════ */

'use strict';

const WL = {
  theme:  localStorage.getItem('investr-theme')  || 'dark',
  market: localStorage.getItem('investr-market') || 'IDX',
  sortMode: 'custom',
  dragIndex: null,
};

/* ── Default watchlists per market (user can customize) ─── */
const DEFAULT_WATCHLIST = {
  IDX: [
    { ticker:'BBCA', name:'Bank Central Asia',     price:'9.700', chg:'-0,51%', up:false, pe:'23,5x', yield:'1,8%', status:'hold'   },
    { ticker:'BBRI', name:'Bank Rakyat Indonesia', price:'5.125', chg:'+1,24%', up:true,  pe:'12,3x', yield:'3,8%', status:'buy'    },
    { ticker:'TLKM', name:'Telkom Indonesia',      price:'3.220', chg:'+0,62%', up:true,  pe:'14,1x', yield:'4,5%', status:'buy'    },
    { ticker:'ASII', name:'Astra International',   price:'5.175', chg:'-0,48%', up:false, pe:'10,2x', yield:'3,0%', status:'hold'   },
    { ticker:'PGAS', name:'Perusahaan Gas Negara', price:'1.665', chg:'+0,91%', up:true,  pe:'8,5x',  yield:'5,2%', status:'strong' },
    { ticker:'BMRI', name:'Bank Mandiri',          price:'6.450', chg:'+0,39%', up:true,  pe:'11,8x', yield:'4,1%', status:'buy'    },
    { ticker:'UNVR', name:'Unilever Indonesia',    price:'2.080', chg:'-1,42%', up:false, pe:'18,7x', yield:'5,5%', status:'reduce' },
    { ticker:'ICBP', name:'Indofood CBP',          price:'11.200',chg:'+0,22%', up:true,  pe:'15,3x', yield:'2,4%', status:'hold'   },
    { ticker:'KLBF', name:'Kalbe Farma',           price:'1.520', chg:'+0,66%', up:true,  pe:'16,2x', yield:'2,5%', status:'buy'    },
    { ticker:'GOTO', name:'GoTo Gojek Tokopedia',  price:'56',    chg:'-3,44%', up:false, pe:'—',     yield:'0%',   status:'reduce' },
  ],
  US: [
    { ticker:'AAPL',  name:'Apple Inc.',        price:'$196,45', chg:'+0,82%', up:true,  pe:'31x',  yield:'0,5%', status:'hold'   },
    { ticker:'MSFT',  name:'Microsoft',         price:'$420,12', chg:'+1,14%', up:true,  pe:'35x',  yield:'0,7%', status:'buy'    },
    { ticker:'NVDA',  name:'Nvidia',            price:'$875,30', chg:'+2,31%', up:true,  pe:'68x',  yield:'0,0%', status:'strong' },
    { ticker:'GOOGL', name:'Alphabet',          price:'$178,60', chg:'-0,22%', up:false, pe:'24x',  yield:'0,5%', status:'hold'   },
    { ticker:'META',  name:'Meta Platforms',    price:'$493,20', chg:'+0,75%', up:true,  pe:'27x',  yield:'0,4%', status:'buy'    },
    { ticker:'AMZN',  name:'Amazon',            price:'$185,40', chg:'+0,55%', up:true,  pe:'42x',  yield:'0,0%', status:'hold'   },
    { ticker:'TSLA',  name:'Tesla',             price:'$174,80', chg:'-1,43%', up:false, pe:'45x',  yield:'0,0%', status:'watch'  },
    { ticker:'JPM',   name:'JPMorgan Chase',    price:'$198,20', chg:'+0,33%', up:true,  pe:'11x',  yield:'2,4%', status:'buy'    },
  ],
  ASX: [
    { ticker:'CBA', name:'Commonwealth Bank',  price:'A$128,40', chg:'+0,55%', up:true,  pe:'19x',  yield:'4,9%', status:'hold'   },
    { ticker:'BHP', name:'BHP Group',          price:'A$44,82',  chg:'+1,20%', up:true,  pe:'12x',  yield:'5,3%', status:'buy'    },
    { ticker:'CSL', name:'CSL Limited',        price:'A$298,60', chg:'-0,30%', up:false, pe:'31x',  yield:'1,3%', status:'hold'   },
    { ticker:'WES', name:'Wesfarmers',         price:'A$72,15',  chg:'+0,42%', up:true,  pe:'22x',  yield:'3,5%', status:'buy'    },
    { ticker:'RIO', name:'Rio Tinto',          price:'A$128,90', chg:'+0,88%', up:true,  pe:'10x',  yield:'6,1%', status:'strong' },
    { ticker:'NAB', name:'National Aust Bank', price:'A$37,20',  chg:'-0,16%', up:false, pe:'13x',  yield:'4,6%', status:'hold'   },
    { ticker:'WBC', name:'Westpac Banking',    price:'A$28,90',  chg:'+0,24%', up:true,  pe:'14x',  yield:'4,8%', status:'hold'   },
  ],
  Crypto: [
    { ticker:'BTC',  name:'Bitcoin',   price:'$67.420', chg:'+1,87%', up:true,  pe:'—', yield:'0%',   status:'hold'   },
    { ticker:'ETH',  name:'Ethereum',  price:'$3.520',  chg:'+2,14%', up:true,  pe:'—', yield:'4,2%', status:'buy'    },
    { ticker:'BNB',  name:'BNB Chain', price:'$598',    chg:'+0,92%', up:true,  pe:'—', yield:'2,1%', status:'hold'   },
    { ticker:'SOL',  name:'Solana',    price:'$172',    chg:'+3,45%', up:true,  pe:'—', yield:'6,8%', status:'buy'    },
    { ticker:'XRP',  name:'Ripple',    price:'$0,52',   chg:'-0,88%', up:false, pe:'—', yield:'0%',   status:'watch'  },
    { ticker:'ADA',  name:'Cardano',   price:'$0,44',   chg:'+1,10%', up:true,  pe:'—', yield:'3,2%', status:'hold'   },
    { ticker:'DOGE', name:'Dogecoin',  price:'$0,14',   chg:'+1,22%', up:true,  pe:'—', yield:'0%',   status:'reduce' },
  ],
};

/* suggestions for "add stock" per market */
const SUGGEST = {
  IDX:    ['ANTM','INDF','EXCL','ADRO','MDKA','SMGR','CPIN','INKP'],
  US:     ['AMD','NFLX','DIS','BA','KO','PEP','V','MA'],
  ASX:    ['FMG','WOW','TLS','ANZ','MQG','GMG','TCL','STO'],
  Crypto: ['AVAX','DOT','MATIC','LINK','UNI','ATOM','LTC','NEAR'],
};

const STATUS_MAP = {
  strong: { cls:'badge-strong', label:'Strong Buy' },
  buy:    { cls:'badge-buy',    label:'Buy'        },
  hold:   { cls:'badge-hold',   label:'Hold'       },
  reduce: { cls:'badge-reduce', label:'Reduce'     },
  sell:   { cls:'badge-sell',   label:'Sell'       },
  watch:  { cls:'badge-watch',  label:'Watch'      },
};

/* ── Get current working list (from storage or default) ── */
function getList() {
  const key = 'investr-wl-' + WL.market;
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return [...DEFAULT_WATCHLIST[WL.market]];
}
function saveList(list) {
  localStorage.setItem('investr-wl-' + WL.market, JSON.stringify(list));
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(WL.theme);
  setActiveMarketWL(WL.market);
  bindWLEvents();
});

function applyTheme(theme) {
  WL.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const i = document.getElementById('themeIcon');
  if (i) i.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon');
  if (di) di.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const dt = document.getElementById('drawerThemeText');
  if (dt) dt.textContent = theme === 'dark' ? 'Mode terang' : 'Mode gelap';
}
function toggleTheme() { applyTheme(WL.theme === 'dark' ? 'light' : 'dark'); }

function setActiveMarketWL(market) {
  WL.market = market;
  localStorage.setItem('investr-market', market);
  document.querySelectorAll('.market-pill').forEach(b =>
    b.classList.toggle('active', b.dataset.market === market));
  renderWatchlist();
}

/* ── Render ─────────────────────────────────────────────── */
function renderWatchlist() {
  let list = getList();

  // apply sort
  if (WL.sortMode !== 'custom') list = sortList(list, WL.sortMode);

  setText('wlCount', list.length);

  renderDesktopTable(list);
  renderMobileList(list);
}

function sortList(list, mode) {
  const copy = [...list];
  const num = s => parseFloat(String(s).replace(/[^0-9,-]/g,'').replace(',','.')) || 0;
  switch(mode) {
    case 'gainers': copy.sort((a,b) => num(b.chg) - num(a.chg)); break;
    case 'losers':  copy.sort((a,b) => num(a.chg) - num(b.chg)); break;
    case 'name':    copy.sort((a,b) => a.ticker.localeCompare(b.ticker)); break;
    case 'yield':   copy.sort((a,b) => num(b.yield) - num(a.yield)); break;
  }
  return copy;
}

function renderDesktopTable(list) {
  const tbody = document.getElementById('wlTableBody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = emptyRow(8); return; }
  const draggable = WL.sortMode === 'custom';
  tbody.innerHTML = list.map((s, i) => {
    const st = STATUS_MAP[s.status] || STATUS_MAP.watch;
    return `<tr data-index="${i}" ${draggable ? 'draggable="true"' : ''} onclick="goAnalyze('${s.ticker}')">
      <td class="wl-cell-center"><div class="wl-num">${i+1}</div></td>
      <td>${draggable ? '<div class="wl-drag-handle" title="Geser untuk urutkan"><i class="ti ti-grip-vertical" aria-hidden="true"></i></div>' : ''}</td>
      <td>
        <div class="wl-cell-ticker">${s.ticker}</div>
        <div class="wl-cell-name">${s.name}</div>
      </td>
      <td class="wl-cell-num">${s.price}</td>
      <td class="wl-cell-num ${s.up ? 'text-up' : 'text-down'}">${s.chg}</td>
      <td class="wl-cell-num"><span class="wl-pe">${s.pe}</span></td>
      <td class="wl-cell-num"><span class="wl-yield">${s.yield}</span></td>
      <td class="wl-cell-center"><span class="status-badge ${st.cls}">${st.label}</span></td>
      <td class="wl-cell-center"><button class="wl-remove-btn" onclick="event.stopPropagation();removeStock(${i})" aria-label="Hapus ${s.ticker}"><i class="ti ti-trash" aria-hidden="true"></i></button></td>
    </tr>`;
  }).join('');
  if (draggable) attachDragHandlers(tbody, 'tr');
}

function renderMobileList(list) {
  const el = document.getElementById('wlMobileList');
  if (!el) return;
  if (!list.length) { el.innerHTML = `<div class="wl-empty-hint"><i class="ti ti-mood-empty" aria-hidden="true"></i>Watchlist kosong. Tap "Tambah" untuk mulai.</div>`; return; }
  const draggable = WL.sortMode === 'custom';
  el.innerHTML = list.map((s, i) => {
    return `<div class="wl-mobile-item" data-index="${i}" ${draggable ? 'draggable="true"' : ''} onclick="goAnalyze('${s.ticker}')">
      <div class="wl-mobile-num">${i+1}</div>
      ${draggable ? '<i class="ti ti-grip-vertical wl-mobile-handle" aria-hidden="true"></i>' : ''}
      <div class="wl-mobile-info">
        <div class="wl-mobile-tn">
          <span class="wl-mobile-ticker">${s.ticker}</span>
          <span class="wl-mobile-name">${s.name}</span>
        </div>
        <div class="wl-mobile-sub">
          <span class="wl-mobile-meta">P/E <strong>${s.pe}</strong></span>
          <span class="wl-mobile-meta">Yield <strong>${s.yield}</strong></span>
        </div>
      </div>
      <div class="wl-mobile-right">
        <div class="wl-mobile-price">${s.price}</div>
        <div class="wl-mobile-chg ${s.up ? 'text-up' : 'text-down'}">${s.chg}</div>
      </div>
    </div>`;
  }).join('');
  if (draggable) attachDragHandlers(el, '.wl-mobile-item');
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}"><div class="wl-empty-hint"><i class="ti ti-mood-empty" aria-hidden="true"></i>Watchlist kosong. Klik "Tambah Saham" untuk mulai.</div></td></tr>`;
}

/* ── Drag & Drop reorder ────────────────────────────────── */
function attachDragHandlers(container, selector) {
  const items = container.querySelectorAll(selector);
  items.forEach(item => {
    item.addEventListener('dragstart', e => {
      WL.dragIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      container.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      const toIndex = parseInt(item.dataset.index);
      reorder(WL.dragIndex, toIndex);
    });
  });
}

function reorder(from, to) {
  if (from === to || from == null) return;
  const list = getList();
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  saveList(list);
  renderWatchlist();
}

/* ── Add / Remove ───────────────────────────────────────── */
function openAddModal() {
  document.getElementById('addModal').classList.add('open');
  const input = document.getElementById('tickerInput');
  input.value = '';
  buildSuggestions();
  setTimeout(() => input.focus(), 100);
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
}

function buildSuggestions() {
  const el = document.getElementById('suggestChips');
  if (!el) return;
  const list = getList();
  const owned = new Set(list.map(s => s.ticker));
  const avail = SUGGEST[WL.market].filter(t => !owned.has(t));
  el.innerHTML = avail.map(t =>
    `<span class="modal-chip" onclick="addStock('${t}')">${t}</span>`
  ).join('') || '<span style="font-size:11px;color:var(--text-muted)">Semua saran sudah ada di watchlist</span>';
}

function addStock(ticker) {
  ticker = (ticker || document.getElementById('tickerInput').value).trim().toUpperCase();
  if (!ticker) return;
  const list = getList();
  if (list.some(s => s.ticker === ticker)) {
    closeAddModal();
    return;
  }
  // In v1: add with placeholder data. In v2: fetch real data from API.
  list.push({
    ticker, name:'(data menyusul saat v2)', price:'—', chg:'0%', up:true,
    pe:'—', yield:'—', status:'watch'
  });
  saveList(list);
  closeAddModal();
  WL.sortMode = 'custom';
  document.getElementById('sortSelect').value = 'custom';
  renderWatchlist();
}

function removeStock(index) {
  const list = getList();
  list.splice(index, 1);
  saveList(list);
  renderWatchlist();
}

function resetWatchlist() {
  if (confirm('Kembalikan watchlist ke default? Urutan dan saham custom akan hilang.')) {
    localStorage.removeItem('investr-wl-' + WL.market);
    WL.sortMode = 'custom';
    document.getElementById('sortSelect').value = 'custom';
    renderWatchlist();
  }
}

/* ── Navigate to analysis (placeholder until page exists) ── */
function goAnalyze(ticker) {
  // v2: link to analisis.html?ticker=XXX
  console.log('Analyze:', ticker);
}

/* ── Helpers ────────────────────────────────────────────── */
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

/* ── Drawer / settings ──────────────────────────────────── */
function openDrawer()  { document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer() { document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings() { document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings()  { document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindWLEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', () => { toggleTheme(); closeDrawer(); });
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e => { e.stopPropagation(); toggleSettings(); });
  document.addEventListener('click', e => {
    if (!e.target.closest('#settingsDropdown') && !e.target.closest('#settingsBtn')) closeSettings();
  });
  document.querySelectorAll('.market-pill').forEach(b =>
    b.addEventListener('click', () => setActiveMarketWL(b.dataset.market)));
  document.querySelectorAll('.drawer-item').forEach(item =>
    item.addEventListener('click', () => closeDrawer()));

  // toolbar
  document.getElementById('addBtn')?.addEventListener('click', openAddModal);
  document.getElementById('resetBtn')?.addEventListener('click', resetWatchlist);
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    WL.sortMode = e.target.value;
    renderWatchlist();
  });

  // modal
  document.getElementById('modalClose')?.addEventListener('click', closeAddModal);
  document.getElementById('modalCancel')?.addEventListener('click', closeAddModal);
  document.getElementById('modalAdd')?.addEventListener('click', () => addStock());
  document.getElementById('addModal')?.addEventListener('click', e => {
    if (e.target.id === 'addModal') closeAddModal();
  });
  document.getElementById('tickerInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addStock();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeSettings(); closeAddModal(); }
  });
}
