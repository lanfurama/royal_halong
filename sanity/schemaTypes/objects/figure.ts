import { defineType, defineField } from 'sanity'

export const figure = defineType({
  name: 'figure',
  title: 'Ảnh',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Mô tả ảnh (alt)',
      type: 'localeString',
      description: 'Bắt buộc cho accessibility. Mô tả nội dung ảnh, không phải "ảnh khách sạn".',
    }),
    defineField({ name: 'caption', title: 'Chú thích hiển thị', type: 'localeString' }),
  ],
})
