import Link from 'next/link'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { ui } from '@/lib/ui-strings'

// Đo thật bằng curl (`pnpm build && PORT=3100 pnpm start`): boundary này
// KHÔNG được dùng cho `notFound()` gọi từ `[slug]/page.tsx` với slug ngoài
// `generateStaticParams()` (case đó rơi vào `_not-found` gốc của Next, xem
// `app/global-not-found.tsx`) — nhưng vẫn có thể được dùng cho các ca khác
// (layout tự gọi `notFound()` khi `lang` không hợp lệ, dev mode, hoặc slug
// NẰM TRONG static params nhưng document đã bị xoá giữa build và request).
// Bọc bằng `SiteChrome` để nhất quán có Header/Footer/skip-link giống mọi
// trang khác thay vì để trống — trước đây có được nhờ layout.tsx tự render
// Header/Footer quanh `{children}}` (đã chuyển xuống từng page, xem
// `components/layout/SiteChrome.tsx`).
//
// `not-found.tsx` theo convention Next KHÔNG nhận props/params — `lang`
// dùng `DEFAULT_LOCALE` làm giá trị hợp lý nhất có thể trong trường hợp đó.
export default function NotFound({ params }: { params?: { lang?: string } }) {
  const lang = isLocale(params?.lang ?? '') ? (params!.lang as Locale) : DEFAULT_LOCALE

  return (
    <SiteChrome lang={lang} slug={null}>
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-display text-gold-deep text-4xl">{ui('notFoundTitle', lang)}</h1>
        <p className="mt-4">{ui('notFoundBody', lang)}</p>
        <Link
          href={`/${lang}`}
          className="bg-gold text-ink mt-8 inline-block px-6 py-3 font-medium"
        >
          {ui('backHome', lang)}
        </Link>
      </div>
    </SiteChrome>
  )
}
