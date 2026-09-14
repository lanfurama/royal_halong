import { defineType, defineField } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Bài viết',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({
      name: 'category',
      title: 'Chuyên mục',
      type: 'string',
      options: {
        list: [
          { title: 'Tin tức & Báo chí', value: 'news' },
          { title: 'Thông báo', value: 'announcement' },
        ],
        layout: 'radio',
      },
      initialValue: 'news',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Ngày đăng', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'excerpt', title: 'Tóm tắt', type: 'localeText' }),
    defineField({ name: 'coverImage', title: 'Ảnh bìa', type: 'figure' }),
    defineField({ name: 'body', title: 'Nội dung', type: 'localeBlock' }),
    defineField({ name: 'author', title: 'Tác giả', type: 'string' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [
    { name: 'newest', title: 'Mới nhất', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: { select: { title: 'title.vi', subtitle: 'publishedAt', media: 'coverImage' } },
})
