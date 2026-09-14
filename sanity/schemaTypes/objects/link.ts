import { defineType, defineField } from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Liên kết',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Loại',
      type: 'string',
      options: {
        list: [
          { title: 'Trang trong site', value: 'internal' },
          { title: 'Địa chỉ ngoài', value: 'external' },
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'reference',
      title: 'Trang',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'room' }, { type: 'post' }, { type: 'offer' }],
      hidden: ({ parent }) => parent?.kind !== 'internal',
    }),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
      hidden: ({ parent }) => parent?.kind !== 'external',
    }),
    defineField({ name: 'label', title: 'Chữ trên liên kết', type: 'localeString' }),
    defineField({ name: 'blank', title: 'Mở tab mới', type: 'boolean', initialValue: false }),
  ],
})
