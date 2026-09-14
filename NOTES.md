# Royal Halong Hotel — Clone Notes

- **Source:** https://royalhalonghotel.com/vi/ (Vietnamese locale)
- **Cloned:** 2026-09-14
- **Mode:** 忠实复刻 / faithful clone (real source, real assets, real fonts, real colors)
- **Complexity:** L2 — server-rendered WordPress marketing site, no WebGL/canvas, no SPA routing
- **Entry point:** `index.html`

## Run it

```bash
python3 -m http.server 8899 --bind 127.0.0.1
# → http://127.0.0.1:8899/index.html
```

Every path is relative, so the tree also opens from the OpenDesign file preview and
survives being zipped and moved.

## Stack (from real source, not inferred)

| Layer | What the original actually uses |
|---|---|
| CMS | WordPress (page id `3609`, `wp-singular page-template-default`) |
| Theme | **Salient 15.0.8** (`wp-content/themes/salient`), `material` skin |
| Page builder | WPBakery / `js_composer_salient` 6.9.1 |
| Plugins | `salient-core`, `salient-portfolio`, `sitepress-multilingual-cms` (WPML 4.6.3), `types` |
| JS | jQuery 3.7.1 + migrate, Flickity 2.3, anime.js, fancyBox 3.3.8, waypoints, superfish, select2, Leaflet 1.3.1 |
| Map | Leaflet + OpenStreetMap tiles (no Google Maps key) |
| SEO | Yoast 20.10 (JSON-LD graph preserved) |

## Design tokens (copied from `salient-dynamic-styles.css`, not eyeballed)

| Token | Value | Used for |
|---|---|---|
| Gold (primary accent) | `#bf8d2c` | headings, CTA fill, footer ground |
| Gold (hover/alt) | `#d19f2b` | hover + secondary accent |
| Deep gold | `#9b7f22` | pressed states |
| Near-black | `#0a0a0a` | dark sections |
| Cream | `#f4ece2` | alternating band backgrounds |
| Sky | `#98c8e8` | small highlights |
| Body text | `#333333` | paragraph copy |
| Peach | `#ffac66` | tertiary highlight |

**Type stack — all four families self-hosted** in `assets/fonts/` (26 woff2 files):
`Arsenal` 700 (H1 / display), `Inter` 400/500/600/700 (body + UI), `Cormorant` 500 + 500italic
(editorial accents), `Fahkwang` 500. No system-font substitution anywhere — verified via
`document.fonts` at runtime.

## What was mirrored

- **22 routes**, each as `<slug>/index.html`
- **1,111 same-origin assets** (CSS, JS, images incl. every srcset variant, icon fonts, media)
- **26 Google Font files** pulled down and rewritten to `assets/fonts/fonts.css`

Routes: home · luu-tru-phong-khach-san-villas · casino · culinary · experiences · offers ·
our-gallery · reservation · royal-international-convention-palace · wedding · news ·
our-announcement · payment-methods · privacy-policy · terms-and-conditions ·
deluxe · premium · villas-deluxe · villas-suite · 3 news articles

## Changes made to the original (complete list)

1. **Removed Google Tag Manager** — `gtag/js?id=GT-P84QK984` script tag, the inline
   `dataLayer`/`gtag()` config block, and the `googletagmanager.com` dns-prefetch. (22 pages)
2. **Removed the Facebook Customer Chat SDK** — `connect.facebook.net/.../xfbml.customerchat.js`
   loader, the `.fb-customerchat` widget div, and `#fb-root`. (22 pages)
3. **Removed `<script type="speculationrules">`** — it prefetched `/vi/*` from the live origin.
4. **Removed WP feed / REST / oembed / xmlrpc `<link>` tags** — dead locally. `hreflang`
   alternates were deliberately kept.
5. **Google Fonts → self-hosted**, `<link>` repointed at `assets/fonts/fonts.css`.
6. **Absolute → relative paths** for every `wp-content` / `wp-includes` reference, with
   `?ver=` cache-busting stripped.
7. **`ajaxurl` emptied, `rooturl` localised** in the inline `nectarLove` config so nothing
   calls back to `royalhalonghotel.com/wp-admin`.
8. **One broken-link repair:** the live site's own nav points at `/vi/accommodation/`, which
   **404s upstream**. It is routed here to `luu-tru-phong-khach-san-villas/` — the real
   Vietnamese accommodation page. This is the *only* deviation from the original DOM.
9. **One emoji localised:** a `static.xx.fbcdn.net` emoji image embedded in pasted Facebook
   content inside a news article was downloaded to `assets/img/emoji-2757.png` to kill the
   last third-party request.

## Fidelity — measured, not asserted

Original vs clone, both at 1440px in the same browser:

| Metric | Original | Clone |
|---|---|---|
| Accessibility-tree lines | 369 | 369 |
| Lines differing (normalised) | — | **1** (the intentional link repair, item 8) |
| `document.documentElement.scrollHeight` | 4639 | **4639** |
| Images in DOM | 39 | **39** |
| Broken images | 0 | **0** |
| Font faces loaded | 9 | **9** (identical list) |
| Computed `h1` | Arsenal, 15.12px, `rgb(255,255,255)` | **identical** |
| Computed `body` | Inter, 16px, `rgb(51,51,51)` on `rgb(255,255,255)` | **identical** |
| Leaflet tiles rendered | 6 | **6** |
| Console errors | — | **0** |

Local reference integrity: **2,762 refs checked across 22 pages, 0 missing.**
Gallery page under full lazy-load scroll: **90 images, 0 broken, 77 lightbox links.**

### Homepage is pixel-identical

Full-page screenshots (1440×4639) of origin and clone, both captured with animations frozen
and after every image had decoded:

```
original-1440.png   md5 793a524a6a4d820a0c601413fd6cda49
clone-1440.png      md5 793a524a6a4d820a0c601413fd6cda49
```

**0 of 6,680,160 pixels differ.** The two PNGs are byte-identical.

Because a perfect result is the kind that is usually a measurement bug, it was controlled:

- **Navigation proof** — each capture recorded its own `location.host` and page contents. The
  origin capture reported `royalhalonghotel.com` with `hasGTM: true`, `hasFBSDK: true` and
  fonts from `fonts.googleapis.com`; the clone capture reported `127.0.0.1:8899` with
  `hasGTM: false`, `hasFBSDK: false` and fonts from `assets/fonts/fonts.css`. Two demonstrably
  different documents.
- **Reproducibility** — four independent captures across two separate runs and two different
  URLs all produced md5 `793a524a…`.
- **Negative control** — the same harness run against `casino/` produced a completely different
  image (md5 `0de25308…`, 6484×4848), confirming it does detect differences.

An earlier capture pass showed a 1.53% diff concentrated at y≈1800–2000. That was investigated
rather than waved off: `RECON/screenshots/band-compare.png` shows the band is the `THƯ VIỆN ẢNH`
Flickity carousel, where the origin had painted only 2 of 4 thumbnails mid-entrance-animation
while the clone (loading from disk) had all 4. Same images, same order — a capture-timing
artifact caused by the clone being *faster* than the origin. With a proper settle it resolves
to zero.

### Per-route runtime comparison

18 of 22 routes were loaded live in the browser side-by-side against the origin. Every one
matched exactly on `scrollHeight`, image count and loaded-font count, with 0 broken images and
0 console errors:

| Route | scrollHeight o/c | imgs o/c | fonts o/c |
|---|---|---|---|
| home | 4639 / 4639 | 39 / 39 | 17 / 17 |
| luu-tru-phong-khach-san-villas | 3297 / 3297 | 13 / 13 | 13 / 13 |
| casino | 4848 / 4848 | 32 / 32 | 14 / 14 |
| culinary | 4209 / 4209 | 22 / 22 | 13 / 13 |
| experiences | 3832 / 3832 | 32 / 32 | 13 / 13 |
| offers | 3461 / 3461 | 16 / 16 | 13 / 13 |
| our-gallery | 4850 / 4850 | 90 / 90 | 13 / 13 |
| reservation | 1306 / 1306 | 14 / 14 | 14 / 14 |
| royal-international-convention-palace | 4287 / 4287 | 14 / 14 | 14 / 14 |
| wedding | 2214 / 2214 | 29 / 29 | 13 / 13 |
| news | 2378 / 2378 | 20 / 20 | 13 / 13 |
| our-announcement | 7632 / 7632 | 13 / 13 | 14 / 14 |
| payment-methods | 1274 / 1274 | 11 / 11 | 13 / 13 |
| privacy-policy | 7858 / 7858 | 11 / 11 | 13 / 13 |
| terms-and-conditions | 6226 / 6226 | 13 / 13 | 13 / 13 |
| deluxe | 3299 / 3299 | 38 / 38 | 13 / 13 |
| premium | 3342 / 3342 | 33 / 33 | 13 / 13 |
| villas-deluxe | 3318 / 3318 | 33 / 33 | 13 / 13 |

The remaining 4 (`villas-suite` + the 3 news articles) were **not** given a live side-by-side —
the origin began timing out after ~60 requests, most likely rate-limiting. They were verified
statically instead: `<img>` counts match the original exactly (34/34, 16/16, 16/16, 19/19),
0 missing local refs, no trackers, fonts local. See `RECON/static-route-check.mjs`.

### Content fidelity — all 22 routes

Visible text (scripts/styles/tags stripped) extracted from the untouched original in
`RECON/pages/` and from the delivered clone, then compared character-by-character:
**22 / 22 routes byte-identical.** Not one word of copy drifted. See `RECON/textdiff.mjs`.

Scores (per `references/assessment.md`): structure 5/5 · visual 5/5 · responsive 5/5 ·
interaction 4/5 · content 5/5 · functional completeness 3/5.

## Known gaps

- **Booking engine is a façade.** "ĐẶT PHÒNG" / reservation forms are the original markup, but
  the WP admin-ajax endpoint is gone. No submission works. This is expected — server-side
  business logic is explicitly out of scope.
- **English locale not mirrored.** The WPML language switcher and a handful of footer links
  still point at `https://royalhalonghotel.com/...` (EN routes). Only `/vi/` was cloned.
- **3 upstream 404s not fixed:** `leaflet/marker-shadow.png`, `layers.png`, `layers-2x.png`.
  These 404 on the live site too — Salient ships Leaflet CSS without those sprites. No visual
  impact; the map renders correctly.
- **`drive.google.com` links (96)** in menus/offers are the original's external file links; left
  intact. **`secure.gravatar.com`** avatars on news posts also left as external.
- **Interaction verification is partial.** Scroll, lazy-load, waypoint entrance animations and
  carousel layout were exercised and confirmed (full-page scroll walks on every checked route).
  Hover, click-through and lightbox *opening* were not driven, because synthesised
  `PointerEvent`s carry `isTrusted=false` and do not reliably drive Flickity/fancyBox — so those
  are asserted only as "bound and present" (77 lightbox links on the gallery), not "exercised".
- **4 of 22 routes lack a live origin comparison.** `villas-suite` and the 3 news articles were
  verified statically (image counts vs original, 0 missing refs, no trackers, local fonts) and
  by text-identity, but the origin started timing out after ~60 requests so no side-by-side
  runtime measurement was taken for them.
- **Recon tooling note:** the skill's CDP scripts (`recon-site.mjs`, `asset-harvest.mjs`) failed
  with `CDP connection closed` in this sandbox across both the daemon and local-Chrome launch
  paths. Harvesting was done with an equivalent purpose-built fetch crawler
  (`RECON/harvest-all.mjs`, `RECON/rewrite.mjs`, `RECON/verify.mjs`), and visual/runtime
  verification via the provisioned Playwright MCP. No browser was installed into this project.

## ⚠️ Must replace before any public deployment

This is a faithful clone of a live commercial hotel site. It is fine for local study and as a
build base; it is **not** deployable as-is.

- [ ] All photography in `wp-content/uploads/` — copyrighted by Royal Halong Hotel
- [ ] Logo marks (`assets`/uploads logo files) and the "Royal Halong Hotel" wordmark
- [ ] All Vietnamese body copy, room descriptions, offers, news articles
- [ ] Company registration details in the footer (GCN ĐKKD 5700102119, tax/legal identifiers)
- [ ] Contact details: `+84 203 3847 209`, `info@royalhalonghotel.com`, physical address
- [ ] The "Đã thông báo Bộ Công Thương" badge — a Vietnamese government registration specific
      to this business; using it for another entity is a legal problem
- [ ] Yoast JSON-LD `@id` graph and `hreflang` tags still naming `royalhalonghotel.com`
- [ ] TripAdvisor / Facebook / Instagram social links

**Licensing:** Salient is a commercial ThemeForest theme; its bundled CSS/JS is mirrored here
under `wp-content/themes/salient/`. A regular ThemeForest licence is required to deploy it.
The site content itself carries no open licence — default "all rights reserved".

## Files

```
index.html                    home (entry point, 174 KB — the faithful clone)
danh-muc-trang.html           lightweight navigation index (12 KB, not in the original)
<slug>/index.html             × 21 other routes
wp-content/                   mirrored theme, plugin and upload assets (~30 MB)
wp-includes/                  jQuery + migrate
assets/fonts/                 26 self-hosted woff2 + fonts.css
assets/img/emoji-2757.png     localised FB emoji
RECON/pages/                  untouched original HTML, per route (read-only baseline)
RECON/crawl.mjs,crawl2.mjs    route discovery + page fetch
RECON/fonts.mjs               Google Fonts → self-hosted woff2
RECON/harvest-all.mjs         asset crawler (1,111 files)
RECON/rewrite.mjs             path rewrite + tracking removal
RECON/verify.mjs              local-reference integrity (2,762 refs)
RECON/textdiff.mjs            visible-text diff vs original, all 22 routes
RECON/static-route-check.mjs  static check for the 4 rate-limited routes
RECON/asset-manifest.json     1,111 originalUrl → localPath entries
RECON/route-map.json          route inventory with titles
RECON/find-orphans.mjs        unreferenced-asset scan (found 1 orphan, deleted)
RECON/screenshots/            original-1440.png + clone-1440.png (byte-identical pair),
                              band-compare.png (carousel timing-artifact investigation),
                              danh-muc-trang.png (navigation index render)
CLONE_REPORT.md               original vs clone comparison
CLONE_AUDIT.md                tracking / brand-residue / external-URL scan
```
