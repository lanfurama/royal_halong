# Royal Halong — Next.js + Sanity + Neon

**Ngày:** 2026-09-14
**Trạng thái:** Đã duyệt thiết kế, chờ kế hoạch triển khai
**Đối tượng đọc:** người triển khai dự án này (dev kế tiếp hoặc phiên làm việc sau)

Chuyển bản clone tĩnh WordPress/Salient của `royalhalonghotel.com/vi/` thành một
Next.js app có nội dung quản trị bằng Sanity, form lead lưu vào Neon Postgres.

---

## 1. Điểm xuất phát

Repo hiện tại là bản mirror trung thực của site thật (xem `NOTES.md`):

| | |
|---|---|
| Route | 22, tất cả đều một segment: `/`, `/deluxe/`, `/casino/`, `/canh-bao-trang-facebook.../` |
| Ảnh | 1.001 file trong `wp-content/uploads`, nhưng chỉ **213 ảnh gốc** — 788 file còn lại là srcset variant do WordPress sinh |
| Stack cũ | Salient 15.0.8 + WPBakery 6.9.1 + jQuery 3.7.1 + Flickity + fancyBox + anime.js + Leaflet |
| Đặt phòng | Widget bên thứ ba `book.securebookings.net`, property id `b61761f7-73f7-1690280721-4685-acf1-02f8078b5da3` |
| Ngôn ngữ | Chỉ `/vi/` được mirror. **Không có nội dung EN nào trong repo.** |
| Form | Không còn form nào hoạt động — endpoint `admin-ajax` đã chết |

### Bốn quyết định đã chốt

1. **Rebuild sạch bằng Tailwind**, giữ design token gốc, bỏ hẳn Salient/WPBakery/jQuery.
2. **VI + EN ngay từ đầu**, EN để trống và fallback về VI cho tới khi biên tập viên nhập.
3. **Neon** phục vụ lead form (tiệc cưới + hội nghị) và newsletter. Không phục vụ đặt phòng.
4. **Script import tự động** toàn bộ 22 trang + 213 ảnh.

### Ràng buộc đã biết

- Ảnh, bài viết, logo, GCN ĐKDN `5700102119`, badge Bộ Công Thương là tài sản của
  Royal Halong Hotel. Import nguyên bản theo yêu cầu; nếu dự án chuyển thành bản pitch
  cho khách khác thì phải đổi sang seed placeholder trước khi public.
- Widget SecureBookings gọi ra origin thật của khách sạn. Giữ nguyên property id.
- 96 link `drive.google.com` trong menu/offers là link ngoài của bản gốc, giữ nguyên.

---

## 2. Kiến trúc

Một Next.js app (App Router, TypeScript, React Server Components), Sanity Studio nhúng,
Neon qua Drizzle. Một project Vercel, không monorepo.

```
app/
  layout.tsx
  page.tsx                      → redirect /vi
  [lang]/
    layout.tsx                  → Header + Footer từ Sanity, <html lang>
    page.tsx                    → trang chủ (homePage singleton)
    [slug]/page.tsx             → mọi trang còn lại
    not-found.tsx
  studio/[[...tool]]/page.tsx   → Sanity Studio
  api/
    leads/route.ts
    newsletter/route.ts
    draft-mode/{enable,disable}/route.ts
sanity/
  schemaTypes/                  → document + object types
  lib/{client,image,queries,live}.ts
  structure.ts                  → desk structure, singleton
components/
  layout/{Header,Footer,LangSwitcher,MobileMenu}.tsx
  sections/                     → một component cho mỗi loại block
  ui/{Reveal,Carousel,Lightbox,Map,BookingWidget}.tsx
lib/
  i18n.ts                       → t(), LOCALES, fallback
  db/{index,schema}.ts          → Drizzle + Neon
  mail.ts                       → Resend (optional)
scripts/import/
  parse.ts assets.ts transform.ts run.ts fixtures/
tests/
  unit/  e2e/
```

### Vì sao một catch-all `[lang]/[slug]`

Cả 22 route của bản gốc đều là một segment. Một catch-all:

- giữ **nguyên xi mọi URL đang được index** — không mất SEO khi thay site;
- đặt slug trong Sanity, biên tập viên đổi được mà không cần deploy;
- vẫn static hoàn toàn vì `generateStaticParams` đọc danh sách slug từ Sanity.

`app/[lang]/[slug]/page.tsx` truy vấn document theo slug rồi dispatch theo `_type`:

```
room     → <RoomPage>
post     → <PostPage>
page     → <SectionRenderer sections={doc.sections} />
```

### Rendering & cache

Dùng **Live Content API** của `next-sanity` 13, không tự dựng webhook revalidate.

- `sanity/lib/live.ts` gọi `defineLive({ client, serverToken, browserToken, strict: true })`
  → trả `SanityLive` + `sanityFetch`. `<SanityLive />` đặt trong root layout tự nhận
  sự kiện thay đổi từ Sanity và gọi `revalidateTag(tag, 'max')`. **Không cần
  `/api/revalidate`, không cần `SANITY_REVALIDATE_SECRET`.**
- `next.config.ts` bật `cacheComponents: true` và `cacheLife: { default: sanity }`
  (import `sanity` từ `next-sanity/live/cache-life`).
- Một ranh giới `'use cache'` dùng chung: wrapper `cachedSanity` trong `live.ts`.
  `sanityFetch` tự gọi `cacheTag`/`cacheLife` bên trong nên **caller không tự thêm
  `'use cache'`** — thêm nữa là lồng ranh giới, sai.
- `generateStaticParams` dùng `cachedSanityStaticParams`, `generateMetadata` dùng
  `cachedSanityMetadata` (perspective `published`, `stega: false`).
- ⚠️ Với `cacheComponents: true`, **`generateStaticParams` trả mảng rỗng là lỗi**
  (`empty-generate-static-params`). Catch-all `[slug]` phải luôn trả ≥ 1 param, nên
  script import phải chạy trước lần build đầu tiên.
- Draft mode: `/api/draft-mode/enable` + `<VisualEditing />` khi `draftMode().isEnabled`.

---

## 3. i18n

Không dùng plugin. Ba object type tự định nghĩa:

```ts
localeString  { vi: string,  en: string }
localeText    { vi: text,    en: text }
localeBlock   { vi: block[], en: block[] }
```

- `LOCALES = ['vi', 'en']`, mặc định `vi`.
- Middleware: `/` → `/vi`; path không có prefix locale → thêm `/vi`.
- Helper `t(field, lang)` trả `field[lang] || field.vi`. **Fallback một chiều:** EN trống
  thì hiện VI; VI trống là lỗi dữ liệu, không fallback ngược.
- Slug song ngữ `{ vi, en }`. `generateStaticParams` sinh cặp `(lang, slug)` cho mọi
  locale có slug; locale chưa có slug riêng thì dùng slug VI.
- `<html lang>` và `hreflang` alternate sinh từ cặp slug thật, **không** trỏ về
  `royalhalonghotel.com` như bản clone.

---

## 4. Schema Sanity

### Singleton

**`siteSettings`** — brand name, logo, favicon, contact (`tel`, `mobile`, `hotline`,
`email[]`, address localeString), toạ độ bản đồ (lat/lng/zoom), socials
(Facebook, Instagram, TripAdvisor, X), legal (tên công ty, GCN ĐKDN, nơi cấp, ngày cấp),
badge Bộ Công Thương (ảnh + link `online.gov.vn`), `secureBookingsWidgetId`, dòng copyright.

**`navigation`** — `header: [{ label: localeString, link, children[] }]`,
`footerColumns: [{ title: localeString, links[] }]`. `link` là object dùng chung:
internal reference tới document, hoặc external href.

**`homePage`** — hero (ảnh/video nền, `heading` + `subheading` localeString, nút play video,
`videoUrl`), intro (localeBlock + ảnh), khối "Tìm chúng tôi trên bản đồ", carousel
`galleryAlbum` ref, khối "Cảm nhận" gồm 4 feature card (Khách sạn & Villa / Cung hội nghị /
Casino / Ẩm thực), `testimonials: reference[]`, hai CTA band cuối (Tiệc cưới, Ưu đãi), `seo`.

### Collection

**`room`** — 4 bản ghi: Deluxe, Premium, Villas Deluxe, Villas Suite.

```
title: localeString          slug: localeSlug
category: 'hotel' | 'villa'
areaSqm: number              capacity: localeString
view: localeString           bedType: localeString
summary: localeText          description: localeBlock
heroImage: image             gallery: image[]
features: [{ icon: image, label: localeString }]   // 16 mục/phòng, 15 icon dùng chung
order: number                seo
```

Icon tiện nghi (15 file: `area`, `traveling`, `sunrise`, `bed`, `smart-tv`, `telephone`,
`wifi`, `minibar`, `bathtub`, `hairdryer`, `ironing`, `air-conditioner`, `no-smoking`,
`smoking`, `room-service`) upload một lần, các phòng cùng tham chiếu.

**`post`** — tin tức + thông báo (3 bài hiện có).

```
title, slug, category: 'news' | 'announcement'
publishedAt: datetime        excerpt: localeText
coverImage: image            body: localeBlock
author: string               seo
```

**`offer`** — chương trình ưu đãi (3 mục hiện có).

```
title, slug, excerpt, image, body: localeBlock
priceNote: localeString      // "CHỈ TỪ 500.000VNĐ/KHÁCH"
validFrom, validTo: date     cta: link      order
```

**`venue`** — điểm ẩm thực + tiện ích, 8 bản ghi (4 dining + 4 facility).

```
name: localeString           slug
kind: 'dining' | 'facility'
location: localeString       // "Tầng 2 Khách sạn"
capacity: localeString       // "250 khách, 2 phòng VIP"
hours: localeString          // "24/7"
highlights: localeString[]   // món đặc trưng
description: localeBlock     image, gallery
menuUrl: url                 // link Drive của bản gốc
phone: string                order
```

Dining: Phúc Viên, Piano Bar, Pool Bar, La Terrasse.
Facility: Fitness Center, Renata Spa, Bể bơi, Outdoor Swimming Pool.

**`hall`** — phòng của Cung hội nghị, 3 bản ghi: Ha Long (762 m², 1.000 khách),
Hoang Gia (762 m²), Royal/Bay Lounge (36 m²).

```
name, slug, areaSqm, capacity: localeString
layouts: [{ style: localeString, seats: number }]   // theatre/banquet/classroom
description: localeBlock, image, gallery, order
```

**`galleryAlbum`** — 5 album: Khách sạn & Villas, Lưu trú, Cung hội nghị, Tiệc cưới,
Nhân viên. Số ảnh mỗi album (≈16/20/16/13/16) là đếm thô từ markup Flickity, có thể lẫn
slide nhân bản — script import chốt con số thật bằng cách khử trùng theo URL ảnh gốc.
Mỗi album: `title: localeString`, `slug`, `images: image[]`
(mỗi ảnh có `alt: localeString`), `order`.

**`testimonial`** — 4 review TripAdvisor trên trang chủ: `quote: localeText`,
`author: string`, `source: string`, `sourceUrl`, `rating`.

**`page`** — landing + pháp lý, dựng từ `sections[]`.

```
title, slug, seo, sections: [ ...blocks ]
```

### Section block (object type)

| Block | Dùng ở | Nội dung |
|---|---|---|
| `heroSection` | mọi landing | ảnh nền, heading, subheading, CTA |
| `richTextSection` | pháp lý, casino | localeBlock, tuỳ chọn nền cream |
| `imageTextSection` | casino, tiệc cưới | ảnh + text, đảo trái/phải, nền sáng/tối |
| `cardGridSection` | trang chủ, lưu trú | 2–4 card (ảnh, tiêu đề, mô tả, link) |
| `galleryCarouselSection` | nhiều trang | ref `galleryAlbum` |
| `venueListSection` | ẩm thực, trải nghiệm | lọc theo `kind` hoặc chọn tay |
| `hallListSection` | cung hội nghị | ref `hall[]` |
| `roomListSection` | lưu trú, cuối trang phòng | ref `room[]` |
| `ctaBandSection` | cuối hầu hết trang | ảnh nền, heading, nút |
| `mapSection` | trang chủ, liên hệ | toạ độ từ `siteSettings`, override được |
| `tableSection` | **casino** | bảng luật Baccarat: caption + headers + rows |
| `bookingWidgetSection` | đặt phòng | nhúng SecureBookings |
| `leadFormSection` | tiệc cưới, cung hội nghị | `formType: 'wedding' \| 'mice' \| 'general'` |
| `faqSection` | phương thức thanh toán | Q/A localeBlock |
| `postListSection` | **tin tức, thông báo** | liệt kê `post` theo `category`, có phân trang |

Tổng cộng **15 block**.

`seo` là object dùng chung: `metaTitle: localeString`, `metaDescription: localeText`,
`ogImage`, `noIndex`.

### Ánh xạ route → document

| URL gốc (giữ nguyên) | `_type` |
|---|---|
| `/` | `homePage` |
| `/luu-tru-phong-khach-san-villas` | `page` |
| `/deluxe` `/premium` `/villas-deluxe` `/villas-suite` | `room` |
| `/casino` `/culinary` `/experiences` `/wedding` `/royal-international-convention-palace` `/reservation` `/our-gallery` `/offers` `/payment-methods` `/privacy-policy` `/terms-and-conditions` | `page` |
| `/news` `/our-announcement` | `page` (trang danh sách, truy vấn `post` theo category) |
| 3 slug bài viết dài | `post` |

---

## 5. Neon + Drizzle

`@neondatabase/serverless` + `drizzle-orm`. Hai bảng:

```sql
leads (
  id uuid pk default gen_random_uuid(),
  type text not null,            -- 'wedding' | 'mice' | 'general'
  name text not null,
  email text not null,
  phone text not null,
  event_date date,
  guest_count integer,
  message text,
  source_page text,              -- slug trang gửi
  locale text not null default 'vi',
  status text not null default 'new',   -- 'new' | 'contacted' | 'closed'
  created_at timestamptz not null default now()
)

newsletter_subscribers (
  id uuid pk default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'vi',
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
)
```

Migration bằng `drizzle-kit generate` + `migrate`, file SQL commit vào repo.

### API route

`POST /api/leads` và `POST /api/newsletter`, đều là Route Handler chạy trên Node runtime:

1. Parse body bằng zod schema (`leadSchema`, `newsletterSchema`).
2. Honeypot: field `company` phải rỗng, nếu có giá trị → trả 200 giả, không ghi.
3. Rate limit theo IP, in-memory LRU 5 request / 10 phút. Đủ cho site marketing;
   nếu sau này cần chặt hơn thì thay bằng Upstash.
4. Ghi DB. Newsletter dùng `onConflictDoNothing` trên `email`.
5. Nếu có `RESEND_API_KEY` → gửi mail thông báo tới `siteSettings.contact.email`.
   Không có key thì bỏ qua, vẫn trả thành công. **Chủ ý:** deploy được ngay mà chưa
   cần chốt nhà cung cấp mail.
6. Trả `{ ok: true }` hoặc `{ ok: false, errors }` — thông báo lỗi song ngữ ở client.

Form ở client là Server Action gọi cùng logic, progressive enhancement: submit được
khi JS chưa load.

---

## 6. Script import

Chạy một lần bằng `pnpm import`, idempotent, chạy lại nhiều lần cho kết quả như nhau.

**`parse.ts`** — cheerio đọc 22 file HTML, xuất JSON trung gian
(`scripts/import/out/parsed.json`). Mỗi loại trang một parser riêng:
`parseRoom`, `parsePost`, `parseOffer`, `parseVenue`, `parseHall`, `parseGallery`,
`parseHome`, `parseGenericPage`. Parser trả đúng shape của schema, `vi` đầy, `en` rỗng.

- HTML rich text → Portable Text bằng `@portabletext/block-tools` + `jsdom`.
- Bỏ toàn bộ wrapper WPBakery/Salient (`vc_`, `wpb_`, `nectar-`), chỉ giữ nội dung.
- `.iwithtext` → `{ icon, label }` cho `room.features`.

**`assets.ts`** — thu 213 ảnh gốc (regex loại srcset variant `-\d+x\d+\.(jpg|png)`),
upload lên Sanity, ghi cache `path → assetId` vào `out/assets.json` để lần chạy sau
không upload lại.

**`transform.ts`** — JSON + asset map → document Sanity. `_id` tất định
(`room.deluxe`, `post.canh-bao-trang-facebook...`) để `createOrReplace` là idempotent.
Xuất `out/documents.ndjson` để review trước khi ghi.

**`run.ts`** — đọc NDJSON, ghi bằng `client.transaction().createOrReplace()`, chia lô 50 doc.
Cờ `--dry-run` chỉ xuất NDJSON, không ghi.

Thứ tự: assets → documents không tham chiếu (testimonial, galleryAlbum, venue, hall, room,
post, offer) → documents có tham chiếu (page, homePage, navigation, siteSettings).

---

## 7. UI

### Token

CSS variable trong `globals.css`, Tailwind đọc qua `@theme`:

```
--gold #bf8d2c   --gold-hi #d19f2b   --gold-deep #9b7f22
--ink  #0a0a0a   --cream   #f4ece2   --line #e3d9cb
--body #333333   --sky     #98c8e8   --peach #ffac66
--gold-text #896520          ← token bổ sung, không có trong bản gốc
```

`--gold-text` được thêm vì bảng màu gốc **không có tông vàng nào đọc được trên nền sáng**
(đo ở mục a11y bên dưới). Nó giữ nguyên hue 39.6° và độ bão hoà 62.6% của `--gold`,
chỉ hạ lightness từ 46.1% xuống 33.1%, nên vẫn cùng một hệ màu.

### Font

`next/font/google`, subset `['latin', 'vietnamese']`, `display: 'swap'`:
Arsenal 700 (H1/display), Inter 400/500/600/700 (body + UI), Cormorant 500 + italic
(editorial), Fahkwang 500. Gán qua CSS variable `--font-display` / `--font-body` /
`--font-accent`.

### Thay thế thư viện cũ

| Cũ | Mới |
|---|---|
| Flickity | `embla-carousel-react` |
| fancyBox | `yet-another-react-lightbox` |
| anime.js + waypoints | CSS scroll-driven animation, fallback IntersectionObserver trong `<Reveal>` |
| superfish | menu CSS + React state |
| select2 | `<select>` gốc |
| Leaflet (giữ) | `react-leaflet`, `next/dynamic` `ssr: false`, tile OSM |
| jQuery | bỏ |

Ảnh dùng `next/image` với loader Sanity (`@sanity/image-url`), `sizes` khai báo đúng
theo breakpoint để không tải thừa.

### Accessibility & performance (tiêu chí nghiệm thu)

- Mọi ảnh có `alt` lấy từ `image.alt` localeString.
- Điều hướng bàn phím đầy đủ cho menu, carousel, lightbox; focus trap trong mobile menu.
- Tương phản chữ/nền đạt WCAG AA. Đã đo toàn bộ token (tỉ lệ dưới đây là số đo thật,
  không phải ước lượng):

  | Token | trên trắng | trên cream `#f4ece2` | trên ink `#0a0a0a` |
  |---|---|---|---|
  | `--gold #bf8d2c` | 2.97 ✗ | 2.54 ✗ | 6.66 AA |
  | `--gold-hi #d19f2b` | 2.41 ✗ | 2.06 ✗ | 8.21 AA |
  | `--gold-deep #9b7f22` | 3.85 chỉ AA-large | 3.29 chỉ AA-large | 5.14 AA |
  | `--gold-text #896520` | **5.32 AA** | **4.55 AA** | 3.72 chỉ AA-large |
  | `--body #333333` | 12.63 AA | 10.80 AA | — |
  | `--ink #0a0a0a` | 19.80 AA | 16.92 AA | — |
  | `--sky #98c8e8` | 1.79 ✗ | 1.53 ✗ | 11.09 AA |
  | `--peach #ffac66` | 1.85 ✗ | 1.58 ✗ | 10.70 AA |

  **Quy tắc rút ra:**
  - `--gold` / `--gold-hi` / `--sky` / `--peach` chỉ dùng làm **chữ trên nền tối**, hoặc
    làm **màu nền / viền / icon trang trí** — không bao giờ làm chữ trên nền sáng.
    Bản gốc Salient vi phạm điều này ở nhiều chỗ (heading vàng nhỏ trên nền trắng);
    bản mới sửa lại, đây là sai khác giao diện có chủ đích so với bản clone.
  - Chữ nhỏ màu vàng trên nền sáng → `--gold-text`.
  - Heading lớn (≥ 24px, hoặc ≥ 19px bold) trên nền sáng → `--gold-deep` là mức thấp nhất
    chấp nhận được.
  - Nút nền `--gold` phải dùng chữ `--ink`, không dùng chữ trắng (trắng trên gold chỉ 2.97).
- LCP < 1.5s trên 4G mô phỏng; CLS < 0.1; không layout shift ở hero.

---

## 8. Biến môi trường

```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET          production
NEXT_PUBLIC_SANITY_API_VERSION      2026-09-14
SANITY_API_READ_TOKEN               bắt buộc — defineLive ném lỗi nếu thiếu
SANITY_API_WRITE_TOKEN              chỉ script import dùng, KHÔNG đưa lên Vercel
DATABASE_URL                        Neon pooled connection string
RESEND_API_KEY                      optional — thiếu thì bỏ qua gửi mail
NEXT_PUBLIC_SITE_URL                dùng cho canonical / hreflang / sitemap
```

Không có `SANITY_REVALIDATE_SECRET` — Live Content API thay thế webhook revalidate.

---

## 9. Test

**Vitest (unit)**

- Parser import: fixture cắt từ HTML thật trong `scripts/import/fixtures/`, khẳng định
  `parseRoom('deluxe')` trả đúng 16 feature, `areaSqm === 39`, view `Hướng biển`.
- `t()` fallback: EN trống → trả VI; VI trống → ném lỗi.
- Zod `leadSchema` / `newsletterSchema`: từ chối email sai, phone rỗng, honeypot có giá trị.
- Builder URL ảnh Sanity sinh đúng `w`/`q`/`fm`.

**Playwright (e2e, chạy trên build production)**

- 22 route render, status 200, không lỗi console.
- `/en/...` hiện nội dung VI khi EN trống (kiểm chứng fallback).
- Lead form: submit hợp lệ → ghi được row vào DB test; honeypot → không ghi.
- Lightbox mở/đóng bằng bàn phím; carousel chuyển slide bằng phím mũi tên.
- `hreflang` và canonical trỏ đúng domain mới, không còn `royalhalonghotel.com`.

Test DB dùng Neon branch riêng, `DATABASE_URL` trỏ vào branch đó trong CI.

---

## 10. Ngoài phạm vi

- Không xây booking engine — SecureBookings giữ nguyên.
- Không dựng nội dung EN — chỉ dựng hạ tầng để nhập.
- Không di trú bình luận WordPress (bản gốc có `#respond` nhưng không có bình luận thật).
- Không làm trang tìm kiếm (bản gốc chỉ có form search trỏ về WP).
- Không thiết lập analytics — GTM đã bị gỡ khỏi bản clone, thêm lại là quyết định riêng.

---

## 11. Thứ tự triển khai

1. Scaffold Next.js + Tailwind + token + font, layout rỗng.
2. Sanity project + schema + Studio + desk structure.
3. Script import (parser → assets → transform → run), chạy thật, có dữ liệu.
4. Query layer + trang chủ.
5. Catch-all `[slug]` + SectionRenderer + các block.
6. Room, post, offer, venue, hall, gallery.
7. Neon + Drizzle + API route + lead form + newsletter.
8. SEO (metadata, sitemap, robots, JSON-LD, hreflang), revalidate webhook.
9. A11y + performance pass.
10. E2E, dọn dẹp, tài liệu bàn giao.

Bước 1–3 phải xong trước khi làm giao diện, vì mọi thứ phía sau đọc dữ liệu thật.
