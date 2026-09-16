'use server'

import { headers } from 'next/headers'
import { newsletterSchema, isHoneypotFilled, errorMessage } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import type { Locale } from '@/lib/i18n'
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
} as const

export async function submitNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const locale: Locale = raw.locale === 'en' ? 'en' : 'vi'
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
