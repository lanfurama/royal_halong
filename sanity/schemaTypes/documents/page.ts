import { defineType, defineField, defineArrayMember } from 'sanity'
import { SECTION_TYPE_NAMES } from '../sections'

export const page = defineType({
  name: 'page',
  title: 'Trang',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({
      name: 'sections',
      title: 'Các khối nội dung',
      type: 'array',
      of: SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { select: { title: 'title.vi', subtitle: 'slug.vi.current' } },
})
