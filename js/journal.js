/* ═══════════════════════════════════════════════════════════
   INVESTR — Riwayat & Jurnal Transaksi v1.0
   Versi sederhana (sesuai kesepakatan): catat beli/jual,
   tanggal, harga, jumlah, fee (snapshot), catatan opsional.
   PRINSIP: fee dibekukan ke transaksi saat dibuat.
═══════════════════════════════════════════════════════════ */

'use strict';

const JR = {
  theme: localStorage.getItem('investr-theme') || 'dark',
  filterType: 'all',   // all | buy | sell
  filterIntent: 'all', // all | invest | trade
};

/* ── Sample transactions (v1). Each has feeRate SNAPSHOT. ──
   feeRate & feeAmount disimpan DI DALAM transaksi — bukan
   dirujuk dari akun. Inilah inti prinsip snapshot.          */
const SAMPLE_TX = [
  { id:'t1', date:'2026-01-15', type:'buy',  ticker:'BBRI', name:'Bank BRI',  acc:'Stockbit', accColor:'#1a9c5b', intent:'invest', price:4350, qty:6000,  feeRate:0.10, note:'Akumulasi jangka panjang, P/E murah' },
  { id:'t2', date:'2026-02-03', type:'buy',  ticker:'BBCA', name:'Bank BCA',  acc:'Stockbit', accColor:'#1a9c5b', intent:'invest', price:8200, qty:2000,  feeRate:0.10, note:'Core holding perbankan' },
  { id:'t3', date:'2026-02-20', type:'buy',  ticker:'GOTO', name:'GoTo',      acc:'Ajaib',    accColor:'#6c5ce7', intent:'trade',  price:62,   qty:50000, feeRate:0.15, note:'Trading momentum jangka pendek' },
  { id:'t4', date:'2026-03-10', type:'sell', ticker:'GOTO', name:'GoTo',      acc:'Ajaib',    accColor:'#6c5ce7', intent:'trade',  price:58,   qty:50000, feeRate:0.25, note:'Cut loss, momentum gagal', realized:-220000 },
  { id:'t5', date:'2026-03-22', type:'buy',  ticker:'TLKM', name:'Telkom',    acc:'Stockbit', accColor:'#1a9c5b', intent:'invest', price:3450, qty:4000,  feeRate:0.10, note:'Dividen yield menarik' },
  { id:'t6', date:'2026-04-05', type:'buy',  ticker:'PGAS', name:'Perush Gas',acc:'Ajaib',    accColor:'#6c5ce7', intent:'invest', price:1480, qty:8000,  feeRate:0.15, note:'Yield 5%+, fundamental stabil' },
  { id:'t7', date:'2026-04-18', type:'sell', ticker:'ASII', name:'Astra',     acc:'Stockbit', accColor:'#1a9c5b', intent:'trade',  price:5600, qty:1000,  feeRate:0.25, note:'Ambil profit swing trade', realized:380000 },
];

function getTx() {
  const saved = localStorage.getItem('investr-transactions');
  if (saved) { try { return JSON.parse(saved); } catch(e){} }
  return [...SAMPLE_TX];
}
function saveTx(list) { Store.set('investr-transactions', JSON.stringify(list)); }

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(JR.theme);
  bindJREvents();
  renderJournal();
});

function applyTheme(theme) {
  JR.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  Store.set('investr-theme', theme);
  const i = document.getElementById('themeIcon'); if (i) i.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon'); if (di) di.className = theme==='dark'?'ti ti-sun':'ti ti-moon';
  const dt = document.getElementById('drawerThemeText'); if (dt) dt.textContent = theme==='dark'?'Mode terang':'Mode gelap';
}
function toggleTheme() { applyTheme(JR.theme==='dark'?'light':'dark'); }

/* ── Calc helpers ───────────────────────────────────────── */
function feeAmount(tx) { return Math.round(tx.price * tx.qty * (tx.feeRate/100)); }
function grossValue(tx) { return tx.price * tx.qty; }
function netValue(tx) {
  const g = grossValue(tx), f = feeAmount(tx);
  return tx.type === 'buy' ? g + f : g - f;  // buy: pay more; sell: receive less
}
function rp(n) { return 'Rp ' + Math.round(n).toLocaleString('id-ID'); }
function fmtDate(d) {
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const dt = new Date(d);
  return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
}

/* ── Render ─────────────────────────────────────────────── */
function renderJournal() {
  let list = getTx();
  // sort newest first
  list.sort((a,b) => new Date(b.date) - new Date(a.date));

  // summary (always on full list)
  computeSummary(list);

  // apply filters
  let filtered = list;
  if (JR.filterType !== 'all')   filtered = filtered.filter(t => t.type === JR.filterType);
  if (JR.filterIntent !== 'all') filtered = filtered.filter(t => t.intent === JR.filterIntent);

  renderTable(filtered);
  renderMobile(filtered);
}

function computeSummary(list) {
  const totalTx = list.length;
  const totalFees = list.reduce((s,t) => s + feeAmount(t), 0);
  // realized P&L from sells that have realized field
  const sells = list.filter(t => t.type === 'sell' && typeof t.realized === 'number');
  const realized = sells.reduce((s,t) => s + t.realized, 0);
  const wins = sells.filter(t => t.realized > 0).length;
  const winRate = sells.length ? Math.round(wins/sells.length*100) : 0;

  setText('jrTotalTx', totalTx);
  setText('jrTotalTxSub', list.filter(t=>t.type==='buy').length + ' beli · ' + list.filter(t=>t.type==='sell').length + ' jual');

  const realizedEl = document.getElementById('jrRealized');
  realizedEl.textContent = (realized>=0?'+':'') + rp(Math.abs(realized));
  realizedEl.className = 'jr-sum-value ' + (realized>=0?'text-up':'text-down');
  setText('jrRealizedSub', sells.length + ' posisi ditutup');

  setText('jrWinRate', winRate + '%');
  const wrSub = document.getElementById('jrWinRateSub');
  wrSub.textContent = wins + ' dari ' + sells.length + ' profit';

  setText('jrTotalFees', rp(totalFees));
  setText('jrTotalFeesSub', 'biaya terbukukan');
}

function renderTable(list) {
  const tbody = document.getElementById('jrTableBody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8"><div class="jr-empty"><i class="ti ti-receipt-off" aria-hidden="true"></i>Belum ada transaksi sesuai filter.</div></td></tr>`; return; }
  tbody.innerHTML = list.map(t => {
    const fee = feeAmount(t);
    const net = netValue(t);
    const typeB = t.type==='buy'
      ? '<span class="jr-type-badge jr-buy"><i class="ti ti-arrow-down-left" aria-hidden="true"></i>Beli</span>'
      : '<span class="jr-type-badge jr-sell"><i class="ti ti-arrow-up-right" aria-hidden="true"></i>Jual</span>';
    const intentB = t.intent==='invest'
      ? '<span class="jr-intent jr-invest">Investasi</span>'
      : '<span class="jr-intent jr-trade">Trading</span>';
    const realizedCell = (t.type==='sell' && typeof t.realized==='number')
      ? `<span class="${t.realized>=0?'text-up':'text-down'}">${t.realized>=0?'+':''}${rp(Math.abs(t.realized))}</span>`
      : '<span class="text-muted">—</span>';
    return `<tr>
      <td class="left jr-num">${fmtDate(t.date)}</td>
      <td class="left">${typeB}</td>
      <td class="left"><div class="jr-tkr">${t.ticker}</div><div>${intentB}</div></td>
      <td class="left"><span class="jr-acc-tag"><span class="jr-acc-dot" style="background:${t.accColor}"></span>${t.acc}</span></td>
      <td class="jr-num">${t.qty.toLocaleString('id-ID')}</td>
      <td class="jr-num">${rp(t.price)}</td>
      <td class="jr-num"><span class="jr-fee-snapshot" title="Fee dibekukan: ${t.feeRate}%"><i class="ti ti-lock" aria-hidden="true"></i>${rp(fee)}</span></td>
      <td class="jr-num">${realizedCell}</td>
    </tr>`;
  }).join('');
}

function renderMobile(list) {
  const el = document.getElementById('jrMobile');
  if (!el) return;
  if (!list.length) { el.innerHTML = `<div class="jr-empty"><i class="ti ti-receipt-off" aria-hidden="true"></i>Belum ada transaksi sesuai filter.</div>`; return; }
  el.innerHTML = list.map(t => {
    const fee = feeAmount(t);
    const typeB = t.type==='buy'
      ? '<span class="jr-type-badge jr-buy"><i class="ti ti-arrow-down-left" aria-hidden="true"></i>Beli</span>'
      : '<span class="jr-type-badge jr-sell"><i class="ti ti-arrow-up-right" aria-hidden="true"></i>Jual</span>';
    const intentB = t.intent==='invest'
      ? '<span class="jr-intent jr-invest">Investasi</span>'
      : '<span class="jr-intent jr-trade">Trading</span>';
    const realizedRow = (t.type==='sell' && typeof t.realized==='number')
      ? `<div class="jr-m-cell"><div class="jr-m-cell-label">Realized P&L</div><div class="jr-m-cell-value ${t.realized>=0?'text-up':'text-down'}">${t.realized>=0?'+':''}${rp(Math.abs(t.realized))}</div></div>`
      : `<div class="jr-m-cell"><div class="jr-m-cell-label">Fee (terkunci)</div><div class="jr-m-cell-value">${rp(fee)}</div></div>`;
    return `<div class="jr-m-item">
      <div class="jr-m-top">
        <div class="jr-m-left">
          ${typeB}
          <div><div class="jr-m-tkr">${t.ticker} ${intentB}</div><div class="jr-m-date">${fmtDate(t.date)} · ${t.acc}</div></div>
        </div>
      </div>
      <div class="jr-m-grid">
        <div class="jr-m-cell"><div class="jr-m-cell-label">Jumlah</div><div class="jr-m-cell-value">${t.qty.toLocaleString('id-ID')}</div></div>
        <div class="jr-m-cell"><div class="jr-m-cell-label">Harga</div><div class="jr-m-cell-value">${rp(t.price)}</div></div>
        ${realizedRow}
      </div>
      ${t.note ? `<div class="jr-m-note"><i class="ti ti-message-2" aria-hidden="true"></i>${t.note}</div>` : ''}
    </div>`;
  }).join('');
}

/* ── Filters ────────────────────────────────────────────── */
function setFilterType(v) { JR.filterType = v; document.querySelectorAll('[data-ftype]').forEach(b=>b.classList.toggle('active', b.dataset.ftype===v)); renderJournal(); }
function setFilterIntent(v) { JR.filterIntent = v; document.querySelectorAll('[data-fintent]').forEach(b=>b.classList.toggle('active', b.dataset.fintent===v)); renderJournal(); }

/* ── Add transaction modal ──────────────────────────────── */
function openAddTx() {
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('txTicker').value = '';
  document.getElementById('txQty').value = '';
  document.getElementById('txPrice').value = '';
  document.getElementById('txFee').value = '0.10';
  document.getElementById('txNote').value = '';
  document.getElementById('txModal').classList.add('open');
}
function closeTxModal() { document.getElementById('txModal').classList.remove('open'); }

function saveTransaction() {
  const ticker = document.getElementById('txTicker').value.trim().toUpperCase();
  if (!ticker) { document.getElementById('txTicker').focus(); return; }
  const tx = {
    id: 'tx_' + Date.now(),
    date: document.getElementById('txDate').value,
    type: document.querySelector('[name="txType"]:checked')?.value || 'buy',
    ticker,
    name: ticker,
    acc: document.getElementById('txAcc').value || 'Stockbit',
    accColor: '#1a9c5b',
    intent: document.querySelector('[name="txIntent"]:checked')?.value || 'invest',
    price: parseFloat(document.getElementById('txPrice').value) || 0,
    qty: parseFloat(document.getElementById('txQty').value) || 0,
    // SNAPSHOT: fee rate yang berlaku saat ini dibekukan ke transaksi
    feeRate: parseFloat(document.getElementById('txFee').value) || 0,
    note: document.getElementById('txNote').value.trim(),
  };
  const list = getTx();
  list.push(tx);
  saveTx(list);
  closeTxModal();
  renderJournal();
}

/* ── Helpers ────────────────────────────────────────────── */
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }

function openDrawer(){ document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer(){ document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings(){ document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings(){ document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindJREvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', ()=>{toggleTheme();closeDrawer();});
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e=>{e.stopPropagation();toggleSettings();});
  document.addEventListener('click', e=>{ if(!e.target.closest('#settingsDropdown')&&!e.target.closest('#settingsBtn')) closeSettings(); });
  document.querySelectorAll('.drawer-item').forEach(i=> i.addEventListener('click', ()=>closeDrawer()));

  document.querySelectorAll('[data-ftype]').forEach(b => b.addEventListener('click', ()=>setFilterType(b.dataset.ftype)));
  document.querySelectorAll('[data-fintent]').forEach(b => b.addEventListener('click', ()=>setFilterIntent(b.dataset.fintent)));

  document.getElementById('addTxBtn')?.addEventListener('click', openAddTx);
  document.getElementById('txModalClose')?.addEventListener('click', closeTxModal);
  document.getElementById('txModalCancel')?.addEventListener('click', closeTxModal);
  document.getElementById('txModalSave')?.addEventListener('click', saveTransaction);
  document.getElementById('txModal')?.addEventListener('click', e=>{ if(e.target.id==='txModal') closeTxModal(); });

  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){closeDrawer();closeSettings();closeTxModal();} });
}
