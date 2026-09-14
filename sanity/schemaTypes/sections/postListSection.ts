import { defineType, defineField } from 'sanity'

export const postListSection = defineType({
  name: 'postListSection',
  title: 'Danh sách bài viết',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'category',
      title: 'Chuyên mục',
      type: 'string',
      options: {
        list: [
          { title: 'Tin tức & Báo chí', value: 'news' },
          { title: 'Thông báo', value: 'announcement' },
          { title: 'Tất cả', value: 'all' },
        ],
        layout: 'radio',
      },
      initialValue: 'news',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'limit',
      title: 'Số bài tối đa',
      type: 'number',
      initialValue: 12,
      validation: (r) => r.min(1).max(50),
    }),
  ],
  preview: {
    select: { title: 'heading.vi', subtitle: 'category' },
    prepare: ({ title, subtitle }) => ({ title: `Bài viết — ${title ?? ''}`, subtitle }),
  },
})
