import Link from 'next/link'
import type { Metadata } from 'next'
import { lora } from '@/lib/fonts'
import { ui } from '@/lib/ui-strings'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang — Royal Halong Hotel',
  robots: { index: false, follow: false },
}

/**
 * Boundary 404 TOÀN CỤC của Next 16 (`experimental.globalNotFound`, xem
 * `next.config.ts`) — dùng khi Next cần render `_not-found` mà không có
 * `app/layout.tsx` gốc truyền thống nào để bao. File này PHẢI tự khai
 * `<html>`/`<body>` (không thừa hưởng được từ
 * `app/(site)/[lang]/layout.tsx`), đúng như convention Next quy định.
 *
 * Vì sao cần: đo trực tiếp bằng curl trên `pnpm build && PORT=3100 pnpm
 * start`, KHÔNG qua browser DOM (DOM sau hydrate luôn đúng, không bắt được
 * lỗi này — xem NOTES ở `app/(site)/[lang]/layout.tsx` và
 * `tests/e2e/routes.spec.ts`):
 *
 *   /vi/khong-ton-tai  server HTML: <html id="__next_error__"> (KHÔNG có lang)
 *
 * `khong-ton-tai` là slug hợp lệ về locale nhưng không khớp document nào ->
 * `app/(site)/[lang]/[slug]/page.tsx` gọi `notFound()`. Vì slug này KHÔNG
 * nằm trong `generateStaticParams()`, Next render nó on-demand ở server, và
 * boundary `notFound()` dùng ở đây là `_not-found` GỐC của toàn app (không
 * phải `app/(site)/[lang]/not-found.tsx`, không đi qua `layout.tsx` có
 * `<html lang={lang}>` đúng) — vì project không có root layout truyền
 * thống, chỉ có layout riêng theo từng route group `(site)`/`(studio)`.
 * Không bật `globalNotFound` + không có file này, Next tự chèn shell mặc
 * định không có `lang`, giống hệt split "HTML server sai, DOM sau hydrate
 * đúng" mà lần sửa route-group trước (task c7) đã đóng cho 24 route nội
 * dung — bỏ ngỏ đúng nhánh lỗi này ở boundary lỗi.
 *
 * Đây là boundary TOÀN CỤC — không nhận `params`, nên không biết được locale
 * thật của request đang gõ nhầm URL. `DEFAULT_LOCALE` ('vi') là lựa chọn hợp
 * lý nhất có thể, còn hơn hẳn không có `lang` nào cả.
 */
export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE} className={lora.variable}>
      <body>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <h1 className="font-display text-gold-deep text-4xl">{ui('notFoundTitle', DEFAULT_LOCALE)}</h1>
          <p className="mt-4">{ui('notFoundBody', DEFAULT_LOCALE)}</p>
          <Link
            href={`/${DEFAULT_LOCALE}`}
            className="bg-gold text-ink mt-8 inline-block px-6 py-3 font-medium"
          >
            {ui('backHome', DEFAULT_LOCALE)}
          </Link>
        </div>
      </body>
    </html>
  )
}
