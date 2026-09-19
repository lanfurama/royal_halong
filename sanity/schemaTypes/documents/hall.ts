import { defineType, defineField, defineArrayMember } from 'sanity'

export const hall = defineType({
  name: 'hall',
  title: 'Phòng hội nghị',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Tên phòng', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({ name: 'areaSqm', title: 'Diện tích (m²)', type: 'number' }),
    defineField({
      name: 'dimensions',
      title: 'Kích thước D × R (m)',
      type: 'localeString',
      description:
        'Ví dụ "32 × 24 m". Là localeString chứ không phải chuỗi thuần vì tiếng Việt viết số thập phân bằng dấu PHẨY ("5,2 × 7 m") còn năm ngôn ngữ còn lại dùng dấu chấm. Hiện ở kiểu bày "Lưới thẻ".',
    }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({
      name: 'layouts',
      title: 'Kiểu bố trí',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'layout',
          fields: [
            defineField({ name: 'style', title: 'Kiểu', type: 'localeString' }),
            defineField({ name: 'seats', title: 'Số chỗ', type: 'number' }),
          ],
          preview: { select: { title: 'style.vi', subtitle: 'seats' } },
        }),
      ],
    }),
    defineField({
      name: 'specs',
      title: 'Thông số hiện trên thẻ',
      type: 'array',
      // Ba dòng là nhịp của bản thiết kế; dòng thứ năm đẩy thẻ cao hơn hai
      // thẻ bên cạnh và lưới mất thẳng hàng ở đáy.
      validation: (r) => r.max(4),
      description:
        'Vài dòng "nhãn — giá trị" hiện trên thẻ ở kiểu bày "Lưới thẻ", nối với nhau bằng nét chấm. Đây KHÔNG phải ô Kiểu bố trí ở trên: ô kia là sáu kiểu kê bàn MICE đầy đủ (dữ liệu tra cứu), còn đây là vài dòng bạn CHỌN cho thẻ, và nó nói được cả thứ không phải kiểu kê bàn — "Chia nhỏ — 2 sảnh 384 m²".',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'hallSpec',
          fields: [
            defineField({
              name: 'label',
              title: 'Nhãn',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'value',
              title: 'Giá trị',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: 'label.vi', subtitle: 'value.vi' },
          },
        }),
      ],
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  orderings: [
    { name: 'order', title: 'Thứ tự', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'name.vi', subtitle: 'capacity.vi', media: 'image' } },
})
