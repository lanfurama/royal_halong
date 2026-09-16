'use server'

import { headers } from 'next/headers'
import { newsletterSchema, isHoneypotFilled, errorMessage } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import type { FormState } from './lead'

const MESSAGES = {
  vi: {
    success: 'Đăng ký thành công. Cảm ơn bạn!',
    invalid: 'Email không hợp lệ.',
    rateLimited: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ít phút.',
    failed: 'Không đăng ký được. Vui lòng thử lại.',
  },
  en: {
    success: 'Subscribed. Thank you!',
    invalid: 'Invalid email address.',
    rateLimited: 'Too many attempts. Please try again in a few minutes.',
    failed: 'Could not subscribe. Please try again.',
  },
  zh: {
    success: '订阅成功，谢谢您！',
    invalid: '邮箱地址无效。',
    rateLimited: '尝试次数过多，请稍后再试。',
    failed: '订阅失败，请重试。',
  },
  ko: {
    success: '구독이 완료되었습니다. 감사합니다!',
    invalid: '유효하지 않은 이메일 주소입니다.',
    rateLimited: '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    failed: '구독하지 못했습니다. 다시 시도해 주세요.',
  },
  ja: {
    success: '登録が完了しました。ありがとうございます。',
    invalid: 'メールアドレスが正しくありません。',
    rateLimited: '試行回数が多すぎます。しばらくしてからもう一度お試しください。',
    failed: '登録できませんでした。もう一度お試しください。',
  },
  th: {
    success: 'สมัครรับข่าวสารเรียบร้อยแล้ว ขอบคุณค่ะ',
    invalid: 'อีเมลไม่ถูกต้อง',
    rateLimited: 'พยายามหลายครั้งเกินไป กรุณาลองใหม่อีกครั้งในอีกสักครู่',
    failed: 'ไม่สามารถสมัครได้ กรุณาลองใหม่อีกครั้ง',
  },
  // `satisfies Record<Locale, ...>` là lưới an toàn: thêm ngôn ngữ thứ bảy
  // vào `LOCALES` mà quên bảng này thì hỏng BIÊN DỊCH ngay, thay vì gửi về
  // người dùng một `undefined` ở đúng lúc form báo lỗi.
} as const satisfies Record<Locale, Record<string, string>>

export async function submitNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  // Nhận ĐỦ sáu locale. Biểu thức cũ (`=== 'en' ? 'en' : 'vi'`) quy mọi
  // giá trị lạ về 'vi' — sau khi site có 6 ngôn ngữ thì lead gửi từ trang
  // tiếng Hàn sẽ được ghi là tiếng Việt và email xác nhận gửi sai ngôn ngữ.
  // `isLocale()` là bộ lọc thật; giá trị không hợp lệ vẫn rơi về mặc định.
  const rawLocale = raw.locale
  const locale: Locale = typeof rawLocale === 'string' && isLocale(rawLocale)
    ? rawLocale
    : DEFAULT_LOCALE
  const text = MESSAGES[locale]

  if (isHoneypotFilled(raw)) {
    return { status: 'success', message: text.success }
  }

  const headerList = await headers()
  const clientKey = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(clientKey).allowed) {
    return { status: 'error', message: text.rateLimited }
  }

  const parsed = newsletterSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      // Khoá zod -> câu hiển thị đúng ngôn ngữ người gửi, không trả khoá thô.
      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = errorMessage(issue.message, locale)
      }
    }
    return { status: 'error', message: text.invalid, fieldErrors }
  }

  try {
    const { db, newsletterSubscribers } = await import('@/lib/db')
    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data.email, locale: parsed.data.locale })
      // Đăng ký lại cùng email không phải lỗi — coi như thành công.
      .onConflictDoNothing({ target: newsletterSubscribers.email })
  } catch (error) {
    console.error('Ghi newsletter thất bại:', error)
    return { status: 'error', message: text.failed }
  }

  return { status: 'success', message: text.success }
}
