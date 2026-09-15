// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MobileMenu } from '@/components/layout/MobileMenu'

// MobileMenu là component tương tác duy nhất trong Task 4 mà tính đúng đắn
// không đọc được thẳng từ trang render tĩnh: bẫy focus, Escape, và trả focus
// về nút bấm — đây là phần rủi ro nhất và được đánh giá riêng. Test bằng DOM
// thật (jsdom + @testing-library/react) thay vì soi cây phần tử React.

let mockPathname = '/vi'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

afterEach(() => {
  cleanup()
  mockPathname = '/vi'
})

const items = [
  {
    label: { vi: 'Lưu trú' },
    link: { kind: 'internal', label: { vi: 'Lưu trú' }, internalSlug: { vi: { current: 'luu-tru' } } },
  },
  {
    label: { vi: 'Liên hệ' },
    link: { kind: 'external', href: 'https://example.com', label: { vi: 'Liên hệ' }, blank: true },
  },
]

/** Render MobileMenu và mở panel, trả về trigger + hàm rerender của cùng một instance. */
function renderOpen() {
  const { rerender } = render(<MobileMenu lang="vi" items={items} />)
  const trigger = screen.getByRole('button', { name: 'Mở menu' })
  fireEvent.click(trigger)
  return { trigger, rerender }
}

describe('MobileMenu — mở/đóng, bẫy focus, Escape', () => {
  it('không render gì khi không có mục menu (navigation.header rỗng)', () => {
    const { container } = render(<MobileMenu lang="vi" items={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('mở panel: nút bấm được aria-expanded=true và focus chuyển vào trong panel', () => {
    const { trigger } = renderOpen()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    const panel = document.getElementById('mobile-menu')
    expect(panel?.hasAttribute('hidden')).toBe(false)
    // Phần tử focusable đầu tiên trong panel (DOM order) là nút đóng.
    const closeButton = screen.getByRole('button', { name: 'Đóng menu' })
    expect(document.activeElement).toBe(closeButton)
    expect(panel?.contains(document.activeElement)).toBe(true)
  })

  it('Tab từ phần tử focusable cuối cùng quay vòng về phần tử đầu tiên', () => {
    renderOpen()
    const panel = document.getElementById('mobile-menu') as HTMLElement
    const focusables = panel.querySelectorAll<HTMLElement>('a, button')
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    last.focus()
    expect(document.activeElement).toBe(last)

    fireEvent.keyDown(panel, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
  })

  it('Shift+Tab từ phần tử focusable đầu tiên quay vòng về phần tử cuối cùng', () => {
    renderOpen()
    const panel = document.getElementById('mobile-menu') as HTMLElement
    const focusables = panel.querySelectorAll<HTMLElement>('a, button')
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    first.focus()
    expect(document.activeElement).toBe(first)

    fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('Escape đóng panel và trả focus về nút mở menu', () => {
    const { trigger } = renderOpen()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    const panel = document.getElementById('mobile-menu')
    expect(panel?.hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(trigger)
  })

  it('nút Đóng (X) trong panel cũng đóng và trả focus về nút mở menu', () => {
    const { trigger } = renderOpen()
    const closeButton = screen.getByRole('button', { name: 'Đóng menu' })
    fireEvent.click(closeButton)

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('đóng panel khi pathname đổi (điều hướng) — layout không remount giữa các lần chuyển trang', () => {
    const { trigger, rerender } = renderOpen()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    mockPathname = '/vi/luu-tru'
    rerender(<MobileMenu lang="vi" items={items} />)

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById('mobile-menu')?.hasAttribute('hidden')).toBe(true)
  })
})
