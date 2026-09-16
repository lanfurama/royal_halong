// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import type { FormState } from '@/app/actions/lead'

const submitNewsletter = vi.fn<(prev: FormState, formData: FormData) => Promise<FormState>>()
vi.mock('@/app/actions/newsletter', () => ({
  submitNewsletter: (prev: FormState, formData: FormData) => submitNewsletter(prev, formData),
}))

afterEach(() => {
  cleanup()
  submitNewsletter.mockReset()
})

describe('NewsletterForm', () => {
  it('render input email với label ẩn thị giác (sr-only) nhưng vẫn có tên truy cập', () => {
    render(<NewsletterForm lang="vi" />)
    const input = screen.getByLabelText('Email của bạn') as HTMLInputElement
    expect(input.type).toBe('email')
    expect(input.required).toBe(true)
    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeDefined()
  })

  it('tiếng Anh: placeholder/label và nút đổi đúng chữ', () => {
    render(<NewsletterForm lang="en" />)
    expect(screen.getByLabelText('Your email')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeDefined()
  })

  it('gửi kèm locale qua input ẩn, có trường bẫy bot ref_2 ẩn khỏi AT', () => {
    const { container } = render(<NewsletterForm lang="vi" />)
    const localeInput = container.querySelector('input[name="locale"]') as HTMLInputElement
    expect(localeInput.value).toBe('vi')

    const wrapper = container.querySelector('input[name="ref_2"]')?.parentElement
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true')
    const honeypot = container.querySelector('input[name="ref_2"]') as HTMLInputElement
    expect(honeypot.tabIndex).toBe(-1)
  })

  it('submit lỗi: message hiện qua role=alert và liên kết với input email qua aria-describedby', async () => {
    submitNewsletter.mockResolvedValue({
      status: 'error',
      message: 'Email không hợp lệ.',
      fieldErrors: { email: 'Email không hợp lệ' },
    })
    render(<NewsletterForm lang="vi" />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Email không hợp lệ.')
    })
    const input = screen.getByLabelText('Email của bạn')
    expect(input.getAttribute('aria-describedby')).toBe('newsletter-email-error')
  })

  it('submit thành công: thay bằng vùng role=status với message', async () => {
    submitNewsletter.mockResolvedValue({ status: 'success', message: 'Đăng ký thành công. Cảm ơn bạn!' })
    render(<NewsletterForm lang="vi" />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Đăng ký thành công. Cảm ơn bạn!')
    })
    expect(screen.queryByRole('button', { name: 'Đăng ký' })).toBeNull()
  })
})
