import type { Metadata } from 'next'
import { t, LOCALES, type Locale } from './i18n'
import { resolveSlug, type SlugField } from './routes'

export function absoluteUrl(path: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMetadata({
  doc,
  lang,
  settings,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
}: {
  // `SanityDoc` (sanity/lib/fetchers.ts) mang index signature `[key: string]:
  // unknown` — TS coi kiểu tường minh bên dưới là "weak type" (mọi field đều
  // optional) và từ chối gán một object có index signature vào đó ("no
  // properties in common"). Khai `any` ở đây, giống `settings`, thay vì đấu
  // với TS cho một kiểu vốn đã lỏng theo thiết kế (dự án chưa chạy TypeGen).
  doc: { title?: any; slug?: SlugField; seo?: any } | Record<string, any> | null | undefined
  lang: Locale
  settings: any
  siteUrl?: string
}): Metadata {
  const brand = t<string>(settings?.brandName, lang) ?? 'Royal Halong Hotel'
  const pageTitle = t<string>(doc?.seo?.metaTitle, lang) ?? t<string>(doc?.title, lang) ?? brand
  const description = t<string>(doc?.seo?.metaDescription, lang)

  const currentSlug = resolveSlug(doc?.slug, lang)
  const path = currentSlug ? `/${lang}/${currentSlug}` : `/${lang}`

  const languages: Record<string, string> = {}
  for (const locale of LOCALES) {
    const localeSlug = resolveSlug(doc?.slug, locale)
    languages[locale] = absoluteUrl(localeSlug ? `/${locale}/${localeSlug}` : `/${locale}`, siteUrl)
  }

  return {
    title: pageTitle === brand ? brand : `${pageTitle} — ${brand}`,
    description,
    alternates: {
      canonical: absoluteUrl(path, siteUrl),
      languages,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: absoluteUrl(path, siteUrl),
      siteName: brand,
      locale: lang === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
    },
    ...(doc?.seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}

// Cùng fallback với Header/Footer (`components/layout/Header.tsx`,
// `components/layout/Footer.tsx`) — `siteSettings` chưa có document nào
// trong Sanity hôm nay, nhưng cả hai component đó vẫn hiển thị tên thương
// hiệu tĩnh thay vì để trống. JSON-LD nên nhất quán: một khối `Hotel` tối
// thiểu (name + url) tốt hơn im lặng hoàn toàn.
const BRAND_FALLBACK = 'Royal Halong Hotel'

/**
 * `siteSettings` chưa có document nào trong Sanity hôm nay
 * (`getSiteSettings()` trả `null`), nên hầu hết field ở đây không có dữ liệu.
 * Luôn trả một khối `Hotel` tối thiểu (name + url, dùng cùng fallback với
 * Header/Footer) thay vì bỏ hẳn — nhưng mỗi field con (address/telephone/
 * email/geo) chỉ được thêm vào khi có dữ liệu thật, không có field nào mang
 * giá trị `undefined`.
 */
export function buildHotelJsonLd({
  settings,
  lang,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
}: {
  settings: any
  lang: Locale
  siteUrl?: string
}): Record<string, unknown> {
  const name = t<string>(settings?.brandName, lang) ?? BRAND_FALLBACK

  const streetAddress = t<string>(settings?.addressFull, lang)
  const address = streetAddress
    ? { '@type': 'PostalAddress', streetAddress, addressCountry: 'VN' }
    : undefined

  const hasGeo = typeof settings?.lat === 'number' && typeof settings?.lng === 'number'
  const geo = hasGeo
    ? { '@type': 'GeoCoordinates', latitude: settings.lat, longitude: settings.lng }
    : undefined

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name,
    url: absoluteUrl(`/${lang}`, siteUrl),
  }
  if (address) data.address = address
  if (settings?.tel) data.telephone = settings.tel
  if (settings?.emails?.[0]) data.email = settings.emails[0]
  if (geo) data.geo = geo

  return data
}
