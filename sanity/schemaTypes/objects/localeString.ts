import { defineType, defineField } from 'sanity'

export const localeString = defineType({
  name: 'localeString',
  title: 'Chuỗi song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Tiếng Việt',
      type: 'string',
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: 'en', title: 'English', type: 'string' }),
  ],
  preview: { select: { title: 'vi', subtitle: 'en' } },
})
