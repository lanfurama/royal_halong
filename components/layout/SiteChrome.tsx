import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import type { SlugField } from '@/lib/routes'
import { getNavigation, getSiteSettings } from '@/sanity/lib/fetchers'
import { buildHotelJsonLd } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { Header } from './Header'
import { Footer } from './Footer'

/**
 * Header/Footer/JsonLd trước đây sống trong `app/(site)/[lang]/layout.tsx`
 * — layout đó chỉ nhận `params.lang`, KHÔNG có `slug` của trang đang render
 * (Next không truyền param của segment con xuống layout cha). Hệ quả:
 * `LangSwitcher` (trong Header) không thể biết slug riêng từng locale của
 * trang hiện tại, phải hoán prefix mù — đúng lớp lỗi Fix c9-8 mô tả (ngày
 * editor thêm slug EN khác slug VI, hreflang và nút chuyển ngôn ngữ trỏ khác
 * nhau).
 *
 * Chuyển sang gọi ở TỪNG PAGE (`app/(site)/[lang]/page.tsx` cho trang chủ,
 * `app/(site)/[lang]/[slug]/page.tsx` cho phần còn lại) — nơi DUY NHẤT có
 * `doc.slug` thật. `layout.tsx` giờ chỉ còn giữ `<html>/<body>` (đúng chỗ
 * cho `lang`) + `SanityLive`/`VisualEditing` (không phụ thuộc per-page doc).
 *
 * Gọi lại `getSiteSettings()`/`getNavigation()` ở đây (thay vì nhận qua
 * prop) trông như phí hơn, nhưng cả hai đều qua `cachedSanity` (`'use
 * cache'`, xem `sanity/lib/live.ts`) — bị dedupe trong cùng request, không
 * phải round-trip mạng thứ hai.
 */
export async function SiteChrome({
  lang,
  slug,
  children,
}: {
  lang: Locale
  /** Slug (song ngữ) của document đang render — `null`/`undefined` cho
   * trang chủ (không có slug, luôn là `/${lang}`). */
  slug?: SlugField | null
  children: ReactNode
}) {
  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])
  const hotelJsonLd = buildHotelJsonLd({ settings, lang })

  return (
    <>
      <JsonLd data={hotelJsonLd} />
      <Header lang={lang} navigation={navigation} settings={settings} slug={slug} />
      <main id="main">{children}</main>
      <Footer lang={lang} navigation={navigation} settings={settings} />
    </>
  )
}
