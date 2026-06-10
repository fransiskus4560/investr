/* ═══════════════════════════════════════════════════════════
   INVESTR — Analisa Harian AI v1.0
   Triangulation: Quant (anchor) + Gemini + Groq → Consensus
   v1: rule-based templates. v2: live Gemini + Groq APIs.
═══════════════════════════════════════════════════════════ */

'use strict';

const AnalysisApp = {
  theme:  localStorage.getItem('investr-theme')  || 'dark',
  market: localStorage.getItem('investr-market') || 'IDX',
};

/* ── Per-market daily analysis data ─────────────────────── */
/* Each market has: master verdict, 3 aspects, consensus matrix,
   portfolio recommendations, and market opportunities.        */

const DAILY = {
  IDX: {
    date: null, // dynamic: uses formatTodayID()
    closeRef: null, // dynamic: uses closeRefID()
    // Master verdict from triangulation
    verdict: {
      consensus: 'strong',          // strong | mixed | weak
      symbol: 'ti-trending-up',
      headline: 'Hari yang Tenang — Tetap pada Rencana',
      sub: 'Ketiga sumber analisa sepakat: tidak ada sinyal mendesak hari ini. Pasar koreksi tipis, fundamental portofolio kamu tetap solid. Fokus pada akumulasi bertahap di saham undervalue.',
      confidence: 78,
    },
    aspects: {
      quant: {
        verdict: 'NETRAL-POSITIF', verdictCls: 'text-up', icon: 'ti-arrow-up-right',
        score: 72, scoreCls: 'text-up',
        points: [
          { i:'ti-check',     c:'var(--green)', t:'<strong>IHSG di atas MA-50</strong> (7.210) — tren menengah masih naik.' },
          { i:'ti-alert-triangle', c:'var(--amber)', t:'RSI 58 — netral, belum overbought. Ruang naik masih ada.' },
          { i:'ti-check',     c:'var(--green)', t:'<strong>Support kuat di 7.180</strong>, resistance 7.350. Risk/reward sehat.' },
          { i:'ti-minus',     c:'var(--text-muted)', t:'Volume kemarin -8% dari rata-rata — partisipasi pasar menurun.' },
        ],
      },
      gemini: {
        verdict: 'HOLD / AKUMULASI', verdictCls: 'text-up', icon: 'ti-circle-check',
        score: 75, scoreCls: 'text-up',
        points: [
          { i:'ti-bulb', c:'var(--purple)', t:'Sentimen global sedikit negatif, tapi tidak berdampak struktural ke IDX.' },
          { i:'ti-bulb', c:'var(--purple)', t:'<strong>Saham perbankan tetap menarik</strong> — valuasi wajar, dividen stabil.' },
          { i:'ti-bulb', c:'var(--purple)', t:'Rekomendasi: tahan posisi, manfaatkan koreksi untuk akumulasi bertahap.' },
        ],
      },
      groq: {
        verdict: 'HOLD', verdictCls: 'text-up', icon: 'ti-circle-check',
        score: 70, scoreCls: 'text-up',
        points: [
          { i:'ti-cpu', c:'var(--amber)', t:'Momentum jangka pendek melemah, tapi tren utama masih intact.' },
          { i:'ti-cpu', c:'var(--amber)', t:'<strong>BBRI menunjukkan value</strong> di level harga sekarang.' },
          { i:'ti-cpu', c:'var(--amber)', t:'Tidak ada katalis besar hari ini — wajar untuk wait & see.' },
        ],
      },
    },
    matrix: [
      { name:'IHSG (Index)', quant:['Hold','cell-hold'], gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'BBRI', quant:['Buy','cell-buy'],  gemini:['Buy','cell-buy'],   groq:['Buy','cell-buy']  },
      { name:'BBCA', quant:['Hold','cell-hold'], gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'TLKM', quant:['Buy','cell-buy'],   gemini:['Hold','cell-hold'], groq:['Buy','cell-buy']  },
      { name:'GOTO', quant:['Sell','cell-sell'], gemini:['Sell','cell-sell'], groq:['Hold','cell-hold'] },
    ],
    portfolio: [
      { ticker:'BBCA', action:'hold', actLabel:'Hold',  dots:['g','g','g'], note:'Wajar, tahan' },
      { ticker:'BBRI', action:'buy',  actLabel:'Tambah',dots:['g','g','g'], note:'Undervalue, akumulasi' },
      { ticker:'TLKM', action:'hold', actLabel:'Hold',  dots:['g','y','g'], note:'Tunggu dividen 15 Jun' },
      { ticker:'GOTO', action:'trim', actLabel:'Kurangi',dots:['r','r','y'], note:'Momentum lemah' },
    ],
    opportunities: [
      { name:'PGAS', sector:'Energi', reason:'Dividend yield 5,2% dengan fundamental stabil. Ketiga analisa sepakat undervalue di harga sekarang.', metrics:[['P/E','8,5x'],['Yield','5,2%'],['Konsensus','3/3 Buy']] },
      { name:'ASII', sector:'Otomotif', reason:'Valuasi murah (P/E 10x), tapi momentum masih lemah. Quant bilang murah, AI menyarankan tunggu konfirmasi tren.', metrics:[['P/E','10,2x'],['Yield','3,0%'],['Konsensus','2/3 Buy']] },
    ],
  },

  US: {
    date: null, // dynamic
    closeRef: null, // dynamic
    verdict: {
      consensus: 'strong',
      symbol: 'ti-trending-up',
      headline: 'Tech Momentum Strong — Ride the Trend',
      sub: 'All three sources align: bullish momentum on strong jobs data. Tech leading. Maintain positions, consider adding on dips. No major risk signals today.',
      confidence: 82,
    },
    aspects: {
      quant: {
        verdict: 'BULLISH', verdictCls: 'text-up', icon: 'ti-trending-up',
        score: 80, scoreCls: 'text-up',
        points: [
          { i:'ti-check', c:'var(--green)', t:'<strong>S&P 500 above MA-50 & MA-200</strong> — golden cross intact.' },
          { i:'ti-check', c:'var(--green)', t:'RSI 64 — strong but not overbought. Room to run.' },
          { i:'ti-check', c:'var(--green)', t:'Volume +12% — strong participation confirms the move.' },
          { i:'ti-alert-triangle', c:'var(--amber)', t:'VIX low at 13 — complacency risk if sentiment shifts.' },
        ],
      },
      gemini: {
        verdict: 'BUY / HOLD', verdictCls: 'text-up', icon: 'ti-circle-check',
        score: 83, scoreCls: 'text-up',
        points: [
          { i:'ti-bulb', c:'var(--purple)', t:'Jobs data beat expectations — economy resilient.' },
          { i:'ti-bulb', c:'var(--purple)', t:'<strong>AAPL & MSFT well-positioned</strong> ahead of earnings season.' },
          { i:'ti-bulb', c:'var(--purple)', t:'Recommend holding tech, adding selectively on any pullback.' },
        ],
      },
      groq: {
        verdict: 'BUY', verdictCls: 'text-up', icon: 'ti-trending-up',
        score: 79, scoreCls: 'text-up',
        points: [
          { i:'ti-cpu', c:'var(--amber)', t:'Strong uptrend across mega-cap tech.' },
          { i:'ti-cpu', c:'var(--amber)', t:'<strong>NVDA momentum exceptional</strong> but watch for volatility.' },
          { i:'ti-cpu', c:'var(--amber)', t:'Fed on hold supports risk assets near-term.' },
        ],
      },
    },
    matrix: [
      { name:'S&P 500', quant:['Buy','cell-buy'],  gemini:['Buy','cell-buy'],  groq:['Buy','cell-buy'] },
      { name:'AAPL', quant:['Hold','cell-hold'], gemini:['Buy','cell-buy'],  groq:['Buy','cell-buy'] },
      { name:'MSFT', quant:['Buy','cell-buy'],   gemini:['Buy','cell-buy'],  groq:['Buy','cell-buy'] },
      { name:'NVDA', quant:['Buy','cell-buy'],   gemini:['Hold','cell-hold'],groq:['Buy','cell-buy'] },
      { name:'TSLA', quant:['Hold','cell-hold'], gemini:['Hold','cell-hold'],groq:['Sell','cell-sell'] },
    ],
    portfolio: [
      { ticker:'AAPL', action:'hold', actLabel:'Hold',  dots:['y','g','g'], note:'Near earnings, hold' },
      { ticker:'MSFT', action:'buy',  actLabel:'Add',   dots:['g','g','g'], note:'Strong, accumulate' },
      { ticker:'NVDA', action:'hold', actLabel:'Hold',  dots:['g','y','g'], note:'Let winner run' },
      { ticker:'TSLA', action:'trim', actLabel:'Trim',  dots:['y','y','r'], note:'Weak momentum' },
    ],
    opportunities: [
      { name:'GOOGL', sector:'Tech', reason:'Reasonable valuation vs peers, strong AI positioning. All three sources see upside potential.', metrics:[['P/E','24x'],['Growth','+15%'],['Consensus','3/3 Buy']] },
      { name:'JPM', sector:'Finance', reason:'Solid dividend, benefiting from higher-for-longer rates. Quant strong, AI cautiously positive.', metrics:[['P/E','11x'],['Yield','2,4%'],['Consensus','2/3 Buy']] },
    ],
  },

  ASX: {
    date: null, // dynamic: uses formatTodayID()
    closeRef: null, // dynamic: uses closeRefID()
    verdict: {
      consensus: 'mixed',
      symbol: 'ti-shield-half',
      headline: 'Sinyal Campuran — Pilih dengan Selektif',
      sub: 'Fundamental kuat (terutama bank & resources) tapi AI melihat momentum melambat. Tetap selektif: fokus pada saham dividen tinggi, hindari mengejar yang sudah naik tinggi.',
      confidence: 64,
    },
    aspects: {
      quant: {
        verdict: 'POSITIF', verdictCls: 'text-up', icon: 'ti-arrow-up-right',
        score: 74, scoreCls: 'text-up',
        points: [
          { i:'ti-check', c:'var(--green)', t:'<strong>ASX 200 di atas MA-50</strong> — tren naik terjaga.' },
          { i:'ti-check', c:'var(--green)', t:'Bank saham dividend yield 4-5% — value sangat menarik.' },
          { i:'ti-alert-triangle', c:'var(--amber)', t:'RSI 61 — mendekati zona panas, hati-hati di level ini.' },
        ],
      },
      gemini: {
        verdict: 'NETRAL', verdictCls: 'text-muted', icon: 'ti-circle-minus',
        score: 60, scoreCls: 'text-muted',
        points: [
          { i:'ti-bulb', c:'var(--purple)', t:'Resources rally mungkin sudah priced-in.' },
          { i:'ti-bulb', c:'var(--purple)', t:'<strong>CBA menarik untuk income</strong>, tapi capital upside terbatas.' },
          { i:'ti-bulb', c:'var(--purple)', t:'Sarankan selektif — jangan kejar yang sudah naik tinggi.' },
        ],
      },
      groq: {
        verdict: 'HOLD', verdictCls: 'text-muted', icon: 'ti-circle-minus',
        score: 62, scoreCls: 'text-muted',
        points: [
          { i:'ti-cpu', c:'var(--amber)', t:'Momentum melambat setelah rally beberapa minggu.' },
          { i:'ti-cpu', c:'var(--amber)', t:'<strong>BHP & RIO solid</strong> tapi sangat tergantung harga komoditas.' },
          { i:'ti-cpu', c:'var(--amber)', t:'RBA hold — tidak ada katalis baru jangka pendek.' },
        ],
      },
    },
    matrix: [
      { name:'ASX 200', quant:['Buy','cell-buy'],  gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'CBA', quant:['Hold','cell-hold'], gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'BHP', quant:['Buy','cell-buy'],   gemini:['Hold','cell-hold'], groq:['Buy','cell-buy'] },
      { name:'RIO', quant:['Buy','cell-buy'],   gemini:['Buy','cell-buy'],   groq:['Hold','cell-hold'] },
      { name:'CSL', quant:['Hold','cell-hold'], gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
    ],
    portfolio: [
      { ticker:'CBA', action:'hold', actLabel:'Hold', dots:['g','y','y'], note:'Income play, tahan' },
      { ticker:'BHP', action:'buy',  actLabel:'Tambah',dots:['g','y','g'], note:'Value di sektor' },
      { ticker:'RIO', action:'hold', actLabel:'Hold', dots:['g','g','y'], note:'Tergantung komoditas' },
      { ticker:'CSL', action:'hold', actLabel:'Hold', dots:['y','y','y'], note:'Netral semua' },
    ],
    opportunities: [
      { name:'WES', sector:'Retail', reason:'Bisnis defensif berkualitas, valuasi wajar. Bagus untuk stabilitas portofolio jangka panjang.', metrics:[['P/E','22x'],['Yield','3,5%'],['Konsensus','2/3 Buy']] },
      { name:'NAB', sector:'Banking', reason:'Dividend yield kompetitif, valuasi diskon vs CBA. Quant melihat value, AI netral.', metrics:[['P/E','13x'],['Yield','4,6%'],['Konsensus','2/3 Hold']] },
    ],
  },

  Crypto: {
    date: null, // dynamic: uses formatTodayID()
    closeRef: 'Snapshot 24 jam terakhir',
    verdict: {
      consensus: 'mixed',
      symbol: 'ti-alert-triangle',
      headline: 'Bullish tapi Volatil — Kelola Risiko Ketat',
      sub: 'Momentum positif kuat (BTC tembus $67k), tapi volatilitas tinggi membuat ini berisiko. Quant bullish, AI mengingatkan disiplin position sizing. Jangan FOMO, batasi alokasi crypto maks 5-10% porto.',
      confidence: 58,
    },
    aspects: {
      quant: {
        verdict: 'BULLISH', verdictCls: 'text-up', icon: 'ti-trending-up',
        score: 76, scoreCls: 'text-up',
        points: [
          { i:'ti-check', c:'var(--green)', t:'<strong>BTC tembus resistance $67k</strong> dengan volume tinggi.' },
          { i:'ti-check', c:'var(--green)', t:'RSI 68 — kuat, tapi mendekati overbought. Waspada.' },
          { i:'ti-alert-triangle', c:'var(--red)', t:'Volatilitas 30-hari sangat tinggi — risiko swing besar.' },
        ],
      },
      gemini: {
        verdict: 'HATI-HATI', verdictCls: 'text-down', icon: 'ti-alert-triangle',
        score: 55, scoreCls: 'text-muted',
        points: [
          { i:'ti-bulb', c:'var(--purple)', t:'Rally kuat, tapi crypto sangat sentimen-driven.' },
          { i:'ti-bulb', c:'var(--purple)', t:'<strong>Disiplin position sizing wajib</strong> — jangan all-in.' },
          { i:'ti-bulb', c:'var(--purple)', t:'Cocok untuk porsi kecil spekulatif, bukan core holding.' },
        ],
      },
      groq: {
        verdict: 'NETRAL', verdictCls: 'text-muted', icon: 'ti-circle-minus',
        score: 60, scoreCls: 'text-muted',
        points: [
          { i:'ti-cpu', c:'var(--amber)', t:'Tren naik, tapi sudah cukup jauh dari support.' },
          { i:'ti-cpu', c:'var(--amber)', t:'<strong>ETH staking 4,2%</strong> menarik untuk hold jangka panjang.' },
          { i:'ti-cpu', c:'var(--amber)', t:'Risiko koreksi tajam selalu ada di level ini.' },
        ],
      },
    },
    matrix: [
      { name:'BTC', quant:['Buy','cell-buy'],  gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'ETH', quant:['Buy','cell-buy'],  gemini:['Hold','cell-hold'], groq:['Buy','cell-buy'] },
      { name:'SOL', quant:['Buy','cell-buy'],  gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'BNB', quant:['Hold','cell-hold'],gemini:['Hold','cell-hold'], groq:['Hold','cell-hold'] },
      { name:'DOGE',quant:['Sell','cell-sell'],gemini:['Sell','cell-sell'], groq:['Hold','cell-hold'] },
    ],
    portfolio: [
      { ticker:'BTC', action:'hold', actLabel:'Hold', dots:['g','y','y'], note:'Core, tahan' },
      { ticker:'ETH', action:'buy',  actLabel:'Tambah',dots:['g','y','g'], note:'Staking yield bagus' },
      { ticker:'SOL', action:'hold', actLabel:'Hold', dots:['g','y','y'], note:'Volatil, hati-hati' },
      { ticker:'DOGE',action:'trim', actLabel:'Kurangi',dots:['r','r','y'], note:'Spekulatif tinggi' },
    ],
    opportunities: [
      { name:'ETH', sector:'Layer-1', reason:'Fundamental terkuat di altcoin, staking yield 4,2%, ekosistem terbesar. Pilihan paling rasional jika ingin masuk crypto.', metrics:[['Staking','4,2%'],['Risiko','Sedang'],['Konsensus','2/3 Buy']] },
      { name:'BTC', sector:'Store of value', reason:'Aset crypto paling mapan. Untuk core holding, akumulasi bertahap (DCA) lebih bijak daripada beli sekaligus di puncak.', metrics:[['Volatilitas','Tinggi'],['Likuiditas','Terbaik'],['Konsensus','1/3 Buy']] },
    ],
  },
};

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(AnalysisApp.theme);
  setActiveMarketAnalysis(AnalysisApp.market);
  bindAnalysisEvents();
});

function applyTheme(theme) {
  AnalysisApp.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('investr-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const di = document.getElementById('drawerThemeIcon');
  if (di) di.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  const dt = document.getElementById('drawerThemeText');
  if (dt) dt.textContent = theme === 'dark' ? 'Mode terang' : 'Mode gelap';
}
function toggleTheme() { applyTheme(AnalysisApp.theme === 'dark' ? 'light' : 'dark'); }

function setActiveMarketAnalysis(market) {
  AnalysisApp.market = market;
  localStorage.setItem('investr-market', market);
  document.querySelectorAll('.market-pill').forEach(b =>
    b.classList.toggle('active', b.dataset.market === market));
  renderAnalysis();
}

/* ── Dynamic date helpers (Bug #2 fix: never hardcode year) ── */
const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatTodayID() {
  const d = new Date();
  return DAYS_ID[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_ID[d.getMonth()] + ' ' + d.getFullYear();
}
function closeRefID() {
  // previous market day (skip weekend roughly: if Mon→Fri, if Sun→Fri, else yesterday)
  const d = new Date();
  let back = 1;
  if (d.getDay() === 1) back = 3;       // Monday → Friday
  else if (d.getDay() === 0) back = 2;  // Sunday → Friday
  d.setDate(d.getDate() - back);
  return 'Penutupan ' + DAYS_ID[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_SHORT_ID[d.getMonth()];
}

/* ── Render the full analysis ───────────────────────────── */
function renderAnalysis() {
  const d = DAILY[AnalysisApp.market];
  if (!d) return;

  // Date strip
  setText('analysisDate', d.date || formatTodayID());
  setText('analysisCloseRef', d.closeRef || closeRefID());

  // Master verdict
  const hero = document.getElementById('verdictHero');
  hero.className = 'verdict-hero consensus-' + d.verdict.consensus;
  document.getElementById('verdictSymbol').innerHTML =
    `<i class="ti ${d.verdict.symbol}" aria-hidden="true"></i>`;
  setText('verdictHeadline', d.verdict.headline);
  setText('verdictSub', d.verdict.sub);
  setText('gaugeValue', d.verdict.confidence + '%');
  document.getElementById('gaugeFill').style.width = d.verdict.confidence + '%';

  // Three aspects
  renderAspect('quant',  d.aspects.quant);
  renderAspect('gemini', d.aspects.gemini);
  renderAspect('groq',   d.aspects.groq);

  // Consensus matrix
  renderMatrix(d.matrix);

  // Portfolio recommendations
  renderPortfolio(d.portfolio);

  // Opportunities
  renderOpportunities(d.opportunities);

  // Custom user tickers
  renderCustomTickers();
}

/* ── Custom ticker analysis (Opsi A: wadah, isi di v2) ──── */
function getCustomTickers() {
  const key = 'investr-custom-analysis-' + AnalysisApp.market;
  const saved = localStorage.getItem(key);
  if (saved) { try { return JSON.parse(saved); } catch(e){} }
  return [];
}
function saveCustomTickers(list) {
  localStorage.setItem('investr-custom-analysis-' + AnalysisApp.market, JSON.stringify(list));
}

function addCustomTicker() {
  const input = document.getElementById('customTickerInput');
  if (!input) return;
  const t = input.value.trim().toUpperCase();
  if (!t) { input.focus(); return; }
  const list = getCustomTickers();
  if (list.includes(t)) { input.value = ''; return; }
  list.push(t);
  saveCustomTickers(list);
  input.value = '';
  renderCustomTickers();
}

function removeCustomTicker(ticker) {
  const list = getCustomTickers().filter(t => t !== ticker);
  saveCustomTickers(list);
  renderCustomTickers();
}

function renderCustomTickers() {
  const grid = document.getElementById('customGrid');
  if (!grid) return;
  const list = getCustomTickers();
  if (!list.length) {
    grid.innerHTML = `<div class="custom-empty">
      <i class="ti ti-mood-plus" aria-hidden="true"></i>
      Belum ada saham pilihan. Tambahkan di atas untuk minta analisa triangulasi.
    </div>`;
    return;
  }
  grid.innerHTML = list.map(t => `
    <div class="custom-card">
      <div class="custom-card-head">
        <div class="custom-card-id">
          <div class="custom-logo">${t.substring(0,2)}</div>
          <div>
            <div class="custom-tkr">${t}</div>
            <div class="custom-tkr-sub">Pasar ${AnalysisApp.market}</div>
          </div>
        </div>
        <button class="custom-remove" onclick="removeCustomTicker('${t}')" aria-label="Hapus ${t}"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>
      <div class="custom-pending">
        <i class="ti ti-robot" aria-hidden="true"></i>
        <div class="custom-pending-title">Menunggu koneksi AI</div>
        <div class="custom-pending-sub">Analisa triangulasi (Quant + Gemini + Groq) untuk ${t} akan aktif saat data live & AI tersambung di v2.</div>
      </div>
      <div class="custom-tri">
        <div class="custom-tri-item"><div class="custom-tri-label">Quant</div><div class="custom-tri-icon"><i class="ti ti-clock" aria-hidden="true"></i></div></div>
        <div class="custom-tri-item"><div class="custom-tri-label">Gemini</div><div class="custom-tri-icon"><i class="ti ti-clock" aria-hidden="true"></i></div></div>
        <div class="custom-tri-item"><div class="custom-tri-label">Groq</div><div class="custom-tri-icon"><i class="ti ti-clock" aria-hidden="true"></i></div></div>
      </div>
    </div>`).join('');
}

function renderAspect(key, a) {
  const vIcon = document.getElementById(key + 'VerdictIcon');
  const vText = document.getElementById(key + 'VerdictText');
  const pts   = document.getElementById(key + 'Points');
  const score = document.getElementById(key + 'Score');

  if (vIcon) vIcon.innerHTML = `<i class="ti ${a.icon} ${a.verdictCls}" aria-hidden="true"></i>`;
  if (vText) { vText.textContent = a.verdict; vText.className = 'aspect-verdict-text ' + a.verdictCls; }
  if (pts) pts.innerHTML = a.points.map(p =>
    `<div class="aspect-point">
      <i class="ti ${p.i}" style="color:${p.c}" aria-hidden="true"></i>
      <span>${p.t}</span>
    </div>`).join('');
  if (score) { score.textContent = a.score; score.className = 'aspect-score-value ' + a.scoreCls; }
}

function renderMatrix(rows) {
  const el = document.getElementById('matrixBody');
  if (!el) return;
  el.innerHTML = rows.map(r =>
    `<div class="matrix-row">
      <div class="matrix-aspect-name">${r.name}</div>
      <div class="matrix-cell ${r.quant[1]}">${r.quant[0]}</div>
      <div class="matrix-cell ${r.gemini[1]}">${r.gemini[0]}</div>
      <div class="matrix-cell ${r.groq[1]}">${r.groq[0]}</div>
    </div>`).join('');
}

const ACTION_MAP = {
  buy:  { cls:'action-buy',  icon:'ti-plus' },
  hold: { cls:'action-hold', icon:'ti-equal' },
  trim: { cls:'action-trim', icon:'ti-minus' },
  sell: { cls:'action-sell', icon:'ti-x' },
};

function renderPortfolio(items) {
  const el = document.getElementById('portfolioBody');
  if (!el) return;
  el.innerHTML = items.map(it => {
    const act = ACTION_MAP[it.action] || ACTION_MAP.hold;
    const dots = it.dots.map(d => `<span class="cdot cdot-${d}"></span>`).join('');
    return `<tr>
      <td><span class="reco-ticker">${it.ticker}</span></td>
      <td><span class="reco-action ${act.cls}"><i class="ti ${act.icon}" aria-hidden="true"></i>${it.actLabel}</span></td>
      <td><span class="consensus-dots">${dots}</span></td>
      <td style="color:var(--text-secondary);font-size:11px">${it.note}</td>
    </tr>`;
  }).join('');
}

function renderOpportunities(items) {
  const el = document.getElementById('oppoGrid');
  if (!el) return;
  el.innerHTML = items.map((o, idx) =>
    `<div class="oppo-card">
      <div class="oppo-rank">${idx + 1}</div>
      <div class="oppo-body">
        <div class="oppo-name">${o.name}<span>${o.sector}</span></div>
        <div class="oppo-reason">${o.reason}</div>
        <div class="oppo-metrics">
          ${o.metrics.map(m => `<span class="oppo-metric"><strong>${m[1]}</strong> ${m[0]}</span>`).join('')}
        </div>
      </div>
    </div>`).join('');
}

/* ── DOM helper ─────────────────────────────────────────── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Drawer / Settings (shared behavior) ────────────────── */
function openDrawer()  { document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerOverlay')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeDrawer() { document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function toggleSettings() { document.getElementById('settingsDropdown')?.classList.toggle('open'); }
function closeSettings()  { document.getElementById('settingsDropdown')?.classList.remove('open'); }

function bindAnalysisEvents() {
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('drawerThemeBtn')?.addEventListener('click', () => { toggleTheme(); closeDrawer(); });
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('settingsBtn')?.addEventListener('click', e => { e.stopPropagation(); toggleSettings(); });
  document.addEventListener('click', e => {
    if (!e.target.closest('#settingsDropdown') && !e.target.closest('#settingsBtn')) closeSettings();
  });
  document.querySelectorAll('.market-pill').forEach(b =>
    b.addEventListener('click', () => setActiveMarketAnalysis(b.dataset.market)));
  document.querySelectorAll('.drawer-item').forEach(item =>
    item.addEventListener('click', () => { closeDrawer(); }));

  // custom ticker
  document.getElementById('customAddBtn')?.addEventListener('click', addCustomTicker);
  document.getElementById('customTickerInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addCustomTicker();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeSettings(); } });
}
