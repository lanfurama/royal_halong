/**
 * Sáu ngôn ngữ của site. Thứ tự trong mảng CŨNG là thứ tự hiển thị trong
 * bộ chuyển ngôn ngữ và trong sitemap, nên đừng sắp lại tuỳ tiện: tiếng Việt
 * đứng đầu (nội dung gốc), tiếng Anh thứ hai (ngôn ngữ trung gian — xem
 * chuỗi fallback ở `t()` bên dưới), rồi bốn thị trường khách quốc tế chính
 * của Hạ Long theo thứ tự lượng khách.
 */
export const LOCALES = ['vi', 'en', 'zh', 'ko', 'ja', 'th'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

/**
 * Ngôn ngữ trung gian. Khi một locale chưa có bản dịch, rơi về ĐÂY trước khi
 * rơi về tiếng Việt: một khách Hàn Quốc gặp trang tiếng Anh vẫn đọc được,
 * gặp trang tiếng Việt thì không.
 */
const BRIDGE_LOCALE: Locale = 'en'

export type LocaleField<T> = Partial<Record<Locale, T | null>>

/** Tên ngôn ngữ viết bằng chính ngôn ngữ đó — quy ước của mọi bộ chuyển
 * ngôn ngữ dùng được: người đang lạc trong một trang tiếng Việt phải nhận ra
 * lối ra của mình, mà "Tiếng Hàn" thì họ không đọc được. */
export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  th: 'ไทย',
}

/** Nhãn rút gọn cho chỗ chật (nút mở dropdown trên header). */
export const LOCALE_SHORT: Record<Locale, string> = {
  vi: 'VI',
  en: 'EN',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  th: 'ไทย',
}

/**
 * Mã BCP-47 đầy đủ cho `openGraph.locale` (Facebook đòi dạng `xx_YY`).
 * `hreflang` và `<html lang>` vẫn dùng mã hai chữ cái của route: cả sáu mã
 * (`vi`/`en`/`zh`/`ko`/`ja`/`th`) đều là giá trị hợp lệ, và giữ chúng trùng
 * với segment URL là cách chắc chắn nhất để hai thứ không trôi khỏi nhau.
 */
export const OG_LOCALES: Record<Locale, string> = {
  vi: 'vi_VN',
  en: 'en_US',
  zh: 'zh_CN',
  ko: 'ko_KR',
  ja: 'ja_JP',
  th: 'th_TH',
}

/** Locale dùng cho `toLocaleDateString` / `toLocaleString`. */
export const INTL_LOCALES: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-GB',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ja: 'ja-JP',
  // `-u-ca-gregory` KHÔNG thừa: `Intl` với `th-TH` mặc định dùng PHẬT LỊCH,
  // nên `toLocaleDateString` trả năm 2569 trong khi thân bài, ấn phẩm quảng
  // cáo và chính con dấu trên giấy phép đều ghi 2026. Cùng một trang hiện hai
  // con số năm khác nhau cho cùng một ngày — khách không biết tin cái nào.
  // Ép dương lịch để mọi ngày tháng trên site khớp với nội dung do biên tập
  // viên gõ tay.
  th: 'th-TH-u-ca-gregory',
}

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
 * Đọc một field đa ngữ.
 *
 * Chuỗi fallback MỘT CHIỀU: `<locale>` -> `en` -> `vi`.
 * - `vi` KHÔNG bao giờ fallback: `vi` trống là lỗi dữ liệu, trả `undefined`
 *   để chỗ gọi tự xử lý. Không fallback ngược từ `en` về `vi` thì trang
 *   tiếng Việt sẽ lặng lẽ hiện chữ tiếng Anh — sai nghiêm trọng hơn là thiếu.
 * - `en` fallback thẳng về `vi` (giữ nguyên hành vi cũ, trước khi có 6 ngôn
 *   ngữ).
 * - Bốn ngôn ngữ còn lại đi qua `en` trước. Đây là lý do `BRIDGE_LOCALE` tồn
 *   tại: bản dịch tiếng Anh gần như luôn được làm trước, nên một trang
 *   tiếng Nhật chưa dịch sẽ hiện tiếng Anh chứ không phải tiếng Việt.
 */
export function t<T>(
  field: LocaleField<T> | null | undefined,
  locale: Locale,
): T | undefined {
  if (!field) return undefined

  for (const candidate of fallbackChain(locale)) {
    const value = field[candidate]
    if (!isEmpty(value)) return value as T
  }
  return undefined
}

/** Thứ tự locale sẽ được thử, từ mong muốn nhất tới cuối cùng. Tách ra khỏi
 * `t()` để `resolveSlug()` (lib/routes.ts) dùng ĐÚNG một quy tắc, không tự
 * viết lại một chuỗi fallback thứ hai rồi trôi khỏi cái này. */
export function fallbackChain(locale: Locale): Locale[] {
  if (locale === DEFAULT_LOCALE) return [DEFAULT_LOCALE]
  if (locale === BRIDGE_LOCALE) return [BRIDGE_LOCALE, DEFAULT_LOCALE]
  return [locale, BRIDGE_LOCALE, DEFAULT_LOCALE]
}
