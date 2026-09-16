import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES, DEFAULT_LOCALE } from './lib/i18n'

// `(?=\/|$)` chặn biên: không có nó, `/studio-tour` hay `/apiary` cũng khớp
// vì chỉ so khớp tiền tố, không phải toàn bộ segment đầu tiên.
const SKIP_PREFIX = /^\/(?:studio|api|_next)(?=\/|$)/

// Danh sách liệt kê tường minh trước đây (`favicon.ico|robots.txt|
// sitemap.xml`) chỉ chặn ĐÚNG BA file đó — mọi file khác trong `public/`
// (vd. `/leaflet/marker-icon.png`) vẫn bị redirect locale (308 -> `/vi/...`)
// rồi 404, vì middleware match TRƯỚC static file serving của Next. Lần sửa
// favicon trước đóng đúng MỘT instance của lớp lỗi này (favicon có test),
// bỏ ngỏ mọi asset khác — xác nhận thật: `/leaflet/marker-icon.png` (Leaflet
// tự fetch icon này, không qua bất kỳ <link>/<img> nào code kiểm được) và
// icon PWA cũng 404 cùng kiểu. Chặn đúng THEO HÌNH DẠNG (có phần mở rộng file
// ở segment cuối path) thay vì liệt kê từng tên — đóng cả lớp lỗi, không chỉ
// từng instance bị bắt được.
function isStaticAssetPath(pathname: string): boolean {
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1)
  return /\.[a-zA-Z0-9]+$/.test(lastSegment)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    SKIP_PREFIX.test(pathname) ||
    pathname.startsWith('/_') ||
    pathname.startsWith('/.well-known') ||
    isStaticAssetPath(pathname)
  ) {
    return NextResponse.next()
  }

  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  )
  if (hasLocale) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  // 308 (permanent): NextResponse.redirect() mặc định là 307 (tạm thời), nhưng
  // ghi chú thiết kế ở trên nói rõ đây phải là redirect vĩnh viễn cho SEO.
  return NextResponse.redirect(url, 308)
}

/**
 * Matcher phải LOẠI SẴN đúng những path mà hàm trên vốn đã bỏ qua.
 *
 * Bản trước là `'/((?!_next/static|_next/image).*)'` — chỉ chừa hai đường
 * `_next`, nên middleware vẫn CHẠY cho `/api/*`, `/studio/*`, `/favicon.ico`,
 * `/robots.txt`, `/sitemap.xml` và mọi file trong `public/` (ô bản đồ, icon
 * Leaflet, icon PWA…). Hàm return sớm ngay lập tức, nhưng trên Vercel thì
 * lần chạy ĐÃ TÍNH RỒI: Edge Middleware tính theo lượt gọi, không theo việc
 * nó làm gì. Một lượt xem trang chủ kéo theo hàng chục request asset, mỗi
 * cái một lượt gọi vô ích.
 *
 * Bốn nhánh loại trừ dưới đây là bản dịch nguyên văn của bốn điều kiện
 * return sớm trong hàm. Giữ CẢ HAI chỗ là cố ý, không phải trùng lặp thừa:
 * matcher cắt chi phí, các điều kiện trong hàm giữ đúng hành vi nếu sau này
 * ai đó nới matcher ra. Sửa một bên thì phải xem lại bên kia.
 *
 * `.*\.[a-zA-Z0-9]+$` khớp đúng khái niệm "có phần mở rộng file" của
 * `isStaticAssetPath()` — chặn theo HÌNH DẠNG chứ không liệt kê từng tên,
 * vì lý do đã ghi ở ghi chú của hàm đó.
 */
export const config = {
  matcher: ['/((?!api(?:/|$)|studio(?:/|$)|_|\\.well-known|.*\\.[a-zA-Z0-9]+$).*)'],
}
