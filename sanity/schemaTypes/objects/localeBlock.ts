import { defineType, defineArrayMember, type Rule } from 'sanity'
import { localeFields, TRANSLATION_FIELDSET } from './localeFields'

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
              validation: (r: Rule) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }) },
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
  title: 'Nội dung đa ngữ',
  type: 'object',
  fieldsets: [TRANSLATION_FIELDSET],
  fields: localeFields((_locale, isDefault) => ({
    type: 'array',
    of: blockContent,
    ...(isDefault ? { validation: (r: any) => r.required().min(1) } : {}),
  })),
})
