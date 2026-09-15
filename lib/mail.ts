import type { LeadInput } from './validation'

const LABEL: Record<LeadInput['type'], string> = {
  wedding: 'Tiệc cưới',
  mice: 'Hội nghị / MICE',
  general: 'Liên hệ chung',
}

/**
 * Gửi mail thông báo lead. Thiếu RESEND_API_KEY (hoặc LEAD_NOTIFY_EMAIL) thì
 * bỏ qua — có chủ ý, để deploy được trước khi chốt nhà cung cấp mail. Lead
 * vẫn nằm trong DB dù hàm này trả 'skipped' hay im lặng thất bại: đây chỉ là
 * thông báo phụ, KHÔNG phải nguồn sự thật.
 *
 * Không throw trong mọi trường hợp — không chỉ vì `resend` SDK (đọc
 * `node_modules/resend/dist/index.mjs`, hàm `fetchRequest`) tự bắt lỗi mạng
 * và lỗi API rồi trả về `{ data: null, error }` thay vì reject/throw, mà
 * chính hàm này cũng chủ động không để lỗi thoát ra ngoài (try/catch bên
 * dưới) — phòng khi SDK đổi hành vi ở version khác.
 *
 * Giới hạn đã biết: chữ ký hàm chỉ có 'sent' | 'skipped', không có 'failed'.
 * `resend.emails.send()` không throw khi Resend trả lỗi (vd. domain chưa
 * verify, sai định dạng from, vượt quota) mà trả về `{ error }` — nhánh đó
 * được coi là 'skipped' (không phải 'sent', vì mail KHÔNG thực sự gửi được)
 * và log qua console.error để còn thấy trong log Vercel. Người gọi không
 * phân biệt được "chưa cấu hình" với "cấu hình rồi nhưng Resend từ chối" —
 * chấp nhận được vì đây là thông báo tuỳ chọn, không phải luồng chính (luồng
 * chính là lưu DB, đã xong trước khi hàm này được gọi).
 */
export async function sendLeadNotification(lead: LeadInput): Promise<'sent' | 'skipped'> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.LEAD_NOTIFY_EMAIL
  if (!apiKey || !to) return 'skipped'

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const rows = [
      ['Loại', LABEL[lead.type]],
      ['Họ tên', lead.name],
      ['Email', lead.email],
      ['Điện thoại', lead.phone],
      ['Ngày tổ chức', lead.eventDate ?? '—'],
      ['Số khách', lead.guestCount ? String(lead.guestCount) : '—'],
      ['Trang gửi', lead.sourcePage ?? '—'],
      ['Lời nhắn', lead.message ?? '—'],
    ]

    const { error } = await resend.emails.send({
      from: 'Royal Halong <onboarding@resend.dev>',
      to,
      subject: `[${LABEL[lead.type]}] Liên hệ mới từ ${lead.name}`,
      html: `<table cellpadding="6">${rows
        .map(([key, value]) => `<tr><td><b>${key}</b></td><td>${escapeHtml(value)}</td></tr>`)
        .join('')}</table>`,
    })

    if (error) {
      console.error('[lib/mail] Resend trả lỗi khi gửi thông báo lead:', error)
      return 'skipped'
    }

    return 'sent'
  } catch (error) {
    console.error('[lib/mail] Gửi thông báo lead thất bại (không throw):', error)
    return 'skipped'
  }
}

/** Nội dung do người dùng nhập -> phải escape trước khi nhét vào HTML mail. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
