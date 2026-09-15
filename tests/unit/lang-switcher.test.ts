import { describe, it, expect } from 'vitest'
import { swapLocalePrefix } from '@/components/layout/LangSwitcher'

describe('swapLocalePrefix()', () => {
  it('đổi prefix locale, giữ nguyên phần slug còn lại', () => {
    expect(swapLocalePrefix('/vi/casino', 'vi', 'en')).toBe('/en/casino')
    expect(swapLocalePrefix('/en/stay/deluxe', 'en', 'vi')).toBe('/vi/stay/deluxe')
  })

  it('trang chủ vẫn đổi đúng prefix', () => {
    expect(swapLocalePrefix('/vi', 'vi', 'en')).toBe('/en')
  })

  it('chỉ thay prefix ở đầu chuỗi, không đụng vào đoạn giống hệt ở giữa path', () => {
    expect(swapLocalePrefix('/vi/vi-vip-room', 'vi', 'en')).toBe('/en/vi-vip-room')
  })
})
