import { defineType, defineField, defineArrayMember } from 'sanity'

export const hallListSection = defineType({
  name: 'hallListSection',
  title: 'Danh sách phòng hội nghị',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
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
