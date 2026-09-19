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
    defineField({
      name: 'layout',
      title: 'Kiểu bày',
      type: 'string',
      options: {
        list: [
          { title: 'Dải cuộn ngang', value: 'carousel' },
          { title: 'Lưới khảm — 9 ảnh, ảnh đầu lớn gấp bốn', value: 'mosaic' },
        ],
        layout: 'radio',
      },
      initialValue: 'carousel',
      description:
        'Chọn "Lưới khảm" khi trang chỉ có MỘT khối thư viện và nó là điểm dừng chính — khách quét được cả chín ảnh trong một tầm mắt. Giữ "Dải cuộn ngang" khi trang có nhiều album liên tiếp (trang Thư viện): chín lưới khảm chồng nhau là một trang dài hàng chục nghìn pixel. Lưới khảm chỉ lấy 9 ảnh ĐẦU của album — dùng nút bên phải để dẫn sang album đầy đủ.',
    }),
    defineField({
      name: 'tone',
      title: 'Nền',
      type: 'string',
      options: {
        list: [
          { title: 'Kem', value: 'cream' },
          { title: 'Tối', value: 'ink' },
        ],
        layout: 'radio',
      },
      initialValue: 'cream',
      description: 'Nền tối làm ảnh nổi hẳn lên, và chia nhịp một trang dài toàn nền sáng.',
    }),
    defineField({
      name: 'cta',
      title: 'Nút bên phải tiêu đề',
      type: 'link',
      description: 'Chỉ hiện ở kiểu "Lưới khảm" — thường dẫn sang album đầy đủ.',
    }),
  ],
  preview: { select: { title: 'heading.vi', album: 'album.title.vi' }, prepare: ({ title, album }) => ({ title: `Carousel — ${title ?? album ?? ''}` }) },
})
