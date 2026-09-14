import { defineType, defineField } from 'sanity'

export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Khối văn bản',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'content', title: 'Nội dung', type: 'localeBlock', validation: (r) => r.required() }),
    defineField({
      name: 'background',
      title: 'Nền',
      type: 'string',
      options: {
        list: [
          { title: 'Trắng', value: 'white' },
          { title: 'Kem', value: 'cream' },
          { title: 'Tối', value: 'ink' },
        ],
      },
      initialValue: 'white',
    }),
    defineField({ name: 'narrow', title: 'Thu hẹp chiều ngang', type: 'boolean', initialValue: true }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Văn bản — ${title ?? '(không tiêu đề)'}` }) },
})
