import { Playfair_Display, Be_Vietnam_Pro } from 'next/font/google'

/**
 * Bộ đôi chữ của bản redesign (Claude Design — "Royal Ha Long Home v2 Light"):
 * Playfair Display cho tiêu đề, Be Vietnam Pro cho phần còn lại.
 *
 * Trước bản này site nạp BỐN họ chữ (Arsenal, Inter, Cormorant, Fahkwang)
 * nhưng `--font-accent` (Cormorant) và `--font-alt` (Fahkwang) không được
 * một component nào dùng — grep toàn bộ `components/` + `app/` chỉ thấy
 * chúng ở chính dòng khai báo trong `globals.css`. Hai họ chữ đó bị tải rồi
 * bỏ đi, nên bỏ hẳn thay vì đổi tên sang font mới.
 *
 * `subsets` PHẢI có 'vietnamese': toàn bộ nội dung site là tiếng Việt có dấu
 * ("CẢM NHẬN THIẾT KẾ HIỆN ĐẠI…"). Thiếu subset này trình duyệt rơi về font
 * hệ thống cho mọi ký tự có dấu — chữ trong cùng một dòng sẽ lệch nhau.
 *
 * Playfair cần cả `italic`: bản thiết kế in nghiêng cụm "Di sản thế giới"
 * trong tiêu đề hero và toàn bộ trích dẫn của khách ở khối đánh giá. Không
 * khai style italic, trình duyệt tự làm nghiêng giả (skew) — trông gãy ở cỡ
 * chữ lớn của serif.
 */
export const display = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-playfair',
})

export const body = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-be-vietnam',
})
