import { defineType, defineField, defineArrayMember } from 'sanity'

export const hall = defineType({
  name: 'hall',
  title: 'Phòng hội nghị',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Tên phòng', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({ name: 'areaSqm', title: 'Diện tích (m²)', type: 'number' }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({
      name: 'layouts',
      title: 'Kiểu bố trí',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'layout',
          fields: [
            defineField({ name: 'style', title: 'Kiểu', type: 'localeString' }),
            defineField({ name: 'seats', title: 'Số chỗ', type: 'number' }),
          ],
          preview: { select: { title: 'style.vi', subtitle: 'seats' } },
        }),
      ],
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  orderings: [
    { name: 'order', title: 'Thứ tự', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'name.vi', subtitle: 'capacity.vi', media: 'image' } },
})
