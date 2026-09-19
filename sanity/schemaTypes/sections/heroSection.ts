import { defineType, defineField, defineArrayMember } from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Khối hero',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'eyebrow',
      title: 'Nhãn nhỏ (trên tiêu đề)',
      type: 'localeString',
      description:
        'Dòng chữ hoa rất nhỏ đứng trên tiêu đề — tên khách sạn, tên thương hiệu. Để trống thì không hiện.',
    }),
    defineField({
      name: 'subheading',
      title: 'Tiêu đề phụ',
      type: 'localeString',
      description:
        'Ở kiểu "Mặc định" nó nằm DƯỚI tiêu đề; ở kiểu "Thiệp mời" nó nằm dưới nét ngăn, giữa khung.',
    }),
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
      name: 'secondaryCta',
      title: 'Nút phụ',
      type: 'link',
      description:
        'Nút viền, đứng cạnh nút chính. Dùng cho đường đi thứ hai — gọi điện chẳng hạn. Để trống thì chỉ có một nút.',
    }),
    defineField({
      name: 'variant',
      title: 'Kiểu hero',
      type: 'string',
      options: {
        list: [
          { title: 'Mặc định — khối chữ căn trái', value: 'standard' },
          { title: 'Thiệp mời — khung kẻ đôi căn giữa', value: 'invitation' },
        ],
      },
      initialValue: 'standard',
      description:
        'Kiểu "Thiệp mời" đặt tiêu đề trong một khung kẻ đôi có hạt kim cương ở góc, căn giữa ảnh — dành cho trang tiệc cưới. Các trang còn lại giữ "Mặc định".',
    }),
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
