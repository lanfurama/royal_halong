/**
 * Soi độ phủ 6 ngôn ngữ trên toàn dataset.
 *
 * `npx tsx scripts/content/audit.ts`            — bảng tổng hợp mọi document
 * `npx tsx scripts/content/audit.ts page.culinary`  — liệt kê từng field còn thiếu
 *
 * Dùng chung một định nghĩa "thế nào là field đa ngữ" với
 * `assertFullyTranslated()` trong `write.ts`: object mà MỌI khoá không bắt đầu
 * bằng `_` đều là mã locale. Đây là cách duy nhất nhận ra `localeString` /
 * `localeText` / `localeBlock` / `localeSlug` khi đọc qua API — dữ liệu trả về
 * không mang `_type` cho ba kiểu đầu.
 */
import { LOCALES } from '../../lib/i18n'
import { writeClient } from '../import/sanityClient'

type Hole = { path: string; missing: string[] }

/**
 * `slug` KHÔNG tính là thiếu bản dịch.
 *
 * `localeSlug` được thiết kế để trống ở locale khác `vi`: `resolveSlug()` /
 * `resolveRouteSlug()` (lib/routes.ts) tự rơi về đường dẫn tiếng Việt, và
 * schema ghi rõ điều đó. Một site khách sạn giữ NGUYÊN một đường dẫn cho cả
 * sáu ngôn ngữ là lựa chọn có chủ đích — `/ja/culinary` dễ chia sẻ và dễ đối
 * chiếu hơn `/ja/ryori`, và không phải làm 5 lần chuyển hướng khi đổi tên.
 *
 * Trước khi có ngoại lệ này, mọi document có đường dẫn đều báo
 * `slug thiếu: en,zh,ko,ja,th` vĩnh viễn, nên tiêu chí "0 lỗ" không bao giờ
 * đạt được và con số đếm mất hết ý nghĩa.
 */
const IGNORED_PATHS = [/(^|\.)slug$/]

const SKIP_TYPES = new Set(['sanity.imageAsset', 'sanity.fileAsset'])

function isLocaleObject(node: Record<string, unknown>): boolean {
  const keys = Object.keys(node).filter((k) => !k.startsWith('_'))
  return keys.length > 0 && keys.every((k) => (LOCALES as readonly string[]).includes(k))
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function findHoles(doc: unknown): Hole[] {
  const holes: Hole[] = []
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`))
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (isLocaleObject(obj)) {
      if (IGNORED_PATHS.some((re) => re.test(path))) return
      const missing = LOCALES.filter((l) => isBlank(obj[l]))
      if (missing.length) holes.push({ path: path || '(gốc)', missing })
      return
    }
    for (const k of Object.keys(obj)) {
      if (k.startsWith('_')) continue
      walk(obj[k], path ? `${path}.${k}` : k)
    }
  }
  walk(doc, '')
  return holes
}

/**
 * Field ảnh mà component LUÔN render với prop `decorative`, tức `alt=""`.
 *
 * `alt` rỗng ở những chỗ này là ĐÚNG WCAG, không phải thiếu sót: ảnh nền hero
 * và dải CTA chỉ là mặt nền cho chữ nằm lên (tiêu đề ngay cạnh đã nói hết nội
 * dung); biểu tượng tiện nghi phòng đứng cạnh chính cái nhãn chữ của nó ("Wifi",
 * "Bồn tắm"), đọc alt nữa là screen reader lặp hai lần; logo và badge Bộ Công
 * Thương có tên truy cập đặt trên chính thẻ `<a>` bọc ngoài.
 *
 * Không tách riêng nhóm này thì bản soi báo "80/360 ảnh thiếu alt" trong khi
 * thực tế cả 80 đều đúng chuẩn — một con số sai làm người đọc đi sửa thứ
 * không hỏng, hoặc tệ hơn, quen với việc bỏ qua cảnh báo.
 */
const DECORATIVE_PATHS = [
  /(^|\.)background$/, // heroSection, ctaBandSection
  /(^|\.)logo$/,
  /(^|\.)logoLight$/,
  /(^|\.)motBadge$/,
  /(^|\.)features\[\d+\]\.icon$/, // biểu tượng tiện nghi phòng
]

/** Đếm `figure` thiếu `alt` — tách riêng ảnh trang trí (alt rỗng là đúng). */
function countImagesWithoutAlt(doc: unknown): {
  total: number
  withoutAlt: number
  decorative: number
} {
  let total = 0
  let withoutAlt = 0
  let decorative = 0
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`))
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (obj._type === 'figure' || (obj._type === 'image' && obj.asset)) {
      total += 1
      if (DECORATIVE_PATHS.some((re) => re.test(path))) {
        decorative += 1
        return
      }
      const alt = obj.alt as Record<string, unknown> | undefined
      if (!alt || LOCALES.some((l) => isBlank(alt[l]))) withoutAlt += 1
      return
    }
    for (const k of Object.keys(obj)) {
      if (k.startsWith('_')) continue
      walk(obj[k], path ? `${path}.${k}` : k)
    }
  }
  walk(doc, '')
  return { total, withoutAlt, decorative }
}

async function main() {
  const target = process.argv[2]

  if (target) {
    const doc = await writeClient.fetch(`*[_id == $id][0]`, { id: target })
    if (!doc) {
      console.error(`Không có document "${target}"`)
      process.exit(1)
    }
    const holes = findHoles(doc)
    const img = countImagesWithoutAlt(doc)
    console.log(
      `${target}  —  ${holes.length} field thiếu bản dịch, ${img.withoutAlt}/${img.total - img.decorative} ảnh nội dung thiếu alt (${img.decorative} ảnh trang trí, alt rỗng là đúng)\n`,
    )
    for (const h of holes) console.log(`  ${h.path}\n      thiếu: ${h.missing.join(', ')}`)
    process.exit(holes.length ? 1 : 0)
  }

  const docs: any[] = await writeClient.fetch(
    `*[!(_id in path("_.**")) && !(_type in $skip)] | order(_type asc, _id asc)`,
    { skip: [...SKIP_TYPES] },
  )

  let totalHoles = 0
  let totalImages = 0
  let totalNoAlt = 0
  let totalDecorative = 0
  const rows: string[] = []

  for (const doc of docs) {
    const holes = findHoles(doc)
    const img = countImagesWithoutAlt(doc)
    totalHoles += holes.length
    totalImages += img.total
    totalNoAlt += img.withoutAlt
    totalDecorative += img.decorative
    const flag = holes.length === 0 ? '✓' : '✗'
    rows.push(
      `${flag} ${doc._id.padEnd(52)} dịch thiếu: ${String(holes.length).padStart(3)}   ảnh: ${String(img.total).padStart(3)}  thiếu alt: ${String(img.withoutAlt).padStart(3)}  (trang trí: ${String(img.decorative).padStart(2)})`,
    )
  }

  console.log(rows.join('\n'))
  console.log(
    `\n${docs.length} document · ${totalHoles} field còn thiếu bản dịch · ` +
      `${totalNoAlt}/${totalImages - totalDecorative} ảnh NỘI DUNG chưa đủ alt 6 ngôn ngữ · ` +
      `${totalDecorative} ảnh trang trí (alt rỗng là đúng chuẩn)`,
  )
  process.exit(totalHoles ? 1 : 0)
}

main()
