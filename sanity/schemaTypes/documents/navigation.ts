import { defineType, defineField, defineArrayMember } from 'sanity'

const navItem = defineArrayMember({
  type: 'object',
  name: 'navItem',
  fields: [
    defineField({ name: 'label', title: 'Nhãn', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'link', title: 'Liên kết', type: 'link' }),
    defineField({
      name: 'children',
      title: 'Mục con',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navChild',
          fields: [
            defineField({ name: 'label', title: 'Nhãn', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'link', title: 'Liên kết', type: 'link' }),
          ],
          preview: { select: { title: 'label.vi' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'label.vi' } },
})

export const navigation = defineType({
  name: 'navigation',
  title: 'Menu điều hướng',
  type: 'document',
  fields: [
    defineField({
      name: 'header',
      title: 'Menu đầu trang',
      type: 'array',
      of: [navItem],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Cột chân trang',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({ name: 'title', title: 'Tiêu đề cột', type: 'localeString' }),
            defineField({
              name: 'links',
              title: 'Liên kết',
              type: 'array',
              of: [defineArrayMember({ type: 'link' })],
            }),
          ],
          preview: { select: { title: 'title.vi' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Menu điều hướng' }) },
})
