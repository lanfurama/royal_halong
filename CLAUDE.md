@AGENTS.md

# Royal Hạ Long — ghi chú dự án

## Ngôn ngữ

Site chạy **6 ngôn ngữ**. Nguồn sự thật duy nhất là `LOCALES` trong
`lib/i18n.ts` — **không** liệt kê tay danh sách locale ở bất kỳ file nào khác.

| Mã   | Ngôn ngữ  | Tên hiển thị | Route      |
| ---- | --------- | ------------ | ---------- |
| `vi` | Tiếng Việt (gốc, mặc định) | Tiếng Việt | `/vi/...` |
| `en` | Tiếng Anh (ngôn ngữ trung gian) | English | `/en/...` |
| `zh` | Tiếng Trung | 中文 | `/zh/...` |
| `ko` | Tiếng Hàn | 한국어 | `/ko/...` |
| `ja` | Tiếng Nhật | 日本語 | `/ja/...` |
| `th` | Tiếng Thái | ไทย | `/th/...` |

**Chuỗi fallback** (`fallbackChain()` trong `lib/i18n.ts`): `<locale>` → `en`
→ `vi`.

- `vi` **không bao giờ** fallback — `vi` trống là lỗi dữ liệu, `t()` trả
  `undefined` để nơi gọi tự xử lý. Fallback ngược sẽ khiến trang tiếng Việt
  lặng lẽ hiện chữ tiếng Anh.
- Bốn ngôn ngữ mới đi qua `en` trước: khách Nhật gặp trang chưa dịch thì thấy
  tiếng Anh (đọc được) chứ không phải tiếng Việt.
- `resolveSlug()` / `resolveRouteSlug()` (`lib/routes.ts`) dùng **chung** hàm
  `fallbackChain()` — đừng viết lại quy tắc fallback thứ hai ở đâu khác, nội
  dung và đường dẫn sẽ trôi khỏi nhau.

**Khi thêm ngôn ngữ thứ bảy**, chỉ cần sửa các chỗ sau (mọi nơi khác đều sinh
ra từ `LOCALES`):

1. `lib/i18n.ts` — `LOCALES`, `LOCALE_LABELS`, `LOCALE_SHORT`, `OG_LOCALES`,
   `INTL_LOCALES`.
2. `lib/ui-strings.ts` — TypeScript sẽ **báo lỗi biên dịch** ở từng mục thiếu
   bản dịch (`satisfies Record<string, Record<Locale, string>>`). Đây là
   lưới an toàn chính, đừng bỏ `satisfies`.
3. Font: kiểm tra `--font-display` / `--font-body` trong `app/globals.css` có
   phủ hệ chữ mới chưa (Playfair Display và Be Vietnam Pro chỉ có Latin +
   Vietnamese; CJK và Thái đang dùng font hệ thống, cố ý không nạp webfont).

Schema Sanity (`localeString` / `localeText` / `localeBlock` / `localeSlug`)
sinh field từ `LOCALES` qua `sanity/schemaTypes/objects/localeFields.ts`.
`vi` và `en` hiện thẳng trong Studio; bốn ngôn ngữ còn lại nằm trong fieldset
**"Bản dịch khác"** gập sẵn.

Chuỗi giao diện (nhãn nút, tên truy cập cho screen reader, trạng thái form)
nằm ở `lib/ui-strings.ts`, **không** nằm trong Sanity và **không** viết dưới
dạng `lang === 'vi' ? … : …` rải rác trong component.

## Giao diện

Hệ thiết kế hiện tại dựng theo bản Claude Design **"Royal Ha Long Home v2
Light"**: nền kem `#faf6ee`, trục vàng đồng `#b8892b` / `#8f6a1c`, chữ nâu
mực `#2a2110`, Playfair Display + Be Vietnam Pro, **góc vuông** (không bo
góc ở bất cứ đâu ngoài các thành phần tròn thật). Toàn bộ token nằm ở
`@theme` trong `app/globals.css`.

⚠️ **Tương phản — ngoại lệ đã chốt.** Chủ dự án chọn "bám sát design 100%",
nên bốn token chữ dưới đây được dùng dù trượt ngưỡng WCAG AA 4.5:1:

| Chữ | Trên nền | Đo được | Dùng ở |
| --- | --- | --- | --- |
| `#b8892b` (`--color-gold-text`) | kem `#faf6ee` / `#fffdf7` | 2.92 / 3.10 | nhãn eyebrow, link nhỏ |
| `#ffe6a3` (`--color-gold-soft`) | `#8f6a1c` | 4.03 | nhãn cột chân trang |
| `#e8dcbf` (`--color-cream-dim`) | `#8f6a1c` | 3.63 | chữ phụ chân trang |
| `#7d6f55` (`--color-muted`) | `#f3ebdb` | 4.15 | chữ phụ trên dải kem đậm |

Đây là quyết định có ý thức, không phải sơ suất. `tests/e2e/a11y.spec.ts`
**không** bị tắt rule `color-contrast`: nó vẫn đòi 0 vi phạm cho mọi rule
khác, và chỉ cho qua đúng bốn màu chữ trên khi chúng nằm trên một mặt nền
của bản thiết kế — bất kỳ màu nào khác trượt ngưỡng vẫn làm test đỏ.

Muốn đưa site về chuẩn AA: đổi `--color-gold-text` sang `--color-gold-deep`
(`#8f6a1c`, 4.59:1) và các token chữ trên nền vàng đậm sang
`--color-cream-hi`, rồi xoá hai danh sách trong `a11y.spec.ts` — test sẽ tự
chỉ ra chỗ nào còn sót. Mọi nhãn đều dùng token, không hardcode màu.
