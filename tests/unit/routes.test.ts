import { describe, it, expect } from 'vitest'
import { hrefFor, resolveSlug } from '@/lib/routes'

describe('resolveSlug()', () => {
  it('dùng slug của locale khi có', () => {
    expect(resolveSlug({ vi: { current: 'luu-tru' }, en: { current: 'stay' } }, 'en')).toBe('stay')
  })

  it('fallback về slug vi khi locale chưa có slug riêng', () => {
    expect(resolveSlug({ vi: { current: 'casino' } }, 'en')).toBe('casino')
    expect(resolveSlug({ vi: { current: 'casino' }, en: { current: '' } }, 'en')).toBe('casino')
  })

  it('trả undefined khi không có slug nào', () => {
    expect(resolveSlug(undefined, 'vi')).toBeUndefined()
  })
})

describe('hrefFor()', () => {
  it('ghép đường dẫn có prefix locale', () => {
    expect(hrefFor('vi', { vi: { current: 'casino' } })).toBe('/vi/casino')
    expect(hrefFor('en', { vi: { current: 'casino' } })).toBe('/en/casino')
  })

  it('slug rỗng ra trang chủ của locale', () => {
    expect(hrefFor('vi', undefined)).toBe('/vi')
  })
})
