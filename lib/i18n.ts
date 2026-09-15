export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

export type LocaleField<T> = { vi?: T | null; en?: T | null }

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Đọc một field song ngữ. Fallback MỘT CHIỀU: en trống -> dùng vi.
 * vi trống là lỗi dữ liệu, trả undefined để chỗ gọi tự xử lý, không fallback ngược.
 */
export function t<T>(
  field: LocaleField<T> | null | undefined,
  locale: Locale,
): T | undefined {
  if (!field) return undefined
  const value = field[locale]
  if (!isEmpty(value)) return value as T
  if (locale === DEFAULT_LOCALE) return undefined
  const fallback = field[DEFAULT_LOCALE]
  return isEmpty(fallback) ? undefined : (fallback as T)
}
