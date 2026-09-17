import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { notFound } from 'next/navigation'
import { lora } from '@/lib/fonts'
import { isLocale, LOCALES } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { SanityLive } from '@/sanity/lib/live'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Royal Halong Hotel',
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

// Root layout của nhóm route (site) — sở hữu <html>/<body> cho toàn bộ
// `/[lang]/*`. Trước đây <html>/<body> nằm ở `app/layout.tsx`, layout đó là
// root DUY NHẤT của cả cây (kể cả `/studio`), nên không có `params.lang` —
// đã thử fix bằng headers()/next-script, cả hai đều sai (xem NOTES bên
// dưới). Chuyển sang route group: `(site)` và `(studio)` mỗi nhóm có root
// layout riêng, URL không đổi (route group không vào path). `[lang]/layout`
// giờ LÀ root của nhóm `(site)`, nên `params.lang` có sẵn, tĩnh, đúng theo
// generateStaticParams — <html lang> đúng ngay trong HTML server render ra,
// không cần bất kỳ cơ chế phía client nào.
//
// Đã thử và loại bỏ:
// 1. headers() ở root layout cũ: dưới cacheComponents: true, một API động ở
//    root kéo TOÀN BỘ site (kể cả trang tĩnh) sang render động — `pnpm build`
//    from thất bại thật ("uncached or runtime data during prerendering" trên
//    /vi/offers). Và bị cấm sửa middleware.ts để gắn header đó.
// 2. next/script beforeInteractive: sửa `document.documentElement.lang` chỉ
//    ở phía CLIENT — HTML server trả về (curl, không chạy JS) vẫn luôn
//    lang="vi". Sai thật: screen reader áp quy tắc phát âm theo tài liệu ban
//    đầu, và Google thấy lang="vi" cạnh hreflang="en" ngược nhau. Route
//    group giải quyết tận gốc, không còn hai cơ chế cùng sửa một attribute.
export default async function SiteLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const { isEnabled: isDraftMode } = await draftMode()

  // Header/Footer/JsonLd chuyển xuống từng PAGE qua `<SiteChrome>` (xem
  // `components/layout/SiteChrome.tsx`) — layout này không có `slug` của
  // trang con (Next không truyền param của segment con lên layout cha), nên
  // không thể truyền slug đúng xuống `LangSwitcher`. `{children}` ở đây giờ
  // LÀ `<SiteChrome>...</SiteChrome>` do page trả về.
  return (
    <html lang={lang} className={lora.variable}>
      <body>
        {/* Link "bỏ qua điều hướng" phải nằm ở LAYOUT, không phải trong
            `Header`.

            `app/(site)/[lang]/loading.tsx` là Suspense fallback cấp route,
            nên toàn bộ `{children}` — kể cả `SiteChrome` và `Header` — bị
            treo cho tới khi trang stream xong. Khi skip link còn nằm trong
            `Header`, cửa sổ đó là một vùng CHẾT với bàn phím: đo trên bản
            production, bấm Tab ngay sau sự kiện `load` cho
            `document.activeElement === BODY` (trang mới hiện "Đang tải"), và
            skip link chỉ focus được ở ~253ms. Người dùng bàn phím bấm Tab
            phát đầu tiên rơi vào hư không — mà skip link tồn tại chính xác
            để phục vụ họ.

            Ở đây nó nằm NGOÀI ranh giới treo, là phần tử focus được đầu tiên
            của tài liệu ngay từ byte HTML đầu tiên, đúng định nghĩa của một
            skip link. `tests/e2e/a11y.spec.ts` kiểm đúng điều đó bằng một
            phát Tab, không chờ đợi gì. */}
        <a
          href="#main"
          className="focus:bg-gold focus:text-cream-hi sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
        >
          {ui('skipNav', lang)}
        </a>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
