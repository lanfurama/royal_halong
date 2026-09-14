import { resolve } from 'node:path'
import { stripSizeSuffix } from '../assets'
import type { ParsedImageRef } from '../types'

/**
 * Chuyển chuỗi tiếng Việt có dấu thành slug ASCII: bỏ dấu, đổi đ/Đ, hạ chữ
 * thường, thay ký tự không phải chữ/số bằng dấu gạch ngang.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Theme Salient/Nectar lazy-load ảnh: `src` của `<img>` chỉ là placeholder SVG
 * rỗng (`data:image/svg+xml...`), đường dẫn ảnh THẬT nằm ở `data-nectar-img-src`
 * — dùng chung cho cả `<img>` lẫn `<div>` nền (background-image gán bằng JS lúc
 * chạy, không có trong `src`/`style` tĩnh). Luôn ưu tiên attribute này trước.
 */
export function realSrc(el: { attr(name: string): string | undefined }): string | undefined {
  return el.attr('data-nectar-img-src') ?? el.attr('src')
}

/**
 * `src` trong HTML là đường dẫn tương đối kiểu `../wp-content/uploads/...`.
 * Đổi thành đường dẫn tuyệt đối tới ảnh GỐC trên đĩa (khử hậu tố kích thước).
 */
export function toImageRef(
  src: string | undefined,
  routeDir: string,
): ParsedImageRef | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return undefined
  return { filePath: stripSizeSuffix(resolve(routeDir, src)) }
}
