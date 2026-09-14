import { defineType, defineField, defineArrayMember } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Cấu hình site',
  type: 'document',
  groups: [
    { name: 'brand', title: 'Thương hiệu' },
    { name: 'contact', title: 'Liên hệ' },
    { name: 'legal', title: 'Pháp lý' },
    { name: 'booking', title: 'Đặt phòng' },
  ],
  fields: [
    defineField({ name: 'brandName', title: 'Tên thương hiệu', type: 'localeString', group: 'brand', validation: (r) => r.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', group: 'brand' }),
    defineField({ name: 'logoLight', title: 'Logo nền tối', type: 'image', group: 'brand' }),

    defineField({ name: 'tel', title: 'Điện thoại bàn', type: 'string', group: 'contact' }),
    defineField({ name: 'mobile', title: 'Di động', type: 'string', group: 'contact' }),
    defineField({ name: 'hotline', title: 'Hotline', type: 'string', group: 'contact' }),
    defineField({
      name: 'emails',
      title: 'Email',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'contact',
    }),
    defineField({ name: 'addressShort', title: 'Địa chỉ ngắn', type: 'localeString', group: 'contact' }),
    defineField({ name: 'addressFull', title: 'Địa chỉ đầy đủ', type: 'localeText', group: 'contact' }),
    defineField({ name: 'lat', title: 'Vĩ độ', type: 'number', group: 'contact', initialValue: 20.9538 }),
    defineField({ name: 'lng', title: 'Kinh độ', type: 'number', group: 'contact', initialValue: 107.0435 }),
    defineField({ name: 'mapZoom', title: 'Mức phóng bản đồ', type: 'number', group: 'contact', initialValue: 15 }),
    defineField({
      name: 'socials',
      title: 'Mạng xã hội',
      type: 'array',
      group: 'contact',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'social',
          fields: [
            defineField({
              name: 'platform',
              title: 'Nền tảng',
              type: 'string',
              options: { list: ['facebook', 'instagram', 'tripadvisor', 'x', 'youtube'] },
            }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),

    defineField({ name: 'companyName', title: 'Tên công ty', type: 'localeString', group: 'legal' }),
    defineField({ name: 'businessLicense', title: 'GCN ĐKDN', type: 'string', group: 'legal' }),
    defineField({ name: 'licenseIssuer', title: 'Nơi cấp', type: 'localeString', group: 'legal' }),
    defineField({ name: 'licenseDate', title: 'Ngày cấp', type: 'date', group: 'legal' }),
    defineField({ name: 'motBadge', title: 'Badge Bộ Công Thương', type: 'image', group: 'legal' }),
    defineField({ name: 'motBadgeUrl', title: 'Link xác thực badge', type: 'url', group: 'legal' }),
    defineField({ name: 'copyright', title: 'Dòng bản quyền', type: 'localeString', group: 'legal' }),

    defineField({
      name: 'secureBookingsWidgetId',
      title: 'ID widget SecureBookings',
      type: 'string',
      group: 'booking',
      description: 'Lấy từ URL widgetCustomize?...&id=<đây>',
    }),
  ],
  preview: { prepare: () => ({ title: 'Cấu hình site' }) },
})
