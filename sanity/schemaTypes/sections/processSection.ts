import { defineType, defineField, defineArrayMember } from 'sanity'

export const processSection = defineType({
  name: 'processSection',
  title: 'Các bước',
  type: 'object',
  description:
    'Chuỗi bước tuần tự có đánh số — quy trình đặt tiệc, lộ trình đăng ký, thủ tục nhận phòng. Số thứ tự do vị trí trong mảng quyết định, kéo thả để đổi.',
  fields: [
    defineField({ name: 'eyebrow', title: 'Nhãn nhỏ', type: 'localeString' }),
    defineField({
      name: 'heading',
      title: 'Tiêu đề',
      type: 'localeString',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
    defineField({
      name: 'steps',
      title: 'Bước',
      type: 'array',
      // Trên 6 bước thì mỗi bước còn dưới 230px ở 1440px và tiêu đề bước vỡ
      // ba dòng; dưới 2 bước thì nó không phải một quy trình.
      validation: (r) => r.min(2).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({
              name: 'title',
              title: 'Tên bước',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'description',
              title: 'Mô tả',
              type: 'localeText',
              description:
                'Một tới hai câu. Các bước xếp cạnh nhau trên cùng một hàng nên độ dài lệch nhau nhiều sẽ thấy rõ.',
            }),
          ],
          preview: { select: { title: 'title.vi', subtitle: 'description.vi' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'heading.vi', steps: 'steps' },
    prepare: ({ title, steps }) => ({
      title: `Các bước — ${title ?? ''}`,
      subtitle: `${(steps ?? []).length} bước`,
    }),
  },
})
