# Royal Halong — Next.js + Sanity + Neon

Website khách sạn Royal Halong, dựng lại từ bản clone WordPress/Salient (xem `NOTES.md`
cho chi tiết quá trình clone). Next.js 16 (App Router, Cache Components/PPR) + Sanity
(nội dung) + Neon Postgres (lead form, newsletter).

**Đọc `AGENTS.md` trước khi sửa bất kỳ route/data-fetching nào.** Đây KHÔNG phải Next.js
bạn đã quen — `cacheComponents` bật sẵn trong `next.config.ts` đổi hành vi caching/route
segment config đáng kể so với kiến thức huấn luyện thông thường. Ví dụ thật gặp phải khi
làm task này: `export const runtime = 'nodejs'` (tưởng vô hại vì 'nodejs' là default) làm
`next build` chết cứng với `cacheComponents` bật — phải xoá hẳn dòng export đó, xem
`app/api/leads/route.ts`.

## Bắt đầu

```bash
pnpm install
cp .env.example .env.local    # điền giá trị thật, xem bảng biến môi trường bên dưới
pnpm run import:all           # đổ nội dung từ bản clone HTML vào Sanity (chạy một lần)
pnpm dev
```

- Site: <http://localhost:3000>
- Studio: <http://localhost:3000/studio>

## Lệnh

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy dev server |
| `pnpm build` / `pnpm start` | Build và chạy production |
| `pnpm typecheck` | `next typegen` rồi `tsc --noEmit` |
| `pnpm test` | Unit test (Vitest) — 329 test |
| `pnpm test:e2e` | E2E (Playwright, tự build + start trước khi chạy) |
| `pnpm run import:all` | Import nội dung — xem `docs/import.md` |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Migration Neon (Drizzle) |

### Chạy E2E đúng cách

`playwright.config.ts` có `reuseExistingServer: !process.env.CI` — nếu máy bạn ĐANG có
dev server chạy sẵn ở cổng 3000 (rất dễ xảy ra), `pnpm test:e2e` mặc định sẽ BÁM vào dev
server đó thay vì tự build bản production, và kết quả không phản ánh đúng caching/bundle
thật. Luôn đổi cổng khi có nghi ngờ:

```bash
PORT=3100 pnpm test:e2e
```

E2E hiện có ~106 test (`tests/e2e/routes.spec.ts`, `a11y.spec.ts`, `forms.spec.ts`). Bộ
`forms.spec.ts` có vài test bị **skip có chủ đích** khi chưa có `DATABASE_URL` (xem mục
Neon bên dưới) — đọc log skip, đừng tưởng là bug.

## Biến môi trường

| Biến | Bắt buộc? | Việc |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | Có | Kết nối Sanity |
| `SANITY_API_READ_TOKEN` | Có | Viewer token — `defineLive` (`sanity/lib/live.ts`) ném lỗi ngay lúc import nếu thiếu |
| `SANITY_API_WRITE_TOKEN` | Chỉ khi chạy import | Editor token — **CHỈ dùng cho `pnpm run import:*` ở máy local, KHÔNG đặt trên Vercel** (xem cảnh báo #1 bên dưới) |
| `NEXT_PUBLIC_SITE_URL` | Có | Dùng cho sitemap/metadata tuyệt đối |
| `DATABASE_URL` | Không (form vẫn chạy, xem cảnh báo #4) | Neon Postgres, pooled connection string — lead form + newsletter, xem `lib/db` |
| `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` | Không | Mail thông báo lead — thiếu thì bỏ qua, lead vẫn lưu DB |

## Kiến trúc

- **Next.js 16** App Router, `cacheComponents` (Partial Prerendering) bật sẵn. Một
  catch-all `app/(site)/[lang]/[slug]` giữ nguyên toàn bộ URL của site cũ.
- **Sanity** giữ nội dung. Revalidate qua Live Content API (`sanity/lib/live.ts`,
  `cacheLife: sanity` trong `next.config.ts`) — không có webhook nào phải cấu hình, nhưng
  đọc cảnh báo #8 về build cache trước khi kết luận "không thấy thay đổi = chưa ghi được".
- **Neon Postgres** (Drizzle) giữ lead form và newsletter (`lib/db`, `app/actions/lead.ts`,
  `app/actions/newsletter.ts`, `app/api/leads`, `app/api/newsletter`). Đặt phòng do widget
  bên thứ ba SecureBookings lo, không liên quan Neon (cảnh báo #9).
- Song ngữ `{vi, en}` (`lib/i18n.ts`), fallback một chiều EN → VI. `lang` là tham số route,
  không phải nội dung — một trang có thể hiển thị UI tiếng Anh (label form, nút bấm...)
  trong khi nội dung Sanity của nó vẫn tiếng Việt nếu bản dịch `en` chưa được nhập.

## Quy tắc màu (đã đo, đừng đoán)

Không tông vàng nào của bản gốc đọc được cho chữ nhỏ trên nền sáng:

| Token | trên trắng | Dùng cho |
|---|---|---|
| `gold #bf8d2c` | 2.97 ✗ | nền, viền, icon, chữ trên nền tối |
| `gold-deep #9b7f22` | 3.85 | heading ≥ 24px trên nền sáng |
| `gold-text #896520` | 5.32 ✓ | chữ nhỏ trên nền sáng |

Nút nền gold dùng chữ `ink`, **không** dùng chữ trắng (chỉ 2.97:1).

## Cảnh báo vận hành — đọc trước khi đụng vào Sanity/Neon/Resend/Vercel

Những điều dưới đây là kiến thức đã trả giá trong lúc làm (đo thật, không suy ra được
từ đọc code một mình) — bỏ qua sẽ tốn thời gian debug lặp lại y hệt.

1. **`SANITY_API_WRITE_TOKEN` chỉ dùng cho script import ở máy local.** KHÔNG đặt biến
   này trên Vercel — production không cần ghi Sanity, chỉ đọc.
2. **Token Sanity hiện tại là loại Developer, dùng chung cho cả đọc lẫn ghi.** Trước khi
   deploy công khai: thu hồi token này trong Sanity console, tách thành hai — một Viewer
   token (đặt `SANITY_API_READ_TOKEN` trên Vercel) và một Editor token (chỉ giữ ở máy chạy
   import, không commit, không đặt trên Vercel).
3. **Domain Vercel phải được thêm vào CORS allowlist của Sanity** (Sanity Studio → API →
   CORS Origins) trước khi deploy, nếu không Live Content API phía client sẽ fail âm thầm
   trên production dù mọi thứ chạy đúng ở local.
4. **`sendLeadNotification()` (`lib/mail.ts`) trả `'skipped'` cho CẢ HAI trường hợp:**
   chưa cấu hình `RESEND_API_KEY`/`LEAD_NOTIFY_EMAIL`, VÀ đã cấu hình nhưng gửi mail thất
   bại (domain chưa verify, Resend từ chối...). **Lead vẫn luôn được ghi vào Neon trước**
   — mail chỉ là thông báo phụ — nhưng người vận hành phải xem log Vercel
   (`console.error('[lib/mail]...')`) mới phân biệt được "chưa cấu hình" với "cấu hình rồi
   nhưng gửi hỏng".
5. **Địa chỉ gửi mail đang là domain sandbox của Resend** (`onboarding@resend.dev`, xem
   `lib/mail.ts`) — phải verify domain thật của khách sạn trong Resend rồi đổi `from`
   trước khi chạy production, nếu không mail thông báo lead sẽ vào spam hoặc bị chặn hẳn.
6. **Rate limit (`lib/rate-limit.ts`) lưu trong bộ nhớ tiến trình (một `Map`), không phải
   Redis/DB.** Trên Vercel mỗi instance serverless đếm riêng (không chia sẻ giữa các
   instance), và một instance có thể bị thu hồi/tái tạo bất kỳ lúc nào (mất state, hạn mức
   coi như "reset"). Đây là biện pháp cản spam thô, **KHÔNG phải giới hạn được đảm bảo** —
   đừng dựa vào nó cho bất cứ điều gì cần chính xác.
7. **`pnpm import:run` dùng `createOrReplace`** — chạy lại TOÀN BỘ sẽ GHI ĐÈ mọi chỉnh sửa
   biên tập viên đã làm tay trên dataset sống sau lần import đầu (ví dụ: đã sửa link domain
   cũ trên `page.offers`, `page.terms-and-conditions`). Đừng chạy `pnpm import:all` lại vô
   tội vạ một khi Studio đã có người dùng thật. Dùng có chọn lọc:
   - `pnpm import:run --only=<type1>,<type2>` — chỉ ghi đè đúng các `_type` nêu ra.
   - `pnpm import:run --ids=<_id1>,<_id2>` — chỉ ghi đè đúng các document nêu ra (an toàn
     hơn `--only` khi chỉ muốn sửa 1-2 trang cụ thể, ví dụ thêm section vào đúng 2 trang).
   - `pnpm import:run --dry-run` — in thống kê những gì SẼ ghi mà không ghi thật, luôn thử
     trước khi chạy thật trên dataset sống.
8. **Sau khi ghi Sanity, cache cũ có thể che mất thay đổi ở CẢ HAI nơi, không chỉ dev server:**
   - `next dev` phục vụ bản cache cũ trong bộ nhớ tiến trình — khởi động lại (`pnpm dev`)
     là thấy ngay.
   - **`next build` (production) có thể tệ hơn và ÂM THẦM hơn:** `cacheComponents` +
     `cacheLife: sanity` (`next.config.ts`) cache kết quả `sanityFetch`/GROQ trong
     `.next/cache`, và cache đó **SỐNG SÓT QUA NHIỀU LẦN BUILD** nếu không xoá `.next`.
     Đo được thật trong lúc làm Task 6: một `pnpm build` chạy sau khi Sanity đã có thêm
     `leadFormSection` vẫn ra static HTML KHÔNG có section đó — không có lỗi, không có
     warning, trang build xong "thành công" bình thường, chỉ là thiếu nội dung. Xoá
     `rm -rf .next` rồi build lại thì đúng. **Nếu một trang build production thiếu nội
     dung mới ghi vào Sanity mà không rõ lý do, việc đầu tiên cần thử là `rm -rf .next`
     rồi build lại trước khi nghi ngờ bất cứ thứ gì khác.**
9. **Đặt phòng do widget bên thứ ba SecureBookings lo** (AngularJS, nhúng qua
   `bookingWidgetSection` + `secureBookingsWidgetId` trong `siteSettings`) — không liên
   quan gì tới Neon/lead form của Plan D. Widget này là "façade" kế thừa từ bản gốc (xem
   `NOTES.md` mục "Known gaps") — ảnh phòng của nó dùng `ng-src` do chính Angular tự bind
   sau khi gọi API riêng, nên có thể trống một nhịp ngay sau khi trang tải xong; đây là
   hành vi bình thường của widget, không phải lỗi trang.

## Trước khi deploy công khai

Xem `NOTES.md` mục "Must replace". Ảnh, bài viết, logo, GCN ĐKDN và badge Bộ Công Thương
là tài sản của Royal Halong Hotel. Theme Salient gốc đã bị bỏ hoàn toàn nên không còn
ràng buộc license ThemeForest.

Việc còn lại ngoài "Must replace" trong `NOTES.md`:

- **Nội dung tiếng Anh** — hạ tầng song ngữ đã sẵn (`lib/i18n.ts`, fallback EN → VI), cần
  người nhập bản dịch vào Studio cho từng trang.
- **Deploy** — tạo project Vercel, đặt biến môi trường theo bảng ở trên (KHÔNG đặt
  `SANITY_API_WRITE_TOKEN`), trỏ domain, rồi làm cảnh báo #3 (CORS) trước khi công khai.
- **Cấp phát Neon** — `DATABASE_URL` hiện chưa được điền ở bất kỳ đâu (kể cả local). Cho
  tới khi có, form lead/newsletter vẫn nhận submit và validate bình thường nhưng báo lỗi
  thân thiện thay vì lưu được — xem `tests/e2e/forms.spec.ts` để biết chính xác hành vi
  đã được kiểm chứng ở trạng thái này.
- **Verify domain trong Resend** rồi đổi `from` trong `lib/mail.ts` (cảnh báo #5).
- **Analytics** — GTM đã bị gỡ khỏi bản clone (xem `NOTES.md`); thêm lại là quyết định
  riêng, chưa nằm trong phạm vi các Plan đã làm.
