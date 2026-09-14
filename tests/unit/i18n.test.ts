import { describe, it, expect } from 'vitest'
import { t, isLocale, LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

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
})

describe('isLocale()', () => {
  it('nhận vi và en, từ chối phần còn lại', () => {
    expect(isLocale('vi')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})

describe('hằng số', () => {
  it('LOCALES là [vi, en] và mặc định là vi', () => {
    expect(LOCALES).toEqual(['vi', 'en'])
    expect(DEFAULT_LOCALE).toBe('vi')
  })
})
