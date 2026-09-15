import { describe, it, expect } from 'vitest'
import { leadSchema, newsletterSchema, isHoneypotFilled, errorMessage, ERROR_MESSAGES } from '@/lib/validation'

const valid = {
  type: 'wedding',
  name: 'Nguyễn Văn A',
  email: 'a@example.com',
  phone: '0904030222',
  locale: 'vi',
}

describe('leadSchema', () => {
  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(leadSchema.safeParse(valid).success).toBe(true)
  })

  it('từ chối email sai định dạng', () => {
    expect(leadSchema.safeParse({ ...valid, email: 'khong-phai-email' }).success).toBe(false)
  })

  it('từ chối tên rỗng và số điện thoại rỗng', () => {
    expect(leadSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(leadSchema.safeParse({ ...valid, phone: '' }).success).toBe(false)
  })

  it('chỉ nhận 3 loại form đã định nghĩa', () => {
    expect(leadSchema.safeParse({ ...valid, type: 'mice' }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, type: 'general' }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, type: 'linh-tinh' }).success).toBe(false)
  })

  it('chấp nhận số điện thoại Việt Nam có khoảng trắng và dấu +', () => {
    expect(leadSchema.safeParse({ ...valid, phone: '+84 90 4030 222' }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, phone: '0904 030 222' }).success).toBe(true)
  })

  it('từ chối số điện thoại quá ngắn', () => {
    expect(leadSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false)
  })

  it('guestCount phải là số dương khi có', () => {
    expect(leadSchema.safeParse({ ...valid, guestCount: 120 }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, guestCount: -5 }).success).toBe(false)
  })

  it('ép chuỗi rỗng của field tuỳ chọn thành undefined', () => {
    const parsed = leadSchema.parse({ ...valid, message: '', eventDate: '' })
    expect(parsed.message).toBeUndefined()
    expect(parsed.eventDate).toBeUndefined()
  })

  it('locale chỉ nhận vi hoặc en', () => {
    expect(leadSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false)
  })
})

describe('newsletterSchema', () => {
  it('chấp nhận email hợp lệ', () => {
    expect(newsletterSchema.safeParse({ email: 'a@b.com', locale: 'vi' }).success).toBe(true)
  })

  it('chuẩn hoá email về chữ thường và bỏ khoảng trắng', () => {
    const parsed = newsletterSchema.parse({ email: '  A@B.COM ', locale: 'vi' })
    expect(parsed.email).toBe('a@b.com')
  })
})

describe('isHoneypotFilled()', () => {
  it('true khi trường bẫy có giá trị', () => {
    expect(isHoneypotFilled({ company: 'bot' })).toBe(true)
  })

  it('false khi trường bẫy rỗng hoặc không có', () => {
    expect(isHoneypotFilled({ company: '' })).toBe(false)
    expect(isHoneypotFilled({})).toBe(false)
  })
})

describe('thông điệp lỗi song ngữ', () => {
  it('lỗi zod mang KHOÁ ổn định, không phải chuỗi đã ghép hai thứ tiếng', () => {
    const r = leadSchema.safeParse({ type: 'wedding', name: '', email: 'a@b.co', phone: '0900000000' })
    expect(r.success).toBe(false)
    const issue = r.error!.issues.find((i) => i.path[0] === 'name')!
    expect(issue.message).toBe('name_required')
    expect(issue.message).not.toMatch(/ \/ /)
  })

  // Đây chính là lỗi hiển thị mà thiết kế khoá sinh ra để tránh.
  it('cùng một khoá cho ra câu khác nhau theo ngôn ngữ, không lẫn hai thứ tiếng', () => {
    expect(errorMessage('name_required', 'vi')).toBe('Vui lòng nhập họ tên')
    expect(errorMessage('name_required', 'en')).toBe('Please enter your full name')
    expect(errorMessage('name_required', 'vi')).not.toMatch(/Please/)
    expect(errorMessage('name_required', 'en')).not.toMatch(/Vui lòng/)
  })

  it('mọi khoá đều có đủ cả vi lẫn en', () => {
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      expect(value.vi, key).toBeTruthy()
      expect(value.en, key).toBeTruthy()
    }
  })

  it('khoá lạ trả về chính nó, không trả chuỗi rỗng', () => {
    expect(errorMessage('khong_ton_tai', 'vi')).toBe('khong_ton_tai')
  })
})
