# Brief chung — hoàn thiện 6 nhóm trang

Đọc hết file này TRƯỚC khi gõ dòng code đầu tiên. Cùng với nó, đọc:

- `CLAUDE.md` (gốc repo) — quy ước i18n, hệ thiết kế, giao ước header. Bắt buộc.
- `scripts/content/GLOSSARY.md` — từ điển 6 ngôn ngữ dùng chung. Bắt buộc.
- `scripts/content/IMAGES.md` — 215 ảnh đã có sẵn trong Sanity, gom theo trang.

## 1. Hiện trạng (đo ngày 2026-09-17, không phải phỏng đoán)

- **0 field nào trong Sanity có bản dịch.** Toàn bộ nội dung chỉ có `vi`.
  `en/zh/ko/ja/th` trống sạch ở mọi document. Đây là việc lớn nhất.
- Các trang trong là nội dung import thô từ WordPress: `heroSection` + một
  section danh sách + một **chồng `richTextSection` không ảnh**, nội dung lặp
  lại đúng thứ đã có trong `room`/`venue`/`hall` mà nó liệt kê bên trên.
- `figure.alt` gần như trống khắp nơi → ảnh không có mô tả cho screen reader.
- Có chỗ dữ liệu sai hẳn: `page.experiences` sec-5 để **nguyên đoạn tiếng Anh
  trong field `vi`**; `hall.hoang-gia` ghi `areaSqm: 762` nhưng mô tả viết
  "672m2". Gặp mâu thuẫn thì lấy theo HTML bản clone (nguồn sự thật) và ghi
  lại vào NOTES.

**Đã làm xong trước khi bạn bắt đầu** (đừng làm lại, đừng sửa):

- `lib/ui-strings.ts` — đủ 6 ngôn ngữ, đã thêm 13 khoá mới
  (`labelLocation`, `labelCapacity`, `labelHours`, `labelPhone`, `labelArea`,
  `viewMenu`, `viewDetails`, `bookNow`, `roomAmenities`, `roomPhotos`,
  `dataTableScroll`, `notFoundTitle`, `notFoundBody`, `backHome`).
- Các component `VenueListSection` / `RoomListSection` / `HallListSection` /
  `RoomPage` / `GalleryCarouselSection` / `TableSection` / hai trang 404 đã
  bỏ hết chuỗi tiếng Việt hardcode.
- `navigation` + `siteSettings` — đã dịch đủ 6 ngôn ngữ (`scripts/content/chrome.ts`).

## 2. Định nghĩa "xong"

Một nhóm trang coi là xong khi **cả 5 điều** sau đúng:

1. `assertFullyTranslated('<id>')` trả 0 lỗ cho MỌI document bạn phụ trách.
2. Trang không còn khối "tường chữ" nào lặp lại nội dung của section danh sách
   ngay trên nó. Mỗi khối hoặc mang thông tin mới, hoặc mang ảnh.
3. Mọi `figure` bạn thêm đều có `alt` đủ 6 ngôn ngữ, **tả thứ có trong ảnh**
   (không viết "ảnh khách sạn", không lặp lại tiêu đề khối).
4. Trang render được ở **cả 6 locale** không lỗi, không tràn chữ, không ảnh vỡ.
5. `pnpm typecheck` xanh và `pnpm test` xanh.

## 3. Công cụ

Server dev đang chạy sẵn ở **http://localhost:3000** — đừng khởi động server mới.
Kiểm tra bằng `curl -s localhost:3000/ja/culinary | head -c 2000`.

Viết MỘT script cho nhóm trang của bạn: `scripts/content/<tên-nhóm>.ts`, chạy
bằng `npx tsx scripts/content/<tên-nhóm>.ts`. Script phải **chạy lại được
nhiều lần ra cùng kết quả** (idempotent) — bạn sẽ chạy nó rất nhiều lần.

Helper có sẵn (dùng chúng, đừng tự viết lại):

```ts
import { loc, blockLoc, fig, p, li, linkTo, linkOut, key, resetKeys } from './build'
import { patchDoc, upsertDoc, getDoc, assertFullyTranslated } from './write'
import { search, allNames } from './assets'

loc({ vi:'…', en:'…', zh:'…', ko:'…', ja:'…', th:'…' })   // ném lỗi nếu thiếu 1 ngôn ngữ
blockLoc({ vi:['đoạn 1','- gạch đầu dòng'], en:[…], … })   // Portable Text 6 ngôn ngữ
fig('Royal-Halong-Hotel-Restaurant-04.jpg', { vi:'…', en:'…', … })  // tra assetId theo TÊN FILE
linkTo('page.reservation', { vi:'ĐẶT PHÒNG', … })          // link nội bộ (dùng reference, KHÔNG href)
search('wedding')                                          // tìm tên file ảnh theo từ khoá
await patchDoc('page.culinary', { sections: [...] })       // merge, KHÔNG createOrReplace
await assertFullyTranslated('page.culinary')               // in ra từng field còn thiếu ngôn ngữ
```

**Ảnh**: 215 ảnh đã nằm sẵn trong Sanity. Tuyệt đối **không upload gì thêm**.
`fig()` tra theo tên file trong `IMAGES.md`; tên sai thì script ném lỗi ngay
(cố ý — thà đứng còn hơn đẩy lên một `figure` trỏ vào asset không tồn tại).

**Nguồn nội dung & số liệu**: HTML bản clone ở gốc repo (`culinary/index.html`,
`wedding/index.html`, …) là nguồn sự thật. **Không bịa số liệu** (diện tích,
sức chứa, giá, giờ mở cửa, số điện thoại) mà bản clone không có.

## 4. 15 khối dựng sẵn (`sanity/schemaTypes/sections/`)

| `_type` | Dùng khi | Field chính |
| --- | --- | --- |
| `heroSection` | đầu trang | `heading*`, `subheading`, `background*` (figure), `cta`, `height`: full/medium/short |
| `imageTextSection` | **khối chủ lực** — ảnh lớn + chữ, xen kẽ trái/phải | `heading`, `eyebrow`, `content` (localeBlock), `image*`, `imageSide`: left/right, `tone`: white/cream/ink, `cta` |
| `cardGridSection` | 2–6 thẻ ảnh có chữ đè lên | `heading`, `subheading`, `cards[]{title*, description, image, cta}`, `columns`: 2/3/4 (4 quy về 2) |
| `galleryCarouselSection` | băng ảnh cuộn ngang + lightbox | `heading`, `album*` (reference → galleryAlbum) |
| `ctaBandSection` | dải ảnh nền + nút, chốt trang | `heading*`, `description`, `background*`, `cta*` |
| `richTextSection` | chữ thuần — **dùng tiết kiệm** | `heading`, `content*`, `tone`, `narrow` |
| `tableSection` | bảng số liệu (sức chứa sảnh…) | `heading`, `caption`, `headers[]`, `rows[]` |
| `faqSection` | câu hỏi thường gặp | `heading`, `items[]{question*, answer*}` |
| `roomListSection` | lưới loại phòng | `heading`, `rooms[]` (trống = tất cả) |
| `venueListSection` | nhà hàng / tiện ích | `heading`, `filterKind`: dining/facility/manual, `venues[]` |
| `hallListSection` | phòng hội nghị | `heading`, `halls[]` (trống = tất cả) |
| `leadFormSection` | form thu lead | `heading*`, `description`, `formType`: wedding/mice/general, `successMessage` |
| `mapSection` | bản đồ Leaflet | `heading`, `overrideCoords`, `zoom` |
| `postListSection` | danh sách bài viết | `heading`, `category`, `limit` |
| `bookingWidgetSection` | widget SecureBookings | — |

`localeBlock` nhận cả `figure` làm phần tử → chèn được ảnh giữa dòng chữ.

**Nhịp trang tốt** (theo bản `Royal Ha Long Home v2 Light` đã dựng ở trang chủ):
hero → khối danh sách → xen kẽ `imageTextSection` trái/phải đổi `tone`
white/cream → `cardGridSection` hoặc `galleryCarouselSection` → `ctaBandSection`
chốt. Không để hai `richTextSection` liền nhau.

## 5. Giao ước thiết kế — đọc kỹ, đây là chỗ dễ phá nhất

- **Góc vuông ở mọi nơi**, trừ thành phần tròn thật. Đừng thêm class bo góc.
- Token màu nằm ở `@theme` trong `app/globals.css`. **Không hardcode mã màu.**
- `.rhl-hero` phải là **con đầu tiên của `<main>`** thì header mới trong suốt.
  Trang nào bắt đầu bằng `heroSection` thì tự động đúng — đừng chèn khối khác
  lên trước nó.
- Bốn token chữ trượt ngưỡng WCAG AA là **ngoại lệ đã chốt** (xem CLAUDE.md).
  Đừng "sửa" chúng. `tests/e2e/a11y.spec.ts` sẽ đỏ nếu bạn dùng màu khác trượt.
- **Không sửa** `components/layout/Header.tsx`, `MobileMenu.tsx`, `Footer.tsx`,
  `lib/i18n.ts`, `lib/routes.ts`, `app/globals.css`, `sanity/lib/queries.ts`
  nếu không tuyệt đối cần. Nếu cần thì **báo cho điều phối viên trước**, đừng
  tự sửa — đó là file dùng chung cho cả 6 nhóm.

## 6. Ranh giới ghi — TUYỆT ĐỐI không vượt

Mỗi cặp agent **chỉ được ghi** vào document trong cột của mình. Sáu nhóm chạy
song song trên **cùng một dataset Sanity thật**; ghi lấn là xoá việc của người
khác.

| Nhóm | Trang | Document phụ trách |
| --- | --- | --- |
| **A — Lưu trú** | `page.luu-tru-phong-khach-san-villas` | `room.deluxe`, `room.premium`, `room.villas-deluxe`, `room.villas-suite` |
| **B — Ẩm thực** | `page.culinary` | `venue.nha-hang-phuc-vien`, `venue.piano-bar`, `venue.pool-bar`, `venue.la-terrasse` |
| **C — Hội nghị & Tiệc cưới** | `page.royal-international-convention-palace`, `page.wedding` | `hall.ha-long`, `hall.hoang-gia`, `hall.royal-bay-lounge` |
| **D — Trải nghiệm** | `page.experiences` | `venue.be-boi`, `venue.outdoor-swimming-pool`, `venue.fitness-center`, `venue.renata-spa` |
| **E — Thư viện** | `page.our-gallery` | `galleryAlbum.*` (6 album) |
| **F — Ưu đãi** | `page.offers` | `offer.*` (3 chương trình) |

Dùng chung, **không ai được ghi**: `navigation`, `siteSettings`, `homePage`,
`page.casino`, `page.news`, `page.reservation`, `post.*`, `testimonial.*`.
(`galleryAlbum.trang-chu` do nhóm E giữ nhưng trang chủ đang đọc nó — E sửa
`alt` thì được, xoá/đổi thứ tự ảnh thì không.)

Được **đọc** mọi thứ. Được **tham chiếu** (`reference`) tới document của nhóm
khác. Chỉ không được **ghi**.

## 7. Cách hai agent trong một cặp làm việc với nhau

- **Agent 1 — Dựng**: khảo sát HTML clone, thiết kế lại chồng section, chọn
  ảnh, viết `alt`, viết nội dung **`vi` + `en`**. Để `zh/ko/ja/th` là chuỗi
  rỗng `''` trong bảng nội dung của script, đánh dấu rõ bằng comment.
  Ghi cấu trúc đã chốt + danh sách ảnh đã dùng vào `NOTES.md` của cặp.
- **Agent 2 — Dịch & soát**: điền `zh/ko/ja/th` cho từng mục theo
  `GLOSSARY.md`, chạy script, rồi **mở cả 6 locale** kiểm tra render. Ghi mọi
  vấn đề tìm được vào `NOTES.md` và báo lại.
- **Vòng 3**: Agent 1 sửa những gì Agent 2 tìm ra.

`NOTES.md` của cặp nằm ở đường dẫn điều phối viên đưa cho bạn. Ghi ngắn gọn,
có cấu trúc: `## Cấu trúc đã chốt`, `## Ảnh đã dùng`, `## Vấn đề tìm được`,
`## Đã sửa`.

## 8. Checklist nghiệm thu

```bash
# 1. Mọi document của nhóm đủ 6 ngôn ngữ
npx tsx scripts/content/<nhóm>.ts        # script tự gọi assertFullyTranslated ở cuối

# 2. Trang render được ở cả 6 locale
for l in vi en zh ko ja th; do
  echo -n "$l: "; curl -s -o /dev/null -w "%{http_code}\n" "localhost:3000/$l/<slug>"
done

# 3. Không còn chữ tiếng Việt lọt sang trang ngôn ngữ khác
curl -s localhost:3000/ja/<slug> | grep -oE '[ăâđêôơưạảãẹẻẽịỉĩọỏõụủũ]' | head

# 4. Typecheck + unit test
pnpm typecheck && pnpm test
```

Báo cáo cuối cùng phải nêu: document nào đã sửa, bao nhiêu ảnh đã gắn, kết quả
4 lệnh trên (dán output thật, không mô tả), và những gì bạn **không** làm được
cùng lý do.
