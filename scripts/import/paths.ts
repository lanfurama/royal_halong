import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/** Gốc repo — scripts/import/ nằm sâu 2 cấp. */
export const ROOT = resolve(here, '../..')
export const UPLOADS_DIR = resolve(ROOT, 'wp-content/uploads')
export const OUT_DIR = resolve(ROOT, 'scripts/import/out')

/**
 * 22 route. Chuỗi rỗng là trang chủ (index.html ở gốc);
 * còn lại là tên thư mục, cũng chính là slug gốc cần giữ cho SEO.
 */
export const ROUTES = [
  '',
  'luu-tru-phong-khach-san-villas',
  'deluxe',
  'premium',
  'villas-deluxe',
  'villas-suite',
  'casino',
  'culinary',
  'experiences',
  'wedding',
  'royal-international-convention-palace',
  'our-gallery',
  'offers',
  'reservation',
  'news',
  'our-announcement',
  'payment-methods',
  'privacy-policy',
  'terms-and-conditions',
  'canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
  'quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh',
  'thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong',
] as const

export function routeToHtmlPath(route: string): string {
  return route === '' ? resolve(ROOT, 'index.html') : resolve(ROOT, route, 'index.html')
}
