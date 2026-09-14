import { defineType, defineField } from 'sanity'

export const leadFormSection = defineType({
  name: 'leadFormSection',
  title: 'Form liên hệ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
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
  preview: { select: { title: 'heading.vi', subtitle: 'formType' } },
})
