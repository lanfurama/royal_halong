# Audit SEO / GEO — 2026-09-19

**Cách đo:** curl HTML thật từ dev server cho 24 route + query trực tiếp dataset
Sanity `production`. Không suy đoán từ code.
**Đối tượng đọc:** người sửa các mục dưới đây.

Chatbot là track riêng — xem `docs/superpowers/specs/2026-09-19-chatbot-design.md`.
Hai track chồng nhau ở phần dữ liệu (mục G1 dưới đây).

---

## Bối cảnh

| | |
|---|---|
| Document có route | 25 (1 `homePage` + 14 `page` + 5 `room` + 3 `post` + 3 `offer`) |
| URL trong `sitemap.xml` | 156 (6 trang chủ + 25×6 locale) |
| Bản dịch | Đủ sáu ngôn ngữ, **dịch thật** — tỉ lệ ký tự vs `vi`: en 100%, th 88%, ko 51%, ja 47%, zh 35% (đúng mức nén tự nhiên của CJK) |
| Alt ảnh album | 119/119, đủ sáu ngôn ngữ |
| JSON-LD | Đúng **một** khối `Hotel`, giống hệt nhau trên cả 156 URL |

## Đã đúng — đừng sửa

- Canonical + sáu `hreflang` + `x-default` sinh chung một hàm với `LangSwitcher` và
  `generateStaticParams` (`lib/seo.ts`). Ba chỗ không thể trỏ khác nhau.
- `noindex, follow` tự động cho locale chưa có nội dung riêng.
- Redirect locale 308 (vĩnh viễn), không phải 307.
- `<html lang>` đúng ngay trong HTML server render, không sửa bằng JS phía client.
- **Đúng một `h1`** trên cả 24 trang đã kiểm.
- Hero LCP có `priority` → Next phát `<link rel="preload" as="image">` thật. `fetchpriority`
  vắng mặt trong HTML nhưng preload có, nên LCP **không** phải vấn đề.
- Alt ảnh có thứ tự ưu tiên tường minh, không bịa alt rác.

---

## SEO — xếp theo mức thiệt hại

### S1. Thiếu `meta description` trên 9/24 trang, gồm trang chủ

`/vi`, `/en`, `/ja`, `/vi/culinary`, và **cả 5 trang phòng**. Google tự cắt snippet
từ body, mất kiểm soát đoạn quan trọng nhất trong SERP.

Nguyên nhân là **dữ liệu**, không phải code: `seo.metaDescription` trống trong
Sanity. Sửa bằng cách nhập nội dung, không sửa `lib/seo.ts`.

### S2. `<title>` trang chủ 97 ký tự (`vi`) / 89 (`en`)

Hiện: `ROYAL HẠ LONG — ĐIỂM ĐẾN LÝ TƯỞNG ĐỂ CHIÊM NGƯỠNG TOÀN CẢNH DI SẢN THẾ GIỚI
— ROYAL HẠ LONG HOTEL`. Google cắt quanh 60. `titleWithBrand()` đã chống lặp tên
thương hiệu đúng; vấn đề là `title` gốc vốn đã quá dài. Cần `seo.metaTitle` riêng
cho `homePage` (hiện trống).

Cũng dài quá ngưỡng: `our-announcement` (81), `series-am-thuc-di-san-bun-be-be`
(63), `royal-international-convention-palace` (61).

### S3. Thiếu `og:image` trên 21/24 trang

Chỉ `casino`, `offers` và 3 `offer` có. Chia sẻ Facebook/Zalo/Messenger ra thẻ
trắng. Không có `opengraph-image.tsx` làm fallback. `twitter:card` là `summary`
(ảnh nhỏ), không `summary_large_image`.

Hai việc: nhập `seo.ogImage` cho các trang chính, **và** thêm một fallback ở tầng
code để trang chưa nhập vẫn có ảnh.

### S4. `og:type` luôn là `website`

`lib/seo.ts:124`. Ba `post` phải là `article` kèm `article:published_time`
(`publishedAt` đã có trong Sanity). Metadata cũng thiếu hẳn `authors` và
`publishedTime`.

### S5. Sitemap thiếu `lastModified` và `xhtml:link`

`app/sitemap.ts`. `_updatedAt` có sẵn trong mọi document Sanity nhưng không được
query. `changefreq`/`priority` thì Google đã bỏ qua từ lâu — `lastmod` là thứ nó
còn dùng.

### S6. Slug chỉ localize 6/25 document

Có slug đủ sáu locale: `casino`, `culinary`, `experiences`, `our-gallery`,
`wedding`, `royal-international-convention-palace` — nhưng đều trùng chữ tiếng
Anh. 19 document còn lại chỉ có slug `vi`, nên khách Nhật thấy
`/ja/luu-tru-phong-khach-san-villas`.

Không sai kỹ thuật (`resolveRouteSlug()` xử lý đúng), nhưng mất keyword ở bốn thị
trường mới. Ưu tiên thấp hơn S1–S5.

### S7. Trang phòng mỏng: ~400–430 từ, không giá, không tiện nghi

`priceFrom` = `null` và `amenities` = `null` trên **cả 5** `room`. Đây là trang có
ý định mua cao nhất của toàn site. Trùng với mục G1 và với §5 của spec chatbot.

### S8. Không có breadcrumb

Không UI, không `BreadcrumbList`. Trang con chỉ được link từ nav (9 mục header,
2 cột footer).

### S9. Xác nhận `NEXT_PUBLIC_SITE_URL` trên production

`robots.txt` và `sitemap.xml` đang in `localhost:3000` vì `.env.local`.
`lib/site-url.ts` throw nếu thiếu biến trên production, nên build xanh thì ổn —
nhưng đáng `curl` một lần trên domain thật để chắc.

---

## GEO (Generative Engine Optimization)

Yếu hơn SEO đáng kể. Toàn site chỉ có
`Hotel{name,url,address,telephone,email,geo}`, giống nhau trên cả 156 URL.

### G1. Structured data gần như trống — mục quan trọng nhất

| Thiếu | Dữ liệu đã có chưa | Ghi chú |
|---|---|---|
| `priceRange`, `HotelRoom`, `Offer` | **Chưa** — `priceFrom` null cả 5 phòng | Không có giá ở bất kỳ đâu trên site. Câu hỏi thương mại số 1 không trả lời được, kể cả cho người đọc. |
| `amenityFeature` | **Chưa** — `amenities` null cả 5 phòng | |
| `starRating`, `numberOfRooms`, `checkinTime`, `checkoutTime` | **Chưa** | Cần thêm vào `siteSettings` |
| `sameAs` | **Có rồi** — `siteSettings.socials` (Facebook + TripAdvisor) | Mối nối thực thể rẻ nhất đang bỏ trống. Sửa được ngay, không cần nhập gì. |
| `FAQPage` | Một phần — `/wedding` có `faqSection` nội dung sẵn sàng | Chỉ thiếu markup |
| `Article`/`NewsArticle` | **Có rồi** — 3 `post` đủ `publishedAt` | |
| `Restaurant` | **Có rồi** — 5 venue `kind: dining` đủ `hours`/`location`/`phone` | |
| `MeetingRoom`/`EventVenue` | **Có rồi** — 3 `hall` đủ `areaSqm` + `capacity` | |
| `AggregateRating` | **Có rồi** — 4 `testimonial` TripAdvisor | Kiểm điều kiện hợp lệ của Google trước khi đánh dấu |
| `Casino` | **Có rồi** — trang 2.061 từ, trang mạnh nhất site | Chính là thứ phân biệt khách sạn này với mọi khách sạn Bãi Cháy khác |
| `WebSite` + `Organization` | **Chưa** | Không có `SearchAction`, không có sitelinks |
| `BreadcrumbList` | **Chưa** | Xem S8 |

Sáu dòng ghi "**Có rồi**" là việc chỉ cần viết code, không cần nhập nội dung — nên
làm trước.

### G2. Không có `llms.txt`

`/llms.txt` → 404. Với site sáu ngôn ngữ, một bản tóm tắt phẳng là cách rẻ nhất để
LLM lấy đúng dữ kiện thay vì đoán từ 156 URL.

**Spec chatbot đã bao mục này** (§12): cùng hàm sinh snapshot xuất luôn `llms.txt`.
Không làm riêng.

### G3. `robots.txt` chưa nói gì về crawler AI

Hiện `User-Agent: *  Allow: /`, nên GPTBot/ClaudeBot/PerplexityBot **được phép** —
đúng hướng cho GEO. Nên khai tường minh để đây là quyết định có chủ ý, không phải
mặc định vô tình.

### G4. Nội dung chưa ở dạng "trả lời được"

Không có mục nào trả lời trực tiếp: giờ check-in, khoảng cách tới sân bay Cát Bi /
Vân Đồn, có đưa đón không, bữa sáng gồm gì, casino có yêu cầu hộ chiếu nước ngoài
không, phòng có bồn tắm không. AI sinh câu trả lời thích trích đoạn ngắn, tự chứa;
body hiện là văn quảng cáo dài.

Spec chatbot §5.3 tạo document type `faq` cho đúng nhóm câu này. **Lưu ý:** JSON-LD
`FAQPage` chỉ hợp lệ khi FAQ **hiển thị trên trang** — document `faq` chỉ để
chatbot đọc mà không render ở đâu thì không được đánh dấu `FAQPage`.

---

## Thứ tự nên làm

1. **S1, S2** — nhập `metaDescription` + `metaTitle` cho trang chủ và 5 trang
   phòng. Rẻ nhất, thiệt hại lớn nhất.
2. **G1 phần "Có rồi"** — `sameAs`, `Article`, `Restaurant`, `MeetingRoom`,
   `Casino`, `WebSite`+`Organization`. Chỉ viết code, dữ liệu đã đủ.
3. **S5** (`lastmod`), **S4** (`og:type` article), **S3** (fallback `og:image`).
4. **S7 / G1 phần "Chưa"** — nhập giá + tiện nghi + FAQ. Trùng với §5 spec chatbot,
   nhập một lần dùng cho cả hai.
5. **S8** (breadcrumb + `BreadcrumbList`), **S6** (slug localize).
6. **G3** — khai tường minh crawler AI trong `robots.ts`.

Mục **G2** đi cùng chatbot, không nằm trong danh sách này.
