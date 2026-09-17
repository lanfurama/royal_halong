import { defineType, defineField } from 'sanity'

export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Khối văn bản',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'content', title: 'Nội dung', type: 'localeBlock', validation: (r) => r.required() }),
    defineField({
      name: 'tone',
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
    defineField({
      name: 'collapsible',
      title: 'Gập lại, bấm tiêu đề mới mở',
      type: 'boolean',
      initialValue: false,
      description:
        'Dùng cho nội dung tra cứu dài (luật chơi, bảng trả thưởng). PHẢI có Tiêu đề — tiêu đề chính là chỗ bấm. Các khối gập LIỀN NHAU tự gộp thành một danh sách xếp chồng.',
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Văn bản — ${title ?? '(không tiêu đề)'}` }) },
})
