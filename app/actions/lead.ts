'use server'

import { headers } from 'next/headers'
import {
  leadSchema,
  isHoneypotFilled,
  errorMessage,
  type LeadInput,
} from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { echoValues } from '@/lib/form-values'
import { sendLeadNotification } from '@/lib/mail'
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export interface FormState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
  /**
   * Phân biệt LÝ DO lỗi cho tầng gọi. Form trong trang chỉ cần `message`, nhưng
   * Route Handler phải map ra mã HTTP khác nhau: bị chặn spam là 429 (kèm
   * Retry-After) chứ không phải 400 — client tự động không thể lùi đúng nhịp
   * nếu mọi lỗi đều là 400.
   */
  code?: 'rate_limited' | 'invalid' | 'failed'
  /** Giây cần chờ, chỉ có khi `code === 'rate_limited'`. */
  retryAfterSeconds?: number
  /**
   * Giá trị người dùng vừa gửi, trả ngược lại để form điền lại vào ô.
   *
   * Khi JS chưa load, submit là một POST điều hướng THẬT: trình duyệt dựng
   * lại trang từ HTML mới, mọi ô người dùng đã gõ biến mất. Với JS bật thì
   * React giữ DOM nên không lộ — đúng kiểu "đúng trên một ca, hỏng ở ca còn
   * lại". Không bao giờ trả lại trường bẫy bot.
   */
  values?: Record<string, string>
}

interface Deps {
  insert: (lead: LeadInput) => Promise<void>
  notify: (lead: LeadInput) => Promise<'sent' | 'skipped'>
}

const MESSAGES = {
  vi: {
    success: 'Cảm ơn bạn. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.',
    invalid: 'Vui lòng kiểm tra lại thông tin đã nhập.',
    rateLimited: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ít phút.',
    failed: 'Không gửi được. Vui lòng thử lại hoặc gọi hotline.',
  },
  en: {
    success: 'Thank you. We will get back to you shortly.',
    invalid: 'Please check the information you entered.',
    rateLimited: 'Too many submissions. Please try again in a few minutes.',
    failed: 'Could not send. Please try again or call our hotline.',
  },
  zh: {
    success: '感谢您的留言，我们会尽快与您联系。',
    invalid: '请检查您填写的信息。',
    rateLimited: '提交次数过多，请稍后再试。',
    failed: '发送失败，请重试或拨打我们的热线。',
  },
  ko: {
    success: '감사합니다. 최대한 빨리 연락드리겠습니다.',
    invalid: '입력하신 정보를 확인해 주세요.',
    rateLimited: '너무 많이 제출하셨습니다. 잠시 후 다시 시도해 주세요.',
    failed: '전송하지 못했습니다. 다시 시도하시거나 핫라인으로 연락해 주세요.',
  },
  ja: {
    success: 'ありがとうございます。折り返しご連絡いたします。',
    invalid: 'ご入力内容をご確認ください。',
    rateLimited: '送信回数が多すぎます。しばらくしてからもう一度お試しください。',
    failed: '送信できませんでした。もう一度お試しいただくか、ホットラインまでご連絡ください。',
  },
  th: {
    success: 'ขอบคุณค่ะ ทางเราจะติดต่อกลับโดยเร็วที่สุด',
    invalid: 'กรุณาตรวจสอบข้อมูลที่กรอก',
    rateLimited: 'ส่งข้อมูลบ่อยเกินไป กรุณาลองใหม่อีกครั้งในอีกสักครู่',
    failed: 'ส่งไม่สำเร็จ กรุณาลองใหม่หรือโทรหาสายด่วนของเรา',
  },
  // Xem ghi chú cùng nội dung ở `app/actions/newsletter.ts`.
} as const satisfies Record<Locale, Record<string, string>>

/** Logic thuần, không chạm Next runtime — đây là thứ được test. */
export async function handleLead(
  raw: unknown,
  clientKey: string,
  deps: Deps,
): Promise<FormState> {
  // Nhận ĐỦ sáu locale. Biểu thức cũ (`=== 'en' ? 'en' : 'vi'`) quy mọi
  // giá trị lạ về 'vi' — sau khi site có 6 ngôn ngữ thì lead gửi từ trang
  // tiếng Hàn sẽ được ghi là tiếng Việt và email xác nhận gửi sai ngôn ngữ.
  // `isLocale()` là bộ lọc thật; giá trị không hợp lệ vẫn rơi về mặc định.
  const rawLocale = (raw as { locale?: string })?.locale
  const locale: Locale = typeof rawLocale === 'string' && isLocale(rawLocale)
    ? rawLocale
    : DEFAULT_LOCALE
  const text = MESSAGES[locale]

  // Bot điền trường bẫy: trả thành công giả để nó không thử cách khác.
  if (isHoneypotFilled(raw)) {
    return { status: 'success', message: text.success }
  }

  const limit = rateLimit(clientKey)
  if (!limit.allowed) {
    // `retryAfterSeconds` đã được tính sẵn — trước đây bị vứt đi, nên client
    // không có cách nào biết phải chờ bao lâu.
    return {
      status: 'error',
      message: text.rateLimited,
      code: 'rate_limited',
      retryAfterSeconds: limit.retryAfterSeconds,
      values: echoValues(raw),
    }
  }

  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      // `issue.message` là KHOÁ ổn định (vd. `email_invalid`), không phải câu
      // hiển thị — phải đổi qua errorMessage() theo đúng ngôn ngữ người gửi
      // trước khi đưa ra UI, không được trả khoá thô.
      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = errorMessage(issue.message, locale)
      }
    }
    return { status: 'error', message: text.invalid, code: 'invalid', fieldErrors, values: echoValues(raw) }
  }

  try {
    await deps.insert(parsed.data)
  } catch (error) {
    console.error('Ghi lead thất bại:', error)
    return { status: 'error', message: text.failed, code: 'failed', values: echoValues(raw) }
  }

  // Mail hỏng không được làm hỏng kết quả — lead đã nằm an toàn trong DB.
  try {
    await deps.notify(parsed.data)
  } catch (error) {
    console.error('Gửi mail thông báo lead thất bại:', error)
  }

  return { status: 'success', message: text.success }
}

export async function insertLead(lead: LeadInput): Promise<void> {
  const { db, leads } = await import('@/lib/db')
  await db.insert(leads).values({
    type: lead.type,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    eventDate: lead.eventDate ?? null,
    guestCount: lead.guestCount ?? null,
    message: lead.message ?? null,
    sourcePage: lead.sourcePage ?? null,
    locale: lead.locale,
  })
}

/** Server Action gắn vào <form action>. */
export async function submitLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const headerList = await headers()
  const clientKey =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  return handleLead(Object.fromEntries(formData), clientKey, {
    insert: insertLead,
    notify: sendLeadNotification,
  })
}
