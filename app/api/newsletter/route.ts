import { NextResponse, type NextRequest } from 'next/server'
import { newsletterSchema, isHoneypotFilled } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

// KHÔNG khai báo `export const runtime` — xem giải thích trong
// app/api/leads/route.ts (cacheComponents từ chối build nếu có).
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

  if (isHoneypotFilled(body as { company?: unknown })) {
    return NextResponse.json({ ok: true })
  }
  const limit = rateLimit(clientKey)
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Quá nhiều yêu cầu' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    )
  }

  const parsed = newsletterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Email không hợp lệ' }, { status: 400 })
  }

  // Server Action tương ứng (`app/actions/newsletter.ts`) đã bọc try/catch
  // quanh bước ghi DB, route này thì chưa: thiếu `DATABASE_URL` hoặc Neon lỗi
  // sẽ ném ra ngoài và Next trả 500 với body RỖNG — client gọi API không có
  // gì để hiển thị, cũng không phân biệt được với lỗi mạng.
  try {
    const { db, newsletterSubscribers } = await import('@/lib/db')
    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data.email, locale: parsed.data.locale })
      .onConflictDoNothing({ target: newsletterSubscribers.email })
  } catch (error) {
    console.error('[api/newsletter] ghi DB thất bại:', error)
    return NextResponse.json(
      { ok: false, message: 'Không lưu được đăng ký. Vui lòng thử lại sau.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
