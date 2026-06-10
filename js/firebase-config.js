/* ═══════════════════════════════════════════════════════════
   INVESTR — Firebase Integration v1.0
   Auth (Google login) + Firestore (cloud data).
   Loaded as ES module via CDN. Exposes window.InvestrCloud API.
═══════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs,
  deleteDoc, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Your Firebase project config ───────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCo3goxMB6wpWaC9Kgelp_yhgw5_w9C698",
  authDomain: "investr-11146.firebaseapp.com",
  projectId: "investr-11146",
  storageBucket: "investr-11146.firebasestorage.app",
  messagingSenderId: "950090785654",
  appId: "1:950090785654:web:e43c4e97c147e7d82b5057",
  measurementId: "G-4LDGYJSYS8"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/* ── Public API on window.InvestrCloud ──────────────────── */
const InvestrCloud = {
  user: null,
  ready: false,
  _listeners: [],

  /* subscribe to auth changes: cb(user|null) */
  onAuth(cb) {
    this._listeners.push(cb);
    if (this.ready) cb(this.user);
  },

  async login() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (e) {
      console.error('Login error:', e);
      // common: popup blocked or closed
      if (e.code === 'auth/popup-closed-by-user') return null;
      alert('Login gagal: ' + (e.message || e.code));
      return null;
    }
  },

  async logout() {
    await signOut(auth);
  },

  /* ── Firestore: per-user document storage ──
     Path: users/{uid}/data/{key}  → stores {value, updatedAt}     */
  async save(key, value) {
    if (!this.user) { console.warn('save() ignored — not logged in'); return false; }
    try {
      const ref = doc(db, 'users', this.user.uid, 'data', key);
      await setDoc(ref, { value, updatedAt: serverTimestamp() });
      return true;
    } catch (e) { console.error('save error', key, e); return false; }
  },

  async load(key) {
    if (!this.user) return null;
    try {
      const ref = doc(db, 'users', this.user.uid, 'data', key);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data().value : null;
    } catch (e) { console.error('load error', key, e); return null; }
  },

  async remove(key) {
    if (!this.user) return false;
    try {
      await deleteDoc(doc(db, 'users', this.user.uid, 'data', key));
      return true;
    } catch (e) { console.error('remove error', key, e); return false; }
  },
};

/* ── React to auth state ────────────────────────────────── */
onAuthStateChanged(auth, (user) => {
  InvestrCloud.user = user;
  InvestrCloud.ready = true;
  InvestrCloud._listeners.forEach(cb => { try { cb(user); } catch(e){} });
});

window.InvestrCloud = InvestrCloud;
