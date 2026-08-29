# 08 — Implementation Checklists

## 1. Checklist sebelum coding

- [ ] Setujui nama/domain sementara dan bahasa utama.
- [ ] Setujui 20 MB/40 MP dan single-file MVP.
- [ ] Buat fixtures synthetic untuk format/boundary.
- [ ] Spike `createImageBitmap`/Canvas/`toBlob()` di browser matrix.
- [ ] Catat WebP/AVIF runtime encode behavior dan orientation.
- [ ] Finalkan copy upload, privacy, errors, presets.
- [ ] Buat tokens CSS dan states sebelum polishing.

## 2. Build order

1. Static semantic page dan design tokens.
2. State model + rendering tanpa processor.
3. File picker/drop normalization.
4. Validator byte/type/signature/decode/dimensi.
5. Resource manager.
6. JPEG processing + Blob verification.
7. PNG/WebP policy + runtime feature detection.
8. Result metrics/download/reset/error.
9. Keyboard/screen reader/responsive pass.
10. Unit/e2e/security/network/memory tests.
11. SEO/privacy pages/security headers.
12. Preview deploy, production verification, rollback.

## 3. Pull request checklist

- [ ] Perubahan sesuai scope dan tidak menambah dependency tanpa decision note.
- [ ] User-facing state/error/recovery tercakup.
- [ ] Tidak ada `innerHTML`, eval, inline handler, atau secret.
- [ ] File/Blob/name tidak mencapai telemetry.
- [ ] Resource baru memiliki cleanup.
- [ ] Tests baru mencakup boundary/regression.
- [ ] Keyboard/focus/ARIA/contrast tidak mundur.
- [ ] Bundle/request diff diperiksa.
- [ ] CSP/third-party domains diff dijelaskan.
- [ ] Documentation/privacy update jika data flow berubah.

## 4. Checklist setiap tool baru

### Product

- [ ] intent unik dan utility nyata;
- [ ] success outcome terukur;
- [ ] MVP/out-of-scope tertulis;
- [ ] tidak menduplikasi thin page.

### Input dan privacy

- [ ] input untrusted, limits jelas;
- [ ] data flow diagram diperbarui;
- [ ] local/server label benar;
- [ ] retention dan analytics fields terdokumentasi;
- [ ] file/text sensitif tidak masuk log.

### Security

- [ ] threat model tool-specific;
- [ ] allowlist format dan output MIME;
- [ ] resource/CPU/memory budget;
- [ ] DOM injection test;
- [ ] dependency/license/advisory review;
- [ ] CSP tetap ketat.

### UX/accessibility

- [ ] obvious primary action;
- [ ] alternative untuk gesture/drop;
- [ ] loading nyata, error + recovery;
- [ ] keyboard, screen reader, zoom/reflow, reduced motion;
- [ ] mobile touch targets dan download behavior.

### Quality

- [ ] fixtures happy/boundary/malformed;
- [ ] unit/integration/e2e/browser/mobile;
- [ ] memory cleanup dan repeated actions;
- [ ] performance budgets;
- [ ] SEO metadata/content/internal links;
- [ ] production smoke dan rollback.

## 5. Production smoke test

- [ ] canonical HTTPS URL 200;
- [ ] alternate host/protocol redirect satu hop;
- [ ] title/canonical/robots/sitemap benar;
- [ ] hashed assets cache immutable; HTML revalidate;
- [ ] CSP/HSTS/nosniff/referrer/permissions/frame header hadir;
- [ ] upload → compress → download berhasil pada desktop/mobile;
- [ ] invalid/too-large error benar;
- [ ] Network tab tidak memperlihatkan file/name/blob URL keluar;
- [ ] analytics failure tidak merusak tool;
- [ ] rollback target tersedia.

## 6. Monthly health review

- [ ] completion/download/failure metrics;
- [ ] error per coarse browser/format;
- [ ] CWV p75 dan bundle size;
- [ ] dependency/security alerts;
- [ ] provider usage/billing/quota;
- [ ] policy/privacy/consent changes;
- [ ] broken links/indexing issues;
- [ ] accessibility/user complaints;
- [ ] backlog diprioritaskan dari evidence, bukan tren teknologi.

## 7. Time-sensitive verification sebelum launch

- [ ] Cloudflare Pages limits/pricing dan commercial terms terkini;
- [ ] registrar registration/renewal price dan tax;
- [ ] browser support untuk JPEG/PNG/WebP/AVIF encode/decode;
- [ ] WCAG version dan local legal obligations;
- [ ] AdSense content/placement/consent policies jika iklan akan dipasang;
- [ ] analytics retention/data processing terms;
- [ ] npm/Node/Vite supported versions dan advisories.

## 8. Official reference index

- [MDN Canvas `toBlob()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [MDN image format guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)
- [MDN OffscreenCanvas `convertToBlob()`](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Google Web Vitals](https://web.dev/articles/vitals)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare Pages custom headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Google AdSense Help](https://support.google.com/adsense/)

Referensi diperiksa 29 Agustus 2026. Dokumen vendor/browser/policy dapat berubah dan harus diperiksa ulang pada release gate.

