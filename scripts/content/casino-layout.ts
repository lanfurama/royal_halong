/**
 * Trang CASINO — phần BỐ CỤC.
 *
 * Nội dung và bản dịch sáu ngôn ngữ của `page.casino` do
 * `scripts/content/casino.ts` dựng (phiên khác viết). Script này KHÔNG viết
 * lại `sections`: ghi đè cả mảng sẽ xoá 124 field đa ngữ, trong đó có từng ô
 * của ba bảng luật Baccarat/Roulette — phần tốn công nhất của trang.
 *
 * Nó chỉ làm đúng năm việc, mỗi việc nhắm vào MỘT field:
 *
 *  1. Thêm `facts` cho hero — dải số liệu neo đáy ảnh banner. Giờ mở cửa và
 *     điều kiện vào cửa (hộ chiếu nước ngoài, từ đủ 18 tuổi) là hai thứ gạn
 *     lọc khách, trước đây nằm lẫn giữa trang.
 *  2. Bỏ hai gạch đầu dòng ở khối giới thiệu — chính hai thông tin vừa được
 *     đưa lên hero, để không nói hai lần trên cùng một màn hình. LỌC từ nội
 *     dung đang có, không viết lại: bản dịch năm ngôn ngữ giữ nguyên.
 *  3. Đổi khối thư viện từ `cardGridSection` (6 thẻ) sang
 *     `galleryCarouselSection` trỏ vào `galleryAlbum.casino` — theo bản thiết
 *     kế đã chốt với chủ dự án.
 *  4. Thêm nút gọi `tel:` cho khối liên hệ. Hai số điện thoại đang nằm trong
 *     gạch đầu dòng, không bấm được trên điện thoại.
 *  5. Sắp lại ảnh trong album và bỏ một ảnh trùng khung hình — xem
 *     `GALLERY_ORDER`. Giữ nguyên từng `figure`, không dựng lại cái nào.
 *
 * Chạy: `npx tsx scripts/content/casino-layout.ts`
 * Chạy lại nhiều lần ra cùng kết quả.
 */
import { writeFileSync } from 'node:fs'
import { LOCALES, type Locale } from '../../lib/i18n'
import { linkOut } from './build'
import { assetIdFor } from './assets'
import { getDoc, writeClient, assertFullyTranslated } from './write'

type Six = Record<Locale, string>
const L = (vi: string, en: string, zh: string, ko: string, ja: string, th: string): Six => ({
  vi,
  en,
  zh,
  ko,
  ja,
  th,
})

const HERO_KEY = 'sec-0'
const INTRO_KEY = 'sec-1'
const GALLERY_KEY = 'sec-2'
const CONTACT_KEY = 'sec-16'

/**
 * Bốn con số của dải hero. Mọi giá trị lấy nguyên văn từ `casino/index.html`
 * (bản clone) — 18 bàn, 62 máy, 24/7, và điều kiện "người quốc tịch nước
 * ngoài, từ đủ 18 tuổi". Không thêm con số nào bản clone không có.
 */
const FACTS: Array<{ key: string; value: Six; label: Six }> = [
  {
    key: 'fact-hours',
    value: L('24/7', '24/7', '24/7', '24/7', '24/7', '24/7'),
    label: L('Mở cửa', 'Open', '全天开放', '연중무휴', '営業時間', 'เปิดบริการ'),
  },
  {
    key: 'fact-tables',
    value: L('18', '18', '18', '18', '18', '18'),
    label: L(
      'Bàn chơi trực tiếp',
      'Live tables',
      '现场赌桌',
      '라이브 테이블',
      'ライブテーブル',
      'โต๊ะเกมสด',
    ),
  },
  {
    key: 'fact-machines',
    value: L('62', '62', '62', '62', '62', '62'),
    label: L(
      'Máy trò chơi điện tử',
      'Gaming machines',
      '电子游戏机',
      '전자 게임기',
      '電子ゲーム機',
      'เครื่องเกมอิเล็กทรอนิกส์',
    ),
  },
  {
    key: 'fact-entry',
    value: L('18+', '18+', '18+', '18+', '18+', '18+'),
    label: L(
      'Hộ chiếu nước ngoài',
      'Foreign passport',
      '持外国护照',
      '외국 여권 소지자',
      '外国パスポート',
      'หนังสือเดินทางต่างชาติ',
    ),
  },
]

const GALLERY_HEADING = L(
  'KHÔNG GIAN CÂU LẠC BỘ',
  'INSIDE THE CLUB',
  '俱乐部空间',
  '클럽 내부',
  'クラブの空間',
  'ภายในคลับ',
)

const CALL_LABEL = L(
  'Gọi hotline VIP',
  'Call the VIP hotline',
  '拨打 VIP 热线',
  'VIP 핫라인 전화',
  'VIPホットラインに電話',
  'โทรสายด่วน VIP',
)

/** Số hotline lấy nguyên văn từ bản clone. Không suy mã quốc gia cho số nội địa. */
const HOTLINE = 'tel:+842033848888'

/**
 * Thứ tự ảnh của `galleryAlbum.casino`, và ảnh bị loại.
 *
 * Bản nhập giữ nguyên thứ tự đánh số của file gốc (01, 02, 03, 05…), nên hai
 * chỗ đọc ra như lặp lại:
 *
 *  - `Casino-02` và `Casino-03` là CÙNG MỘT khung hình, người chụp chỉ dịch
 *    sang vài bước: cùng bàn nỉ xanh ở tiền cảnh, cùng biển CASHIER phía sau.
 *    Đo bằng giao biểu đồ màu (1.00 = trùng khít): **0.88**. Giữ `-02` vì bàn
 *    nằm cân khung hơn và biển CASHIER đọc được; bỏ `-03`.
 *  - `Casino-05` (quầy bar) và `Casino-06` (tủ rượu) là hai chủ thể khác nhau
 *    nhưng cùng phòng, cùng bảng màu — **0.72** — và nằm liền nhau.
 *
 * Thứ tự dưới đây đan xen cảnh RỘNG với cảnh CẬN, và tách hai ảnh quầy bar ra
 * xa nhau. Đo lại toàn bộ các cặp liền nhau sau khi sắp: cặp giống nhất tụt
 * từ 0.88 xuống **0.56**.
 *
 * Nêu theo TÊN FILE chứ không theo chỉ số: chỉ số đổi ngay khi thêm/bớt một
 * ảnh, tên file thì không.
 */
const GALLERY_ORDER = [
  'Royal-Halong-Hotel-Casino-01.jpg', // sảnh rộng, dãy máy điện tử bên trái
  'Royal-Halong-Hotel-Casino-07.jpg', // cận: nhân viên chia bài bên bàn Baccarat
  'Royal-Halong-Hotel-Casino-02.jpg', // sảnh rộng, bàn nỉ xanh + quầy đổi phỉnh
  'Royal-Halong-Hotel-Casino-12.jpg', // cận: bàn Blackjack, tay chia bài
  'Royal-Halong-Hotel-Casino-05.jpg', // quầy bar
  'Royal-Halong-Hotel-Casino-14.jpg', // dãy máy trò chơi điện tử
  'Royal-Halong-Hotel-Casino-11.jpg', // cận: ống xóc xúc xắc trên nỉ xanh
  'Royal-Halong-Hotel-Casino-06.jpg', // tủ rượu gắn gương
  'Royal-Halong-Hotel-Casino-15.jpg', // cận: đặt phỉnh lên bàn cược xúc xắc
  'Royal-Halong-Hotel-Casino-17.jpg', // sảnh rộng nhìn từ lối vào
]

/**
 * Sắp lại ảnh album, GIỮ NGUYÊN từng phần tử `figure` đang có (kể cả `_key`
 * và `alt` sáu ngôn ngữ) — chỉ đổi thứ tự và bỏ bớt. Không dựng lại figure
 * nào: dựng lại là mất `alt` người khác đã dịch tay.
 */
async function reorderGallery() {
  const album = await getDoc('galleryAlbum.casino')
  if (!album) throw new Error('Không có document galleryAlbum.casino')
  const images: any[] = album.images ?? []
  const byAsset = new Map<string, any>()
  for (const image of images) {
    const ref = image?.asset?._ref
    if (ref) byAsset.set(ref, image)
  }

  const next: any[] = []
  const missing: string[] = []
  for (const file of GALLERY_ORDER) {
    const assetId = assetIdFor(file)
    const image = assetId ? byAsset.get(assetId) : undefined
    if (!image) {
      missing.push(file)
      continue
    }
    next.push(image)
    byAsset.delete(assetId!)
  }
  if (missing.length > 0) {
    // Ảnh nêu tên mà album không có -> dừng. Ghi một album thiếu ảnh rồi mới
    // phát hiện là mất `alt` đã dịch của đúng những ảnh đó.
    throw new Error(`Album thiếu ảnh: ${missing.join(', ')}`)
  }

  const dropped = [...byAsset.values()]
  if (next.length === images.length && images.every((img, i) => img === next[i])) {
    console.log('  galleryAlbum.casino: thứ tự đã đúng, không ghi')
    return
  }
  await writeClient
    .patch('galleryAlbum.casino')
    .set({ images: next })
    .commit({ autoGenerateArrayKeys: false })
  console.log(`  galleryAlbum.casino: ${next.length} ảnh, bỏ ${dropped.length}`)
  for (const image of dropped) {
    console.log(`     bỏ: ${image?.alt?.vi?.slice(0, 60) ?? image?.asset?._ref}`)
  }
}

function factsValue() {
  return FACTS.map((fact) => ({
    _key: fact.key,
    _type: 'fact',
    value: fact.value,
    label: fact.label,
  }))
}

/**
 * Bỏ các block gạch đầu dòng ở CUỐI khối giới thiệu.
 *
 * Chỉ chạy khi hình dạng đúng như đang có (đoạn văn trước, gạch đầu dòng sau,
 * và còn lại ít nhất một đoạn văn). Hình dạng khác -> bỏ qua và báo, chứ
 * không cắt bừa: đây là nội dung người khác dịch tay sang năm ngôn ngữ.
 */
function stripTrailingBullets(content: Record<string, any[]>): {
  next: Record<string, any[]>
  removed: number
} {
  const next: Record<string, any[]> = {}
  let removed = 0
  for (const lang of LOCALES) {
    const blocks = content?.[lang]
    if (!Array.isArray(blocks)) continue
    const kept = blocks.filter((b: any) => b?.listItem !== 'bullet')
    if (kept.length === 0 || kept.length === blocks.length) {
      next[lang] = blocks
      continue
    }
    next[lang] = kept
    removed += blocks.length - kept.length
  }
  return { next, removed }
}

async function main() {
  const doc = await getDoc('page.casino')
  if (!doc) throw new Error('Không có document page.casino')
  const sections: any[] = doc.sections ?? []
  const keyOf = (key: string) => sections.findIndex((s) => s?._key === key)

  const heroIndex = keyOf(HERO_KEY)
  const introIndex = keyOf(INTRO_KEY)
  const galleryIndex = keyOf(GALLERY_KEY)
  const contactIndex = keyOf(CONTACT_KEY)
  for (const [name, index] of [
    ['hero', heroIndex],
    ['giới thiệu', introIndex],
    ['thư viện', galleryIndex],
    ['liên hệ', contactIndex],
  ] as const) {
    if (index < 0) throw new Error(`Không tìm thấy section "${name}" — cấu trúc trang đã đổi?`)
  }

  const patch: Record<string, unknown> = {}

  // 1. Dải số liệu hero.
  patch[`sections[_key=="${HERO_KEY}"].facts`] = factsValue()

  // 2. Bỏ hai gạch đầu dòng trùng với dải số liệu.
  const intro = sections[introIndex]
  const { next: introContent, removed } = stripTrailingBullets(intro?.content ?? {})
  if (removed > 0) patch[`sections[_key=="${INTRO_KEY}"].content`] = introContent

  // 3. Thư viện: 6 thẻ -> carousel 11 ảnh.
  const oldGallery = sections[galleryIndex]
  if (oldGallery?._type === 'cardGridSection') {
    // Nội dung thẻ cũ có bản dịch sáu ngôn ngữ do phiên khác viết. Không xoá
    // nó khỏi đĩa cùng lúc xoá khỏi Sanity — xuất ra file để còn dùng lại.
    const backup = `${process.cwd()}/scripts/content/_casino-cardgrid-cu.json`
    writeFileSync(backup, JSON.stringify(oldGallery, null, 2), 'utf8')
    console.log(`  đã lưu khối thẻ cũ ra ${backup}`)
  }
  patch[`sections[_key=="${GALLERY_KEY}"]`] = {
    _key: GALLERY_KEY,
    _type: 'galleryCarouselSection',
    heading: GALLERY_HEADING,
    album: { _type: 'reference', _ref: 'galleryAlbum.casino' },
  }

  // 4. Nút gọi cho khối liên hệ.
  patch[`sections[_key=="${CONTACT_KEY}"].cta`] = linkOut(HOTLINE, CALL_LABEL, false)

  await writeClient.patch('page.casino').set(patch).commit({ autoGenerateArrayKeys: false })
  console.log(`  patched page.casino (${Object.keys(patch).length} field)`)
  if (removed > 0) console.log(`  bỏ ${removed} gạch đầu dòng trùng lặp ở khối giới thiệu`)

  await reorderGallery()

  const holes =
    (await assertFullyTranslated('page.casino')) +
    (await assertFullyTranslated('galleryAlbum.casino'))
  if (holes > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
