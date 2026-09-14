import { defineType, defineField, defineArrayMember } from 'sanity'

export const galleryAlbum = defineType({
  name: 'galleryAlbum',
  title: 'Album ảnh',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tên album', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({
      name: 'images',
      title: 'Ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
      validation: (r) => r.min(1),
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'title.vi', media: 'images.0' },
  },
})
