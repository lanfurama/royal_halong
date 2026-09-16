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
/**
 * Danh sách weight dưới đây được chốt bằng ĐO, không phải đoán: quét
 * `getComputedStyle` trên 8 trang của bản production (`/vi`, casino, deluxe,
 * news, our-gallery, convention, reservation, offers) rồi đối chiếu với
 * trạng thái `document.fonts`.
 *
 * Đã BỎ vì không trang nào dùng (cả 8 trang đều báo `unloaded`):
 * - Playfair Display 500
 * - Be Vietnam Pro 300
 *
 * Đã THÊM `700` cho Be Vietnam Pro: quét thấy trình duyệt yêu cầu weight
 * 700 và 900 ở 2/8 trang trong khi config cũ dừng ở 600, nên nó phải LÀM ĐẬM
 * GIẢ (kéo giãn nét). Nguồn là thẻ `<strong>` trong nội dung Sanity —
 * `font-weight: bolder` tính tương đối so với chữ xung quanh, nên trong một
 * đoạn đã 600 thì `bolder` nhảy lên 900. Khai 700 làm nó có nét thật để
 * dùng; xem thêm rule ghim `strong` trong `globals.css`.
 *
 * Playfair chỉ thật sự cần italic ở weight 400 (trích dẫn khách), nhưng
 * `next/font` áp `style` cho MỌI weight — không khai riêng theo từng cặp
 * được. Ba weight × hai style là mức nhỏ nhất còn đúng.
 */
export const display = Playfair_Display({
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-playfair',
})

export const body = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-be-vietnam',
})
