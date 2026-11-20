'use strict';
/* GLORY ROUND v2 – PWA rondaan keselamatan & utiliti luar
   Setiap item boleh ada beberapa isu. Isu: penemuan + tindakan perlu + PIC + gambar (kumpulan A),
   kemudian tindakan diambil + maklumbalas + gambar selesai (kumpulan B) yang diisi kemudian oleh sesiapa.
   Data: Google Sheet (Apps Script). Gambar: Google Drive. Luar talian: IndexedDB. */

/* ───────── pembantu ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = s => esc(s).replace(/\n/g, '<br>');
const two = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; };
const nowStr = () => { const d = new Date(); return `${two(d.getHours())}:${two(d.getMinutes())}`; };
const fmtDate = s => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (s || ''); };
const rnd = n => Math.random().toString(36).slice(2, 2 + n).toUpperCase().padEnd(n, 'X');
const genId = () => { const d = new Date(); return `GR-${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${rnd(4)}`; };
const genIid = () => `IS-${Date.now().toString(36).toUpperCase()}${rnd(3)}`;
const SCHEMA = 2;

const ICON = {
  loop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M19.5 3v4.2h-4.2"/><path d="M8.6 12.3l2.4 2.4 4.2-4.8"/></svg>',
  sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8"/><path d="M21 3v5h-5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 15v4h14v-4"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>'
};

/* ───────── tetapan ───────── */
const DEF = Object.assign({ url: '', pin: '', officer: '' }, window.GLORY_CONFIG || {});
const cfg = (() => {
  let st = {};
  try { st = JSON.parse(localStorage.getItem('gr.cfg') || '{}'); } catch { /* abaikan */ }
  return { url: st.url || DEF.url || '', pin: st.pin || DEF.pin || '', officer: st.officer || DEF.officer || '', stamp: st.stamp === undefined ? true : !!st.stamp };
})();
const saveCfg = () => { try { localStorage.setItem('gr.cfg', JSON.stringify(cfg)); } catch { /* abaikan */ } };

/* ───────── IndexedDB ───────── */
const DB = (() => {
  let p;
  const open = () => p ||= new Promise((res, rej) => {
    const r = indexedDB.open('glory-round', 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('records', { keyPath: 'id' }); d.createObjectStore('kv'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const run = (store, mode, fn) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => res(r && 'result' in r ? r.result : undefined);
    t.onerror = t.onabort = () => rej(t.error);
  }));
  return {
    all: () => run('records', 'readonly', s => s.getAll()),
    put: rec => run('records', 'readwrite', s => s.put(rec)),
    del: id => run('records', 'readwrite', s => s.delete(id)),
    kvGet: k => run('kv', 'readonly', s => s.get(k)),
    kvSet: (k, v) => run('kv', 'readwrite', s => s.put(v, k))
  };
})();

/* ───────── keadaan ───────── */
const S = {
  view: 'home', tab: 'rondaan', items: [], locations: [], pics: [], openIssues: [], records: new Map(), cur: null,
  filter: 'all', syncing: false, progress: '', expand: {}, lb: null, installEvt: null, lastSync: '', focus: ''
};

/* ───────── API Apps Script ───────── */
async function http(url, opts, ms = 40000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctl.signal, redirect: 'follow' });
    const txt = await r.text();
    let j;
    try { j = JSON.parse(txt); } catch { throw new Error('Respons tidak sah. Semak URL & akses Web App (mesti "Anyone").'); }
    if (!j.ok) throw new Error(j.error || 'Ralat pelayan');
    return j;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Tamat masa sambungan');
    throw e;
  } finally { clearTimeout(t); }
}
function apiGet(action, params = {}) {
  if (!cfg.url) throw new Error('URL Apps Script belum ditetapkan');
  const u = new URL(cfg.url);
  u.searchParams.set('action', action);
  u.searchParams.set('pin', cfg.pin || '');
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return http(u.toString(), {});
}
function apiPost(action, body, ms) {
  if (!cfg.url) throw new Error('URL Apps Script belum ditetapkan');
  return http(cfg.url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, pin: cfg.pin || '', by: cfg.officer || '', ...body })
  }, ms);
}

/* ───────── model ───────── */
const blankA = () => ({ penemuan: '', tindakan: '', pic: '', fotos: [] });
const blankB = () => ({ diambil: '', maklumbalas: '', picM: '', fotosSelesai: [], selesai: false });
function newIssue(no) { return { id: genIid(), no: +no, a: blankA(), b: blankB(), ta: Date.now(), tb: 0, da: true, db: false, del: false, srv: false }; }
const isBlank = i => !i.a.penemuan && !i.a.tindakan && !i.a.pic && !i.a.fotos.length && !i.b.diambil && !i.b.maklumbalas && !i.b.picM && !i.b.fotosSelesai.length && !i.b.selesai;
const issueDirty = i => (i.da || i.db || i.del) && !(!i.srv && isBlank(i));
const isDirty = r => !r.fresh && (r.d.meta || Object.keys(r.d.st).length > 0 || r.issues.some(issueDirty));
const issueStatus = i => i.b.selesai ? 'Selesai' : (i.b.diambil || i.b.maklumbalas || i.b.fotosSelesai.length) ? 'Dalam tindakan' : 'Terbuka';
const issuesOf = (r, no) => r.issues.filter(i => i.no == no && !i.del);
const liveIssues = r => r.issues.filter(i => !i.del && !(!i.srv && isBlank(i)));
const findIssue = (r, iid) => r.issues.find(i => i.id === iid);
function bilOf(r, i) { const l = issuesOf(r, i.no); return l.length > 1 ? `${i.no}.${l.indexOf(i) + 1}` : String(i.no); }

function newRecord() {
  return { v: SCHEMA, id: genId(), meta: { lokasi: '', tarikh: todayStr(), masa: nowStr(), pegawai: cfg.officer || '', semakNama: '', semakTtd: '', semakTarikh: '' },
    st: {}, issues: [], d: { meta: true, st: {} }, mrev: 0, fresh: true, loaded: true, serverUpdated: '' };
}
function counts(r) {
  const c = { y: 0, n: 0, na: 0, blank: 0, iss: 0, open: 0 };
  if (!r.loaded) { Object.assign(c, r.counts || {}); return c; }
  (S.items.length ? S.items : []).forEach(d => {
    const s = r.st[d.no];
    if (s === 'Y') c.y++; else if (s === 'N') c.n++; else if (s === 'NA') c.na++; else c.blank++;
  });
  const l = liveIssues(r); c.iss = l.length; c.open = l.filter(i => issueStatus(i) !== 'Selesai').length;
  return c;
}
const persist = r => DB.put(r).catch(() => {});
let persistTimer;
function touch(r) {
  r.fresh = false;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persist(r), 300);
  updateStats();
}
const markA = i => { i.da = true; i.ta = Date.now(); };
const markB = i => { i.db = true; i.tb = Date.now(); };
const recKey = r => `${r.meta.tarikh || ''}${r.meta.masa || ''}${r.serverUpdated || ''}${r.id}`;

/* penukaran data pelayan -> tempatan */
function groupPhotos(urls, local) { return (urls || []).map(u => (local || []).find(p => p.url === u) || { url: u }); }
function issueFromServer(s) {
  return { id: s.id, no: s.no, a: { ...s.a, fotos: groupPhotos(s.a.fotos) }, b: { ...s.b, fotosSelesai: groupPhotos(s.b.fotosSelesai) }, ta: 0, tb: 0, da: false, db: false, del: false, srv: true };
}
function mergeServer(r, sr) {
  r.serverUpdated = sr.updated;
  if (!r.d.meta) r.meta = sr.meta;
  S.items.forEach(d => { if (!r.d.st[d.no]) r.st[d.no] = sr.st[d.no] || ''; });
  const local = new Map(r.issues.map(i => [i.id, i]));
  const out = [];
  for (const si of sr.issues) {
    let li = local.get(si.id);
    if (!li) li = issueFromServer(si);
    else {
      if (!li.da) li.a = { ...si.a, fotos: groupPhotos(si.a.fotos, li.a.fotos) };
      if (!li.db) li.b = { ...si.b, fotosSelesai: groupPhotos(si.b.fotosSelesai, li.b.fotosSelesai) };
      li.srv = true;
    }
    out.push(li); local.delete(si.id);
  }
  for (const li of local.values()) { if (li.del) continue; if (!li.srv || issueDirty(li)) out.push(li); }
  r.issues = out.sort((p, q) => p.no - q.no);
}

/* ───────── segerak ───────── */
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
const urlsOf = arr => arr.filter(p => p.url).map(p => p.url);

async function syncRecord(r) {
  const pend = [];
  r.issues.forEach(i => { if (i.del) return; [['a', 'fotos'], ['b', 'fotosSelesai']].forEach(([g, k]) => i[g][k].forEach(ph => { if (ph.blob && !ph.url) pend.push({ i, g, ph }); })); });
  let n = 0;
  for (const p of pend) {
    S.progress = `Menghantar gambar ${++n}/${pend.length}`; updateSyncUi();
    const j = await apiPost('photo', { id: r.id, no: p.i.no, kind: p.g === 'a' ? 'foto' : 'selesai', mime: p.ph.blob.type || 'image/jpeg', data: await blobToB64(p.ph.blob) }, 90000);
    p.ph.url = j.url; await persist(r);
  }
  if (r.sigBlob) {
    S.progress = 'Menghantar tandatangan'; updateSyncUi();
    const sj = await apiPost('photo', { id: r.id, no: 0, kind: 'ttd', mime: 'image/png', data: await blobToB64(r.sigBlob) }, 90000);
    r.meta.semakTtd = sj.url; r.sigBlob = null; r.d.meta = true; r.mrev++; await persist(r);
  }
  S.progress = 'Menyimpan ke Google Sheet'; updateSyncUi();
  const sentMrev = r.mrev, sentSt = { ...r.d.st }, sentIss = [];
  const statuses = {}; Object.keys(sentSt).forEach(no => { statuses[no] = r.st[no] || ''; });
  const issues = [];
  r.issues.filter(issueDirty).forEach(i => {
    const p = { id: i.id, no: i.no };
    if (i.del) p.del = true;
    else {
      if (i.da || !i.srv) p.a = { penemuan: i.a.penemuan, tindakan: i.a.tindakan, pic: i.a.pic, fotos: urlsOf(i.a.fotos) };
      if (i.db || !i.srv) p.b = { diambil: i.b.diambil, maklumbalas: i.b.maklumbalas, picM: i.b.picM, fotosSelesai: urlsOf(i.b.fotosSelesai), selesai: !!i.b.selesai };
    }
    issues.push(p); sentIss.push({ i, ta: i.ta, tb: i.tb });
  });
  const j = await apiPost('save', { id: r.id, meta: (r.d.meta || !r.serverUpdated) ? r.meta : undefined, statuses, issues });
  if (r.mrev === sentMrev) r.d.meta = false;
  Object.keys(sentSt).forEach(no => { if ((r.st[no] || '') === statuses[no]) delete r.d.st[no]; });
  sentIss.forEach(({ i, ta, tb }) => { if (i.ta === ta) i.da = false; if (i.tb === tb) i.db = false; });
  r.issues = r.issues.filter(i => !(i.del && issues.some(p => p.id === i.id && p.del)));
  mergeServer(r, j.record);
  await persist(r);
  if (r === S.cur && S.view === 'editor') { const l = $('#list'); if (l) { l.innerHTML = listHtml(); $$('#list textarea').forEach(grow); } updateStats(); }
}

async function pull() {
  const j = await apiGet('init');
  S.items = j.items; S.locations = j.locations || []; S.pics = j.pics || []; S.openIssues = j.open || [];
  await DB.kvSet('items', S.items).catch(() => {}); await DB.kvSet('locs', S.locations).catch(() => {});
  await DB.kvSet('pics', S.pics).catch(() => {}); await DB.kvSet('open', S.openIssues).catch(() => {});
  const seen = new Set();
  for (const e of j.list) {
    seen.add(e.id);
    const local = S.records.get(e.id);
    if (local && (isDirty(local) || local === S.cur)) continue;
    if (local && local.loaded && local.serverUpdated === e.updated) { local.counts = { y: e.y, n: e.n, na: e.na, blank: e.blank, iss: e.issues, open: e.open }; continue; }
    const stub = { v: SCHEMA, id: e.id, meta: { lokasi: e.lokasi, tarikh: e.tarikh, masa: e.masa, pegawai: e.pegawai },
      counts: { y: e.y, n: e.n, na: e.na, blank: e.blank, iss: e.issues, open: e.open }, serverUpdated: e.updated, loaded: false, st: {}, issues: [], d: { meta: false, st: {} }, mrev: 0 };
    S.records.set(e.id, stub); await persist(stub);
  }
  if (j.list.length < (j.limit || 200)) {
    for (const [id, r] of [...S.records]) {
      if (!seen.has(id) && !isDirty(r) && r !== S.cur && r.serverUpdated) { S.records.delete(id); DB.del(id).catch(() => {}); }
    }
  }
  S.lastSync = nowStr();
}

async function syncAll(manual = false) {
  if (S.syncing) return;
  if (!cfg.url) { if (manual) toast('Tetapkan URL Apps Script dahulu'); return; }
  if (!navigator.onLine) { if (manual) toast('Luar talian – akan dihantar apabila ada internet'); return; }
  S.syncing = true; S.progress = 'Menyegerak…'; updateSyncUi();
  let sent = 0, err = '';
  for (const r of [...S.records.values()].filter(isDirty)) {
    try { await syncRecord(r); sent++; } catch (e) { err = e.message; }
  }
  try { await pull(); } catch (e) { err ||= e.message; }
  S.syncing = false; S.progress = '';
  if (S.view === 'home') render(); else updateSyncUi();
  if (err && /PIN/.test(err) && S.view !== 'settings') { toast('PIN diperlukan. Masukkan PIN dalam Tetapan.'); nav('settings'); }
  else if (err) toast('Ralat segerak: ' + err);
  else if (manual || sent) toast(sent ? `${sent} rondaan disimpan ke Google Sheet` : 'Sudah dikemas kini');
}

/* ───────── pandu arah ───────── */
function nav(view) { history.pushState({ v: view }, ''); setView(view); }
function setView(v) {
  if ((v === 'editor' || v === 'report') && !S.cur) v = 'home';
  if (S.view === 'editor' && v === 'home') leaveEditor();
  if (S.view === 'report' && v === 'home') leaveEditor();
  S.view = v; render(); window.scrollTo(0, 0);
  if (v === 'editor' && S.focus) { const f = S.focus; S.focus = ''; setTimeout(() => { const el = $('#is-' + f); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); } }, 60); }
}
function back() { if (history.state && history.state.v) history.back(); else setView('home'); }
addEventListener('popstate', e => setView((e.state && e.state.v) || 'home'));

function leaveEditor() {
  const r = S.cur; if (!r) return;
  r.issues = r.issues.filter(i => i.srv || !isBlank(i));
  const untouched = r.fresh && !r.meta.lokasi && !Object.keys(r.st).length && !r.issues.length;
  if (untouched) { S.records.delete(r.id); DB.del(r.id).catch(() => {}); } else persist(r);
  S.cur = null; S.filter = 'all'; S.expand = {};
  setTimeout(() => syncAll(), 50);
}

async function openRecord(id, focus = '') {
  const r = S.records.get(id); if (!r) return;
  if (!S.items.length) { toast('Senarai semak belum dimuat. Sambung internet sekali.'); return; }
  if (navigator.onLine && cfg.url && !isDirty(r)) {
    try {
      toast('Memuat rondaan…');
      const j = await apiGet('get', { id });
      if (!r.loaded) { r.loaded = true; r.issues = []; r.st = {}; r.d = { meta: false, st: {} }; r.mrev = 0; }
      mergeServer(r, j.record); await persist(r);
    } catch (e) { if (!r.loaded) { toast('Gagal memuat: ' + e.message); return; } }
  } else if (!r.loaded) { toast('Perlu internet untuk memuat rondaan ini'); return; }
  S.cur = r; S.filter = 'all'; S.expand = {}; S.focus = focus;
  if (focus) S.expand[focus] = true;
  nav('editor');
}

function startNew() {
  if (!S.items.length) { toast(cfg.url ? 'Senarai semak belum dimuat. Sambung internet sekali.' : 'Tetapkan URL Apps Script dahulu'); if (!cfg.url) nav('settings'); return; }
  const r = newRecord(); S.records.set(r.id, r); S.cur = r; S.filter = 'all'; S.expand = {}; nav('editor');
}

/* ───────── paparan ───────── */
function render() {
  const app = $('#app');
  const v = S.view;
  app.innerHTML = v === 'editor' && S.cur ? viewEditor() : v === 'report' && S.cur ? viewReport() : v === 'settings' ? viewSettings() : viewHome();
  if (v === 'editor') { $$('textarea', app).forEach(grow); updateStats(); }
  if (v === 'report') fitPaper();
}

function syncLabel() {
  if (S.syncing) return S.progress || 'Menyegerak…';
  if (!navigator.onLine) return 'Luar talian';
  const n = [...S.records.values()].filter(isDirty).length;
  return n ? `${n} belum dihantar` : (S.lastSync ? `Disegerak ${S.lastSync}` : 'Sedia');
}
function updateSyncUi() {
  const el = $('#syncChip'); if (el) el.textContent = syncLabel();
  const b = $('#sendBtn');
  if (b) { b.disabled = S.syncing; b.innerHTML = S.syncing ? `<span class="spin">${ICON.sync}</span> ${esc(S.progress || '…')}` : `${ICON.send} Simpan & Hantar`; }
  const rf = $('[data-act=refresh] svg'); if (rf) rf.classList.toggle('spin', S.syncing);
}

/* senarai isu terbuka: pelayan + rekod tempatan yang sudah dimuat */
function openList() {
  const loadedIds = new Set([...S.records.values()].filter(r => r.loaded).map(r => r.id));
  const out = S.openIssues.filter(o => !loadedIds.has(o.rid));
  for (const r of S.records.values()) {
    if (!r.loaded) continue;
    liveIssues(r).filter(i => issueStatus(i) !== 'Selesai').forEach(i => out.push({
      id: i.id, rid: r.id, no: i.no, bil: bilOf(r, i), penemuan: i.a.penemuan, tindakan: i.a.tindakan, pic: i.a.pic,
      status: issueStatus(i), lokasi: r.meta.lokasi, tarikh: r.meta.tarikh, masa: r.meta.masa, photos: i.a.fotos.length
    }));
  }
  return out.sort((a, b) => (b.tarikh + b.masa).localeCompare(a.tarikh + a.masa));
}

function viewHome() {
  const recs = [...S.records.values()].sort((a, b) => recKey(b).localeCompare(recKey(a)));
  const pending = recs.filter(isDirty).length;
  const open = openList();
  let banner = '';
  if (!cfg.url) banner = `<div class="banner warn"><span>URL Google Sheet belum ditetapkan.</span><button class="btn" data-act="settings">Tetapkan</button></div>`;
  else if (!navigator.onLine) banner = `<div class="banner info"><span>Luar talian. Perubahan disimpan dalam telefon dan dihantar apabila ada internet.</span></div>`;
  else if (pending) banner = `<div class="banner warn"><span>${pending} rondaan belum dihantar ke Google Sheet.</span><button class="btn" data-act="refresh">Hantar</button></div>`;
  const body = S.tab === 'rondaan'
    ? (recs.length ? recs.map(recCard).join('') : `<div class="empty">Belum ada rondaan.<br>Tekan <b>Rondaan Baharu</b> untuk mula.</div>`)
    : (open.length ? open.map(openCard).join('') : `<div class="empty">Tiada isu terbuka.<br>Semua isu telah selesai.</div>`);
  return `
  <header class="top">
    <div class="brand"><span class="logo">${ICON.loop}</span><div><b>GLORY ROUND</b><small>Rondaan Keselamatan & Utiliti Luar</small></div></div>
    <span class="chip-s" id="syncChip">${esc(syncLabel())}</span>
    <div class="acts">
      <button class="icon" data-act="refresh" aria-label="Segerak">${ICON.sync}</button>
      <button class="icon" data-act="settings" aria-label="Tetapan">${ICON.gear}</button>
    </div>
  </header>
  <main>
    ${banner}
    <button class="btn cta" data-act="new">${ICON.plus} Rondaan Baharu</button>
    <div class="tabs" role="tablist">
      <button role="tab" data-act="tab" data-t="rondaan" aria-selected="${S.tab === 'rondaan'}">Rondaan <i>${recs.length}</i></button>
      <button role="tab" data-act="tab" data-t="isu" aria-selected="${S.tab === 'isu'}">Isu terbuka <i class="${open.length ? 'hot' : ''}">${open.length}</i></button>
    </div>
    ${body}
  </main>`;
}

function recCard(r) {
  const c = counts(r), dirty = isDirty(r);
  return `<button class="rec" data-act="open" data-id="${esc(r.id)}">
    <div class="r1"><b>${esc(r.meta.lokasi || 'Tiada tempat')}</b>${dirty ? '<span class="tag warn">Belum dihantar</span>' : '<span class="tag ok">Tersimpan</span>'}</div>
    <div class="r2">${fmtDate(r.meta.tarikh)} · ${esc(r.meta.masa)} · ${esc(r.meta.pegawai || '—')}</div>
    <div class="r3"><span class="pill y">${c.y} Y</span><span class="pill n">${c.n} N</span><span class="pill na">${c.na} NA</span>
      ${c.iss ? `<span class="pill ${c.open ? 'w' : 'y'}">${c.iss} isu · ${c.open} belum selesai</span>` : ''}</div>
  </button>`;
}
function openCard(o) {
  return `<button class="rec issue-card" data-act="open-issue" data-rid="${esc(o.rid)}" data-iid="${esc(o.id)}">
    <div class="r1"><b>Isu ${esc(o.bil)} · ${esc(o.penemuan || '(tiada huraian)').slice(0, 110)}</b><span class="tag ${o.status === 'Terbuka' ? 'warn' : 'prog'}">${esc(o.status)}</span></div>
    <div class="r2">${esc(o.lokasi || '—')} · ${fmtDate(o.tarikh)}${o.pic ? ' · PIC: ' + esc(o.pic) : ''}</div>
    ${o.tindakan ? `<div class="r2" style="margin:0">Tindakan: ${esc(o.tindakan).slice(0, 120)}</div>` : ''}
  </button>`;
}

function viewEditor() {
  const r = S.cur, m = r.meta;
  return `
  <header class="top">
    <button class="icon" data-act="back" aria-label="Kembali">${ICON.back}</button>
    <div class="ttl"><b>Rondaan</b><small id="progTxt"></small></div>
    <span class="chip-s" id="syncChip">${esc(syncLabel())}</span>
    <button class="icon" data-act="report" aria-label="Laporan">${ICON.doc}</button>
    <button class="icon" data-act="delete" aria-label="Padam rondaan">${ICON.trash}</button>
  </header>
  <div class="progress"><i id="progBar"></i></div>
  <main>
    <section class="card meta">
      <label class="f"><span>Tempat <em>/ Location</em></span>
        <input type="text" data-meta="lokasi" list="locs" value="${esc(m.lokasi)}" placeholder="cth: Blok A – Kawasan luar" autocomplete="off"></label>
      <div class="grid2">
        <label class="f"><span>Tarikh</span><input type="date" data-meta="tarikh" value="${esc(m.tarikh)}"></label>
        <label class="f"><span>Masa</span><input type="time" data-meta="masa" value="${esc(m.masa)}"></label>
      </div>
      <label class="f" style="margin:0"><span>Ketua Rondaan</span>
        <input type="text" data-meta="pegawai" value="${esc(m.pegawai)}" autocomplete="name"></label>
    </section>
    <datalist id="locs">${S.locations.map(l => `<option value="${esc(l)}">`).join('')}</datalist>
    <datalist id="pics">${S.pics.map(l => `<option value="${esc(l)}">`).join('')}</datalist>
    <div class="chips" id="chips">${chipsHtml()}</div>
    <div id="list">${listHtml()}</div>
    <div id="semak">${semakHtml()}</div>
  </main>
  <footer class="bar">
    <div class="stats" id="stats"></div>
    <button class="btn" id="sendBtn" data-act="send">${ICON.send} Simpan & Hantar</button>
  </footer>`;
}

const sigSrc = r => r.sigBlob ? blobUrl(r.sigBlob) : (r.meta.semakTtd || '');
function semakHtml() {
  const r = S.cur, m = r.meta, src = sigSrc(r);
  return `<h2 class="sec">Penyedia laporan</h2><section class="card">
    <label class="f"><span>Disediakan oleh <em>(nama penyedia)</em></span><input type="text" data-meta="semakNama" value="${esc(m.semakNama || '')}" autocomplete="name"></label>
    <div class="sig-box">${src ? `<img src="${esc(src)}" alt="Tandatangan">` : '<span>Belum ditandatangani</span>'}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
      <button class="btn" data-act="sig-open">${src ? 'Tandatangan semula' : 'Tandatangan digital'}</button>
      ${src ? '<button class="btn ghost" data-act="sig-clear">Buang</button>' : ''}</div>
    <p class="hint" style="margin:12px 0 0">Ruang <b>Disahkan oleh</b> dalam laporan dikosongkan untuk tandatangan basah selepas dicetak.</p>
  </section>`;
}
function chipsHtml() {
  const r = S.cur, c = counts(r), f = S.filter;
  const chip = (k, label) => `<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${f === k}">${label}</button>`;
  return chip('all', `Semua (${S.items.length})`) + chip('blank', `Belum diisi (${c.blank})`) + chip('N', `Tidak patuh (${c.n})`) + chip('open', `Isu terbuka (${c.open})`);
}

function listHtml() {
  const r = S.cur;
  let prev = '', out = '';
  S.items.forEach(d => {
    const st = r.st[d.no] || '';
    if (S.filter === 'blank' && st) return;
    if (S.filter === 'N' && st !== 'N') return;
    if (S.filter === 'open' && !issuesOf(r, d.no).some(i => issueStatus(i) !== 'Selesai')) return;
    if (d.catEN !== prev) { prev = d.catEN; out += `<div class="cat">${esc(d.catBM || d.catEN)}<small>${esc(d.catEN)}</small></div>`; }
    out += itemHtml(d);
  });
  return out || `<div class="empty">Tiada item dalam paparan ini.</div>`;
}

function itemHtml(d) {
  const r = S.cur, st = r.st[d.no] || '', iss = issuesOf(r, d.no);
  const btn = (s, big, sm) => `<button data-act="status" data-no="${d.no}" data-s="${s}" aria-pressed="${st === s}">${big}<small>${sm}</small></button>`;
  return `<article class="item" id="it${d.no}" data-no="${d.no}" data-s="${st}">
    <div class="row"><span class="no">${d.no}</span><div>
      <p class="bm">${esc(d.itemBM || d.itemEN)}</p>${d.itemBM && d.itemEN ? `<p class="en">${esc(d.itemEN)}</p>` : ''}</div></div>
    <div class="seg" role="group" aria-label="Status item ${d.no}">${btn('Y', 'Y', 'Patuh')}${btn('N', 'N', 'Tidak patuh')}${btn('NA', 'NA', 'Tak berkaitan')}</div>
    ${iss.map(i => issueHtml(i, bilOf(r, i))).join('')}
    <button class="add-issue ${st === 'N' && !iss.length ? 'strong' : ''}" data-act="iadd" data-no="${d.no}">${ICON.plus} Tambah isu / penemuan</button>
  </article>`;
}

function tiles(i, g, k) {
  const list = i[g][k];
  return list.map((p, n) => {
    const src = p.blob ? blobUrl(p.blob) : p.url;
    return `<button class="ph has" data-act="pview" data-iid="${i.id}" data-g="${g}" data-n="${n}" aria-label="Lihat gambar ${n + 1}">
      <img src="${esc(src)}" alt="Gambar ${n + 1}" loading="lazy">${p.blob && !p.url ? '<i class="up" title="Belum dihantar"></i>' : ''}</button>`;
  }).join('') + `<button class="ph" data-act="padd" data-m="cam" data-iid="${i.id}" data-g="${g}" aria-label="Ambil gambar dengan kamera">${ICON.cam}<span>Kamera</span></button><button class="ph gal" data-act="padd" data-m="gal" data-iid="${i.id}" data-g="${g}" aria-label="Pilih gambar dari galeri">${ICON.img}<span>Galeri</span></button>`;
}
function picChips(i, g, k) {
  const cur = String(i[g][k] || '').split(',').map(x => x.trim().toLowerCase());
  return S.pics.length ? `<div class="pchips">${S.pics.map(p => `<button type="button" class="pchip" data-act="pic" data-iid="${i.id}" data-g="${g}" data-k="${k}" data-v="${esc(p)}" aria-pressed="${cur.includes(p.toLowerCase())}">${esc(p)}</button>`).join('')}</div>` : '';
}
const fld = (i, g, k, label, en) => `<label class="f"><span>${label} <em>${en}</em></span><textarea data-iid="${i.id}" data-g="${g}" data-k="${k}" rows="2">${esc(i[g][k])}</textarea></label>`;

function issueHtml(i, bil) {
  const stt = issueStatus(i);
  const hasB = i.b.diambil || i.b.maklumbalas || i.b.picM || i.b.fotosSelesai.length || i.b.selesai;
  const open = S.expand[i.id] ?? !!hasB;
  return `<section class="issue" id="is-${i.id}" data-iid="${i.id}">
    <div class="ihead"><b>Isu ${esc(bil)}</b><span class="tag st-${stt === 'Terbuka' ? 'open' : stt === 'Selesai' ? 'done' : 'prog'}" data-badge>${stt}</span>
      <button class="icon-sm" data-act="idel" data-iid="${i.id}" aria-label="Padam isu">${ICON.trash}</button></div>
    ${fld(i, 'a', 'penemuan', 'Penemuan', '/ Findings')}
    ${fld(i, 'a', 'tindakan', 'Tindakan yang perlu diambil', '/ Action required')}
    <label class="f"><span>PIC <em>(taip unit atau nama)</em></span><input type="text" data-iid="${i.id}" data-g="a" data-k="pic" list="pics" value="${esc(i.a.pic)}" autocomplete="off"></label>
    ${picChips(i, 'a', 'pic')}
    <div class="photos">${tiles(i, 'a', 'fotos')}</div>
    <button class="after-toggle" data-act="itoggle" data-iid="${i.id}" aria-expanded="${open}"><span>Tindakan diambil & maklumbalas</span><b>${open ? '▴' : '▾'}</b></button>
    ${open ? `<div class="after">
      ${fld(i, 'b', 'diambil', 'Tindakan yang sudah diambil', '/ Action taken')}
      ${fld(i, 'b', 'maklumbalas', 'Maklumbalas', '/ Feedback')}
      <label class="f"><span>PIC <em>(taip unit atau nama)</em></span><input type="text" data-iid="${i.id}" data-g="b" data-k="picM" list="pics" value="${esc(i.b.picM)}" autocomplete="off"></label>
      ${picChips(i, 'b', 'picM')}
      <div class="photos">${tiles(i, 'b', 'fotosSelesai')}</div>
      <label class="chk"><input type="checkbox" data-iid="${i.id}" data-g="b" data-k="selesai" ${i.b.selesai ? 'checked' : ''}> Tandakan isu ini selesai</label>
    </div>` : ''}
  </section>`;
}

function replaceItem(no) {
  const d = S.items.find(x => x.no == no), el = $('#it' + no);
  if (!d || !el) return;
  const t = document.createElement('div'); t.innerHTML = itemHtml(d);
  el.replaceWith(t.firstElementChild);
  $$('#it' + no + ' textarea').forEach(grow);
}

function updateStats() {
  if (S.view !== 'editor' || !S.cur) return;
  const c = counts(S.cur), total = S.items.length, done = total - c.blank;
  const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
  set('#progTxt', `${done}/${total} diisi${c.iss ? ` · ${c.iss} isu` : ''}`);
  const bar = $('#progBar'); if (bar) bar.style.width = (total ? done / total * 100 : 0) + '%';
  set('#stats', `<span class="pill y">${c.y} Y</span><span class="pill n">${c.n} N</span><span class="pill na">${c.na} NA</span>${c.blank ? `<span class="pill b">${c.blank} belum</span>` : ''}`);
  const ch = $('#chips'); if (ch) ch.innerHTML = chipsHtml();
}
const grow = t => { t.style.height = 'auto'; t.style.height = Math.max(76, t.scrollHeight + 2) + 'px'; };

function refreshBadge(i) {
  const el = $(`#is-${i.id} [data-badge]`); if (!el) return;
  const s = issueStatus(i); el.textContent = s; el.className = 'tag st-' + (s === 'Terbuka' ? 'open' : s === 'Selesai' ? 'done' : 'prog');
}

/* ───────── laporan (ikut lakaran) ───────── */
function imgs(list) { return list.length ? `<div class="gm">${list.map(p => `<img src="${esc(p.blob ? blobUrl(p.blob) : p.url)}" alt="">`).join('')}</div>` : ''; }
function reportHtml(r) {
  const m = r.meta, c = counts(r);
  const rows1 = [], rows2 = [];
  S.items.forEach(d => {
    const list = issuesOf(r, d.no).filter(i => !(!i.srv && isBlank(i)));
    list.forEach((i, ix) => {
      const bil = list.length > 1 ? `${d.no}.${ix + 1}` : `${d.no}`;
      rows1.push(`<tr><td class="c">${bil}</td><td><div class="it">${esc(d.itemBM || d.itemEN)}</div>${nl2br(i.a.penemuan)}</td><td>${nl2br(i.a.tindakan)}</td><td class="c">${esc(i.a.pic)}</td><td>${imgs(i.a.fotos)}</td></tr>`);
      const st = issueStatus(i);
      rows2.push(`<tr><td class="c">${bil}</td><td>${nl2br(i.b.diambil) || '<span class="mut">Belum ada tindakan</span>'}</td><td>${nl2br(i.b.maklumbalas)}${i.b.selesai ? '<div class="done">✔ Selesai</div>' : st === 'Dalam tindakan' ? '<div class="mut">Dalam tindakan</div>' : ''}</td><td class="c">${esc(i.b.picM)}</td><td>${imgs(i.b.fotosSelesai)}</td></tr>`);
    });
  });
  const none = '<tr><td colspan="5" class="c mut">Tiada penemuan / isu direkodkan.</td></tr>';
  return `<div class="rpt">
    <h1>LAPORAN GLORY ROUND</h1>
    <div class="rh"><div><b>Tarikh</b> : ${fmtDate(m.tarikh)}</div><div><b>Masa</b> : ${esc(m.masa)}</div><div><b>Tempat</b> : ${esc(m.lokasi)}</div><div><b>Ketua Rondaan</b> : ${esc(m.pegawai)}</div></div>
    <h2>A. Penemuan dan Tindakan yang Perlu Diambil</h2>
    <table><thead><tr><th class="w1">Bil.</th><th class="w2">Penemuan</th><th class="w3">Tindakan yang perlu diambil</th><th class="w4">P.I.C.</th><th class="w5">Gambar</th></tr></thead><tbody>${rows1.join('') || none}</tbody></table>
    <h2>B. Tindakan yang Telah Diambil dan Maklumbalas</h2>
    <table><thead><tr><th class="w1">Bil.</th><th class="w2">Tindakan yang sudah diambil</th><th class="w3">Maklumbalas</th><th class="w4">PIC</th><th class="w5">Gambar</th></tr></thead><tbody>${rows2.join('') || none}</tbody></table>
    <div class="sum">Item diperiksa: ${S.items.length} · Patuh (Y): ${c.y} · Tidak patuh (N): ${c.n} · Tidak berkaitan (NA): ${c.na} · Belum diisi: ${c.blank} · Isu: ${c.iss} (belum selesai: ${c.open})</div>
    <div class="signs">
      <div class="sg"><b>Disediakan oleh:</b><div class="sbox">${sigSrc(r) ? `<img src="${esc(sigSrc(r))}" alt="">` : ''}</div><div>Nama : ${esc(m.semakNama || '')}</div><div>Tarikh : ${fmtDate(m.semakTarikh)}</div></div>
      <div class="sg"><b>Disahkan oleh:</b><div class="sbox"></div><div>Nama : ........................................</div><div>Jawatan : .....................................</div><div>Tarikh : ......................................</div></div>
    </div>
  </div>`;
}
function viewReport() {
  return `
  <header class="top">
    <button class="icon" data-act="back" aria-label="Kembali">${ICON.back}</button>
    <div class="ttl"><b>Laporan</b><small>Pratonton</small></div>
    <button class="btn light" data-act="print">${ICON.print} Cetak / PDF</button>
  </header>
  <main class="wide"><div class="paper-wrap"><div class="paper" id="paper">${reportHtml(S.cur)}</div></div>
    <p class="hint">Laporan dalam format A4 landskap. Tekan <b>Cetak / PDF</b>, kemudian pilih <b>Simpan sebagai PDF</b>.</p></main>`;
}
function fitPaper() {
  const p = $('#paper'); if (!p) return;
  const s = Math.min(1, (document.documentElement.clientWidth - 24) / 1084);
  p.style.zoom = s;
}
async function printReport() {
  $('#printArea').innerHTML = reportHtml(S.cur);
  await Promise.all($$('#printArea img').map(i => i.decode().catch(() => {})));
  setTimeout(() => window.print(), 150);
}

/* ───────── tetapan ───────── */
function viewSettings() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
  <header class="top">
    <button class="icon" data-act="back" aria-label="Kembali">${ICON.back}</button>
    <div class="ttl"><b>Tetapan</b><small>Sambungan Google Sheet</small></div>
  </header>
  <main>
    ${!cfg.url ? `<div class="banner warn"><span>Tampal URL Web App Apps Script untuk menyambung ke Google Sheet.</span></div>` : ''}
    <section class="card">
      <label class="f"><span>URL Web App (Apps Script)</span>
        <input type="url" id="cfgUrl" value="${esc(cfg.url)}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <label class="f"><span>PIN <em>(jika ditetapkan dalam Code.gs)</em></span>
        <input type="password" id="cfgPin" value="${esc(cfg.pin)}" autocomplete="off"></label>
      <label class="f"><span>Nama anda <em>(Ketua Rondaan lalai & direkod pada setiap kemas kini)</em></span>
        <input type="text" id="cfgOfficer" value="${esc(cfg.officer)}" autocomplete="name"></label>
      <label class="chk"><input type="checkbox" id="cfgStamp" ${cfg.stamp ? 'checked' : ''}> Cop tarikh & masa pada gambar</label>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" data-act="cfg-save">Simpan</button>
        <button class="btn ghost" data-act="cfg-test">Uji sambungan</button>
      </div>
      <p class="hint" id="cfgMsg" style="margin:12px 0 0"></p>
    </section>
    <h2 class="sec">Pasang di telefon</h2>
    <section class="card">
      ${standalone ? '<p style="margin:0">App sudah dipasang di skrin utama.</p>'
        : S.installEvt ? '<button class="btn" data-act="install">Pasang app</button>'
        : ios ? '<p style="margin:0">Dalam Safari: tekan <b>Kongsi</b> › <b>Tambah ke Skrin Utama</b>.</p>'
        : '<p style="margin:0">Dalam Chrome: menu ⋮ › <b>Pasang app</b> / <b>Tambah ke skrin utama</b>.</p>'}
    </section>
    <p class="hint" style="margin-top:18px">Glory Round v2 · ${S.records.size} rondaan dalam telefon</p>
  </main>`;
}
function saveSettings() {
  cfg.url = $('#cfgUrl').value.trim(); cfg.pin = $('#cfgPin').value.trim();
  cfg.officer = $('#cfgOfficer').value.trim(); cfg.stamp = $('#cfgStamp').checked; saveCfg();
}
async function testSettings() {
  saveSettings();
  const msg = $('#cfgMsg'); msg.textContent = 'Menguji…';
  try {
    if (!/^https:\/\/script\.google\.com\//.test(cfg.url) && !/^https?:\/\/localhost/.test(cfg.url)) throw new Error('URL mesti bermula dengan https://script.google.com/');
    const j = await apiGet('init');
    if (j.version !== 2) throw new Error('Backend masih versi lama. Tampal Code.gs terkini, jalankan setup, kemudian Deploy versi baharu.');
    S.items = j.items; S.pics = j.pics || []; S.locations = j.locations || [];
    msg.textContent = `Berjaya: ${j.items.length} item semakan, ${j.list.length} rondaan, ${j.open.length} isu terbuka.`;
  } catch (e) { msg.textContent = 'Gagal: ' + e.message; }
}

/* ───────── gambar ───────── */
const urlCache = new WeakMap();
function blobUrl(b) { let u = urlCache.get(b); if (!u) { u = URL.createObjectURL(b); urlCache.set(b, u); } return u; }
async function compress(file, stamp) {
  const MAX = 1280;
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  const sc = Math.min(1, MAX / Math.max(w0, h0)), w = Math.round(w0 * sc), h = Math.round(h0 * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(bmp, 0, 0, w, h);
  if (stamp) {
    const fs = Math.max(14, Math.round(w / 42)), pad = Math.round(fs * .5);
    x.font = `600 ${fs}px system-ui, sans-serif`; x.textBaseline = 'middle';
    const tw = Math.min(w, x.measureText(stamp).width + pad * 2);
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, h - fs - pad * 2, tw, fs + pad * 2);
    x.fillStyle = '#fff'; x.fillText(stamp, pad, h - (fs + pad * 2) / 2, w - pad * 2);
  }
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/jpeg', 0.72));
}
/* tandatangan digital */
let sigDrawn = false, sigDown = false;
function sigCanvas() { return $('#sigCv'); }
function sigClear() { const c = sigCanvas(), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); sigDrawn = false; }
function openSig() {
  const d = $('#sigDlg'); d.showModal();
  const c = sigCanvas(), w = Math.min(560, d.clientWidth - 32);
  c.width = Math.round(w * 2); c.height = Math.round(w * 0.6 * 2); c.style.width = w + 'px'; c.style.height = Math.round(w * 0.6) + 'px';
  sigClear();
}
function sigPos(e) { const c = sigCanvas(), b = c.getBoundingClientRect(); return [(e.clientX - b.left) * c.width / b.width, (e.clientY - b.top) * c.height / b.height]; }
{
  const c = $('#sigCv'), x = c.getContext('2d');
  c.addEventListener('pointerdown', e => { sigDown = true; c.setPointerCapture(e.pointerId); const [px, py] = sigPos(e); x.lineWidth = 5; x.lineCap = x.lineJoin = 'round'; x.strokeStyle = '#111'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + .1, py + .1); x.stroke(); sigDrawn = true; e.preventDefault(); });
  c.addEventListener('pointermove', e => { if (!sigDown) return; const [px, py] = sigPos(e); x.lineTo(px, py); x.stroke(); x.beginPath(); x.moveTo(px, py); e.preventDefault(); });
  ['pointerup', 'pointercancel'].forEach(t => c.addEventListener(t, () => { sigDown = false; }));
}
function sigDone() {
  if (!sigDrawn) { toast('Sila tandatangan dahulu'); return; }
  sigCanvas().toBlob(b => {
    const r = S.cur; if (!r || !b) return;
    r.sigBlob = b; r.meta.semakTarikh = todayStr(); if (!r.meta.semakNama) r.meta.semakNama = cfg.officer || '';
    r.d.meta = true; r.mrev++; touch(r); $('#sigDlg').close(); $('#semak').innerHTML = semakHtml(); toast('Tandatangan disimpan');
  }, 'image/png');
}

let pickTarget = null;
function pick(iid, g, mode) { pickTarget = { iid, g }; const p = $(mode === 'cam' ? '#camPicker' : '#picker'); p.value = ''; p.click(); }
['#picker', '#camPicker'].forEach(sel => $(sel).addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f || !pickTarget || !S.cur) return;
  const { iid, g } = pickTarget; pickTarget = null;
  const i = findIssue(S.cur, iid); if (!i) return;
  try {
    toast('Memproses gambar…');
    const stamp = cfg.stamp ? `${fmtDate(todayStr())} ${nowStr()}${S.cur.meta.lokasi ? ' · ' + S.cur.meta.lokasi : ''}` : '';
    const blob = await compress(f, stamp);
    (g === 'a' ? i.a.fotos : i.b.fotosSelesai).push({ blob });
    g === 'a' ? markA(i) : markB(i);
    touch(S.cur); persist(S.cur); replaceItem(i.no); toast('Gambar ditambah');
  } catch { toast('Gagal memproses gambar'); }
}));

function openLb(iid, g, n) {
  const i = findIssue(S.cur, iid); if (!i) return;
  const p = (g === 'a' ? i.a.fotos : i.b.fotosSelesai)[n]; if (!p) return;
  S.lb = { iid, g, n };
  $('#lbImg').src = p.blob ? blobUrl(p.blob) : p.url;
  $('#lightbox').showModal();
}
function closeLb() { S.lb = null; const d = $('#lightbox'); if (d.open) d.close(); }
$('#lightbox').addEventListener('close', () => { S.lb = null; });

let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ───────── acara ───────── */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, no = el.dataset.no, iid = el.dataset.iid, r = S.cur;
  switch (act) {
    case 'new': startNew(); break;
    case 'open': openRecord(el.dataset.id); break;
    case 'open-issue': openRecord(el.dataset.rid, iid); break;
    case 'tab': S.tab = el.dataset.t; render(); break;
    case 'back': back(); break;
    case 'settings': nav('settings'); break;
    case 'refresh': syncAll(true); break;
    case 'filter': S.filter = el.dataset.f; $('#list').innerHTML = listHtml(); $('#chips').innerHTML = chipsHtml(); $$('#list textarea').forEach(grow); break;
    case 'status': {
      const s = el.dataset.s;
      r.st[no] = r.st[no] === s ? '' : s; r.d.st[no] = true;
      if (r.st[no] === 'N' && !issuesOf(r, no).length) r.issues.push(newIssue(no));
      touch(r); replaceItem(no); break;
    }
    case 'iadd': r.issues.push(newIssue(no)); touch(r); replaceItem(no); break;
    case 'idel': {
      const i = findIssue(r, iid); if (!i) break;
      if (!isBlank(i) && !confirm('Padam isu ini?')) break;
      if (i.srv) { i.del = true; i.da = true; } else r.issues = r.issues.filter(x => x !== i);
      touch(r); replaceItem(i.no); break;
    }
    case 'itoggle': { const i = findIssue(r, iid), cur = S.expand[iid] ?? !!(i.b.diambil || i.b.maklumbalas || i.b.picM || i.b.fotosSelesai.length || i.b.selesai); S.expand[iid] = !cur; replaceItem(i.no); break; }
    case 'pic': {
      const i = findIssue(r, iid), g = el.dataset.g, k = el.dataset.k, v = el.dataset.v;
      const parts = String(i[g][k] || '').split(',').map(x => x.trim()).filter(Boolean);
      const at = parts.findIndex(x => x.toLowerCase() === v.toLowerCase());
      if (at >= 0) parts.splice(at, 1); else parts.push(v);
      i[g][k] = parts.join(', '); g === 'a' ? markA(i) : markB(i); touch(r); replaceItem(i.no); break;
    }
    case 'padd': pick(iid, el.dataset.g, el.dataset.m); break;
    case 'sig-open': openSig(); break;
    case 'sig-clear': r.sigBlob = null; r.meta.semakTtd = ''; r.meta.semakTarikh = ''; r.d.meta = true; r.mrev++; touch(r); $('#semak').innerHTML = semakHtml(); break;
    case 'sig-undo': sigClear(); break;
    case 'sig-cancel': $('#sigDlg').close(); break;
    case 'sig-ok': sigDone(); break;
    case 'pview': openLb(iid, el.dataset.g, +el.dataset.n); break;
    case 'lb-close': closeLb(); break;
    case 'lb-remove': {
      if (!S.lb) break;
      const { iid: x, g, n } = S.lb, i = findIssue(r, x);
      (g === 'a' ? i.a.fotos : i.b.fotosSelesai).splice(n, 1); g === 'a' ? markA(i) : markB(i);
      touch(r); closeLb(); replaceItem(i.no); break;
    }
    case 'send': {
      const m = r.meta, miss = !m.lokasi ? 'lokasi' : !m.tarikh ? 'tarikh' : !m.pegawai ? 'pegawai' : '';
      if (miss) { window.scrollTo(0, 0); $(`[data-meta=${miss}]`)?.focus(); toast('Sila isi ' + (miss === 'lokasi' ? 'tempat' : miss === 'pegawai' ? 'ketua rondaan' : miss) + ' dahulu'); break; }
      r.fresh = false; await persist(r);
      if (!cfg.url) { toast('Tetapkan URL Apps Script dahulu'); nav('settings'); break; }
      await syncAll(true); break;
    }
    case 'report': nav('report'); break;
    case 'print': printReport(); break;
    case 'delete': {
      if (!confirm('Padam rondaan ini?' + (r.serverUpdated ? ' (juga dipadam daripada Google Sheet untuk semua pengguna)' : ''))) break;
      try {
        if (r.serverUpdated) { if (!navigator.onLine) { toast('Perlu internet untuk memadam'); break; } await apiPost('delete', { id: r.id }); }
        S.records.delete(r.id); await DB.del(r.id).catch(() => {}); S.cur = null; back(); toast('Rondaan dipadam');
      } catch (err) { toast('Gagal memadam: ' + err.message); }
      break;
    }
    case 'cfg-save': saveSettings(); toast('Tetapan disimpan'); if (cfg.url) { back(); setTimeout(() => syncAll(true), 400); } break;
    case 'cfg-test': await testSettings(); break;
    case 'install': S.installEvt?.prompt(); S.installEvt = null; break;
  }
});

document.addEventListener('input', e => {
  const t = e.target, r = S.cur;
  if (!r) return;
  if (t.dataset.meta) { r.meta[t.dataset.meta] = t.value; r.d.meta = true; r.mrev++; touch(r); return; }
  if (t.dataset.iid && t.dataset.k) {
    const i = findIssue(r, t.dataset.iid); if (!i) return;
    const g = t.dataset.g, k = t.dataset.k;
    if (t.type === 'checkbox') return;
    i[g][k] = t.value; g === 'a' ? markA(i) : markB(i); touch(r);
    if (t.tagName === 'TEXTAREA') grow(t);
    if (g === 'b') refreshBadge(i);
  }
});
document.addEventListener('change', e => {
  const t = e.target, r = S.cur;
  if (r && t.type === 'checkbox' && t.dataset.k === 'selesai') {
    const i = findIssue(r, t.dataset.iid); if (!i) return;
    i.b.selesai = t.checked; markB(i); touch(r); refreshBadge(i);
  }
});

addEventListener('online', () => { if (S.view === 'home') render(); syncAll(); });
addEventListener('offline', () => { if (S.view === 'home') render(); else updateSyncUi(); });
addEventListener('resize', () => { if (S.view === 'report') fitPaper(); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (S.view === 'settings') render(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.cur) persist(S.cur); });

/* ───────── mula ───────── */
(async function init() {
  history.replaceState(null, '');
  try {
    S.items = (await DB.kvGet('items')) || []; S.locations = (await DB.kvGet('locs')) || [];
    S.pics = (await DB.kvGet('pics')) || []; S.openIssues = (await DB.kvGet('open')) || [];
    for (const r of await DB.all()) {
      if (r.v !== SCHEMA || r.fresh) { DB.del(r.id).catch(() => {}); continue; } // data v1 / rondaan kosong dibuang
      r.issues?.forEach(i => { i.a.fotos ||= []; i.b.fotosSelesai ||= []; });
      S.records.set(r.id, r);
    }
  } catch { /* IndexedDB tidak tersedia */ }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (!cfg.url) S.view = 'settings';
  render();
  if (cfg.url) syncAll();
})();
