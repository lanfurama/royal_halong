import { defineType, defineField } from 'sanity'

export const bookingWidgetSection = defineType({
  name: 'bookingWidgetSection',
  title: 'Widget đặt phòng',
  type: 'object',
  fields: [
    defineField({
      name: 'note',
      title: 'Ghi chú nội bộ',
      type: 'string',
      readOnly: true,
      initialValue: 'Widget SecureBookings, id lấy từ Cấu hình site.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Widget đặt phòng (SecureBookings)' }) },
})
