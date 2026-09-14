import { defineType, defineField } from 'sanity'

export const offer = defineType({
  name: 'offer',
  title: 'Chương trình ưu đãi',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tên chương trình', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({ name: 'excerpt', title: 'Tóm tắt', type: 'localeText' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
    defineField({ name: 'body', title: 'Nội dung', type: 'localeBlock' }),
    defineField({
      name: 'priceNote',
      title: 'Ghi chú giá',
      type: 'localeString',
      description: 'Ví dụ: "CHỈ TỪ 500.000VNĐ/KHÁCH"',
    }),
    defineField({ name: 'validFrom', title: 'Bắt đầu', type: 'date' }),
    defineField({ name: 'validTo', title: 'Kết thúc', type: 'date' }),
    defineField({ name: 'cta', title: 'Nút hành động', type: 'link' }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [
    { name: 'order', title: 'Thứ tự', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'title.vi', subtitle: 'priceNote.vi', media: 'image' } },
})
