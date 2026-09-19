import { defineType, defineField, defineArrayMember } from 'sanity'

export const pageNavSection = defineType({
  name: 'pageNavSection',
  title: 'Mục lục trong trang',
  type: 'object',
  description:
    'Thanh mục lục dính dưới header, dành cho trang dài. Đặt NGAY SAU khối hero — đặt ở giữa trang thì khách chỉ gặp nó sau khi đã cuộn qua phần nó định dẫn tới.',
  fields: [
    defineField({
      name: 'links',
      title: 'Mục',
      type: 'array',
      // Trên 7 mục thì ở 390px dải cuộn ngang dài hơn hai màn hình và thanh
      // mục lục tự nó thành một thứ phải lướt qua — đúng cái nó sinh ra để
      // tránh. Dưới 2 mục thì không có gì để chọn.
      validation: (r) => r.min(2).max(7),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navLink',
          fields: [
            defineField({
              name: 'label',
              title: 'Nhãn',
              type: 'localeString',
              description: 'Một đến hai từ. Nhãn dài làm dải mục lục phải cuộn ở khổ điện thoại.',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'anchor',
              title: 'Neo (id của khối cần nhảy tới)',
              type: 'string',
              description:
                'Viết KHÔNG có dấu # — ví dụ "khong-gian". Phải trùng đúng id mà khối đích phát ra, nếu không bấm vào sẽ không đi đâu cả. Các id hiện có: khong-gian (danh sách sảnh kiểu Lưới thẻ), suc-chua (bảng sức chứa), quy-trinh (khối Các bước), tu-van (biểu mẫu kiểu Hai cột), faq (hỏi đáp kiểu Hai cột). Khối thư viện ảnh tự sinh id theo album: album-<slug-album>.',
              validation: (r) =>
                r
                  .required()
                  .regex(/^[a-z0-9][a-z0-9-]*$/, {
                    name: 'id hợp lệ',
                    invert: false,
                  })
                  .custom((value) =>
                    typeof value === 'string' && value.startsWith('#')
                      ? 'Bỏ dấu # ở đầu — chỉ ghi phần id.'
                      : true,
                  ),
            }),
          ],
          preview: {
            select: { title: 'label.vi', subtitle: 'anchor' },
            prepare: ({ title, subtitle }) => ({ title: title ?? '', subtitle: `#${subtitle ?? ''}` }),
          },
        }),
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Nút bên phải',
      type: 'link',
      description:
        'Hành động chính của cả trang, đi theo khách suốt lúc cuộn. Để trống thì thanh chỉ có mục lục.',
    }),
  ],
  preview: {
    select: { links: 'links' },
    prepare: ({ links }) => ({
      title: 'Mục lục trong trang',
      subtitle: `${(links ?? []).length} mục`,
    }),
  },
})
