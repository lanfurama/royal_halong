export interface TravelStat {
  /** Con số, giữ nguyên dạng chuỗi ("2", "15"). */
  value: string
  /** Đơn vị đi kèm ("phút", "minutes"). */
  unit: string
  /** Điểm đến ("bãi biển", "Sunworld Complex"). */
  label: string
}

/**
 * Mỗi mẫu bắt một câu dạng "<số> <đơn vị thời gian> ... đến <điểm đến>".
 * `[^;.]*?` (lười, không vượt qua dấu `;` hay `.`) giữ cho phần "di chuyển"
 * ở giữa không nuốt sang mệnh đề kế tiếp.
 *
 * KHÔNG dùng `\b` ngay trước `đến|tới`. `\b` của JavaScript (khi không bật
 * cờ `u`) định nghĩa "ký tự từ" theo ASCII `[A-Za-z0-9_`], nên `đ` bị coi là
 * ký tự KHÔNG phải chữ — giữa dấu cách và `đ` không có ranh giới nào, và mẫu
 * không bao giờ khớp. Đây là lỗi thật đã gặp: khối số liệu trên trang chủ
 * lặng lẽ rơi về hiển thị nguyên đoạn văn, không có lỗi nào được báo.
 * `\b` SAU `phút` thì vẫn dùng được vì `t` là ký tự ASCII.
 */
const PATTERNS: RegExp[] = [
  /(\d+)\s*(phút)\b[^;.]*?(?:đến|tới)\s+(.+)/i,
  /(\d+)\s*(minutes?|mins?)\b[^;.]*?\bto\s+(.+)/i,
]

/** Ít hơn ngần này thì coi như đoạn văn không phải dạng liệt kê khoảng cách. */
const MIN_STATS = 2
/** Bản thiết kế bày 3 ô; dữ liệu thật có 4 và lưới chứa vừa. Trên 4 thì khối
 * số liệu dài hơn cả đoạn văn nó tóm tắt. */
const MAX_STATS = 4

/**
 * Rút các mốc "mấy phút tới đâu" ra khỏi đoạn văn vị trí của trang chủ.
 *
 * Bản thiết kế bày chúng thành ba con số lớn thay vì một câu liệt kê dài —
 * đó là điểm nhấn thị giác của cả khối giới thiệu. Nhưng nguồn dữ liệu là
 * một `richTextSection` do biên tập viên gõ tự do trong Sanity, KHÔNG phải
 * một mảng có cấu trúc, nên chỗ duy nhất lấy được các con số này là chính
 * đoạn văn đó.
 *
 * Vì thế hàm phải HỎNG AN TOÀN: tìm được < 2 mốc thì trả mảng rỗng và nơi
 * gọi (`HomeIntro`) quay về hiển thị nguyên đoạn văn. Ngày biên tập viên
 * viết lại câu này theo cách khác, trang mất phần trang trí chứ không mất
 * nội dung, và không có gì hỏng.
 *
 * Chọn mẫu theo CHÍNH VĂN BẢN chứ không theo `locale`: nội dung hôm nay chỉ
 * có bản tiếng Việt, nên trang `/ja` cũng nhận đúng chuỗi tiếng Việt đó qua
 * fallback của `t()` — dò theo locale sẽ trượt ở đúng năm trên sáu ngôn ngữ.
 */
export function parseTravelStats(text: string | null | undefined): TravelStat[] {
  if (!text) return []

  for (const pattern of PATTERNS) {
    const stats: TravelStat[] = []
    for (const chunk of text.split(/[;\n]+/)) {
      const match = chunk.match(pattern)
      if (!match) continue
      const label = match[3].trim().replace(/[.,;]+$/, '')
      if (!label) continue
      stats.push({ value: match[1], unit: match[2].toLowerCase(), label })
    }
    if (stats.length >= MIN_STATS) return stats.slice(0, MAX_STATS)
  }

  return []
}

/** Nối các block Portable Text thành một chuỗi phẳng để dò. */
export function blocksToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block: any) =>
      Array.isArray(block?.children)
        ? block.children.map((child: any) => child?.text ?? '').join('')
        : '',
    )
    .filter(Boolean)
    .join('\n')
}
