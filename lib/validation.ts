import { z } from 'zod'
import { LOCALES, t, type Locale, type LocaleField } from '@/lib/i18n'

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
  event_date_invalid: {
    vi: 'Ngày tổ chức không hợp lệ (định dạng YYYY-MM-DD)',
    en: 'Invalid event date (format YYYY-MM-DD)',
  },
  too_long: { vi: 'Nội dung quá dài', en: 'Content is too long' },
  /** Dự phòng cho mọi lỗi zod tự sinh mà ta chưa đặt khoá riêng. */
  invalid_input: { vi: 'Giá trị không hợp lệ', en: 'Invalid value' },
} as const satisfies Record<string, LocaleField<string>>

export type ErrorKey = keyof typeof ERROR_MESSAGES

/**
 * Khoá lỗi -> câu hiển thị theo ngôn ngữ người xem. Khoá lạ (zod tự sinh
 * message riêng, ví dụ `max(200)`) trả về chính nó thay vì chuỗi rỗng — thà
 * hiện một chuỗi kỹ thuật còn hơn hiện ô lỗi trống không giải thích gì.
 */
export function errorMessage(key: string, lang: Locale): string {
  const entry = (ERROR_MESSAGES as Record<string, LocaleField<string>>)[key]
  // Zod tự sinh message tiếng Anh cho các ràng buộc ta không đặt khoá riêng
  // ("Too big: expected string to have <=200 characters", "Invalid input:
  // expected number, received NaN"). Trả nguyên chuỗi đó ra UI nghĩa là khách
  // Việt đọc được tiếng Anh kỹ thuật — rơi về câu chung đã dịch thay vì vậy.
  if (!entry) return t(ERROR_MESSAGES.invalid_input, lang) ?? key
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
  eventDateInvalid: 'event_date_invalid',
  tooLong: 'too_long',
} as const satisfies Record<string, ErrorKey>

/**
 * Ngày tổ chức phải là ISO `YYYY-MM-DD` và phải là ngày CÓ THẬT.
 *
 * Trước bản này `eventDate` là text tự do đổ thẳng vào cột Postgres kiểu
 * `date`: gửi "20/12/2026" (định dạng người Việt hay gõ, và cũng là thứ trình
 * duyệt không hỗ trợ `<input type="date">` gửi lên) thì zod cho qua, Postgres
 * ném 22007, `handleLead` bắt ở catch và người gửi chỉ thấy "Không gửi được"
 * — LEAD MẤT, không field nào chỉ ra ngày sai.
 */
/**
 * Đúng định dạng `YYYY-MM-DD` VÀ là ngày có thật.
 *
 * Không dùng `Date.parse()` một mình: nó CUỘN ngày tràn thay vì báo lỗi
 * (`2026-02-31` -> 3/3), trong khi Postgres từ chối thẳng — tức lead vẫn mất
 * y như cũ, chỉ hẹp hơn. Cách chắc chắn là dựng lại chuỗi từ đối tượng Date
 * và bắt nó phải khớp nguyên văn đầu vào.
 */
export function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.toISOString().slice(0, 10) === value
}

const eventDate = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional()
  .refine((value) => value === undefined || isRealIsoDate(value), messages.eventDateInvalid)

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
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(320, messages.tooLong)
  .pipe(z.email(messages.emailInvalid))

/** Số VN: cho phép +, khoảng trắng, dấu chấm, gạch ngang; tối thiểu 8 chữ số. */
const phone = z
  .string()
  .trim()
  .min(1, messages.phoneRequired)
  .max(40, messages.tooLong)
  .refine((value) => value.replace(/\D/g, '').length >= 8, messages.phoneInvalid)

// Sinh từ `LOCALES` thay vì liệt kê tay: form gửi `locale` lên server và
// một enum đứng im ở ['vi','en'] sẽ TỪ CHỐI mọi lead gửi từ trang tiếng
// Trung/Hàn/Nhật/Thái — lỗi im lặng, chỉ thấy khi đếm lead thiếu.
const locale = z.enum(LOCALES, messages.localeInvalid)

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
  eventDate,
  guestCount,
  message: optionalText.pipe(z.string().max(5000, messages.tooLong).optional()),
  sourcePage: optionalText.pipe(z.string().max(300, messages.tooLong).optional()),
  locale: locale.default('vi'),
  /** Trường bẫy bot — xem HONEYPOT_FIELD. */
  ref_2: optionalText,
})

export const newsletterSchema = z.object({
  email,
  locale: locale.default('vi'),
  ref_2: optionalText,
})

export type LeadInput = z.infer<typeof leadSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>

/**
 * Tên trường bẫy bot. KHÔNG dùng `company`: Chrome bỏ qua `autoComplete="off"`
 * với nhóm address/organization và vẫn tự điền, khiến lead THẬT bị coi là bot.
 */
export const HONEYPOT_FIELD = 'ref_2'

export function isHoneypotFilled(data: unknown): boolean {
  // `JSON.parse("null")` THÀNH CÔNG, nên body `null` lọt qua try/catch quanh
  // request.json() rồi làm nổ `data.company` -> Next trả 500 body RỖNG. Phải
  // chịu được mọi thứ không phải object.
  if (typeof data !== 'object' || data === null) return false
  const trap = (data as Record<string, unknown>)[HONEYPOT_FIELD]
  const filled = typeof trap === 'string' && trap.trim() !== ''
  if (filled) {
    // Bị chặn thì người gửi nhận thông báo THÀNH CÔNG GIẢ và lead biến mất.
    // Không log thì người vận hành không có cách nào biết mình đang vứt gì.
    console.warn('[honeypot] chặn một lượt gửi (trường bẫy có giá trị)')
  }
  return filled
}

/** Body hợp lệ về HÌNH DẠNG (là object, không phải null/mảng/số/chuỗi). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
