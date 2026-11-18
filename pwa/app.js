'use strict';
/* GLORY ROUND – PWA rondaan keselamatan & utiliti luar
   Data: Google Sheet (melalui Apps Script). Gambar: Google Drive. Luar talian: IndexedDB. */

/* ───────── pembantu ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const two = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; };
const nowStr = () => { const d = new Date(); return `${two(d.getHours())}:${two(d.getMinutes())}`; };
const fmtDate = s => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (s || ''); };
const genId = () => { const d = new Date(); const r = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X'); return `GR-${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${r}`; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ICON = {
  loop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M19.5 3v4.2h-4.2"/><path d="M8.6 12.3l2.4 2.4 4.2-4.8"/></svg>',
  sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8"/><path d="M21 3v5h-5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 15v4h14v-4"/></svg>'
};

/* ───────── tetapan ───────── */
const DEF = Object.assign({ url: '', pin: '', officer: '' }, window.GLORY_CONFIG || {});
const cfg = (() => {
  let st = {};
  try { st = JSON.parse(localStorage.getItem('gr.cfg') || '{}'); } catch { /* abaikan */ }
  return {
    url: st.url || DEF.url || '', pin: st.pin || DEF.pin || '', officer: st.officer || DEF.officer || '',
    stamp: st.stamp === undefined ? true : !!st.stamp
  };
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
  view: 'home', items: [], locations: [], records: new Map(), cur: null,
  filter: 'all', syncing: false, progress: '', open: {}, lb: null, installEvt: null, lastSync: ''
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
    body: JSON.stringify({ action, pin: cfg.pin || '', ...body })
  }, ms);
}

/* ───────── model rekod ───────── */
function blankItem() { return { status: '', penemuan: '', tindakan: '', foto: null, selesai: null }; }
function normalize(rec) {
  rec.items ||= {};
  S.items.forEach(d => { rec.items[d.no] ||= blankItem(); });
  return rec;
}
function newRecord() {
  return normalize({
    id: genId(), meta: { lokasi: '', tarikh: todayStr(), masa: nowStr(), pegawai: cfg.officer || '' },
    dirty: true, fresh: true, loaded: true, rev: 0, serverUpdated: '', items: {}
  });
}
function counts(rec) {
  if (!rec.loaded) return rec.counts || { y: 0, n: 0, na: 0, blank: 0 };
  const c = { y: 0, n: 0, na: 0, blank: 0 };
  const defs = S.items.length ? S.items : Object.keys(rec.items).map(no => ({ no }));
  defs.forEach(d => {
    const st = (rec.items[d.no] || {}).status;
    if (st === 'Y') c.y++; else if (st === 'N') c.n++; else if (st === 'NA') c.na++; else c.blank++;
  });
  return c;
}
const persist = rec => DB.put(rec).catch(() => { /* IndexedDB tidak tersedia */ });
let persistTimer;
function touch(rec) {
  rec.rev = (rec.rev || 0) + 1; rec.dirty = true; rec.fresh = false;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persist(rec), 300);
  updateStats();
}
const recKey = r => `${r.meta.tarikh || ''}${r.meta.masa || ''}${r.serverUpdated || ''}${r.id}`;

/* ───────── segerak ───────── */
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });

async function syncRecord(rec) {
  const pend = [];
  Object.keys(rec.items).forEach(no => ['foto', 'selesai'].forEach(k => {
    const ph = rec.items[no][k];
    if (ph && ph.blob && !ph.url) pend.push({ no, k, ph });
  }));
  let i = 0;
  for (const p of pend) {
    S.progress = `Menghantar gambar ${++i}/${pend.length}`; updateSyncUi();
    const j = await apiPost('photo', { id: rec.id, no: +p.no, kind: p.k, mime: p.ph.blob.type || 'image/jpeg', data: await blobToB64(p.ph.blob) }, 90000);
    p.ph.url = j.url;
    await persist(rec);
  }
  S.progress = 'Menyimpan ke Google Sheet'; updateSyncUi();
  const rev = rec.rev || 0;
  const items = {};
  Object.entries(rec.items).forEach(([no, it]) => {
    items[no] = { status: it.status, penemuan: it.penemuan, tindakan: it.tindakan, foto: it.foto?.url || '', selesai: it.selesai?.url || '' };
  });
  const j = await apiPost('save', { id: rec.id, meta: rec.meta, items });
  rec.serverUpdated = j.updated; rec.counts = j.counts; rec.fresh = false;
  rec.dirty = (rec.rev || 0) !== rev;
  await persist(rec);
}

async function pull() {
  const j = await apiGet('init');
  S.items = j.items; S.locations = j.locations || [];
  await DB.kvSet('items', S.items).catch(() => {});
  await DB.kvSet('locs', S.locations).catch(() => {});
  const seen = new Set();
  for (const e of j.list) {
    seen.add(e.id);
    const local = S.records.get(e.id);
    if (local && (local.dirty || local === S.cur)) continue;
    if (local && local.loaded && local.serverUpdated === e.updated) { local.counts = { y: e.y, n: e.n, na: e.na, blank: e.blank }; continue; }
    const stub = {
      id: e.id, meta: { lokasi: e.lokasi, tarikh: e.tarikh, masa: e.masa, pegawai: e.pegawai },
      counts: { y: e.y, n: e.n, na: e.na, blank: e.blank }, serverUpdated: e.updated, loaded: false, dirty: false, items: {}, rev: 0
    };
    S.records.set(e.id, stub);
    await persist(stub);
  }
  if (j.list.length < (j.limit || 200)) {
    for (const [id, r] of [...S.records]) {
      if (!seen.has(id) && !r.dirty && r !== S.cur && r.serverUpdated) { S.records.delete(id); DB.del(id).catch(() => {}); }
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
  for (const rec of [...S.records.values()].filter(r => r.dirty && !r.fresh)) {
    try { await syncRecord(rec); sent++; } catch (e) { err = e.message; }
  }
  try { await pull(); } catch (e) { err ||= e.message; }
  S.syncing = false; S.progress = '';
  if (S.view === 'home') render(); else updateSyncUi();
  if (err && /PIN/.test(err) && S.view !== 'settings') { toast('PIN diperlukan. Masukkan PIN dalam Tetapan.'); nav('settings'); }
  else if (err) toast('Ralat segerak: ' + err);
  else if (manual || sent) toast(sent ? `${sent} rondaan disimpan ke Google Sheet` : 'Sudah dikemas kini');
}

/* ───────── antara muka: pandu arah ───────── */
function nav(view) {
  if (view !== 'home' && S.view === 'home') history.pushState({ v: view }, '');
  S.view = view; render(); window.scrollTo(0, 0);
}
function back() { if (history.state && history.state.v) history.back(); else toHome(); }
function toHome() {
  const rec = S.cur;
  if (rec) {
    const untouched = rec.fresh && !rec.meta.lokasi && Object.values(rec.items).every(it => !it.status && !it.penemuan && !it.tindakan && !it.foto && !it.selesai);
    if (untouched) { S.records.delete(rec.id); DB.del(rec.id).catch(() => {}); } else persist(rec);
    S.cur = null;
  }
  S.view = 'home'; S.filter = 'all'; S.open = {};
  render(); window.scrollTo(0, 0);
  if (rec) syncAll();
}
addEventListener('popstate', () => { if (S.view !== 'home') toHome(); });

async function openRecord(id) {
  const rec = S.records.get(id);
  if (!rec) return;
  if (!S.items.length) { toast('Senarai semak belum dimuat. Sambung internet sekali.'); return; }
  if (!rec.loaded) {
    if (!navigator.onLine) { toast('Perlu internet untuk memuat rondaan ini'); return; }
    toast('Memuat rondaan…');
    try {
      const j = await apiGet('get', { id });
      rec.meta = j.record.meta; rec.serverUpdated = j.record.updated; rec.items = {};
      Object.entries(j.record.items).forEach(([no, it]) => {
        rec.items[no] = { status: it.status, penemuan: it.penemuan, tindakan: it.tindakan, foto: it.foto ? { url: it.foto } : null, selesai: it.selesai ? { url: it.selesai } : null };
      });
      rec.loaded = true; rec.dirty = false;
      await persist(rec);
    } catch (e) { toast('Gagal memuat: ' + e.message); return; }
  }
  normalize(rec);
  S.cur = rec; S.filter = 'all'; S.open = {};
  nav('editor');
}

function startNew() {
  if (!S.items.length) { toast(cfg.url ? 'Senarai semak belum dimuat. Sambung internet sekali.' : 'Tetapkan URL Apps Script dahulu'); if (!cfg.url) nav('settings'); return; }
  const rec = newRecord();
  S.records.set(rec.id, rec); S.cur = rec; S.filter = 'all'; S.open = {};
  nav('editor');
}

/* ───────── paparan ───────── */
function render() {
  const app = $('#app');
  app.innerHTML = S.view === 'editor' && S.cur ? viewEditor() : S.view === 'settings' ? viewSettings() : viewHome();
  if (S.view === 'editor') { $$('textarea', app).forEach(grow); updateStats(); }
}

function syncLabel() {
  if (S.syncing) return S.progress || 'Menyegerak…';
  if (!navigator.onLine) return 'Luar talian';
  const n = [...S.records.values()].filter(r => r.dirty && !r.fresh).length;
  return n ? `${n} belum dihantar` : (S.lastSync ? `Disegerak ${S.lastSync}` : 'Sedia');
}
function updateSyncUi() {
  const el = $('#syncChip'); if (el) el.textContent = syncLabel();
  const b = $('#sendBtn');
  if (b) { b.disabled = S.syncing; b.innerHTML = S.syncing ? `<span class="spin">${ICON.sync}</span> ${esc(S.progress || '…')}` : `${ICON.send} Simpan & Hantar`; }
  const rf = $('[data-act=refresh] svg'); if (rf) rf.classList.toggle('spin', S.syncing);
}

function viewHome() {
  const recs = [...S.records.values()].sort((a, b) => recKey(b).localeCompare(recKey(a)));
  const pending = recs.filter(r => r.dirty && !r.fresh).length;
  let banner = '';
  if (!cfg.url) banner = `<div class="banner warn"><span>URL Google Sheet belum ditetapkan.</span><button class="btn" data-act="settings">Tetapkan</button></div>`;
  else if (!navigator.onLine) banner = `<div class="banner info"><span>Luar talian. Rondaan disimpan dalam telefon dan dihantar apabila ada internet.</span></div>`;
  else if (pending) banner = `<div class="banner warn"><span>${pending} rondaan belum dihantar ke Google Sheet.</span><button class="btn" data-act="refresh">Hantar</button></div>`;
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
    <h2 class="sec">Rondaan terkini</h2>
    ${recs.length ? recs.map(recCard).join('') : `<div class="empty">Belum ada rondaan.<br>Tekan <b>Rondaan Baharu</b> untuk mula.</div>`}
  </main>`;
}

function recCard(r) {
  const c = counts(r);
  return `<button class="rec" data-act="open" data-id="${esc(r.id)}">
    <div class="r1"><b>${esc(r.meta.lokasi || 'Tiada lokasi')}</b>${r.dirty && !r.fresh ? '<span class="tag warn">Belum dihantar</span>' : '<span class="tag ok">Tersimpan</span>'}</div>
    <div class="r2">${fmtDate(r.meta.tarikh)} · ${esc(r.meta.masa)} · ${esc(r.meta.pegawai || '—')}</div>
    <div class="r3"><span class="pill y">${c.y} Y</span><span class="pill n">${c.n} N</span><span class="pill na">${c.na} NA</span><span class="pill b">${c.blank} belum</span></div>
  </button>`;
}

function viewEditor() {
  const r = S.cur, m = r.meta;
  return `
  <header class="top">
    <button class="icon" data-act="back" aria-label="Kembali">${ICON.back}</button>
    <div class="ttl"><b>Rondaan</b><small id="progTxt"></small></div>
    <span class="chip-s" id="syncChip">${esc(syncLabel())}</span>
    <button class="icon" data-act="print" aria-label="Cetak">${ICON.print}</button>
    <button class="icon" data-act="delete" aria-label="Padam">${ICON.trash}</button>
  </header>
  <div class="progress"><i id="progBar"></i></div>
  <main>
    <section class="card meta">
      <label class="f"><span>Lokasi Rondaan <em>/ Inspection Location</em></span>
        <input type="text" data-meta="lokasi" list="locs" value="${esc(m.lokasi)}" placeholder="cth: Blok A – Kawasan luar" autocomplete="off"></label>
      <datalist id="locs">${S.locations.map(l => `<option value="${esc(l)}">`).join('')}</datalist>
      <div class="grid2">
        <label class="f"><span>Tarikh <em>/ Date</em></span><input type="date" data-meta="tarikh" value="${esc(m.tarikh)}"></label>
        <label class="f"><span>Masa <em>/ Time</em></span><input type="time" data-meta="masa" value="${esc(m.masa)}"></label>
      </div>
      <label class="f" style="margin:0"><span>Pegawai Pemeriksa <em>/ Inspecting Officer</em></span>
        <input type="text" data-meta="pegawai" value="${esc(m.pegawai)}" autocomplete="name"></label>
    </section>
    <div class="chips" id="chips">${chipsHtml()}</div>
    <div id="list">${listHtml()}</div>
  </main>
  <footer class="bar">
    <div class="stats" id="stats"></div>
    <button class="btn" id="sendBtn" data-act="send">${ICON.send} Simpan & Hantar</button>
  </footer>`;
}

function chipsHtml() {
  const c = counts(S.cur);
  const f = S.filter;
  const chip = (k, label) => `<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${f === k}">${label}</button>`;
  return chip('all', `Semua (${S.items.length})`) + chip('blank', `Belum diisi (${c.blank})`) + chip('N', `Tidak patuh (${c.n})`);
}

function listHtml() {
  const r = S.cur;
  let prev = '', out = '';
  S.items.forEach(d => {
    const it = r.items[d.no];
    if (S.filter === 'blank' && it.status) return;
    if (S.filter === 'N' && it.status !== 'N') return;
    if (d.catEN !== prev) { prev = d.catEN; out += `<div class="cat">${esc(d.catBM || d.catEN)}<small>${esc(d.catEN)}</small></div>`; }
    out += itemHtml(d, it);
  });
  return out || `<div class="empty">Tiada item dalam paparan ini.</div>`;
}

function photoTile(no, k, ph, label) {
  if (ph) {
    const src = ph.blob ? blobUrl(ph.blob) : ph.url;
    return `<button class="ph has" data-act="photo" data-no="${no}" data-k="${k}" aria-label="${esc(label)}">
      <img src="${esc(src)}" alt="${esc(label)}" loading="lazy">${ph.blob && !ph.url ? '<i class="up" title="Belum dihantar"></i>' : ''}<span class="lbl">${esc(label)}</span></button>`;
  }
  return `<button class="ph" data-act="photo" data-no="${no}" data-k="${k}" aria-label="Ambil ${esc(label)}">${ICON.cam}<span>${esc(label)}</span></button>`;
}

function itemHtml(d, it) {
  const st = it.status;
  const hasText = !!(it.penemuan || it.tindakan);
  const showMore = st === 'N' || hasText || S.open[d.no];
  const btn = (s, big, sm) => `<button data-act="status" data-no="${d.no}" data-s="${s}" aria-pressed="${st === s}">${big}<small>${sm}</small></button>`;
  return `<article class="item" id="it${d.no}" data-no="${d.no}" data-s="${st}">
    <div class="row"><span class="no">${d.no}</span><div>
      <p class="bm">${esc(d.itemBM || d.itemEN)}</p>${d.itemBM && d.itemEN ? `<p class="en">${esc(d.itemEN)}</p>` : ''}</div></div>
    <div class="seg" role="group" aria-label="Status item ${d.no}">
      ${btn('Y', 'Y', 'Patuh')}${btn('N', 'N', 'Tidak patuh')}${btn('NA', 'NA', 'Tak berkaitan')}
    </div>
    ${showMore ? `<div class="more">
      <label class="f"><span>Penemuan <em>/ Findings</em></span><textarea data-t="penemuan" data-no="${d.no}" rows="2">${esc(it.penemuan)}</textarea></label>
      <label class="f" style="margin-bottom:0"><span>Tindakan <em>/ Action</em></span><textarea data-t="tindakan" data-no="${d.no}" rows="2">${esc(it.tindakan)}</textarea></label>
    </div>` : ''}
    <div class="photos">
      ${photoTile(d.no, 'foto', it.foto, 'Gambar')}
      ${st === 'N' || it.selesai ? photoTile(d.no, 'selesai', it.selesai, 'Gambar Selesai') : ''}
      ${!showMore ? `<button class="link-btn" data-act="note" data-no="${d.no}">+ Catatan</button>` : ''}
    </div>
  </article>`;
}

function replaceItem(no) {
  const d = S.items.find(x => x.no == no); if (!d) return;
  const el = $('#it' + no); if (!el) return;
  const t = document.createElement('div');
  t.innerHTML = itemHtml(d, S.cur.items[no]);
  el.replaceWith(t.firstElementChild);
  $$('textarea', $('#it' + no)).forEach(grow);
}

function updateStats() {
  if (S.view !== 'editor' || !S.cur) return;
  const c = counts(S.cur), total = S.items.length, done = total - c.blank;
  const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
  set('#progTxt', `${done}/${total} diisi`);
  const bar = $('#progBar'); if (bar) bar.style.width = (total ? done / total * 100 : 0) + '%';
  set('#stats', `<span class="pill y">${c.y} Y</span><span class="pill n">${c.n} N</span><span class="pill na">${c.na} NA</span>${c.blank ? `<span class="pill b">${c.blank} belum</span>` : ''}`);
  const ch = $('#chips'); if (ch) ch.innerHTML = chipsHtml();
}

const grow = t => { t.style.height = 'auto'; t.style.height = Math.max(84, t.scrollHeight + 2) + 'px'; };

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
      <label class="f"><span>Nama pegawai lalai</span>
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
    <p class="hint" style="margin-top:18px">Glory Round · data dalam telefon: ${S.records.size} rondaan</p>
  </main>`;
}

/* ───────── gambar ───────── */
const urlCache = new WeakMap();
function blobUrl(b) { let u = urlCache.get(b); if (!u) { u = URL.createObjectURL(b); urlCache.set(b, u); } return u; }

async function compress(file, stamp) {
  const MAX = 1280;
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  const sc = Math.min(1, MAX / Math.max(w0, h0));
  const w = Math.round(w0 * sc), h = Math.round(h0 * sc);
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

let pickTarget = null;
function pick(no, k) { pickTarget = { no, k }; const p = $('#picker'); p.value = ''; p.click(); }
$('#picker').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f || !pickTarget || !S.cur) return;
  const { no, k } = pickTarget; pickTarget = null;
  try {
    toast('Memproses gambar…');
    const stamp = cfg.stamp ? `${fmtDate(todayStr())} ${nowStr()}${S.cur.meta.lokasi ? ' · ' + S.cur.meta.lokasi : ''}` : '';
    const blob = await compress(f, stamp);
    S.cur.items[no][k] = { blob };
    touch(S.cur); persist(S.cur);
    replaceItem(no);
    if (S.lb) closeLb();
    toast('Gambar ditambah');
  } catch { toast('Gagal memproses gambar'); }
});

function openLb(no, k) {
  const ph = S.cur.items[no][k]; if (!ph) return;
  S.lb = { no, k };
  $('#lbImg').src = ph.blob ? blobUrl(ph.blob) : ph.url;
  $('#lightbox').showModal();
}
function closeLb() { S.lb = null; const d = $('#lightbox'); if (d.open) d.close(); }
$('#lightbox').addEventListener('close', () => { S.lb = null; });

/* ───────── cetak ───────── */
async function printReport() {
  const r = S.cur, m = r.meta, c = counts(r);
  const cat = d => `${esc(d.catBM || '')}<br><i>${esc(d.catEN || '')}</i>`;
  const rows = S.items.map(d => {
    const it = r.items[d.no];
    const img = ph => ph ? `<img src="${esc(ph.blob ? blobUrl(ph.blob) : ph.url)}" alt="">` : '';
    return `<tr><td>${d.no}</td><td>${cat(d)}</td><td>${esc(d.itemBM || '')}<br><i>${esc(d.itemEN || '')}</i></td>
      <td class="st">${esc(it.status)}</td><td>${esc(it.penemuan).replace(/\n/g, '<br>')}</td><td>${esc(it.tindakan).replace(/\n/g, '<br>')}</td>
      <td>${img(it.foto)}</td><td>${img(it.selesai)}</td></tr>`;
  }).join('');
  $('#printArea').innerHTML = `<h1>GLORY ROUND</h1><h2>RONDAAN KESELAMATAN & UTILITI LUAR / OUTDOOR SAFETY & UTILITIES INSPECTION</h2>
    <div class="pm"><div><b>Lokasi / Location:</b> ${esc(m.lokasi)}</div><div><b>Tarikh / Date:</b> ${fmtDate(m.tarikh)}</div>
    <div><b>Pegawai / Officer:</b> ${esc(m.pegawai)}</div><div><b>Masa / Time:</b> ${esc(m.masa)}</div></div>
    <table><thead><tr><th>Bil.</th><th>Kategori</th><th>Item Pemeriksaan</th><th>Status</th><th>Penemuan</th><th>Tindakan</th><th>Gambar</th><th>Gambar Selesai</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sum">Patuh (Y): ${c.y} &nbsp;|&nbsp; Tidak Patuh (N): ${c.n} &nbsp;|&nbsp; Tidak Berkaitan (NA): ${c.na} &nbsp;|&nbsp; Belum diisi: ${c.blank}</div>`;
  await Promise.all($$('#printArea img').map(i => i.decode().catch(() => {})));
  setTimeout(() => window.print(), 150);
}

/* ───────── toast ───────── */
let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ───────── acara ───────── */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, no = el.dataset.no;
  switch (act) {
    case 'new': startNew(); break;
    case 'open': openRecord(el.dataset.id); break;
    case 'back': back(); break;
    case 'settings': nav('settings'); break;
    case 'refresh': syncAll(true); break;
    case 'filter': S.filter = el.dataset.f; $('#list').innerHTML = listHtml(); $('#chips').innerHTML = chipsHtml(); $$('#list textarea').forEach(grow); break;
    case 'status': {
      const it = S.cur.items[no], s = el.dataset.s;
      it.status = it.status === s ? '' : s;
      touch(S.cur); replaceItem(no);
      break;
    }
    case 'note': S.open[no] = true; replaceItem(no); $('#it' + no + ' textarea')?.focus(); break;
    case 'photo': {
      const k = el.dataset.k;
      if (S.cur.items[no][k]) openLb(no, k); else pick(no, k);
      break;
    }
    case 'lb-close': closeLb(); break;
    case 'lb-replace': if (S.lb) { const { no: n, k } = S.lb; pick(n, k); } break;
    case 'lb-remove': if (S.lb) { const { no: n, k } = S.lb; S.cur.items[n][k] = null; touch(S.cur); closeLb(); replaceItem(n); } break;
    case 'send': {
      const r = S.cur, m = r.meta;
      const miss = !m.lokasi ? 'lokasi' : !m.tarikh ? 'tarikh' : !m.pegawai ? 'pegawai' : '';
      if (miss) { window.scrollTo(0, 0); $(`[data-meta=${miss}]`)?.focus(); toast('Sila isi ' + miss + ' dahulu'); break; }
      r.fresh = false; r.dirty = true; await persist(r);
      if (!cfg.url) { toast('Tetapkan URL Apps Script dahulu'); nav('settings'); break; }
      await syncAll(true);
      break;
    }
    case 'print': printReport(); break;
    case 'delete': {
      if (!confirm('Padam rondaan ini?' + (S.cur.serverUpdated ? ' (juga dipadam daripada Google Sheet)' : ''))) break;
      const r = S.cur;
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

function saveSettings() {
  cfg.url = $('#cfgUrl').value.trim(); cfg.pin = $('#cfgPin').value.trim();
  cfg.officer = $('#cfgOfficer').value.trim(); cfg.stamp = $('#cfgStamp').checked;
  saveCfg();
}
async function testSettings() {
  saveSettings();
  const msg = $('#cfgMsg'); msg.textContent = 'Menguji…';
  try {
    if (!/^https:\/\/script\.google\.com\//.test(cfg.url)) throw new Error('URL mesti bermula dengan https://script.google.com/');
    const j = await apiGet('init');
    S.items = j.items; S.locations = j.locations || [];
    await DB.kvSet('items', S.items).catch(() => {});
    msg.textContent = `Berjaya: ${j.items.length} item semakan, ${j.list.length} rondaan dalam Sheet.`;
  } catch (e) { msg.textContent = 'Gagal: ' + e.message; }
}

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.meta && S.cur) { S.cur.meta[t.dataset.meta] = t.value; touch(S.cur); }
  else if (t.dataset.t && S.cur) { S.cur.items[t.dataset.no][t.dataset.t] = t.value; touch(S.cur); grow(t); }
});

addEventListener('online', () => { if (S.view === 'home') render(); syncAll(); });
addEventListener('offline', () => { if (S.view === 'home') render(); else updateSyncUi(); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (S.view === 'settings') render(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.cur) persist(S.cur); });

/* ───────── mula ───────── */
(async function init() {
  history.replaceState(null, '');
  try {
    S.items = (await DB.kvGet('items')) || [];
    S.locations = (await DB.kvGet('locs')) || [];
    for (const r of await DB.all()) {
      if (r.fresh) { DB.del(r.id).catch(() => {}); continue; } // rondaan kosong yang tidak sempat dibuang
      S.records.set(r.id, r);
    }
  } catch { /* IndexedDB tidak tersedia */ }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (!cfg.url) S.view = 'settings';
  render();
  if (cfg.url) syncAll();
})();
