# 07 — Roadmap, Decision Log, Risks, dan Definition of Done

## 1. Roadmap

### Phase 0 — Planning

- **Objective:** mengunci masalah, scope, limits, privacy promise, dan baseline visual.
- **Features/work:** PRD, wireframe, tokens, architecture spike Canvas untuk format/browser.
- **Prerequisites:** nama kerja, domain strategy, browser target.
- **Risks:** scope creep, klaim PNG/AVIF tidak realistis.
- **Exit:** acceptance criteria disetujui dan spike memvalidasi JPEG/PNG/WebP.

### Phase 1 — Image Compressor MVP

- **Objective:** satu gambar berhasil diproses dan diunduh secara lokal.
- **Features:** upload/drop, validation, preview, presets, compress, result, download, retry/reset.
- **Technical:** modular JS, cleanup, tests, CSP, static deployment, privacy page.
- **Prerequisites:** fixtures dan QA devices.
- **Risks:** memory pressure, browser differences, misleading savings.
- **Exit:** seluruh MVP DoD lulus.

### Phase 2 — Image Tools

- **Objective:** membuktikan reuse fondasi.
- **Features:** resizer, converter, crop sederhana; batch hanya setelah research.
- **Technical:** shared tool shell, route metadata, lazy modules.
- **Prerequisites:** data permintaan dan stable single-file core.
- **Risks:** tool pages tipis/duplikat dan bundle membengkak.

### Phase 3 — Text Tools

- **Objective:** tambah utility aman tanpa upload.
- **Features:** case converter, word counter, text cleaner yang benar-benar berbeda.
- **Technical:** shared input privacy rules; clipboard permission minimal.
- **Prerequisites:** taxonomy/navigation mampu menampung kategori.
- **Risks:** pages generik tanpa nilai unik.

### Phase 4 — File/PDF Tools

- **Objective:** utility file lokal dengan batasan jelas.
- **Features:** metadata viewer/remover atau PDF operation yang feasible client-side.
- **Technical:** evaluate audited WASM/library, Worker, memory budgets.
- **Prerequisites:** security review dependency dan format.
- **Risks:** malicious parser, bundle besar, low-end device crash, license.

### Phase 5 — SEO Expansion

- **Objective:** organic discovery melalui utility + content berkualitas.
- **Features:** category pages, guides berbasis masalah, internal links.
- **Technical:** evaluate Astro/static content collections, automated sitemap.
- **Prerequisites:** beberapa tools berkualitas dan Search Console data.
- **Risks:** thin/duplicate content dan maintenance debt.

### Phase 6 — Monetization

- **Objective:** mendanai operasi tanpa merusak completion/trust.
- **Features:** satu ad placement terkontrol, consent bila perlu.
- **Technical:** CSP update, reserved slots, performance monitoring.
- **Prerequisites:** policy review, stable CWV, meaningful traffic/content.
- **Risks:** accidental clicks, CLS/INP regression, privacy complexity.

### Phase 7 — Optional Backend Tools

- **Objective:** mendukung pekerjaan yang secara nyata tidak feasible di browser.
- **Features:** server codec/heavy transforms/API only where justified.
- **Technical:** auth, quotas, queue, TTL storage, malware/format controls, cost limits.
- **Prerequisites:** validated demand/revenue dan threat model baru.
- **Risks:** SSRF, upload abuse, data breach, runaway cost.

### Phase 8 — Scaling

- **Objective:** reliability dan operasional pada traffic tinggi.
- **Features:** SLO, incident response, support, regional/legal review.
- **Technical:** observability sampled, load/cost tests, isolation/circuit breakers.
- **Prerequisites:** real bottleneck data.
- **Risks:** premature architecture, vendor lock-in, operational burden.

## 2. Decision Log

| ID | Decision | Chosen | Alternatives | Reason | Trade-off | When to revisit |
| --- | --- | --- | --- | --- | --- | --- |
| D-01 | Frontend | Vanilla HTML/CSS/JS + Vite | React, Next, Astro | simplest safe solution, small bundle | manual state/component discipline | ≥5–10 routes or complex shared UI |
| D-02 | Hosting | Cloudflare Pages | Vercel, GitHub Pages | static CDN, headers, commercial path | provider config | policy/cost/support no longer fit |
| D-03 | Database | none | Firebase, Supabase | no persistent server state | no cloud history/accounts | validated account/quota need |
| D-04 | Processing | Canvas/createImageBitmap/toBlob | server, heavy WASM | local privacy and low cost | codec/browser variation | unsupported demanded formats or quality gap |
| D-05 | Upload count | one file | batch | tight MVP, predictable memory | repetitive for power users | demand + stable single-file metrics |
| D-06 | Formats | JPEG/PNG/WebP; AVIF enhancement | all formats | realistic native APIs | not universal | runtime support/codec need improves |
| D-07 | Limit | 20 MB, 40 MP | unlimited/lower | protects low-end devices | rejects some files | telemetry/device tests |
| D-08 | Analytics | privacy-first page/RUM, minimal events | GA/full session replay | data minimization | less granular funnel | specific decision needs data |
| D-09 | Domain | one canonical global domain | country subdomains/multi-domain | consolidates authority/maintenance | localization later | legal/market need |
| D-10 | Deployment | Git PR → preview → production | manual FTP/server | reproducible rollback | initial CI setup | never bypass for routine changes |
| D-11 | Ads | after product validation | day-one ads | preserve UX/trust | delayed revenue | quality and traffic gates met |
| D-12 | Fonts | system stack | Google/self-host custom | performance/privacy | less branded | brand system mature |

## 3. Risks dan Mitigations

| Risk | Likelihood | Impact | Mitigation | Trigger/owner action |
| --- | --- | --- | --- | --- |
| Large image crashes tab | Medium | High | byte/pixel/raw memory limit; low-end testing | lower limit or Worker when failures >2% |
| PNG savings disappoint | High | Medium | honest format copy; WebP option | add audited optimizer only with evidence |
| AVIF unavailable | Medium | Low | runtime feature detection | keep hidden/fallback |
| Browser output differs | Medium | Medium | MIME verification + cross-browser tests | format-specific fallback |
| File privacy claim violated by SDK | Low/Medium | Critical | no generic SDK; network test; telemetry adapter | immediately disable vendor and investigate |
| Dependency compromise | Low | High | zero runtime deps where possible; lock/review | revoke/update/rollback |
| SEO pages become thin | Medium | High | utility-first publication gate | noindex/delete/merge weak pages |
| Ads harm UX/CWV | Medium | High | delayed rollout, reserved space, experiments | rollback if completion/CWV degrades |
| Provider pricing/policy changes | Medium | Medium | annual review, portable static output | migrate static host |
| Analytics misleads due bots | High at scale | Medium | coarse filters, multiple signals | annotate incidents and avoid single-metric decisions |
| Trademark/domain conflict | Low/Medium | High | name/domain/legal search before launch | rebrand before reputation compounds |
| Accessibility regression | Medium | High | reusable controls, CI + manual gate | block release on critical issue |
| Scope creep | High | Medium | explicit out-of-scope and phase gates | move request to backlog with evidence |

## 4. Definition of Done — MVP

### Functional

- [ ] upload via picker dan drag/drop berhasil;
- [ ] JPEG/PNG/WebP policy sesuai runtime dan dokumentasi;
- [ ] validation byte/type/signature/decode/dimensi bekerja;
- [ ] preview, settings, compression, metrics, download, reset/retry bekerja;
- [ ] output MIME/extension cocok;
- [ ] output larger ditangani jujur;
- [ ] stale/cancel/reset tidak menghasilkan state salah.

### UX dan accessibility

- [ ] responsive 320 px hingga desktop;
- [ ] seluruh flow keyboard-only;
- [ ] screen reader status/error smoke test;
- [ ] contrast/reflow/touch target/reduced motion lulus;
- [ ] tidak ada AI-slop: hero raksasa, decorative cards, gradient/glass/neon berlebihan;
- [ ] pesan error jelas, singkat, dan punya recovery.

### Security dan privacy

- [ ] file tidak keluar browser pada Network test;
- [ ] tidak ada file/name/blob URL pada telemetry/log;
- [ ] XSS filename test aman;
- [ ] object URLs/canvas/bitmap dibersihkan;
- [ ] CSP/HSTS/nosniff/referrer/permissions/frame protections terverifikasi di production;
- [ ] no secrets committed; dependency/secret scans clean atau exception terdokumentasi;
- [ ] privacy page sesuai perilaku nyata.

### Performance/SEO

- [ ] bundle budgets lulus;
- [ ] lab mobile performance acceptable dan tidak ada long freeze untuk fixture target;
- [ ] target CWV siap diukur, layout tidak shift;
- [ ] title/meta/canonical/robots/sitemap/OG/semantic HTML ada;
- [ ] tool/content dapat dipahami tanpa JS processing berhasil.

### Testing/deployment

- [ ] unit/integration/e2e/browser/mobile/security/accessibility checklist lulus;
- [ ] CI dari clean install lulus;
- [ ] preview acceptance lulus;
- [ ] custom domain, HTTPS, redirects, headers bekerja;
- [ ] rollback telah dicoba atau prosedurnya diverifikasi;
- [ ] monitoring dasar dan owner incident ditentukan.

## 5. Release gates

- **Alpha:** developer-local; data synthetic; feature complete boleh belum polished.
- **Beta:** staging/public terbatas; privacy/security headers; core accessibility; analytics minimal.
- **Production:** DoD lengkap, content/legal pages, production header/network checks, rollback ready.
- **Monetized:** production stabil + policy/consent/CSP/performance/ad placement gate terpisah.

