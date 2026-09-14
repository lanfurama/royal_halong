import { defineType, defineField, defineArrayMember } from 'sanity'

const blockContent = [
  defineArrayMember({
    type: 'block',
    styles: [
      { title: 'Thường', value: 'normal' },
      { title: 'Tiêu đề 2', value: 'h2' },
      { title: 'Tiêu đề 3', value: 'h3' },
      { title: 'Tiêu đề 4', value: 'h4' },
      { title: 'Trích dẫn', value: 'blockquote' },
    ],
    lists: [
      { title: 'Gạch đầu dòng', value: 'bullet' },
      { title: 'Đánh số', value: 'number' },
    ],
    marks: {
      decorators: [
        { title: 'Đậm', value: 'strong' },
        { title: 'Nghiêng', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Liên kết',
          fields: [
            { name: 'href', type: 'url', title: 'URL',
              validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }) },
            { name: 'blank', type: 'boolean', title: 'Mở tab mới' },
          ],
        },
      ],
    },
  }),
  defineArrayMember({ type: 'figure' }),
]

export const localeBlock = defineType({
  name: 'localeBlock',
  title: 'Nội dung song ngữ',
  type: 'object',
  fields: [
    defineField({ name: 'vi', title: 'Tiếng Việt', type: 'array', of: blockContent }),
    defineField({ name: 'en', title: 'English', type: 'array', of: blockContent }),
  ],
})
