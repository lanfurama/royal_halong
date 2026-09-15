import { z } from 'zod'
import { t, type LocaleField } from '@/lib/i18n'

/**
 * Ghép thông điệp lỗi song ngữ vi/en thành một chuỗi hiển thị "vi / en", lấy
 * qua t() của lib/i18n.ts để tôn trọng hợp đồng fallback một chiều (en trống
 * -> dùng vi) của module đó thay vì tự đọc field.vi / field.en trực tiếp.
 */
function bilingual(field: LocaleField<string>): string {
  const vi = t(field, 'vi')
  const en = t(field, 'en')
  return [vi, en].filter((value): value is string => Boolean(value)).join(' / ')
}

const messages = {
  nameRequired: bilingual({ vi: 'Vui lòng nhập họ tên', en: 'Please enter your full name' }),
  emailInvalid: bilingual({ vi: 'Email không hợp lệ', en: 'Invalid email address' }),
  phoneRequired: bilingual({
    vi: 'Vui lòng nhập số điện thoại',
    en: 'Please enter your phone number',
  }),
  phoneInvalid: bilingual({ vi: 'Số điện thoại không hợp lệ', en: 'Invalid phone number' }),
  typeInvalid: bilingual({ vi: 'Loại yêu cầu không hợp lệ', en: 'Invalid request type' }),
  guestCountInvalid: bilingual({
    vi: 'Số khách phải là số dương',
    en: 'Guest count must be a positive number',
  }),
  localeInvalid: bilingual({ vi: 'Ngôn ngữ không hợp lệ', en: 'Invalid locale' }),
}

/** Chuỗi rỗng của field tuỳ chọn -> undefined, để không ghi '' vào DB. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional()

/**
 * Email: chuẩn hoá (trim + về chữ thường) trước khi kiểm định định dạng qua
 * z.email() — z.string().email() đã deprecated trong zod v4.
 */
const email = z.string().trim().toLowerCase().pipe(z.email(messages.emailInvalid))

/** Số VN: cho phép +, khoảng trắng, dấu chấm, gạch ngang; tối thiểu 8 chữ số. */
const phone = z
  .string()
  .trim()
  .min(1, messages.phoneRequired)
  .refine((value) => value.replace(/\D/g, '').length >= 8, messages.phoneInvalid)

const locale = z.enum(['vi', 'en'], messages.localeInvalid)

/**
 * guestCount: chuỗi rỗng (input tuỳ chọn chưa điền trong form thật) -> undefined
 * trước khi ép kiểu số, để không bị coerce thành 0 rồi rớt validate positive().
 */
const guestCount = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce.number().int().positive(messages.guestCountInvalid).optional(),
)

export const leadSchema = z.object({
  type: z.enum(['wedding', 'mice', 'general'], messages.typeInvalid),
  name: z.string().trim().min(1, messages.nameRequired).max(200),
  email,
  phone,
  eventDate: optionalText,
  guestCount,
  message: optionalText,
  sourcePage: optionalText,
  locale: locale.default('vi'),
  /** Trường bẫy bot — người thật không bao giờ điền. */
  company: optionalText,
})

export const newsletterSchema = z.object({
  email,
  locale: locale.default('vi'),
  company: optionalText,
})

export type LeadInput = z.infer<typeof leadSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>

export function isHoneypotFilled(data: { company?: unknown }): boolean {
  return typeof data.company === 'string' && data.company.trim() !== ''
}
