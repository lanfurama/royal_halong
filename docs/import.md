# Import nội dung từ bản clone HTML

Đổ 22 trang và ~216 ảnh của bản clone WordPress vào Sanity.

## Chạy

```bash
cp .env.example .env.local   # điền project id + SANITY_API_WRITE_TOKEN
pnpm run import              # chạy cả 4 pha
```

`pnpm import` (không có `run`) sẽ bị `pnpm` nuốt mất — `import` là tên lệnh nội
bộ của chính pnpm (chuyển `package-lock.json`/`yarn.lock` sang `pnpm-lock.yaml`),
nên phải gọi `pnpm run import` để chạy đúng script trong `package.json`.

Từng pha chạy riêng được:

| Lệnh | Việc | Ra file |
|---|---|---|
| `pnpm import:parse` | Đọc 22 HTML, bóc nội dung | `out/parsed.json` |
| `pnpm import:assets` | Upload ảnh gốc, có cache | `out/assets.json` |
| `pnpm import:transform` | Dựng document Sanity | `out/documents.ndjson` |
| `pnpm import:run` | Ghi vào Sanity | — |

`pnpm import:run --dry-run` in thống kê mà không ghi.

## Chạy lại được

Cả 4 pha đều idempotent. `_id` tất định (`room.deluxe`, `page.casino`) nên
`createOrReplace` ghi đè đúng document cũ. Ảnh đã upload được nhớ trong
`out/assets.json` nên không upload lại.

**Cảnh báo:** `import:run` ghi đè nội dung đã sửa tay trong Studio. Sau khi biên tập
viên bắt đầu làm việc thật thì đừng chạy lại toàn bộ.

## Không làm gì

- Không dịch sang tiếng Anh. Mọi field `en` để trống, frontend fallback về `vi`.
- Không đụng vào file nguồn trong `wp-content/`, `assets/`, `*/index.html`.

## Không nằm trong phạm vi Plan B

**Script import KHÔNG ghi `siteSettings` và `navigation`.** `buildDocuments()` không sinh hai
singleton đó. Nghĩa là sau khi `pnpm run import` chạy xong, những thứ sau vẫn **trống** và phải
nhập tay trong Studio trước khi frontend của Plan C hiển thị được:

- menu đầu trang và các cột chân trang (`navigation`)
- tên thương hiệu, logo, điện thoại, email, địa chỉ, toạ độ bản đồ, mạng xã hội,
  GCN ĐKDN, badge Bộ Công Thương, dòng bản quyền, id widget SecureBookings (`siteSettings`)

Đừng tuyên bố "import xong" khi chưa nhập hai cái này — Plan C sẽ render header và footer rỗng.

## Hoàn thành Plan B

- Sanity có đủ nội dung 22 trang và ~216 ảnh, mọi field `vi` đầy, `en` trống.
- `pnpm run import` chạy lại được bất cứ lúc nào.
- 120 unit test xanh.

**Tiếp theo:** Plan C dựng frontend. Điều kiện tiên quyết đã thoả — Sanity có dữ liệu
nên `generateStaticParams` sẽ không trả mảng rỗng.
