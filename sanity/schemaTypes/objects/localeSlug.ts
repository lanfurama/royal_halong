import { defineType, defineField, type SlugValidationContext } from 'sanity'

const ROUTABLE_TYPES = ['page', 'room', 'post', 'offer']

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
    (slug.vi.current == $slug || slug.en.current == $slug)
  ][0]._id)`
  return client.fetch(query, params)
}

export const localeSlug = defineType({
  name: 'localeSlug',
  title: 'Đường dẫn song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Đường dẫn tiếng Việt',
      type: 'slug',
      validation: (r) => r.required(),
      options: { maxLength: 96, isUnique: isUniqueAcrossRoutableTypes },
    }),
    defineField({
      name: 'en',
      title: 'Đường dẫn English',
      type: 'slug',
      options: { maxLength: 96, isUnique: isUniqueAcrossRoutableTypes },
      description: 'Để trống thì dùng chung đường dẫn tiếng Việt.',
    }),
  ],
})
