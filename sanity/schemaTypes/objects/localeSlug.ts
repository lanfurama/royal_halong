import { defineType, defineField } from 'sanity'

export const localeSlug = defineType({
  name: 'localeSlug',
  title: 'Đường dẫn song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Đường dẫn tiếng Việt',
      type: 'slug',
      validation: (r) => r.required(),
      options: { maxLength: 96 },
    }),
    defineField({
      name: 'en',
      title: 'Đường dẫn English',
      type: 'slug',
      options: { maxLength: 96 },
      description: 'Để trống thì dùng chung đường dẫn tiếng Việt.',
    }),
  ],
})
