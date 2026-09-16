import { NextResponse, type NextRequest } from 'next/server'
import { handleLead, insertLead } from '@/app/actions/lead'
import { isPlainObject } from '@/lib/validation'
import { sendLeadNotification } from '@/lib/mail'

// KHÔNG khai báo `export const runtime` — Next 16 với `cacheComponents` bật
// (xem next.config.ts) từ chối build nếu route segment config `runtime` có
// mặt, kể cả giá trị 'nodejs' (đã là default): "Route segment config
// 'runtime' is not compatible with nextConfig.cacheComponents. Please remove
// it." Handler này vẫn chạy Node.js runtime (mặc định), chỉ là không còn
// khai báo tường minh được nữa.
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

  if (!isPlainObject(body)) {
    return NextResponse.json(
      { ok: false, message: 'Body phải là một object JSON' },
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

  // Ba loại lỗi, ba mã khác nhau:
  // - rate_limited -> 429 + Retry-After (client lùi rồi thử lại)
  // - failed       -> 500 (lỗi PHÍA SERVER: Neon rớt, DATABASE_URL sai). Trả
  //                   400 như trước là nói với client "dữ liệu của bạn sai,
  //                   đừng thử lại" trong khi dữ liệu hoàn toàn đúng — và lead
  //                   thì đã mất.
  // - invalid      -> 400 (dữ liệu người gửi sai thật)
  const status = result.code === 'rate_limited' ? 429 : result.code === 'failed' ? 500 : 400
  const headers =
    result.code === 'rate_limited' && result.retryAfterSeconds
      ? { 'Retry-After': String(result.retryAfterSeconds) }
      : undefined

  return NextResponse.json(
    { ok: false, message: result.message, errors: result.fieldErrors },
    { status, headers },
  )
}
