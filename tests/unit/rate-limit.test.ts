import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, resetRateLimit, LIMIT, WINDOW_MS } from '@/lib/rate-limit'

beforeEach(() => resetRateLimit())

describe('rateLimit()', () => {
  it('cho qua trong hạn mức', () => {
    for (let i = 0; i < LIMIT; i += 1) {
      expect(rateLimit('1.2.3.4', 1000).allowed).toBe(true)
    }
  })

  it('chặn khi vượt hạn mức', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('1.2.3.4', 1000)
    const result = rateLimit('1.2.3.4', 1000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tính riêng theo từng key', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('1.2.3.4', 1000)
    expect(rateLimit('5.6.7.8', 1000).allowed).toBe(true)
  })

  it('mở lại sau khi hết cửa sổ thời gian', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('1.2.3.4', 1000)
    expect(rateLimit('1.2.3.4', 1000).allowed).toBe(false)
    expect(rateLimit('1.2.3.4', 1000 + WINDOW_MS + 1).allowed).toBe(true)
  })
})
