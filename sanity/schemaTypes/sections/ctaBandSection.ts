import { defineType, defineField } from 'sanity'

export const ctaBandSection = defineType({
  name: 'ctaBandSection',
  title: 'Dải kêu gọi hành động',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
    defineField({ name: 'background', title: 'Ảnh nền', type: 'figure', validation: (r) => r.required() }),
    defineField({ name: 'cta', title: 'Nút', type: 'link', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'heading.vi', media: 'background' }, prepare: ({ title, media }) => ({ title: `CTA — ${title ?? ''}`, media }) },
})
