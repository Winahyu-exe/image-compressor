# 05 — Performance, SEO, Analytics, dan Monetization

## 1. Performance Strategy

### Budgets

| Metric | MVP target |
| --- | --- |
| HTML transfer | ≤ 30 KB gzip per tool page |
| Critical CSS | ≤ 15 KB gzip; total CSS ≤ 25 KB |
| Initial JS | ≤ 60 KB gzip |
| Tool processor chunk | ≤ 40 KB gzip tanpa codec WASM |
| Initial requests | ≤ 12 sebelum user action (tanpa ads) |
| LCP p75 | ≤ 2.5 s |
| INP p75 | ≤ 200 ms |
| CLS p75 | ≤ 0.1 |

Ambang CWV mengikuti [panduan Web Vitals resmi](https://web.dev/articles/vitals): LCP 2,5 detik, INP 200 ms, CLS 0,1 untuk kategori Good, dievaluasi pada p75.

### Delivery

- HTML statis dan CDN;
- hashed assets dengan immutable cache satu tahun;
- HTML revalidate agar deployment baru cepat terlihat;
- tidak ada webfont eksternal pada MVP;
- icon berupa inline SVG yang terpercaya atau sprite lokal kecil;
- reserve dimensions untuk image/ad slots guna mencegah CLS;
- load processor module saat tool page dibuka atau menjelang interaksi, bukan seluruh tool catalog.

### Runtime

- gunakan object URL, bukan base64;
- jangan menyimpan dua full-resolution canvas tanpa perlu;
- resize/draw sekali per attempt;
- debounce slider preview; compression final hanya pada explicit action;
- stale job tidak boleh menimpa state baru;
- Worker dipakai bila measurement menunjukkan long task/INP buruk, bukan sebagai arsitektur wajib.

### Measurement

- Lighthouse mobile di CI sebagai regression signal, bukan satu-satunya kebenaran;
- Chrome Performance untuk long tasks/memory;
- field CWV melalui privacy-respecting RUM;
- test perangkat nyata Android kelas bawah/menengah dan iPhone Safari;
- ukur halaman kosong, file kecil, file 20 MP, invalid file, dan repeated resets.

## 2. SEO Strategy

### URL dan content model

- `/image-compressor/` — tool utama;
- masa depan: `/image-resizer/`, `/jpg-to-png/`, `/png-to-jpg/`, `/webp-converter/`;
- kategori: `/image-tools/`, `/text-tools/`, `/file-tools/` hanya bila berisi katalog yang berguna;
- setiap page memiliki utility nyata yang cocok dengan intent; jangan clone halaman dengan pergantian keyword.

### Technical SEO checklist

- HTML memiliki language, title, meta description, canonical absolute;
- satu H1 jelas dan content dapat dibaca tanpa menjalankan tool;
- `robots.txt` tidak memblokir assets penting;
- `sitemap.xml` hanya berisi canonical 200 pages;
- Open Graph/Twitter metadata dengan image lokal berukuran tepat;
- favicon dan web app metadata secukupnya;
- status/redirect konsisten; HTTP→HTTPS dan noncanonical→canonical satu hop;
- noindex untuk preview/staging/internal utility yang tidak layak;
- structured data hanya jika konten memenuhi tipe schema; FAQ markup tidak dibuat sekadar mengejar rich result;
- navigation/internal links berupa `<a href>`, bukan click handler saja.

### On-page content

Struktur minimal:

1. H1 + manfaat nyata.
2. Tool segera.
3. “How to compress an image” langkah ringkas.
4. Format/support/limits.
5. Penjelasan privacy.
6. FAQ yang menjawab masalah aktual: quality, PNG, metadata, file larger.
7. Links ke tool terkait setelah tool tersedia.

Konten harus manusiawi dan spesifik, bukan 2.000 kata filler. Hindari klaim “best/free unlimited” bila ada limit perangkat/batas file.

### Internal linking

- tool → sibling tools yang menyelesaikan langkah berikutnya;
- category hub → semua utility berkualitas;
- guide → tool dengan CTA kontekstual;
- breadcrumbs baru digunakan ketika hierarchy cukup dalam;
- jangan membuat footer berisi ratusan exact-match anchors.

## 3. Analytics Strategy

### Pilihan

**What:** Cloudflare Web Analytics untuk page/performance; custom product events ditunda atau dikirim melalui endpoint first-party kecil hanya jika keputusan produk memerlukannya.  
**Why:** layanan resmi dideskripsikan free dan privacy-first serta tidak melacak pengguna individual lintas properti.  
**Trade-off:** funnel produk detail tidak langsung tersedia; data tetap melibatkan vendor/CDN.  
**When to change:** ketika MVP memiliki volume cukup dan keputusan UX memerlukan funnel per-event; lakukan privacy/legal review sebelum menambah endpoint/vendor.

Sumber resmi: [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/) dan [data collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/). **Time-sensitive: diperiksa 29 Agustus 2026.**

### Event schema rules

- properties berupa enum/bucket, tidak berupa input bebas;
- size buckets: `<1MB`, `1–5MB`, `5–10MB`, `10–20MB`;
- pixels: `<2MP`, `2–12MP`, `12–24MP`, `24–40MP`;
- duration: `<0.5s`, `0.5–2s`, `2–5s`, `>5s`;
- savings: `larger`, `0–20%`, `20–50%`, `50–80%`, `>80%`;
- stable error code, bukan stack trace;
- sampling boleh digunakan saat traffic besar;
- dokumentasikan retention dan consent/cookie requirement sesuai negara target sebelum launch global.

### Product dashboard minimum

- sessions/page views;
- valid selections;
- start → completion → download conversion;
- failure rate per format/browser family (coarse);
- processing duration buckets;
- CWV per route/device class;
- unsupported/too-large incidence untuk memutuskan perubahan batas/format.

## 4. Monetization Strategy

### Gate sebelum iklan

Iklan baru dipertimbangkan jika:

- tool stabil, konten privacy/terms/contact tersedia;
- terdapat genuine returning/organic usage;
- tidak ada accessibility/security blocker;
- halaman memiliki konten bernilai, bukan thin tool shell;
- layout telah menyediakan slot yang tidak menyebabkan CLS;
- kebijakan AdSense terbaru telah ditinjau langsung di [Google AdSense Help](https://support.google.com/adsense/).

### Placement principles

| Lokasi | Keputusan | Alasan |
| --- | --- | --- |
| Di antara heading dan upload | Hindari | menghalangi pekerjaan utama |
| Di dalam/drop zone | Dilarang | risiko accidental click/menipu |
| Tepat di atas Download | Dilarang | dapat tertukar sebagai action |
| Setelah result actions | Kandidat | task selesai; pisahkan label/whitespace |
| Antara explanatory sections | Kandidat | tidak mengganggu tool |
| Sidebar desktop | Kandidat hati-hati | jangan mengecilkan workspace; hidden pada mobile bila sempit |
| Sticky/overlay mobile | Hindari pada awal | menutupi konten/action dan meningkatkan gangguan |

### UX dan compliance rules

- label “Advertisement” jelas;
- spacing ≥24–32 px dari controls penting;
- slot memiliki tinggi yang dicadangkan agar CLS tidak melonjak;
- tidak ada CTA yang menyerupai iklan atau iklan menyerupai Download;
- jangan meminta/menyuruh pengguna mengklik iklan;
- consent management sesuai wilayah dan personalisasi vendor;
- ads script hanya dimuat setelah consent jika diwajibkan;
- CSP diperluas ke domain minimum yang benar-benar diperlukan;
- ukur revenue bersama completion rate, INP, CLS, bounce, dan complaints.

### Rollout

1. tanpa iklan saat validasi produk;
2. satu slot setelah explanatory content atau result area;
3. ukur 2–4 minggu;
4. tambah satu perubahan per eksperimen;
5. rollback jika completion turun material, CWV menjadi Poor, atau accidental-click complaint muncul.

Jangan mengakali kebijakan atau membuat halaman massal tipis demi inventory iklan. Revenue adalah constraint sekunder setelah kegunaan dan trust.

## 5. Interaction antarstrategi

Ads dan analytics memengaruhi CSP, performance, privacy, consent, dan layout. Karena itu penambahannya harus melewati change review:

- daftar domains baru;
- alasan data yang dikumpulkan;
- update privacy page;
- CSP diff;
- bundle/request/CWV diff;
- keyboard/screen reader/ad placement check;
- rollback plan.

