/**
 * Đo TƯƠNG PHẢN THẬT của chữ trắng trên thẻ ảnh (`.scrim-card` / `.scrim-bottom`).
 *
 * `npx tsx scripts/content/check-scrim.ts [đường-dẫn…]`
 *
 * Vì sao phải chụp màn hình rồi lấy mẫu pixel, thay vì tính từ CSS: nền sau
 * chữ là ẢNH thật phủ một lớp gradient bán trong suốt. Không có "màu nền" nào
 * để đọc ra từ `getComputedStyle` — kết quả phụ thuộc vào đúng những pixel
 * ảnh nằm dưới đúng dòng chữ đó. Mọi con số tương phản ghi trong
 * `app/globals.css` cho `.scrim-*` đều đo bằng cách này.
 *
 * Cách làm: ẩn chữ đi (`visibility: hidden`, vẫn giữ nguyên bố cục) rồi chụp,
 * nên thứ lấy mẫu đúng là nền mà chữ nằm lên. Giải mã PNG bằng
 * `createImageBitmap` NGAY TRONG trình duyệt — repo không có gói giải mã PNG
 * nào ở Node, và thêm một dependency chỉ để chạy kiểm tra là không đáng.
 */
import { chromium } from '@playwright/test'

const PATHS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/vi', '/vi/culinary', '/en/culinary', '/vi/experiences', '/vi/wedding', '/vi/offers']

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
/** Ngưỡng WCAG AA cho chữ thường. Tiêu đề thẻ 20–24px chưa đạt "chữ lớn"
 * (>=24px đậm / >=18.66px bold), nên dùng 4.5 chứ không phải 3. Tiêu đề dải
 * CTA thì to hơn ngưỡng đó và chỉ cần 3:1 — script vẫn đo theo 4.5 cho gọn,
 * nên một dòng 3.x:1 ở tiêu đề LỚN là cảnh báo chứ chưa chắc là lỗi. */
const AA = 4.5

async function main() {
  const browser = await chromium.launch()
  // `reducedMotion: 'reduce'` là BẮT BUỘC, không phải tuỳ chọn cho đẹp:
  // `components/ui/Reveal.tsx` làm mờ-và-trượt nội dung khi nó lọt vào khung
  // nhìn. Cuộn một thẻ ra giữa màn hình chính là thứ kích hoạt hiệu ứng đó,
  // nên tấm ảnh chụp ngay sau khi cuộn bắt được thẻ đang ở GIỮA CHỪNG đường
  // trượt — lệch vài chục pixel so với khung mà script vừa đo. Hậu quả: phần
  // tử ĐẦU TIÊN của mỗi trang luôn báo ~2.5:1 trong khi các phần tử sau đó,
  // đã trượt xong, báo ~6:1 trên cùng một lớp phủ. Một con số sai chỉ ở phần
  // tử đầu tiên là loại sai khó ngờ nhất.
  //
  // Mọi hiệu ứng trong dự án đều tôn trọng `prefers-reduced-motion` (xem các
  // lớp `motion-reduce:` rải khắp component), nên tắt chuyển động cho ra đúng
  // trạng thái cuối, tức thì.
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })

  // `tsx` biên dịch file này bằng esbuild với `keepNames`, nên mỗi hàm mũi tên
  // bị bọc thành `__name(fn, 'tên')`. Playwright tuần tự hoá thân hàm truyền
  // vào `page.evaluate()` rồi chạy nó TRONG TRÌNH DUYỆT, nơi không có helper
  // `__name` -> `ReferenceError: __name is not defined`. Khai một bản vô hại
  // trước khi trang tải là cách gọn nhất; sửa cấu hình esbuild sẽ ảnh hưởng
  // tới mọi script khác trong repo.
  await page.addInitScript(() => {
    // @ts-expect-error — vá thời gian chạy cho esbuild keepNames
    globalThis.__name = globalThis.__name ?? ((fn: unknown) => fn)
  })

  let failures = 0

  for (const path of PATHS) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    // Ép MỌI ảnh nạp ngay rồi CHỜ tới khi nạp xong.
    //
    // Chỉ cuộn qua một lượt là không đủ: ảnh chụp `fullPage` khiến Chromium
    // đổi chiều cao khung nhìn, `next/image` đánh giá lại `loading="lazy"` và
    // ảnh dưới nếp gấp có thể CHƯA vẽ vào lúc chụp. Khi đó script lấy mẫu
    // trúng nền section (`#f3ebdb`) thay vì bức ảnh, rồi báo 1.19:1 cho một
    // cái thẻ thật ra hiển thị hoàn toàn bình thường — đúng thứ đã xảy ra
    // với lưới thẻ trang Tiệc cưới, đã đối chứng bằng ảnh chụp tận mắt.
    await page.evaluate(() => {
      for (const img of document.images) img.loading = 'eager'
    })
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo(0, 0)
    })
    await page
      .waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, {
        timeout: 20_000,
      })
      .catch(() => console.log(`  (cảnh báo: còn ảnh chưa nạp xong ở ${path})`))
    await page.waitForTimeout(400)

    // Danh sách phần tử chữ cần đo, kèm một khoá để tìm lại chúng sau khi cuộn.
    const count = await page.evaluate(() => {
      // Hai KIỂU đặt chữ khác nhau, phải gom cả hai:
      //  - `.scrim-card` / `.scrim-bottom`: lớp phủ BỌC chính khối chữ, nên
      //    chữ là con của nó.
      //  - `.scrim-band` / `.scrim-feature`: lớp phủ trải kín khung ảnh, chữ
      //    là ANH EM nằm trong `<Container>` bên cạnh. Tìm chữ bên trong lớp
      //    phủ sẽ không ra gì — đúng lý do dải CTA lọt lưới cho tới giờ.
      const nested = [...document.querySelectorAll('.scrim-bottom, .scrim-card')] as HTMLElement[]
      const sibling = [...document.querySelectorAll('.scrim-band, .scrim-feature')]
        .map((el) => el.closest('section') as HTMLElement | null)
        .filter((el): el is HTMLElement => Boolean(el))

      let n = 0
      for (const scrim of [...nested, ...sibling]) {
        for (const el of [...scrim.querySelectorAll('h2, h3, p, a')] as HTMLElement[]) {
          // Bỏ phần tử BỌC phần tử chữ khác: `HomeFeatureDuo` gói cả thẻ vào
          // một `<a>`, nên khung của nó trùm cả khoảng nền trang bên ngoài
          // bức ảnh — lấy mẫu trên khung đó luôn chạm nền kem.
          if (el.querySelector('h1, h2, h3, h4, p, a')) continue
          const b = el.getBoundingClientRect()
          if (b.width < 8 || b.height < 8) continue
          // `HomeFeatureDuo` gói CẢ THẺ vào một `<a>` chỉ chứa `<span>`/`<div>`,
          // nên bộ lọc "phần tử lá" ở trên không bắt được. Một liên kết chữ
          // thật không bao giờ cao quá vài dòng — khung cao hơn thế là khung
          // của cả thẻ, và lấy mẫu trên nó sẽ chạm nền trang bên ngoài ảnh.
          if (el.tagName === 'A' && b.height > 120) continue
          el.setAttribute('data-scrim-probe', String(n))
          n += 1
        }
      }
      return n
    })

    if (!count) {
      console.log(`\n${path} — không có thẻ ảnh có chữ đè`)
      await page.reload({ waitUntil: 'domcontentloaded' })
      continue
    }

    // Ẩn chữ (giữ nguyên bố cục) để lấy mẫu đúng NỀN mà chữ nằm lên.
    await page.addStyleTag({
      content: '[data-scrim-probe]{visibility:hidden !important}',
    })
    await page.waitForTimeout(200)

    console.log(`\n${path}`)

    // Đo TỪNG phần tử: cuộn nó vào khung nhìn rồi chụp đúng khung nhìn đó.
    //
    // Trước đây script chụp `fullPage` một lần rồi quy toạ độ tài liệu sang
    // toạ độ ảnh. Cách đó nhanh hơn nhưng có quá nhiều chỗ lệch âm thầm
    // (chiều cao ảnh so với `scrollHeight`, devicePixelRatio, header
    // `position: fixed` bị ghép lại khi cuộn) — và khi lệch thì nó không báo
    // sai, nó báo "ngoài khung nhìn" cho cả trang. Cuộn từng phần tử chậm
    // hơn nhưng toạ độ luôn là toạ độ khung nhìn thật.
    for (let i = 0; i < count; i += 1) {
      // Cuộn sao cho phần tử nằm GIỮA khung nhìn, không dùng
      // `scrollIntoViewIfNeeded()`: hàm đó dừng ngay khi phần tử vừa lọt vào
      // khung, nên nó hay để phần tử nằm sát mép trên — ngay dưới header
      // `position: fixed` cao 128px. Ảnh chụp khi đó có nền header đè lên
      // chữ, và script báo một con số tương phản của HEADER chứ không phải
      // của bức ảnh. Đúng thứ vừa làm thẻ "Ha Long Ball Room" hiện 2.38:1.
      await page.evaluate((index) => {
        const el = document.querySelector(`[data-scrim-probe="${index}"]`)
        el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
      }, i)
      await page.waitForTimeout(150)

      const box = await page.evaluate((index) => {
        const el = document.querySelector(`[data-scrim-probe="${index}"]`) as HTMLElement | null
        if (!el) return null
        const b = el.getBoundingClientRect()
        return {
          x: Math.round(b.x), y: Math.round(b.y),
          w: Math.round(b.width), h: Math.round(b.height),
          text: (el.tagName + ' ' + (el.textContent ?? '').trim()).slice(0, 34),
        }
      }, i)
      // 140px = chiều cao header (128px) cộng lề an toàn. Phần tử nằm trong
      // dải đó bị chính header che trong ảnh chụp.
      if (!box || box.y < 140 || box.y + box.h > 980) {
        console.log(`  – (không đưa ra khỏi vùng header được) ${box?.text ?? i}`)
        continue
      }

      const shot = (await page.screenshot({ type: 'png' })).toString('base64')
      const measured = await page.evaluate(
        async ({ shot, box }) => {
          const blob = await (await fetch(`data:image/png;base64,${shot}`)).blob()
          const bitmap = await createImageBitmap(blob)
          const canvas = document.createElement('canvas')
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(bitmap, 0, 0)
          const scale = bitmap.width / window.innerWidth

          const lin = (c: number) => {
            c /= 255
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
          }
          const contrast = (r: number, g: number, b: number) =>
            1.05 / (0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) + 0.05)

          const x0 = Math.max(0, Math.round(box.x * scale))
          const y0 = Math.max(0, Math.round(box.y * scale))
          const w = Math.min(Math.round(box.w * scale), canvas.width - x0)
          const h = Math.min(Math.round(box.h * scale), canvas.height - y0)
          if (w < 2 || h < 2) return null

          const data = ctx.getImageData(x0, y0, w, h).data
          let worst = Infinity
          let px = ''
          for (let i = 0; i < data.length; i += 4 * 3) {
            const c = contrast(data[i], data[i + 1], data[i + 2])
            if (c < worst) {
              worst = c
              px = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`
            }
          }
          return { worst, px }
        },
        { shot, box },
      )

      if (!measured) {
        console.log(`  – (không đo được) ${box.text}`)
        continue
      }
      const mark = measured.worst >= AA ? '✓' : measured.worst >= 3 ? '~' : '✗'
      if (measured.worst < AA) failures += 1
      console.log(`  ${mark} ${measured.worst.toFixed(2)}:1  ${measured.px.padEnd(18)} ${box.text}`)
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
  }

  await browser.close()
  console.log(
    failures
      ? `\n${failures} chỗ chữ trắng chưa đạt ${AA}:1 trên nền ảnh.`
      : `\nMọi chữ đè ảnh đều đạt >= ${AA}:1.`,
  )
  process.exit(failures ? 1 : 0)
}

main()
