import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { notFound } from 'next/navigation'
import { display, body, accent, alt } from '@/lib/fonts'
import { isLocale, LOCALES } from '@/lib/i18n'
import { getNavigation, getSiteSettings } from '@/sanity/lib/fetchers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildHotelJsonLd } from '@/lib/seo'
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
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')

  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])
  const hotelJsonLd = buildHotelJsonLd({ settings, lang })

  return (
    <html lang={lang} className={fontVars}>
      <body>
        <JsonLd data={hotelJsonLd} />
        <Header lang={lang} navigation={navigation} settings={settings} />
        <main id="main">{children}</main>
        <Footer lang={lang} navigation={navigation} settings={settings} />
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
