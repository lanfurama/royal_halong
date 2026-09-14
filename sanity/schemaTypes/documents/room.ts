import { defineType, defineField, defineArrayMember } from 'sanity'

export const room = defineType({
  name: 'room',
  title: 'Loại phòng',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tên phòng', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({
      name: 'category',
      title: 'Nhóm',
      type: 'string',
      options: {
        list: [
          { title: 'Phòng khách sạn', value: 'hotel' },
          { title: 'Villa', value: 'villa' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'areaSqm', title: 'Diện tích (m²)', type: 'number', validation: (r) => r.positive() }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({ name: 'view', title: 'Hướng phòng', type: 'localeString' }),
    defineField({ name: 'bedType', title: 'Loại giường', type: 'localeString' }),
    defineField({ name: 'summary', title: 'Tóm tắt', type: 'localeText' }),
    defineField({ name: 'description', title: 'Mô tả chi tiết', type: 'localeBlock' }),
    defineField({ name: 'heroImage', title: 'Ảnh đại diện', type: 'figure', validation: (r) => r.required() }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh phòng',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({
      name: 'features',
      title: 'Tiện nghi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'feature',
          fields: [
            defineField({ name: 'icon', title: 'Biểu tượng', type: 'image' }),
            defineField({ name: 'label', title: 'Nội dung', type: 'localeString', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label.vi', media: 'icon' } },
        }),
      ],
    }),
    defineField({ name: 'order', title: 'Thứ tự hiển thị', type: 'number', initialValue: 0 }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [
    { name: 'order', title: 'Thứ tự', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'title.vi', subtitle: 'category', media: 'heroImage' } },
})
