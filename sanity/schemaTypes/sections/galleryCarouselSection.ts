import { defineType, defineField } from 'sanity'

export const galleryCarouselSection = defineType({
  name: 'galleryCarouselSection',
  title: 'Carousel thư viện ảnh',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'reference',
      to: [{ type: 'galleryAlbum' }],
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: 'heading.vi', album: 'album.title.vi' }, prepare: ({ title, album }) => ({ title: `Carousel — ${title ?? album ?? ''}` }) },
})
