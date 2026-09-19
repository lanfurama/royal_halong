import { defineType, defineField, defineArrayMember } from 'sanity'

export const leadFormSection = defineType({
  name: 'leadFormSection',
  title: 'Form liên hệ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
    defineField({
      name: 'eyebrow',
      title: 'Nhãn nhỏ',
      type: 'localeString',
      description: 'Chỉ hiện ở kiểu "Hai cột".',
    }),
    defineField({
      name: 'layout',
      title: 'Kiểu bày',
      type: 'string',
      options: {
        list: [
          { title: 'Một cột hẹp', value: 'stack' },
          { title: 'Hai cột — cách liên hệ trái, biểu mẫu phải', value: 'split' },
        ],
        layout: 'radio',
      },
      initialValue: 'stack',
      description: 'Khối này phát ra id "tu-van" ở kiểu Hai cột.',
    }),
    defineField({
      name: 'contacts',
      title: 'Cách liên hệ (cột trái)',
      type: 'array',
      validation: (r) => r.max(5),
      description:
        'Chỉ hiện ở kiểu "Hai cột". Đặt ở đây những đường liên hệ NHANH HƠN biểu mẫu — hotline, Zalo, email. Nhiều cặp đôi gọi trước khi điền form; không có mục này thì số điện thoại chỉ nằm trong một câu trả lời của khối Hỏi đáp.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'contactItem',
          fields: [
            defineField({
              name: 'label',
              title: 'Nhãn',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'value',
              title: 'Giá trị hiển thị',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'href',
              title: 'Liên kết',
              type: 'string',
              description:
                'Ví dụ "tel:+842033848777" hoặc "mailto:info@royalhalonghotel.com". Để TRỐNG với những mục không bấm được (địa chỉ) — khi đó giá trị hiện dưới dạng chữ thường.',
            }),
          ],
          preview: { select: { title: 'label.vi', subtitle: 'value.vi' } },
        }),
      ],
    }),
    defineField({
      name: 'formType',
      title: 'Loại form',
      type: 'string',
      options: {
        list: [
          { title: 'Tiệc cưới', value: 'wedding' },
          { title: 'Hội nghị / MICE', value: 'mice' },
          { title: 'Liên hệ chung', value: 'general' },
        ],
        layout: 'radio',
      },
      initialValue: 'general',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'successMessage', title: 'Thông báo khi gửi thành công', type: 'localeText' }),
  ],
  preview: {
    select: { title: 'heading.vi', subtitle: 'formType' },
    prepare: ({ title, subtitle }) => ({ title: `Form liên hệ — ${title ?? ''}`, subtitle }),
  },
})
