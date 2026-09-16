import { defineField, type FieldDefinition } from 'sanity'
// Import TƯƠNG ĐỐI, không qua alias `@/`: file này được nạp bởi cả Next
// (route /studio) lẫn `sanity` CLI, và CLI dùng bundler riêng không bảo đảm
// đọc `paths` trong tsconfig.
import { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from '../../../lib/i18n'

/**
 * Bốn ngôn ngữ thêm ở bản mở rộng (zh/ko/ja/th) gom vào một fieldset GẬP
 * SẴN. Không gom thì mỗi khối nội dung trong Studio dài gấp ba: một
 * `localeBlock` sẽ hiện sáu trình soạn thảo rich text chồng nhau, biên tập
 * viên phải cuộn qua bốn ngôn ngữ họ không đụng tới để sửa một dòng tiếng
 * Việt.
 */
export const TRANSLATION_FIELDSET = {
  name: 'translations',
  title: 'Bản dịch khác (中文 · 한국어 · 日本語 · ไทย)',
  options: { collapsible: true, collapsed: true },
} as const

/** `vi` và `en` hiện thẳng; bốn ngôn ngữ còn lại nằm trong fieldset gập. */
const PRIMARY_LOCALES: Locale[] = ['vi', 'en']

/**
 * Sinh đủ sáu field cho một kiểu đa ngữ (`localeString`, `localeText`,
 * `localeBlock`…). Trước bản này mỗi kiểu tự liệt kê tay `vi` + `en`; với
 * sáu ngôn ngữ × bốn kiểu là 24 khai báo chép tay, và thêm ngôn ngữ thứ bảy
 * sẽ phải sửa bốn file — chính xác là kiểu việc bị sót một chỗ.
 *
 * `vi` luôn `required()`: đây là nguồn nội dung gốc, và `t()` (lib/i18n.ts)
 * lấy nó làm chặng cuối của chuỗi fallback — `vi` trống nghĩa là trường đó
 * trống ở CẢ SÁU ngôn ngữ.
 */
export function localeFields(
  build: (locale: Locale, isDefault: boolean) => Omit<FieldDefinition, 'name' | 'title' | 'fieldset'>,
): FieldDefinition[] {
  return LOCALES.map((locale) => {
    const isDefault = locale === DEFAULT_LOCALE
    return defineField({
      ...(build(locale, isDefault) as FieldDefinition),
      name: locale,
      title: LOCALE_LABELS[locale],
      ...(PRIMARY_LOCALES.includes(locale) ? {} : { fieldset: TRANSLATION_FIELDSET.name }),
    })
  })
}
