/**
 * Đo ngân sách bề ngang của thanh menu ở CẢ SÁU ngôn ngữ.
 *
 * CLAUDE.md § Header: ở 1180px (ngưỡng `nav`, chật nhất) khung 1132px chia
 * cho menu + logo + chip ngôn ngữ + nút đặt phòng, chỉ dư ~138px cho bốn khe.
 * Đổi nhãn menu sang một ngôn ngữ dài hơn là chồng lấn — và đây đúng là chỗ
 * đã hai lần sinh lỗi. Script này đo THẬT bằng trình duyệt thay vì đếm ký tự.
 *
 * `npx tsx scripts/content/check-header.ts [baseUrl]`
 */
// `@playwright/test` chứ không phải `playwright`: repo chỉ có gói đầu là
// dependency trực tiếp (xem package.json), và với pnpm strict node_modules
// thì `import 'playwright'` không resolve được. `@playwright/test` re-export
// nguyên `chromium`.
import { chromium } from '@playwright/test'
import { LOCALES } from '../../lib/i18n'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const WIDTHS = [1180, 1280, 1440]

async function main() {
  const browser = await chromium.launch()
  let problems = 0

  for (const width of WIDTHS) {
    console.log(`\n=== ${width}px ===`)
    const page = await browser.newPage({ viewport: { width, height: 900 } })

    for (const locale of LOCALES) {
      await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('header', { timeout: 15_000 })

      const measured = await page.evaluate(() => {
        // Hàng thật là con TRỰC TIẾP của `.rhl-header-top` (xem Header.tsx) —
        // không phải `header.firstElementChild`, vốn là link "bỏ qua điều
        // hướng" rộng 1px nằm ngoài luồng.
        const row = document.querySelector('header .rhl-header-top > div') as HTMLElement | null
        const header = document.querySelector('header') as HTMLElement | null
        if (!row || !header) return null

        const rowBox = row.getBoundingClientRect()
        const cols = [...row.children].map((c) => {
          const b = c.getBoundingClientRect()
          return { w: Math.round(b.width), left: Math.round(b.left), right: Math.round(b.right) }
        })

        // Chỉ xét control ĐANG HIỆN (menu mobile ẩn ở desktop và ngược lại).
        const controls = ([...row.querySelectorAll('a, button')] as HTMLElement[])
          .map((el) => ({ el, b: el.getBoundingClientRect() }))
          .filter((x) => {
            const style = getComputedStyle(x.el)
            return x.b.width > 1 && x.b.height > 1 && style.visibility !== 'hidden' && style.display !== 'none'
          })

        const overflowing = controls
          .filter((x) => x.b.left < rowBox.left - 1 || x.b.right > rowBox.right + 1)
          .map((x) => x.el.textContent?.trim().slice(0, 28) || x.el.getAttribute('aria-label') || '?')

        const overlaps: string[] = []
        for (let i = 0; i < controls.length; i += 1) {
          for (let j = i + 1; j < controls.length; j += 1) {
            const a = controls[i]
            const c = controls[j]
            if (a.el.contains(c.el) || c.el.contains(a.el)) continue
            const sameRow = Math.abs(a.b.top - c.b.top) < 8
            const overlap = a.b.right > c.b.left + 1 && c.b.right > a.b.left + 1
            if (sameRow && overlap) {
              const name = (el: HTMLElement) =>
                el.textContent?.trim().slice(0, 18) || el.getAttribute('aria-label') || '?'
              overlaps.push(`${name(a.el)} ↔ ${name(c.el)}`)
            }
          }
        }

        // Khe còn lại giữa ba cột grid — con số CLAUDE.md nói là "~138px cho
        // bốn khe" ở 1180px. Dưới 0 là đã chồng.
        const slack = cols.length === 3 ? Math.round(rowBox.width - cols.reduce((n, c) => n + c.w, 0)) : null

        return {
          headerHeight: Math.round(header.getBoundingClientRect().height),
          rowWidth: Math.round(rowBox.width),
          cols: cols.map((c) => c.w),
          slack,
          controlCount: controls.length,
          overflowing,
          overlaps: [...new Set(overlaps)],
        }
      })

      if (!measured) {
        console.log(`  ${locale}: không tìm thấy <header>`)
        problems += 1
        continue
      }

      const bad = measured.overflowing.length + measured.overlaps.length
      if (bad) problems += 1
      const mark = bad ? '✗' : '✓'
      console.log(
        `  ${mark} ${locale}  cao ${measured.headerHeight}px · hàng ${measured.rowWidth}px · cột [${measured.cols.join(' | ')}] · dư ${measured.slack}px · ${measured.controlCount} control`,
      )
      if (measured.overflowing.length) console.log(`      tràn khung: ${measured.overflowing.join(' | ')}`)
      if (measured.overlaps.length) console.log(`      chồng lấn: ${measured.overlaps.join(' | ')}`)
    }

    await page.close()
  }

  await browser.close()
  console.log(problems ? `\n${problems} trường hợp có vấn đề` : '\nKhông có chồng lấn hay tràn khung ở ngôn ngữ nào.')
  process.exit(problems ? 1 : 0)
}

main()
