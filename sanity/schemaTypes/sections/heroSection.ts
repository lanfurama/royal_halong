import { defineType, defineField } from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Khối hero',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Tiêu đề phụ', type: 'localeString' }),
    defineField({ name: 'background', title: 'Ảnh nền', type: 'figure', validation: (r) => r.required() }),
    defineField({ name: 'videoUrl', title: 'Video (tuỳ chọn)', type: 'url' }),
    defineField({ name: 'cta', title: 'Nút', type: 'link' }),
    defineField({
      name: 'height',
      title: 'Chiều cao',
      type: 'string',
      options: {
        list: [
          { title: 'Toàn màn hình', value: 'full' },
          { title: 'Vừa', value: 'medium' },
          { title: 'Thấp', value: 'short' },
        ],
      },
      initialValue: 'medium',
    }),
  ],
  preview: { select: { title: 'heading.vi', media: 'background' }, prepare: ({ title, media }) => ({ title: `Hero — ${title ?? ''}`, media }) },
})
