import { NextResponse, type NextRequest } from 'next/server'
import { newsletterSchema, isHoneypotFilled } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

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

  const { db, newsletterSubscribers } = await import('@/lib/db')
  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email, locale: parsed.data.locale })
    .onConflictDoNothing({ target: newsletterSubscribers.email })

  return NextResponse.json({ ok: true })
}
