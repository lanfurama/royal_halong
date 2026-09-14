import { defineType, defineField, defineArrayMember } from 'sanity'

export const venueListSection = defineType({
  name: 'venueListSection',
  title: 'Danh sách nhà hàng / tiện ích',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'filterKind',
      title: 'Lọc theo loại',
      type: 'string',
      options: {
        list: [
          { title: 'Ẩm thực', value: 'dining' },
          { title: 'Tiện ích', value: 'facility' },
          { title: 'Chọn tay bên dưới', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'dining',
    }),
    defineField({
      name: 'venues',
      title: 'Chọn tay',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'venue' }] })],
      hidden: ({ parent }) => parent?.filterKind !== 'manual',
    }),
  ],
  preview: { select: { title: 'heading.vi', subtitle: 'filterKind' }, prepare: ({ title, subtitle }) => ({ title: `Venue — ${title ?? ''}`, subtitle }) },
})
