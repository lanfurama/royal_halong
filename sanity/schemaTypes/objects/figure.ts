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
      description: 'Mô tả nội dung ảnh cho người dùng screen reader. Để trống nếu ảnh chỉ mang tính trang trí (ảnh nền, hoạ tiết). Đừng viết "ảnh khách sạn" — hãy tả thứ đang có trong ảnh.',
    }),
    defineField({ name: 'caption', title: 'Chú thích hiển thị', type: 'localeString' }),
  ],
})
