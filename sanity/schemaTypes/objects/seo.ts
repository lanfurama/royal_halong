import { defineType, defineField } from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Tiêu đề meta',
      type: 'localeString',
      description: 'Để trống thì dùng tiêu đề trang. Nên dưới 60 ký tự.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Mô tả meta',
      type: 'localeText',
      description: 'Nên 120–160 ký tự.',
    }),
    defineField({ name: 'ogImage', title: 'Ảnh chia sẻ mạng xã hội', type: 'figure' }),
    defineField({
      name: 'noIndex',
      title: 'Chặn Google lập chỉ mục',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
