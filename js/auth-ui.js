/* ═══════════════════════════════════════════════════════════
   INVESTR — Auth UI v1.0
   Shows login gate until signed in; renders user chip; 
   bridges cloud storage so existing pages keep working.
═══════════════════════════════════════════════════════════ */

'use strict';

/* Inject the login gate overlay into the page */
function injectAuthGate() {
  if (document.getElementById('authGate')) return;
  const gate = document.createElement('div');
  gate.className = 'auth-gate';
  gate.id = 'authGate';
  gate.innerHTML = `
    <div class="auth-box">
      <div class="auth-logo"><i class="ti ti-chart-treemap" aria-hidden="true"></i>Investr</div>
      <div class="auth-tagline">Pusat kendali investasimu — saham, crypto, dividen, dan analisa AI dalam satu tempat.</div>
      <div class="auth-card">
        <div id="authContent">
          <div class="auth-loading"><span class="auth-spinner"></span> Menghubungkan...</div>
        </div>
      </div>
      <p class="auth-disclaimer">Dengan masuk, datamu tersimpan aman di akunmu dan tersinkron di semua perangkat. Investr adalah alat bantu berpikir, bukan nasihat keuangan.</p>
    </div>`;
  document.body.appendChild(gate);
}

function showLoginButton() {
  const c = document.getElementById('authContent');
  if (!c) return;
  c.innerHTML = `
    <div class="auth-title">Selamat datang</div>
    <div class="auth-sub">Masuk untuk mengakses portofolio dan analisamu.</div>
    <button class="btn-google" id="googleLoginBtn">
      <svg class="g-icon" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.7 34.5 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.6 5.6C41.9 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
      Masuk dengan Google
    </button>`;
  document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    const c2 = document.getElementById('authContent');
    c2.innerHTML = `<div class="auth-loading"><span class="auth-spinner"></span> Membuka Google...</div>`;
    const user = await window.InvestrCloud.login();
    if (!user) showLoginButton(); // failed/cancelled → show button again
  });
}

function hideGate() {
  const g = document.getElementById('authGate');
  if (g) g.classList.add('hidden');
}
function showGate() {
  const g = document.getElementById('authGate');
  if (g) g.classList.remove('hidden');
}

/* Render user chip into the navbar's right side */
function renderUserChip(user) {
  const right = document.querySelector('.topnav-right');
  if (!right) return;
  let chip = document.getElementById('userChip');
  if (!chip) {
    chip = document.createElement('div');
    chip.className = 'user-chip';
    chip.id = 'userChip';
    right.appendChild(chip);
  }
  const initial = (user.displayName || user.email || '?').charAt(0).toUpperCase();
  const avatar = user.photoURL
    ? `<div class="user-avatar"><img src="${user.photoURL}" alt="" referrerpolicy="no-referrer"></div>`
    : `<div class="user-avatar">${initial}</div>`;
  const name = (user.displayName || user.email || '').split(' ')[0];
  chip.innerHTML = `${avatar}<span class="user-name">${name}</span>`;
  chip.title = 'Klik untuk keluar';
  chip.onclick = async () => {
    if (confirm('Keluar dari Investr?')) await window.InvestrCloud.logout();
  };
}

/* ── Boot ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectAuthGate();
  // wait for InvestrCloud to be ready
  const waitForCloud = setInterval(() => {
    if (window.InvestrCloud) {
      clearInterval(waitForCloud);
      window.InvestrCloud.onAuth(async (user) => {
        if (user) {
          // pull cloud → localStorage so pages render synced data
          if (window.Store && window.Store.pullFromCloud) {
            try { await window.Store.pullFromCloud(); } catch(e){}
          }
          hideGate();
          renderUserChip(user);
          // let pages re-render with freshly pulled data
          document.dispatchEvent(new CustomEvent('investr-cloud-synced'));
        } else {
          showGate();
          showLoginButton();
          const chip = document.getElementById('userChip');
          if (chip) chip.remove();
        }
      });
    }
  }, 50);
});
