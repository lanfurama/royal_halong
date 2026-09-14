import { defineType, defineField, defineArrayMember } from 'sanity'

export const venue = defineType({
  name: 'venue',
  title: 'Nhà hàng & Tiện ích',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Tên', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({
      name: 'kind',
      title: 'Loại',
      type: 'string',
      options: {
        list: [
          { title: 'Ẩm thực', value: 'dining' },
          { title: 'Tiện ích', value: 'facility' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'location', title: 'Địa điểm', type: 'localeString', description: 'Ví dụ: "Tầng 2 Khách sạn"' }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({ name: 'hours', title: 'Giờ mở cửa', type: 'localeString' }),
    defineField({
      name: 'highlights',
      title: 'Món đặc trưng / Điểm nhấn',
      type: 'array',
      of: [defineArrayMember({ type: 'localeString' })],
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh đại diện', type: 'figure' }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({ name: 'menuUrl', title: 'Link menu', type: 'url' }),
    defineField({ name: 'phone', title: 'Điện thoại đặt chỗ', type: 'string' }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'name.vi', subtitle: 'kind', media: 'image' } },
})
