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

> Skrip mesti dibuka dari **dalam Sheet** (Extensions > Apps Script). Jika dicipta di script.google.com, ralat `getSheetByName of null` akan keluar: isi `SHEET_ID` di bahagian atas `Code.gs` (ID dalam URL Sheet antara `/d/` dan `/edit`).

> Jika Code.gs diubah selepas deploy: Deploy > Manage deployments > Edit > Version: **New version** > Deploy. URL kekal sama.

## Cara guna

1. **Rondaan Baharu** > isi Tempat, Tarikh, Masa, Ketua Rondaan.
2. Setiap no. item: tekan **Y / N / NA**. Jika **N**, satu isu dibuka automatik. Tekan **+ Tambah isu / penemuan** untuk isu ke-2 hingga ke-5 (dan seterusnya) bagi no. yang sama. Isu dinomborkan 2.1, 2.2, 2.3.
3. Setiap isu: **Penemuan**, **Tindakan yang perlu diambil**, **PIC** (unit atau nama; tekan butang Medivest / UPPP / UKK atau taip sendiri) dan seberapa banyak **gambar** (butang **Kamera** membuka kamera terus; **Galeri** untuk pilih gambar sedia ada).
4. **Simpan & Hantar** menghantar gambar ke Drive dan data ke Sheet. Tanpa internet, data disimpan dalam telefon dan dihantar sendiri kemudian.
5. **Selepas kerja siap**: sesiapa boleh buka tab **Isu terbuka** (atau buka rondaan), tekan isu, kembangkan **Tindakan diambil & maklumbalas**, isi *Tindakan yang sudah diambil*, *Maklumbalas*, PIC, gambar selesai, dan tanda **selesai**. Dua orang boleh edit rondaan yang sama; data digabung ikut isu (bahagian penemuan dan bahagian maklumbalas disimpan berasingan).
6. Ikon dokumen (atas) membuka **Laporan Glory Round** ikut lakaran: Tarikh, Masa, Tempat, Ketua Rondaan; Jadual A (Bil., Penemuan, Tindakan perlu diambil, PIC, Gambar) dan Jadual B (Tindakan sudah diambil, Maklumbalas, PIC, Gambar), kertas A4 landskap. Di bawah laporan ada **Disediakan oleh** (tandatangan digital, dilukis pada skrin dalam bahagian *Penyedia laporan* di hujung borang) dan **Disahkan oleh** (dikosongkan untuk tandatangan basah selepas dicetak). Tekan **Cetak / PDF** > Simpan sebagai PDF.

## Struktur Google Sheet

| Tab | Kandungan |
|---|---|
| `Senarai Semak` | No, kategori & item (EN/BM), **Aktif**. Letak `N` pada Aktif untuk sorok item |
| `Senarai PIC` | Senarai unit/nama untuk butang pantas PIC (ubah ikut keperluan) |
| `Rondaan` | 1 baris/rondaan: ID, tempat, tarikh, masa, ketua, jumlah Y/N/NA, jumlah isu, isu belum selesai, nama penyedia, pautan tandatangan, tarikh semakan |
| `Butiran` | 1 baris/item/rondaan: status Y/N/NA dan bilangan isu |
| `Isu` | 1 baris/isu: penemuan, tindakan, PIC, gambar, tindakan diambil, maklumbalas, PIC, gambar selesai, status (Terbuka / Dalam tindakan / Selesai) |

Tapis tab `Isu` mengikut `Status Isu` atau `PIC (Tindakan)` untuk pantau kerja belum siap.

## Naik taraf daripada v1

1. Tampal `Code.gs` baharu (padam yang lama) > Save > jalankan **setup** (tab lama dinamakan semula "(lama)"; data lama tidak dipadam).
2. Deploy > Manage deployments > Edit > Version: **New version** > Deploy. URL kekal sama.
3. Buka app di telefon, tutup sepenuhnya dan buka semula untuk dapat versi baharu. Rondaan v1 dalam telefon dibuang (yang sudah dihantar kekal dalam tab "(lama)").

## Log masuk & peranan

Tab **`Pengguna`** dalam Sheet (dicipta oleh `setup`) menentukan siapa boleh masuk:

| Lajur | Isi |
|---|---|
| Nama | Nama paparan, cth. `Unit UKK`. Direkod pada setiap maklumbalas |
| ID Pengguna | Untuk log masuk, cth. `ukk` |
| Kata Laluan | Taip biasa; ditukar automatik kepada kod hash selepas log masuk pertama |
| Peranan | `Penyelia`, `Pemeriksa` atau `Penjawab` |
| Aktif | `Y` / `N` (letak `N` untuk sekat akaun) |

| Peranan | Boleh | Tidak boleh |
|---|---|---|
| **Penyelia** | Semua yang Pemeriksa boleh, serta **padam rondaan** | n/a |
| **Pemeriksa** | Cipta & edit rondaan, penemuan, tindakan, PIC, gambar, tandatangan; isi maklumbalas; padam isu | Padam rondaan |
| **Penjawab** | Lihat rondaan & isu; isi *tindakan diambil*, *maklumbalas*, PIC, gambar selesai, tanda selesai; jana laporan | Cipta/edit rondaan, ubah penemuan/tindakan perlu/status item, tambah atau padam isu, padam rondaan |

Sekatan dikuatkuasakan di pelayan (Apps Script), bukan hanya dalam app. Jika tab `Pengguna` **kosong**, app berfungsi seperti sebelum ini (tanpa log masuk, PIN pilihan). Selepas ada pengguna aktif, log masuk diwajibkan untuk semua orang termasuk pemeriksa, jadi tambah akaun anda sendiri dahulu. Lapan percubaan salah menyekat ID itu 10 minit.

## Keselamatan

- **PIN**: tukar `const PIN = ''` dalam `Code.gs` (cth. `'4821'`), deploy versi baharu, kemudian isi PIN yang sama dalam Tetapan app. Ini halangan asas sahaja, bukan pengesahan penuh.
- **Gambar**: `PUBLIC_PHOTOS = true` menjadikan gambar boleh dilihat oleh sesiapa yang ada pautan (ID fail sukar diteka) supaya boleh dipapar dalam app & Sheet. Jika mahu peribadi, tukar kepada `false`; gambar kekal dalam Drive anda tetapi pratonton dalam app/Sheet mungkin tidak dipaparkan.
- Jangan ambil gambar yang menunjukkan wajah pesakit atau maklumat peribadi.
- Pemilik Sheet/Drive ialah akaun yang melakukan Deploy. Hanya akaun itu boleh melihat Sheet penuh.

## Had diketahui

- Menukar telefon: data yang belum dihantar kekal dalam telefon lama sahaja. Tekan **Simpan & Hantar** sebelum bertukar.
- Dua orang edit **medan yang sama** pada isu yang sama serentak: yang terakhir menyimpan menang.
- Hanya 200 rondaan terkini dipaparkan dalam senarai app (semua kekal dalam Sheet).

## Hos di GitHub Pages (ganti Netlify)

1. Cipta repo `glory-round` di GitHub, push seluruh folder ini (`git push -u origin main`).
2. Repo > Settings > Pages > Source: **GitHub Actions**. Workflow `.github/workflows/pages.yml` akan deploy folder `pwa/` secara automatik.
3. URL app: `https://<username>.github.io/glory-round/`
4. Pages percuma memerlukan repo **public**. Jika URL `/exec` diletakkan dalam `pwa/config.js` dan repo public, sesiapa yang jumpa URL boleh mengakses data: **tetapkan PIN** dalam `Code.gs` dan Tetapan app.
