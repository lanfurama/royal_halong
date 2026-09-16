import { describe, it, expect } from 'vitest'
import { parseTravelStats, blocksToPlainText } from '@/lib/home-stats'

// Đoạn văn THẬT trong Sanity (`homePage.sections[2].content.vi`) — không phải
// ví dụ bịa. Đây là nguồn duy nhất của khối số liệu trên trang chủ, nên test
// phải chạy trên đúng chuỗi đó.
const REAL_VI =
  'Royal Ha Long nằm tại trung tâm du lịch Bãi Cháy, có thể dễ dàng di chuyển tới ' +
  'những địa điểm du lịch tại đây: 2 phút di chuyển đến bãi biển; 5 phút di chuyển ' +
  'đến Sunworld Complex; Khoảng 5 phút di chuyển đến Cảng Tàu khách Quốc tế Hạ Long; ' +
  'Khoảng 15 phút di chuyển đến Cảng Tàu khách Quốc Tế Tuần Châu.'

describe('parseTravelStats()', () => {
  it('rút đúng bốn mốc từ đoạn văn thật trên trang chủ', () => {
    const stats = parseTravelStats(REAL_VI)
    expect(stats).toEqual([
      { value: '2', unit: 'phút', label: 'bãi biển' },
      { value: '5', unit: 'phút', label: 'Sunworld Complex' },
      { value: '5', unit: 'phút', label: 'Cảng Tàu khách Quốc tế Hạ Long' },
      { value: '15', unit: 'phút', label: 'Cảng Tàu khách Quốc Tế Tuần Châu' },
    ])
  })

  it('KHÔNG dùng \\b trước "đến" — `đ` không phải ký tự từ ASCII', () => {
    // Bảo vệ chính xác lỗi đã gặp: mẫu có `\b(?:đến|tới)` khớp 0 lần trên
    // đoạn văn trên, làm khối số liệu lặng lẽ biến mất khỏi trang chủ mà
    // không có lỗi nào được báo. Nếu ai đó "dọn dẹp" mẫu và thêm `\b` lại,
    // test này đỏ ngay.
    expect(/(\d+)\s*(phút)\b[^;.]*?\b(?:đến|tới)\s+(.+)/i.test('2 phút di chuyển đến bãi biển'))
      .toBe(false)
    expect(parseTravelStats('2 phút di chuyển đến bãi biển; 5 phút đi tới Sun World')).toHaveLength(2)
  })

  it('đọc được cả bản tiếng Anh', () => {
    const stats = parseTravelStats(
      '2 minutes to the beach; 5 minutes to Sun World; 15 min to Tuan Chau Harbour',
    )
    expect(stats.map((s) => s.label)).toEqual(['the beach', 'Sun World', 'Tuan Chau Harbour'])
  })

  it('cắt còn tối đa 4 mốc', () => {
    const many = Array.from({ length: 9 }, (_, i) => `${i + 1} phút đến điểm ${i + 1}`).join('; ')
    expect(parseTravelStats(many)).toHaveLength(4)
  })

  it('hỏng an toàn: dưới 2 mốc thì trả rỗng để nơi gọi hiện nguyên đoạn văn', () => {
    // Một mốc duy nhất -> không đủ thành một hàng số liệu.
    expect(parseTravelStats('Chỉ 5 phút đi bộ đến bãi biển.')).toEqual([])
    // Đoạn văn biên tập viên viết lại theo cách khác.
    expect(parseTravelStats('Khách sạn nằm ngay trung tâm Bãi Cháy, rất thuận tiện.')).toEqual([])
    expect(parseTravelStats('')).toEqual([])
    expect(parseTravelStats(null)).toEqual([])
    expect(parseTravelStats(undefined)).toEqual([])
  })

  it('bỏ dấu câu thừa ở cuối nhãn', () => {
    const stats = parseTravelStats('2 phút đến bãi biển; 5 phút đến Sun World.')
    expect(stats[1].label).toBe('Sun World')
  })
})

describe('blocksToPlainText()', () => {
  it('nối các block Portable Text thành chuỗi phẳng', () => {
    const blocks = [
      { _type: 'block', children: [{ text: 'Dòng một' }] },
      { _type: 'block', children: [{ text: 'Dòng ' }, { text: 'hai' }] },
    ]
    expect(blocksToPlainText(blocks)).toBe('Dòng một\nDòng hai')
  })

  it('chịu được dữ liệu thiếu/không phải mảng mà không nổ', () => {
    expect(blocksToPlainText(null)).toBe('')
    expect(blocksToPlainText(undefined)).toBe('')
    expect(blocksToPlainText('không phải mảng')).toBe('')
    expect(blocksToPlainText([{ _type: 'figure' }])).toBe('')
  })
})
