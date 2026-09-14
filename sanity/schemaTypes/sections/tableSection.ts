import { defineType, defineField, defineArrayMember } from 'sanity'

export const tableSection = defineType({
  name: 'tableSection',
  title: 'Bảng',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'caption', title: 'Chú thích bảng', type: 'localeString' }),
    defineField({
      name: 'headers',
      title: 'Hàng tiêu đề',
      type: 'array',
      of: [defineArrayMember({ type: 'localeString' })],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'rows',
      title: 'Các hàng',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              name: 'cells',
              title: 'Ô',
              type: 'array',
              of: [defineArrayMember({ type: 'localeString' })],
            }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }) => ({
              title: Array.isArray(cells)
                ? cells.map((c: { vi?: string }) => c?.vi ?? '').join(' | ')
                : '',
            }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Bảng — ${title ?? ''}` }) },
})
