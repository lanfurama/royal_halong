import { defineType, defineField, defineArrayMember } from 'sanity'

export const roomListSection = defineType({
  name: 'roomListSection',
  title: 'Danh sách loại phòng',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'rooms',
      title: 'Phòng',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'room' }] })],
      description: 'Để trống thì hiển thị tất cả loại phòng theo thứ tự.',
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Danh sách phòng — ${title ?? ''}` }) },
})
