import type { Metadata } from 'next'
import { t, isEmpty, LOCALES, DEFAULT_LOCALE, type Locale } from './i18n'
import { resolveSlug, type SlugField } from './routes'
import { siteUrl as defaultSiteUrl } from './site-url'
import { urlFor } from '@/sanity/lib/image'

export function absoluteUrl(path: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMetadata({
  doc,
  lang,
  settings,
  siteUrl = defaultSiteUrl(),
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
  // `x-default` báo cho Google biết phiên bản nào dùng khi không khớp locale
  // nào cả — luôn trỏ `vi` (DEFAULT_LOCALE), nguồn nội dung thật duy nhất.
  languages['x-default'] = languages[DEFAULT_LOCALE]

  // Toàn bộ `/en/*` hôm nay được prerender, index được, tự-canonical, và
  // giống hệt byte-for-byte bản `/vi/*` — `t()` (lib/i18n.ts) luôn fallback
  // vi khi en trống, nên "bản EN" không tồn tại về nội dung, chỉ tồn tại về
  // route. Google thấy 24 URL trùng lặp được quảng cáo là một bản tiếng Anh
  // không có thật. Việc rẻ nhất-mà-đúng: kiểm tra field universal duy nhất có
  // trên MỌI loại document (title — bắt buộc trên page/homePage/room/post/
  // offer) có bản dịch EN THẬT hay không, KHÔNG qua `t()` (vì `t()` tự
  // fallback, sẽ luôn báo "có"). Không có -> đây là bản sao vi giả làm en ->
  // noindex, nhưng vẫn để `follow` (đường link nội bộ vẫn nên được đi qua).
  const hasOwnLocaleContent = lang === DEFAULT_LOCALE || !isEmpty(doc?.title?.[lang])
  // Biên tập viên tự chặn (`seo.noIndex`) -> chặn hẳn (không index, không
  // theo link). Bản sao vi-giả-làm-en -> chỉ không index, VẪN cho theo link
  // nội bộ (dẫn bot về đúng bản vi có nội dung thật thay vì cụt đường).
  const robots = doc?.seo?.noIndex
    ? { index: false, follow: false }
    : !hasOwnLocaleContent
      ? { index: false, follow: true }
      : undefined

  // `seo.ogImage` được query (`sanity/lib/queries.ts:87,95`) nhưng trước đây
  // không chỗ nào tiêu thụ nó. Ảnh chia sẻ mạng xã hội mặc định rơi về ảnh
  // của Next tự chọn (thường không có) thay vì ảnh biên tập viên đã chọn.
  const ogImageAsset = doc?.seo?.ogImage
  const ogImageUrl = ogImageAsset?.asset
    ? urlFor(ogImageAsset).width(1200).height(630).fit('crop').url()
    : undefined

  return {
    title: pageTitle === brand ? brand : `${pageTitle} — ${brand}`,
    description,
    // `ogImageUrl` ở trên luôn là URL tuyệt đối (cdn.sanity.io) nên tự nó
    // không cần `metadataBase` để resolve — nhưng Next dùng field này chung
    // cho mọi URL tương đối khác trong metadata (og/twitter), và không có nó
    // sẽ resolve nhầm về `localhost:3000` mặc định trên chính production.
    // Set luôn ở đây, cùng nguồn `siteUrl` với canonical/hreflang.
    metadataBase: new URL(siteUrl),
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
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
    ...(robots ? { robots } : {}),
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
  siteUrl = defaultSiteUrl(),
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
