// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n'

// swapLocalePrefix() thuần đã có test riêng (không cần jsdom). Ở đây mount
// thật component để xác nhận usePathname() thực sự được nối vào đúng href
// và aria-current, thứ mà test hàm thuần không chạm tới.
//
// Từ bản 6 ngôn ngữ, component là một DROPDOWN (dãy sáu link 44px không lọt
// vào header — xem ghi chú trong LangSwitcher.tsx), nên mọi test phải mở
// panel trước khi tìm link. Đó cũng chính là hợp đồng cần giữ: panel đóng
// thì các link KHÔNG nằm trong cây truy cập, không nằm trong thứ tự Tab.

let mockPathname = '/vi/casino'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

afterEach(() => {
  cleanup()
  mockPathname = '/vi/casino'
})

/** Render và mở panel. Trả về chính nút mở để test trạng thái của nó. */
function renderOpen(lang: 'vi' | 'en' = 'vi') {
  render(<LangSwitcher lang={lang} />)
  const trigger = screen.getByRole('button')
  fireEvent.click(trigger)
  return trigger
}

describe('LangSwitcher', () => {
  it('panel đóng mặc định: không link nào lọt vào cây truy cập', () => {
    render(<LangSwitcher lang="vi" />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('mở panel: đủ sáu ngôn ngữ, tên viết bằng chính ngôn ngữ đó', () => {
    const trigger = renderOpen()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByRole('link')).toHaveLength(LOCALES.length)
    for (const locale of LOCALES) {
      expect(screen.getByRole('link', { name: LOCALE_LABELS[locale] })).toBeTruthy()
    }
  })

  it('đánh dấu locale hiện tại bằng aria-current, còn lại thì không', () => {
    renderOpen()
    expect(
      screen.getByRole('link', { name: LOCALE_LABELS.vi }).getAttribute('aria-current'),
    ).toBe('true')
    expect(
      screen.getByRole('link', { name: LOCALE_LABELS.en }).getAttribute('aria-current'),
    ).toBeNull()
  })

  it('href của mỗi locale trỏ đúng path hiện tại với prefix locale tương ứng', () => {
    renderOpen()
    expect(screen.getByRole('link', { name: LOCALE_LABELS.vi })).toHaveProperty(
      'pathname',
      '/vi/casino',
    )
    expect(screen.getByRole('link', { name: LOCALE_LABELS.en })).toHaveProperty(
      'pathname',
      '/en/casino',
    )
    expect(screen.getByRole('link', { name: LOCALE_LABELS.ja })).toHaveProperty(
      'pathname',
      '/ja/casino',
    )
  })

  it('mỗi link khai `hreflang` và `lang` của chính nó', () => {
    renderOpen()
    const ko = screen.getByRole('link', { name: LOCALE_LABELS.ko })
    // `lang` trên link là thứ cho screen reader biết phải đọc "한국어" bằng
    // bộ quy tắc tiếng Hàn chứ không phải tiếng Việt.
    expect(ko.getAttribute('lang')).toBe('ko')
    expect(ko.getAttribute('hreflang')).toBe('ko')
  })

  it('Escape đóng panel và trả focus về nút mở', () => {
    const trigger = renderOpen()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})
