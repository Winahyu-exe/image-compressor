# 01 — Product Requirements Document

## 1. Executive Summary

Image Compressor adalah utility web yang membantu pengguna memperkecil ukuran gambar tanpa mengunggah file ke server. Produk mengutamakan satu pekerjaan utama: pilih gambar, atur kompresi, proses, lihat hasil, lalu unduh. Fondasi dibuat modular agar tool gambar, teks, URL, dan file lain dapat ditambahkan tanpa mengubah prinsip inti.

Nilai utamanya:

- privasi yang dapat dijelaskan dengan kalimat sederhana: “Gambar diproses di perangkat Anda”;
- waktu menuju hasil yang pendek;
- tidak memerlukan akun;
- tetap berguna di jaringan lambat setelah halaman termuat;
- biaya infrastruktur hampir nol karena komputasi memakai perangkat pengguna.

## 2. Product Vision

Menjadi platform utility global yang tepercaya karena setiap tool benar-benar berguna, cepat, transparan, dan tidak mengeksploitasi file atau perhatian pengguna.

Prinsip produk:

1. Satu halaman, satu pekerjaan utama.
2. Utility dahulu, konten dan monetisasi mengikuti.
3. Data minimum dan tidak ada upload tersembunyi.
4. Fitur baru harus membenarkan kompleksitasnya.
5. Pengguna harus memahami keadaan aplikasi tanpa istilah teknis.

## 3. Problem Statement

Pengguna sering perlu mengecilkan gambar untuk formulir, email, website, atau penyimpanan. Banyak layanan terasa berat, memaksa upload ke server, tidak menjelaskan privasi, menyisipkan iklan di sekitar tombol, atau membuat pengguna bingung dengan terlalu banyak opsi. Produk ini menyelesaikan kebutuhan tersebut melalui pemrosesan lokal dan alur yang dapat dipahami dalam beberapa detik.

## 4. Target Users

- Pengguna umum yang harus memenuhi batas ukuran upload.
- Pelajar/mahasiswa yang mengirim dokumen atau tugas.
- Pemilik UMKM yang mengoptimalkan foto katalog.
- Content creator dan pengelola website nonteknis.
- Developer/desainer yang membutuhkan kompresi cepat tanpa instalasi.

Bukan target MVP: pipeline produksi massal, arsip medis/sangat sensitif dengan persyaratan regulasi khusus, editor foto profesional, atau API otomatis.

## 5. User Personas

### Rina — pengguna sesekali

- Perangkat: Android kelas menengah.
- Tujuan: membuat foto di bawah batas formulir.
- Hambatan: tidak memahami kualitas codec atau dimensi.
- Kebutuhan: preset sederhana, ukuran jelas, pesan gagal yang membantu.

### Arif — pemilik toko online

- Perangkat: laptop Windows.
- Tujuan: memperkecil foto produk tanpa merusak tampilan.
- Hambatan: khawatir file produk tersimpan di layanan asing.
- Kebutuhan: preview, kontrol kualitas, klaim privasi yang konkret.

### Maya — pengelola web

- Perangkat: desktop.
- Tujuan: mengoptimalkan gambar artikel dengan cepat.
- Hambatan: pekerjaan berulang.
- Kebutuhan sekarang: hasil konsisten; kebutuhan masa depan: batch processing dan resize.

## 6. User Needs dan Jobs to Be Done

| Situasi | Job to be done | Outcome |
| --- | --- | --- |
| File ditolak karena terlalu besar | “Bantu saya membuatnya cukup kecil.” | ukuran berkurang dan file dapat diunduh |
| Website lambat karena foto besar | “Kecilkan file tanpa penurunan visual berlebihan.” | hasil lebih ringan dengan preview |
| Gambar bersifat privat | “Proses tanpa mengirim file saya.” | file tetap di browser |
| Pengguna tidak teknis | “Berikan pilihan yang mudah.” | preset dan bahasa sederhana |

## 7. Product Scope

### MVP — masuk scope

1. Landing/tool page yang dapat dibuka tanpa login.
2. Satu file per sesi melalui file picker atau drag-and-drop.
3. Validasi tipe, ukuran byte, dan dimensi setelah decode.
4. Preview aman menggunakan object URL.
5. Ukuran asli dengan satuan yang mudah dibaca.
6. Kontrol kualitas: Smaller, Balanced, Better Quality serta slider opsional.
7. Kompresi JPEG, PNG, dan WebP yang dapat didecode browser.
8. Output default mempertahankan format bila encoder tersedia; opsi WebP untuk foto.
9. Progress/status yang accessible.
10. Ukuran hasil, selisih byte, dan persentase perubahan.
11. Download melalui interaksi pengguna.
12. Retry, reset, dan pilih file lain.
13. Error handling, cleanup memori, basic SEO, analytics minimum, dan security headers.

### Format MVP

| Format input | Keputusan | Catatan |
| --- | --- | --- |
| JPEG | Didukung | encode lossy melalui Canvas `toBlob()` |
| PNG | Didukung | encode PNG; slider kualitas umumnya tidak memberi efek karena lossless; tawarkan WebP untuk penghematan |
| WebP | Didukung jika runtime test lolos | browser modern umumnya mendukung decode/encode |
| AVIF | Progressive enhancement | terima hanya jika decode berhasil; encode hanya jika runtime test membuktikan MIME output benar |
| GIF/APNG animasi | Ditolak di MVP | Canvas akan meratakan frame; jangan diam-diam menghilangkan animasi |
| SVG | Ditolak | active-content dan model keamanan berbeda; bukan gambar raster upload biasa |

Browser wajib mendukung output PNG. JPEG dan WebP umum tersedia, tetapi dukungan encoder harus dideteksi dengan memeriksa `Blob.type`; browser dapat fallback ke PNG bila MIME tidak didukung. Referensi: [MDN `toBlob()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) dan [panduan format gambar MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types).

### Future scope

- batch/multiple files dan ZIP download;
- target file size;
- resize, crop, metadata removal control, compare slider;
- PWA/offline install;
- JPG↔PNG/WebP/AVIF converter;
- history lokal opt-in;
- API/server processing untuk format atau ukuran yang browser tidak mampu;
- akun, sinkronisasi, premium, dan team workflow hanya jika ada bukti kebutuhan.

### Explicitly out of scope untuk MVP

- akun, authentication, subscription, database;
- penyimpanan file/histori di cloud;
- API publik;
- kompresi batch;
- PDF/video/audio;
- image editing penuh;
- jaminan target byte yang presisi;
- server-side image processing;
- iklan pada tahap validasi awal;
- pelacakan lintas situs atau analytics berbasis nama file.

## 8. Functional Requirements

| ID | Requirement | Prioritas |
| --- | --- | --- |
| FR-01 | Sistem menerima satu file melalui picker dan drop zone. | Must |
| FR-02 | Drop zone juga berupa tombol keyboard-accessible. | Must |
| FR-03 | Sistem menolak tipe yang tidak diizinkan sebelum decode dan memvalidasi hasil decode. | Must |
| FR-04 | Batas default 20 MB dan 40 MP. | Must |
| FR-05 | Sistem menampilkan preview, nama yang di-escape sebagai text, dimensi, dan ukuran asli. | Must |
| FR-06 | Pengguna memilih preset/quality dan format output yang tersedia. | Must |
| FR-07 | Compression berjalan asynchronous dan mencegah double-submit. | Must |
| FR-08 | UI menampilkan status idle, validating, ready, processing, success, error. | Must |
| FR-09 | Hasil menampilkan ukuran, selisih, persentase, dan format. | Must |
| FR-10 | Download memakai nama aman dan tidak menjalankan isi file. | Must |
| FR-11 | Reset/retry mencabut object URLs dan referensi Blob lama. | Must |
| FR-12 | Jika hasil lebih besar, UI jujur dan memberi opsi ulang. | Must |
| FR-13 | Analytics tidak membawa nama, isi, URL blob, atau hash file. | Must |

## 9. Non-Functional Requirements

- **Privacy:** byte file tidak dikirim keluar browser dalam MVP.
- **Security:** tidak memakai `innerHTML` untuk data file; batas byte dan pixel; CSP; tidak ada secret frontend.
- **Performance:** initial JavaScript gzip target ≤ 60 KB; CSS ≤ 25 KB; halaman usable pada koneksi lambat.
- **Core Web Vitals:** p75 LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.
- **Accessibility:** target WCAG 2.2 AA; semua fungsi tersedia melalui keyboard.
- **Compatibility:** dua versi terbaru Chrome/Edge/Firefox/Safari dan mobile modern; fallback yang jelas.
- **Reliability:** error decode/encode tidak membuat halaman macet; resource selalu dibersihkan.
- **Maintainability:** pemrosesan terpisah dari DOM/UI; setiap tool mengikuti kontrak modul yang sama.
- **SEO:** konten tool ada di HTML statis; tidak membutuhkan JS untuk title, heading, FAQ esensial.

## 10. User Stories dan Acceptance Criteria

### US-01 — Memilih file

Sebagai pengguna, saya ingin memilih atau menjatuhkan gambar agar dapat memulai tanpa membaca panduan panjang.

Acceptance:

- picker hanya menyarankan MIME yang didukung;
- drop dan picker masuk pipeline validasi yang sama;
- file valid berpindah ke state Ready;
- file invalid menampilkan satu pesan utama dan recovery action;
- fokus dipindahkan secara wajar ke error summary hanya jika diperlukan.

### US-02 — Mengatur dan memproses

Sebagai pengguna nonteknis, saya ingin memilih preset agar tidak harus memahami codec.

Acceptance:

- Balanced dipilih default;
- label menjelaskan dampak kualitas/ukuran;
- tombol Compress aktif hanya saat input valid;
- selama proses, tombol disabled dan status diumumkan melalui `aria-live`;
- pekerjaan dapat dibatalkan dengan reset/pilih file baru.

### US-03 — Memahami hasil

Sebagai pengguna, saya ingin tahu apakah hasil benar-benar lebih kecil.

Acceptance:

- ukuran asli dan hasil memakai unit yang konsisten;
- persentase dihitung dari byte aktual: `(original-result)/original × 100`;
- nilai negatif ditampilkan sebagai “X% larger”, bukan “saved -X%”;
- preview dan format output ditampilkan;
- tombol Download merupakan primary action pada state Success.

### US-04 — Menjaga privasi

Sebagai pengguna, saya ingin yakin bahwa file tidak dikirim ke server.

Acceptance:

- copy privasi pendek terlihat dekat upload;
- Network test memastikan tidak ada request yang mengandung byte/metadata file;
- privacy page menjelaskan proses lokal, analytics, dan keterbatasan cache/memori browser;
- tidak ada nama file di telemetry/log.

## 11. Success Metrics

### North-star awal

**Successful downloads / valid file selections.** Ini mengukur apakah tool menyelesaikan pekerjaan, bukan sekadar menarik page view.

### KPI MVP

- ≥ 80% file valid mencapai hasil kompresi.
- ≥ 65% sesi dengan hasil melakukan download.
- processing failure < 2% untuk file dalam batas pada browser target.
- error “unsupported/too large” mempunyai retry selection ≥ 30%.
- p75 CWV berada di kategori Good.
- 0 request yang berisi file, nama file, atau object URL.
- 0 pelanggaran accessibility kritis pada automated scan; seluruh alur lulus keyboard test manual.

Metrik bukan target manipulatif. Tidak ada dark pattern untuk menaikkan click/download.

## 12. Analytics Requirements

Event minimum:

| Event | Properti yang diizinkan |
| --- | --- |
| `page_view` | path, referrer domain bila legal/tersedia |
| `tool_open` | tool_id |
| `file_selected` | format_bucket, size_bucket, pixel_bucket |
| `compression_started` | preset, input_format, requested_output |
| `compression_completed` | format, size_bucket, savings_bucket, duration_bucket |
| `compression_failed` | stable_error_code, stage |
| `download_clicked` | format, savings_bucket |

Dilarang: nama file, bytes file, hash/fingerprint, object URL, EXIF, dimensi presisi jika dapat memperkuat fingerprint, atau pesan exception mentah.

## 13. SEO, Accessibility, Privacy, Security, Monetization Requirements

- SEO: satu URL kanonis `/image-compressor/`, title/deskripsi unik, content yang membantu, sitemap dan robots.
- Accessibility: WCAG 2.2 AA, keyboard, focus visible, semantic landmarks, status live, target sentuh nyaman.
- Privacy: pemrosesan lokal, data minimization, kebijakan privasi yang sesuai implementasi nyata.
- Security: defense-in-depth dari validasi awal sampai cleanup; dependency minimal; headers ketat.
- Monetization: tidak ada iklan sebelum utility stabil; kelak iklan dipisahkan secara visual dan tidak berdekatan dengan upload/download.

## 14. Product Constraints

- Memori dan kecepatan bergantung pada perangkat pengguna.
- Output Canvas dapat menghapus metadata/animasi dan mungkin mengubah color profile/orientation; behavior harus diuji dan dijelaskan.
- Kompresi ulang gambar yang sudah optimal dapat menghasilkan file lebih besar.
- Client-side tidak menghilangkan semua risiko malformed decoder; batas ukuran/dimensi dan browser yang diperbarui tetap penting.

