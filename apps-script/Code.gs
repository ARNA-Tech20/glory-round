/**
 * GLORY ROUND v2 – Backend untuk PWA (Google Apps Script)
 *
 * Pasang: buka Google Sheet > Extensions > Apps Script > tampal fail ini > Run setup()
 * > Deploy > New deployment > Web app (Execute as: Me, Access: Anyone) > salin URL /exec.
 * Selepas mengemas kini kod: Deploy > Manage deployments > Edit > Version: New version.
 *
 * Tab:
 *   Senarai Semak : 23 item borang (Aktif = N untuk sorok)
 *   Senarai PIC   : cadangan PIC (unit / nama) yang dipaparkan sebagai butang dalam app
 *   Rondaan       : 1 baris setiap rondaan (tempat, tarikh, masa, ketua rondaan, jumlah)
 *   Butiran       : 1 baris setiap item setiap rondaan (status Y / N / NA)
 *   Isu           : 1 baris setiap isu (penemuan, tindakan perlu, PIC, gambar, tindakan diambil, maklumbalas)
 */

const PIN = '';                        // PIN pilihan untuk mod lama sahaja (digunakan jika tab "Pengguna" kosong).
const SHEET_ID = '';                   // Hanya jika skrip dicipta di script.google.com (bukan dari dalam Sheet)
const PUBLIC_PHOTOS = true;            // true = gambar boleh dipapar dalam app & sheet (sesiapa yang ada pautan)
const FOLDER_NAME = 'GLORY ROUND - Gambar';
const LIST_LIMIT = 200;
const OPEN_LIMIT = 400;

const SH = { items: 'Senarai Semak', pic: 'Senarai PIC', users: 'Pengguna', rondaan: 'Rondaan', butiran: 'Butiran', isu: 'Isu' };
const HEAD = {
  items: ['No', 'Kategori (EN)', 'Kategori (BM)', 'Item (EN)', 'Item (BM)', 'Aktif'],
  pic: ['PIC (unit / nama)'],
  users: ['Nama', 'ID Pengguna', 'Kata Laluan', 'Peranan', 'Aktif'],
  rondaan: ['ID', 'Tempat', 'Tarikh', 'Masa', 'Ketua Rondaan', 'Patuh (Y)', 'Tidak Patuh (N)', 'NA', 'Belum Diisi', 'Jumlah Isu', 'Isu Belum Selesai', 'Dikemas Kini', 'Disemak Oleh', 'Tandatangan Semakan', 'Tarikh Semakan', 'Masa Tamat'],
  butiran: ['ID Rondaan', 'No', 'Kategori', 'Item', 'Status', 'Bil. Isu', 'Dikemas Kini'],
  isu: ['ID Isu', 'ID Rondaan', 'No', 'Bil.', 'Penemuan', 'Tindakan Perlu Diambil', 'PIC (Tindakan)', 'Gambar',
    'Tindakan Diambil', 'Maklumbalas', 'PIC (Maklumbalas)', 'Gambar Selesai', 'Selesai', 'Status Isu',
    'Dicipta', 'Dikemas Kini', 'Oleh (Penemuan)', 'Oleh (Maklumbalas)', 'Dipadam', 'Pratonton Gambar', 'Pratonton Selesai']
};
const SEED_PIC = []; // PIC diisi sendiri oleh pengguna dalam app (atau tambah senarai pantas di tab 'Senarai PIC')

// [No, Kategori EN, Kategori BM, Item EN, Item BM]
const SEED = [
  [1, "Common Areas & Housekeeping", "Kawasan Umum & Kebersihan", "Main entrance, lobby and reception area cleanliness maintained.", "Kebersihan pintu masuk utama, lobi dan kaunter penerimaan tetamu sentiasa terjaga."],
  [2, "Common Areas & Housekeeping", "Kawasan Umum & Kebersihan", "Public waiting areas and seating condition well-kept.", "Ruang menunggu awam dan keadaan tempat duduk diselenggara dengan baik."],
  [3, "Common Areas & Housekeeping", "Kawasan Umum & Kebersihan", "Public toilets cleanliness and availability of supplies monitored.", "Kebersihan tandas awam serta ketersediaan bekalan keperluan dipantau."],
  [4, "Common Areas & Housekeeping", "Kawasan Umum & Kebersihan", "Corridors, staircases and lifts clean and functional.", "Koridor, tangga dan lif berada dalam keadaan bersih serta berfungsi."],
  [5, "Common Areas & Housekeeping", "Kawasan Umum & Kebersihan", "Waste bins, waste collection and general waste segregation strictly followed.", "Tong sampah, pengumpulan sisa dan pengasingan sisa am dilaksanakan mengikut ketetapan."],
  [6, "Common Areas & Housekeeping", "Kawasan Umum & Kebersihan", "Landscaping, external grounds and parking areas debris-free.", "Landskap, kawasan luar bangunan dan tempat letak kenderaan bebas daripada sampah atau sisa."],
  [7, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "Cleaning schedules and housekeeping staff deployment records active.", "Jadual pembersihan dan rekod penugasan petugas kebersihan dikemas kini serta dilaksanakan."],
  [8, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "Contractor performance reviews and outstanding facilities issues tracked.", "Prestasi kontraktor dinilai dan isu fasiliti yang belum selesai dipantau."],
  [9, "Building & Infrastructure", "Bangunan & Infrastruktur", "Building condition, walls, ceilings, floors and doors intact and maintained.", "Keadaan bangunan, dinding, siling, lantai dan pintu berada dalam keadaan baik serta diselenggara."],
  [10, "Building & Infrastructure", "Bangunan & Infrastruktur", "Lighting, ventilation and air-conditioning systems functional.", "Sistem pencahayaan, pengudaraan dan penyaman udara berfungsi dengan baik."],
  [11, "Building & Infrastructure", "Bangunan & Infrastruktur", "Water supply, toilets, plumbing and drainage operational.", "Bekalan air, tandas, sistem perpaipan dan saliran berfungsi dengan baik."],
  [12, "Building & Infrastructure", "Bangunan & Infrastruktur", "Electrical systems and emergency power supply (Generator Set) tested.", "Sistem elektrik dan bekalan kuasa kecemasan (set janakuasa) diuji."],
  [13, "Safety & Emergency", "Keselamatan & Kecemasan", "Fire extinguishers, fire alarms and emergency lighting active.", "Alat pemadam api, penggera kebakaran dan lampu kecemasan berada dalam keadaan berfungsi."],
  [14, "Safety & Emergency", "Keselamatan & Kecemasan", "Emergency exits, corridors and evacuation routes unobstructed.", "Pintu keluar kecemasan, koridor dan laluan pengungsian bebas daripada halangan."],
  [15, "Safety & Emergency", "Keselamatan & Kecemasan", "Safety signage, directional signs and exit markings illuminated/clear.", "Papan tanda keselamatan, papan tanda arah dan tanda keluar jelas serta mempunyai pencahayaan yang mencukupi."],
  [16, "Safety & Emergency", "Keselamatan & Kecemasan", "Security systems, access control and perimeter safety monitored.", "Sistem keselamatan, kawalan akses dan keselamatan perimeter dipantau."],
  [17, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "General maintenance and outstanding repair requests logged.", "Kerja penyelenggaraan am dan permohonan pembaikan yang belum selesai direkodkan."],
  [18, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "Accessibility for persons with disabilities (OKU ramps/parking) compliant.", "Kemudahan akses untuk orang kurang upaya (laluan landai/tempat letak kenderaan OKU) mematuhi keperluan."],
  [19, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "Store rooms and common-area storage kept orderly.", "Bilik stor dan ruang penyimpanan di kawasan umum disusun dengan teratur."],
  [20, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "Pest control and environmental hygiene logs up to date.", "Rekod kawalan makhluk perosak dan kebersihan persekitaran sentiasa dikemas kini."],
  [21, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "Public facility defect complaints log and corrective actions monitored.", "Rekod aduan kerosakan kemudahan awam serta tindakan pembetulan dipantau."],
  [22, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "KPI monitoring for Facility Maintenance Response Time tracked monthly.", "Pemantauan KPI tempoh maklum balas penyelenggaraan fasiliti direkodkan setiap bulan."],
  [23, "Facilities & Support Services", "Fasiliti & Perkhidmatan Sokongan", "KKM gazetted No-Smoking Zone enforcement signage displayed throughout perimeter.", "Papan tanda penguatkuasaan Zon Larangan Merokok yang diwartakan oleh KKM dipaparkan di seluruh kawasan perimeter."]
];

/* ───────────── Pemasangan ───────────── */

function setup() {
  const ss = ss_();
  // Struktur lama (v1) dialih nama kepada "(lama)", tidak dipadam
  migrate_(ss, SH.rondaan, HEAD.rondaan);
  migrate_(ss, SH.butiran, HEAD.butiran);
  migrate_(ss, SH.isu, HEAD.isu);
  const items = ensureSheet_(ss, SH.items, HEAD.items);
  const pic = ensureSheet_(ss, SH.pic, HEAD.pic);
  const usr = ensureSheet_(ss, SH.users, HEAD.users);
  usr.getRange(2, 1, 998, 5).setNumberFormat('@');
  usr.getRange(1, 7).setValue('Peranan: Penyelia = semua kuasa termasuk padam rondaan. Pemeriksa = cipta & edit rondaan, isu & maklumbalas (tidak boleh padam rondaan). Penjawab = hanya isi tindakan diambil, maklumbalas & gambar selesai. Aktif: Y / N. Kata laluan ditukar kepada kod hash selepas log masuk pertama.');
  ensureSheet_(ss, SH.rondaan, HEAD.rondaan);
  ensureSheet_(ss, SH.butiran, HEAD.butiran);
  ensureSheet_(ss, SH.isu, HEAD.isu);
  if (items.getLastRow() < 2) {
    const rows = SEED.map(function (r) { return r.concat(['Y']); });
    items.getRange(2, 2, rows.length, 4).setNumberFormat('@');
    items.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  if (pic.getLastRow() < 2) {
    if (SEED_PIC.length) pic.getRange(2, 1, SEED_PIC.length, 1).setValues(SEED_PIC.map(function (p) { return [p]; }));
  }
  getFolder_();
  Logger.log('Siap. Sheet: ' + ss.getUrl());
  return 'Siap';
}

/* ───────────── Titik masuk web ───────────── */

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (!p.action) return out_({ ok: true, name: 'GLORY ROUND API', version: 3, time: now_() });
    return out_(dispatch_(p));
  } catch (err) {
    return errOut_(err);
  }
}
function doPost(e) {
  try {
    return out_(dispatch_(JSON.parse((e && e.postData && e.postData.contents) || '{}')));
  } catch (err) {
    return errOut_(err);
  }
}
function errOut_(err) {
  return out_({ ok: false, error: String((err && err.message) || err), code: (err && err.code) || '' });
}

function dispatch_(b) {
  const me = auth_(b);
  const meOut = { nama: me.nama, peranan: me.peranan, legacy: !!me.legacy };
  switch (b.action) {
    case 'ping': case 'login': return { ok: true, version: 3, me: meOut, time: now_() };
    case 'init': return { ok: true, version: 3, me: meOut, items: getItems_(false), pics: pics_(), locations: locations_(), list: list_(), open: open_(), limit: LIST_LIMIT, time: now_() };
    case 'get': return { ok: true, record: buildRecord_(validId_(b.id)) };
    case 'save': return save_(b, me);
    case 'photo':
      if (me.peranan === 'Penjawab' && b.kind !== 'selesai') deny_();
      return photo_(b);
    case 'delete':
      if (me.peranan !== 'Penyelia') deny_();
      return delete_(b);
    default: return { ok: false, error: 'Tindakan tidak dikenali' };
  }
}
function deny_() { const e = new Error('Akaun anda tidak dibenarkan melakukan tindakan ini'); e.code = 'DENIED'; throw e; }

/* ───────────── Bacaan ───────────── */

const I = { id: 0, rid: 1, no: 2, bil: 3, pen: 4, tin: 5, pic: 6, fot: 7, dia: 8, mak: 9, picm: 10, sel: 11, done: 12, stat: 13, cre: 14, upd: 15, byA: 16, byB: 17, del: 18 };
const ISU_COLS = 21;

function list_() {
  const rows = table_(sheet_(SH.rondaan), 12)
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return {
        id: s_(r[0]), lokasi: s_(r[1]), tarikh: s_(r[2], 'yyyy-MM-dd'), masa: s_(r[3], 'HH:mm'), pegawai: s_(r[4]),
        y: Number(r[5]) || 0, n: Number(r[6]) || 0, na: Number(r[7]) || 0, blank: Number(r[8]) || 0,
        issues: Number(r[9]) || 0, open: Number(r[10]) || 0, updated: s_(r[11])
      };
    });
  rows.sort(function (a, b) { return (b.tarikh + b.masa + b.updated).localeCompare(a.tarikh + a.masa + a.updated); });
  return rows.slice(0, LIST_LIMIT);
}

function locations_() {
  const count = {};
  table_(sheet_(SH.rondaan), 2).forEach(function (r) {
    const k = s_(r[1]).trim();
    if (k) count[k] = (count[k] || 0) + 1;
  });
  return Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 50);
}

function pics_() {
  return table_(sheet_(SH.pic), 1).map(function (r) { return s_(r[0]).trim(); }).filter(String);
}

function open_() {
  const meta = {};
  table_(sheet_(SH.rondaan), 4).forEach(function (r) { meta[s_(r[0])] = { lokasi: s_(r[1]), tarikh: s_(r[2], 'yyyy-MM-dd'), masa: s_(r[3], 'HH:mm') }; });
  const out = [];
  table_(sheet_(SH.isu), ISU_COLS).forEach(function (r) {
    if (s_(r[I.del]) === 'Y' || s_(r[I.stat]) === 'Selesai') return;
    const m = meta[s_(r[I.rid])] || {};
    out.push({
      id: s_(r[I.id]), rid: s_(r[I.rid]), no: Number(r[I.no]), bil: s_(r[I.bil]),
      penemuan: s_(r[I.pen]).slice(0, 200), tindakan: s_(r[I.tin]).slice(0, 160), pic: s_(r[I.pic]),
      status: s_(r[I.stat]), lokasi: m.lokasi || '', tarikh: m.tarikh || '', masa: m.masa || '',
      photos: split_(r[I.fot]).length
    });
  });
  out.sort(function (a, b) { return (b.tarikh + b.masa).localeCompare(a.tarikh + a.masa); });
  return out.slice(0, OPEN_LIMIT);
}

function split_(v) {
  return String(v === null || v === undefined ? '' : v).split('\n').map(function (x) { return x.trim(); }).filter(String);
}

function issueFromRow_(r) {
  return {
    id: s_(r[I.id]), no: Number(r[I.no]), bil: s_(r[I.bil]),
    a: { penemuan: s_(r[I.pen]), tindakan: s_(r[I.tin]), pic: s_(r[I.pic]), fotos: split_(r[I.fot]) },
    b: { diambil: s_(r[I.dia]), maklumbalas: s_(r[I.mak]), picM: s_(r[I.picm]), fotosSelesai: split_(r[I.sel]), selesai: s_(r[I.done]) === 'Y' },
    status: s_(r[I.stat]), created: s_(r[I.cre]), updated: s_(r[I.upd]),
    by: { a: s_(r[I.byA]), b: s_(r[I.byB]) }, del: s_(r[I.del]) === 'Y'
  };
}

function issueStatus_(x) {
  if (x.b.selesai) return 'Selesai';
  return (x.b.diambil || x.b.maklumbalas || x.b.fotosSelesai.length) ? 'Dalam tindakan' : 'Terbuka';
}

function buildRecord_(id) {
  const head = table_(sheet_(SH.rondaan), 16).filter(function (r) { return s_(r[0]) === id; })[0];
  if (!head) throw new Error('Rondaan tidak dijumpai');
  const st = {};
  table_(sheet_(SH.butiran), 7).forEach(function (r) { if (s_(r[0]) === id) st[Number(r[1])] = s_(r[4]); });
  const issues = table_(sheet_(SH.isu), ISU_COLS)
    .filter(function (r) { return s_(r[I.rid]) === id; })
    .map(issueFromRow_)
    .filter(function (x) { return !x.del; });
  return {
    id: id,
    meta: { lokasi: s_(head[1]), tarikh: s_(head[2], 'yyyy-MM-dd'), masa: s_(head[3], 'HH:mm'), pegawai: s_(head[4]), semakNama: s_(head[12]), semakTtd: s_(head[13]), semakTarikh: s_(head[14], 'yyyy-MM-dd'), masaTamat: s_(head[15], 'HH:mm') },
    st: st, issues: issues, updated: s_(head[11])
  };
}

/* ───────────── Tulisan ───────────── */

function urls_(arr) {
  return (Array.isArray(arr) ? arr : []).map(url_).filter(String).slice(0, 12);
}

function save_(b, me) {
  const id = validId_(b.id);
  const limited = me.peranan === 'Penjawab';
  const by = txt_(me.nama || b.by, 100);
  if (limited) { b.meta = null; b.statuses = {}; }
  const defs = getItems_(true);
  const defNos = {};
  defs.forEach(function (d) { defNos[d.no] = true; });

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const now = now_();
    if (limited && !findRow_(sheet_(SH.rondaan), id, 0)) deny_();

    /* 1. Isu: gabung ikut kumpulan (a = penemuan, b = maklumbalas) */
    const isuSh = sheet_(SH.isu);
    const list = table_(isuSh, ISU_COLS).filter(function (r) { return s_(r[I.rid]) === id; }).map(issueFromRow_);
    const byId = {};
    list.forEach(function (x) { byId[x.id] = x; });
    (b.issues || []).forEach(function (p) {
      const iid = validId_(p.id);
      let x = byId[iid];
      if (!x) {
        if (limited || p.del || !defNos[Number(p.no)]) return;
        x = {
          id: iid, no: Number(p.no), bil: '',
          a: { penemuan: '', tindakan: '', pic: '', fotos: [] },
          b: { diambil: '', maklumbalas: '', picM: '', fotosSelesai: [], selesai: false },
          status: '', created: now, updated: now, by: { a: '', b: '' }, del: false
        };
        list.push(x); byId[iid] = x;
      }
      if (p.del && !limited) x.del = true;
      if (p.a && !limited) {
        x.a = { penemuan: txt_(p.a.penemuan), tindakan: txt_(p.a.tindakan), pic: txt_(p.a.pic, 300), fotos: urls_(p.a.fotos) };
        x.by.a = by;
      }
      const lockedB = limited && x.b && x.b.selesai; // penjawab tidak boleh ubah isu yang sudah selesai
      const applyB = p.b && !lockedB;
      if (applyB) {
        x.b = { diambil: txt_(p.b.diambil), maklumbalas: txt_(p.b.maklumbalas), picM: txt_(p.b.picM, 300), fotosSelesai: urls_(p.b.fotosSelesai), selesai: !!p.b.selesai };
        x.by.b = by;
      }
      if ((p.a && !limited) || applyB || (p.del && !limited)) x.updated = now;
    });

    const live = list.filter(function (x) { return !x.del; });
    const dead = list.filter(function (x) { return x.del; });
    live.sort(function (p, q) { return p.no - q.no || String(p.created).localeCompare(String(q.created)); });
    const perNo = {}, seq = {};
    live.forEach(function (x) { perNo[x.no] = (perNo[x.no] || 0) + 1; });
    live.forEach(function (x) {
      seq[x.no] = (seq[x.no] || 0) + 1;
      x.bil = perNo[x.no] > 1 ? x.no + '.' + seq[x.no] : String(x.no);
      x.status = issueStatus_(x);
    });

    removeRows_(isuSh, id, I.rid);
    const all = live.concat(dead);
    if (all.length) {
      const r0 = isuSh.getLastRow() + 1;
      const rows = all.map(function (x) {
        return [x.id, id, x.no, x.bil, x.a.penemuan, x.a.tindakan, x.a.pic, x.a.fotos.join('\n'),
          x.b.diambil, x.b.maklumbalas, x.b.picM, x.b.fotosSelesai.join('\n'), x.b.selesai ? 'Y' : '',
          x.del ? 'Dipadam' : x.status, x.created, x.updated, x.by.a, x.by.b, x.del ? 'Y' : ''];
      });
      isuSh.getRange(r0, 4, rows.length, 16).setNumberFormat('@');
      isuSh.getRange(r0, 1, rows.length, 19).setValues(rows);
      isuSh.getRange(r0, 20, rows.length, 2).setFormulas(all.map(function (x, i) {
        const rr = r0 + i;
        return ['=IF(H' + rr + '="","",IFERROR(IMAGE(INDEX(SPLIT(H' + rr + ',CHAR(10)),1,1),4,80,107),""))',
          '=IF(L' + rr + '="","",IFERROR(IMAGE(INDEX(SPLIT(L' + rr + ',CHAR(10)),1,1),4,80,107),""))'];
      }));
      all.forEach(function (x, i) { if (x.a.fotos.length || x.b.fotosSelesai.length) isuSh.setRowHeight(r0 + i, 84); });
    }

    /* 2. Butiran: status item (hanya yang dihantar diubah) */
    const bs = sheet_(SH.butiran);
    const st = {};
    table_(bs, 7).forEach(function (r) { if (s_(r[0]) === id) st[Number(r[1])] = status_(r[4]); });
    const sent = b.statuses || {};
    Object.keys(sent).forEach(function (k) { if (defNos[Number(k)]) st[Number(k)] = status_(sent[k]); });
    const issuesPerNo = {};
    live.forEach(function (x) { issuesPerNo[x.no] = (issuesPerNo[x.no] || 0) + 1; });
    let y = 0, n = 0, na = 0, blank = 0;
    const brows = [];
    defs.forEach(function (d) {
      const s = st[d.no] || '';
      if (!d.active && !s) return;
      if (d.active) { if (s === 'Y') y++; else if (s === 'N') n++; else if (s === 'NA') na++; else blank++; }
      brows.push([id, d.no, d.catBM || d.catEN, d.itemBM || d.itemEN, s, issuesPerNo[d.no] || 0, now]);
    });
    removeRows_(bs, id, 0);
    if (brows.length) {
      const r0 = bs.getLastRow() + 1;
      bs.getRange(r0, 3, brows.length, 3).setNumberFormat('@');
      bs.getRange(r0, 1, brows.length, 7).setValues(brows);
    }

    /* 3. Rondaan */
    const rs = sheet_(SH.rondaan);
    const row = findRow_(rs, id, 0);
    const old = row ? rs.getRange(row, 1, 1, 16).getValues()[0] : null;
    if (limited && !old) deny_();
    if (!b.meta && !old) throw new Error('Maklumat rondaan (meta) diperlukan');
    const m = b.meta || { lokasi: old[1], tarikh: s_(old[2], 'yyyy-MM-dd'), masa: s_(old[3], 'HH:mm'), pegawai: old[4], semakNama: s_(old[12]), semakTtd: s_(old[13]), semakTarikh: s_(old[14], 'yyyy-MM-dd'), masaTamat: s_(old[15], 'HH:mm') };
    const open = live.filter(function (x) { return x.status !== 'Selesai'; }).length;
    const line = [id, txt_(m.lokasi, 200), txt_(m.tarikh, 10), txt_(m.masa, 5), txt_(m.pegawai, 200), y, n, na, blank, live.length, open, now, txt_(m.semakNama, 200), url_(m.semakTtd), txt_(m.semakTarikh, 10), txt_(m.masaTamat, 5)];
    const target = row || rs.getLastRow() + 1;
    rs.getRange(target, 2, 1, 4).setNumberFormat('@');
    rs.getRange(target, 13, 1, 4).setNumberFormat('@');
    rs.getRange(target, 1, 1, 16).setValues([line]);

    return { ok: true, updated: now, record: buildRecord_(id) };
  } finally {
    lock.releaseLock();
  }
}

function photo_(b) {
  const id = validId_(b.id);
  const no = Number(b.no) || 0;
  const kind = b.kind === 'selesai' ? 'selesai' : b.kind === 'ttd' ? 'ttd' : 'foto';
  if (!b.data || String(b.data).length > 9 * 1024 * 1024) throw new Error('Gambar tiada atau terlalu besar');
  const mime = /^image\/(jpeg|png|webp)$/.test(b.mime) ? b.mime : 'image/jpeg';
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const blob = Utilities.newBlob(Utilities.base64Decode(b.data), mime, id + '_' + no + '_' + kind + '_' + Date.now() + '.' + ext);
  const file = getFolder_().createFile(blob);
  if (PUBLIC_PHOTOS) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, fileId: file.getId(), url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200' };
}

function delete_(b) {
  const id = validId_(b.id);
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    removeRows_(sheet_(SH.isu), id, I.rid);
    removeRows_(sheet_(SH.butiran), id, 0);
    removeRows_(sheet_(SH.rondaan), id, 0);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ───────────── Pembantu ───────────── */

function hex_(bytes) { return bytes.map(function (x) { return ('0' + ((x + 256) % 256).toString(16)).slice(-2); }).join(''); }
function hashPw_(pw, salt) { return 'sha256:' + salt + ':' + hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pw)); }
function loginErr_(msg) { const e = new Error(msg); e.code = 'LOGIN'; return e; }

/* Pengesahan: jika tab "Pengguna" ada pengguna aktif, log masuk diwajibkan.
   Jika kosong, mod lama (PIN pilihan) digunakan dan semua orang bertindak sebagai Pemeriksa. */
function auth_(c) {
  const sh = ss_().getSheetByName(SH.users);
  const rows = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues() : [];
  const active = [];
  rows.forEach(function (r, i) { if (s_(r[1]) && s_(r[4]).toUpperCase() !== 'N') active.push({ r: r, row: i + 2 }); });
  if (!active.length) {
    if (PIN && String(c.pin || '') !== String(PIN)) throw new Error('PIN salah');
    return { nama: '', peranan: 'Penyelia', legacy: true };
  }
  const uid = String(c.user || '').trim().toLowerCase();
  if (!uid || !c.pass) throw loginErr_('Sila log masuk');
  const cache = typeof CacheService !== 'undefined' ? CacheService.getScriptCache() : null;
  const ck = 'fail_' + uid.replace(/[^a-z0-9_.-]/g, '').slice(0, 40);
  if (cache && Number(cache.get(ck) || 0) >= 8) throw loginErr_('Terlalu banyak percubaan salah. Cuba lagi dalam 10 minit.');
  let hit = null;
  active.forEach(function (x) { if (s_(x.r[1]).trim().toLowerCase() === uid) hit = x; });
  let ok = false;
  if (hit) {
    const stored = s_(hit.r[2]), pw = String(c.pass);
    if (stored.indexOf('sha256:') === 0) {
      const parts = stored.split(':');
      ok = hashPw_(pw, parts[1]) === stored;
    } else if (stored && stored === pw) {
      ok = true;
      const salt = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
      ss_().getSheetByName(SH.users).getRange(hit.row, 3).setValue(hashPw_(pw, salt));
    }
  }
  if (!ok) {
    if (cache) cache.put(ck, String(Number(cache.get(ck) || 0) + 1), 600);
    throw loginErr_('ID pengguna atau kata laluan salah');
  }
  if (cache) cache.remove(ck);
  const rl = s_(hit.r[3]);
  const role = /jawab/i.test(rl) ? 'Penjawab' : /yelia|supervis/i.test(rl) ? 'Penyelia' : 'Pemeriksa';
  return { nama: s_(hit.r[0]) || s_(hit.r[1]), peranan: role, legacy: false };
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function tz_() { return Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur'; }
function now_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm:ss'); }

function s_(v, fmt) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), fmt || 'yyyy-MM-dd HH:mm:ss');
  return v === null || v === undefined ? '' : String(v);
}

function txt_(v, max) {
  return v === null || v === undefined ? '' : String(v).slice(0, max || 5000);
}

function status_(v) {
  const s = String(v || '').toUpperCase();
  return s === 'Y' || s === 'N' || s === 'NA' ? s : '';
}

function url_(v) {
  const s = String(v || '');
  return /^https:\/\/drive\.google\.com\/[^\s]*$/.test(s) ? s : '';
}

function validId_(id) {
  const s = String(id || '');
  if (!/^[A-Za-z0-9_-]{6,48}$/.test(s)) throw new Error('ID tidak sah');
  return s;
}

function ss_() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActive();
  if (!ss) throw new Error('Tiada Google Sheet terikat. Buka Sheet > Extensions > Apps Script, ATAU isi SHEET_ID di bahagian atas Code.gs.');
  return ss;
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Tab "' + name + '" tiada. Jalankan setup() dahulu.');
  return sh;
}

function ensureSheet_(ss, name, head) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#0b6b5f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function migrate_(ss, name, head) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() === 0) return;
  const cur = sh.getRange(1, 1, 1, head.length).getValues()[0];
  if (cur.join('|') === head.join('|')) return;
  // Sheet versi sama tetapi kurang lajur baharu di hujung: tambah tajuk sahaja, data kekal
  let nk = cur.length; while (nk > 0 && cur[nk - 1] === '') nk--;
  if (nk > 0 && cur.slice(0, nk).join('|') === head.slice(0, nk).join('|')) { sh.getRange(1, nk + 1, 1, head.length - nk).setValues([head.slice(nk)]); return; }
  let n = name + ' (lama)', k = 2;
  while (ss.getSheetByName(n)) n = name + ' (lama ' + (k++) + ')';
  sh.setName(n);
}

function table_(sh, ncol) {
  const n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, ncol).getValues();
}

function findRow_(sh, id, col) {
  const n = sh.getLastRow();
  if (n < 2) return 0;
  const vals = sh.getRange(2, col + 1, n - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === id) return i + 2;
  return 0;
}

function removeRows_(sh, id, col) {
  const n = sh.getLastRow();
  if (n < 2) return;
  const vals = sh.getRange(2, col + 1, n - 1, 1).getValues();
  const runs = [];
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) !== id) continue;
    const last = runs[runs.length - 1];
    if (last && last.start + last.count === i + 2) last.count++;
    else runs.push({ start: i + 2, count: 1 });
  }
  for (let k = runs.length - 1; k >= 0; k--) sh.deleteRows(runs[k].start, runs[k].count);
}

function isActive_(v) {
  return ['N', 'T', 'TIDAK', 'NO', '0', 'FALSE'].indexOf(String(v).trim().toUpperCase()) === -1;
}

function getItems_(all) {
  return table_(sheet_(SH.items), 6)
    .filter(function (r) { return r[0] !== '' && !isNaN(Number(r[0])); })
    .map(function (r) {
      return { no: Number(r[0]), catEN: s_(r[1]), catBM: s_(r[2]), itemEN: s_(r[3]), itemBM: s_(r[4]), active: isActive_(r[5]) };
    })
    .filter(function (x) { return all || x.active; })
    .sort(function (a, b) { return a.no - b.no; });
}

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('FOLDER_ID');
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (e) { /* dicipta semula */ }
  }
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}
