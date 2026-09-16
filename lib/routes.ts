import { fallbackChain, type Locale } from './i18n'

export type SlugField = Partial<Record<Locale, { current?: string | null } | null>>

/**
 * Đường dẫn của một document theo locale. Dùng CHUNG chuỗi fallback với
 * `t()` (`fallbackChain`, lib/i18n.ts) — trước đây hàm này tự viết lại quy
 * tắc "của mình, không có thì về vi"; với hai ngôn ngữ thì hai quy tắc trùng
 * nhau nên không ai thấy, với sáu ngôn ngữ thì chúng lệch ngay: nội dung
 * trang `/ja/...` rơi về tiếng Anh (qua `t()`) trong khi đường dẫn lại rơi
 * về tiếng Việt (qua hàm này).
 */
export function resolveSlug(
  slug: SlugField | null | undefined,
  locale: Locale,
): string | undefined {
  if (!slug) return undefined
  for (const candidate of fallbackChain(locale)) {
    const value = slug[candidate]?.current
    if (value && value.trim() !== '') return value
  }
  return undefined
}

/**
 * Cùng quy tắc với `resolveSlug` nhưng cho dạng PHẲNG mà `ALL_ROUTES_QUERY`
 * trả về (`{ vi: 'casino', en: 'casino', ja: null, ... }`) — sitemap và
 * `generateStaticParams` dùng dạng này. Tách hàm riêng thay vì bắt nơi gọi
 * tự bọc lại thành `{ vi: { current } }` giả.
 */
export function resolveRouteSlug(
  route: Partial<Record<Locale, string | null>> | null | undefined,
  locale: Locale,
): string | undefined {
  if (!route) return undefined
  for (const candidate of fallbackChain(locale)) {
    const value = route[candidate]
    if (value && value.trim() !== '') return value
  }
  return undefined
}

export function hrefFor(locale: Locale, slug: SlugField | null | undefined): string {
  const resolved = resolveSlug(slug, locale)
  return resolved ? `/${locale}/${resolved}` : `/${locale}`
}
