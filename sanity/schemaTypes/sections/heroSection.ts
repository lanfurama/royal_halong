import { defineType, defineField, defineArrayMember } from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Khối hero',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Tiêu đề phụ', type: 'localeString' }),
    defineField({ name: 'background', title: 'Ảnh nền', type: 'figure', validation: (r) => r.required() }),
    defineField({
      name: 'facts',
      title: 'Dải số liệu dưới đáy hero',
      type: 'array',
      validation: (r) => r.max(4),
      description:
        'Tối đa 4 con số neo ở đáy ảnh hero — thứ khách cần biết NGAY trước khi đọc bất cứ dòng nào (giờ mở cửa, điều kiện vào cửa, quy mô). Để trống thì không có dải nào.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fact',
          fields: [
            defineField({
              name: 'value',
              title: 'Con số',
              type: 'localeString',
              description: 'Ngắn: "24/7", "18", "18+". Đây là phần chữ lớn.',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'label',
              title: 'Nhãn',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { value: 'value.vi', label: 'label.vi' },
            prepare: ({ value, label }) => ({ title: `${value ?? ''} — ${label ?? ''}` }),
          },
        }),
      ],
    }),
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
