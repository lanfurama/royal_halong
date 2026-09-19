import { defineType, defineField, defineArrayMember } from 'sanity'

export const faqSection = defineType({
  name: 'faqSection',
  title: 'Câu hỏi thường gặp',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'eyebrow',
      title: 'Nhãn nhỏ',
      type: 'localeString',
      description: 'Chỉ hiện ở kiểu "Hai cột".',
    }),
    defineField({
      name: 'description',
      title: 'Lời dẫn bên trái',
      type: 'localeBlock',
      description:
        'Chỉ hiện ở kiểu "Hai cột". Chỗ đặt câu "không thấy câu trả lời bạn cần?" kèm số điện thoại — nó đứng yên bên trái suốt lúc khách đọc danh sách câu hỏi.',
    }),
    defineField({
      name: 'layout',
      title: 'Kiểu bày',
      type: 'string',
      options: {
        list: [
          { title: 'Một cột hẹp', value: 'stack' },
          { title: 'Hai cột — tiêu đề trái, câu hỏi phải', value: 'split' },
        ],
        layout: 'radio',
      },
      initialValue: 'stack',
      description: 'Khối này phát ra id "faq" ở kiểu Hai cột.',
    }),
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
