import { defineType, defineField, defineArrayMember } from 'sanity'

export const faqSection = defineType({
  name: 'faqSection',
  title: 'Câu hỏi thường gặp',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'items',
      title: 'Câu hỏi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Câu hỏi', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'answer', title: 'Trả lời', type: 'localeBlock', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'question.vi' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `FAQ — ${title ?? ''}` }) },
})
