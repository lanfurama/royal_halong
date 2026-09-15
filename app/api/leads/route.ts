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

  return NextResponse.json(
    { ok: result.status === 'success', message: result.message, errors: result.fieldErrors },
    { status: result.status === 'success' ? 200 : 400 },
  )
}
