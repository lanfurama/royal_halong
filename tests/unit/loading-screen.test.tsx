// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { LOCALES } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'

// Màn hình chờ không có state, không sự kiện — thứ đáng test ở đây là các
// HỢP ĐỒNG dễ bị phá âm thầm trong một lần chỉnh giao diện:
//
// 1. Hai mặt logo. Xoá một tấm thì component vẫn render, test vẫn xanh, chỉ
//    có dòng chữ trong logo bị lật gương suốt nửa vòng quay — một lỗi chỉ
//    thấy được bằng mắt, ở đúng 1/4 chu kỳ 7 giây.
// 2. Vùng `role="status"` có tên truy cập ở CẢ SÁU ngôn ngữ. Đây là thứ duy
//    nhất người dùng screen reader nhận được trong lúc chờ.
// 3. Logo mang `alt=""`. Để `alt` có chữ thì tên khách sạn bị đọc hai lần
//    mỗi lần chuyển trang (một lần từ `alt`, một lần từ nhãn trạng thái).

afterEach(cleanup)

describe('LoadingScreen', () => {
  it('thông báo trạng thái đang tải ở cả sáu ngôn ngữ', () => {
    for (const lang of LOCALES) {
      cleanup()
      render(<LoadingScreen lang={lang} />)
      const status = screen.getByRole('status')
      expect(status.textContent).toContain(ui('loading', lang))
      expect(status.getAttribute('aria-live')).toBe('polite')
    }
  })

  it('logo có ĐÚNG hai mặt — mặt sau là thứ giữ chữ khỏi bị lật gương', () => {
    const { container } = render(<LoadingScreen lang="vi" />)
    const faces = container.querySelectorAll('.rhl-loader__face')
    expect(faces).toHaveLength(2)
    expect(container.querySelectorAll('.rhl-loader__face--back')).toHaveLength(1)
    // Cùng một file ảnh cho cả hai mặt: trình duyệt tải một lần, và mặt sau
    // không được phép là một bản logo khác.
    expect(new Set([...faces].map((el) => el.getAttribute('src'))).size).toBe(1)
  })

  it('logo là trang trí: không ảnh nào có alt mang chữ', () => {
    const { container } = render(<LoadingScreen lang="vi" />)
    const imgs = [...container.querySelectorAll('img')]
    expect(imgs.length).toBeGreaterThan(0)
    for (const img of imgs) expect(img.getAttribute('alt')).toBe('')
  })

  it('mỗi nền lấy đúng MỘT file logo — nền kem lấy bản vàng, nền mực lấy bản trắng', () => {
    // Đây là lý do `theme` là prop chứ không phải class CSS: CSS không đổi
    // được `src`, nên cách duy nhất để chuyển bằng class là render cả hai rồi
    // ẩn một — và trình duyệt vẫn tải đủ hai file trên một màn hình chờ.
    const { container: cream } = render(<LoadingScreen lang="vi" />)
    const creamSrcs = new Set([...cream.querySelectorAll('img')].map((i) => i.getAttribute('src')))
    expect([...creamSrcs]).toEqual(['/logo-royal-halong-gold.png'])
    expect(cream.firstElementChild?.className).not.toContain('rhl-loader--ink')

    cleanup()
    const { container: ink } = render(<LoadingScreen lang="vi" theme="ink" />)
    const inkSrcs = new Set([...ink.querySelectorAll('img')].map((i) => i.getAttribute('src')))
    expect([...inkSrcs]).toEqual(['/logo-royal-halong-white.png'])
    expect(ink.firstElementChild?.className).toContain('rhl-loader--ink')
  })

  it('`fullscreen` quyết định lớp phủ kín viewport', () => {
    const { container: full } = render(<LoadingScreen lang="vi" />)
    expect(full.firstElementChild?.className).toContain('rhl-loader--fullscreen')

    cleanup()
    const { container: inline } = render(<LoadingScreen lang="vi" fullscreen={false} />)
    expect(inline.firstElementChild?.className).not.toContain('rhl-loader--fullscreen')
  })
})
