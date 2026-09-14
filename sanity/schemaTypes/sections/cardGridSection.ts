import { defineType, defineField, defineArrayMember } from 'sanity'

export const cardGridSection = defineType({
  name: 'cardGridSection',
  title: 'Lưới thẻ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'subheading', title: 'Tiêu đề phụ', type: 'localeString' }),
    defineField({
      name: 'cards',
      title: 'Thẻ',
      type: 'array',
      validation: (r) => r.min(1).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'card',
          fields: [
            defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
            defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
            defineField({ name: 'cta', title: 'Liên kết', type: 'link' }),
          ],
          preview: { select: { title: 'title.vi', media: 'image' } },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Số cột trên desktop',
      type: 'number',
      options: { list: [2, 3, 4] },
      initialValue: 3,
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Lưới thẻ — ${title ?? ''}` }) },
})
