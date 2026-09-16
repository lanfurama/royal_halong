'use client'

import { useActionState } from 'react'
import { submitNewsletter } from '@/app/actions/newsletter'
import type { FormState } from '@/app/actions/lead'
import { BUTTON_BASE_CLASSES } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'

const INITIAL: FormState = { status: 'idle' }

export function NewsletterForm({ lang }: { lang: Locale }) {
  const [state, formAction, pending] = useActionState(submitNewsletter, INITIAL)
  const placeholder = ui('emailPlaceholder', lang)
  const submit = ui('subscribe', lang)

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
        // Nền chân trang giờ là `gold-deep` (#8f6a1c) chứ không còn `gold`
        // sáng — ô nhập nền kem sáng (`cream-soft`) để nổi hẳn lên, chữ nhập
        // vào là `ink` như mọi ô nhập khác của site. Viền focus phải đạt 3:1
        // với nền NGAY DƯỚI nó (nền ô, màu kem) chứ không phải nền chân
        // trang -> `outline-ink`.
        className="border-cream-hi/40 bg-cream-soft text-ink focus:border-ink focus:outline-ink min-h-11 min-w-0 flex-1 border px-3.5 py-2 text-sm focus:outline-2 focus:outline-offset-1"
      />
      {/*
        Nền chân trang là `gold-deep` (xem Footer.tsx) — một nút cũng màu vàng
        sẽ chìm vào nền. Bản thiết kế dùng đúng cặp đảo ngược này cho nút
        "Khám phá": nền kem sáng, chữ vàng đậm (4.59:1). Viền focus phải đạt
        3:1 với nền NGAY DƯỚI nó (nền nút, màu kem) chứ không phải nền chân
        trang -> `outline-ink`.
      */}
      <button
        type="submit"
        disabled={pending}
        // `inline-flex min-h-11` — nút này đo được 38px cao trên bản
        // production, dưới ngưỡng 44px, và nó nằm ngay cạnh ô email trong
        // một hàng `flex` chật ở 390px.
        className={`${BUTTON_BASE_CLASSES} bg-cream-hi text-gold-deep hover:bg-gold-soft focus-visible:outline-ink inline-flex min-h-11 items-center justify-center px-6 py-2 disabled:opacity-60`}
      >
        {pending ? ui('sending', lang) : submit}
      </button>

      {state.status === 'error' && state.message && (
        <p id="newsletter-email-error" role="alert" className="text-cream-hi w-full text-xs font-medium">
          {state.message}
        </p>
      )}
    </form>
  )
}
