import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetRateLimit, LIMIT } from '@/lib/rate-limit'

// Hai route handler là ĐIỂM VÀO CÔNG KHAI (client ngoài site gọi được), nhưng
// trước bản này không test nào chạm tới: nhánh JSON hỏng, honeypot, rate limit
// và map mã HTTP đều chưa được kiểm. Mock tầng DB để không cần DATABASE_URL.
const insertSpy = vi.fn(async (_values: unknown) => undefined)
const onConflict = vi.fn(async () => undefined)

vi.mock('@/lib/db', () => ({
  db: {
    insert: () => ({
      values: (v: unknown) => {
        void insertSpy(v)
        return { onConflictDoNothing: onConflict }
      },
    }),
  },
  newsletterSubscribers: { email: 'email' },
  leads: {},
}))

vi.mock('@/lib/mail', () => ({ sendLeadNotification: async () => 'skipped' as const }))

const post = (url: string, body: unknown, ip = '9.9.9.9') =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as never

const validLead = {
  type: 'wedding',
  name: 'Nguyễn Văn A',
  email: 'a@example.com',
  phone: '0904030222',
  locale: 'vi',
}

beforeEach(() => {
  resetRateLimit()
  insertSpy.mockClear()
  onConflict.mockClear()
})

describe('POST /api/leads', () => {
  it('body không phải JSON -> 400, không ghi DB', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const res = await POST(post('http://x/api/leads', 'khong-phai-json'))
    expect(res.status).toBe(400)
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('dữ liệu hợp lệ -> 200 và ok:true', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const res = await POST(post('http://x/api/leads', validLead))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true })
  })

  it('dữ liệu sai -> 400 kèm lỗi từng field', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const res = await POST(post('http://x/api/leads', { ...validLead, email: 'sai' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.errors?.email).toBeTruthy()
  })

  // Đây là lỗi thật đã sửa: mọi lỗi đều bị map thành 400, kể cả bị chặn spam,
  // nên client tự động không có cách nào biết cần lùi bao lâu.
  it('vượt ngưỡng -> 429 kèm Retry-After, KHÔNG phải 400', async () => {
    const { POST } = await import('@/app/api/leads/route')
    for (let i = 0; i < LIMIT; i += 1) {
      await POST(post('http://x/api/leads', validLead, '5.5.5.5'))
    }
    const res = await POST(post('http://x/api/leads', validLead, '5.5.5.5'))
    expect(res.status).toBe(429)
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('honeypot -> 200 nhưng KHÔNG ghi DB', async () => {
    const { POST } = await import('@/app/api/leads/route')
    const res = await POST(post('http://x/api/leads', { ...validLead, ref_2: 'bot inc' }))
    expect(res.status).toBe(200)
    expect(insertSpy).not.toHaveBeenCalled()
  })
})

describe('POST /api/newsletter', () => {
  it('body không phải JSON -> 400', async () => {
    const { POST } = await import('@/app/api/newsletter/route')
    const res = await POST(post('http://x/api/newsletter', '{hong'))
    expect(res.status).toBe(400)
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('email hợp lệ -> 200 và ghi DB một lần', async () => {
    const { POST } = await import('@/app/api/newsletter/route')
    const res = await POST(post('http://x/api/newsletter', { email: 'a@example.com', locale: 'vi' }))
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledOnce()
    expect(onConflict).toHaveBeenCalledOnce()
  })

  it('email sai -> 400, không ghi DB', async () => {
    const { POST } = await import('@/app/api/newsletter/route')
    const res = await POST(post('http://x/api/newsletter', { email: 'sai', locale: 'vi' }))
    expect(res.status).toBe(400)
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('honeypot -> 200 nhưng KHÔNG ghi DB', async () => {
    const { POST } = await import('@/app/api/newsletter/route')
    const res = await POST(
      post('http://x/api/newsletter', { email: 'a@example.com', locale: 'vi', ref_2: 'bot' }),
    )
    expect(res.status).toBe(200)
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('vượt ngưỡng -> 429 kèm Retry-After', async () => {
    const { POST } = await import('@/app/api/newsletter/route')
    for (let i = 0; i < LIMIT; i += 1) {
      await POST(post('http://x/api/newsletter', { email: 'a@example.com', locale: 'vi' }, '7.7.7.7'))
    }
    const res = await POST(
      post('http://x/api/newsletter', { email: 'a@example.com', locale: 'vi' }, '7.7.7.7'),
    )
    expect(res.status).toBe(429)
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
  })
})

// Server Action newsletter bọc try/catch quanh bước ghi DB, route handler thì
// không — thiếu DATABASE_URL hoặc Neon lỗi sẽ ném ra ngoài và Next trả 500 với
// body RỖNG, client không có gì để hiển thị.
describe('POST /api/newsletter — lỗi tầng DB', () => {
  it('ghi DB ném lỗi -> 500 kèm JSON có message, không phải body rỗng', async () => {
    onConflict.mockImplementationOnce(async () => {
      throw new Error('Thiếu DATABASE_URL — xem .env.example')
    })
    const { POST } = await import('@/app/api/newsletter/route')
    const res = await POST(post('http://x/api/newsletter', { email: 'a@example.com', locale: 'vi' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.message).toBeTruthy()
  })
})
