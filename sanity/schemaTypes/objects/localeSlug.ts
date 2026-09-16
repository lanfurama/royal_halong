import { defineType, type SlugValidationContext } from 'sanity'
import { LOCALES, DEFAULT_LOCALE } from '../../../lib/i18n'
import { localeFields, TRANSLATION_FIELDSET } from './localeFields'

const ROUTABLE_TYPES = ['page', 'room', 'post', 'offer']

/**
 * Điều kiện "slug này đã có ai dùng chưa" — sinh từ `LOCALES` thay vì viết
 * tay `slug.vi.current == $slug || slug.en.current == $slug`. Router khớp
 * một slug với document theo BẤT KỲ locale nào (xem `DOC_BY_SLUG_QUERY`),
 * nên nếu kiểm tra trùng chỉ soi hai locale thì một slug tiếng Nhật trùng
 * slug tiếng Hàn vẫn lọt qua validation rồi hai trang tranh nhau cùng một
 * URL lúc chạy.
 */
const SLUG_MATCH_ANY_LOCALE = LOCALES.map((l) => `slug.${l}.current == $slug`).join(' || ')

async function isUniqueAcrossRoutableTypes(
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> {
  const { document, getClient } = context
  if (!document) return true
  const client = getClient({ apiVersion: '2026-09-14' })
  const id = document._id.replace(/^drafts\./, '')
  const params = {
    draft: `drafts.${id}`,
    published: id,
    slug,
    types: ROUTABLE_TYPES,
  }
  const query = `!defined(*[
    _type in $types &&
    !(_id in [$draft, $published]) &&
    (${SLUG_MATCH_ANY_LOCALE})
  ][0]._id)`
  return client.fetch(query, params)
}

export const localeSlug = defineType({
  name: 'localeSlug',
  title: 'Đường dẫn đa ngữ',
  type: 'object',
  fieldsets: [TRANSLATION_FIELDSET],
  fields: localeFields((locale, isDefault) => ({
    type: 'slug',
    options: { maxLength: 96, isUnique: isUniqueAcrossRoutableTypes },
    ...(isDefault
      ? { validation: (r: any) => r.required() }
      : {
          description:
            locale === 'en'
              ? `Để trống thì dùng đường dẫn tiếng Việt.`
              : `Để trống thì dùng đường dẫn tiếng Anh, không có nữa thì dùng tiếng Việt.`,
        }),
  })),
})

// Giữ export để nơi khác (vd. script import) dùng lại đúng một định nghĩa
// "locale gốc" thay vì viết lại chuỗi 'vi'.
export { DEFAULT_LOCALE }
