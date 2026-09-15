// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Field } from '@/components/forms/Field'

// Field là input dùng chung cho LeadForm/NewsletterForm — ràng buộc cứng của
// repo (xem AGENTS.md/brief Task 5) là label phải liên kết thật qua
// htmlFor/id, và lỗi phải liên kết bằng aria-describedby. Test ở đây khoá lại
// đúng hai điểm đó, không phải style.

afterEach(() => {
  cleanup()
})

describe('Field', () => {
  it('label liên kết thật với input qua htmlFor/id', () => {
    render(<Field name="name" label="Họ và tên" />)
    const input = screen.getByLabelText('Họ và tên')
    expect(input.tagName).toBe('INPUT')
    expect(input.id).toBe('field-name')
  })

  it('required: hiện dấu * nhưng aria-hidden (không đọc lẫn vào tên field)', () => {
    render(<Field name="email" label="Email" required />)
    const input = screen.getByLabelText(/^Email/) as HTMLInputElement
    expect(input.required).toBe(true)
    const asterisk = screen.getByText('*')
    expect(asterisk.getAttribute('aria-hidden')).toBe('true')
  })

  it('có lỗi: input aria-invalid + aria-describedby trỏ đúng id của thông báo lỗi, lỗi dùng text-red-700', () => {
    render(<Field name="email" label="Email" error="Email không hợp lệ" />)
    const input = screen.getByLabelText('Email')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBe('field-email-error')

    const message = screen.getByText('Email không hợp lệ')
    expect(message.id).toBe(describedBy)
    // Đỏ nhạt (text-red-500) không đạt AA trên nền trắng — phải là text-red-700.
    expect(message.className).toContain('text-red-700')
    expect(message.className).not.toContain('text-red-500')
  })

  it('không có lỗi: input không có aria-invalid/aria-describedby, không render thẻ lỗi', () => {
    render(<Field name="phone" label="Điện thoại" />)
    const input = screen.getByLabelText('Điện thoại')
    expect(input.hasAttribute('aria-invalid')).toBe(false)
    expect(input.hasAttribute('aria-describedby')).toBe(false)
  })

  it('truyền thẳng type và các thuộc tính input khác (autoComplete, min...)', () => {
    render(<Field name="guestCount" label="Số khách" type="number" min={1} />)
    const input = screen.getByLabelText('Số khách') as HTMLInputElement
    expect(input.type).toBe('number')
    expect(input.min).toBe('1')
  })
})
