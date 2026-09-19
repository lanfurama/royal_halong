import { defineType, defineField, defineArrayMember } from 'sanity'

export const imageTextSection = defineType({
  name: 'imageTextSection',
  title: 'Khối ảnh + chữ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'eyebrow', title: 'Chữ nhỏ phía trên', type: 'localeString' }),
    defineField({ name: 'content', title: 'Nội dung', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure', validation: (r) => r.required() }),
    defineField({
      name: 'secondaryImage',
      title: 'Ảnh phụ (đè lên góc ảnh chính)',
      type: 'figure',
      description:
        'Ảnh nhỏ hơn, viền kem, nằm đè lên góc dưới-phải ảnh chính. Khi có ảnh này, ảnh CHÍNH đổi sang khung dọc 4:5 — chọn ảnh dọc cho cả hai. Để trống thì khối giữ đúng một ảnh 4:3 như cũ.',
    }),
    defineField({
      name: 'highlights',
      title: 'Điểm nhấn (danh sách dưới nội dung)',
      type: 'array',
      // Ba mục là nhịp của bản thiết kế; trên bốn thì cột chữ dài hơn cột
      // ảnh bên cạnh và hai cột `items-center` lệch hẳn nhau.
      validation: (r) => r.max(4),
      description:
        'Vài câu ngắn trả lời "vì sao chọn nơi này", mỗi câu một hạt kim cương vàng. Để trống thì không hiện. Đây KHÔNG phải chỗ viết đoạn văn — phần kể chuyện thuộc về ô Nội dung ở trên.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'highlight',
          fields: [
            defineField({
              name: 'title',
              title: 'Vế in đậm',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'text',
              title: 'Vế giải thích',
              type: 'localeString',
              description: 'Hiện sau một dấu gạch ngang. Để trống thì chỉ có vế in đậm.',
            }),
          ],
          preview: { select: { title: 'title.vi', subtitle: 'text.vi' } },
        }),
      ],
    }),
    defineField({
      name: 'imageSide',
      title: 'Ảnh nằm bên',
      type: 'string',
      options: {
        list: [
          { title: 'Trái', value: 'left' },
          { title: 'Phải', value: 'right' },
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'tone',
      title: 'Nền',
      type: 'string',
      options: {
        list: [
          { title: 'Trắng', value: 'white' },
          { title: 'Kem', value: 'cream' },
          { title: 'Tối', value: 'ink' },
        ],
      },
      initialValue: 'white',
    }),
    defineField({
      name: 'imageFit',
      title: 'Cách đặt ảnh vào khung',
      type: 'string',
      options: {
        list: [
          { title: 'Lấp đầy khung 4:3 (cắt bớt)', value: 'cover' },
          { title: 'Hiện trọn ảnh, giữ đúng tỉ lệ gốc', value: 'contain' },
        ],
        layout: 'radio',
      },
      initialValue: 'cover',
      description:
        'Chọn "hiện trọn ảnh" cho ảnh KHÔNG được phép cắt: mã QR, sơ đồ, bảng hướng dẫn, ảnh dọc. Cắt một mã QR thành 4:3 là làm hỏng hẳn nó.',
    }),
    defineField({ name: 'cta', title: 'Nút', type: 'link' }),
  ],
  preview: { select: { title: 'heading.vi', media: 'image' }, prepare: ({ title, media }) => ({ title: `Ảnh + chữ — ${title ?? ''}`, media }) },
})
