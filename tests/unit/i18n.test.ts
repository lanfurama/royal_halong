import { describe, it, expect } from 'vitest'
import { t, isLocale, LOCALES, DEFAULT_LOCALE, fallbackChain } from '@/lib/i18n'

describe('t()', () => {
  it('trả đúng giá trị của locale được yêu cầu', () => {
    expect(t({ vi: 'Lưu trú', en: 'Stay' }, 'en')).toBe('Stay')
    expect(t({ vi: 'Lưu trú', en: 'Stay' }, 'vi')).toBe('Lưu trú')
  })

  it('fallback về vi khi en trống', () => {
    expect(t({ vi: 'Lưu trú', en: '' }, 'en')).toBe('Lưu trú')
    expect(t({ vi: 'Lưu trú', en: null }, 'en')).toBe('Lưu trú')
    expect(t({ vi: 'Lưu trú' }, 'en')).toBe('Lưu trú')
  })

  it('bốn ngôn ngữ mới đi QUA tiếng Anh trước khi về tiếng Việt', () => {
    // Có bản EN -> khách Nhật/Hàn/Trung/Thái đọc được tiếng Anh, không bị
    // ném vào tiếng Việt.
    expect(t({ vi: 'Lưu trú', en: 'Stay' }, 'ja')).toBe('Stay')
    expect(t({ vi: 'Lưu trú', en: 'Stay' }, 'th')).toBe('Stay')
    // Không có bản EN -> mới rơi về tiếng Việt.
    expect(t({ vi: 'Lưu trú' }, 'ko')).toBe('Lưu trú')
    expect(t({ vi: 'Lưu trú', en: '   ' }, 'zh')).toBe('Lưu trú')
    // Có bản riêng thì luôn ưu tiên bản riêng.
    expect(t({ vi: 'Lưu trú', en: 'Stay', ja: '宿泊' }, 'ja')).toBe('宿泊')
  })

  it('KHÔNG fallback ngược: vi trống thì trả undefined kể cả khi en có', () => {
    expect(t({ vi: '', en: 'Stay' }, 'vi')).toBeUndefined()
  })

  it('trả undefined khi field null hoặc undefined', () => {
    expect(t(null, 'vi')).toBeUndefined()
    expect(t(undefined, 'vi')).toBeUndefined()
  })

  it('hoạt động với mảng Portable Text, không chỉ chuỗi', () => {
    const blocks = [{ _type: 'block', children: [] }]
    expect(t({ vi: blocks, en: [] }, 'en')).toEqual(blocks)
  })

  it('coi chuỗi chỉ có khoảng trắng là trống, fallback về vi', () => {
    expect(t({ vi: 'Lưu trú', en: '   ' }, 'en')).toBe('Lưu trú')
  })
})

describe('isLocale()', () => {
  it('nhận đủ sáu locale, từ chối phần còn lại', () => {
    for (const locale of ['vi', 'en', 'zh', 'ko', 'ja', 'th']) {
      expect(isLocale(locale)).toBe(true)
    }
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('')).toBe(false)
    // `zh-CN` KHÔNG hợp lệ: segment URL là mã hai chữ cái, không phải BCP-47
    // đầy đủ (xem OG_LOCALES nếu cần dạng đầy đủ).
    expect(isLocale('zh-CN')).toBe(false)
  })
})

describe('fallbackChain()', () => {
  it('vi không fallback; en về vi; còn lại đi qua en', () => {
    expect(fallbackChain('vi')).toEqual(['vi'])
    expect(fallbackChain('en')).toEqual(['en', 'vi'])
    expect(fallbackChain('ja')).toEqual(['ja', 'en', 'vi'])
    expect(fallbackChain('th')).toEqual(['th', 'en', 'vi'])
  })
})

describe('hằng số', () => {
  it('LOCALES là sáu ngôn ngữ, mặc định là vi', () => {
    expect(LOCALES).toEqual(['vi', 'en', 'zh', 'ko', 'ja', 'th'])
    expect(DEFAULT_LOCALE).toBe('vi')
  })
})
