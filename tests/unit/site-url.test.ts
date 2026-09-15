import { afterEach, describe, expect, it, vi } from 'vitest'
import { siteUrl } from '@/lib/site-url'

// `process.env.NODE_ENV` được @types/node khai `readonly` — không gán trực
// tiếp được (`tsc --noEmit` lỗi TS2540). `vi.stubEnv`/`vi.unstubAllEnvs` của
// Vitest là cách chuẩn để đổi env var trong test mà không đụng vào kiểu đó.
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('siteUrl()', () => {
  it('ưu tiên NEXT_PUBLIC_SITE_URL khi có', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://royalhalong.example')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'should-be-ignored.vercel.app')
    expect(siteUrl()).toBe('https://royalhalong.example')
  })

  it('rơi về VERCEL_PROJECT_PRODUCTION_URL (thêm https://) khi thiếu NEXT_PUBLIC_SITE_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'royal-halong.vercel.app')
    expect(siteUrl()).toBe('https://royal-halong.vercel.app')
  })

  it('dev (NODE_ENV != production), thiếu cả hai -> rơi về localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(siteUrl()).toBe('http://localhost:3000')
  })

  it('production, thiếu cả NEXT_PUBLIC_SITE_URL lẫn VERCEL_PROJECT_PRODUCTION_URL -> throw thay vì âm thầm dùng localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => siteUrl()).toThrow()
  })
})
