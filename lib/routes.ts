import { DEFAULT_LOCALE, type Locale } from './i18n'

export interface SlugField {
  vi?: { current?: string | null } | null
  en?: { current?: string | null } | null
}

export function resolveSlug(
  slug: SlugField | null | undefined,
  locale: Locale,
): string | undefined {
  if (!slug) return undefined
  const own = slug[locale]?.current
  if (own && own.trim() !== '') return own
  const fallback = slug[DEFAULT_LOCALE]?.current
  return fallback && fallback.trim() !== '' ? fallback : undefined
}

export function hrefFor(locale: Locale, slug: SlugField | null | undefined): string {
  const resolved = resolveSlug(slug, locale)
  return resolved ? `/${locale}/${resolved}` : `/${locale}`
}
