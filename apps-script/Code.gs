/**
 * GLORY ROUND – Backend untuk PWA (Google Apps Script)
 *
 * Cara pasang: buka Google Sheet > Extensions > Apps Script > tampal fail ini
 * > jalankan setup() sekali > Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Salin URL /exec ke tetapan PWA.
 *
 * Tab yang dicipta:
 *   Senarai Semak : 23 item borang (boleh diedit; Aktif = N untuk sorok item)
 *   Rondaan       : 1 baris setiap rondaan (lokasi, tarikh, masa, pegawai, jumlah Y/N/NA)
 *   Butiran       : 1 baris setiap item setiap rondaan (status, penemuan, tindakan, gambar)
 */

const PIN = '';                        // PIN pilihan (kosong = tiada PIN). Mesti sama dengan PIN dalam tetapan app.
const PUBLIC_PHOTOS = true;            // true = gambar boleh dipapar dalam app & sheet (sesiapa yang ada pautan)
const SHEET_ID = '';                   // Hanya perlu jika skrip dicipta di script.google.com (bukan dari dalam Sheet): tampal ID Sheet (bahagian antara /d/ dan /edit dalam URL)
const FOLDER_NAME = 'GLORY ROUND - Gambar';
const LIST_LIMIT = 200;

const SH = { items: 'Senarai Semak', rondaan: 'Rondaan', butiran: 'Butiran' };
const HEAD = {
  items: ['No', 'Kategori (EN)', 'Kategori (BM)', 'Item (EN)', 'Item (BM)', 'Aktif'],
  rondaan: ['ID', 'Lokasi', 'Tarikh', 'Masa', 'Pegawai Pemeriksa', 'Patuh (Y)', 'Tidak Patuh (N)', 'NA', 'Belum Diisi', 'Dikemas Kini'],
  butiran: ['ID Rondaan', 'No', 'Kategori', 'Item', 'Status', 'Penemuan', 'Tindakan', 'Gambar', 'Gambar Selesai', 'Dikemas Kini', 'Pratonton Gambar', 'Pratonton Selesai']
};

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
  const items = ensureSheet_(ss, SH.items, HEAD.items);
  ensureSheet_(ss, SH.rondaan, HEAD.rondaan);
  ensureSheet_(ss, SH.butiran, HEAD.butiran);
  if (items.getLastRow() < 2) {
    const rows = SEED.map(function (r) { return r.concat(['Y']); });
    items.getRange(2, 2, rows.length, 4).setNumberFormat('@');
    items.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  getFolder_();
  Logger.log('Siap. Sheet: ' + ss.getUrl());
  return 'Siap';
}

/* ───────────── Titik masuk web ───────────── */

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (!p.action) return out_({ ok: true, name: 'GLORY ROUND API', time: now_() });
    auth_(p.pin);
    switch (p.action) {
      case 'ping': return out_({ ok: true, time: now_() });
      case 'init': return out_({ ok: true, items: getItems_(false), locations: locations_(), list: list_(), limit: LIST_LIMIT, time: now_() });
      case 'get': return out_({ ok: true, record: get_(validId_(p.id)) });
      default: return out_({ ok: false, error: 'Tindakan tidak dikenali' });
    }
  } catch (err) {
    return out_({ ok: false, error: String((err && err.message) || err) });
  }
}

function doPost(e) {
  try {
    const b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    auth_(b.pin);
    switch (b.action) {
      case 'save': return out_(save_(b));
      case 'photo': return out_(photo_(b));
      case 'delete': return out_(delete_(b));
      default: return out_({ ok: false, error: 'Tindakan tidak dikenali' });
    }
  } catch (err) {
    return out_({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ───────────── Tindakan ───────────── */

function list_() {
  const rows = table_(sheet_(SH.rondaan), 10)
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return {
        id: s_(r[0]), lokasi: s_(r[1]), tarikh: s_(r[2], 'yyyy-MM-dd'), masa: s_(r[3], 'HH:mm'), pegawai: s_(r[4]),
        y: Number(r[5]) || 0, n: Number(r[6]) || 0, na: Number(r[7]) || 0, blank: Number(r[8]) || 0, updated: s_(r[9])
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

function get_(id) {
  const head = table_(sheet_(SH.rondaan), 10).filter(function (r) { return s_(r[0]) === id; })[0];
  if (!head) throw new Error('Rondaan tidak dijumpai');
  const items = {};
  table_(sheet_(SH.butiran), 10).forEach(function (r) {
    if (s_(r[0]) !== id) return;
    items[Number(r[1])] = { status: s_(r[4]), penemuan: s_(r[5]), tindakan: s_(r[6]), foto: s_(r[7]), selesai: s_(r[8]) };
  });
  return {
    id: id,
    meta: { lokasi: s_(head[1]), tarikh: s_(head[2], 'yyyy-MM-dd'), masa: s_(head[3], 'HH:mm'), pegawai: s_(head[4]) },
    items: items, updated: s_(head[9])
  };
}

function save_(b) {
  const id = validId_(b.id);
  const meta = b.meta || {};
  const items = b.items || {};
  const defs = getItems_(true);
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const now = now_();
    let y = 0, n = 0, na = 0, blank = 0;
    const rows = [];
    defs.forEach(function (d) {
      const it = items[d.no] || items[String(d.no)] || null;
      if (!d.active && !it) return;
      const st = status_(it && it.status);
      if (d.active) { if (st === 'Y') y++; else if (st === 'N') n++; else if (st === 'NA') na++; else blank++; }
      rows.push([id, d.no, d.catBM || d.catEN, d.itemBM || d.itemEN, st,
        txt_(it && it.penemuan), txt_(it && it.tindakan), url_(it && it.foto), url_(it && it.selesai), now]);
    });

    // Butiran: ganti semua baris rondaan ini
    const bs = sheet_(SH.butiran);
    removeRows_(bs, id);
    if (rows.length) {
      const r0 = bs.getLastRow() + 1;
      bs.getRange(r0, 3, rows.length, 7).setNumberFormat('@');
      bs.getRange(r0, 1, rows.length, 10).setValues(rows);
      const formulas = rows.map(function (r, i) {
        const rr = r0 + i;
        return ['=IF(H' + rr + '="","",IMAGE(H' + rr + ',4,80,107))', '=IF(I' + rr + '="","",IMAGE(I' + rr + ',4,80,107))'];
      });
      bs.getRange(r0, 11, rows.length, 2).setFormulas(formulas);
      rows.forEach(function (r, i) { if (r[7] || r[8]) bs.setRowHeight(r0 + i, 84); });
    }

    // Rondaan: kemas kini atau tambah
    const rs = sheet_(SH.rondaan);
    const line = [id, txt_(meta.lokasi, 200), txt_(meta.tarikh, 10), txt_(meta.masa, 5), txt_(meta.pegawai, 200), y, n, na, blank, now];
    let row = findRow_(rs, id);
    if (!row) row = rs.getLastRow() + 1;
    rs.getRange(row, 2, 1, 4).setNumberFormat('@');
    rs.getRange(row, 1, 1, 10).setValues([line]);

    return { ok: true, updated: now, counts: { y: y, n: n, na: na, blank: blank } };
  } finally {
    lock.releaseLock();
  }
}

function photo_(b) {
  const id = validId_(b.id);
  const no = Number(b.no) || 0;
  const kind = b.kind === 'selesai' ? 'selesai' : 'foto';
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
    removeRows_(sheet_(SH.butiran), id);
    removeRows_(sheet_(SH.rondaan), id);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ───────────── Pembantu ───────────── */

function auth_(pin) {
  if (PIN && String(pin || '') !== String(PIN)) throw new Error('PIN salah');
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
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(s)) throw new Error('ID tidak sah');
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

function table_(sh, ncol) {
  const n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, ncol).getValues();
}

function findRow_(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return 0;
  const col = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < col.length; i++) if (String(col[i][0]) === id) return i + 2;
  return 0;
}

function removeRows_(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return;
  const col = sh.getRange(2, 1, n - 1, 1).getValues();
  const runs = [];
  for (let i = 0; i < col.length; i++) {
    if (String(col[i][0]) !== id) continue;
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
