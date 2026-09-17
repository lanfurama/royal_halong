import { defineType, defineField } from 'sanity'

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
