import { defineType, defineField } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Cảm nhận khách hàng',
  type: 'document',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề đánh giá', type: 'localeString' }),
    defineField({ name: 'quote', title: 'Nội dung', type: 'localeText', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Người viết', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'source', title: 'Nguồn', type: 'string', initialValue: 'TripAdvisor' }),
    defineField({ name: 'sourceUrl', title: 'Link nguồn', type: 'url' }),
    defineField({
      name: 'rating',
      title: 'Số sao',
      type: 'number',
      validation: (r) => r.min(1).max(5),
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'author', subtitle: 'heading.vi' } },
})
