import { defineType, defineField, defineArrayMember } from 'sanity'
import { SECTION_TYPE_NAMES } from '../sections'

export const homePage = defineType({
  name: 'homePage',
  title: 'Trang chủ',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'sections',
      title: 'Các khối nội dung',
      type: 'array',
      of: SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
    }),
    defineField({
      name: 'testimonials',
      title: 'Cảm nhận khách hàng',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Trang chủ' }) },
})
