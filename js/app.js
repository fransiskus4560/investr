/* ═══════════════════════════════════════════════════════════
   INVESTR — App Core v1.0
   Handles: theme, navigation, market switch, data, charts
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── State ─────────────────────────────────────────────── */
const App = {
  theme:        localStorage.getItem('investr-theme')  || 'dark',
  market:       localStorage.getItem('investr-market') || 'IDX',
  currentPage:  'dashboard',
  drawerOpen:   false,
  settingsOpen: false,
  expandedCard: null,
};

/* ── Market Data ────────────────────────────────────────── */
const MARKETS = {
  IDX: {
    name:       'IDX — Bursa Indonesia',
    index:      'IHSG',
    currency:   'Rp',
    timezone:   'WIB',
    status:     'Pasar buka',
    statusTime: '· tutup 15:00 WIB',
    indexVal:   '7.284',
    indexChg:   '-23',
    indexPct:   '-0,31%',
    indexUp:    false,
    porto:      'Rp 87,4 jt',
    portoChg:   '+1,4%',
    portoUp:    true,
    pnl:        '+Rp 12,3 jt',
    pnlPct:     '+16,4%',
    pnlUp:      true,
    divEst:     'Rp 3,8 jt',
    divYield:   '4,3% yield',
    drip5y:     'Rp 247 jt',
    dripPct:    '+183%',
    weather:    '"Pasar sedikit mendung hari ini karena sentimen global. Porto kamu masih aman — BBCA dan BBRI dalam kondisi solid. Tidak perlu aksi apapun hari ini, tetap pada rencana."',
    weatherTags: [
      { label: 'Porto: aman',    cls: 'tag-green' },
      { label: 'IHSG: koreksi', cls: 'tag-red'   },
      { label: 'BI Rate: stabil',cls: 'tag-blue'  },
    ],
    insights: [
      { color: 'var(--green)', text: '<strong>BBRI</strong> mendekati zona undervalue — P/E 12,3x. Akumulasi bertahap layak dipertimbangkan.' },
      { color: 'var(--amber)', text: '<strong>UNVR</strong> di watchlist sudah overvalue 18%. Tahan dulu, jangan tambah posisi.' },
      { color: 'var(--blue)',  text: 'Dividen <strong>TLKM</strong> dibayar 15 Jun. Estimasi kamu terima <strong>Rp 480.000</strong> bersih.' },
    ],
    watchlist: [
      { ticker:'BBCA', name:'Bank BCA',        price:'9.700', chg:'-0,51%', up:false, status:'hold'   },
      { ticker:'BBRI', name:'Bank BRI',        price:'5.125', chg:'+1,24%', up:true,  status:'buy'    },
      { ticker:'TLKM', name:'Telkom Indonesia',price:'3.220', chg:'+0,62%', up:true,  status:'buy'    },
      { ticker:'ASII', name:'Astra Internasional',price:'5.175',chg:'-0,48%',up:false,status:'hold'  },
      { ticker:'PGAS', name:'Perusahaan Gas',  price:'1.665', chg:'+0,91%', up:true,  status:'strong' },
      { ticker:'GOTO', name:'GoTo Gojek',      price:'56',    chg:'-3,44%', up:false, status:'reduce' },
    ],
    allocation: [
      { label:'Perbankan', pct:37, color:'#3b82f6' },
      { label:'Telko',     pct:21, color:'#10b981' },
      { label:'Otomotif',  pct:13, color:'#f59e0b' },
      { label:'Lainnya',   pct:29, color:'#8b5cf6' },
    ],
  },
  US: {
    name:       'US — NYSE & NASDAQ',
    index:      'S&P 500',
    currency:   '$',
    timezone:   'EDT',
    status:     'Market open',
    statusTime: '· closes 16:00 EDT',
    indexVal:   '5.341',
    indexChg:   '+18',
    indexPct:   '+0,34%',
    indexUp:    true,
    porto:      '$5.820',
    portoChg:   '+0,9%',
    portoUp:    true,
    pnl:        '+$430',
    pnlPct:     '+7,9%',
    pnlUp:      true,
    divEst:     '$210 /yr',
    divYield:   '2,1% yield',
    drip5y:     '$9.400',
    dripPct:    '+62%',
    weather:    '"US markets trending up on strong jobs data. Your AAPL and MSFT positions performing well. Tech sector leading gains — consider adding to positions on any dip."',
    weatherTags: [
      { label: 'Portfolio: solid', cls: 'tag-green' },
      { label: 'Tech: leading',    cls: 'tag-blue'  },
      { label: 'Fed: on hold',     cls: 'tag-amber' },
    ],
    insights: [
      { color: 'var(--green)', text: '<strong>AAPL</strong> broke resistance at $195. Momentum is strong — trailing stop at $185 is sensible.' },
      { color: 'var(--blue)',  text: '<strong>MSFT</strong> reports earnings next week. Consensus EPS estimate is $2.94, watch for guidance.' },
      { color: 'var(--amber)', text: 'Fed meeting on Jun 12 — no rate change expected. Markets pricing 1 cut in Sept.' },
    ],
    watchlist: [
      { ticker:'AAPL',  name:'Apple Inc.',      price:'$196.45', chg:'+0,82%', up:true,  status:'hold'   },
      { ticker:'MSFT',  name:'Microsoft',       price:'$420.12', chg:'+1,14%', up:true,  status:'buy'    },
      { ticker:'NVDA',  name:'Nvidia',          price:'$875.30', chg:'+2,31%', up:true,  status:'strong' },
      { ticker:'GOOGL', name:'Alphabet',        price:'$178.60', chg:'-0,22%', up:false, status:'hold'   },
      { ticker:'META',  name:'Meta Platforms',  price:'$493.20', chg:'+0,75%', up:true,  status:'buy'    },
      { ticker:'TSLA',  name:'Tesla',           price:'$174.80', chg:'-1,43%', up:false, status:'watch'  },
    ],
    allocation: [
      { label:'Technology', pct:52, color:'#3b82f6' },
      { label:'Healthcare', pct:18, color:'#10b981' },
      { label:'Finance',    pct:16, color:'#f59e0b' },
      { label:'Others',     pct:14, color:'#8b5cf6' },
    ],
  },
  ASX: {
    name:       'ASX — Australia',
    index:      'ASX 200',
    currency:   'A$',
    timezone:   'AEST',
    status:     'Pasar buka',
    statusTime: '· tutup 16:00 AEST',
    indexVal:   '7.812',
    indexChg:   '+31',
    indexPct:   '+0,40%',
    indexUp:    true,
    porto:      'A$12.400',
    portoChg:   '+0,8%',
    portoUp:    true,
    pnl:        '+A$980',
    pnlPct:     '+8,6%',
    pnlUp:      true,
    divEst:     'A$540 /yr',
    divYield:   '4,8% yield',
    drip5y:     'A$21.300',
    dripPct:    '+72%',
    weather:    '"ASX dalam kondisi positif. Sektor resources dan banks memimpin kenaikan. Porto kamu menunjukkan performa solid — dividen yield tinggi dari bank saham Australia sangat menarik."',
    weatherTags: [
      { label: 'Porto: solid',   cls: 'tag-green' },
      { label: 'Resources: up',  cls: 'tag-blue'  },
      { label: 'RBA: hold',      cls: 'tag-amber' },
    ],
    insights: [
      { color: 'var(--green)', text: '<strong>CBA</strong> dividend yield 4,9% — one of the best income plays on ASX right now.' },
      { color: 'var(--blue)',  text: '<strong>BHP</strong> iron ore prices stabilising. Long-term outlook remains positive.' },
      { color: 'var(--amber)', text: 'RBA kept rates at 4,35%. Next decision August 6 — markets pricing 50% chance of cut.' },
    ],
    watchlist: [
      { ticker:'CBA',  name:'Commonwealth Bank', price:'A$128.40', chg:'+0,55%', up:true,  status:'hold'   },
      { ticker:'BHP',  name:'BHP Group',         price:'A$44.82',  chg:'+1,20%', up:true,  status:'buy'    },
      { ticker:'CSL',  name:'CSL Limited',       price:'A$298.60', chg:'-0,30%', up:false, status:'hold'   },
      { ticker:'WES',  name:'Wesfarmers',        price:'A$72.15',  chg:'+0,42%', up:true,  status:'buy'    },
      { ticker:'RIO',  name:'Rio Tinto',         price:'A$128.90', chg:'+0,88%', up:true,  status:'strong' },
      { ticker:'NAB',  name:'National Aust Bank', price:'A$37.20', chg:'-0,16%', up:false, status:'hold'   },
    ],
    allocation: [
      { label:'Banking',    pct:40, color:'#3b82f6' },
      { label:'Resources',  pct:30, color:'#f59e0b' },
      { label:'Healthcare', pct:15, color:'#10b981' },
      { label:'Others',     pct:15, color:'#8b5cf6' },
    ],
  },
  Crypto: {
    name:       'Crypto — Global 24/7',
    index:      'BTC/USD',
    currency:   '$',
    timezone:   'UTC',
    status:     'Pasar buka',
    statusTime: '· 24/7 non-stop',
    indexVal:   '67.420',
    indexChg:   '+1.240',
    indexPct:   '+1,87%',
    indexUp:    true,
    porto:      '$8.340',
    portoChg:   '+2,1%',
    portoUp:    true,
    pnl:        '+$1.120',
    pnlPct:     '+15,5%',
    pnlUp:      true,
    divEst:     '$214 /yr',
    divYield:   '~4,2% staking',
    drip5y:     '$18.600',
    dripPct:    '+123%',
    weather:    '"Crypto market bullish hari ini — BTC menembus resistance $67k. ETH dan BNB mengikuti. Volatilitas tinggi, pastikan position sizing sesuai rencana. Jangan FOMO."',
    weatherTags: [
      { label: 'BTC: bullish', cls: 'tag-green' },
      { label: 'Vol: tinggi',  cls: 'tag-red'   },
      { label: 'Altcoin: ikut',cls: 'tag-blue'  },
    ],
    insights: [
      { color: 'var(--green)', text: '<strong>BTC</strong> menembus $67k dengan volume tinggi. Target berikutnya $72k jika momentum terjaga.' },
      { color: 'var(--amber)', text: '<strong>ETH</strong> staking yield 4,2% — alternatif menarik dibanding hold idle di bank.' },
      { color: 'var(--red)',   text: 'Volatilitas tinggi. Jangan investasikan lebih dari 5-10% total porto di crypto.' },
    ],
    watchlist: [
      { ticker:'BTC',  name:'Bitcoin',      price:'$67.420', chg:'+1,87%', up:true,  status:'hold'   },
      { ticker:'ETH',  name:'Ethereum',     price:'$3.520',  chg:'+2,14%', up:true,  status:'buy'    },
      { ticker:'BNB',  name:'BNB Chain',    price:'$598',    chg:'+0,92%', up:true,  status:'hold'   },
      { ticker:'SOL',  name:'Solana',       price:'$172',    chg:'+3,45%', up:true,  status:'buy'    },
      { ticker:'XRP',  name:'Ripple',       price:'$0,52',   chg:'-0,88%', up:false, status:'watch'  },
      { ticker:'DOGE', name:'Dogecoin',     price:'$0,14',   chg:'+1,22%', up:true,  status:'reduce' },
    ],
    allocation: [
      { label:'Bitcoin',  pct:45, color:'#f59e0b' },
      { label:'Ethereum', pct:30, color:'#3b82f6' },
      { label:'BNB',      pct:15, color:'#10b981' },
      { label:'Others',   pct:10, color:'#8b5cf6' },
    ],
  },
};

/* ── Spark data ─────────────────────────────────────────── */
const SPARK = {
  porto: { vals:[72,75,71,78,74,80,77,83,81,87], up:true  },
  pnl:   { vals:[5,7,6,9,8,11,10,13,12,16],      up:true  },
  div:   { vals:[3,3,3.2,3.2,3.4,3.4,3.6,3.6,3.8,3.8], up:true  },
  index: { vals:[7380,7320,7350,7290,7310,7260,7290,7270,7300,7284], up:false },
};

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(App.theme);
  setActiveMarket(App.market);
  buildDashboard();
  bindEvents();
  scheduleToast();
});

/* ── Theme ──────────────────────────────────────────────── */
function applyTheme(theme) {
  App.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const drawerIcon = document.getElementById('drawerThemeIcon');
  if (drawerIcon) drawerIcon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const drawerText = document.getElementById('drawerThemeText');
  if (drawerText) drawerText.textContent = theme === 'dark' ? 'Mode terang' : 'Mode gelap';
}

function toggleTheme() {
  applyTheme(App.theme === 'dark' ? 'light' : 'dark');
}

/* ── Market Switch ──────────────────────────────────────── */
function setActiveMarket(market) {
  App.market = market;
  localStorage.setItem('investr-market', market);
  // Update pill buttons
  document.querySelectorAll('.market-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.market === market);
  });
  // Rebuild content
  if (App.currentPage === 'dashboard') buildDashboard();
}

/* ── Dashboard Builder ──────────────────────────────────── */
function buildDashboard() {
  const d = MARKETS[App.market];

  // Page title
  setText('pageTitle',    d.name);
  setText('pageStatus',   d.status + ' ' + d.statusTime);

  // Stat cards
  setText('statPorto',    d.porto);
  setText('statPortoChg', (d.portoUp ? '+' : '') + d.portoChg + ' hari ini');
  setText('statPnl',      d.pnl);
  setText('statPnlPct',   d.pnlPct + ' dari modal');
  setText('statDiv',      d.divEst);
  setText('statDivYield', d.divYield);
  setText('statIndex',    d.indexVal);
  setText('statIndexChg', d.indexChg + ' (' + d.indexPct + ')');
  setText('statIndexLabel', d.index);

  setClass('statPortoChg', d.portoUp ? 'stat-change text-up' : 'stat-change text-down');
  setClass('statPnl',      d.pnlUp   ? 'stat-value text-up'  : 'stat-value text-down');
  setClass('statIndexChg', d.indexUp ? 'stat-change text-up' : 'stat-change text-down');

  // Sparklines
  buildSparkline('sparkPorto', SPARK.porto);
  buildSparkline('sparkPnl',   SPARK.pnl);
  buildSparkline('sparkDiv',   SPARK.div);
  buildSparkline('sparkIndex', SPARK.index);

  // Weather
  setText('weatherText', d.weather);
  buildWeatherTags(d.weatherTags);
  buildInsights(d.insights);

  // Watchlist
  buildWatchlist(d.watchlist);

  // Allocation donut
  buildDonut(d.allocation);

  // DRIP
  setText('dripNumber', d.drip5y);
  setText('dripPct',    d.dripPct + ' dari modal awal');
}

/* ── DOM Helpers ────────────────────────────────────────── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}
function setClass(id, cls) {
  const el = document.getElementById(id);
  if (el) el.className = cls;
}

/* ── Sparkline ──────────────────────────────────────────── */
function buildSparkline(id, data) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  const vals = data.vals;
  const mn = Math.min(...vals), mx = Math.max(...vals);
  vals.forEach(v => {
    const bar = document.createElement('div');
    bar.className = 'spark-bar';
    bar.style.height = Math.round((v - mn) / (mx - mn || 1) * 100) + '%';
    bar.style.background = data.up ? 'var(--green)' : 'var(--red)';
    el.appendChild(bar);
  });
}

/* ── Chart Expand (tap stat card) ───────────────────────── */
function toggleCard(id) {
  const card = document.getElementById(id);
  const wasExpanded = card.classList.contains('expanded');

  // Collapse all
  ['cardPorto','cardPnl','cardDiv','cardIndex'].forEach(cid => {
    const c = document.getElementById(cid);
    c.classList.remove('expanded');
    const exp = c.querySelector('.stat-chart-expand');
    if (exp) exp.remove();
  });
  App.expandedCard = null;

  if (!wasExpanded) {
    card.classList.add('expanded');
    App.expandedCard = id;

    const expand = document.createElement('div');
    expand.className = 'stat-chart-expand';

    const tabs = document.createElement('div');
    tabs.className = 'time-tabs';
    const chartHost = document.createElement('div');
    chartHost.id = id + '-expandChart';

    ['1D','1W','1M','3M','6M','1Y','3Y','All'].forEach((t) => {
      const btn = document.createElement('button');
      btn.className = 'time-tab' + (t === '1M' ? ' active' : '');
      btn.textContent = t;
      btn.onclick = e => {
        e.stopPropagation();
        tabs.querySelectorAll('.time-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        drawExpandChart(id, chartHost.id, t);
      };
      tabs.appendChild(btn);
    });

    expand.appendChild(tabs);
    expand.appendChild(chartHost);
    card.appendChild(expand);

    // initial draw (defer so the host has width)
    setTimeout(() => drawExpandChart(id, chartHost.id, '1M'), 10);
  }
}

/* Index card = price-like → candlestick. Others = value trend → line. */
function drawExpandChart(cardId, hostId, timeframe) {
  const d = MARKETS[App.market];
  if (cardId === 'cardIndex') {
    if (typeof renderCandles === 'function') {
      renderCandles(hostId, {
        ticker: App.market + '-IDX',
        timeframe,
        basePrice: parseFloat(String(d.indexVal).replace(/[^0-9]/g,'')) || 7000,
        up: d.indexUp,
      });
    }
  } else {
    // synthesize a value trend series for porto / pnl / dividen
    const seed = { cardPorto:[72,75,73,78,80,82,84,87], cardPnl:[5,7,6,9,11,13,12,16], cardDiv:[3,3.2,3.4,3.4,3.6,3.6,3.8,3.8] }[cardId] || [10,12,11,14,15,17];
    const labels = ['Nov','Des','Jan','Feb','Mar','Apr','Mei','Jun'].slice(-seed.length);
    if (typeof renderLineChart === 'function') {
      renderLineChart(hostId, { values: seed, labels, up: true, height: 150 });
    }
  }
}

/* ── Weather Tags ───────────────────────────────────────── */
function buildWeatherTags(tags) {
  const el = document.getElementById('weatherTags');
  if (!el) return;
  el.innerHTML = tags.map(t =>
    `<span class="weather-tag ${t.cls}">${t.label}</span>`
  ).join('');
}

function buildInsights(insights) {
  const el = document.getElementById('insightList');
  if (!el) return;
  el.innerHTML = insights.map(ins =>
    `<div class="insight-item">
      <div class="insight-dot" style="background:${ins.color}"></div>
      <div class="insight-text">${ins.text}</div>
    </div>`
  ).join('');
}

/* ── Watchlist ──────────────────────────────────────────── */
const STATUS_MAP = {
  strong: { cls: 'badge-strong', label: 'Strong Buy' },
  buy:    { cls: 'badge-buy',    label: 'Buy'        },
  hold:   { cls: 'badge-hold',   label: 'Hold'       },
  reduce: { cls: 'badge-reduce', label: 'Reduce'     },
  sell:   { cls: 'badge-sell',   label: 'Sell'       },
  watch:  { cls: 'badge-watch',  label: 'Watch'      },
};

function buildWatchlist(items) {
  const tbody = document.getElementById('watchlistBody');
  if (!tbody) return;
  tbody.innerHTML = items.map(item => {
    const st = STATUS_MAP[item.status] || STATUS_MAP.watch;
    return `<tr>
      <td>
        <div class="wl-ticker">${item.ticker}</div>
        <div class="wl-name">${item.name}</div>
      </td>
      <td style="font-weight:500">${item.price}</td>
      <td class="${item.up ? 'text-up' : 'text-down'}">${item.chg}</td>
      <td><span class="status-badge ${st.cls}">${st.label}</span></td>
    </tr>`;
  }).join('');
}

/* ── Donut (pure SVG) ───────────────────────────────────── */
function buildDonut(alloc) {
  const el = document.getElementById('donutSvg');
  if (!el) return;
  const r = 32, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = alloc.map(a => {
    const dash = (a.pct / 100) * circ;
    const gap  = circ - dash;
    const slice = `<circle cx="${cx}" cy="${cy}" r="${r}"
      fill="none" stroke="${a.color}" stroke-width="11"
      stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}"
      stroke-dashoffset="${(-offset).toFixed(1)}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dash;
    return slice;
  });
  el.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="11"/>` + slices.join('');

  const legend = document.getElementById('donutLegend');
  if (!legend) return;
  legend.innerHTML = alloc.map(a =>
    `<div class="legend-item">
      <div class="legend-dot" style="background:${a.color}"></div>
      <span>${a.label} ${a.pct}%</span>
    </div>`
  ).join('');
}

/* ── Drawer ─────────────────────────────────────────────── */
function openDrawer() {
  App.drawerOpen = true;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  App.drawerOpen = false;
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Settings ───────────────────────────────────────────── */
function toggleSettings() {
  App.settingsOpen = !App.settingsOpen;
  document.getElementById('settingsDropdown').classList.toggle('open', App.settingsOpen);
}
function closeSettings() {
  App.settingsOpen = false;
  document.getElementById('settingsDropdown').classList.remove('open');
}

/* ── Toast Notification ─────────────────────────────────── */
function showToast(msg, type = 'buy') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { buy: 'ti-bell-ringing', alert: 'ti-alert-triangle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="ti ${icons[type] || 'ti-info-circle'}" aria-hidden="true"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function scheduleToast() {
  setTimeout(() => {
    showToast('BBRI mendekati zona undervalue — P/E 12,3x', 'buy');
  }, 2000);
  setTimeout(() => {
    showToast('Dividen TLKM: Rp 480.000 masuk 15 Jun', 'alert');
  }, 6000);
}

/* ── Bind Events ────────────────────────────────────────── */
function bindEvents() {
  // Theme toggle
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', () => {
    toggleTheme(); closeDrawer();
  });

  // Burger menu
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);

  // Settings
  document.getElementById('settingsBtn')?.addEventListener('click', e => {
    e.stopPropagation(); toggleSettings();
  });
  document.addEventListener('click', e => {
    if (App.settingsOpen && !e.target.closest('#settingsDropdown') && !e.target.closest('#settingsBtn')) {
      closeSettings();
    }
  });

  // Market pills
  document.querySelectorAll('.market-pill').forEach(btn => {
    btn.addEventListener('click', () => setActiveMarket(btn.dataset.market));
  });

  // Bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Drawer nav items
  document.querySelectorAll('.drawer-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      closeDrawer();
    });
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeSettings(); }
  });
}
