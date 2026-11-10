# GLORY ROUND – PWA Rondaan Keselamatan & Utiliti Luar

Borang Excel `GLORY ROUND` ditukar kepada app telefon (PWA). Data disimpan dalam **Google Sheet**, gambar dalam **Google Drive**. Boleh ambil gambar, isi/ubah rondaan lama, dan teruskan kerja tanpa internet.

## Susunan fail

| Folder / fail | Fungsi |
|---|---|
| `apps-script/Code.gs` | Backend: tampal dalam Google Sheet (Extensions > Apps Script) |
| `apps-script/appsscript.json` | Tetapan zon masa & akses Web App (pilihan) |
| `pwa/` | App telefon: muat naik keseluruhan folder ini ke Netlify / GitHub Pages |

## Pemasangan (±10 minit)

| # | Langkah | Butiran |
|---|---|---|
| 1 | Cipta Google Sheet | Sheet.new > namakan "GLORY ROUND Database" |
| 2 | Pasang backend | Extensions > Apps Script > padam kod sedia ada > tampal `Code.gs` > Save |
| 3 | Sediakan tab | Pilih fungsi **setup** > Run > beri kebenaran (Sheet & Drive). Tab `Senarai Semak` (23 item), `Rondaan`, `Butiran` dicipta |
| 4 | Deploy backend | Deploy > New deployment > jenis **Web app** > Execute as: **Me** > Who has access: **Anyone** > Deploy > salin URL berakhir `/exec` |
| 5 | Host PWA | Netlify: app.netlify.com/drop > seret folder `pwa`. (atau GitHub Pages / Vercel). Mesti HTTPS supaya kamera & pasang app berfungsi |
| 6 | Sambung | Buka URL PWA di telefon > Tetapan > tampal URL `/exec` > Uji sambungan > Simpan |
| 7 | Pasang di telefon | Android Chrome: menu ⋮ > Pasang app. iPhone Safari: Kongsi > Tambah ke Skrin Utama |

> Jika Code.gs diubah selepas deploy: Deploy > Manage deployments > Edit > Version: **New version** > Deploy. URL kekal sama.

## Cara guna

1. **Rondaan Baharu** > isi Lokasi, Tarikh, Masa, Pegawai.
2. Setiap item: tekan **Y / N / NA**. Jika **N**, ruang *Penemuan*, *Tindakan* dan *Gambar Selesai* muncul. Item Y/NA boleh ditambah catatan melalui **+ Catatan**.
3. Tekan kotak **Gambar** untuk ambil gambar (kamera atau galeri). Gambar dimampatkan (maks 1280px) dan dicop tarikh/masa.
4. **Simpan & Hantar** menghantar gambar ke Drive dan data ke Sheet. Tanpa internet, data disimpan dalam telefon dan dihantar sendiri apabila ada internet.
5. Untuk kemas kini kemudian (cth. isi *Gambar Selesai* selepas kerja pembaikan): buka rondaan dari senarai > ubah > Simpan & Hantar. Sheet dikemas kini pada baris yang sama.
6. Ikon pencetak menjana laporan A4 landskap (Cetak / Simpan PDF) seperti borang asal.

## Struktur Google Sheet

| Tab | Kandungan |
|---|---|
| `Senarai Semak` | No, kategori & item (EN/BM), **Aktif**. Ubah ayat atau letak `N` pada Aktif untuk sorok item. App membaca senarai ini setiap kali segerak |
| `Rondaan` | 1 baris/rondaan: ID, lokasi, tarikh, masa, pegawai, jumlah Y / N / NA / belum diisi |
| `Butiran` | 1 baris/item/rondaan: status, penemuan, tindakan, pautan gambar, pratonton gambar (`=IMAGE`) |

Gunakan Pivot Table atau penapis pada `Butiran` untuk laporan: contohnya tapis `Status = N` dan `Gambar Selesai` kosong untuk senarai tindakan belum selesai.

## Keselamatan

- **PIN**: tukar `const PIN = ''` dalam `Code.gs` (cth. `'4821'`), deploy versi baharu, kemudian isi PIN yang sama dalam Tetapan app. Ini halangan asas sahaja, bukan pengesahan penuh.
- **Gambar**: `PUBLIC_PHOTOS = true` menjadikan gambar boleh dilihat oleh sesiapa yang ada pautan (ID fail sukar diteka) supaya boleh dipapar dalam app & Sheet. Jika mahu peribadi, tukar kepada `false`; gambar kekal dalam Drive anda tetapi pratonton dalam app/Sheet mungkin tidak dipaparkan.
- Jangan ambil gambar yang menunjukkan wajah pesakit atau maklumat peribadi.
- Pemilik Sheet/Drive ialah akaun yang melakukan Deploy. Hanya akaun itu boleh melihat Sheet penuh.

## Had diketahui

- Menukar telefon: data yang belum dihantar kekal dalam telefon lama sahaja. Tekan **Simpan & Hantar** sebelum bertukar.
- Dua orang edit rondaan yang sama serentak: yang terakhir menyimpan akan menang.
- Hanya 200 rondaan terkini dipaparkan dalam senarai app (semua kekal dalam Sheet).

## Hos di GitHub Pages (ganti Netlify)

1. Cipta repo `glory-round` di GitHub, push seluruh folder ini (`git push -u origin main`).
2. Repo > Settings > Pages > Source: **GitHub Actions**. Workflow `.github/workflows/pages.yml` akan deploy folder `pwa/` secara automatik.
3. URL app: `https://<username>.github.io/glory-round/`
4. Pages percuma memerlukan repo **public**. Folder ini tidak mengandungi URL Sheet atau PIN (diisi dalam Tetapan app), jadi selamat untuk public.
