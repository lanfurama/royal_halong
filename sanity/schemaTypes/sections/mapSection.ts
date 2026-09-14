import { defineType, defineField } from 'sanity'

export const mapSection = defineType({
  name: 'mapSection',
  title: 'Bản đồ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'overrideCoords',
      title: 'Dùng toạ độ riêng',
      type: 'boolean',
      initialValue: false,
      description: 'Tắt thì lấy toạ độ từ Cấu hình site.',
    }),
    defineField({ name: 'lat', title: 'Vĩ độ', type: 'number', hidden: ({ parent }) => !parent?.overrideCoords }),
    defineField({ name: 'lng', title: 'Kinh độ', type: 'number', hidden: ({ parent }) => !parent?.overrideCoords }),
    defineField({ name: 'zoom', title: 'Mức phóng', type: 'number', initialValue: 15 }),
  ],
  preview: { prepare: () => ({ title: 'Bản đồ' }) },
})
