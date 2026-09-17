import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { notFound } from 'next/navigation'
import { lora } from '@/lib/fonts'
import { isLocale, LOCALES } from '@/lib/i18n'
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
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
