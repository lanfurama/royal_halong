/**
 * Kiểm tra nhanh mọi trang ở cả sáu ngôn ngữ, qua HTTP thật.
 *
 * `npx tsx scripts/content/check-pages.ts [baseUrl]`   (mặc định http://localhost:3000)
 *
 * Bắt ba lớp lỗi mà `assertFullyTranslated()` KHÔNG thấy được, vì chúng chỉ
 * lộ ra sau khi render:
 *
 * 1. Trang trả mã lỗi ở một locale nào đó (slug locale đó chưa có, section
 *    mới làm sập render, …).
 * 2. **Chữ tiếng Việt lọt sang trang ngôn ngữ khác** — dấu hiệu chắc chắn của
 *    fallback về `vi` do thiếu bản dịch, hoặc chuỗi hardcode trong component.
 *    Đây là lỗi hay gặp nhất và khó thấy nhất bằng mắt khi không biết tiếng Việt.
 * 3. `<img>` thiếu `alt`.
 *
 * Bỏ qua tên riêng được phép giữ nguyên dấu tiếng Việt ở mọi ngôn ngữ
 * (xem `GLOSSARY.md`) — nếu không thì mọi trang đều báo lỗi giả vì chữ
 * "Royal Hạ Long" và "Phúc Viên" xuất hiện khắp nơi.
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { writeClient } from '../import/sanityClient'
import { resolveRouteSlug } from '../../lib/routes'

const BASE = process.argv[2] ?? 'http://localhost:3000'

/** Dấu tiếng Việt — ký tự KHÔNG có trong bảng chữ cái của năm ngôn ngữ kia. */
const VI_DIACRITICS = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹĂÂĐÊÔƠƯ]/

/** Tên riêng giữ nguyên dấu ở mọi ngôn ngữ — không tính là lỗi. */
const ALLOWED = [
  'Hạ Long', 'Phúc Viên', 'Bãi Cháy', 'Quảng Ninh', 'Tiếng Việt',
  'Hoàng Gia', 'Việt Nam',
  // Tên món ăn Việt giữ nguyên dạng gốc ở cả sáu ngôn ngữ (brief nhóm F).
  // Cụm ba chữ phải đứng TRƯỚC 'bề bề': bóc 'bề bề' trước sẽ để lại 'Bún'
  // đứng lẻ và bị tính là chữ Việt lọt sang trang ngôn ngữ khác.
  'Bún bề bề', 'bún bề bề', 'Bún Bề Bề', 'Bề Bề', 'bề bề', 'Bái Tử Long',
  // Nhóm tin tức + pháp lý: ba cụm BẮT BUỘC giữ nguyên tiếng Việt ở cả sáu
  // ngôn ngữ, không phải do thiếu bản dịch.
  //  · Tên chủ tài khoản ngân hàng (trang Phương thức thanh toán và bài cảnh
  //    báo fanpage giả mạo) — dịch đi là lệnh chuyển khoản bị ngân hàng trả
  //    lại, và bài cảnh báo giả mạo mất đúng thứ để khách đối chiếu.
  //  · Tên văn bản luật và cơ quan tài phán Việt Nam trong Chính sách bảo mật
  //    — brief yêu cầu giữ nguyên, kèm phiên âm Latin trong ngoặc ở zh/ko/ja/th.
  'CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA', 'Công ty Cổ phần Quốc tế Hoàng Gia',
  'Công ty Cổ phần Quốc tế', 'CÔNG TY CỔ PHẦN QUỐC TẾ',
  'Nghị định', 'Tòa án nhân dân',
]

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

function viLeaks(html: string): string[] {
  let text = stripTags(html)
  for (const name of ALLOWED) text = text.split(name).join(' ')
  const found = new Set<string>()
  for (const word of text.split(' ')) {
    if (VI_DIACRITICS.test(word) && word.length > 1) found.add(word)
  }
  return [...found].slice(0, 12)
}

function imagesWithoutAlt(html: string): number {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? []
  return imgs.filter((tag) => !/\balt\s*=/.test(tag)).length
}

async function main() {
  const routes: any[] = await writeClient.fetch(`
    *[(_type == "page" || _type == "room" || _type == "post" || _type == "offer") && defined(slug.vi.current)]{
      _id, ${LOCALES.map((l) => `"${l}": slug.${l}.current`).join(', ')}
    } | order(_id asc)
  `)

  let failures = 0
  const rows: string[] = []

  // Trang chủ trước, rồi tới từng route.
  const targets: { id: string; path: (l: Locale) => string | null }[] = [
    { id: '(trang chủ)', path: (l) => `/${l}` },
    ...routes.map((r) => ({
      id: r._id,
      path: (l: Locale) => {
        const slug = resolveRouteSlug(r, l)
        return slug ? `/${l}/${slug}` : null
      },
    })),
  ]

  for (const target of targets) {
    for (const locale of LOCALES) {
      const path = target.path(locale)
      if (!path) continue
      let res: Response
      try {
        res = await fetch(BASE + path)
      } catch (error) {
        rows.push(`✗ ${path.padEnd(58)} không kết nối được (${String(error)})`)
        failures += 1
        continue
      }
      const html = await res.text()
      const problems: string[] = []
      if (!res.ok) problems.push(`HTTP ${res.status}`)
      const noAlt = imagesWithoutAlt(html)
      if (noAlt) problems.push(`${noAlt} <img> thiếu alt`)
      if (locale !== 'vi') {
        const leaks = viLeaks(html)
        if (leaks.length) problems.push(`chữ Việt lọt: ${leaks.join(' ')}`)
      }
      if (problems.length) {
        failures += 1
        rows.push(`✗ ${path.padEnd(58)} ${problems.join(' · ')}`)
      } else {
        rows.push(`✓ ${path}`)
      }
    }
  }

  console.log(rows.join('\n'))
  const bad = rows.filter((r) => r.startsWith('✗')).length
  console.log(`\n${rows.length} lượt kiểm · ${bad} lỗi`)
  process.exit(failures ? 1 : 0)
}

main()
