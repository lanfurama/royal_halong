import { Lora } from 'next/font/google'

/**
 * Toàn site dùng DUY NHẤT một họ chữ: Lora (serif).
 *
 * Trước bản này là bộ đôi Playfair Display (tiêu đề) + Be Vietnam Pro (thân
 * bài). Nay cả `--font-display` lẫn `--font-body` trong `app/globals.css`
 * đều trỏ về đây, nên chỉ còn một file font phải tải.
 *
 * `subsets` PHẢI có 'vietnamese': toàn bộ nội dung site là tiếng Việt có dấu
 * ("CẢM NHẬN THIẾT KẾ HIỆN ĐẠI…"). Thiếu subset này trình duyệt rơi về font
 * hệ thống cho mọi ký tự có dấu — chữ trong cùng một dòng sẽ lệch nhau.
 *
 * Cần cả `italic`: bản thiết kế in nghiêng cụm "Di sản thế giới" trong tiêu
 * đề hero và toàn bộ trích dẫn của khách ở khối đánh giá. Không khai style
 * italic, trình duyệt tự làm nghiêng giả (skew) — trông gãy ở cỡ chữ lớn
 * của serif.
 *
 * KHÔNG khai `weight`: Lora là font biến thiên (trục `wght` 400–700), nên
 * bỏ trống `weight` cho ra đúng một file phủ cả dải — không phải liệt kê
 * từng mức như font tĩnh. Dải này vẫn phủ đủ mọi mức site đang yêu cầu: 400
 * (tiêu đề + thân bài), 500/600 (nhãn, nút), 700 (rule ghim `strong` trong
 * `globals.css`). Không còn mức nào bị làm đậm giả.
 */
export const lora = Lora({
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-lora',
})
