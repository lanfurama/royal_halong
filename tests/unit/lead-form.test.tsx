// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LeadForm } from '@/components/forms/LeadForm'
import type { FormState } from '@/app/actions/lead'

// LeadForm gọi thẳng Server Action thật (app/actions/lead.ts) qua
// `useActionState` — action đó chạm `next/headers` + Neon DB thật, không thể
// (và không nên) chạy trong unit test component. Mock module action, giữ
// LeadForm là thứ duy nhất được kiểm — giống cách handleLead() đã có test
// riêng ở lead-action.test.ts cho phần logic.
const submitLead = vi.fn<(prev: FormState, formData: FormData) => Promise<FormState>>()
vi.mock('@/app/actions/lead', () => ({
  submitLead: (prev: FormState, formData: FormData) => submitLead(prev, formData),
}))

afterEach(() => {
  cleanup()
  submitLead.mockReset()
})

describe('LeadForm', () => {
  it('render đủ field bắt buộc với nhãn tiếng Việt, mỗi field có label liên kết thật', () => {
    render(<LeadForm formType="wedding" lang="vi" />)
    expect(screen.getByLabelText(/Họ và tên/)).toBeDefined()
    expect(screen.getByLabelText(/Số điện thoại/)).toBeDefined()
    expect(screen.getByLabelText(/^Email/)).toBeDefined()
    expect(screen.getByLabelText('Ngày dự kiến')).toBeDefined()
    expect(screen.getByLabelText('Số khách')).toBeDefined()
    expect(screen.getByLabelText('Lời nhắn')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Gửi yêu cầu' })).toBeDefined()
  })

  it('render nhãn tiếng Anh khi lang="en"', () => {
    render(<LeadForm formType="mice" lang="en" />)
    expect(screen.getByLabelText(/Full name/)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Send request' })).toBeDefined()
  })

  it('gửi kèm formType/locale/sourcePage qua input ẩn', () => {
    const { container } = render(
      <LeadForm formType="wedding" lang="vi" sourcePage="tiec-cuoi" />,
    )
    const typeInput = container.querySelector('input[name="type"]') as HTMLInputElement
    const localeInput = container.querySelector('input[name="locale"]') as HTMLInputElement
    const sourceInput = container.querySelector('input[name="sourcePage"]') as HTMLInputElement
    expect(typeInput.value).toBe('wedding')
    expect(localeInput.value).toBe('vi')
    expect(sourceInput.value).toBe('tiec-cuoi')
  })

  it('không có sourcePage: không render input ẩn sourcePage', () => {
    const { container } = render(<LeadForm formType="general" lang="vi" />)
    expect(container.querySelector('input[name="sourcePage"]')).toBeNull()
  })

  it('trường bẫy bot (company) ẩn khỏi mắt/AT nhưng vẫn có label thật và tồn tại trong DOM để bot điền được', () => {
    const { container } = render(<LeadForm formType="general" lang="vi" />)
    const wrapper = container.querySelector('input[name="company"]')?.parentElement
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true')
    const honeypot = container.querySelector('input[name="company"]') as HTMLInputElement
    expect(honeypot).not.toBeNull()
    expect(honeypot.tabIndex).toBe(-1)
    // Không dùng type="hidden" — bot đọc DOM thô (không chạy CSS) vẫn phải
    // thấy đây là input text điền được, người dùng thật/trình đọc màn hình
    // thì bị ẩn qua aria-hidden trên cha + kích thước 0.
    expect(honeypot.type).toBe('text')
  })

  it('submit lỗi: hiện message chung (role=alert) và lỗi field liên kết đúng field qua aria-describedby', async () => {
    submitLead.mockResolvedValue({
      status: 'error',
      message: 'Vui lòng kiểm tra lại thông tin đã nhập.',
      fieldErrors: { email: 'Email không hợp lệ' },
    })
    render(<LeadForm formType="general" lang="vi" />)

    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(
        'Vui lòng kiểm tra lại thông tin đã nhập.',
      )
    })
    expect(submitLead).toHaveBeenCalledOnce()

    const emailError = screen.getByText('Email không hợp lệ')
    const emailInput = screen.getByLabelText(/^Email/)
    expect(emailInput.getAttribute('aria-describedby')).toBe(emailError.id)
  })

  it('submit thành công: form biến mất, thay bằng vùng role=status với successMessage ưu tiên hơn state.message', async () => {
    submitLead.mockResolvedValue({ status: 'success', message: 'Cảm ơn bạn.' })
    render(
      <LeadForm formType="wedding" lang="vi" successMessage="Đã nhận yêu cầu tiệc cưới!" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Đã nhận yêu cầu tiệc cưới!')
    })
    expect(screen.queryByRole('button', { name: 'Gửi yêu cầu' })).toBeNull()
  })

  it('submit thành công không có successMessage: dùng state.message làm fallback', async () => {
    submitLead.mockResolvedValue({ status: 'success', message: 'Cảm ơn bạn.' })
    render(<LeadForm formType="general" lang="vi" />)

    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Cảm ơn bạn.')
    })
  })
})
