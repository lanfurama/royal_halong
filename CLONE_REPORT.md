# Clone Report — royalhalonghotel.com/vi/

Generated 2026-09-14. Original and clone measured in the same browser at 1440×900.

## Verdict

Faithful clone, verified to the pixel. The homepage renders **byte-identical** to the origin
(0 of 6,680,160 pixels differ), all 22 routes carry **character-identical visible text**, and the
rendered accessibility tree matches on **368 of 369 lines** — the single difference being a
deliberate repair of a link that 404s on the live site.

### Pixel diff — homepage, 1440×4639

| | md5 |
|---|---|
| `original-1440.png` | `793a524a6a4d820a0c601413fd6cda49` |
| `clone-1440.png` | `793a524a6a4d820a0c601413fd6cda49` |

**diffPixels: 0 / 6,680,160 — 100.000% match.** The PNGs are byte-identical.

Controls run, because a perfect score is usually a broken measurement:

- **Navigation proof** — origin capture self-reported `host=royalhalonghotel.com`, `hasGTM=true`,
  `hasFBSDK=true`, Google-hosted fonts; clone capture self-reported `host=127.0.0.1:8899`,
  `hasGTM=false`, `hasFBSDK=false`, local fonts. Different documents, confirmed in-page.
- **Reproducibility** — 4 independent captures, 2 runs, 2 URLs, all md5 `793a524a…`.
- **Negative control** — same harness on `casino/` → md5 `0de25308…`, 6484×4848. It detects
  differences.

A first pass measured 1.53% divergence at y≈1800–2000. Investigated, not dismissed:
`RECON/screenshots/band-compare.png` shows it is the `THƯ VIỆN ẢNH` Flickity carousel, where the
origin had painted 2 of 4 thumbnails mid-animation and the clone (disk-loaded) had all 4 — same
images, same order. A capture-timing artifact of the clone being faster. Resolves to zero with a
proper settle.

## Runtime comparison — homepage

| Metric | Original | Clone | Match |
|---|---|---|---|
| Page title | ROYAL HALONG HOTEL - A 5-STAR HOTEL IN HALONG CITY | same | ✅ |
| Accessibility-tree lines | 369 | 369 | ✅ |
| Normalised tree diff | — | 1 line | ⚠️ intentional |
| `scrollHeight` | 4639 px | 4639 px | ✅ exact |
| Images in DOM | 39 | 39 | ✅ |
| Broken images | 0 | 0 | ✅ |
| Font faces loaded | 9 | 9 | ✅ |
| Loaded families | Arsenal 700, Cormorant 500, Inter 400/500/600, FA Free 400/900, FA Brands 400, icomoon 400 | identical | ✅ |
| `h1` computed | Arsenal · 15.12px · `rgb(255,255,255)` | identical | ✅ |
| `body` computed | Inter · 16px · `rgb(51,51,51)` on `rgb(255,255,255)` | identical | ✅ |
| Leaflet tiles rendered | 6 | 6 | ✅ |
| Console errors | 0 | 0 | ✅ |
| Canvas elements | 0 | 0 | ✅ |

The one differing line:

```diff
- /url: accommodation                       # original → 404 on the live site
+ /url: luu-tru-phong-khach-san-villas      # clone → the real VI accommodation page
```

## Route coverage

22 of 23 discovered Vietnamese routes mirrored. The 23rd, `/vi/accommodation/`, returns **404
from the origin** — it is a broken link in the site's own navigation, not a harvesting failure.

| Route | Clone bytes | HTTP |
|---|---|---|
| `index.html` (home) | 177,348 | 200 |
| `luu-tru-phong-khach-san-villas/` | 135,233 | 200 |
| `casino/` | 171,619 | 200 |
| `culinary/` | 138,150 | 200 |
| `experiences/` | 147,149 | 200 |
| `offers/` | 123,436 | 200 |
| `our-gallery/` | 202,467 | 200 |
| `reservation/` | 92,225 | 200 |
| `royal-international-convention-palace/` | 129,879 | 200 |
| `wedding/` | 128,777 | 200 |
| `news/` | 131,643 | 200 |
| `our-announcement/` | 149,457 | 200 |
| `payment-methods/` | 88,522 | 200 |
| `privacy-policy/` | 126,051 | 200 |
| `terms-and-conditions/` | 113,420 | 200 |
| `deluxe/` | 139,358 | 200 |
| `premium/` | 134,455 | 200 |
| `villas-deluxe/` | 134,292 | 200 |
| `villas-suite/` | 135,104 | 200 |
| 3 × news articles | 135,735–140,111 | 200 |

## Per-route runtime comparison

18 of 22 routes loaded live side-by-side against the origin. **Every one matched exactly** on
`scrollHeight`, image count and loaded-font count, with 0 broken images and 0 console errors:

| Route | scrollHeight o/c | imgs o/c | fonts o/c | broken | errors |
|---|---|---|---|---|---|
| home | 4639 / 4639 | 39 / 39 | 17 / 17 | 0 | 0 |
| luu-tru-phong-khach-san-villas | 3297 / 3297 | 13 / 13 | 13 / 13 | 0 | 0 |
| casino | 4848 / 4848 | 32 / 32 | 14 / 14 | 0 | 0 |
| culinary | 4209 / 4209 | 22 / 22 | 13 / 13 | 0 | 0 |
| experiences | 3832 / 3832 | 32 / 32 | 13 / 13 | 0 | 0 |
| offers | 3461 / 3461 | 16 / 16 | 13 / 13 | 0 | 0 |
| our-gallery | 4850 / 4850 | 90 / 90 | 13 / 13 | 0 | 0 |
| reservation | 1306 / 1306 | 14 / 14 | 14 / 14 | 0 | 0 |
| royal-international-convention-palace | 4287 / 4287 | 14 / 14 | 14 / 14 | 0 | 0 |
| wedding | 2214 / 2214 | 29 / 29 | 13 / 13 | 0 | 0 |
| news | 2378 / 2378 | 20 / 20 | 13 / 13 | 0 | 0 |
| our-announcement | 7632 / 7632 | 13 / 13 | 14 / 14 | 0 | 0 |
| payment-methods | 1274 / 1274 | 11 / 11 | 13 / 13 | 0 | 0 |
| privacy-policy | 7858 / 7858 | 11 / 11 | 13 / 13 | 0 | 0 |
| terms-and-conditions | 6226 / 6226 | 13 / 13 | 13 / 13 | 0 | 0 |
| deluxe | 3299 / 3299 | 38 / 38 | 13 / 13 | 0 | 0 |
| premium | 3342 / 3342 | 33 / 33 | 13 / 13 | 0 | 0 |
| villas-deluxe | 3318 / 3318 | 33 / 33 | 13 / 13 | 0 | 0 |

**The remaining 4** — `villas-suite` and the 3 news articles — have **no live origin
comparison**: the origin began timing out after ~60 requests (probable rate-limiting). They were
verified statically instead — `<img>` counts match the original exactly (34/34, 16/16, 16/16,
19/19), 0 missing local refs, no trackers, local fonts — plus text-identity below.

### `casino` horizontal overflow — checked, faithful

The casino full-page capture is 6484px wide. Measured on both: `body.scrollWidth = 6484` on the
**origin too**, with identical overflowing elements at identical pixel offsets
(`div.flickity-slider right=1539`, `div.cell right=1984`, `div.cell right=2627`).
`documentElement.scrollWidth = 1440`, `horizontalScrollbar = false` on both — the Flickity track
sits inside an `overflow:hidden` parent. Not a layout bug.

## Content fidelity — all 22 routes

Visible text (scripts, styles and tags stripped) extracted from the untouched originals in
`RECON/pages/` and from the delivered clone, compared character-by-character:

**22 / 22 routes byte-identical.** Zero copy drift. Harness: `RECON/textdiff.mjs`.

## Asset fidelity

| Check | Result |
|---|---|
| Same-origin assets downloaded | **1,111** |
| Download failures | 3 — all Leaflet sprites that 404 upstream too |
| Local refs resolved (22 pages) | **2,762 / 2,762** — 0 missing |
| Google Font files self-hosted | 26 woff2 |
| System-font substitutions | **0** |
| Placeholder / gradient stand-ins | **0** — every image is the original file |
| Colours eyeballed | **0** — all copied from `salient-dynamic-styles.css` |

Gallery page stress test (scrolled to bottom to trigger lazy-load, then back to top):
**90 images, 0 broken, 77 lightbox links bound.**

## Tracking removal

| Tracker | Occurrences removed | Residue in delivered pages |
|---|---|---|
| Google Tag Manager (`GT-P84QK984`) | 22 script tags + 22 inline configs + 22 dns-prefetch | none |
| Facebook Customer Chat SDK | 22 loaders + 44 widget divs | none |
| `speculationrules` origin prefetch | 22 | none |
| WP feed / REST / oembed / xmlrpc links | ~160 | none |
| `static.xx.fbcdn.net` emoji | 1 | localised |

`grep -liE "googletagmanager|connect\.facebook\.net|google-analytics|fbq\(|hotjar\.com|clarity\.ms|gtag\("`
over all 22 delivered pages returns **nothing**.

`audit-clone.mjs` reports two `hotjar` hits inside Font Awesome — these are the `.fa-hotjar`
**icon glyph** definitions (`content: "\f3b1"`), not tracking code. A third hit is in the skill's
own `SKILL.md`. All three are false positives; the audit's fidelity section reports
**保真度硬伤: 未发现** (no font/image/colour hard failures).

## Scores

| Dimension | Score | Basis |
|---|---|---|
| Structure | 5/5 | 369/369 tree lines, 22/22 reachable routes |
| Visual | 5/5 | identical computed type + colour, exact 4639px height |
| Interaction | 4/5 | JS loads clean, 0 console errors across 18 routes; scroll/lazy-load/waypoint animations exercised. Synthetic pointer events are `isTrusted=false`, so hover/drag/lightbox opening are reported as bound-and-present, not exercised |
| Responsive | 5/5 | original `responsive.css` mirrored byte-for-byte |
| Content replacement | 5/5 | n/a for faithful mode — content preserved verbatim |
| Functional completeness | 3/5 | booking/contact forms are façades; no server |

## Not cloned (by design)

- Reservation / booking submission (WP `admin-ajax.php` — server-side)
- WPML English locale (`/` routes)
- WordPress admin, search, comments backend
- `drive.google.com` -hosted menus and documents (96 external links, left intact)

See `NOTES.md` for the pre-deployment replacement checklist and licensing position.
