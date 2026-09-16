import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleLead } from '@/app/actions/lead'
import { resetRateLimit } from '@/lib/rate-limit'

const valid = {
  type: 'wedding',
  name: 'Nguyễn Văn A',
  email: 'a@example.com',
  phone: '0904030222',
  locale: 'vi',
}

beforeEach(() => resetRateLimit())

describe('handleLead()', () => {
  it('lưu lead hợp lệ và báo thành công', async () => {
    const insert = vi.fn(async () => undefined)
    const result = await handleLead(valid, '1.2.3.4', { insert, notify: async () => 'skipped' })
    expect(result.status).toBe('success')
    expect(insert).toHaveBeenCalledOnce()
  })

  it('trả lỗi từng field khi dữ liệu sai, không ghi DB', async () => {
    const insert = vi.fn(async () => undefined)
    const result = await handleLead(
      { ...valid, email: 'sai' },
      '1.2.3.4',
      { insert, notify: async () => 'skipped' },
    )
    expect(result.status).toBe('error')
    expect(result.fieldErrors?.email).toBeTruthy()
    expect(insert).not.toHaveBeenCalled()
  })

  it('honeypot có giá trị: báo thành công giả nhưng KHÔNG ghi DB', async () => {
    const insert = vi.fn(async () => undefined)
    const result = await handleLead(
      { ...valid, ref_2: 'bot inc' },
      '1.2.3.4',
      { insert, notify: async () => 'skipped' },
    )
    expect(result.status).toBe('success')
    expect(insert).not.toHaveBeenCalled()
  })

  it('chặn khi vượt rate limit', async () => {
    const insert = vi.fn(async () => undefined)
    const deps = { insert, notify: async () => 'skipped' as const }
    for (let i = 0; i < 5; i += 1) await handleLead(valid, '9.9.9.9', deps)
    const result = await handleLead(valid, '9.9.9.9', deps)
    expect(result.status).toBe('error')
    expect(result.message).toContain('thử lại')
  })

  it('vẫn thành công khi gửi mail lỗi — lead đã nằm trong DB', async () => {
    const insert = vi.fn(async () => undefined)
    const notify = vi.fn(async () => {
      throw new Error('Resend sập')
    })
    const result = await handleLead(valid, '1.2.3.4', { insert, notify })
    expect(result.status).toBe('success')
    expect(insert).toHaveBeenCalledOnce()
  })

  it('báo lỗi khi ghi DB thất bại', async () => {
    const insert = vi.fn(async () => {
      throw new Error('Neon sập')
    })
    const result = await handleLead(valid, '1.2.3.4', { insert, notify: async () => 'skipped' })
    expect(result.status).toBe('error')
  })
})
