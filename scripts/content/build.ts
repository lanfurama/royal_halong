/**
 * Bộ dựng nội dung đa ngữ cho Sanity.
 *
 * Vì sao có file này: nội dung của sáu trang lớn được viết tay bằng script
 * (Studio không hợp để nhập 6 ngôn ngữ × hàng trăm field). Nếu mỗi script tự
 * dựng object thì mỗi nơi sẽ tự đặt `_key` một kiểu và Sanity từ chối mảng
 * thiếu `_key` — đây là lỗi tốn thời gian nhất khi ghi bằng API. Mọi helper ở
 * đây tự sinh `_key` ổn định.
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { assetIdFor } from './assets'

export type L<T = string> = Partial<Record<Locale, T>>

/** Bắt buộc đủ sáu ngôn ngữ — dùng cho mọi chuỗi hiển thị.
 * `loc({vi:'…', en:'…', zh:'…', ko:'…', ja:'…', th:'…'})` */
export function loc(v: Record<Locale, string>): Record<Locale, string> {
  for (const l of LOCALES) {
    if (!v[l] || !v[l].trim()) throw new Error(`loc(): thiếu bản dịch "${l}" cho ${JSON.stringify(v.vi ?? v.en)}`)
  }
  return v
}

let keyCounter = 0
/** `_key` ổn định trong một lần chạy — Sanity đòi mọi phần tử mảng phải có. */
export function key(prefix = 'k'): string {
  keyCounter += 1
  return `${prefix}${keyCounter.toString(36)}`
}
export function resetKeys() {
  keyCounter = 0
}

/** Một đoạn Portable Text. */
export function p(text: string, style = 'normal') {
  return {
    _key: key('b'),
    _type: 'block',
    style,
    markDefs: [],
    children: [{ _key: key('s'), _type: 'span', text, marks: [] }],
  }
}

/** Một mục danh sách Portable Text (`bullet`). */
export function li(text: string) {
  return { ...p(text), listItem: 'bullet', level: 1 }
}

/** Khối văn bản đa ngữ: mỗi ngôn ngữ là một mảng đoạn.
 * `blockLoc({vi:['đoạn 1','đoạn 2'], en:[...], ...})` */
export function blockLoc(v: Record<Locale, string[]>): Record<Locale, unknown[]> {
  const out = {} as Record<Locale, unknown[]>
  for (const l of LOCALES) {
    const paras = v[l]
    if (!paras || paras.length === 0) throw new Error(`blockLoc(): thiếu bản dịch "${l}"`)
    out[l] = paras.map((t) => (t.startsWith('- ') ? li(t.slice(2)) : p(t)))
  }
  return out
}

/**
 * Ảnh. `name` là TÊN FILE trong bản clone (`Royal-Halong-Hotel-Restaurant-04.jpg`);
 * hàm tự tra `assetId`. Ném lỗi nếu không tìm thấy — thà đứng script còn hơn
 * đẩy lên Sanity một `figure` trỏ vào asset không tồn tại rồi trang trắng ảnh.
 */
export function fig(
  name: string,
  alt: Record<Locale, string>,
  caption?: Record<Locale, string>,
) {
  const id = assetIdFor(name)
  if (!id) throw new Error(`fig(): không có ảnh "${name}" trong scripts/import/out/assets.json`)
  return {
    _type: 'figure',
    _key: key('img'),
    asset: { _type: 'reference', _ref: id },
    alt: loc(alt),
    ...(caption ? { caption: loc(caption) } : {}),
  }
}

/**
 * Liên kết NỘI BỘ. Schema `link` giải đường dẫn qua `reference->slug`
 * (xem `LINK` trong `sanity/lib/queries.ts`), KHÔNG qua `href` — `href` chỉ
 * dùng cho địa chỉ ngoài. Truyền `_id` của document đích
 * (`page.culinary`, `room.deluxe`, `offer.…`).
 */
export function linkTo(docId: string, label: Record<Locale, string>) {
  return {
    _type: 'link',
    kind: 'internal',
    reference: { _type: 'reference', _ref: docId },
    label: loc(label),
  }
}

/** Liên kết NGOÀI (http/mailto/tel). */
export function linkOut(href: string, label: Record<Locale, string>, blank = true) {
  return { _type: 'link', kind: 'external', href, label: loc(label), blank }
}
