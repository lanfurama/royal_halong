'use server'

import { headers } from 'next/headers'
import { leadSchema, isHoneypotFilled, errorMessage, type LeadInput } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { sendLeadNotification } from '@/lib/mail'
import type { Locale } from '@/lib/i18n'

export interface FormState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
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
} as const

/** Logic thuần, không chạm Next runtime — đây là thứ được test. */
export async function handleLead(
  raw: unknown,
  clientKey: string,
  deps: Deps,
): Promise<FormState> {
  const locale: Locale = (raw as { locale?: string })?.locale === 'en' ? 'en' : 'vi'
  const text = MESSAGES[locale]

  // Bot điền trường bẫy: trả thành công giả để nó không thử cách khác.
  if (isHoneypotFilled(raw as { company?: unknown })) {
    return { status: 'success', message: text.success }
  }

  const limit = rateLimit(clientKey)
  if (!limit.allowed) {
    return { status: 'error', message: text.rateLimited }
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
    return { status: 'error', message: text.invalid, fieldErrors }
  }

  try {
    await deps.insert(parsed.data)
  } catch (error) {
    console.error('Ghi lead thất bại:', error)
    return { status: 'error', message: text.failed }
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
