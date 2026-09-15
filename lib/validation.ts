import { z } from 'zod'
import { t, type Locale, type LocaleField } from '@/lib/i18n'

/**
 * Thông điệp lỗi KHÔNG phải chuỗi hiển thị, mà là KHOÁ ổn định.
 *
 * Bản đầu ghép hai ngôn ngữ vào một chuỗi ("vi / en") rồi đưa thẳng cho zod.
 * Cách đó làm khách Việt luôn thấy thừa một câu tiếng Anh, còn khách Anh thì
 * thấy tiếng Việt đứng trước — không phải song ngữ mà là lỗi hiển thị, và
 * không thể sửa ở tầng UI vì thông điệp đã bị đóng cứng thành chuỗi.
 *
 * Zod chỉ nhận message kiểu string, nên ta cho nó cái KHOÁ; phần dịch nằm ở
 * ERROR_MESSAGES và được phân giải bằng t() ĐÚNG ngôn ngữ người xem tại nơi
 * render (Server Action biết `locale` từ formData trước khi parse).
 */
export const ERROR_MESSAGES = {
  name_required: { vi: 'Vui lòng nhập họ tên', en: 'Please enter your full name' },
  email_invalid: { vi: 'Email không hợp lệ', en: 'Invalid email address' },
  phone_required: { vi: 'Vui lòng nhập số điện thoại', en: 'Please enter your phone number' },
  phone_invalid: { vi: 'Số điện thoại không hợp lệ', en: 'Invalid phone number' },
  type_invalid: { vi: 'Loại yêu cầu không hợp lệ', en: 'Invalid request type' },
  guest_count_invalid: {
    vi: 'Số khách phải là số dương',
    en: 'Guest count must be a positive number',
  },
  locale_invalid: { vi: 'Ngôn ngữ không hợp lệ', en: 'Invalid locale' },
} as const satisfies Record<string, LocaleField<string>>

export type ErrorKey = keyof typeof ERROR_MESSAGES

/**
 * Khoá lỗi -> câu hiển thị theo ngôn ngữ người xem. Khoá lạ (zod tự sinh
 * message riêng, ví dụ `max(200)`) trả về chính nó thay vì chuỗi rỗng — thà
 * hiện một chuỗi kỹ thuật còn hơn hiện ô lỗi trống không giải thích gì.
 */
export function errorMessage(key: string, lang: Locale): string {
  const entry = (ERROR_MESSAGES as Record<string, LocaleField<string>>)[key]
  if (!entry) return key
  return t(entry, lang) ?? key
}

const messages = {
  nameRequired: 'name_required',
  emailInvalid: 'email_invalid',
  phoneRequired: 'phone_required',
  phoneInvalid: 'phone_invalid',
  typeInvalid: 'type_invalid',
  guestCountInvalid: 'guest_count_invalid',
  localeInvalid: 'locale_invalid',
} as const satisfies Record<string, ErrorKey>

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
