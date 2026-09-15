// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { LangSwitcher } from '@/components/layout/LangSwitcher'

// swapLocalePrefix() thuần đã có test riêng (không cần jsdom). Ở đây mount
// thật component để xác nhận usePathname() thực sự được nối vào đúng href
// và aria-current, thứ mà test hàm thuần không chạm tới.

let mockPathname = '/vi/casino'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

afterEach(() => {
  cleanup()
  mockPathname = '/vi/casino'
})

describe('LangSwitcher', () => {
  it('đánh dấu locale hiện tại bằng aria-current, còn lại thì không', () => {
    render(<LangSwitcher lang="vi" />)
    const vi_ = screen.getByRole('link', { name: 'VI' })
    const en = screen.getByRole('link', { name: 'EN' })
    expect(vi_.getAttribute('aria-current')).toBe('true')
    expect(en.getAttribute('aria-current')).toBeNull()
  })

  it('href của mỗi locale trỏ đúng path hiện tại với prefix locale tương ứng', () => {
    render(<LangSwitcher lang="vi" />)
    expect(screen.getByRole('link', { name: 'VI' })).toHaveProperty('pathname', '/vi/casino')
    expect(screen.getByRole('link', { name: 'EN' })).toHaveProperty('pathname', '/en/casino')
  })
})
