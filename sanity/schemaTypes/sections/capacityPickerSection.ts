import { defineType, defineField, defineArrayMember } from 'sanity'

/** Sáu cột của bảng. Thứ tự ở đây KHỚP `COLUMNS` trong
 * `components/sections/CapacityPickerSection.tsx` — đổi một bên mà quên bên
 * kia là tiêu đề cột trượt khỏi con số bên dưới. */
const HEADER_FIELDS = [
  ['name', 'Cột 1 — Tên sảnh'],
  ['area', 'Cột 2 — Diện tích'],
  ['banquet', 'Cột 3 — Tiệc ngồi'],
  ['cocktail', 'Cột 4 — Tiệc đứng'],
  ['theatre', 'Cột 5 — Nhà hát'],
  ['classroom', 'Cột 6 — Lớp học'],
] as const

export const capacityPickerSection = defineType({
  name: 'capacityPickerSection',
  title: 'Bảng sức chứa có thanh trượt',
  type: 'object',
  description:
    'Bảng sức chứa kèm thanh trượt số khách: kéo tới số khách dự kiến, những sảnh còn nhận được sẽ sáng lên. Khối này phát ra id "suc-chua" cho mục lục trong trang.',
  groups: [
    { name: 'content', title: 'Nội dung', default: true },
    { name: 'table', title: 'Bảng' },
  ],
  fields: [
    defineField({ name: 'eyebrow', title: 'Nhãn nhỏ', type: 'localeString', group: 'content' }),
    defineField({
      name: 'heading',
      title: 'Tiêu đề',
      type: 'localeString',
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'localeText',
      group: 'content',
      description: 'Một câu nói cho khách biết thanh trượt dùng để làm gì.',
    }),
    defineField({
      name: 'defaultGuests',
      title: 'Số khách mặc định',
      type: 'number',
      group: 'content',
      description:
        'Vị trí thanh trượt lúc trang mới mở. Để trống thì lấy khoảng giữa. Chọn con số ĐIỂN HÌNH của khách hàng chứ không phải số lớn nhất — đây là thứ đầu tiên khách nhìn thấy.',
    }),
    defineField({
      name: 'caption',
      title: 'Chú thích bảng',
      type: 'localeString',
      group: 'table',
      description:
        'Cũng là tên truy cập của vùng cuộn ngang, cho người dùng screen reader ở khổ điện thoại.',
    }),
    defineField({
      name: 'headers',
      title: 'Tiêu đề cột',
      type: 'object',
      group: 'table',
      options: { collapsible: true, collapsed: true },
      fields: HEADER_FIELDS.map(([name, title]) =>
        defineField({ name, title, type: 'localeString', validation: (r) => r.required() }),
      ),
    }),
    defineField({
      name: 'rows',
      title: 'Hàng',
      type: 'array',
      group: 'table',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'capacityRow',
          fields: [
            defineField({
              name: 'name',
              title: 'Tên sảnh',
              type: 'localeString',
              validation: (r) => r.required(),
            }),
            defineField({ name: 'area', title: 'Diện tích (m²)', type: 'number' }),
            // Bốn field dưới đây là SỐ, không phải chuỗi — và đó là cả điểm
            // của khối này. Thanh trượt phải so được "sảnh này có chứa nổi
            // 420 khách không"; nếu sức chứa là chuỗi đã định dạng thì phải
            // phân tích ngược "1.000" / "1,000" / "1,000 位" về số, mà quy
            // tắc phân tách hàng nghìn khác nhau ở sáu ngôn ngữ. Ở đây số
            // chỉ đi MỘT chiều: lưu là số, định dạng lúc render.
            defineField({
              name: 'banquet',
              title: 'Tiệc ngồi (số khách)',
              type: 'number',
              description: 'Để TRỐNG nếu sảnh không kê được kiểu này — ô sẽ hiện dấu gạch ngang.',
            }),
            defineField({ name: 'cocktail', title: 'Tiệc đứng (số khách)', type: 'number' }),
            defineField({ name: 'theatre', title: 'Nhà hát (số chỗ)', type: 'number' }),
            defineField({ name: 'classroom', title: 'Lớp học (số chỗ)', type: 'number' }),
          ],
          preview: {
            select: { title: 'name.vi', area: 'area', banquet: 'banquet' },
            prepare: ({ title, area, banquet }) => ({
              title: title ?? '',
              subtitle: [area ? `${area} m²` : null, banquet ? `${banquet} khách tiệc ngồi` : null]
                .filter(Boolean)
                .join(' · '),
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'heading.vi', rows: 'rows' },
    prepare: ({ title, rows }) => ({
      title: `Sức chứa — ${title ?? ''}`,
      subtitle: `${(rows ?? []).length} hàng`,
    }),
  },
})
