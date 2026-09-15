// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

describe('SectionRenderer', () => {
  it('bỏ qua khối có _type không nhận diện được thay vì nổ', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      render(<SectionRenderer sections={[{ _key: 'a', _type: 'khongTonTai' }]} lang="vi" />),
    ).not.toThrow()
    warn.mockRestore()
  })

  it('render khối văn bản', () => {
    render(
      <SectionRenderer
        lang="vi"
        sections={[
          {
            _key: 'a',
            _type: 'richTextSection',
            background: 'white',
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
          },
        ]}
      />,
    )
    expect(screen.getByText('Xin chào')).toBeDefined()
  })

  it('render mảng rỗng mà không lỗi', () => {
    expect(() => render(<SectionRenderer sections={[]} lang="vi" />)).not.toThrow()
  })
})
