'use client'

import { useActionState } from 'react'
import { submitNewsletter } from '@/app/actions/newsletter'
import type { FormState } from '@/app/actions/lead'
import { BUTTON_BASE_CLASSES } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n'

const INITIAL: FormState = { status: 'idle' }

export function NewsletterForm({ lang }: { lang: Locale }) {
  const [state, formAction, pending] = useActionState(submitNewsletter, INITIAL)
  const placeholder = lang === 'vi' ? 'Email của bạn' : 'Your email'
  const submit = lang === 'vi' ? 'Đăng ký' : 'Subscribe'

  if (state.status === 'success') {
    return (
      <p role="status" className="text-sm">
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap gap-2" noValidate>
      <input type="hidden" name="locale" value={lang} />
      {/* Bẫy bot — xem ghi chú tên trường trong LeadForm.tsx. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="newsletter-ref-2">Ref</label>
        <input id="newsletter-ref-2" name="ref_2" tabIndex={-1} autoComplete="off" />
      </div>

      <label htmlFor="newsletter-email" className="sr-only">
        {placeholder}
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder={placeholder}
        aria-invalid={state.fieldErrors?.email ? 'true' : undefined}
        aria-describedby={state.fieldErrors?.email ? 'newsletter-email-error' : undefined}
        className="border-line focus:border-ink focus:outline-ink min-w-0 flex-1 border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1"
      />
      {/*
        Nền footer là `bg-gold` (xem Footer.tsx) — một nút `solid` (cũng nền
        gold) sẽ gần như biến mất vào nền. Dùng `bg-ink`/`text-white` để nổi
        bật, kèm `focus-visible:outline-white` vì viền focus phải đạt 3:1 với
        chính nền NGAY DƯỚI nó (nền nút, màu ink) chứ không phải nền footer —
        outline trắng trên ink gần 21:1, thừa xa ngưỡng.
      */}
      <button
        type="submit"
        disabled={pending}
        className={`${BUTTON_BASE_CLASSES} bg-ink text-white hover:bg-ink/80 focus-visible:outline-white px-6 py-2 disabled:opacity-60`}
      >
        {pending ? (lang === 'vi' ? 'Đang gửi...' : 'Sending...') : submit}
      </button>

      {state.status === 'error' && state.message && (
        <p id="newsletter-email-error" role="alert" className="w-full text-xs text-red-950">
          {state.message}
        </p>
      )}
    </form>
  )
}
