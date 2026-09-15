# Import nội dung từ bản clone HTML

Đổ 22 trang và ~216 ảnh của bản clone WordPress vào Sanity.

## Chạy

```bash
cp .env.example .env.local   # điền project id + SANITY_API_WRITE_TOKEN
pnpm import:all               # chạy cả 4 pha (KHÔNG gõ `pnpm import`, xem bên dưới)
```

Script CỐ TÌNH không tên là `import` (kể cả không đặt alias `import` trỏ tới
`import:all`) — `import` là tên lệnh nội bộ của chính pnpm (chuyển
`package-lock.json`/`yarn.lock` sang `pnpm-lock.yaml`). Gõ `pnpm import` sẽ chạy
lệnh CLI đó chứ không phải script này, và nó từng xoá mất `pnpm-lock.yaml` của
repo trong lúc tìm lockfile npm/yarn để chuyển đổi rồi báo lỗi
`ERR_PNPM_LOCKFILE_NOT_FOUND`. Đặt một alias tên `import` sẽ tái tạo đúng va chạm
này, nên đừng làm vậy.

Từng pha chạy riêng được:

| Lệnh | Việc | Ra file |
|---|---|---|
| `pnpm import:parse` | Đọc 22 HTML, bóc nội dung | `out/parsed.json` |
| `pnpm import:assets` | Upload ảnh gốc, có cache | `out/assets.json` |
| `pnpm import:transform` | Dựng document Sanity | `out/documents.ndjson` |
| `pnpm import:run` | Ghi vào Sanity | — |

`pnpm import:run --dry-run` in thống kê mà không ghi.

## Biến môi trường

Script import chỉ cần 4 biến đầu; các biến còn lại thuộc phần frontend/form (Plan C/D),
liệt kê ở đây để có một chỗ tra cứu duy nhất — xem thêm `README.md` mục "Cảnh báo vận
hành" cho ngữ cảnh đầy đủ của từng biến.

| Biến | Ai dùng | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | Import + frontend | Bắt buộc cho cả hai |
| `SANITY_API_WRITE_TOKEN` | Chỉ import (`pnpm import:run`) | Editor token — **CHỈ ở máy local chạy import, KHÔNG đặt trên Vercel** |
| `SANITY_API_READ_TOKEN` | Frontend (`defineLive`) | Không cần cho import, nhưng thiếu thì `pnpm dev`/`pnpm build` sẽ lỗi ngay lúc khởi động |
| `DATABASE_URL` | Frontend (`lib/db`, lead form + newsletter) | Không liên quan gì tới import nội dung Sanity — Neon là kho riêng cho form, xem `lib/db` |
| `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` | Frontend (`lib/mail.ts`) | Tuỳ chọn — thiếu thì bỏ qua mail thông báo, form vẫn lưu Neon bình thường |

## Chạy lại được

Cả 4 pha đều idempotent. `_id` tất định (`room.deluxe`, `page.casino`) nên
`createOrReplace` ghi đè đúng document cũ. Ảnh đã upload được nhớ trong
`out/assets.json` nên không upload lại.

**Cảnh báo:** `import:run` dùng `createOrReplace` — chạy lại TOÀN BỘ (không lọc gì) sẽ
GHI ĐÈ mọi chỉnh sửa đã sửa tay trong Studio sau lần import đầu. Sau khi biên tập viên bắt
đầu làm việc thật thì đừng chạy `pnpm import:all`/`pnpm import:run` không lọc nữa — dùng
một trong hai cờ lọc dưới đây, và luôn thử `--dry-run` trước khi ghi thật:

```bash
# Chỉ ghi đè đúng các _type nêu ra — vẫn ghi đè MỌI document thuộc type đó.
pnpm import:run --only=page,room

# Chỉ ghi đè đúng các document nêu ra theo _id — an toàn hơn khi chỉ định sửa
# 1-2 trang cụ thể (ví dụ thêm một section mới vào đúng 2 trang, không đụng
# 12 trang `page` còn lại). Gõ sai một _id sẽ NÉM LỖI thay vì âm thầm ghi
# phần còn lại rồi bỏ sót đúng document định sửa.
pnpm import:run --ids=page.wedding,page.royal-international-convention-palace

# Xem trước sẽ ghi gì mà không ghi thật — luôn chạy trước khi ghi thật trên
# dataset sống, kết hợp được với cả --only và --ids.
pnpm import:run --dry-run --ids=page.wedding
```

## Không làm gì

- Không dịch sang tiếng Anh. Mọi field `en` để trống, frontend fallback về `vi`.
- Không đụng vào file nguồn trong `wp-content/`, `assets/`, `*/index.html`.

## Không nằm trong phạm vi Plan B

**Script import KHÔNG ghi `siteSettings` và `navigation`.** `buildDocuments()` không sinh hai
singleton đó. Nghĩa là sau khi `pnpm import:all` chạy xong, những thứ sau vẫn **trống** và phải
nhập tay trong Studio trước khi frontend của Plan C hiển thị được:

- menu đầu trang và các cột chân trang (`navigation`)
- tên thương hiệu, logo, điện thoại, email, địa chỉ, toạ độ bản đồ, mạng xã hội,
  GCN ĐKDN, badge Bộ Công Thương, dòng bản quyền, id widget SecureBookings (`siteSettings`)

Đừng tuyên bố "import xong" khi chưa nhập hai cái này — Plan C sẽ render header và footer rỗng.

**Script import CHỈ sinh 9 trong 15 loại section** (`heroSection`, `richTextSection`,
`tableSection`, `bookingWidgetSection`, `postListSection`, `galleryCarouselSection`,
`venueListSection`, `hallListSection`, `roomListSection`). Sáu loại còn lại —
`cardGridSection`, `mapSection`, `ctaBandSection`, `imageTextSection`, `faqSection`,
`leadFormSection` — **CỐ TÌNH không được sinh ra**. Đây là quyết định biên tập/bố cục
trang (chọn ảnh nào lên card, bản đồ đặt ở đâu, CTA viết gì, FAQ nào đáng hỏi…), không
phải nội dung có thể bóc thẳng từ bản clone HTML — bịa ra từ đó là đoán, không phải trích
xuất. Biên tập viên tự thêm các section này trong Studio khi cần.

## Hoàn thành Plan B

- Sanity có đủ nội dung 22 trang và ~216 ảnh, mọi field `vi` đầy, `en` trống.
- `pnpm import:all` chạy lại được bất cứ lúc nào — cả nội dung document lẫn `_key` bên
  trong Portable Text đều tất định (`out/documents.ndjson` byte-giống-hệt giữa hai lần
  chạy liên tiếp trên cùng dữ liệu nguồn).
- Trang chủ tham chiếu đủ 4 cảm nhận khách hàng qua `homePage.testimonials`.
- 8 document venue + 3 document hall + 4 document room đều được gắn vào đúng 1 trong 4
  route (`culinary`/`experiences` → `venueListSection`, `royal-international-convention-palace`
  → `hallListSection`, `luu-tru-phong-khach-san-villas` → `roomListSection`) — không còn
  document nào "mồ côi", không route nào trỏ tới.
- 148 unit test xanh.

**Tiếp theo:** Plan C dựng frontend. Điều kiện tiên quyết đã thoả — Sanity có dữ liệu
nên `generateStaticParams` sẽ không trả mảng rỗng.
