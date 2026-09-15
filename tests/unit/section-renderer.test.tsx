// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

afterEach(() => {
  cleanup()
})

function richTextFixture(overrides: Record<string, unknown> = {}) {
  return {
    _key: 'a',
    _type: 'richTextSection',
    heading: { vi: 'Tiêu đề' },
    content: {
      vi: [
        {
          _type: 'block',
          _key: 'b',
          style: 'normal',
          children: [{ _type: 'span', _key: 'c', text: 'Xin chào', marks: [] }],
        },
      ],
    },
    ...overrides,
  }
}

describe('SectionRenderer', () => {
  it('bỏ qua khối có _type không nhận diện được thay vì nổ', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      render(<SectionRenderer sections={[{ _key: 'a', _type: 'khongTonTai' }]} lang="vi" />),
    ).not.toThrow()
    warn.mockRestore()
  })

  it('render khối văn bản', () => {
    render(<SectionRenderer lang="vi" sections={[richTextFixture()]} />)
    expect(screen.getByText('Xin chào')).toBeDefined()
  })

  it('render mảng rỗng mà không lỗi', () => {
    expect(() => render(<SectionRenderer sections={[]} lang="vi" />)).not.toThrow()
  })

  // Bug đã xảy ra nhiều lần nhất trong dự án này: field màu nền của
  // richTextSection tên là `tone`, không phải `background` (`background` chỉ
  // tồn tại trên heroSection/ctaBandSection, kiểu ảnh). Test trước đây gửi
  // `background: 'white'` cho một fixture mà component chỉ đọc `tone` — nó
  // xanh y hệt dù đổi tên field trong component thành gì, không bắt được gì
  // cả. Hai test dưới đây cố tình đặt `tone` và `background` MÂU THUẪN nhau
  // trên cùng một fixture: nếu component đọc đúng `tone`, kết quả phải khớp
  // `tone`; nếu ai đó (lại) đổi component sang đọc `background`, kết quả sẽ
  // khớp `background` thay vào đó và test dưới đây FAIL.
  it('richTextSection tone="ink": nền tối + tiêu đề gold-hi (đọc đúng field `tone`, không phải `background`)', () => {
    const { container } = render(
      <SectionRenderer
        lang="vi"
        sections={[richTextFixture({ tone: 'ink', background: 'cream' })]}
      />,
    )
    const section = container.querySelector('section')
    expect(section?.className).toContain('bg-ink')
    expect(section?.className).not.toContain('bg-cream')

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.className).toContain('text-gold-hi')
    expect(heading.className).not.toContain('text-gold-deep')
  })

  it('richTextSection tone="cream": nền kem + tiêu đề gold-deep (đọc đúng field `tone`, không phải `background`)', () => {
    const { container } = render(
      <SectionRenderer
        lang="vi"
        sections={[richTextFixture({ tone: 'cream', background: 'ink' })]}
      />,
    )
    const section = container.querySelector('section')
    expect(section?.className).toContain('bg-cream')
    expect(section?.className).not.toContain('bg-ink')

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.className).toContain('text-gold-deep')
    expect(heading.className).not.toContain('text-gold-hi')
  })
})
