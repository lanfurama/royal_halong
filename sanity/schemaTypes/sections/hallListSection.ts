import { defineType, defineField, defineArrayMember } from 'sanity'

export const hallListSection = defineType({
  name: 'hallListSection',
  title: 'Danh sách phòng hội nghị',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'eyebrow',
      title: 'Nhãn nhỏ',
      type: 'localeString',
      description: 'Chỉ hiện ở kiểu "Lưới thẻ".',
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'localeText',
      description: 'Chỉ hiện ở kiểu "Lưới thẻ".',
    }),
    defineField({
      name: 'layout',
      title: 'Kiểu bày',
      type: 'string',
      options: {
        list: [
          { title: 'Xếp dọc — ảnh và mô tả dài, so le trái phải', value: 'stack' },
          { title: 'Lưới thẻ — ảnh trên, thông số dưới', value: 'cards' },
        ],
        layout: 'radio',
      },
      initialValue: 'stack',
      description:
        'Kiểu "Lưới thẻ" KHÔNG hiện phần Mô tả của từng phòng — nó chỉ bày ảnh, diện tích, kích thước và các dòng Thông số của phòng đó. Chọn nó khi khách cần so sánh nhanh vài phòng; chọn "Xếp dọc" khi mỗi phòng cần được giới thiệu kỹ. Khối này phát ra id "khong-gian" ở kiểu Lưới thẻ.',
    }),
    defineField({
      name: 'halls',
      title: 'Phòng hội nghị',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'hall' }] })],
      description: 'Để trống thì hiển thị tất cả.',
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Phòng hội nghị — ${title ?? ''}` }) },
})
