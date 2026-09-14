import { defineType, defineField } from 'sanity'

export const localeText = defineType({
  name: 'localeText',
  title: 'Đoạn văn song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Tiếng Việt',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 3 }),
  ],
  preview: { select: { title: 'vi' } },
})
