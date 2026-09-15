import { NextResponse, type NextRequest } from 'next/server'
import { handleLead, insertLead } from '@/app/actions/lead'
import { sendLeadNotification } from '@/lib/mail'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const clientKey =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Body không phải JSON hợp lệ' },
      { status: 400 },
    )
  }

  const result = await handleLead(body, clientKey, {
    insert: insertLead,
    notify: sendLeadNotification,
  })

  if (result.status === 'success') {
    return NextResponse.json({ ok: true, message: result.message })
  }

  // Bị chặn spam KHÔNG phải lỗi dữ liệu: trả 429 + Retry-After để client tự
  // động lùi đúng nhịp, giống hệt cách /api/newsletter đang làm.
  const status = result.code === 'rate_limited' ? 429 : 400
  const headers =
    result.code === 'rate_limited' && result.retryAfterSeconds
      ? { 'Retry-After': String(result.retryAfterSeconds) }
      : undefined

  return NextResponse.json(
    { ok: false, message: result.message, errors: result.fieldErrors },
    { status, headers },
  )
}
