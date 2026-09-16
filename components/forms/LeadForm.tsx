'use client'

import { useActionState } from 'react'
import { submitLead, type FormState } from '@/app/actions/lead'
import { Field } from './Field'
import { BUTTON_BASE_CLASSES, BUTTON_VARIANT_COLORS } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n'

const INITIAL: FormState = { status: 'idle' }

const LABELS = {
  vi: {
    name: 'Họ và tên',
    email: 'Email',
    phone: 'Số điện thoại',
    eventDate: 'Ngày dự kiến',
    guestCount: 'Số khách',
    message: 'Lời nhắn',
    submit: 'Gửi yêu cầu',
    sending: 'Đang gửi...',
  },
  en: {
    name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    eventDate: 'Preferred date',
    guestCount: 'Guests',
    message: 'Message',
    submit: 'Send request',
    sending: 'Sending...',
  },
} as const

/**
 * `<form action={formAction}>` với Server Action: submit được ngay cả khi
 * JS chưa load — `useActionState` chỉ nâng cấp trải nghiệm (thông báo lỗi
 * từng field, trạng thái pending), không phải điều kiện để form chạy.
 */
export function LeadForm({
  formType,
  lang,
  sourcePage,
  successMessage,
}: {
  formType: 'wedding' | 'mice' | 'general'
  lang: Locale
  sourcePage?: string
  successMessage?: string
}) {
  const [state, formAction, pending] = useActionState(submitLead, INITIAL)
  const text = LABELS[lang]
  // Điền lại những gì người dùng vừa gõ. Thiết yếu khi JS chưa load: lúc đó
  // submit là điều hướng thật, trang được dựng lại và mọi ô sẽ rỗng nếu không
  // có `defaultValue`.
  const prev = state.values ?? {}

  if (state.status === 'success') {
    return (
      <p role="status" className="border-gold-deep bg-white border-l-4 p-4 text-sm">
        {successMessage ?? state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="type" value={formType} />
      <input type="hidden" name="locale" value={lang} />
      {sourcePage && <input type="hidden" name="sourcePage" value={sourcePage} />}

      {/*
        Bẫy bot: ẩn khỏi mắt và khỏi screen reader, người thật không bao giờ điền.
        Tên trường KHÔNG được là `company`/`organization`: Chrome bỏ qua
        `autoComplete="off"` với nhóm address/organization và vẫn tự điền, khiến
        lead THẬT bị coi là bot — bị vứt lặng lẽ kèm thông báo thành công giả.
        Dùng tên vô nghĩa để không trình tự-điền nào nhận ra.
      */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="field-ref-2">Ref</label>
        <input id="field-ref-2" name="ref_2" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="name"
          label={text.name}
          required
          autoComplete="name"
          error={state.fieldErrors?.name}
        defaultValue={prev.name ?? ''}
        />
        <Field
          name="phone"
          label={text.phone}
          type="tel"
          required
          autoComplete="tel"
          error={state.fieldErrors?.phone}
        defaultValue={prev.phone ?? ''}
        />
      </div>
      <Field
        name="email"
        label={text.email}
        type="email"
        required
        autoComplete="email"
        error={state.fieldErrors?.email}
        defaultValue={prev.email ?? ''}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="eventDate"
          label={text.eventDate}
          type="date"
          error={state.fieldErrors?.eventDate}
        defaultValue={prev.eventDate ?? ''}
        />
        <Field
          name="guestCount"
          label={text.guestCount}
          type="number"
          min={1}
          error={state.fieldErrors?.guestCount}
        defaultValue={prev.guestCount ?? ''}
        />
      </div>

      <div>
        <label
          htmlFor="field-message"
          className="mb-1 block text-xs font-semibold tracking-widest uppercase"
        >
          {text.message}
        </label>
        <textarea
          id="field-message"
          name="message"
          rows={4}
          defaultValue={prev.message ?? ''}
          className="border-line focus:border-gold-deep focus:outline-gold-deep w-full border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1"
        />
      </div>

      {state.status === 'error' && state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}

      {/*
        Tái dùng đúng MỘT định nghĩa màu solid từ Button.tsx thay vì tự viết
        `focus-visible:outline-gold-deep` trên nền `bg-gold` — đó chính là
        lỗi tương phản 1.30:1 (gần như vô hình) mà comment trong Button.tsx
        đã cảnh báo là "đã đo" ở nơi khác. `Button` chỉ render <Link>, nên
        nút submit thật phải ghép BUTTON_BASE_CLASSES + BUTTON_VARIANT_COLORS
        tay, không import `Button` trực tiếp được.
      */}
      <button
        type="submit"
        disabled={pending}
        className={`${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_COLORS.solid} px-8 py-3 disabled:opacity-60`}
      >
        {pending ? text.sending : text.submit}
      </button>
    </form>
  )
}
