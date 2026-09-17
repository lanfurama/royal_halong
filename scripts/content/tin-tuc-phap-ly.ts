/**
 * Nhóm TIN TỨC + TIỆN ÍCH + PHÁP LÝ — dịch đủ sáu ngôn ngữ.
 *
 * Chín document:
 *   page.news, page.our-announcement, page.payment-methods, page.reservation,
 *   page.privacy-policy, page.terms-and-conditions,
 *   post.canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel,
 *   post.quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh,
 *   post.thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong
 *
 * Chạy: `npx tsx scripts/content/tin-tuc-phap-ly.ts`
 * Idempotent — chạy lại nhiều lần ra đúng một kết quả (mọi `_key` đều suy ra
 * từ id khối + vị trí, không sinh ngẫu nhiên).
 *
 * VÌ SAO DỰNG LẠI CẢ `vi` CHỨ KHÔNG CHỈ THÊM NĂM NGÔN NGỮ: Portable Text của
 * năm ngôn ngữ mới phải có cùng cấu trúc khối với `vi` (cùng số đoạn, cùng
 * chỗ xuống dòng danh sách, cùng liên kết). Cách duy nhất bảo đảm điều đó là
 * khai bảng nội dung theo HÀNG — mỗi hàng là một đoạn ở cả sáu ngôn ngữ — rồi
 * sinh khối từ cùng một hàm. Bản `vi` sinh ra ở đây chép NGUYÊN VĂN bản đã
 * import từ HTML clone; các chỗ lệch đã sửa được liệt kê ở `## Sửa dữ liệu`
 * bên dưới.
 *
 * ## Sửa dữ liệu (chỉ dữ liệu máy dùng được: email, URL, số điện thoại)
 * 1. `page.payment-methods` sec-1 — chữ hiện `info@royalhalonghotel.com.com`
 *    và liên kết trỏ `mailto:reservation.nvb@lalya.com` (địa chỉ của một công
 *    ty khác, sót lại từ theme WordPress) → cả hai về `info@royalhalonghotel.com`.
 * 2. `page.terms-and-conditions` sec-5 — `info@oyalhalonghotel.com` (thiếu chữ
 *    r) + cùng liên kết lalya.com → `info@royalhalonghotel.com`.
 * 3. `page.terms-and-conditions` sec-6 — liên kết lalya.com → `info@royalhalonghotel.com`.
 * 4. `page.terms-and-conditions` sec-1 — `Royahalonghotel.com` → `royalhalonghotel.com`.
 * 5. Địa chỉ website của khách sạn để dưới dạng CHỮ THUẦN, không bọc thành
 *    liên kết. `tests/e2e/routes.spec.ts` cấm mọi `href`/`src` trỏ về domain
 *    gốc (và nói rõ domain dưới dạng chữ thì hợp lệ) — một site dựng lại mà
 *    vẫn dẫn khách sang máy chủ cũ là rò rỉ, không phải tiện ích. Riêng bài
 *    cảnh báo trang Facebook giả mạo thì địa chỉ đó CHÍNH LÀ nội dung cần
 *    đọc — khách phải so bằng mắt để nhận ra trang giả — nên chuỗi chữ giữ
 *    nguyên từng ký tự, chỉ bỏ phần `href`.
 * 5. `page.privacy-policy` sec-13, sec-16 — `sales@roalhalonghotel.com` (thiếu
 *    chữ y) → `sales@royalhalonghotel.com`.
 * 6. `page.privacy-policy` sec-15 — `tel:+84904030222/` → `tel:+84904030222`.
 * 7. `post.canh-bao-…` — thân bài bị import dồn thành MỘT đoạn dính liền
 *    ("…đối tác.Để đảm bảo…"). Dựng lại đúng các đoạn/danh sách của bản clone,
 *    không đổi một chữ nào; bỏ tham số theo dõi `fbclid` / `__cft__` khỏi liên kết.
 * 8. `page.terms-and-conditions` sec-2, sec-3 — bỏ đoạn rỗng đứng đầu.
 * 9. `page.terms-and-conditions` sec-7, sec-8 và `page.privacy-policy` sec-4 —
 *    các dòng ngăn bằng `\n` trong cùng một khối bị HTML nuốt thành một dòng
 *    dài; tách thành từng mục riêng.
 * 10. Hai tiêu đề `page.privacy-policy` viết sai dấu "XỦ LÝ" → "XỬ LÝ".
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { patchDoc, getDoc, assertFullyTranslated } from './write'
import { assetIdFor } from './assets'

type Six = Record<Locale, string>
const L = (vi: string, en: string, zh: string, ko: string, ja: string, th: string): Six =>
  ({ vi, en, zh, ko, ja, th })

/* ------------------------------------------------------------------ *
 * Dựng Portable Text từ một dòng đánh dấu tối giản.
 *
 *   '- x'     mục danh sách gạch đầu dòng
 *   '1. x'    mục danh sách đánh số (giữ nguyên `listItem: 'number'` mà bản
 *             import sinh ra từ thẻ <ol> của bản clone)
 *   'h4| x'   tiêu đề cấp 4
 *   **đậm**            in đậm
 *   [nhãn](địa-chỉ)    liên kết
 * ------------------------------------------------------------------ */
const PREFIXES = ['- ', '1. ', 'h4| '] as const

function prefixOf(line: string): string {
  return PREFIXES.find((p) => line.startsWith(p)) ?? ''
}

function spansOf(text: string, kb: string) {
  const children: any[] = []
  const markDefs: any[] = []
  const push = (t: string, marks: string[]) => {
    if (!t) return
    children.push({ _key: `${kb}s${children.length}`, _type: 'span', text: t, marks })
  }
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index), [])
    if (m[1] !== undefined) {
      const mk = `${kb}m${markDefs.length}`
      const href = m[2]
      markDefs.push({ _key: mk, _type: 'link', href, blank: /^https?:/.test(href) })
      const bold = m[1].startsWith('**') && m[1].endsWith('**')
      push(bold ? m[1].slice(2, -2) : m[1], bold ? [mk, 'strong'] : [mk])
    } else {
      push(m[3], ['strong'])
    }
    last = re.lastIndex
  }
  push(text.slice(last), [])
  if (children.length === 0) push('', [])
  return { children, markDefs }
}

function blockOf(id: string, i: number, raw: string) {
  const kb = `${id}-${i}`
  let text = raw
  let listItem: string | undefined
  let style = 'normal'
  if (text.startsWith('- ')) {
    listItem = 'bullet'
    text = text.slice(2)
  } else if (text.startsWith('1. ')) {
    listItem = 'number'
    text = text.slice(3)
  } else if (text.startsWith('h4| ')) {
    style = 'h4'
    text = text.slice(4)
  }
  const { children, markDefs } = spansOf(text, kb)
  return {
    _key: `${kb}b`,
    _type: 'block',
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  }
}

/**
 * Bảng nội dung khai theo HÀNG: mỗi phần tử là một đoạn ở đủ sáu ngôn ngữ.
 * Hàm này ném lỗi nếu một ngôn ngữ thiếu đoạn, hoặc nếu sáu bản dịch của cùng
 * một đoạn không cùng kiểu khối (một bên là mục danh sách, bên kia là đoạn
 * thường) — lỗi đó làm trang tiếng Nhật xuống dòng khác trang tiếng Việt mà
 * không ai nhìn thấy cho tới khi mở đủ sáu locale.
 */
function content(id: string, rows: Six[]): Record<Locale, unknown[]> {
  const out = {} as Record<Locale, unknown[]>
  rows.forEach((row, i) => {
    const kinds = new Set(LOCALES.map((l) => prefixOf(row[l])))
    if (kinds.size !== 1) {
      throw new Error(`content(${id})[${i}]: sáu ngôn ngữ không cùng kiểu khối — ${[...kinds].map((k) => JSON.stringify(k)).join(' / ')}`)
    }
    for (const l of LOCALES) {
      if (!row[l] || !row[l].trim()) throw new Error(`content(${id})[${i}]: thiếu bản dịch "${l}"`)
    }
  })
  for (const l of LOCALES) out[l] = rows.map((row, i) => blockOf(id, i, row[l]))
  return out
}

/** Kiểm tra đủ sáu ngôn ngữ cho một chuỗi hiển thị. */
function six(v: Six, what: string): Six {
  for (const l of LOCALES) {
    if (!v[l] || !v[l].trim()) throw new Error(`${what}: thiếu bản dịch "${l}"`)
  }
  return { ...v }
}

/** `alt` cho ảnh — không tạo figure mới, chỉ gắn mô tả vào ảnh đã có. */
function alt(v: Six, what: string): Six {
  return six(v, `alt(${what})`)
}

/*
 * KHÔNG ghi `slug`. `localeSlug` cố ý chỉ có `vi`: `resolveSlug()` /
 * `resolveRouteSlug()` (lib/routes.ts) tự rơi về đường dẫn tiếng Việt cho năm
 * ngôn ngữ còn lại, nên `/ja/news` và `/vi/news` là cùng một đường dẫn — dễ
 * chia sẻ, dễ đối chiếu, không phải làm năm lần chuyển hướng khi đổi tên.
 * `audit.ts` (IGNORED_PATHS) và `assertFullyTranslated()` đều bỏ qua `slug`
 * vì lý do này. Điền tay `slug` cho sáu ngôn ngữ chỉ tạo thêm URL trùng nội
 * dung.
 */

function seo(metaTitle: Six, metaDescription: Six) {
  return {
    _type: 'seo',
    metaTitle: six(metaTitle, 'seo.metaTitle'),
    metaDescription: six(metaDescription, 'seo.metaDescription'),
  }
}

/**
 * Gắn `alt` vào một `figure` đã có sẵn trong document, sau khi ĐỐI CHIẾU ảnh
 * đó đúng là file mình đã mở ra xem. Không đối chiếu thì một lần ai đó đổi ảnh
 * nền trong Studio là `alt` mô tả sai hoàn toàn thứ đang hiển thị — tệ hơn cả
 * không có `alt`.
 */
function setAlt(figure: any, fileName: string, text: Six, where: string) {
  if (!figure) throw new Error(`setAlt(${where}): không có ảnh`)
  const expected = assetIdFor(fileName)
  if (!expected) throw new Error(`setAlt(${where}): không tra được "${fileName}"`)
  const actual = figure.asset?._ref
  if (actual !== expected) {
    throw new Error(`setAlt(${where}): ảnh đã đổi — mong "${fileName}" (${expected}) nhưng đang là ${actual}`)
  }
  figure.alt = alt(text, where)
}

/* ══════════════════════════════════════════════════════════════════ *
 *  page.news
 * ══════════════════════════════════════════════════════════════════ */

const NEWS_TITLE = L('TIN TỨC', 'NEWS', '新闻', '뉴스', 'ニュース', 'ข่าวสาร')

/** Tên thương hiệu — giữ nguyên ở cả sáu ngôn ngữ (GLOSSARY.md). */
const HOTEL_AND_VILLAS = L(
  'ROYAL HALONG HOTEL & VILLAS',
  'ROYAL HALONG HOTEL & VILLAS',
  'ROYAL HALONG HOTEL & VILLAS',
  'ROYAL HALONG HOTEL & VILLAS',
  'ROYAL HALONG HOTEL & VILLAS',
  'ROYAL HALONG HOTEL & VILLAS',
)

const NEWS_HERO_ALT = L(
  'Đôi khách kéo vali hồng đi qua sảnh khách sạn, bên cạnh vách hoa văn mạ vàng và bình hoa ly trắng',
  'A couple wheeling a pink suitcase through the hotel lobby, past a gilded fretwork screen and a vase of white lilies',
  '一对客人拉着粉色行李箱穿过酒店大堂，经过金色雕花屏风和一瓶白色百合',
  '분홍색 캐리어를 끌고 호텔 로비를 지나는 커플, 금빛 투각 스크린과 흰 백합 화병 옆',
  'ピンクのスーツケースを引いてホテルのロビーを歩くカップル、金色の透かし彫りの衝立と白いユリの花瓶のそば',
  'คู่รักลากกระเป๋าเดินทางสีชมพูผ่านล็อบบี้โรงแรม ข้างฉากฉลุสีทองและแจกันลิลลี่ขาว',
)

const NEWS_SEO = seo(
  L(
    'Tin tức & Báo chí — Royal Hạ Long Hotel',
    'News & press — Royal Ha Long Hotel',
    '新闻与媒体报道 — Royal Ha Long Hotel',
    '뉴스 & 보도자료 — Royal Ha Long Hotel',
    'ニュース・プレス — Royal Ha Long Hotel',
    'ข่าวสารและสื่อ — Royal Ha Long Hotel',
  ),
  L(
    'Tin tức, thông cáo báo chí và thông tin mới nhất từ Royal Hạ Long Hotel & Villas — khách sạn 5 sao bên vịnh Hạ Long, Bãi Cháy, Quảng Ninh.',
    'News, press releases and the latest updates from Royal Ha Long Hotel & Villas — a five-star hotel beside Ha Long Bay in Bai Chay, Quang Ninh.',
    'Royal Ha Long Hotel & Villas 的最新新闻、新闻稿与公告——坐落于广宁拜寨、下龙湾畔的五星级酒店。',
    '하롱베이 바로 곁, 꽝닌성 바이짜이의 5성급 호텔 Royal Ha Long Hotel & Villas의 뉴스와 보도자료, 최신 소식입니다.',
    'ハロン湾に面したクアンニン省バイチャイの5つ星ホテル、Royal Ha Long Hotel & Villas のニュース・プレスリリース・最新情報。',
    'ข่าวสาร ข่าวประชาสัมพันธ์ และความเคลื่อนไหวล่าสุดจาก Royal Ha Long Hotel & Villas โรงแรมห้าดาวริมอ่าวฮาลอง บ๊ายจ๋าย จังหวัดกว๋างนิญ',
  ),
)


/* ══════════════════════════════════════════════════════════════════ *
 *  page.our-announcement — bảng công bố thông tin cho cổ đông.
 *
 *  96 dòng, mỗi dòng là "ngày — tên văn bản" trỏ tới bản PDF trên Google
 *  Drive. Đây là trang quan hệ nhà đầu tư, không phải bài viết: tên văn bản
 *  là ĐỊNH DANH của tài liệu, nên năm trong tên giữ NGUYÊN lịch dương ở cả
 *  sáu ngôn ngữ (kể cả tiếng Thái, nơi văn xuôi thường dùng Phật lịch). Một
 *  cổ đông tra "báo cáo tài chính quý 2 năm 2026" phải khớp được với dòng
 *  đứng cạnh mốc ngày 20/07/2026 — đổi 2026 thành 2569 ở đúng một nửa dòng
 *  là làm hỏng bảng tra.
 * ══════════════════════════════════════════════════════════════════ */

const ANN_TITLE = L('THÔNG BÁO', 'ANNOUNCEMENTS', '公告', '공지사항', 'お知らせ', 'ประกาศ')

const ANN_HERO_ALT = L(
  'Toà khách sạn sáng đèn lúc chạng vạng, biển hiệu ROYAL HALONG HOTEL trên nóc, phía trước là bãi cỏ có hàng cây và ghế đá, xe đưa đón đậu bên sảnh đón',
  'The hotel tower lit at dusk with its rooftop ROYAL HALONG HOTEL sign, a lawn of trees and benches in front and a shuttle van parked by the porte-cochère',
  '暮色中灯火通明的酒店主楼，屋顶挂有 ROYAL HALONG HOTEL 标识，前方是种着树木、摆着长椅的草坪，接驳车停在雨篷旁',
  '해질 무렵 불을 밝힌 호텔 건물과 옥상의 ROYAL HALONG HOTEL 간판, 앞쪽에는 나무와 벤치가 놓인 잔디밭, 차량 진입로 옆에 셔틀 밴이 서 있는 모습',
  '夕暮れに灯りをともすホテル棟と屋上の ROYAL HALONG HOTEL のサイン。手前には木々とベンチの芝生が広がり、車寄せの脇にシャトルバンが停まる',
  'อาคารโรงแรมที่เปิดไฟยามพลบค่ำ พร้อมป้าย ROYAL HALONG HOTEL บนดาดฟ้า ด้านหน้าเป็นสนามหญ้าที่มีต้นไม้และม้านั่ง และมีรถตู้รับส่งจอดอยู่ข้างทางเข้า',
)

const ANN_ROWS: Six[] = [
  L(
    '- 14/08/2026 — [Báo cáo tài chính soát xét năm 2026](https://drive.google.com/file/d/1Jetj54kF-TIjYEZtbl_fezEPpZP1QAu8/view)',
    '- 14/08/2026 — [Royal International Corporation discloses the reviewed financial statements for 2026](https://drive.google.com/file/d/1Jetj54kF-TIjYEZtbl_fezEPpZP1QAu8/view)',
    '- 14/08/2026 — [皇家国际股份公司公布 2026 年经审阅财务报告](https://drive.google.com/file/d/1Jetj54kF-TIjYEZtbl_fezEPpZP1QAu8/view)',
    '- 14/08/2026 — [호앙지아 국제주식회사, 2026년 검토 재무제표 공시](https://drive.google.com/file/d/1Jetj54kF-TIjYEZtbl_fezEPpZP1QAu8/view)',
    '- 14/08/2026 — [ホアンザー国際株式会社、2026年レビュー済み財務諸表を開示](https://drive.google.com/file/d/1Jetj54kF-TIjYEZtbl_fezEPpZP1QAu8/view)',
    '- 14/08/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินที่สอบทานแล้ว ปี 2026](https://drive.google.com/file/d/1Jetj54kF-TIjYEZtbl_fezEPpZP1QAu8/view)',
  ),
  L(
    '- 14/08/2026 — [Thông báo thay đổi nội dung đăng ký doanh nghiệp](https://drive.google.com/file/d/177QlcFImbRZrnnmGcEu8zKfq104AieiI/view)',
    '- 14/08/2026 — [Notice of change to the business registration particulars](https://drive.google.com/file/d/177QlcFImbRZrnnmGcEu8zKfq104AieiI/view)',
    '- 14/08/2026 — [企业注册内容变更公告](https://drive.google.com/file/d/177QlcFImbRZrnnmGcEu8zKfq104AieiI/view)',
    '- 14/08/2026 — [기업등록 사항 변경 공고](https://drive.google.com/file/d/177QlcFImbRZrnnmGcEu8zKfq104AieiI/view)',
    '- 14/08/2026 — [企業登録事項の変更に関するお知らせ](https://drive.google.com/file/d/177QlcFImbRZrnnmGcEu8zKfq104AieiI/view)',
    '- 14/08/2026 — [ประกาศเปลี่ยนแปลงรายละเอียดการจดทะเบียนธุรกิจ](https://drive.google.com/file/d/177QlcFImbRZrnnmGcEu8zKfq104AieiI/view)',
  ),
  L(
    '- 20/07/2026 — [Báo cáo tài chính quý 2 năm 2026](https://drive.google.com/file/d/1YEO54LUeNFe9aHdcitDUTIri-BytJ2Vz/view)',
    '- 20/07/2026 — [Financial statements for Q2 2026](https://drive.google.com/file/d/1YEO54LUeNFe9aHdcitDUTIri-BytJ2Vz/view)',
    '- 20/07/2026 — [2026 年第二季度财务报告](https://drive.google.com/file/d/1YEO54LUeNFe9aHdcitDUTIri-BytJ2Vz/view)',
    '- 20/07/2026 — [2026년 2분기 재무제표](https://drive.google.com/file/d/1YEO54LUeNFe9aHdcitDUTIri-BytJ2Vz/view)',
    '- 20/07/2026 — [2026年第2四半期財務諸表](https://drive.google.com/file/d/1YEO54LUeNFe9aHdcitDUTIri-BytJ2Vz/view)',
    '- 20/07/2026 — [งบการเงินไตรมาส 2 ปี 2026](https://drive.google.com/file/d/1YEO54LUeNFe9aHdcitDUTIri-BytJ2Vz/view)',
  ),
  L(
    '- 15/06/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố chương trình khuyến mãi dành cho hướng dẫn, lái xe](https://drive.google.com/file/d/1EXhv5LolkCqfGD7LyBjtYwDNXPfR9iZH/view)',
    '- 15/06/2026 — [Royal International Corporation announces the promotion programme for tour guides and drivers](https://drive.google.com/file/d/1EXhv5LolkCqfGD7LyBjtYwDNXPfR9iZH/view)',
    '- 15/06/2026 — [皇家国际股份公司公布面向导游及司机的优惠方案](https://drive.google.com/file/d/1EXhv5LolkCqfGD7LyBjtYwDNXPfR9iZH/view)',
    '- 15/06/2026 — [호앙지아 국제주식회사, 가이드 및 기사 대상 프로모션 프로그램 공고](https://drive.google.com/file/d/1EXhv5LolkCqfGD7LyBjtYwDNXPfR9iZH/view)',
    '- 15/06/2026 — [ホアンザー国際株式会社、ガイド・ドライバー向け優待プログラムを公表](https://drive.google.com/file/d/1EXhv5LolkCqfGD7LyBjtYwDNXPfR9iZH/view)',
    '- 15/06/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล ประกาศโปรแกรมส่งเสริมการขายสำหรับไกด์และคนขับรถ](https://drive.google.com/file/d/1EXhv5LolkCqfGD7LyBjtYwDNXPfR9iZH/view)',
  ),
  L(
    '- 15/06/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố chương trình khuyến mãi dành cho khách](https://drive.google.com/file/d/1-4EobEw16h-MGD9kWkFIoKtbXj6AyB0A/view)',
    '- 15/06/2026 — [Royal International Corporation announces the promotion programme for guests](https://drive.google.com/file/d/1-4EobEw16h-MGD9kWkFIoKtbXj6AyB0A/view)',
    '- 15/06/2026 — [皇家国际股份公司公布面向宾客的优惠方案](https://drive.google.com/file/d/1-4EobEw16h-MGD9kWkFIoKtbXj6AyB0A/view)',
    '- 15/06/2026 — [호앙지아 국제주식회사, 고객 대상 프로모션 프로그램 공고](https://drive.google.com/file/d/1-4EobEw16h-MGD9kWkFIoKtbXj6AyB0A/view)',
    '- 15/06/2026 — [ホアンザー国際株式会社、お客様向け優待プログラムを公表](https://drive.google.com/file/d/1-4EobEw16h-MGD9kWkFIoKtbXj6AyB0A/view)',
    '- 15/06/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล ประกาศโปรแกรมส่งเสริมการขายสำหรับลูกค้า](https://drive.google.com/file/d/1-4EobEw16h-MGD9kWkFIoKtbXj6AyB0A/view)',
  ),
  L(
    '- 28/05/2026 — [Ký hợp đồng kiểm toán](https://drive.google.com/file/d/1Qd0UzWJg5xbT5mynfJrNli2Qu1Lek74h/view)',
    '- 28/05/2026 — [Signing of the audit contract](https://drive.google.com/file/d/1Qd0UzWJg5xbT5mynfJrNli2Qu1Lek74h/view)',
    '- 28/05/2026 — [签订审计合同](https://drive.google.com/file/d/1Qd0UzWJg5xbT5mynfJrNli2Qu1Lek74h/view)',
    '- 28/05/2026 — [감사 계약 체결](https://drive.google.com/file/d/1Qd0UzWJg5xbT5mynfJrNli2Qu1Lek74h/view)',
    '- 28/05/2026 — [監査契約の締結](https://drive.google.com/file/d/1Qd0UzWJg5xbT5mynfJrNli2Qu1Lek74h/view)',
    '- 28/05/2026 — [การลงนามสัญญาตรวจสอบบัญชี](https://drive.google.com/file/d/1Qd0UzWJg5xbT5mynfJrNli2Qu1Lek74h/view)',
  ),
  L(
    '- 09/05/2026 — [Thông báo thay đổi nhân sự](https://drive.google.com/file/d/11XeZnsZvrN2Kcme0WVGHihZrog9GF1-N/view)',
    '- 09/05/2026 — [Notice of personnel change](https://drive.google.com/file/d/11XeZnsZvrN2Kcme0WVGHihZrog9GF1-N/view)',
    '- 09/05/2026 — [人事变动公告](https://drive.google.com/file/d/11XeZnsZvrN2Kcme0WVGHihZrog9GF1-N/view)',
    '- 09/05/2026 — [인사 변경 공고](https://drive.google.com/file/d/11XeZnsZvrN2Kcme0WVGHihZrog9GF1-N/view)',
    '- 09/05/2026 — [人事異動のお知らせ](https://drive.google.com/file/d/11XeZnsZvrN2Kcme0WVGHihZrog9GF1-N/view)',
    '- 09/05/2026 — [ประกาศเปลี่ยนแปลงบุคลากร](https://drive.google.com/file/d/11XeZnsZvrN2Kcme0WVGHihZrog9GF1-N/view)',
  ),
  L(
    '- 08/05/2026 — [Nghị quyết Đại hội đồng cổ đông thường niên năm 2026](https://drive.google.com/file/d/1LDtICkDOPdlKCDS60qxOn8R4Si98VDkf/view)',
    '- 08/05/2026 — [Resolution of the 2026 annual general meeting of shareholders](https://drive.google.com/file/d/1LDtICkDOPdlKCDS60qxOn8R4Si98VDkf/view)',
    '- 08/05/2026 — [2026 年年度股东大会决议](https://drive.google.com/file/d/1LDtICkDOPdlKCDS60qxOn8R4Si98VDkf/view)',
    '- 08/05/2026 — [2026년 정기 주주총회 결의](https://drive.google.com/file/d/1LDtICkDOPdlKCDS60qxOn8R4Si98VDkf/view)',
    '- 08/05/2026 — [2026年定時株主総会決議](https://drive.google.com/file/d/1LDtICkDOPdlKCDS60qxOn8R4Si98VDkf/view)',
    '- 08/05/2026 — [มติที่ประชุมสามัญผู้ถือหุ้นประจำปี 2026](https://drive.google.com/file/d/1LDtICkDOPdlKCDS60qxOn8R4Si98VDkf/view)',
  ),
  L(
    '- 08/05/2026 — [Điều lệ Công ty](https://drive.google.com/file/d/1ZsibCncUgnpvqM_OsUBjO8D4uN6Su4wE/view)',
    '- 08/05/2026 — [Company charter](https://drive.google.com/file/d/1ZsibCncUgnpvqM_OsUBjO8D4uN6Su4wE/view)',
    '- 08/05/2026 — [公司章程](https://drive.google.com/file/d/1ZsibCncUgnpvqM_OsUBjO8D4uN6Su4wE/view)',
    '- 08/05/2026 — [회사 정관](https://drive.google.com/file/d/1ZsibCncUgnpvqM_OsUBjO8D4uN6Su4wE/view)',
    '- 08/05/2026 — [会社定款](https://drive.google.com/file/d/1ZsibCncUgnpvqM_OsUBjO8D4uN6Su4wE/view)',
    '- 08/05/2026 — [ข้อบังคับบริษัท](https://drive.google.com/file/d/1ZsibCncUgnpvqM_OsUBjO8D4uN6Su4wE/view)',
  ),
  L(
    '- 07/05/2026 — [Link tham dự ĐHCĐ thường niên năm 2026](https://ric.ezgsm.fpts.com.vn/)',
    '- 07/05/2026 — [Link to attend the 2026 annual general meeting of shareholders](https://ric.ezgsm.fpts.com.vn/)',
    '- 07/05/2026 — [参加 2026 年年度股东大会的链接](https://ric.ezgsm.fpts.com.vn/)',
    '- 07/05/2026 — [2026년 정기 주주총회 참석 링크](https://ric.ezgsm.fpts.com.vn/)',
    '- 07/05/2026 — [2026年定時株主総会 参加リンク](https://ric.ezgsm.fpts.com.vn/)',
    '- 07/05/2026 — [ลิงก์เข้าร่วมการประชุมสามัญผู้ถือหุ้นประจำปี 2026](https://ric.ezgsm.fpts.com.vn/)',
  ),
  L(
    '- 05/05/2026 — [Hướng dẫn tham dự đại hội cổ đông trực tuyến năm 2026](https://drive.google.com/file/d/1sdV9ykGzLbG21hmy7cWDI6_dAxvEijvh/view)',
    '- 05/05/2026 — [Guide to attending the 2026 online general meeting of shareholders](https://drive.google.com/file/d/1sdV9ykGzLbG21hmy7cWDI6_dAxvEijvh/view)',
    '- 05/05/2026 — [2026 年线上股东大会参会指南](https://drive.google.com/file/d/1sdV9ykGzLbG21hmy7cWDI6_dAxvEijvh/view)',
    '- 05/05/2026 — [2026년 온라인 주주총회 참석 안내](https://drive.google.com/file/d/1sdV9ykGzLbG21hmy7cWDI6_dAxvEijvh/view)',
    '- 05/05/2026 — [2026年オンライン株主総会 参加ガイド](https://drive.google.com/file/d/1sdV9ykGzLbG21hmy7cWDI6_dAxvEijvh/view)',
    '- 05/05/2026 — [คู่มือการเข้าร่วมประชุมผู้ถือหุ้นออนไลน์ ปี 2026](https://drive.google.com/file/d/1sdV9ykGzLbG21hmy7cWDI6_dAxvEijvh/view)',
  ),
  L(
    '- 29/04/2026 — [Quyết định của HĐQT về Danh sách ứng viên để bầu HĐQT nhiệm kỳ 2026-2031](https://drive.google.com/file/d/1g_jq-ixdVpKPA2ACtGPSS_yFa9V0s4i9/view)',
    '- 29/04/2026 — [Board resolution on the list of candidates for election to the Board of Directors, 2026–2031 term](https://drive.google.com/file/d/1g_jq-ixdVpKPA2ACtGPSS_yFa9V0s4i9/view)',
    '- 29/04/2026 — [董事会关于 2026–2031 年任期董事候选人名单的决议](https://drive.google.com/file/d/1g_jq-ixdVpKPA2ACtGPSS_yFa9V0s4i9/view)',
    '- 29/04/2026 — [2026–2031년 임기 이사 선임 후보자 명단에 관한 이사회 결의](https://drive.google.com/file/d/1g_jq-ixdVpKPA2ACtGPSS_yFa9V0s4i9/view)',
    '- 29/04/2026 — [2026〜2031年任期の取締役選任候補者名簿に関する取締役会決議](https://drive.google.com/file/d/1g_jq-ixdVpKPA2ACtGPSS_yFa9V0s4i9/view)',
    '- 29/04/2026 — [มติคณะกรรมการบริษัทเรื่องรายชื่อผู้สมัครเข้ารับการเลือกตั้งเป็นกรรมการ วาระปี 2026–2031](https://drive.google.com/file/d/1g_jq-ixdVpKPA2ACtGPSS_yFa9V0s4i9/view)',
  ),
  L(
    '- 20/04/2026 — [Công ty cổ phần quốc tế hoàng gia công bố báo cáo tài chính quý I năm 2026](https://drive.google.com/file/d/1dybe-cKNOydczs5FM2aZq7hOaPmOUjX2/view)',
    '- 20/04/2026 — [Royal International Corporation discloses the financial statements for Q1 2026](https://drive.google.com/file/d/1dybe-cKNOydczs5FM2aZq7hOaPmOUjX2/view)',
    '- 20/04/2026 — [皇家国际股份公司公布 2026 年第一季度财务报告](https://drive.google.com/file/d/1dybe-cKNOydczs5FM2aZq7hOaPmOUjX2/view)',
    '- 20/04/2026 — [호앙지아 국제주식회사, 2026년 1분기 재무제표 공시](https://drive.google.com/file/d/1dybe-cKNOydczs5FM2aZq7hOaPmOUjX2/view)',
    '- 20/04/2026 — [ホアンザー国際株式会社、2026年第1四半期財務諸表を開示](https://drive.google.com/file/d/1dybe-cKNOydczs5FM2aZq7hOaPmOUjX2/view)',
    '- 20/04/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 1 ปี 2026](https://drive.google.com/file/d/1dybe-cKNOydczs5FM2aZq7hOaPmOUjX2/view)',
  ),
  L(
    '- 20/04/2026 — [Công ty cổ phần quốc tế hoàng gia công bố thông tin về việc thay đổi mẫu dấu](https://drive.google.com/file/d/1H4y9xUGwns41lcTj3-NYinjiqGizOocl/view)',
    '- 20/04/2026 — [Royal International Corporation discloses information on the change of company seal](https://drive.google.com/file/d/1H4y9xUGwns41lcTj3-NYinjiqGizOocl/view)',
    '- 20/04/2026 — [皇家国际股份公司公布关于变更公司印章的信息](https://drive.google.com/file/d/1H4y9xUGwns41lcTj3-NYinjiqGizOocl/view)',
    '- 20/04/2026 — [호앙지아 국제주식회사, 법인 인감 변경에 관한 정보 공시](https://drive.google.com/file/d/1H4y9xUGwns41lcTj3-NYinjiqGizOocl/view)',
    '- 20/04/2026 — [ホアンザー国際株式会社、社印の変更に関する情報を開示](https://drive.google.com/file/d/1H4y9xUGwns41lcTj3-NYinjiqGizOocl/view)',
    '- 20/04/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลการเปลี่ยนแปลงตราประทับบริษัท](https://drive.google.com/file/d/1H4y9xUGwns41lcTj3-NYinjiqGizOocl/view)',
  ),
  L(
    '- 17/04/2026 — [Công ty cổ phần quốc tế hoàng gia công bố báo cáo thường niên năm 2025.](https://drive.google.com/file/d/1z7i5Wq7Kucreau4_aSzMqjARnr4qY_wS/view)',
    '- 17/04/2026 — [Royal International Corporation discloses the 2025 annual report.](https://drive.google.com/file/d/1z7i5Wq7Kucreau4_aSzMqjARnr4qY_wS/view)',
    '- 17/04/2026 — [皇家国际股份公司公布 2025 年年度报告。](https://drive.google.com/file/d/1z7i5Wq7Kucreau4_aSzMqjARnr4qY_wS/view)',
    '- 17/04/2026 — [호앙지아 국제주식회사, 2025년 연차보고서 공시.](https://drive.google.com/file/d/1z7i5Wq7Kucreau4_aSzMqjARnr4qY_wS/view)',
    '- 17/04/2026 — [ホアンザー国際株式会社、2025年年次報告書を開示。](https://drive.google.com/file/d/1z7i5Wq7Kucreau4_aSzMqjARnr4qY_wS/view)',
    '- 17/04/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานประจำปี 2025](https://drive.google.com/file/d/1z7i5Wq7Kucreau4_aSzMqjARnr4qY_wS/view)',
  ),
  L(
    '- 17/04/2026 — [Công ty cổ phần quốc tế hoàng gia công bố tài liệu dự thảo đại hội cổ đông thường niên năm 2026](https://drive.google.com/file/d/1ur655qmZGyNO9foGlirrVJ4h9sMZ2Q6A/view)',
    '- 17/04/2026 — [Royal International Corporation discloses the draft documents for the 2026 annual general meeting of shareholders](https://drive.google.com/file/d/1ur655qmZGyNO9foGlirrVJ4h9sMZ2Q6A/view)',
    '- 17/04/2026 — [皇家国际股份公司公布 2026 年年度股东大会文件草案](https://drive.google.com/file/d/1ur655qmZGyNO9foGlirrVJ4h9sMZ2Q6A/view)',
    '- 17/04/2026 — [호앙지아 국제주식회사, 2026년 정기 주주총회 자료 초안 공시](https://drive.google.com/file/d/1ur655qmZGyNO9foGlirrVJ4h9sMZ2Q6A/view)',
    '- 17/04/2026 — [ホアンザー国際株式会社、2026年定時株主総会資料の草案を開示](https://drive.google.com/file/d/1ur655qmZGyNO9foGlirrVJ4h9sMZ2Q6A/view)',
    '- 17/04/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยร่างเอกสารการประชุมสามัญผู้ถือหุ้นประจำปี 2026](https://drive.google.com/file/d/1ur655qmZGyNO9foGlirrVJ4h9sMZ2Q6A/view)',
  ),
  L(
    '- 17/04/2026 — [Công ty cổ phần quốc tế hoàng gia công bố tài liệu đại hội cổ đông thường niên năm 2026](https://drive.google.com/file/d/1o2aT63sCveErpJmSpv6ePN6x-9o2KNch/view)',
    '- 17/04/2026 — [Royal International Corporation discloses the documents for the 2026 annual general meeting of shareholders](https://drive.google.com/file/d/1o2aT63sCveErpJmSpv6ePN6x-9o2KNch/view)',
    '- 17/04/2026 — [皇家国际股份公司公布 2026 年年度股东大会文件](https://drive.google.com/file/d/1o2aT63sCveErpJmSpv6ePN6x-9o2KNch/view)',
    '- 17/04/2026 — [호앙지아 국제주식회사, 2026년 정기 주주총회 자료 공시](https://drive.google.com/file/d/1o2aT63sCveErpJmSpv6ePN6x-9o2KNch/view)',
    '- 17/04/2026 — [ホアンザー国際株式会社、2026年定時株主総会資料を開示](https://drive.google.com/file/d/1o2aT63sCveErpJmSpv6ePN6x-9o2KNch/view)',
    '- 17/04/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยเอกสารการประชุมสามัญผู้ถือหุ้นประจำปี 2026](https://drive.google.com/file/d/1o2aT63sCveErpJmSpv6ePN6x-9o2KNch/view)',
  ),
  L(
    '- 03/04/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố Giấy chứng nhận đăng ký doanh nghiệp điều chỉnh lần thứ 14](https://drive.google.com/file/d/1Jjtht9yRsyy_aOBp10i8qtaH2_gRpqkN/view)',
    '- 03/04/2026 — [Royal International Corporation discloses the business registration certificate, 14th amendment](https://drive.google.com/file/d/1Jjtht9yRsyy_aOBp10i8qtaH2_gRpqkN/view)',
    '- 03/04/2026 — [皇家国际股份公司公布第 14 次修订的企业注册证书](https://drive.google.com/file/d/1Jjtht9yRsyy_aOBp10i8qtaH2_gRpqkN/view)',
    '- 03/04/2026 — [호앙지아 국제주식회사, 제14차 변경 기업등록증 공시](https://drive.google.com/file/d/1Jjtht9yRsyy_aOBp10i8qtaH2_gRpqkN/view)',
    '- 03/04/2026 — [ホアンザー国際株式会社、第14回変更の企業登録証明書を開示](https://drive.google.com/file/d/1Jjtht9yRsyy_aOBp10i8qtaH2_gRpqkN/view)',
    '- 03/04/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยหนังสือรับรองการจดทะเบียนธุรกิจ ฉบับแก้ไขครั้งที่ 14](https://drive.google.com/file/d/1Jjtht9yRsyy_aOBp10i8qtaH2_gRpqkN/view)',
  ),
  L(
    '- 30/03/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố báo cáo giải trình liên quan đến báo cáo tài chính năm 2025](https://drive.google.com/file/d/1CZIEs_QZ12UiWpDu6LbAh1cz2F9QpFLq/view)',
    '- 30/03/2026 — [Royal International Corporation discloses the explanatory report relating to the 2025 financial statements](https://drive.google.com/file/d/1CZIEs_QZ12UiWpDu6LbAh1cz2F9QpFLq/view)',
    '- 30/03/2026 — [皇家国际股份公司公布关于 2025 年财务报告的说明报告](https://drive.google.com/file/d/1CZIEs_QZ12UiWpDu6LbAh1cz2F9QpFLq/view)',
    '- 30/03/2026 — [호앙지아 국제주식회사, 2025년 재무제표 관련 설명 보고서 공시](https://drive.google.com/file/d/1CZIEs_QZ12UiWpDu6LbAh1cz2F9QpFLq/view)',
    '- 30/03/2026 — [ホアンザー国際株式会社、2025年財務諸表に関する説明報告書を開示](https://drive.google.com/file/d/1CZIEs_QZ12UiWpDu6LbAh1cz2F9QpFLq/view)',
    '- 30/03/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานชี้แจงที่เกี่ยวกับงบการเงินปี 2025](https://drive.google.com/file/d/1CZIEs_QZ12UiWpDu6LbAh1cz2F9QpFLq/view)',
  ),
  L(
    '- 30/03/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố báo cáo tài chính đã kiểm toán năm 2025](https://drive.google.com/file/d/1Z36UBeJdHXZyBiXrxL1hNhJ8YkynyDkq/view)',
    '- 30/03/2026 — [Royal International Corporation discloses the audited financial statements for 2025](https://drive.google.com/file/d/1Z36UBeJdHXZyBiXrxL1hNhJ8YkynyDkq/view)',
    '- 30/03/2026 — [皇家国际股份公司公布 2025 年经审计财务报告](https://drive.google.com/file/d/1Z36UBeJdHXZyBiXrxL1hNhJ8YkynyDkq/view)',
    '- 30/03/2026 — [호앙지아 국제주식회사, 2025년 감사받은 재무제표 공시](https://drive.google.com/file/d/1Z36UBeJdHXZyBiXrxL1hNhJ8YkynyDkq/view)',
    '- 30/03/2026 — [ホアンザー国際株式会社、2025年監査済み財務諸表を開示](https://drive.google.com/file/d/1Z36UBeJdHXZyBiXrxL1hNhJ8YkynyDkq/view)',
    '- 30/03/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินที่ตรวจสอบแล้ว ปี 2025](https://drive.google.com/file/d/1Z36UBeJdHXZyBiXrxL1hNhJ8YkynyDkq/view)',
  ),
  L(
    '- 27/03/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố nghị quyết của hội đồng quản trị về việc gia hạn thời gian tổ chức ĐHĐCĐ năm 2026](https://drive.google.com/file/d/1ZdJ6MlW9TsVpOu2YHdSbKJ-G78D7Cv_n/view)',
    '- 27/03/2026 — [Royal International Corporation discloses the board resolution on extending the deadline for holding the 2026 general meeting of shareholders](https://drive.google.com/file/d/1ZdJ6MlW9TsVpOu2YHdSbKJ-G78D7Cv_n/view)',
    '- 27/03/2026 — [皇家国际股份公司公布董事会关于延期召开 2026 年股东大会的决议](https://drive.google.com/file/d/1ZdJ6MlW9TsVpOu2YHdSbKJ-G78D7Cv_n/view)',
    '- 27/03/2026 — [호앙지아 국제주식회사, 2026년 주주총회 개최 기한 연장에 관한 이사회 결의 공시](https://drive.google.com/file/d/1ZdJ6MlW9TsVpOu2YHdSbKJ-G78D7Cv_n/view)',
    '- 27/03/2026 — [ホアンザー国際株式会社、2026年株主総会の開催期限延長に関する取締役会決議を開示](https://drive.google.com/file/d/1ZdJ6MlW9TsVpOu2YHdSbKJ-G78D7Cv_n/view)',
    '- 27/03/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยมติคณะกรรมการบริษัทเรื่องการขยายเวลาจัดประชุมผู้ถือหุ้นปี 2026](https://drive.google.com/file/d/1ZdJ6MlW9TsVpOu2YHdSbKJ-G78D7Cv_n/view)',
  ),
  L(
    '- 24/2/2026 — [HĐQT quyết định triệu tập họp Đại hội đồng cổ đông thường niên năm 2026](https://drive.google.com/file/d/1lGg15sg7YFCDL_Mh55YymQZ-dzfihxdt/view)',
    '- 24/2/2026 — [The Board of Directors resolves to convene the 2026 annual general meeting of shareholders](https://drive.google.com/file/d/1lGg15sg7YFCDL_Mh55YymQZ-dzfihxdt/view)',
    '- 24/2/2026 — [董事会决定召开 2026 年年度股东大会](https://drive.google.com/file/d/1lGg15sg7YFCDL_Mh55YymQZ-dzfihxdt/view)',
    '- 24/2/2026 — [이사회, 2026년 정기 주주총회 소집 결정](https://drive.google.com/file/d/1lGg15sg7YFCDL_Mh55YymQZ-dzfihxdt/view)',
    '- 24/2/2026 — [取締役会、2026年定時株主総会の招集を決議](https://drive.google.com/file/d/1lGg15sg7YFCDL_Mh55YymQZ-dzfihxdt/view)',
    '- 24/2/2026 — [คณะกรรมการบริษัทมีมติเรียกประชุมสามัญผู้ถือหุ้นประจำปี 2026](https://drive.google.com/file/d/1lGg15sg7YFCDL_Mh55YymQZ-dzfihxdt/view)',
  ),
  L(
    '- 26/1/2026 — [Công ty Cổ phần Quốc tế Hoàng gia công bố Báo cáo tình hình quản trị năm 2025](https://drive.google.com/file/d/1B_bQahovSOvnu-3Er0rIYv8p17lgNHwP/view)',
    '- 26/1/2026 — [Royal International Corporation discloses the 2025 corporate governance report](https://drive.google.com/file/d/1B_bQahovSOvnu-3Er0rIYv8p17lgNHwP/view)',
    '- 26/1/2026 — [皇家国际股份公司公布 2025 年公司治理报告](https://drive.google.com/file/d/1B_bQahovSOvnu-3Er0rIYv8p17lgNHwP/view)',
    '- 26/1/2026 — [호앙지아 국제주식회사, 2025년 기업지배구조 보고서 공시](https://drive.google.com/file/d/1B_bQahovSOvnu-3Er0rIYv8p17lgNHwP/view)',
    '- 26/1/2026 — [ホアンザー国際株式会社、2025年コーポレートガバナンス報告書を開示](https://drive.google.com/file/d/1B_bQahovSOvnu-3Er0rIYv8p17lgNHwP/view)',
    '- 26/1/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานการกำกับดูแลกิจการ ปี 2025](https://drive.google.com/file/d/1B_bQahovSOvnu-3Er0rIYv8p17lgNHwP/view)',
  ),
  L(
    '- 20/1/2026 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính quý 4 năm 2025](https://drive.google.com/file/d/1k8QigwqQrTFUXtI8dhnIknEazXWvNg59/view)',
    '- 20/1/2026 — [Royal International Corporation discloses the financial statements for Q4 2025](https://drive.google.com/file/d/1k8QigwqQrTFUXtI8dhnIknEazXWvNg59/view)',
    '- 20/1/2026 — [皇家国际股份公司公布 2025 年第四季度财务报告](https://drive.google.com/file/d/1k8QigwqQrTFUXtI8dhnIknEazXWvNg59/view)',
    '- 20/1/2026 — [호앙지아 국제주식회사, 2025년 4분기 재무제표 공시](https://drive.google.com/file/d/1k8QigwqQrTFUXtI8dhnIknEazXWvNg59/view)',
    '- 20/1/2026 — [ホアンザー国際株式会社、2025年第4四半期財務諸表を開示](https://drive.google.com/file/d/1k8QigwqQrTFUXtI8dhnIknEazXWvNg59/view)',
    '- 20/1/2026 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 4 ปี 2025](https://drive.google.com/file/d/1k8QigwqQrTFUXtI8dhnIknEazXWvNg59/view)',
  ),
  L(
    '- 20/10/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính quý 3 năm 2025](https://drive.google.com/file/d/1mh3fABLaXmLthFO19ToSHjhQ8e8azet1/view)',
    '- 20/10/2025 — [Royal International Corporation discloses the financial statements for Q3 2025](https://drive.google.com/file/d/1mh3fABLaXmLthFO19ToSHjhQ8e8azet1/view)',
    '- 20/10/2025 — [皇家国际股份公司公布 2025 年第三季度财务报告](https://drive.google.com/file/d/1mh3fABLaXmLthFO19ToSHjhQ8e8azet1/view)',
    '- 20/10/2025 — [호앙지아 국제주식회사, 2025년 3분기 재무제표 공시](https://drive.google.com/file/d/1mh3fABLaXmLthFO19ToSHjhQ8e8azet1/view)',
    '- 20/10/2025 — [ホアンザー国際株式会社、2025年第3四半期財務諸表を開示](https://drive.google.com/file/d/1mh3fABLaXmLthFO19ToSHjhQ8e8azet1/view)',
    '- 20/10/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 3 ปี 2025](https://drive.google.com/file/d/1mh3fABLaXmLthFO19ToSHjhQ8e8azet1/view)',
  ),
  L(
    '- 15/08/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính soát xét giai đoạn từ ngày 01/01/2025 đến ngày 30/06/2025](https://drive.google.com/file/d/1JqSUWkdx93apSyGLY4ookiHqdpdBTK5K/view)',
    '- 15/08/2025 — [Royal International Corporation discloses the reviewed financial statements for the period from 01/01/2025 to 30/06/2025](https://drive.google.com/file/d/1JqSUWkdx93apSyGLY4ookiHqdpdBTK5K/view)',
    '- 15/08/2025 — [皇家国际股份公司公布 2025 年 1 月 1 日至 2025 年 6 月 30 日期间的经审阅财务报告](https://drive.google.com/file/d/1JqSUWkdx93apSyGLY4ookiHqdpdBTK5K/view)',
    '- 15/08/2025 — [호앙지아 국제주식회사, 2025년 1월 1일부터 2025년 6월 30일까지 기간의 검토 재무제표 공시](https://drive.google.com/file/d/1JqSUWkdx93apSyGLY4ookiHqdpdBTK5K/view)',
    '- 15/08/2025 — [ホアンザー国際株式会社、2025年1月1日から2025年6月30日までの期間のレビュー済み財務諸表を開示](https://drive.google.com/file/d/1JqSUWkdx93apSyGLY4ookiHqdpdBTK5K/view)',
    '- 15/08/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินที่สอบทานแล้ว สำหรับงวดวันที่ 01/01/2025 ถึง 30/06/2025](https://drive.google.com/file/d/1JqSUWkdx93apSyGLY4ookiHqdpdBTK5K/view)',
  ),
  L(
    '- 30/07/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo tình hình quản trị công ty 6 tháng đầu năm 2025](https://drive.google.com/file/d/1-zMvvtY5ST5h5nmyG1eEeqbOdAcMuOCL/view)',
    '- 30/07/2025 — [Royal International Corporation discloses the corporate governance report for the first six months of 2025](https://drive.google.com/file/d/1-zMvvtY5ST5h5nmyG1eEeqbOdAcMuOCL/view)',
    '- 30/07/2025 — [皇家国际股份公司公布 2025 年上半年公司治理报告](https://drive.google.com/file/d/1-zMvvtY5ST5h5nmyG1eEeqbOdAcMuOCL/view)',
    '- 30/07/2025 — [호앙지아 국제주식회사, 2025년 상반기 기업지배구조 보고서 공시](https://drive.google.com/file/d/1-zMvvtY5ST5h5nmyG1eEeqbOdAcMuOCL/view)',
    '- 30/07/2025 — [ホアンザー国際株式会社、2025年上半期コーポレートガバナンス報告書を開示](https://drive.google.com/file/d/1-zMvvtY5ST5h5nmyG1eEeqbOdAcMuOCL/view)',
    '- 30/07/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานการกำกับดูแลกิจการ 6 เดือนแรกของปี 2025](https://drive.google.com/file/d/1-zMvvtY5ST5h5nmyG1eEeqbOdAcMuOCL/view)',
  ),
  L(
    '- 21/07/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính quý II năm 2025](https://drive.google.com/file/d/1dzrQlSgC2a1n9KEsp7zaljbacCuzv9Zj/view)',
    '- 21/07/2025 — [Royal International Corporation discloses the financial statements for Q2 2025](https://drive.google.com/file/d/1dzrQlSgC2a1n9KEsp7zaljbacCuzv9Zj/view)',
    '- 21/07/2025 — [皇家国际股份公司公布 2025 年第二季度财务报告](https://drive.google.com/file/d/1dzrQlSgC2a1n9KEsp7zaljbacCuzv9Zj/view)',
    '- 21/07/2025 — [호앙지아 국제주식회사, 2025년 2분기 재무제표 공시](https://drive.google.com/file/d/1dzrQlSgC2a1n9KEsp7zaljbacCuzv9Zj/view)',
    '- 21/07/2025 — [ホアンザー国際株式会社、2025年第2四半期財務諸表を開示](https://drive.google.com/file/d/1dzrQlSgC2a1n9KEsp7zaljbacCuzv9Zj/view)',
    '- 21/07/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 2 ปี 2025](https://drive.google.com/file/d/1dzrQlSgC2a1n9KEsp7zaljbacCuzv9Zj/view)',
  ),
  L(
    '- 11/07/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin Ký kết hợp đồng dịch vụ kiểm toán với Công ty TNHH kiểm toán và tư vấn UHY](https://drive.google.com/file/d/1-VfLEgYHPUcSzP42CTohvXevwvPq5cwe/view)',
    '- 11/07/2025 — [Royal International Corporation discloses the signing of an audit service contract with UHY Auditing and Consulting Company Limited](https://drive.google.com/file/d/1-VfLEgYHPUcSzP42CTohvXevwvPq5cwe/view)',
    '- 11/07/2025 — [皇家国际股份公司公布与 UHY 审计咨询有限公司签订审计服务合同的信息](https://drive.google.com/file/d/1-VfLEgYHPUcSzP42CTohvXevwvPq5cwe/view)',
    '- 11/07/2025 — [호앙지아 국제주식회사, UHY 회계·컨설팅 유한회사와의 감사 용역 계약 체결 정보 공시](https://drive.google.com/file/d/1-VfLEgYHPUcSzP42CTohvXevwvPq5cwe/view)',
    '- 11/07/2025 — [ホアンザー国際株式会社、UHY監査コンサルティング有限会社との監査業務契約締結を開示](https://drive.google.com/file/d/1-VfLEgYHPUcSzP42CTohvXevwvPq5cwe/view)',
    '- 11/07/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลการลงนามสัญญาบริการตรวจสอบบัญชีกับบริษัท UHY ออดิทติ้ง แอนด์ คอนซัลติ้ง จำกัด](https://drive.google.com/file/d/1-VfLEgYHPUcSzP42CTohvXevwvPq5cwe/view)',
  ),
  L(
    '- 01/07/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin thay đổi người phụ trách quản trị công ty](https://drive.google.com/file/d/1FcMCzk_5-woqFhF4ugcxdv844i6LtE-J/view)',
    '- 01/07/2025 — [Royal International Corporation discloses the change of the person in charge of corporate governance](https://drive.google.com/file/d/1FcMCzk_5-woqFhF4ugcxdv844i6LtE-J/view)',
    '- 01/07/2025 — [皇家国际股份公司公布公司治理负责人变更信息](https://drive.google.com/file/d/1FcMCzk_5-woqFhF4ugcxdv844i6LtE-J/view)',
    '- 01/07/2025 — [호앙지아 국제주식회사, 기업지배구조 담당자 변경 정보 공시](https://drive.google.com/file/d/1FcMCzk_5-woqFhF4ugcxdv844i6LtE-J/view)',
    '- 01/07/2025 — [ホアンザー国際株式会社、コーポレートガバナンス担当者の変更情報を開示](https://drive.google.com/file/d/1FcMCzk_5-woqFhF4ugcxdv844i6LtE-J/view)',
    '- 01/07/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลการเปลี่ยนแปลงผู้รับผิดชอบด้านการกำกับดูแลกิจการ](https://drive.google.com/file/d/1FcMCzk_5-woqFhF4ugcxdv844i6LtE-J/view)',
  ),
  L(
    '- 12/06/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin quy định về khuyến mãi dành cho hướng dẫn và lái xe](https://drive.google.com/file/d/1VMeR67lAkbHgv6ogB-H8-3uHNq9bp9wS/view)',
    '- 12/06/2025 — [Royal International Corporation discloses the rules on promotions for tour guides and drivers](https://drive.google.com/file/d/1VMeR67lAkbHgv6ogB-H8-3uHNq9bp9wS/view)',
    '- 12/06/2025 — [皇家国际股份公司公布关于导游及司机优惠规定的信息](https://drive.google.com/file/d/1VMeR67lAkbHgv6ogB-H8-3uHNq9bp9wS/view)',
    '- 12/06/2025 — [호앙지아 국제주식회사, 가이드 및 기사 대상 프로모션 규정 정보 공시](https://drive.google.com/file/d/1VMeR67lAkbHgv6ogB-H8-3uHNq9bp9wS/view)',
    '- 12/06/2025 — [ホアンザー国際株式会社、ガイド・ドライバー向け優待規程に関する情報を開示](https://drive.google.com/file/d/1VMeR67lAkbHgv6ogB-H8-3uHNq9bp9wS/view)',
    '- 12/06/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลระเบียบว่าด้วยการส่งเสริมการขายสำหรับไกด์และคนขับรถ](https://drive.google.com/file/d/1VMeR67lAkbHgv6ogB-H8-3uHNq9bp9wS/view)',
  ),
  L(
    '- 12/06/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin quy định về khuyến mãi dành cho khách](https://drive.google.com/file/d/1gnLQraj-H09d5QStaSQEt4Ilp4TvdcmM/view)',
    '- 12/06/2025 — [Royal International Corporation discloses the rules on promotions for guests](https://drive.google.com/file/d/1gnLQraj-H09d5QStaSQEt4Ilp4TvdcmM/view)',
    '- 12/06/2025 — [皇家国际股份公司公布关于宾客优惠规定的信息](https://drive.google.com/file/d/1gnLQraj-H09d5QStaSQEt4Ilp4TvdcmM/view)',
    '- 12/06/2025 — [호앙지아 국제주식회사, 고객 대상 프로모션 규정 정보 공시](https://drive.google.com/file/d/1gnLQraj-H09d5QStaSQEt4Ilp4TvdcmM/view)',
    '- 12/06/2025 — [ホアンザー国際株式会社、お客様向け優待規程に関する情報を開示](https://drive.google.com/file/d/1gnLQraj-H09d5QStaSQEt4Ilp4TvdcmM/view)',
    '- 12/06/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลระเบียบว่าด้วยการส่งเสริมการขายสำหรับลูกค้า](https://drive.google.com/file/d/1gnLQraj-H09d5QStaSQEt4Ilp4TvdcmM/view)',
  ),
  L(
    '- 16/05/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố nghị quyết đại hội cổ đông thường niên năm 2025](https://drive.google.com/file/d/18RxuDHId51ggyjkO1NNnUCYcBqQOed01/view)',
    '- 16/05/2025 — [Royal International Corporation discloses the resolution of the 2025 annual general meeting of shareholders](https://drive.google.com/file/d/18RxuDHId51ggyjkO1NNnUCYcBqQOed01/view)',
    '- 16/05/2025 — [皇家国际股份公司公布 2025 年年度股东大会决议](https://drive.google.com/file/d/18RxuDHId51ggyjkO1NNnUCYcBqQOed01/view)',
    '- 16/05/2025 — [호앙지아 국제주식회사, 2025년 정기 주주총회 결의 공시](https://drive.google.com/file/d/18RxuDHId51ggyjkO1NNnUCYcBqQOed01/view)',
    '- 16/05/2025 — [ホアンザー国際株式会社、2025年定時株主総会決議を開示](https://drive.google.com/file/d/18RxuDHId51ggyjkO1NNnUCYcBqQOed01/view)',
    '- 16/05/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยมติที่ประชุมสามัญผู้ถือหุ้นประจำปี 2025](https://drive.google.com/file/d/18RxuDHId51ggyjkO1NNnUCYcBqQOed01/view)',
  ),
  L(
    '- 14/05/2025 — [Tài liệu hướng dẫn tham dự đại hội cổ đông thường niên năm 2025, hình thức online](https://drive.google.com/file/d/11voIvZAn-Uq-GAJFSyF6VC3N9nPVPrfy/view)',
    '- 14/05/2025 — [Guide to attending the 2025 annual general meeting of shareholders online](https://drive.google.com/file/d/11voIvZAn-Uq-GAJFSyF6VC3N9nPVPrfy/view)',
    '- 14/05/2025 — [2025 年年度股东大会线上参会指南](https://drive.google.com/file/d/11voIvZAn-Uq-GAJFSyF6VC3N9nPVPrfy/view)',
    '- 14/05/2025 — [2025년 정기 주주총회 온라인 참석 안내 자료](https://drive.google.com/file/d/11voIvZAn-Uq-GAJFSyF6VC3N9nPVPrfy/view)',
    '- 14/05/2025 — [2025年定時株主総会 オンライン参加ガイド](https://drive.google.com/file/d/11voIvZAn-Uq-GAJFSyF6VC3N9nPVPrfy/view)',
    '- 14/05/2025 — [เอกสารคู่มือการเข้าร่วมประชุมสามัญผู้ถือหุ้นประจำปี 2025 แบบออนไลน์](https://drive.google.com/file/d/11voIvZAn-Uq-GAJFSyF6VC3N9nPVPrfy/view)',
  ),
  L(
    '- 18/04/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính quý 1 năm 2025.](https://drive.google.com/file/d/1ljdbE2MYQlB-cCL7_LVKwu9d6oGGziA2/view)',
    '- 18/04/2025 — [Royal International Corporation discloses the financial statements for Q1 2025.](https://drive.google.com/file/d/1ljdbE2MYQlB-cCL7_LVKwu9d6oGGziA2/view)',
    '- 18/04/2025 — [皇家国际股份公司公布 2025 年第一季度财务报告。](https://drive.google.com/file/d/1ljdbE2MYQlB-cCL7_LVKwu9d6oGGziA2/view)',
    '- 18/04/2025 — [호앙지아 국제주식회사, 2025년 1분기 재무제표 공시.](https://drive.google.com/file/d/1ljdbE2MYQlB-cCL7_LVKwu9d6oGGziA2/view)',
    '- 18/04/2025 — [ホアンザー国際株式会社、2025年第1四半期財務諸表を開示。](https://drive.google.com/file/d/1ljdbE2MYQlB-cCL7_LVKwu9d6oGGziA2/view)',
    '- 18/04/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 1 ปี 2025](https://drive.google.com/file/d/1ljdbE2MYQlB-cCL7_LVKwu9d6oGGziA2/view)',
  ),
  L(
    '- 18/04/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo thường niên năm 2024](https://drive.google.com/file/d/1etHmb0VNf-4p0NqlUvf-2SJM135amosj/view)',
    '- 18/04/2025 — [Royal International Corporation discloses the 2024 annual report](https://drive.google.com/file/d/1etHmb0VNf-4p0NqlUvf-2SJM135amosj/view)',
    '- 18/04/2025 — [皇家国际股份公司公布 2024 年年度报告](https://drive.google.com/file/d/1etHmb0VNf-4p0NqlUvf-2SJM135amosj/view)',
    '- 18/04/2025 — [호앙지아 국제주식회사, 2024년 연차보고서 공시](https://drive.google.com/file/d/1etHmb0VNf-4p0NqlUvf-2SJM135amosj/view)',
    '- 18/04/2025 — [ホアンザー国際株式会社、2024年年次報告書を開示](https://drive.google.com/file/d/1etHmb0VNf-4p0NqlUvf-2SJM135amosj/view)',
    '- 18/04/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานประจำปี 2024](https://drive.google.com/file/d/1etHmb0VNf-4p0NqlUvf-2SJM135amosj/view)',
  ),
  L(
    '- 15/04/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin bổ nhiệm kế toán trưởng](https://drive.google.com/file/d/1tUWdU6ZDSJ6qwr5gS1Vy5t_q30rovz1r/view)',
    '- 15/04/2025 — [Royal International Corporation discloses the appointment of the chief accountant](https://drive.google.com/file/d/1tUWdU6ZDSJ6qwr5gS1Vy5t_q30rovz1r/view)',
    '- 15/04/2025 — [皇家国际股份公司公布总会计师任命信息](https://drive.google.com/file/d/1tUWdU6ZDSJ6qwr5gS1Vy5t_q30rovz1r/view)',
    '- 15/04/2025 — [호앙지아 국제주식회사, 회계책임자 선임 정보 공시](https://drive.google.com/file/d/1tUWdU6ZDSJ6qwr5gS1Vy5t_q30rovz1r/view)',
    '- 15/04/2025 — [ホアンザー国際株式会社、経理責任者の選任情報を開示](https://drive.google.com/file/d/1tUWdU6ZDSJ6qwr5gS1Vy5t_q30rovz1r/view)',
    '- 15/04/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลการแต่งตั้งหัวหน้าฝ่ายบัญชี](https://drive.google.com/file/d/1tUWdU6ZDSJ6qwr5gS1Vy5t_q30rovz1r/view)',
  ),
  L(
    '- 02/04/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo thường niên năm 2023](https://drive.google.com/file/d/1XKEn9-G1g_3tnyX9DVuLWVJNvI-3WBwN/view)',
    '- 02/04/2025 — [Royal International Corporation discloses the 2023 annual report](https://drive.google.com/file/d/1XKEn9-G1g_3tnyX9DVuLWVJNvI-3WBwN/view)',
    '- 02/04/2025 — [皇家国际股份公司公布 2023 年年度报告](https://drive.google.com/file/d/1XKEn9-G1g_3tnyX9DVuLWVJNvI-3WBwN/view)',
    '- 02/04/2025 — [호앙지아 국제주식회사, 2023년 연차보고서 공시](https://drive.google.com/file/d/1XKEn9-G1g_3tnyX9DVuLWVJNvI-3WBwN/view)',
    '- 02/04/2025 — [ホアンザー国際株式会社、2023年年次報告書を開示](https://drive.google.com/file/d/1XKEn9-G1g_3tnyX9DVuLWVJNvI-3WBwN/view)',
    '- 02/04/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานประจำปี 2023](https://drive.google.com/file/d/1XKEn9-G1g_3tnyX9DVuLWVJNvI-3WBwN/view)',
  ),
  L(
    '- 31/03/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin báo cáo tài chính bán niên năm 2024](https://drive.google.com/file/d/1QOQ9JhF2WcB4-2wI06YLRObaWlCbjOEQ/view)',
    '- 31/03/2025 — [Royal International Corporation discloses the interim financial statements for 2024](https://drive.google.com/file/d/1QOQ9JhF2WcB4-2wI06YLRObaWlCbjOEQ/view)',
    '- 31/03/2025 — [皇家国际股份公司公布 2024 年半年度财务报告信息](https://drive.google.com/file/d/1QOQ9JhF2WcB4-2wI06YLRObaWlCbjOEQ/view)',
    '- 31/03/2025 — [호앙지아 국제주식회사, 2024년 반기 재무제표 정보 공시](https://drive.google.com/file/d/1QOQ9JhF2WcB4-2wI06YLRObaWlCbjOEQ/view)',
    '- 31/03/2025 — [ホアンザー国際株式会社、2024年半期財務諸表の情報を開示](https://drive.google.com/file/d/1QOQ9JhF2WcB4-2wI06YLRObaWlCbjOEQ/view)',
    '- 31/03/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลงบการเงินครึ่งปี 2024](https://drive.google.com/file/d/1QOQ9JhF2WcB4-2wI06YLRObaWlCbjOEQ/view)',
  ),
  L(
    '- 31/03/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin báo cáo tài chính năm 2024](https://drive.google.com/file/d/1OmXR50vsgUynkIuIw4xuul5ArniqW2Jj/view?usp=sharing)',
    '- 31/03/2025 — [Royal International Corporation discloses the financial statements for 2024](https://drive.google.com/file/d/1OmXR50vsgUynkIuIw4xuul5ArniqW2Jj/view?usp=sharing)',
    '- 31/03/2025 — [皇家国际股份公司公布 2024 年财务报告信息](https://drive.google.com/file/d/1OmXR50vsgUynkIuIw4xuul5ArniqW2Jj/view?usp=sharing)',
    '- 31/03/2025 — [호앙지아 국제주식회사, 2024년 재무제표 정보 공시](https://drive.google.com/file/d/1OmXR50vsgUynkIuIw4xuul5ArniqW2Jj/view?usp=sharing)',
    '- 31/03/2025 — [ホアンザー国際株式会社、2024年財務諸表の情報を開示](https://drive.google.com/file/d/1OmXR50vsgUynkIuIw4xuul5ArniqW2Jj/view?usp=sharing)',
    '- 31/03/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลงบการเงินปี 2024](https://drive.google.com/file/d/1OmXR50vsgUynkIuIw4xuul5ArniqW2Jj/view?usp=sharing)',
  ),
  L(
    '- 25/03/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố thông tin của HĐQT về việc triệu tập đại hội cổ đông thường niên năm 2025.](https://drive.google.com/file/d/1DTf1xqtN_0kp2tq2DKn-XTsUV8moQrCf/view)',
    '- 25/03/2025 — [Royal International Corporation discloses the board\'s information on convening the 2025 annual general meeting of shareholders.](https://drive.google.com/file/d/1DTf1xqtN_0kp2tq2DKn-XTsUV8moQrCf/view)',
    '- 25/03/2025 — [皇家国际股份公司公布董事会关于召开 2025 年年度股东大会的信息。](https://drive.google.com/file/d/1DTf1xqtN_0kp2tq2DKn-XTsUV8moQrCf/view)',
    '- 25/03/2025 — [호앙지아 국제주식회사, 2025년 정기 주주총회 소집에 관한 이사회 정보 공시.](https://drive.google.com/file/d/1DTf1xqtN_0kp2tq2DKn-XTsUV8moQrCf/view)',
    '- 25/03/2025 — [ホアンザー国際株式会社、2025年定時株主総会の招集に関する取締役会情報を開示。](https://drive.google.com/file/d/1DTf1xqtN_0kp2tq2DKn-XTsUV8moQrCf/view)',
    '- 25/03/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยข้อมูลของคณะกรรมการบริษัทเรื่องการเรียกประชุมสามัญผู้ถือหุ้นประจำปี 2025](https://drive.google.com/file/d/1DTf1xqtN_0kp2tq2DKn-XTsUV8moQrCf/view)',
  ),
  L(
    '- 11/03/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính quý 4 năm 2024 và giải trình vào báo tài chính quý 4 năm 2024](https://drive.google.com/file/d/1iS9rgYpe-xOr4fD4ELf5OOMzBlNzEsxE/view)',
    '- 11/03/2025 — [Royal International Corporation discloses the financial statements for Q4 2024 and the explanatory note thereon](https://drive.google.com/file/d/1iS9rgYpe-xOr4fD4ELf5OOMzBlNzEsxE/view)',
    '- 11/03/2025 — [皇家国际股份公司公布 2024 年第四季度财务报告及其说明](https://drive.google.com/file/d/1iS9rgYpe-xOr4fD4ELf5OOMzBlNzEsxE/view)',
    '- 11/03/2025 — [호앙지아 국제주식회사, 2024년 4분기 재무제표 및 그에 대한 설명 공시](https://drive.google.com/file/d/1iS9rgYpe-xOr4fD4ELf5OOMzBlNzEsxE/view)',
    '- 11/03/2025 — [ホアンザー国際株式会社、2024年第4四半期財務諸表および同説明を開示](https://drive.google.com/file/d/1iS9rgYpe-xOr4fD4ELf5OOMzBlNzEsxE/view)',
    '- 11/03/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 4 ปี 2024 และคำชี้แจงประกอบ](https://drive.google.com/file/d/1iS9rgYpe-xOr4fD4ELf5OOMzBlNzEsxE/view)',
  ),
  L(
    '- 07/03/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính 2023 (bổ sung)](https://drive.google.com/file/d/1pe-Z8OxiZr2t9Fpn712GNjrtfIZ3-6ye/view?usp=sharing)',
    '- 07/03/2025 — [Royal International Corporation discloses the 2023 financial statements (supplementary)](https://drive.google.com/file/d/1pe-Z8OxiZr2t9Fpn712GNjrtfIZ3-6ye/view?usp=sharing)',
    '- 07/03/2025 — [皇家国际股份公司公布 2023 年财务报告（补充）](https://drive.google.com/file/d/1pe-Z8OxiZr2t9Fpn712GNjrtfIZ3-6ye/view?usp=sharing)',
    '- 07/03/2025 — [호앙지아 국제주식회사, 2023년 재무제표 공시 (보완)](https://drive.google.com/file/d/1pe-Z8OxiZr2t9Fpn712GNjrtfIZ3-6ye/view?usp=sharing)',
    '- 07/03/2025 — [ホアンザー国際株式会社、2023年財務諸表を開示（追補）](https://drive.google.com/file/d/1pe-Z8OxiZr2t9Fpn712GNjrtfIZ3-6ye/view?usp=sharing)',
    '- 07/03/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินปี 2023 (ฉบับเพิ่มเติม)](https://drive.google.com/file/d/1pe-Z8OxiZr2t9Fpn712GNjrtfIZ3-6ye/view?usp=sharing)',
  ),
  L(
    '- 28/02/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo tài chính 2023](https://drive.google.com/file/d/1Ff_IhS2ybUnShhrcWceeowxYJ9CTUGIy/view)',
    '- 28/02/2025 — [Royal International Corporation discloses the 2023 financial statements](https://drive.google.com/file/d/1Ff_IhS2ybUnShhrcWceeowxYJ9CTUGIy/view)',
    '- 28/02/2025 — [皇家国际股份公司公布 2023 年财务报告](https://drive.google.com/file/d/1Ff_IhS2ybUnShhrcWceeowxYJ9CTUGIy/view)',
    '- 28/02/2025 — [호앙지아 국제주식회사, 2023년 재무제표 공시](https://drive.google.com/file/d/1Ff_IhS2ybUnShhrcWceeowxYJ9CTUGIy/view)',
    '- 28/02/2025 — [ホアンザー国際株式会社、2023年財務諸表を開示](https://drive.google.com/file/d/1Ff_IhS2ybUnShhrcWceeowxYJ9CTUGIy/view)',
    '- 28/02/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินปี 2023](https://drive.google.com/file/d/1Ff_IhS2ybUnShhrcWceeowxYJ9CTUGIy/view)',
  ),
  L(
    '- 28/02/2025 — [Công ty cổ phần quốc tế Hoàng Gia công bố báo cáo giải trình báo cáo tài chính 2023](https://drive.google.com/file/d/1tUBFVwuGSyp1HgSSZq0XJs6u4sVZkcMq/view)',
    '- 28/02/2025 — [Royal International Corporation discloses the explanatory report on the 2023 financial statements](https://drive.google.com/file/d/1tUBFVwuGSyp1HgSSZq0XJs6u4sVZkcMq/view)',
    '- 28/02/2025 — [皇家国际股份公司公布 2023 年财务报告说明报告](https://drive.google.com/file/d/1tUBFVwuGSyp1HgSSZq0XJs6u4sVZkcMq/view)',
    '- 28/02/2025 — [호앙지아 국제주식회사, 2023년 재무제표 설명 보고서 공시](https://drive.google.com/file/d/1tUBFVwuGSyp1HgSSZq0XJs6u4sVZkcMq/view)',
    '- 28/02/2025 — [ホアンザー国際株式会社、2023年財務諸表の説明報告書を開示](https://drive.google.com/file/d/1tUBFVwuGSyp1HgSSZq0XJs6u4sVZkcMq/view)',
    '- 28/02/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานชี้แจงงบการเงินปี 2023](https://drive.google.com/file/d/1tUBFVwuGSyp1HgSSZq0XJs6u4sVZkcMq/view)',
  ),
  L(
    '- 08/01/2025 — [Công ty cổ phần quốc tế Hoàng Gia ký kết hợp đồng dịch vụ kiểm toán](https://drive.google.com/file/d/1l56gN9IpCXZDnQVl-3znS9acEegVJ1e0/view)',
    '- 08/01/2025 — [Royal International Corporation signs an audit service contract](https://drive.google.com/file/d/1l56gN9IpCXZDnQVl-3znS9acEegVJ1e0/view)',
    '- 08/01/2025 — [皇家国际股份公司签订审计服务合同](https://drive.google.com/file/d/1l56gN9IpCXZDnQVl-3znS9acEegVJ1e0/view)',
    '- 08/01/2025 — [호앙지아 국제주식회사, 감사 용역 계약 체결](https://drive.google.com/file/d/1l56gN9IpCXZDnQVl-3znS9acEegVJ1e0/view)',
    '- 08/01/2025 — [ホアンザー国際株式会社、監査業務契約を締結](https://drive.google.com/file/d/1l56gN9IpCXZDnQVl-3znS9acEegVJ1e0/view)',
    '- 08/01/2025 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล ลงนามสัญญาบริการตรวจสอบบัญชี](https://drive.google.com/file/d/1l56gN9IpCXZDnQVl-3znS9acEegVJ1e0/view)',
  ),
  L(
    '- 21/10/2024 — [Báo cáo tài chính quý 3 năm 2024](https://drive.google.com/file/d/1BiaTANFRVhPWCvsSNe8oNlW7mrs3mXrk/view)',
    '- 21/10/2024 — [Financial statements for Q3 2024](https://drive.google.com/file/d/1BiaTANFRVhPWCvsSNe8oNlW7mrs3mXrk/view)',
    '- 21/10/2024 — [2024 年第三季度财务报告](https://drive.google.com/file/d/1BiaTANFRVhPWCvsSNe8oNlW7mrs3mXrk/view)',
    '- 21/10/2024 — [2024년 3분기 재무제표](https://drive.google.com/file/d/1BiaTANFRVhPWCvsSNe8oNlW7mrs3mXrk/view)',
    '- 21/10/2024 — [2024年第3四半期財務諸表](https://drive.google.com/file/d/1BiaTANFRVhPWCvsSNe8oNlW7mrs3mXrk/view)',
    '- 21/10/2024 — [งบการเงินไตรมาส 3 ปี 2024](https://drive.google.com/file/d/1BiaTANFRVhPWCvsSNe8oNlW7mrs3mXrk/view)',
  ),
  L(
    '- 26/09/2024 — [Công bố quy chế công bố thông tin](https://drive.google.com/file/d/1JWXxBiDHbk9Vt8tZ4DDFasfqabT5UuU4/view)',
    '- 26/09/2024 — [Publication of the information disclosure regulations](https://drive.google.com/file/d/1JWXxBiDHbk9Vt8tZ4DDFasfqabT5UuU4/view)',
    '- 26/09/2024 — [公布信息披露规章](https://drive.google.com/file/d/1JWXxBiDHbk9Vt8tZ4DDFasfqabT5UuU4/view)',
    '- 26/09/2024 — [정보 공시 규정 공표](https://drive.google.com/file/d/1JWXxBiDHbk9Vt8tZ4DDFasfqabT5UuU4/view)',
    '- 26/09/2024 — [情報開示規程の公表](https://drive.google.com/file/d/1JWXxBiDHbk9Vt8tZ4DDFasfqabT5UuU4/view)',
    '- 26/09/2024 — [การประกาศระเบียบว่าด้วยการเปิดเผยข้อมูล](https://drive.google.com/file/d/1JWXxBiDHbk9Vt8tZ4DDFasfqabT5UuU4/view)',
  ),
  L(
    '- 20/08/2024 — [Báo cáo tài chính quý 2 năm 2024](https://drive.google.com/file/d/1tEATPI2fkkKrOgfRzmtTMo78c0xXhVD9/view)',
    '- 20/08/2024 — [Financial statements for Q2 2024](https://drive.google.com/file/d/1tEATPI2fkkKrOgfRzmtTMo78c0xXhVD9/view)',
    '- 20/08/2024 — [2024 年第二季度财务报告](https://drive.google.com/file/d/1tEATPI2fkkKrOgfRzmtTMo78c0xXhVD9/view)',
    '- 20/08/2024 — [2024년 2분기 재무제표](https://drive.google.com/file/d/1tEATPI2fkkKrOgfRzmtTMo78c0xXhVD9/view)',
    '- 20/08/2024 — [2024年第2四半期財務諸表](https://drive.google.com/file/d/1tEATPI2fkkKrOgfRzmtTMo78c0xXhVD9/view)',
    '- 20/08/2024 — [งบการเงินไตรมาส 2 ปี 2024](https://drive.google.com/file/d/1tEATPI2fkkKrOgfRzmtTMo78c0xXhVD9/view)',
  ),
  L(
    '- 20/08/2024 — [Báo cáo tài chính quý 1 năm 2024](https://drive.google.com/file/d/1CfENOaqq1se8grfjKTeX9_3lB-d5YOTh/view)',
    '- 20/08/2024 — [Financial statements for Q1 2024](https://drive.google.com/file/d/1CfENOaqq1se8grfjKTeX9_3lB-d5YOTh/view)',
    '- 20/08/2024 — [2024 年第一季度财务报告](https://drive.google.com/file/d/1CfENOaqq1se8grfjKTeX9_3lB-d5YOTh/view)',
    '- 20/08/2024 — [2024년 1분기 재무제표](https://drive.google.com/file/d/1CfENOaqq1se8grfjKTeX9_3lB-d5YOTh/view)',
    '- 20/08/2024 — [2024年第1四半期財務諸表](https://drive.google.com/file/d/1CfENOaqq1se8grfjKTeX9_3lB-d5YOTh/view)',
    '- 20/08/2024 — [งบการเงินไตรมาส 1 ปี 2024](https://drive.google.com/file/d/1CfENOaqq1se8grfjKTeX9_3lB-d5YOTh/view)',
  ),
  L(
    '- 29/07/2024 — [Báo cáo tình hình quản trị 6 tháng năm 2024](https://drive.google.com/file/d/138Pp0dqU_M538iRW7xz9SWXZHNdnmmkz/view)',
    '- 29/07/2024 — [Corporate governance report for the first six months of 2024](https://drive.google.com/file/d/138Pp0dqU_M538iRW7xz9SWXZHNdnmmkz/view)',
    '- 29/07/2024 — [2024 年上半年公司治理报告](https://drive.google.com/file/d/138Pp0dqU_M538iRW7xz9SWXZHNdnmmkz/view)',
    '- 29/07/2024 — [2024년 상반기 기업지배구조 보고서](https://drive.google.com/file/d/138Pp0dqU_M538iRW7xz9SWXZHNdnmmkz/view)',
    '- 29/07/2024 — [2024年上半期コーポレートガバナンス報告書](https://drive.google.com/file/d/138Pp0dqU_M538iRW7xz9SWXZHNdnmmkz/view)',
    '- 29/07/2024 — [รายงานการกำกับดูแลกิจการ 6 เดือนแรกของปี 2024](https://drive.google.com/file/d/138Pp0dqU_M538iRW7xz9SWXZHNdnmmkz/view)',
  ),
  L(
    '- 29/06/2024 — [Thông báo thay đổi nhân sự- bổ nhiệm thành viên HĐQT Bà Trần Thị Hồng Liễu](https://drive.google.com/file/d/1GyO0cfWl65fnMyZoB49eJuzQldhBVWbH/view)',
    '- 29/06/2024 — [Notice of personnel change — appointment of Ms Tran Thi Hong Lieu to the Board of Directors](https://drive.google.com/file/d/1GyO0cfWl65fnMyZoB49eJuzQldhBVWbH/view)',
    '- 29/06/2024 — [人事变动公告 — 任命陈氏红柳女士为董事会成员](https://drive.google.com/file/d/1GyO0cfWl65fnMyZoB49eJuzQldhBVWbH/view)',
    '- 29/06/2024 — [인사 변경 공고 — 쩐 티 홍 리에우 여사 이사 선임](https://drive.google.com/file/d/1GyO0cfWl65fnMyZoB49eJuzQldhBVWbH/view)',
    '- 29/06/2024 — [人事異動のお知らせ — チャン・ティ・ホン・リエウ氏を取締役に選任](https://drive.google.com/file/d/1GyO0cfWl65fnMyZoB49eJuzQldhBVWbH/view)',
    '- 29/06/2024 — [ประกาศเปลี่ยนแปลงบุคลากร — แต่งตั้งนางเจิ่น ถิ ห่ง เลี่ยว เป็นกรรมการบริษัท](https://drive.google.com/file/d/1GyO0cfWl65fnMyZoB49eJuzQldhBVWbH/view)',
  ),
  L(
    '- 28/06/2024 — [Biên bản, Nghị quyết Đại hội cổ đông năm 2024](https://drive.google.com/file/d/1pUhiow4YxLKdoGP6-CpD_eWzubDyVcuq/view)',
    '- 28/06/2024 — [Minutes and resolution of the 2024 general meeting of shareholders](https://drive.google.com/file/d/1pUhiow4YxLKdoGP6-CpD_eWzubDyVcuq/view)',
    '- 28/06/2024 — [2024 年股东大会会议记录与决议](https://drive.google.com/file/d/1pUhiow4YxLKdoGP6-CpD_eWzubDyVcuq/view)',
    '- 28/06/2024 — [2024년 주주총회 회의록 및 결의](https://drive.google.com/file/d/1pUhiow4YxLKdoGP6-CpD_eWzubDyVcuq/view)',
    '- 28/06/2024 — [2024年株主総会議事録および決議](https://drive.google.com/file/d/1pUhiow4YxLKdoGP6-CpD_eWzubDyVcuq/view)',
    '- 28/06/2024 — [รายงานการประชุมและมติที่ประชุมผู้ถือหุ้นปี 2024](https://drive.google.com/file/d/1pUhiow4YxLKdoGP6-CpD_eWzubDyVcuq/view)',
  ),
  L(
    '- 27/06/2024 — [Hướng dẫn tham dự ĐHCĐ thường niên năm 2024 theo hình thức trực tuyến](https://drive.google.com/file/d/1dTcniwuyEGa-mvoLf6vMo4NGnYxuYa5G/view)',
    '- 27/06/2024 — [Guide to attending the 2024 annual general meeting of shareholders online](https://drive.google.com/file/d/1dTcniwuyEGa-mvoLf6vMo4NGnYxuYa5G/view)',
    '- 27/06/2024 — [2024 年年度股东大会线上参会指南](https://drive.google.com/file/d/1dTcniwuyEGa-mvoLf6vMo4NGnYxuYa5G/view)',
    '- 27/06/2024 — [2024년 정기 주주총회 온라인 참석 안내](https://drive.google.com/file/d/1dTcniwuyEGa-mvoLf6vMo4NGnYxuYa5G/view)',
    '- 27/06/2024 — [2024年定時株主総会 オンライン参加ガイド](https://drive.google.com/file/d/1dTcniwuyEGa-mvoLf6vMo4NGnYxuYa5G/view)',
    '- 27/06/2024 — [คู่มือการเข้าร่วมประชุมสามัญผู้ถือหุ้นประจำปี 2024 แบบออนไลน์](https://drive.google.com/file/d/1dTcniwuyEGa-mvoLf6vMo4NGnYxuYa5G/view)',
  ),
  L(
    '- 24/06/2024 — [Hội đồng quản trị đề cử ứng viên để bầu bổ sung thành viên HĐQT nhiệm kỳ 2021-2025](https://drive.google.com/file/d/1pT-Si5SG5N02oKOxPw1F5flLoEH6ybOv/view)',
    '- 24/06/2024 — [The Board of Directors nominates candidates for the supplementary election of board members, 2021–2025 term](https://drive.google.com/file/d/1pT-Si5SG5N02oKOxPw1F5flLoEH6ybOv/view)',
    '- 24/06/2024 — [董事会提名候选人以补选 2021–2025 年任期董事会成员](https://drive.google.com/file/d/1pT-Si5SG5N02oKOxPw1F5flLoEH6ybOv/view)',
    '- 24/06/2024 — [이사회, 2021–2025년 임기 이사 보궐 선임 후보자 추천](https://drive.google.com/file/d/1pT-Si5SG5N02oKOxPw1F5flLoEH6ybOv/view)',
    '- 24/06/2024 — [取締役会、2021〜2025年任期の取締役補欠選任候補者を推薦](https://drive.google.com/file/d/1pT-Si5SG5N02oKOxPw1F5flLoEH6ybOv/view)',
    '- 24/06/2024 — [คณะกรรมการบริษัทเสนอชื่อผู้สมัครเพื่อเลือกตั้งกรรมการเพิ่มเติม วาระปี 2021–2025](https://drive.google.com/file/d/1pT-Si5SG5N02oKOxPw1F5flLoEH6ybOv/view)',
  ),
  L(
    '- 07/06/2024 — [Tài liệu của Đại hội đồng cổ đông thường niên năm 2024](https://drive.google.com/file/d/1LsyX9iyoil5UDJwrd6Ci1KMKEH8T4pNe/view)',
    '- 07/06/2024 — [Documents for the 2024 annual general meeting of shareholders](https://drive.google.com/file/d/1LsyX9iyoil5UDJwrd6Ci1KMKEH8T4pNe/view)',
    '- 07/06/2024 — [2024 年年度股东大会文件](https://drive.google.com/file/d/1LsyX9iyoil5UDJwrd6Ci1KMKEH8T4pNe/view)',
    '- 07/06/2024 — [2024년 정기 주주총회 자료](https://drive.google.com/file/d/1LsyX9iyoil5UDJwrd6Ci1KMKEH8T4pNe/view)',
    '- 07/06/2024 — [2024年定時株主総会資料](https://drive.google.com/file/d/1LsyX9iyoil5UDJwrd6Ci1KMKEH8T4pNe/view)',
    '- 07/06/2024 — [เอกสารการประชุมสามัญผู้ถือหุ้นประจำปี 2024](https://drive.google.com/file/d/1LsyX9iyoil5UDJwrd6Ci1KMKEH8T4pNe/view)',
  ),
  L(
    '- 16/04/2024 — [Công bố thông tin về việc miễn nhiệm Kế toán trưởng và bổ nhiệm Quyền kế toán trưởng](https://drive.google.com/file/d/13YSARp_UVnuK3tOloxrR5s9EaJJKs1I8/view)',
    '- 16/04/2024 — [Disclosure on the dismissal of the chief accountant and the appointment of an acting chief accountant](https://drive.google.com/file/d/13YSARp_UVnuK3tOloxrR5s9EaJJKs1I8/view)',
    '- 16/04/2024 — [关于免去总会计师职务并任命代理总会计师的信息披露](https://drive.google.com/file/d/13YSARp_UVnuK3tOloxrR5s9EaJJKs1I8/view)',
    '- 16/04/2024 — [회계책임자 해임 및 회계책임자 직무대행 선임에 관한 공시](https://drive.google.com/file/d/13YSARp_UVnuK3tOloxrR5s9EaJJKs1I8/view)',
    '- 16/04/2024 — [経理責任者の解任および経理責任者代行の選任に関する開示](https://drive.google.com/file/d/13YSARp_UVnuK3tOloxrR5s9EaJJKs1I8/view)',
    '- 16/04/2024 — [การเปิดเผยข้อมูลเรื่องการถอดถอนหัวหน้าฝ่ายบัญชีและการแต่งตั้งรักษาการหัวหน้าฝ่ายบัญชี](https://drive.google.com/file/d/13YSARp_UVnuK3tOloxrR5s9EaJJKs1I8/view)',
  ),
  L(
    '- 06/04/2024 — [Công bố thông tin bất thường về việc hủy danh sách cổ đông chốt ngày 27/03/2024 và gia hạn thời gian tổ chức ĐHCĐ thường niên 2024](https://drive.google.com/file/d/19UgwWDUp9uP6ItA3a5r_tOPo5dkUcYuA/view)',
    '- 06/04/2024 — [Extraordinary disclosure on cancelling the shareholder list recorded on 27/03/2024 and extending the deadline for the 2024 annual general meeting of shareholders](https://drive.google.com/file/d/19UgwWDUp9uP6ItA3a5r_tOPo5dkUcYuA/view)',
    '- 06/04/2024 — [关于取消 2024 年 3 月 27 日确定的股东名册并延期召开 2024 年年度股东大会的临时信息披露](https://drive.google.com/file/d/19UgwWDUp9uP6ItA3a5r_tOPo5dkUcYuA/view)',
    '- 06/04/2024 — [2024년 3월 27일 확정 주주명부 취소 및 2024년 정기 주주총회 개최 기한 연장에 관한 수시 공시](https://drive.google.com/file/d/19UgwWDUp9uP6ItA3a5r_tOPo5dkUcYuA/view)',
    '- 06/04/2024 — [2024年3月27日基準の株主名簿の取消しおよび2024年定時株主総会の開催期限延長に関する臨時開示](https://drive.google.com/file/d/19UgwWDUp9uP6ItA3a5r_tOPo5dkUcYuA/view)',
    '- 06/04/2024 — [การเปิดเผยข้อมูลกรณีพิเศษเรื่องการยกเลิกรายชื่อผู้ถือหุ้น ณ วันที่ 27/03/2024 และการขยายเวลาจัดประชุมสามัญผู้ถือหุ้นปี 2024](https://drive.google.com/file/d/19UgwWDUp9uP6ItA3a5r_tOPo5dkUcYuA/view)',
  ),
  L(
    '- 05/03/2024 — [Công bố thông tin về ngày đăng ký cuối cùng và tổ chức ĐHCĐ thường niên năm 2024](https://drive.google.com/file/d/1sTMg5y_fSQ9uAoRWtcMkBaxiU_LC9YDe/view)',
    '- 05/03/2024 — [Disclosure on the record date and the holding of the 2024 annual general meeting of shareholders](https://drive.google.com/file/d/1sTMg5y_fSQ9uAoRWtcMkBaxiU_LC9YDe/view)',
    '- 05/03/2024 — [关于最后登记日及召开 2024 年年度股东大会的信息披露](https://drive.google.com/file/d/1sTMg5y_fSQ9uAoRWtcMkBaxiU_LC9YDe/view)',
    '- 05/03/2024 — [주주명부 확정일 및 2024년 정기 주주총회 개최에 관한 공시](https://drive.google.com/file/d/1sTMg5y_fSQ9uAoRWtcMkBaxiU_LC9YDe/view)',
    '- 05/03/2024 — [基準日および2024年定時株主総会の開催に関する開示](https://drive.google.com/file/d/1sTMg5y_fSQ9uAoRWtcMkBaxiU_LC9YDe/view)',
    '- 05/03/2024 — [การเปิดเผยข้อมูลเรื่องวันกำหนดรายชื่อผู้ถือหุ้นและการจัดประชุมสามัญผู้ถือหุ้นประจำปี 2024](https://drive.google.com/file/d/1sTMg5y_fSQ9uAoRWtcMkBaxiU_LC9YDe/view)',
  ),
  L(
    '- 29/01/2024 — [Báo cáo tình hình quản trị công ty năm 2023](https://drive.google.com/file/d/1zaPJsY6-e57w0E1sDc6vwJ3GRLSI-Uz1/view)',
    '- 29/01/2024 — [Corporate governance report for 2023](https://drive.google.com/file/d/1zaPJsY6-e57w0E1sDc6vwJ3GRLSI-Uz1/view)',
    '- 29/01/2024 — [2023 年公司治理报告](https://drive.google.com/file/d/1zaPJsY6-e57w0E1sDc6vwJ3GRLSI-Uz1/view)',
    '- 29/01/2024 — [2023년 기업지배구조 보고서](https://drive.google.com/file/d/1zaPJsY6-e57w0E1sDc6vwJ3GRLSI-Uz1/view)',
    '- 29/01/2024 — [2023年コーポレートガバナンス報告書](https://drive.google.com/file/d/1zaPJsY6-e57w0E1sDc6vwJ3GRLSI-Uz1/view)',
    '- 29/01/2024 — [รายงานการกำกับดูแลกิจการ ปี 2023](https://drive.google.com/file/d/1zaPJsY6-e57w0E1sDc6vwJ3GRLSI-Uz1/view)',
  ),
  L(
    '- 19/01/2024 — [Báo cáo tài chính quý 4 năm 2023](https://drive.google.com/file/d/1Fw6YdX3uO11SHHb0uul1xbENvtY1UYts/view?usp=drive_link)',
    '- 19/01/2024 — [Financial statements for Q4 2023](https://drive.google.com/file/d/1Fw6YdX3uO11SHHb0uul1xbENvtY1UYts/view?usp=drive_link)',
    '- 19/01/2024 — [2023 年第四季度财务报告](https://drive.google.com/file/d/1Fw6YdX3uO11SHHb0uul1xbENvtY1UYts/view?usp=drive_link)',
    '- 19/01/2024 — [2023년 4분기 재무제표](https://drive.google.com/file/d/1Fw6YdX3uO11SHHb0uul1xbENvtY1UYts/view?usp=drive_link)',
    '- 19/01/2024 — [2023年第4四半期財務諸表](https://drive.google.com/file/d/1Fw6YdX3uO11SHHb0uul1xbENvtY1UYts/view?usp=drive_link)',
    '- 19/01/2024 — [งบการเงินไตรมาส 4 ปี 2023](https://drive.google.com/file/d/1Fw6YdX3uO11SHHb0uul1xbENvtY1UYts/view?usp=drive_link)',
  ),
  L(
    '- 17/01/2024 — [Thông báo thay đổi nhân sự](https://drive.google.com/file/d/1PYe1Y9SMTZ-0GnyKEJ-rF6bti3P1_x0y/view?usp=sharing)',
    '- 17/01/2024 — [Notice of personnel change](https://drive.google.com/file/d/1PYe1Y9SMTZ-0GnyKEJ-rF6bti3P1_x0y/view?usp=sharing)',
    '- 17/01/2024 — [人事变动公告](https://drive.google.com/file/d/1PYe1Y9SMTZ-0GnyKEJ-rF6bti3P1_x0y/view?usp=sharing)',
    '- 17/01/2024 — [인사 변경 공고](https://drive.google.com/file/d/1PYe1Y9SMTZ-0GnyKEJ-rF6bti3P1_x0y/view?usp=sharing)',
    '- 17/01/2024 — [人事異動のお知らせ](https://drive.google.com/file/d/1PYe1Y9SMTZ-0GnyKEJ-rF6bti3P1_x0y/view?usp=sharing)',
    '- 17/01/2024 — [ประกาศเปลี่ยนแปลงบุคลากร](https://drive.google.com/file/d/1PYe1Y9SMTZ-0GnyKEJ-rF6bti3P1_x0y/view?usp=sharing)',
  ),
  L(
    '- 29/12/2023 — [HĐQT thông qua chủ trương vay vốn tại Ngân hàng HDBank](https://drive.google.com/file/d/1XI9ubhfcS5J24SpDSVyOz-PUbo5Z36yP/view?usp=sharing)',
    '- 29/12/2023 — [The Board of Directors approves the policy of borrowing from HDBank](https://drive.google.com/file/d/1XI9ubhfcS5J24SpDSVyOz-PUbo5Z36yP/view?usp=sharing)',
    '- 29/12/2023 — [董事会通过在 HDBank 借款的方针](https://drive.google.com/file/d/1XI9ubhfcS5J24SpDSVyOz-PUbo5Z36yP/view?usp=sharing)',
    '- 29/12/2023 — [이사회, HDBank 차입 방침 승인](https://drive.google.com/file/d/1XI9ubhfcS5J24SpDSVyOz-PUbo5Z36yP/view?usp=sharing)',
    '- 29/12/2023 — [取締役会、HDBank からの借入方針を承認](https://drive.google.com/file/d/1XI9ubhfcS5J24SpDSVyOz-PUbo5Z36yP/view?usp=sharing)',
    '- 29/12/2023 — [คณะกรรมการบริษัทอนุมัตินโยบายกู้ยืมเงินจากธนาคาร HDBank](https://drive.google.com/file/d/1XI9ubhfcS5J24SpDSVyOz-PUbo5Z36yP/view?usp=sharing)',
  ),
  L(
    '- 19/10/2023 — [Báo cáo tài chính Quý 3 năm 2023](https://drive.google.com/file/d/13jfmJPSo8jGRdZiWWOylMrgm5TWI-Lzq/view?usp=sharing)',
    '- 19/10/2023 — [Financial statements for Q3 2023](https://drive.google.com/file/d/13jfmJPSo8jGRdZiWWOylMrgm5TWI-Lzq/view?usp=sharing)',
    '- 19/10/2023 — [2023 年第三季度财务报告](https://drive.google.com/file/d/13jfmJPSo8jGRdZiWWOylMrgm5TWI-Lzq/view?usp=sharing)',
    '- 19/10/2023 — [2023년 3분기 재무제표](https://drive.google.com/file/d/13jfmJPSo8jGRdZiWWOylMrgm5TWI-Lzq/view?usp=sharing)',
    '- 19/10/2023 — [2023年第3四半期財務諸表](https://drive.google.com/file/d/13jfmJPSo8jGRdZiWWOylMrgm5TWI-Lzq/view?usp=sharing)',
    '- 19/10/2023 — [งบการเงินไตรมาส 3 ปี 2023](https://drive.google.com/file/d/13jfmJPSo8jGRdZiWWOylMrgm5TWI-Lzq/view?usp=sharing)',
  ),
  L(
    '- 11/10/2023 — [Thông báo thay đổi Giấy chứng nhận đăng ký đầu tư](https://drive.google.com/file/d/1k20No4mliMykvdh3W3s_hitu21-wkUse/view?usp=sharing)',
    '- 11/10/2023 — [Notice of change to the investment registration certificate](https://drive.google.com/file/d/1k20No4mliMykvdh3W3s_hitu21-wkUse/view?usp=sharing)',
    '- 11/10/2023 — [投资注册证书变更公告](https://drive.google.com/file/d/1k20No4mliMykvdh3W3s_hitu21-wkUse/view?usp=sharing)',
    '- 11/10/2023 — [투자등록증 변경 공고](https://drive.google.com/file/d/1k20No4mliMykvdh3W3s_hitu21-wkUse/view?usp=sharing)',
    '- 11/10/2023 — [投資登録証明書の変更に関するお知らせ](https://drive.google.com/file/d/1k20No4mliMykvdh3W3s_hitu21-wkUse/view?usp=sharing)',
    '- 11/10/2023 — [ประกาศเปลี่ยนแปลงหนังสือรับรองการจดทะเบียนการลงทุน](https://drive.google.com/file/d/1k20No4mliMykvdh3W3s_hitu21-wkUse/view?usp=sharing)',
  ),
  L(
    '- 15/09/2023 — [Thông báo thay đổi Giấy chứng nhận đăng ký doanh nghiệp](https://drive.google.com/file/d/16UBCOO1QwPrmcT3YkZCGKa7SH37XKM1T/view?usp=sharing)',
    '- 15/09/2023 — [Notice of change to the business registration certificate](https://drive.google.com/file/d/16UBCOO1QwPrmcT3YkZCGKa7SH37XKM1T/view?usp=sharing)',
    '- 15/09/2023 — [企业注册证书变更公告](https://drive.google.com/file/d/16UBCOO1QwPrmcT3YkZCGKa7SH37XKM1T/view?usp=sharing)',
    '- 15/09/2023 — [기업등록증 변경 공고](https://drive.google.com/file/d/16UBCOO1QwPrmcT3YkZCGKa7SH37XKM1T/view?usp=sharing)',
    '- 15/09/2023 — [企業登録証明書の変更に関するお知らせ](https://drive.google.com/file/d/16UBCOO1QwPrmcT3YkZCGKa7SH37XKM1T/view?usp=sharing)',
    '- 15/09/2023 — [ประกาศเปลี่ยนแปลงหนังสือรับรองการจดทะเบียนธุรกิจ](https://drive.google.com/file/d/16UBCOO1QwPrmcT3YkZCGKa7SH37XKM1T/view?usp=sharing)',
  ),
  L(
    '- 17/08/2023 — [Báo cáo tài chính bán niên năm 2023 đã soát xét](https://drive.google.com/file/d/17Hhe2tkC10oyEwL776DDl9CaEBraxYUb/view?usp=sharing)',
    '- 17/08/2023 — [Reviewed interim financial statements for 2023](https://drive.google.com/file/d/17Hhe2tkC10oyEwL776DDl9CaEBraxYUb/view?usp=sharing)',
    '- 17/08/2023 — [2023 年经审阅半年度财务报告](https://drive.google.com/file/d/17Hhe2tkC10oyEwL776DDl9CaEBraxYUb/view?usp=sharing)',
    '- 17/08/2023 — [2023년 검토 반기 재무제표](https://drive.google.com/file/d/17Hhe2tkC10oyEwL776DDl9CaEBraxYUb/view?usp=sharing)',
    '- 17/08/2023 — [2023年レビュー済み半期財務諸表](https://drive.google.com/file/d/17Hhe2tkC10oyEwL776DDl9CaEBraxYUb/view?usp=sharing)',
    '- 17/08/2023 — [งบการเงินครึ่งปี 2023 ที่สอบทานแล้ว](https://drive.google.com/file/d/17Hhe2tkC10oyEwL776DDl9CaEBraxYUb/view?usp=sharing)',
  ),
  L(
    '- 04/08/2023 — [Công ty ký hợp đồng với Công ty kiểm toán](https://drive.google.com/file/d/1A4xI-B3t909zQH3JxJ5oHTTFNMpUraTg/view?usp=sharing)',
    '- 04/08/2023 — [The Company signs a contract with the audit firm](https://drive.google.com/file/d/1A4xI-B3t909zQH3JxJ5oHTTFNMpUraTg/view?usp=sharing)',
    '- 04/08/2023 — [公司与审计公司签订合同](https://drive.google.com/file/d/1A4xI-B3t909zQH3JxJ5oHTTFNMpUraTg/view?usp=sharing)',
    '- 04/08/2023 — [회사, 회계법인과 계약 체결](https://drive.google.com/file/d/1A4xI-B3t909zQH3JxJ5oHTTFNMpUraTg/view?usp=sharing)',
    '- 04/08/2023 — [当社、監査法人と契約を締結](https://drive.google.com/file/d/1A4xI-B3t909zQH3JxJ5oHTTFNMpUraTg/view?usp=sharing)',
    '- 04/08/2023 — [บริษัทลงนามสัญญากับบริษัทตรวจสอบบัญชี](https://drive.google.com/file/d/1A4xI-B3t909zQH3JxJ5oHTTFNMpUraTg/view?usp=sharing)',
  ),
  L(
    '- 27/07/2023 — [Báo cáo tình hình quản trị 6 tháng năm 2023](https://drive.google.com/file/d/1IB5h2RgrLRztCNRfEgl8h8v3mW8GJpsM/view?usp=sharing)',
    '- 27/07/2023 — [Corporate governance report for the first six months of 2023](https://drive.google.com/file/d/1IB5h2RgrLRztCNRfEgl8h8v3mW8GJpsM/view?usp=sharing)',
    '- 27/07/2023 — [2023 年上半年公司治理报告](https://drive.google.com/file/d/1IB5h2RgrLRztCNRfEgl8h8v3mW8GJpsM/view?usp=sharing)',
    '- 27/07/2023 — [2023년 상반기 기업지배구조 보고서](https://drive.google.com/file/d/1IB5h2RgrLRztCNRfEgl8h8v3mW8GJpsM/view?usp=sharing)',
    '- 27/07/2023 — [2023年上半期コーポレートガバナンス報告書](https://drive.google.com/file/d/1IB5h2RgrLRztCNRfEgl8h8v3mW8GJpsM/view?usp=sharing)',
    '- 27/07/2023 — [รายงานการกำกับดูแลกิจการ 6 เดือนแรกของปี 2023](https://drive.google.com/file/d/1IB5h2RgrLRztCNRfEgl8h8v3mW8GJpsM/view?usp=sharing)',
  ),
  L(
    '- 20/07/2023 — [Báo cáo tài chính Quý 2 năm 2023](https://drive.google.com/file/d/1cb4q0HUeX8vs6fkjb_CoUnCCxxOZaMSy/view?usp=sharing)',
    '- 20/07/2023 — [Financial statements for Q2 2023](https://drive.google.com/file/d/1cb4q0HUeX8vs6fkjb_CoUnCCxxOZaMSy/view?usp=sharing)',
    '- 20/07/2023 — [2023 年第二季度财务报告](https://drive.google.com/file/d/1cb4q0HUeX8vs6fkjb_CoUnCCxxOZaMSy/view?usp=sharing)',
    '- 20/07/2023 — [2023년 2분기 재무제표](https://drive.google.com/file/d/1cb4q0HUeX8vs6fkjb_CoUnCCxxOZaMSy/view?usp=sharing)',
    '- 20/07/2023 — [2023年第2四半期財務諸表](https://drive.google.com/file/d/1cb4q0HUeX8vs6fkjb_CoUnCCxxOZaMSy/view?usp=sharing)',
    '- 20/07/2023 — [งบการเงินไตรมาส 2 ปี 2023](https://drive.google.com/file/d/1cb4q0HUeX8vs6fkjb_CoUnCCxxOZaMSy/view?usp=sharing)',
  ),
  L(
    '- 28/06/2023 — [Thông báo thay đổi giấy Chứng Nhận Đăng Ký Đầu Tư](https://drive.google.com/file/d/1SnmM1T3vb4gWol2ze_5G_iRAoftYaekd/view)',
    '- 28/06/2023 — [Notice of change to the investment registration certificate](https://drive.google.com/file/d/1SnmM1T3vb4gWol2ze_5G_iRAoftYaekd/view)',
    '- 28/06/2023 — [投资注册证书变更公告](https://drive.google.com/file/d/1SnmM1T3vb4gWol2ze_5G_iRAoftYaekd/view)',
    '- 28/06/2023 — [투자등록증 변경 공고](https://drive.google.com/file/d/1SnmM1T3vb4gWol2ze_5G_iRAoftYaekd/view)',
    '- 28/06/2023 — [投資登録証明書の変更に関するお知らせ](https://drive.google.com/file/d/1SnmM1T3vb4gWol2ze_5G_iRAoftYaekd/view)',
    '- 28/06/2023 — [ประกาศเปลี่ยนแปลงหนังสือรับรองการจดทะเบียนการลงทุน](https://drive.google.com/file/d/1SnmM1T3vb4gWol2ze_5G_iRAoftYaekd/view)',
  ),
  L(
    '- 12/06/2023 — [Báo cáo về ngày trở thành nhà đầu tư nắm giữ từ 5% trở lên cổ phiếu](https://drive.google.com/file/d/17jgev1H7EJ7INN5A9AYy4WWUmpZvNRjm)',
    '- 12/06/2023 — [Report on the date of becoming a shareholder holding 5% or more of the shares](https://drive.google.com/file/d/17jgev1H7EJ7INN5A9AYy4WWUmpZvNRjm)',
    '- 12/06/2023 — [关于成为持股 5% 以上投资者之日的报告](https://drive.google.com/file/d/17jgev1H7EJ7INN5A9AYy4WWUmpZvNRjm)',
    '- 12/06/2023 — [지분 5% 이상 보유 투자자가 된 날짜에 관한 보고](https://drive.google.com/file/d/17jgev1H7EJ7INN5A9AYy4WWUmpZvNRjm)',
    '- 12/06/2023 — [株式を5%以上保有する投資家となった日に関する報告](https://drive.google.com/file/d/17jgev1H7EJ7INN5A9AYy4WWUmpZvNRjm)',
    '- 12/06/2023 — [รายงานวันที่กลายเป็นผู้ลงทุนซึ่งถือหุ้นตั้งแต่ 5% ขึ้นไป](https://drive.google.com/file/d/17jgev1H7EJ7INN5A9AYy4WWUmpZvNRjm)',
  ),
  L(
    '- 01/06/2023 — [Thông báo thay đổi nhân sự](https://drive.google.com/file/d/1kDvSnY4buk9mGTNP9zLFjM8GJ0TnqwM3/view)',
    '- 01/06/2023 — [Notice of personnel change](https://drive.google.com/file/d/1kDvSnY4buk9mGTNP9zLFjM8GJ0TnqwM3/view)',
    '- 01/06/2023 — [人事变动公告](https://drive.google.com/file/d/1kDvSnY4buk9mGTNP9zLFjM8GJ0TnqwM3/view)',
    '- 01/06/2023 — [인사 변경 공고](https://drive.google.com/file/d/1kDvSnY4buk9mGTNP9zLFjM8GJ0TnqwM3/view)',
    '- 01/06/2023 — [人事異動のお知らせ](https://drive.google.com/file/d/1kDvSnY4buk9mGTNP9zLFjM8GJ0TnqwM3/view)',
    '- 01/06/2023 — [ประกาศเปลี่ยนแปลงบุคลากร](https://drive.google.com/file/d/1kDvSnY4buk9mGTNP9zLFjM8GJ0TnqwM3/view)',
  ),
  L(
    '- 12/05/2023 — [Thông báo thay đổi trang thông tin điện tử](https://drive.google.com/file/d/1DIHypBkSrnkxFcftqA69lT33Ddou-cyh/view)',
    '- 12/05/2023 — [Notice of change to the company website](https://drive.google.com/file/d/1DIHypBkSrnkxFcftqA69lT33Ddou-cyh/view)',
    '- 12/05/2023 — [电子信息网站变更公告](https://drive.google.com/file/d/1DIHypBkSrnkxFcftqA69lT33Ddou-cyh/view)',
    '- 12/05/2023 — [회사 웹사이트 변경 공고](https://drive.google.com/file/d/1DIHypBkSrnkxFcftqA69lT33Ddou-cyh/view)',
    '- 12/05/2023 — [ウェブサイト変更のお知らせ](https://drive.google.com/file/d/1DIHypBkSrnkxFcftqA69lT33Ddou-cyh/view)',
    '- 12/05/2023 — [ประกาศเปลี่ยนแปลงเว็บไซต์ของบริษัท](https://drive.google.com/file/d/1DIHypBkSrnkxFcftqA69lT33Ddou-cyh/view)',
  ),
  L(
    '- 05/05/2023 — [Thông báo thay đổi nhân sự - Bầu lại Chủ tịch HĐQT, Chủ tịch UBKT, thay đổi Người ĐDPL](https://drive.google.com/file/d/1k4YRQy1ACl2mLPS050fxEdJz3adtFSmT/view?usp=sharing)',
    '- 05/05/2023 — [Notice of personnel change — re-election of the Chairman of the Board and the Chairman of the Audit Committee, and change of the legal representative](https://drive.google.com/file/d/1k4YRQy1ACl2mLPS050fxEdJz3adtFSmT/view?usp=sharing)',
    '- 05/05/2023 — [人事变动公告 — 改选董事长、审计委员会主席，并变更法定代表人](https://drive.google.com/file/d/1k4YRQy1ACl2mLPS050fxEdJz3adtFSmT/view?usp=sharing)',
    '- 05/05/2023 — [인사 변경 공고 — 이사회 의장 및 감사위원장 재선임, 법정대리인 변경](https://drive.google.com/file/d/1k4YRQy1ACl2mLPS050fxEdJz3adtFSmT/view?usp=sharing)',
    '- 05/05/2023 — [人事異動のお知らせ — 取締役会議長および監査委員会委員長の再選、法定代表者の変更](https://drive.google.com/file/d/1k4YRQy1ACl2mLPS050fxEdJz3adtFSmT/view?usp=sharing)',
    '- 05/05/2023 — [ประกาศเปลี่ยนแปลงบุคลากร — เลือกตั้งประธานกรรมการและประธานคณะกรรมการตรวจสอบใหม่ และเปลี่ยนผู้แทนตามกฎหมาย](https://drive.google.com/file/d/1k4YRQy1ACl2mLPS050fxEdJz3adtFSmT/view?usp=sharing)',
  ),
  L(
    '- 26/04/2023 — [Công bố thông tin thay đổi nhân sự thành viên Hội Đồng Quản Trị (PDF)](https://drive.google.com/file/d/1FaKnZxvjHWCKR3MzyOPVf02dsUJpRH0h/view)',
    '- 26/04/2023 — [Disclosure on the change of members of the Board of Directors (PDF)](https://drive.google.com/file/d/1FaKnZxvjHWCKR3MzyOPVf02dsUJpRH0h/view)',
    '- 26/04/2023 — [董事会成员变动信息披露（PDF）](https://drive.google.com/file/d/1FaKnZxvjHWCKR3MzyOPVf02dsUJpRH0h/view)',
    '- 26/04/2023 — [이사회 구성원 변경 공시 (PDF)](https://drive.google.com/file/d/1FaKnZxvjHWCKR3MzyOPVf02dsUJpRH0h/view)',
    '- 26/04/2023 — [取締役会構成員の変更に関する開示（PDF）](https://drive.google.com/file/d/1FaKnZxvjHWCKR3MzyOPVf02dsUJpRH0h/view)',
    '- 26/04/2023 — [การเปิดเผยข้อมูลการเปลี่ยนแปลงกรรมการบริษัท (PDF)](https://drive.google.com/file/d/1FaKnZxvjHWCKR3MzyOPVf02dsUJpRH0h/view)',
  ),
  L(
    '- 26/04/2023 — [Biên bản, Nghị quyết Đại hội đồng cổ đông thường niên năm 2023](https://drive.google.com/file/d/1R4fWFIr7ERy1762EOcGUAMmZRX2FK_vq/view)',
    '- 26/04/2023 — [Minutes and resolution of the 2023 annual general meeting of shareholders](https://drive.google.com/file/d/1R4fWFIr7ERy1762EOcGUAMmZRX2FK_vq/view)',
    '- 26/04/2023 — [2023 年年度股东大会会议记录与决议](https://drive.google.com/file/d/1R4fWFIr7ERy1762EOcGUAMmZRX2FK_vq/view)',
    '- 26/04/2023 — [2023년 정기 주주총회 회의록 및 결의](https://drive.google.com/file/d/1R4fWFIr7ERy1762EOcGUAMmZRX2FK_vq/view)',
    '- 26/04/2023 — [2023年定時株主総会議事録および決議](https://drive.google.com/file/d/1R4fWFIr7ERy1762EOcGUAMmZRX2FK_vq/view)',
    '- 26/04/2023 — [รายงานการประชุมและมติที่ประชุมสามัญผู้ถือหุ้นประจำปี 2023](https://drive.google.com/file/d/1R4fWFIr7ERy1762EOcGUAMmZRX2FK_vq/view)',
  ),
  L(
    '- 25/04/2023 — [Tài liệu cập nhật đại hội cổ đông thường niên năm 2023](https://drive.google.com/file/d/1ydiQkux3OdRB-zVzLmt7EiBo0zSVnx1u/view)',
    '- 25/04/2023 — [Updated documents for the 2023 annual general meeting of shareholders](https://drive.google.com/file/d/1ydiQkux3OdRB-zVzLmt7EiBo0zSVnx1u/view)',
    '- 25/04/2023 — [2023 年年度股东大会更新文件](https://drive.google.com/file/d/1ydiQkux3OdRB-zVzLmt7EiBo0zSVnx1u/view)',
    '- 25/04/2023 — [2023년 정기 주주총회 갱신 자료](https://drive.google.com/file/d/1ydiQkux3OdRB-zVzLmt7EiBo0zSVnx1u/view)',
    '- 25/04/2023 — [2023年定時株主総会の更新資料](https://drive.google.com/file/d/1ydiQkux3OdRB-zVzLmt7EiBo0zSVnx1u/view)',
    '- 25/04/2023 — [เอกสารปรับปรุงสำหรับการประชุมสามัญผู้ถือหุ้นประจำปี 2023](https://drive.google.com/file/d/1ydiQkux3OdRB-zVzLmt7EiBo0zSVnx1u/view)',
  ),
  L(
    '- 25/04/2023 — [Công bố lý lịch thành viên Hội Đồng Quản Trị (PDF)](https://drive.google.com/file/d/1ggk0rks5DwJHp9iTD9Yj_-H-jXWKOGnd/view)',
    '- 25/04/2023 — [Publication of the curricula vitae of the members of the Board of Directors (PDF)](https://drive.google.com/file/d/1ggk0rks5DwJHp9iTD9Yj_-H-jXWKOGnd/view)',
    '- 25/04/2023 — [公布董事会成员履历（PDF）](https://drive.google.com/file/d/1ggk0rks5DwJHp9iTD9Yj_-H-jXWKOGnd/view)',
    '- 25/04/2023 — [이사회 구성원 이력 공표 (PDF)](https://drive.google.com/file/d/1ggk0rks5DwJHp9iTD9Yj_-H-jXWKOGnd/view)',
    '- 25/04/2023 — [取締役会構成員の経歴の公表（PDF）](https://drive.google.com/file/d/1ggk0rks5DwJHp9iTD9Yj_-H-jXWKOGnd/view)',
    '- 25/04/2023 — [การเปิดเผยประวัติกรรมการบริษัท (PDF)](https://drive.google.com/file/d/1ggk0rks5DwJHp9iTD9Yj_-H-jXWKOGnd/view)',
  ),
  L(
    '- 25/04/2023 — [Đơn xin từ chức thành viên HĐQT của Bà Nguyễn Khoa Hoàng Oanh (PDF)](https://drive.google.com/file/d/1PRlFbXg1Pjk8DcUILW0o5ffFrHFUj9ht/view)',
    '- 25/04/2023 — [Letter of resignation from the Board of Directors by Ms Nguyen Khoa Hoang Oanh (PDF)](https://drive.google.com/file/d/1PRlFbXg1Pjk8DcUILW0o5ffFrHFUj9ht/view)',
    '- 25/04/2023 — [阮科黄莺女士辞去董事会成员职务的辞呈（PDF）](https://drive.google.com/file/d/1PRlFbXg1Pjk8DcUILW0o5ffFrHFUj9ht/view)',
    '- 25/04/2023 — [응우옌 코아 호앙 오안 여사의 이사직 사임서 (PDF)](https://drive.google.com/file/d/1PRlFbXg1Pjk8DcUILW0o5ffFrHFUj9ht/view)',
    '- 25/04/2023 — [グエン・コア・ホアン・オアイン氏の取締役辞任届（PDF）](https://drive.google.com/file/d/1PRlFbXg1Pjk8DcUILW0o5ffFrHFUj9ht/view)',
    '- 25/04/2023 — [หนังสือลาออกจากตำแหน่งกรรมการบริษัทของนางเหงียน คัว หว่าง โอัญ (PDF)](https://drive.google.com/file/d/1PRlFbXg1Pjk8DcUILW0o5ffFrHFUj9ht/view)',
  ),
  L(
    '- 24/04/2023 — [Công bố đường Link tham dự đại hội cổ đông thường niên năm 2023 (PDF)](https://ric.dhcdonline.com/)',
    '- 24/04/2023 — [Publication of the link to attend the 2023 annual general meeting of shareholders (PDF)](https://ric.dhcdonline.com/)',
    '- 24/04/2023 — [公布参加 2023 年年度股东大会的链接（PDF）](https://ric.dhcdonline.com/)',
    '- 24/04/2023 — [2023년 정기 주주총회 참석 링크 공표 (PDF)](https://ric.dhcdonline.com/)',
    '- 24/04/2023 — [2023年定時株主総会 参加リンクの公表（PDF）](https://ric.dhcdonline.com/)',
    '- 24/04/2023 — [การเปิดเผยลิงก์เข้าร่วมประชุมสามัญผู้ถือหุ้นประจำปี 2023 (PDF)](https://ric.dhcdonline.com/)',
  ),
  L(
    '- 24/04/2023 — [Tài liệu hướng dẫn tham dự đại hội cổ đông thường niên năm 2023 bằng hình thức trực tuyến (PDF)](https://drive.google.com/file/d/1WHPOMEWYyF00fwzY4tyyCuKZ6PzwF_65/view)',
    '- 24/04/2023 — [Guide to attending the 2023 annual general meeting of shareholders online (PDF)](https://drive.google.com/file/d/1WHPOMEWYyF00fwzY4tyyCuKZ6PzwF_65/view)',
    '- 24/04/2023 — [2023 年年度股东大会线上参会指南（PDF）](https://drive.google.com/file/d/1WHPOMEWYyF00fwzY4tyyCuKZ6PzwF_65/view)',
    '- 24/04/2023 — [2023년 정기 주주총회 온라인 참석 안내 자료 (PDF)](https://drive.google.com/file/d/1WHPOMEWYyF00fwzY4tyyCuKZ6PzwF_65/view)',
    '- 24/04/2023 — [2023年定時株主総会 オンライン参加ガイド（PDF）](https://drive.google.com/file/d/1WHPOMEWYyF00fwzY4tyyCuKZ6PzwF_65/view)',
    '- 24/04/2023 — [เอกสารคู่มือการเข้าร่วมประชุมสามัญผู้ถือหุ้นประจำปี 2023 แบบออนไลน์ (PDF)](https://drive.google.com/file/d/1WHPOMEWYyF00fwzY4tyyCuKZ6PzwF_65/view)',
  ),
  L(
    '- 20/04/2023 — [Công ty cổ phần Quốc tế Hoàng Gia công bố báo cáo thường niên năm 2022 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 20/04/2023 — [Royal International Corporation discloses the 2022 annual report (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 20/04/2023 — [皇家国际股份公司公布 2022 年年度报告（PDF）](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 20/04/2023 — [호앙지아 국제주식회사, 2022년 연차보고서 공시 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 20/04/2023 — [ホアンザー国際株式会社、2022年年次報告書を開示（PDF）](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 20/04/2023 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยรายงานประจำปี 2022 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
  ),
  L(
    '- 20/04/2023 — [Công ty cổ phần Quốc tế Hoàng Gia công bố báo cáo tài chính quý I năm 2023 (PDF)](https://drive.google.com/file/d/13FWZ8q9JvHIIlg_utTZj88zRWRpqBeDD/view)',
    '- 20/04/2023 — [Royal International Corporation discloses the financial statements for Q1 2023 (PDF)](https://drive.google.com/file/d/13FWZ8q9JvHIIlg_utTZj88zRWRpqBeDD/view)',
    '- 20/04/2023 — [皇家国际股份公司公布 2023 年第一季度财务报告（PDF）](https://drive.google.com/file/d/13FWZ8q9JvHIIlg_utTZj88zRWRpqBeDD/view)',
    '- 20/04/2023 — [호앙지아 국제주식회사, 2023년 1분기 재무제표 공시 (PDF)](https://drive.google.com/file/d/13FWZ8q9JvHIIlg_utTZj88zRWRpqBeDD/view)',
    '- 20/04/2023 — [ホアンザー国際株式会社、2023年第1四半期財務諸表を開示（PDF）](https://drive.google.com/file/d/13FWZ8q9JvHIIlg_utTZj88zRWRpqBeDD/view)',
    '- 20/04/2023 — [บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล เปิดเผยงบการเงินไตรมาส 1 ปี 2023 (PDF)](https://drive.google.com/file/d/13FWZ8q9JvHIIlg_utTZj88zRWRpqBeDD/view)',
  ),
  L(
    '- 17/04/2023 — [Thông báo thay đổi nhân sự Kế toán trưởng (PDF)](https://drive.google.com/file/d/19MYJ7v-UQENjKTpB8hiMXoJHpggv6KAa/view)',
    '- 17/04/2023 — [Notice of personnel change — chief accountant (PDF)](https://drive.google.com/file/d/19MYJ7v-UQENjKTpB8hiMXoJHpggv6KAa/view)',
    '- 17/04/2023 — [总会计师人事变动公告（PDF）](https://drive.google.com/file/d/19MYJ7v-UQENjKTpB8hiMXoJHpggv6KAa/view)',
    '- 17/04/2023 — [인사 변경 공고 — 회계책임자 (PDF)](https://drive.google.com/file/d/19MYJ7v-UQENjKTpB8hiMXoJHpggv6KAa/view)',
    '- 17/04/2023 — [人事異動のお知らせ — 経理責任者（PDF）](https://drive.google.com/file/d/19MYJ7v-UQENjKTpB8hiMXoJHpggv6KAa/view)',
    '- 17/04/2023 — [ประกาศเปลี่ยนแปลงบุคลากร — หัวหน้าฝ่ายบัญชี (PDF)](https://drive.google.com/file/d/19MYJ7v-UQENjKTpB8hiMXoJHpggv6KAa/view)',
  ),
  L(
    '- 31/03/2023 — [Báo cáo tài chính đã kiểm toán năm 2022 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 31/03/2023 — [Audited financial statements for 2022 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 31/03/2023 — [2022 年经审计财务报告（PDF）](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 31/03/2023 — [2022년 감사받은 재무제표 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 31/03/2023 — [2022年監査済み財務諸表（PDF）](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
    '- 31/03/2023 — [งบการเงินที่ตรวจสอบแล้ว ปี 2022 (PDF)](https://drive.google.com/file/d/1GsII_rW7GRc_OmbJiYlmepVP3evSpcUs/view)',
  ),
  L(
    '- 06/03/2023 — [Công bố thông tin về việc tổ chức Đại hội đồng cổ đông thường niên năm 2023 (PDF)](https://drive.google.com/file/d/1h3YQWXDULV5qmMdcVud6gtMyZqgYG7LU/view)',
    '- 06/03/2023 — [Disclosure on the holding of the 2023 annual general meeting of shareholders (PDF)](https://drive.google.com/file/d/1h3YQWXDULV5qmMdcVud6gtMyZqgYG7LU/view)',
    '- 06/03/2023 — [关于召开 2023 年年度股东大会的信息披露（PDF）](https://drive.google.com/file/d/1h3YQWXDULV5qmMdcVud6gtMyZqgYG7LU/view)',
    '- 06/03/2023 — [2023년 정기 주주총회 개최에 관한 공시 (PDF)](https://drive.google.com/file/d/1h3YQWXDULV5qmMdcVud6gtMyZqgYG7LU/view)',
    '- 06/03/2023 — [2023年定時株主総会の開催に関する開示（PDF）](https://drive.google.com/file/d/1h3YQWXDULV5qmMdcVud6gtMyZqgYG7LU/view)',
    '- 06/03/2023 — [การเปิดเผยข้อมูลเรื่องการจัดประชุมสามัญผู้ถือหุ้นประจำปี 2023 (PDF)](https://drive.google.com/file/d/1h3YQWXDULV5qmMdcVud6gtMyZqgYG7LU/view)',
  ),
  L(
    '- 20/10/2022 — [Báo cáo tài chính quý 3 năm 2022 (PDF)](https://drive.google.com/file/d/1Hu9zikaIZYcxIQy9i2K9jBgW-SRq0Fwo/view)',
    '- 20/10/2022 — [Financial statements for Q3 2022 (PDF)](https://drive.google.com/file/d/1Hu9zikaIZYcxIQy9i2K9jBgW-SRq0Fwo/view)',
    '- 20/10/2022 — [2022 年第三季度财务报告（PDF）](https://drive.google.com/file/d/1Hu9zikaIZYcxIQy9i2K9jBgW-SRq0Fwo/view)',
    '- 20/10/2022 — [2022년 3분기 재무제표 (PDF)](https://drive.google.com/file/d/1Hu9zikaIZYcxIQy9i2K9jBgW-SRq0Fwo/view)',
    '- 20/10/2022 — [2022年第3四半期財務諸表（PDF）](https://drive.google.com/file/d/1Hu9zikaIZYcxIQy9i2K9jBgW-SRq0Fwo/view)',
    '- 20/10/2022 — [งบการเงินไตรมาส 3 ปี 2022 (PDF)](https://drive.google.com/file/d/1Hu9zikaIZYcxIQy9i2K9jBgW-SRq0Fwo/view)',
  ),
  L(
    '- 09/09/2022 — [Thông báo thay đổi nhân sự (PDF)](https://drive.google.com/file/d/1hWD9xi-YlJujEfBWk-xT6uL_gFlogGpl/view)',
    '- 09/09/2022 — [Notice of personnel change (PDF)](https://drive.google.com/file/d/1hWD9xi-YlJujEfBWk-xT6uL_gFlogGpl/view)',
    '- 09/09/2022 — [人事变动公告（PDF）](https://drive.google.com/file/d/1hWD9xi-YlJujEfBWk-xT6uL_gFlogGpl/view)',
    '- 09/09/2022 — [인사 변경 공고 (PDF)](https://drive.google.com/file/d/1hWD9xi-YlJujEfBWk-xT6uL_gFlogGpl/view)',
    '- 09/09/2022 — [人事異動のお知らせ（PDF）](https://drive.google.com/file/d/1hWD9xi-YlJujEfBWk-xT6uL_gFlogGpl/view)',
    '- 09/09/2022 — [ประกาศเปลี่ยนแปลงบุคลากร (PDF)](https://drive.google.com/file/d/1hWD9xi-YlJujEfBWk-xT6uL_gFlogGpl/view)',
  ),
  L(
    '- 22/07/2022 — [Báo cáo tình hình quản trị 6 tháng năm 2022 (PDF)](https://drive.google.com/file/d/10tTtj_VIn6TknYeOa-yFv_zL_EyabV_L/view)',
    '- 22/07/2022 — [Corporate governance report for the first six months of 2022 (PDF)](https://drive.google.com/file/d/10tTtj_VIn6TknYeOa-yFv_zL_EyabV_L/view)',
    '- 22/07/2022 — [2022 年上半年公司治理报告（PDF）](https://drive.google.com/file/d/10tTtj_VIn6TknYeOa-yFv_zL_EyabV_L/view)',
    '- 22/07/2022 — [2022년 상반기 기업지배구조 보고서 (PDF)](https://drive.google.com/file/d/10tTtj_VIn6TknYeOa-yFv_zL_EyabV_L/view)',
    '- 22/07/2022 — [2022年上半期コーポレートガバナンス報告書（PDF）](https://drive.google.com/file/d/10tTtj_VIn6TknYeOa-yFv_zL_EyabV_L/view)',
    '- 22/07/2022 — [รายงานการกำกับดูแลกิจการ 6 เดือนแรกของปี 2022 (PDF)](https://drive.google.com/file/d/10tTtj_VIn6TknYeOa-yFv_zL_EyabV_L/view)',
  ),
  L(
    '- 20/07/2022 — [Báo cáo tài chính Quý 2 năm 2022 (PDF)](https://drive.google.com/file/d/1rFDUj9HOdl2ik2ea35U9pYU5HSBLUw_9/view)',
    '- 20/07/2022 — [Financial statements for Q2 2022 (PDF)](https://drive.google.com/file/d/1rFDUj9HOdl2ik2ea35U9pYU5HSBLUw_9/view)',
    '- 20/07/2022 — [2022 年第二季度财务报告（PDF）](https://drive.google.com/file/d/1rFDUj9HOdl2ik2ea35U9pYU5HSBLUw_9/view)',
    '- 20/07/2022 — [2022년 2분기 재무제표 (PDF)](https://drive.google.com/file/d/1rFDUj9HOdl2ik2ea35U9pYU5HSBLUw_9/view)',
    '- 20/07/2022 — [2022年第2四半期財務諸表（PDF）](https://drive.google.com/file/d/1rFDUj9HOdl2ik2ea35U9pYU5HSBLUw_9/view)',
    '- 20/07/2022 — [งบการเงินไตรมาส 2 ปี 2022 (PDF)](https://drive.google.com/file/d/1rFDUj9HOdl2ik2ea35U9pYU5HSBLUw_9/view)',
  ),
  L(
    '- 11/07/2022 — [Công bố thông tin về việc ký Hợp đồng dịch vụ kiểm toán (PDF)](https://drive.google.com/file/d/18u8nVgYDfiGeW2gEsEPT4Zb_bpQ139wH/view)',
    '- 11/07/2022 — [Disclosure on the signing of an audit service contract (PDF)](https://drive.google.com/file/d/18u8nVgYDfiGeW2gEsEPT4Zb_bpQ139wH/view)',
    '- 11/07/2022 — [关于签订审计服务合同的信息披露（PDF）](https://drive.google.com/file/d/18u8nVgYDfiGeW2gEsEPT4Zb_bpQ139wH/view)',
    '- 11/07/2022 — [감사 용역 계약 체결에 관한 공시 (PDF)](https://drive.google.com/file/d/18u8nVgYDfiGeW2gEsEPT4Zb_bpQ139wH/view)',
    '- 11/07/2022 — [監査業務契約の締結に関する開示（PDF）](https://drive.google.com/file/d/18u8nVgYDfiGeW2gEsEPT4Zb_bpQ139wH/view)',
    '- 11/07/2022 — [การเปิดเผยข้อมูลเรื่องการลงนามสัญญาบริการตรวจสอบบัญชี (PDF)](https://drive.google.com/file/d/18u8nVgYDfiGeW2gEsEPT4Zb_bpQ139wH/view)',
  ),
  L(
    '- 14/06/2022 — [Đơn xin thôi việc của người nội bộ (PDF)](https://drive.google.com/file/d/1mgetjJOhcIP1Ip5qec17WJLEjf3SLU9K/view)',
    '- 14/06/2022 — [Letter of resignation from an insider (PDF)](https://drive.google.com/file/d/1mgetjJOhcIP1Ip5qec17WJLEjf3SLU9K/view)',
    '- 14/06/2022 — [内部人员辞职申请（PDF）](https://drive.google.com/file/d/1mgetjJOhcIP1Ip5qec17WJLEjf3SLU9K/view)',
    '- 14/06/2022 — [내부자 사직서 (PDF)](https://drive.google.com/file/d/1mgetjJOhcIP1Ip5qec17WJLEjf3SLU9K/view)',
    '- 14/06/2022 — [内部者の退職願（PDF）](https://drive.google.com/file/d/1mgetjJOhcIP1Ip5qec17WJLEjf3SLU9K/view)',
    '- 14/06/2022 — [หนังสือลาออกของบุคคลภายใน (PDF)](https://drive.google.com/file/d/1mgetjJOhcIP1Ip5qec17WJLEjf3SLU9K/view)',
  ),
  L(
    '- 14/06/2022 — [Thông báo thay đổi nhân sự (PDF)](https://drive.google.com/file/d/1vg_Zbky5-tD_UjXKv5dR0A_vk3JGoE0l/view)',
    '- 14/06/2022 — [Notice of personnel change (PDF)](https://drive.google.com/file/d/1vg_Zbky5-tD_UjXKv5dR0A_vk3JGoE0l/view)',
    '- 14/06/2022 — [人事变动公告（PDF）](https://drive.google.com/file/d/1vg_Zbky5-tD_UjXKv5dR0A_vk3JGoE0l/view)',
    '- 14/06/2022 — [인사 변경 공고 (PDF)](https://drive.google.com/file/d/1vg_Zbky5-tD_UjXKv5dR0A_vk3JGoE0l/view)',
    '- 14/06/2022 — [人事異動のお知らせ（PDF）](https://drive.google.com/file/d/1vg_Zbky5-tD_UjXKv5dR0A_vk3JGoE0l/view)',
    '- 14/06/2022 — [ประกาศเปลี่ยนแปลงบุคลากร (PDF)](https://drive.google.com/file/d/1vg_Zbky5-tD_UjXKv5dR0A_vk3JGoE0l/view)',
  ),
  L(
    '- 23/05/2022 — [Thông báo ngày giao dịch đầu tiên của cổ phiếu RIC trên Upcom (PDF)](https://drive.google.com/file/d/13z-7UVLrraQk-QBPGsxUvbb_IC2jKbYo/view)',
    '- 23/05/2022 — [Notice of the first trading day of RIC shares on UPCoM (PDF)](https://drive.google.com/file/d/13z-7UVLrraQk-QBPGsxUvbb_IC2jKbYo/view)',
    '- 23/05/2022 — [RIC 股票在 UPCoM 首个交易日公告（PDF）](https://drive.google.com/file/d/13z-7UVLrraQk-QBPGsxUvbb_IC2jKbYo/view)',
    '- 23/05/2022 — [RIC 주식의 UPCoM 최초 거래일 공고 (PDF)](https://drive.google.com/file/d/13z-7UVLrraQk-QBPGsxUvbb_IC2jKbYo/view)',
    '- 23/05/2022 — [RIC株式のUPCoMにおける初取引日のお知らせ（PDF）](https://drive.google.com/file/d/13z-7UVLrraQk-QBPGsxUvbb_IC2jKbYo/view)',
    '- 23/05/2022 — [ประกาศวันซื้อขายวันแรกของหุ้น RIC ในตลาด UPCoM (PDF)](https://drive.google.com/file/d/13z-7UVLrraQk-QBPGsxUvbb_IC2jKbYo/view)',
  ),
  L(
    '- 23/05/2022 — [Quyết định chấp thuận đăng ký giao dịch cổ phiếu RIC trên thị trường Upcom (PDF)](https://drive.google.com/file/d/1j5lMrp_sn9MBvidWTGuIXC2ZVfMTxYFZ/view)',
    '- 23/05/2022 — [Decision approving the registration of RIC shares for trading on the UPCoM market (PDF)](https://drive.google.com/file/d/1j5lMrp_sn9MBvidWTGuIXC2ZVfMTxYFZ/view)',
    '- 23/05/2022 — [批准 RIC 股票在 UPCoM 市场登记交易的决定（PDF）](https://drive.google.com/file/d/1j5lMrp_sn9MBvidWTGuIXC2ZVfMTxYFZ/view)',
    '- 23/05/2022 — [RIC 주식의 UPCoM 시장 거래 등록 승인 결정 (PDF)](https://drive.google.com/file/d/1j5lMrp_sn9MBvidWTGuIXC2ZVfMTxYFZ/view)',
    '- 23/05/2022 — [RIC株式のUPCoM市場での取引登録を承認する決定（PDF）](https://drive.google.com/file/d/1j5lMrp_sn9MBvidWTGuIXC2ZVfMTxYFZ/view)',
    '- 23/05/2022 — [มติอนุมัติการจดทะเบียนซื้อขายหุ้น RIC ในตลาด UPCoM (PDF)](https://drive.google.com/file/d/1j5lMrp_sn9MBvidWTGuIXC2ZVfMTxYFZ/view)',
  ),
]

const ANN_SEO = seo(
  L(
    'Công bố thông tin — Công ty Cổ phần Quốc tế Hoàng Gia (RIC)',
    'Information disclosure — Royal International Corporation (RIC)',
    '信息披露 — 皇家国际股份公司（RIC）',
    '정보 공시 — 호앙지아 국제주식회사(RIC)',
    '情報開示 — ホアンザー国際株式会社（RIC）',
    'การเปิดเผยข้อมูล — บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล (RIC)',
  ),
  L(
    'Báo cáo tài chính, báo cáo thường niên, nghị quyết đại hội đồng cổ đông và các công bố thông tin khác của Công ty Cổ phần Quốc tế Hoàng Gia (mã chứng khoán RIC).',
    'Financial statements, annual reports, shareholder resolutions and other disclosures from Royal International Corporation (ticker RIC).',
    '皇家国际股份公司（股票代码 RIC）的财务报告、年度报告、股东大会决议及其他信息披露。',
    '호앙지아 국제주식회사(종목코드 RIC)의 재무제표, 연차보고서, 주주총회 결의 및 기타 공시 자료입니다.',
    'ホアンザー国際株式会社（証券コード RIC）の財務諸表、年次報告書、株主総会決議、その他の開示資料。',
    'งบการเงิน รายงานประจำปี มติที่ประชุมผู้ถือหุ้น และการเปิดเผยข้อมูลอื่น ๆ ของบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล (รหัสหลักทรัพย์ RIC)',
  ),
)
/* ══════════════════════════════════════════════════════════════════ *
 *  page.reservation  — hero + widget SecureBookings, không có chữ khác
 * ══════════════════════════════════════════════════════════════════ */

const RESV_TITLE = L('ĐẶT PHÒNG', 'BOOK NOW', '立即预订', '지금 예약', '今すぐ予約', 'จองเลย')

const RESV_SUB = L(
  'TẬN HƯỞNG NHỮNG TRẢI NGHIỆM SANG TRỌNG VÀ THƯ GIÃN',
  'A STAY MADE FOR COMFORT AND CALM',
  '尽享奢华与惬意的停留时光',
  '품격 있고 편안한 머무름을 누리세요',
  '上質で心安らぐひとときを',
  'สัมผัสการพักผ่อนที่หรูหราและผ่อนคลาย',
)

const RESV_HERO_ALT = L(
  'Nhìn qua cửa gỗ vào phòng hai giường đơn trải ga trắng, bàn làm việc và cửa sổ rèm voan mở ra sườn đồi xanh',
  'Looking through an open timber door into a twin room: two white-linen beds, a writing desk and a sheer-curtained window onto a green hillside',
  '透过敞开的木门望进双床房：两张铺着白色床品的床、书桌，以及薄纱窗帘外的青翠山坡',
  '열린 원목 문 너머로 보이는 트윈 룸 — 흰 침구의 침대 두 개, 책상, 그리고 시어 커튼 너머 초록 언덕',
  '開いた木の扉の向こうのツインルーム。白いリネンのベッド2台、デスク、シアーカーテン越しの緑の丘',
  'มองผ่านประตูไม้ที่เปิดอยู่เข้าไปในห้องเตียงคู่ เตียงปูผ้าขาวสองเตียง โต๊ะทำงาน และหน้าต่างผ้าม่านโปร่งเห็นเนินเขาเขียว',
)

const RESV_SEO = seo(
  L(
    'Đặt phòng — Royal Hạ Long Hotel',
    'Book your stay — Royal Ha Long Hotel',
    '在线预订 — Royal Ha Long Hotel',
    '객실 예약 — Royal Ha Long Hotel',
    'ご予約 — Royal Ha Long Hotel',
    'จองห้องพัก — Royal Ha Long Hotel',
  ),
  L(
    'Đặt phòng trực tuyến tại Royal Hạ Long Hotel & Villas: 156 phòng khách sạn 5 sao và 11 toà villa, ngay trung tâm Bãi Cháy, cách biển 2 phút đi bộ.',
    'Book directly at Royal Ha Long Hotel & Villas: 156 five-star rooms and 11 villas in the heart of Bai Chay, two minutes’ walk from the beach.',
    '在 Royal Ha Long Hotel & Villas 官网直接预订：156 间五星级客房与 11 栋别墅，位于拜寨中心，步行两分钟即达海滩。',
    'Royal Ha Long Hotel & Villas 공식 예약 — 바이짜이 중심, 해변까지 도보 2분 거리의 5성급 객실 156실과 빌라 11동.',
    'Royal Ha Long Hotel & Villas 公式予約。バイチャイ中心、ビーチまで徒歩2分の5つ星客室156室とヴィラ11棟。',
    'จองโดยตรงกับ Royal Ha Long Hotel & Villas ห้องพักระดับห้าดาว 156 ห้องและวิลล่า 11 หลัง ใจกลางบ๊ายจ๋าย ห่างจากชายหาดเพียง 2 นาที',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  page.payment-methods
 * ══════════════════════════════════════════════════════════════════ */

const PAY_TITLE = L(
  'PHƯƠNG THỨC THANH TOÁN',
  'PAYMENT METHODS',
  '支付方式',
  '결제 수단',
  'お支払い方法',
  'วิธีการชำระเงิน',
)

const PAY_HERO_ALT = L(
  'Hai nhân viên lễ tân mặc đồng phục vàng kem tiếp đón đôi khách tại quầy lễ tân dưới đèn chùm pha lê',
  'Two receptionists in cream uniforms welcoming a couple at the front desk beneath crystal chandeliers',
  '两位身着米色制服的前台接待员在水晶吊灯下迎接一对客人',
  '크리스털 샹들리에 아래 프런트 데스크에서 커플을 맞이하는 크림색 유니폼 차림의 리셉션 직원 두 명',
  'クリスタルシャンデリアの下、フロントデスクでカップルを迎えるクリーム色の制服のスタッフ2名',
  'พนักงานต้อนรับสองคนในชุดยูนิฟอร์มสีครีมต้อนรับคู่รักที่เคาน์เตอร์ ใต้โคมระย้าคริสตัล',
)

const PAY_1 = [
  L(
    'Khách hàng có thể lựa chọn 01 trong 02 phương thức thanh toán sau:',
    'Guests may choose either of the following two payment methods:',
    '宾客可在以下两种支付方式中任选其一：',
    '고객께서는 다음 두 가지 결제 수단 중 하나를 선택하실 수 있습니다.',
    'お客様は次の2つのお支払い方法のいずれかをお選びいただけます。',
    'ท่านสามารถเลือกชำระเงินได้ 1 ใน 2 วิธีต่อไปนี้',
  ),
  L(
    '**Thanh toán bằng thẻ tín dụng qua One Pay** (payment link).',
    '**Credit card payment through One Pay** (payment link).',
    '**通过 One Pay 使用信用卡支付**（支付链接）。',
    '**One Pay를 통한 신용카드 결제** (결제 링크).',
    '**One Pay によるクレジットカード決済**（ペイメントリンク）。',
    '**ชำระด้วยบัตรเครดิตผ่าน One Pay** (ลิงก์ชำระเงิน)',
  ),
  L(
    '**Thanh toán chuyển khoản ngân hàng:**',
    '**Payment by bank transfer:**',
    '**银行转账支付：**',
    '**계좌 이체 결제:**',
    '**銀行振込によるお支払い：**',
    '**ชำระด้วยการโอนเงินผ่านธนาคาร:**',
  ),
  L(
    '**Tên tài khoản:** CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA',
    '**Account name:** CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA (Royal International Corporation)',
    '**账户名称：** CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA（皇家国际股份公司）',
    '**예금주:** CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA (호앙지아 국제주식회사)',
    '**口座名義：** CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA（ホアンザー国際株式会社）',
    '**ชื่อบัญชี:** CÔNG TY CỔ PHẦN QUỐC TẾ HOÀNG GIA (บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล จำกัด มหาชน)',
  ),
  L(
    '**Địa chỉ:** Đường Hạ Long, Phường Bãi Cháy, TP Hạ Long, Tỉnh Quảng Ninh, Việt Nam',
    '**Address:** Ha Long Road, Bai Chay Ward, Ha Long City, Quang Ninh Province, Vietnam',
    '**地址：** 越南广宁省下龙市拜寨坊下龙路',
    '**주소:** 베트남 꽝닌성 하롱시 바이짜이동 하롱로',
    '**住所：** ベトナム・クアンニン省ハロン市バイチャイ坊ハロン通り',
    '**ที่อยู่:** ถนนฮาลอง แขวงบ๊ายจ๋าย เมืองฮาลอง จังหวัดกว๋างนิญ ประเทศเวียดนาม',
  ),
  L(
    '**Số Tài khoản:** 662100000168',
    '**Account number:** 662100000168',
    '**账号：** 662100000168',
    '**계좌번호:** 662100000168',
    '**口座番号：** 662100000168',
    '**เลขที่บัญชี:** 662100000168',
  ),
  L(
    '**Tại ngân hàng:** Ngân hàng TMCP Đại Chúng Việt Nam – Chi nhánh Quảng Ninh',
    '**Bank:** Vietnam Public Joint Stock Commercial Bank (PVcomBank) – Quang Ninh branch',
    '**开户银行：** 越南大众商业股份银行（PVcomBank）广宁分行',
    '**은행:** 베트남 대중상업은행(PVcomBank) 꽝닌 지점',
    '**銀行：** ベトナム大衆商業銀行（PVcomBank）クアンニン支店',
    '**ธนาคาร:** Vietnam Public Joint Stock Commercial Bank (PVcomBank) สาขากว๋างนิญ',
  ),
  L(
    '**Nội dung chuyển khoản:** (i) Tên Khách/ Đối Tác; (ii) Mã số Yêu Cầu Đặt Phòng/ Yêu Cầu Sự Kiện; (iii) Loại thanh toán (đặt cọc, thanh toán…).',
    '**Transfer reference:** (i) guest or partner name; (ii) booking or event request number; (iii) type of payment (deposit, settlement, etc.).',
    '**转账备注：** （i）客人／合作方名称；（ii）订房或活动申请编号；（iii）付款类型（订金、结清等）。',
    '**이체 시 기재 사항:** (i) 고객 또는 거래처 성명, (ii) 예약 또는 행사 요청 번호, (iii) 결제 구분(보증금, 잔금 등).',
    '**振込時の記載事項：** (i) お客様または取引先の名称、(ii) 予約番号またはイベント申込番号、(iii) お支払い区分（デポジット、精算など）。',
    '**รายละเอียดการโอน:** (i) ชื่อผู้เข้าพักหรือคู่ค้า (ii) หมายเลขคำขอจองห้องพักหรือคำขอจัดงาน (iii) ประเภทการชำระเงิน (มัดจำ ชำระเต็มจำนวน ฯลฯ)',
  ),
  L(
    'Trường hợp Khách có yêu cầu thanh toán theo phương thức khác, vui lòng liên hệ bộ phận đặt phòng qua địa chỉ mail [**info@royalhalonghotel.com**](mailto:info@royalhalonghotel.com) hoặc số điện thoại **0904 030 222** để được tư vấn và hỗ trợ.',
    'If you would like to pay by another method, please contact our reservations team at [**info@royalhalonghotel.com**](mailto:info@royalhalonghotel.com) or on **0904 030 222** for advice and assistance.',
    '如需使用其他支付方式，请通过邮箱 [**info@royalhalonghotel.com**](mailto:info@royalhalonghotel.com) 或致电 **0904 030 222** 联系预订部，我们将为您提供咨询与协助。',
    '다른 결제 방법을 원하시는 경우 예약부([**info@royalhalonghotel.com**](mailto:info@royalhalonghotel.com) 또는 **0904 030 222**)로 문의해 주시면 안내해 드립니다.',
    'その他のお支払い方法をご希望の場合は、予約部（[**info@royalhalonghotel.com**](mailto:info@royalhalonghotel.com)／**0904 030 222**）までご連絡ください。ご相談に応じます。',
    'หากท่านประสงค์ชำระเงินด้วยวิธีอื่น กรุณาติดต่อแผนกสำรองห้องพักที่อีเมล [**info@royalhalonghotel.com**](mailto:info@royalhalonghotel.com) หรือโทร **0904 030 222** เพื่อรับคำแนะนำและความช่วยเหลือ',
  ),
]

const PAY_SEO = seo(
  L(
    'Phương thức thanh toán — Royal Hạ Long Hotel',
    'Payment methods — Royal Ha Long Hotel',
    '支付方式 — Royal Ha Long Hotel',
    '결제 수단 — Royal Ha Long Hotel',
    'お支払い方法 — Royal Ha Long Hotel',
    'วิธีการชำระเงิน — Royal Ha Long Hotel',
  ),
  L(
    'Hai phương thức thanh toán tại Royal Hạ Long Hotel: thẻ tín dụng qua One Pay, hoặc chuyển khoản ngân hàng. Thông tin tài khoản và nội dung chuyển khoản.',
    'Two ways to pay at Royal Ha Long Hotel: credit card through One Pay, or bank transfer. Full account details and transfer reference format.',
    'Royal Ha Long Hotel 的两种付款方式：通过 One Pay 使用信用卡，或银行转账。含完整账户信息与转账备注格式。',
    'Royal Ha Long Hotel 결제 수단 두 가지 — One Pay 신용카드 결제와 계좌 이체. 계좌 정보와 이체 시 기재 사항 안내.',
    'Royal Ha Long Hotel のお支払い方法は2種類。One Pay でのクレジットカード決済と銀行振込。口座情報と振込時の記載事項をご案内します。',
    'สองวิธีชำระเงินกับ Royal Ha Long Hotel: บัตรเครดิตผ่าน One Pay หรือโอนเงินผ่านธนาคาร พร้อมรายละเอียดบัญชีและรูปแบบรายละเอียดการโอน',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  page.privacy-policy — 19 khối, văn bản ràng buộc.
 *  Dịch SÁT nghĩa, giữ đủ mọi điều khoản, giữ nguyên tên cơ quan và văn bản
 *  luật Việt Nam (có kèm phiên âm/latinh trong ngoặc ở zh/ko/ja/th).
 * ══════════════════════════════════════════════════════════════════ */

const PRIV_TITLE = L(
  'CHÍNH SÁCH BẢO MẬT',
  'PRIVACY POLICY',
  '隐私政策',
  '개인정보 처리방침',
  'プライバシーポリシー',
  'นโยบายความเป็นส่วนตัว',
)

const PRIV_HERO_ALT = L(
  'Đôi bàn tay gõ bàn phím máy tính xách tay, các biểu tượng ổ khoá và khiên bảo mật hiện trên nền xanh',
  'Hands typing on a laptop keyboard, with padlock and shield icons floating over a blue circuit-board background',
  '双手在笔记本电脑键盘上打字，蓝色电路板背景上浮现着挂锁与盾牌图标',
  '노트북 키보드를 두드리는 손, 파란 회로 배경 위에 자물쇠와 방패 아이콘이 떠 있는 모습',
  'ノートパソコンのキーボードを打つ手。青い回路基板の背景に南京錠と盾のアイコンが浮かぶ',
  'มือกำลังพิมพ์บนคีย์บอร์ดแล็ปท็อป มีไอคอนกุญแจและโล่ลอยอยู่บนพื้นหลังลายวงจรสีน้ำเงิน',
)

const PRIV_1 = [
  L(
    'Chúng tôi đánh giá cao sự quan tâm của bạn đối với công ty và trang web của chúng tôi. Chúng tôi đánh giá cao sự tin tưởng của bạn đối với chúng tôi, đồng thời công nhận cả tầm quan trọng và nghĩa vụ đi kèm với việc xử lý dữ liệu của bạn một cách cẩn thận và bảo vệ dữ liệu đó khỏi bị lạm dụng hoặc lạm dụng.',
    'We appreciate your interest in our company and our website. We value the trust you place in us, and we recognise both the importance of handling your data with care and the duty to protect it from misuse or abuse.',
    '感谢您对本公司及本网站的关注。我们珍视您的信任，同时深知谨慎处理您的数据、并保护其免遭滥用或不当使用既重要又是我们的义务。',
    '저희 회사와 웹사이트에 관심을 가져 주셔서 감사합니다. 고객님께서 보내 주신 신뢰를 소중히 여기며, 고객님의 데이터를 신중하게 처리하고 오용 또는 남용으로부터 보호하는 일의 중요성과 그에 따르는 의무를 인식하고 있습니다.',
    '弊社および弊社ウェブサイトにご関心をお寄せいただき、ありがとうございます。お客様からお預かりした信頼を大切にするとともに、お客様のデータを慎重に取り扱い、不正利用や濫用から保護することの重要性と、それに伴う義務を認識しております。',
    'เราขอขอบคุณที่ท่านให้ความสนใจบริษัทและเว็บไซต์ของเรา เราให้ความสำคัญกับความไว้วางใจที่ท่านมอบให้ และตระหนักทั้งถึงความสำคัญและหน้าที่ในการดูแลข้อมูลของท่านอย่างระมัดระวัง ตลอดจนปกป้องข้อมูลนั้นจากการนำไปใช้ในทางที่ผิดหรือโดยมิชอบ',
  ),
  L(
    'Chúng tôi rất coi trọng việc bảo vệ dữ liệu cá nhân của bạn và tuân thủ nghiêm ngặt luật bảo vệ dữ liệu có liên quan. Dữ liệu cá nhân chỉ được thu thập trên trang web này trong phạm vi cần thiết. Trong mọi trường hợp, dữ liệu sẽ không được chia sẻ hoặc cung cấp cho các bên thứ ba mà không được phép.',
    'We take the protection of your personal data very seriously and strictly comply with the applicable data protection laws. Personal data is collected on this website only to the extent necessary. Under no circumstances will data be shared with or disclosed to third parties without authorisation.',
    '我们高度重视对您个人数据的保护，并严格遵守相关数据保护法律。本网站仅在必要范围内收集个人数据。在任何情况下，未经授权均不会与第三方共享或向其提供数据。',
    '저희는 고객님의 개인정보 보호를 매우 중요하게 여기며 관련 개인정보 보호 법령을 엄격히 준수합니다. 본 웹사이트에서 개인정보는 필요한 범위 내에서만 수집됩니다. 어떠한 경우에도 허가 없이 제3자와 데이터를 공유하거나 제공하지 않습니다.',
    '弊社はお客様の個人データの保護を重視し、関連する個人情報保護法令を厳格に遵守いたします。本ウェブサイトでは、必要な範囲においてのみ個人データを収集いたします。いかなる場合においても、許可なく第三者にデータを共有または提供することはありません。',
    'เราให้ความสำคัญอย่างยิ่งกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน และปฏิบัติตามกฎหมายคุ้มครองข้อมูลที่เกี่ยวข้องอย่างเคร่งครัด เว็บไซต์นี้จะเก็บรวบรวมข้อมูลส่วนบุคคลเพียงเท่าที่จำเป็นเท่านั้น และจะไม่มีการแบ่งปันหรือเปิดเผยข้อมูลแก่บุคคลภายนอกโดยไม่ได้รับอนุญาตไม่ว่ากรณีใด',
  ),
  L(
    'Bằng cách sử dụng trang web của chúng tôi và các ưu đãi có trong đó, bạn đồng ý rằng dữ liệu bạn đã cung cấp có thể được chúng tôi lưu trữ, xử lý hoặc sử dụng trong phạm vi của chính sách bảo mật này.',
    'By using our website and the offers contained within it, you agree that the data you have provided may be stored, processed or used by us within the scope of this privacy policy.',
    '使用本网站及其中的各项优惠即表示您同意：我们可在本隐私政策范围内存储、处理或使用您所提供的数据。',
    '본 웹사이트와 그 안의 제공 서비스를 이용하시는 것은, 고객님께서 제공하신 데이터를 본 개인정보 처리방침의 범위 내에서 저장, 처리 또는 이용하는 데 동의하시는 것으로 봅니다.',
    '本ウェブサイトおよび掲載のご提案をご利用いただくことにより、お客様がご提供いただいたデータを、本プライバシーポリシーの範囲内で弊社が保存・処理・利用することにご同意いただいたものといたします。',
    'การที่ท่านใช้เว็บไซต์ของเราและข้อเสนอต่าง ๆ ภายในเว็บไซต์ ถือว่าท่านยินยอมให้เราจัดเก็บ ประมวลผล หรือใช้ข้อมูลที่ท่านให้ไว้ภายในขอบเขตของนโยบายความเป็นส่วนตัวฉบับนี้',
  ),
]

const PRIV_2_H = L(
  'ĐỐI TƯỢNG VÀ PHẠM VI ÁP DỤNG',
  'WHO AND WHAT THIS POLICY COVERS',
  '适用对象与适用范围',
  '적용 대상 및 적용 범위',
  '対象および適用範囲',
  'ผู้ที่อยู่ในบังคับและขอบเขตการบังคับใช้',
)

const PRIV_2 = [
  L(
    'Chính sách này điều chỉnh cách thức mà **Royal Ha Long Hotel** xử lý dữ liệu cá nhân của Khách hàng và những người có liên quan đến Khách hàng theo các mối quan hệ do pháp luật yêu cầu phải xử lý dữ liệu hoặc người đồng sử dụng các sản phẩm/ dịch vụ của **Royal Ha Long Hotel** với khách hàng khi sử dụng hoặc tương tác với trang tin điện tử hoặc/và các sản phẩm/ dịch vụ của Royal Ha Long Hotel.',
    'This policy governs the way **Royal Ha Long Hotel** processes the personal data of the Customer and of persons related to the Customer through relationships in which the law requires data to be processed, or of persons who use the products and services of **Royal Ha Long Hotel** jointly with the Customer, when using or interacting with the website and/or the products and services of Royal Ha Long Hotel.',
    '本政策规范 **Royal Ha Long Hotel** 处理客户个人数据的方式，涵盖客户本人、依法律要求须处理其数据的客户关联人，以及与客户共同使用 **Royal Ha Long Hotel** 产品／服务的人士，在使用本网站及／或 Royal Ha Long Hotel 产品与服务或与之互动时的情形。',
    '본 방침은 고객 및 법률상 데이터 처리가 요구되는 관계에 있는 고객 관련인, 또는 고객과 함께 **Royal Ha Long Hotel**의 상품·서비스를 이용하는 자가 본 웹사이트 및/또는 Royal Ha Long Hotel의 상품·서비스를 이용하거나 이와 상호작용할 때, **Royal Ha Long Hotel**이 그 개인정보를 처리하는 방식을 규율합니다.',
    '本ポリシーは、お客様、法令によりデータ処理が求められる関係にあるお客様の関係者、またはお客様と共に **Royal Ha Long Hotel** の商品・サービスをご利用になる方が、本ウェブサイトおよび／または Royal Ha Long Hotel の商品・サービスをご利用またはこれらと関わる際に、**Royal Ha Long Hotel** が個人データを取り扱う方法を定めるものです。',
    'นโยบายฉบับนี้กำกับวิธีที่ **Royal Ha Long Hotel** ประมวลผลข้อมูลส่วนบุคคลของลูกค้า และของบุคคลที่เกี่ยวข้องกับลูกค้าตามความสัมพันธ์ที่กฎหมายกำหนดให้ต้องประมวลผลข้อมูล หรือผู้ที่ใช้ผลิตภัณฑ์/บริการของ **Royal Ha Long Hotel** ร่วมกับลูกค้า เมื่อใช้งานหรือมีปฏิสัมพันธ์กับเว็บไซต์ และ/หรือผลิตภัณฑ์และบริการของ Royal Ha Long Hotel',
  ),
  L(
    'Để tránh nhầm lẫn, Chính sách bảo mật dữ liệu này chỉ áp dụng cho các Khách hàng cá nhân. **Royal Ha Long Hotel** khuyến khích Khách hàng đọc kỹ Chính sách này và thường xuyên kiểm tra trang tin điện tử để cập nhật bất kỳ thay đổi nào mà **Royal Ha Long Hotel** có thể thực hiện theo các điều khoản của Chính sách.',
    'For the avoidance of doubt, this data privacy policy applies only to individual Customers. **Royal Ha Long Hotel** encourages Customers to read this policy carefully and to check the website regularly for any changes **Royal Ha Long Hotel** may make to its terms.',
    '为免疑义，本数据隐私政策仅适用于个人客户。**Royal Ha Long Hotel** 建议客户仔细阅读本政策，并定期查看本网站，以便及时了解 **Royal Ha Long Hotel** 可能对本政策条款作出的任何变更。',
    '오해를 피하기 위해 밝히면, 본 개인정보 처리방침은 개인 고객에게만 적용됩니다. **Royal Ha Long Hotel**은 고객께서 본 방침을 주의 깊게 읽으시고, **Royal Ha Long Hotel**이 방침 조항에 가할 수 있는 변경 사항을 확인하기 위해 웹사이트를 정기적으로 살펴보실 것을 권장합니다.',
    '誤解を避けるために申し添えますと、本データプライバシーポリシーは個人のお客様にのみ適用されます。**Royal Ha Long Hotel** は、本ポリシーを十分にお読みいただくとともに、**Royal Ha Long Hotel** が本ポリシーの条項に加える変更を確認するため、定期的にウェブサイトをご確認いただくことをお勧めいたします。',
    'เพื่อมิให้เกิดข้อสงสัย นโยบายความเป็นส่วนตัวของข้อมูลฉบับนี้ใช้บังคับกับลูกค้าที่เป็นบุคคลธรรมดาเท่านั้น **Royal Ha Long Hotel** ขอแนะนำให้ลูกค้าอ่านนโยบายฉบับนี้อย่างละเอียด และตรวจสอบเว็บไซต์อย่างสม่ำเสมอเพื่อรับทราบการเปลี่ยนแปลงใด ๆ ที่ **Royal Ha Long Hotel** อาจดำเนินการกับข้อกำหนดของนโยบาย',
  ),
]

const PRIV_3_H = L(
  'MỤC ĐÍCH, PHẠM VI THU THẬP THÔNG TIN',
  'PURPOSE AND SCOPE OF DATA COLLECTION',
  '信息收集的目的与范围',
  '정보 수집의 목적 및 범위',
  '情報収集の目的および範囲',
  'วัตถุประสงค์และขอบเขตการเก็บรวบรวมข้อมูล',
)

const PRIV_3 = [
  L(
    '**Royal Ha Long Hotel** chỉ thu thập thông tin liên lạc cần thiết để thực hiện giao dịch giữa website/ứng dụng với khách hàng mà không lấy thêm thông tin gì khác. Thông tin của khách hàng sẽ chỉ được lưu lại khi khách hàng tạo tài khoản và đăng nhập với tài khoản của mình. **Royal Ha Long Hotel** thu thập và sử dụng thông tin cá nhân của khách hàng với mục đích phù hợp và hoàn toàn tuân thủ theo pháp luật. **Royal Ha Long Hotel** cam kết không chia sẻ hay sử dụng thông tin cá nhân của khách hàng cho một bên thứ 3 nào khác với mục đích lợi nhuận. Thông tin của khách hàng sẽ chỉ được sử dụng trong nội bộ **Royal Ha Long Hotel**. Khi cần thiết, chúng tôi có thể sử dụng những thông tin này để liên hệ trực tiếp với khách hàng dưới các hình thức như: gửi thư, đơn đặt hàng, thư cảm ơn. Khách hàng có thể nhận được thư định kỳ cung cấp thông tin sản phẩm, dịch vụ mới, thông tin về các chương trình khuyến mãi. Khi khách hàng đăng ký trên website/ứng dụng, những thông tin chúng tôi thu thập bao gồm:',
    '**Royal Ha Long Hotel** collects only the contact details necessary to complete transactions between the website or application and the customer, and no other information. Customer information is stored only when the customer creates an account and signs in with that account. **Royal Ha Long Hotel** collects and uses customers’ personal information for appropriate purposes and in full compliance with the law. **Royal Ha Long Hotel** undertakes not to share or use customers’ personal information with any third party for profit. Customer information is used only within **Royal Ha Long Hotel**. Where necessary, we may use this information to contact the customer directly by means such as letters, orders and thank-you notes. Customers may receive periodic mailings about new products and services and about promotional programmes. When a customer registers on the website or application, the information we collect includes:',
    '**Royal Ha Long Hotel** 仅收集为完成网站／应用程序与客户之间交易所必需的联系信息，不额外收集其他信息。客户信息仅在客户创建账户并使用该账户登录时予以保存。**Royal Ha Long Hotel** 出于适当目的并在完全遵守法律的前提下收集和使用客户个人信息。**Royal Ha Long Hotel** 承诺不会为营利目的与任何第三方共享或使用客户个人信息。客户信息仅在 **Royal Ha Long Hotel** 内部使用。必要时，我们可能通过寄送信函、订单、感谢函等方式使用这些信息直接与客户联系。客户可能会定期收到有关新产品、新服务及促销活动的信息。客户在网站／应用程序注册时，我们收集的信息包括：',
    '**Royal Ha Long Hotel**은 웹사이트·애플리케이션과 고객 간 거래를 수행하는 데 필요한 연락처 정보만 수집하며 그 밖의 정보는 수집하지 않습니다. 고객 정보는 고객이 계정을 생성하고 해당 계정으로 로그인한 경우에만 저장됩니다. **Royal Ha Long Hotel**은 적법하고 정당한 목적으로 고객의 개인정보를 수집·이용하며 법령을 전면 준수합니다. **Royal Ha Long Hotel**은 영리를 목적으로 고객의 개인정보를 제3자와 공유하거나 이용하지 않을 것을 약속드립니다. 고객 정보는 **Royal Ha Long Hotel** 내부에서만 사용됩니다. 필요한 경우 서신, 주문서, 감사 인사 등의 형태로 고객께 직접 연락드리는 데 이 정보를 사용할 수 있습니다. 고객께서는 신규 상품·서비스 정보와 프로모션 정보를 담은 정기 안내를 받으실 수 있습니다. 고객이 웹사이트·애플리케이션에 가입하실 때 저희가 수집하는 정보는 다음과 같습니다.',
    '**Royal Ha Long Hotel** は、ウェブサイトまたはアプリケーションとお客様との間の取引を行うために必要な連絡先情報のみを収集し、それ以外の情報は取得いたしません。お客様の情報は、お客様がアカウントを作成し、当該アカウントでログインされた場合にのみ保存されます。**Royal Ha Long Hotel** は、適切な目的のため、法令を完全に遵守してお客様の個人情報を収集・利用いたします。**Royal Ha Long Hotel** は、営利目的で第三者とお客様の個人情報を共有または利用しないことをお約束いたします。お客様の情報は **Royal Ha Long Hotel** 内部でのみ使用されます。必要な場合には、書簡、ご注文書、お礼状などの形でお客様に直接ご連絡するためにこの情報を使用することがあります。お客様は、新商品・新サービスやキャンペーンに関する定期的なご案内をお受け取りになる場合があります。お客様がウェブサイトまたはアプリケーションにご登録の際、弊社が収集する情報は次のとおりです。',
    '**Royal Ha Long Hotel** เก็บรวบรวมเพียงข้อมูลติดต่อที่จำเป็นต่อการทำธุรกรรมระหว่างเว็บไซต์/แอปพลิเคชันกับลูกค้าเท่านั้น โดยไม่เก็บข้อมูลอื่นเพิ่มเติม ข้อมูลของลูกค้าจะถูกบันทึกไว้เฉพาะเมื่อลูกค้าสร้างบัญชีและเข้าสู่ระบบด้วยบัญชีของตน **Royal Ha Long Hotel** เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของลูกค้าเพื่อวัตถุประสงค์อันเหมาะสมและเป็นไปตามกฎหมายอย่างครบถ้วน **Royal Ha Long Hotel** ขอให้คำมั่นว่าจะไม่แบ่งปันหรือใช้ข้อมูลส่วนบุคคลของลูกค้ากับบุคคลภายนอกใด ๆ เพื่อแสวงหากำไร ข้อมูลของลูกค้าจะถูกใช้ภายใน **Royal Ha Long Hotel** เท่านั้น เมื่อจำเป็น เราอาจใช้ข้อมูลนี้ติดต่อลูกค้าโดยตรงในรูปแบบต่าง ๆ เช่น จดหมาย ใบสั่งซื้อ จดหมายขอบคุณ ลูกค้าอาจได้รับจดหมายตามวาระที่ให้ข้อมูลผลิตภัณฑ์และบริการใหม่ รวมถึงข้อมูลเกี่ยวกับรายการส่งเสริมการขาย เมื่อลูกค้าลงทะเบียนบนเว็บไซต์/แอปพลิเคชัน ข้อมูลที่เราเก็บรวบรวมประกอบด้วย',
  ),
  L(
    'Tên – Địa chỉ giao hàng – Số điện thoại – Ngày sinh – Giới tính – Những thông tin khác (nếu có).',
    'Name – delivery address – telephone number – date of birth – gender – other information (if any).',
    '姓名 — 收件地址 — 电话号码 — 出生日期 — 性别 — 其他信息（如有）。',
    '성명 – 배송 주소 – 전화번호 – 생년월일 – 성별 – 기타 정보(있는 경우).',
    '氏名 – 配送先住所 – 電話番号 – 生年月日 – 性別 – その他の情報（ある場合）。',
    'ชื่อ – ที่อยู่สำหรับจัดส่ง – หมายเลขโทรศัพท์ – วันเดือนปีเกิด – เพศ – ข้อมูลอื่น ๆ (ถ้ามี)',
  ),
  L(
    '**PHẠM VI SỬ DỤNG THÔNG TIN**',
    '**SCOPE OF USE OF INFORMATION**',
    '**信息使用范围**',
    '**정보 이용 범위**',
    '**情報の利用範囲**',
    '**ขอบเขตการใช้ข้อมูล**',
  ),
  L(
    'Những thông tin trên chỉ được sử dụng cho những mục đích sau đây:',
    'The information above is used only for the following purposes:',
    '上述信息仅用于下列目的：',
    '위 정보는 다음 목적으로만 이용됩니다.',
    '上記の情報は、次の目的にのみ使用されます。',
    'ข้อมูลข้างต้นจะถูกใช้เพื่อวัตถุประสงค์ดังต่อไปนี้เท่านั้น',
  ),
  L(
    '(a) Cung cấp sản phẩm hoặc dịch vụ hoặc hỗ trợ khách hàng sử dụng các sản phẩm/ dịch vụ của Công ty và/ hoặc Đối tác của Công ty thông qua thỏa thuận hợp tác được Khách hàng yêu cầu;',
    '(a) To provide products or services, or to support the Customer in using the products and services of the Company and/or of the Company’s Partners under a cooperation arrangement requested by the Customer;',
    '（a）提供产品或服务，或协助客户使用本公司及／或本公司合作伙伴依客户要求的合作安排所提供的产品／服务；',
    '(a) 상품 또는 서비스를 제공하거나, 고객이 요청한 제휴 약정에 따라 회사 및/또는 회사 파트너의 상품·서비스를 이용하시는 데 지원하기 위하여',
    '(a) 商品もしくはサービスを提供し、またはお客様のご要望による提携取決めに基づき、当社および／もしくは当社パートナーの商品・サービスのご利用を支援するため。',
    '(a) เพื่อจัดหาผลิตภัณฑ์หรือบริการ หรือสนับสนุนลูกค้าในการใช้ผลิตภัณฑ์/บริการของบริษัท และ/หรือของพันธมิตรของบริษัท ผ่านข้อตกลงความร่วมมือตามที่ลูกค้าร้องขอ',
  ),
  L(
    '(b) Thực hiện các hoạt động nhằm chăm sóc khách hàng và thực hiện các chương trình hậu mãi sau bán hàng;',
    '(b) To carry out customer care activities and after-sales programmes;',
    '（b）开展客户关怀活动及售后服务计划；',
    '(b) 고객 관리 활동 및 판매 후 서비스 프로그램을 수행하기 위하여',
    '(b) カスタマーケア活動およびアフターサービスプログラムを実施するため。',
    '(b) เพื่อดำเนินกิจกรรมดูแลลูกค้าและโครงการบริการหลังการขาย',
  ),
  L(
    '(c) Điều chỉnh, cập nhật, bảo mật và cải tiến các sản phẩm, dịch vụ mà **Royal Ha Long Hotel** đang cung cấp cho Khách hàng;',
    '(c) To adjust, update, secure and improve the products and services that **Royal Ha Long Hotel** provides to the Customer;',
    '（c）调整、更新、保护并改进 **Royal Ha Long Hotel** 向客户提供的产品与服务；',
    '(c) **Royal Ha Long Hotel**이 고객께 제공하는 상품과 서비스를 조정·갱신·보호하고 개선하기 위하여',
    '(c) **Royal Ha Long Hotel** がお客様に提供する商品・サービスを調整、更新、保護および改善するため。',
    '(c) เพื่อปรับปรุง อัปเดต รักษาความปลอดภัย และพัฒนาผลิตภัณฑ์และบริการที่ **Royal Ha Long Hotel** ให้บริการแก่ลูกค้า',
  ),
  L(
    '(d) Xác minh danh tính và đảm bảo tính bảo mật thông tin cá nhân của Khách hàng;',
    '(d) To verify identity and ensure the security of the Customer’s personal information;',
    '（d）核实身份并确保客户个人信息的安全；',
    '(d) 신원을 확인하고 고객의 개인정보 보안을 확보하기 위하여',
    '(d) 本人確認を行い、お客様の個人情報の安全性を確保するため。',
    '(d) เพื่อยืนยันตัวตนและรักษาความปลอดภัยของข้อมูลส่วนบุคคลของลูกค้า',
  ),
  L(
    '(e) Đáp ứng các yêu cầu dịch vụ và nhu cầu hỗ trợ của Khách hàng;',
    '(e) To meet the Customer’s service requests and support needs;',
    '（e）满足客户的服务请求与支持需求；',
    '(e) 고객의 서비스 요청 및 지원 요구에 응하기 위하여',
    '(e) お客様のサービスに関するご要望およびサポートのご要請にお応えするため。',
    '(e) เพื่อตอบสนองคำขอรับบริการและความต้องการความช่วยเหลือของลูกค้า',
  ),
  L(
    '(f) Thông báo cho Khách hàng về những thay đổi đối với các chính sách, khuyến mại của các sản phẩm, dịch vụ mà Công ty đang cung cấp;',
    '(f) To notify the Customer of changes to the policies and promotions of the products and services the Company provides;',
    '（f）就本公司所提供产品与服务的政策及促销活动的变更通知客户；',
    '(f) 회사가 제공하는 상품·서비스의 정책 및 프로모션 변경 사항을 고객께 알리기 위하여',
    '(f) 当社が提供する商品・サービスのポリシーおよびキャンペーンの変更をお客様にお知らせするため。',
    '(f) เพื่อแจ้งให้ลูกค้าทราบถึงการเปลี่ยนแปลงนโยบายและรายการส่งเสริมการขายของผลิตภัณฑ์และบริการที่บริษัทให้บริการ',
  ),
  L(
    '(g) Đo lường, phân tích dữ liệu nội bộ và các xử lý khác để cải thiện, nâng cao chất lượng dịch vụ/sản phẩm của Công ty hoặc thực hiện các hoạt động truyền thông tiếp thị;',
    '(g) To measure and analyse data internally and carry out other processing in order to improve the quality of the Company’s services and products, or to conduct marketing communications;',
    '（g）进行内部数据测量、分析及其他处理，以改进和提升本公司服务／产品质量，或开展市场营销传播活动；',
    '(g) 내부 데이터 측정·분석 및 기타 처리를 통해 회사의 서비스·상품 품질을 개선·향상하거나 마케팅 커뮤니케이션 활동을 수행하기 위하여',
    '(g) 社内でのデータ測定・分析およびその他の処理を行い、当社のサービス・商品の品質を改善・向上させ、またはマーケティングコミュニケーション活動を実施するため。',
    '(g) เพื่อวัดผลและวิเคราะห์ข้อมูลภายใน ตลอดจนการประมวลผลอื่น ๆ เพื่อปรับปรุงและยกระดับคุณภาพบริการ/ผลิตภัณฑ์ของบริษัท หรือดำเนินกิจกรรมสื่อสารการตลาด',
  ),
  L(
    '(h) Tổ chức các hoạt động nghiên cứu thị trường, thăm dò dư luận nhằm cải thiện chất lượng sản phẩm/ dịch vụ hoặc để nghiên cứu phát triển các sản phẩm, dịch vụ mới nhằm đáp ứng tốt hơn nhu cầu của khách hàng;',
    '(h) To conduct market research and opinion surveys in order to improve the quality of products and services, or to research and develop new products and services that better meet customers’ needs;',
    '（h）开展市场调研与民意调查，以提升产品／服务质量，或研究开发更好满足客户需求的新产品与新服务；',
    '(h) 상품·서비스 품질을 개선하거나 고객의 요구에 더 잘 부응하는 신상품·신서비스를 연구·개발하기 위하여 시장조사 및 여론조사를 실시하기 위하여',
    '(h) 商品・サービスの品質向上、またはお客様のニーズによりよくお応えする新商品・新サービスの研究開発のため、市場調査および世論調査を実施するため。',
    '(h) เพื่อจัดกิจกรรมวิจัยตลาดและสำรวจความคิดเห็น เพื่อปรับปรุงคุณภาพผลิตภัณฑ์/บริการ หรือเพื่อวิจัยพัฒนาผลิตภัณฑ์และบริการใหม่ที่ตอบสนองความต้องการของลูกค้าได้ดียิ่งขึ้น',
  ),
  L(
    '(i) Ngặn chặn và phòng chống gian lận, đánh cắp danh tính và các hoạt động bất hợp pháp khác;',
    '(i) To prevent and combat fraud, identity theft and other unlawful activities;',
    '（i）预防和打击欺诈、身份盗用及其他非法活动；',
    '(i) 사기, 신원 도용 및 기타 불법 행위를 예방하고 방지하기 위하여',
    '(i) 詐欺、なりすまし、その他の違法行為を防止・抑止するため。',
    '(i) เพื่อป้องกันและปราบปรามการฉ้อโกง การโจรกรรมอัตลักษณ์ และกิจกรรมที่ผิดกฎหมายอื่น ๆ',
  ),
  L(
    '(j) Để có cơ sở thiết lập, thực thi các quyền hợp pháp hoặc bảo vệ các khiếu nại pháp lý của **Royal Ha Long Hotel**, Khách hàng hoặc bất kỳ cá nhân nào. Các mục đích này có thể bao gồm việc trao đổi dữ liệu với các công ty và tổ chức khác để ngăn chặn và phát hiện gian lận, giảm rủi ro về tín dụng;',
    '(j) To provide a basis for establishing and enforcing lawful rights or defending legal claims of **Royal Ha Long Hotel**, the Customer or any individual. These purposes may include exchanging data with other companies and organisations in order to prevent and detect fraud and to reduce credit risk;',
    '（j）为确立、行使合法权利或抗辩 **Royal Ha Long Hotel**、客户或任何个人的法律主张提供依据。此类目的可能包括与其他公司和机构交换数据，以预防和发现欺诈、降低信用风险；',
    '(j) **Royal Ha Long Hotel**, 고객 또는 개인의 적법한 권리를 확립·행사하거나 법적 청구에 대응할 근거를 마련하기 위하여. 이러한 목적에는 사기 예방·적발 및 신용 위험 경감을 위하여 다른 회사·기관과 데이터를 교환하는 일이 포함될 수 있습니다.',
    '(j) **Royal Ha Long Hotel**、お客様または個人の適法な権利を確立・行使し、あるいは法的請求に対応する根拠とするため。これらの目的には、詐欺の防止・発見および信用リスク低減のために他の企業・団体とデータを交換することが含まれる場合があります。',
    '(j) เพื่อเป็นฐานในการก่อตั้ง ใช้สิทธิโดยชอบด้วยกฎหมาย หรือต่อสู้ข้อเรียกร้องทางกฎหมายของ **Royal Ha Long Hotel** ลูกค้า หรือบุคคลใด ๆ วัตถุประสงค์เหล่านี้อาจรวมถึงการแลกเปลี่ยนข้อมูลกับบริษัทและองค์กรอื่นเพื่อป้องกันและตรวจจับการฉ้อโกง ตลอดจนลดความเสี่ยงด้านสินเชื่อ',
  ),
  L(
    '(k) Tuân thủ pháp luật hiện hành, các tiêu chuẩn ngành có liên quan và các chính sách hiện hành khác của Công ty;',
    '(k) To comply with applicable law, relevant industry standards and other policies of the Company in force;',
    '（k）遵守现行法律、相关行业标准及本公司其他现行政策；',
    '(k) 현행 법령, 관련 업계 기준 및 회사의 기타 현행 정책을 준수하기 위하여',
    '(k) 現行法令、関連する業界基準および当社のその他の現行ポリシーを遵守するため。',
    '(k) เพื่อปฏิบัติตามกฎหมายที่ใช้บังคับ มาตรฐานอุตสาหกรรมที่เกี่ยวข้อง และนโยบายอื่นที่บริษัทใช้บังคับอยู่',
  ),
  L(
    '(l) Bất kỳ mục đích nào khác dành riêng cho hoạt động vận hành của Công ty;',
    '(l) Any other purpose specific to the Company’s operations;',
    '（l）本公司运营所特有的任何其他目的；',
    '(l) 회사의 운영에 고유한 그 밖의 목적을 위하여',
    '(l) 当社の運営に固有のその他の目的のため。',
    '(l) วัตถุประสงค์อื่นใดที่เฉพาะเจาะจงต่อการดำเนินงานของบริษัท',
  ),
  L(
    '(m) Bất kỳ mục đích nào khác mà **Royal Ha Long Hotel** thông báo cho Khách hàng, vào thời điểm thu thập dữ liệu cá nhân của Khách hàng hoặc trước khi bắt đầu xử lý liên quan hoặc theo yêu cầu khác hoặc được pháp luật hiện hành cho phép',
    '(m) Any other purpose notified by **Royal Ha Long Hotel** to the Customer at the time the Customer’s personal data is collected, or before the related processing begins, or as otherwise required or permitted by applicable law',
    '（m）**Royal Ha Long Hotel** 在收集客户个人数据时、或在开始相关处理之前告知客户的任何其他目的，或现行法律另有要求或许可的目的',
    '(m) **Royal Ha Long Hotel**이 고객의 개인정보를 수집하는 시점 또는 관련 처리를 시작하기 전에 고객께 고지한 그 밖의 목적, 또는 현행 법령이 달리 요구하거나 허용하는 목적',
    '(m) **Royal Ha Long Hotel** がお客様の個人データを収集する時点、または関連する処理を開始する前にお客様にお知らせしたその他の目的、あるいは現行法令が別途要求もしくは許容する目的',
    '(m) วัตถุประสงค์อื่นใดที่ **Royal Ha Long Hotel** แจ้งแก่ลูกค้า ณ เวลาที่เก็บรวบรวมข้อมูลส่วนบุคคลของลูกค้า หรือก่อนเริ่มการประมวลผลที่เกี่ยวข้อง หรือตามที่กฎหมายที่ใช้บังคับกำหนดหรืออนุญาตเป็นอย่างอื่น',
  ),
  L(
    '**Royal Ha Long Hotel** sẽ yêu cầu sự cho phép của Khách hàng trước khi sử dụng dữ liệu cá nhân của Khách hàng theo bất kỳ mục đích nào khác ngoài các mục đích nêu trên, vào thời điểm thu thập dữ liệu cá nhân của Khách hàng hoặc trước khi bắt đầu xử lý liên quan hoặc theo yêu cầu khác hoặc được pháp luật hiện hành cho phép. Khách hàng có thể rút lại sự đồng ý đối với việc xử lý dữ liệu của mình bất cứ lúc nào thông qua trang web của chúng tôi.',
    '**Royal Ha Long Hotel** will seek the Customer’s permission before using the Customer’s personal data for any purpose other than those set out above, at the time the Customer’s personal data is collected or before the related processing begins, or as otherwise required or permitted by applicable law. The Customer may withdraw consent to the processing of their data at any time through our website.',
    '在上述目的之外使用客户个人数据之前，**Royal Ha Long Hotel** 将在收集客户个人数据时、或在开始相关处理之前征求客户许可，或按现行法律另有要求或许可的方式处理。客户可随时通过本网站撤回其对数据处理的同意。',
    '**Royal Ha Long Hotel**은 위에 열거된 목적 외의 목적으로 고객의 개인정보를 이용하기 전에, 개인정보를 수집하는 시점 또는 관련 처리를 시작하기 전에 고객의 허락을 구하며, 또는 현행 법령이 달리 요구하거나 허용하는 바에 따릅니다. 고객께서는 저희 웹사이트를 통해 언제든지 데이터 처리에 대한 동의를 철회하실 수 있습니다.',
    '**Royal Ha Long Hotel** は、上記以外の目的でお客様の個人データを使用する前に、個人データを収集する時点または関連する処理を開始する前にお客様の許可を求めるものとし、あるいは現行法令が別途要求もしくは許容する方法によります。お客様は、弊社ウェブサイトを通じて、いつでもデータ処理へのご同意を撤回いただけます。',
    '**Royal Ha Long Hotel** จะขออนุญาตจากลูกค้าก่อนใช้ข้อมูลส่วนบุคคลของลูกค้าเพื่อวัตถุประสงค์อื่นนอกเหนือจากที่ระบุไว้ข้างต้น ณ เวลาที่เก็บรวบรวมข้อมูลส่วนบุคคลของลูกค้า หรือก่อนเริ่มการประมวลผลที่เกี่ยวข้อง หรือตามที่กฎหมายที่ใช้บังคับกำหนดหรืออนุญาตเป็นอย่างอื่น ลูกค้าสามารถเพิกถอนความยินยอมต่อการประมวลผลข้อมูลของตนได้ตลอดเวลาผ่านเว็บไซต์ของเรา',
  ),
]

const PRIV_4_H = L(
  'BẢO MẬT DỮ LIỆU CÁ NHÂN KHÁCH HÀNG',
  'SECURITY OF CUSTOMERS’ PERSONAL DATA',
  '客户个人数据的安全保护',
  '고객 개인정보의 보안',
  'お客様の個人データの保護',
  'การรักษาความปลอดภัยข้อมูลส่วนบุคคลของลูกค้า',
)

const PRIV_4 = [
  L(
    '**1.** Nguyên tắc bảo mật:',
    '**1.** Security principles:',
    '**1.** 保密原则：',
    '**1.** 보안 원칙:',
    '**1.** 機密保持の原則：',
    '**1.** หลักการรักษาความปลอดภัย',
  ),
  L(
    '(a) Dữ liệu cá nhân của Khách hàng được cam kết bảo mật theo quy định của **Royal Ha Long Hotel** và quy định của pháp luật. Việc xử lý Dữ liệu cá nhân của mỗi Khách hàng chỉ được thực hiện khi có sự đồng ý của Khách hàng, trừ trường hợp pháp luật có quy định khác.',
    '(a) The Customer’s personal data is protected in accordance with the rules of **Royal Ha Long Hotel** and with the law. The processing of each Customer’s personal data is carried out only with that Customer’s consent, save where the law provides otherwise.',
    '（a）客户个人数据依 **Royal Ha Long Hotel** 的规定及法律规定予以保密。除法律另有规定外，处理每位客户的个人数据均须取得该客户同意。',
    '(a) 고객의 개인정보는 **Royal Ha Long Hotel**의 규정과 법령에 따라 보호됩니다. 각 고객의 개인정보 처리는 법령에 달리 정한 경우를 제외하고 해당 고객의 동의가 있는 경우에만 이루어집니다.',
    '(a) お客様の個人データは、**Royal Ha Long Hotel** の規定および法令に従って保護されます。各お客様の個人データの処理は、法令に別段の定めがある場合を除き、当該お客様の同意がある場合にのみ行われます。',
    '(a) ข้อมูลส่วนบุคคลของลูกค้าได้รับการคุ้มครองตามระเบียบของ **Royal Ha Long Hotel** และตามที่กฎหมายกำหนด การประมวลผลข้อมูลส่วนบุคคลของลูกค้าแต่ละรายจะกระทำได้ก็ต่อเมื่อได้รับความยินยอมจากลูกค้า เว้นแต่กฎหมายจะกำหนดไว้เป็นอย่างอื่น',
  ),
  L(
    '(b) **Royal Ha Long Hotel** không sử dụng, chuyển giao, cung cấp hay chia sẻ cho bên thứ ba nào về Dữ liệu cá nhân của Khách hàng khi không có sự đồng ý của Khách hàng, trừ trường hợp pháp luật có quy định khác.',
    '(b) **Royal Ha Long Hotel** does not use, transfer, disclose or share the Customer’s personal data with any third party without the Customer’s consent, save where the law provides otherwise.',
    '（b）除法律另有规定外，未经客户同意，**Royal Ha Long Hotel** 不会使用、转让、提供或向任何第三方共享客户的个人数据。',
    '(b) **Royal Ha Long Hotel**은 법령에 달리 정한 경우를 제외하고, 고객의 동의 없이 고객의 개인정보를 이용·이전·제공하거나 제3자와 공유하지 않습니다.',
    '(b) **Royal Ha Long Hotel** は、法令に別段の定めがある場合を除き、お客様の同意なくお客様の個人データを使用、移転、提供または第三者と共有することはありません。',
    '(b) **Royal Ha Long Hotel** จะไม่ใช้ โอน เปิดเผย หรือแบ่งปันข้อมูลส่วนบุคคลของลูกค้าแก่บุคคลภายนอกใด ๆ โดยปราศจากความยินยอมของลูกค้า เว้นแต่กฎหมายจะกำหนดไว้เป็นอย่างอื่น',
  ),
  L(
    '(c) **Royal Ha Long Hotel** sẽ tuân thủ các nguyên tắc bảo mật dữ liệu cá nhân khác theo quy định pháp luật hiện hành.',
    '(c) **Royal Ha Long Hotel** will comply with the other personal data protection principles laid down by applicable law.',
    '（c）**Royal Ha Long Hotel** 将遵守现行法律规定的其他个人数据保护原则。',
    '(c) **Royal Ha Long Hotel**은 현행 법령이 정하는 그 밖의 개인정보 보호 원칙을 준수합니다.',
    '(c) **Royal Ha Long Hotel** は、現行法令が定めるその他の個人データ保護の原則を遵守いたします。',
    '(c) **Royal Ha Long Hotel** จะปฏิบัติตามหลักการคุ้มครองข้อมูลส่วนบุคคลอื่น ๆ ตามที่กฎหมายที่ใช้บังคับกำหนด',
  ),
  L(
    '**2.** Hậu quả, thiệt hại không mong muốn có thể xảy ra:',
    '**2.** Possible unwanted consequences and damage:',
    '**2.** 可能发生的非预期后果与损害：',
    '**2.** 발생할 수 있는 원치 않는 결과 및 피해:',
    '**2.** 発生しうる望ましくない結果および損害：',
    '**2.** ผลกระทบและความเสียหายที่ไม่พึงประสงค์ซึ่งอาจเกิดขึ้น',
  ),
  L(
    '**Royal Ha Long Hotel** sử dụng nhiều công nghệ bảo mật thông tin khác nhau nhằm bảo vệ Dữ liệu cá nhân của Khách hàng không bị truy lục, sử dụng hoặc chia sẻ ngoài ý muốn. Tuy nhiên, không một dữ liệu nào có thể được bảo mật 100%. Do vậy, **Royal Ha Long Hotel** cam kết sẽ bảo mật một cách tối đa trong khả năng cho phép Dữ liệu cá nhân của Khách hàng. Một số hậu quả, thiệt hại không mong muốn có thể xảy ra bao gồm nhưng không giới hạn:',
    '**Royal Ha Long Hotel** uses a range of information security technologies to protect the Customer’s personal data from unintended retrieval, use or disclosure. However, no data can be made one hundred per cent secure. **Royal Ha Long Hotel** therefore undertakes to protect the Customer’s personal data to the fullest extent within its power. Some of the unwanted consequences and damage that may occur include, but are not limited to:',
    '**Royal Ha Long Hotel** 采用多种信息安全技术，保护客户个人数据免遭非本意的检索、使用或共享。然而，没有任何数据能够做到百分之百安全。因此，**Royal Ha Long Hotel** 承诺在能力范围内最大限度地保护客户个人数据。可能发生的非预期后果与损害包括但不限于：',
    '**Royal Ha Long Hotel**은 고객의 개인정보가 의도치 않게 조회·이용·공유되지 않도록 다양한 정보보안 기술을 사용합니다. 그러나 어떠한 데이터도 100% 안전할 수는 없습니다. 따라서 **Royal Ha Long Hotel**은 가능한 범위에서 최대한 고객의 개인정보를 보호할 것을 약속드립니다. 발생할 수 있는 원치 않는 결과와 피해에는 다음이 포함되며 이에 한정되지 않습니다.',
    '**Royal Ha Long Hotel** は、お客様の個人データが意図せず取得・使用・共有されることのないよう、さまざまな情報セキュリティ技術を用いております。しかしながら、いかなるデータも100パーセント安全にすることはできません。したがって **Royal Ha Long Hotel** は、可能な限り最大限にお客様の個人データを保護することをお約束いたします。発生しうる望ましくない結果および損害には、次のものが含まれますが、これらに限られません。',
    '**Royal Ha Long Hotel** ใช้เทคโนโลยีความมั่นคงปลอดภัยของข้อมูลหลายรูปแบบเพื่อปกป้องข้อมูลส่วนบุคคลของลูกค้าจากการเข้าถึง การใช้ หรือการแบ่งปันโดยมิได้ตั้งใจ อย่างไรก็ตาม ไม่มีข้อมูลใดที่ปลอดภัยได้ร้อยเปอร์เซ็นต์ **Royal Ha Long Hotel** จึงขอให้คำมั่นว่าจะคุ้มครองข้อมูลส่วนบุคคลของลูกค้าอย่างเต็มความสามารถ ผลกระทบและความเสียหายที่ไม่พึงประสงค์ซึ่งอาจเกิดขึ้นรวมถึงแต่ไม่จำกัดเพียง',
  ),
  L(
    '(a) Lỗi phần cứng, phần mềm trong quá trình xử lý dữ liệu làm mất dữ liệu của Khách hàng;',
    '(a) Hardware or software failures during data processing that cause loss of the Customer’s data;',
    '（a）数据处理过程中的硬件或软件故障导致客户数据丢失；',
    '(a) 데이터 처리 과정에서의 하드웨어·소프트웨어 장애로 고객의 데이터가 유실되는 경우',
    '(a) データ処理中のハードウェアまたはソフトウェアの障害により、お客様のデータが失われる場合。',
    '(a) ความผิดพลาดของฮาร์ดแวร์หรือซอฟต์แวร์ระหว่างการประมวลผลข้อมูลจนทำให้ข้อมูลของลูกค้าสูญหาย',
  ),
  L(
    '(b) Lỗ hổng bảo mật nằm ngoài khả năng kiểm soát của **Royal Ha Long Hotel**, hệ thống có liên quan bị hacker tấn công gây lộ lọt dữ liệu;',
    '(b) Security vulnerabilities beyond the control of **Royal Ha Long Hotel**, where a related system is attacked by hackers and data is exposed;',
    '（b）超出 **Royal Ha Long Hotel** 控制范围的安全漏洞，相关系统遭黑客攻击而造成数据泄露；',
    '(b) **Royal Ha Long Hotel**의 통제 범위를 벗어난 보안 취약점으로 관련 시스템이 해커의 공격을 받아 데이터가 유출되는 경우',
    '(b) **Royal Ha Long Hotel** の管理の及ばないセキュリティ上の脆弱性により、関連システムがハッカーの攻撃を受けてデータが流出する場合。',
    '(b) ช่องโหว่ด้านความปลอดภัยที่อยู่นอกเหนือการควบคุมของ **Royal Ha Long Hotel** โดยระบบที่เกี่ยวข้องถูกแฮกเกอร์โจมตีจนข้อมูลรั่วไหล',
  ),
  L(
    '(c) Khách hàng tự làm lộ lọt dữ liệu cá nhân do: bất cẩn hoặc bị lừa đảo truy cập các website/tải các ứng dụng có chứa phần mềm độc hại, vv…',
    '(c) The Customer exposes their own personal data through carelessness, or by being deceived into visiting websites or downloading applications that contain malicious software, and so on.',
    '（c）客户因疏忽，或受骗访问含有恶意软件的网站／下载此类应用程序等原因，自行泄露个人数据。',
    '(c) 고객께서 부주의로, 또는 악성 소프트웨어가 포함된 웹사이트 접속·애플리케이션 다운로드를 유도하는 사기에 속아 스스로 개인정보를 유출하는 경우 등',
    '(c) お客様ご自身が、不注意により、または悪意のあるソフトウェアを含むウェブサイトへのアクセスやアプリのダウンロードを促す詐欺に遭うことにより、個人データを流出させる場合など。',
    '(c) ลูกค้าทำให้ข้อมูลส่วนบุคคลของตนรั่วไหลเอง อันเนื่องมาจากความประมาท หรือถูกหลอกลวงให้เข้าเว็บไซต์/ดาวน์โหลดแอปพลิเคชันที่มีมัลแวร์ ฯลฯ',
  ),
  L(
    '**3. Royal Ha Long Hotel** khuyến cáo Khách hàng bảo mật các thông tin liên quan đến mật khẩu đăng nhập vào tài khoản của Khách hàng, mã OTP và không chia sẻ mật khẩu đăng nhập, mã OTP này với bất kỳ người nào khác.',
    '**3. Royal Ha Long Hotel** advises Customers to keep their account login password and OTP codes confidential and not to share that password or those OTP codes with anyone else.',
    '**3. Royal Ha Long Hotel** 提醒客户妥善保管账户登录密码与 OTP 验证码，切勿将该密码或验证码告知他人。',
    '**3. Royal Ha Long Hotel**은 고객께서 계정 로그인 비밀번호와 OTP 번호를 안전하게 보관하시고, 이를 다른 사람과 공유하지 않으실 것을 권고드립니다.',
    '**3. Royal Ha Long Hotel** は、お客様のアカウントのログインパスワードおよびワンタイムパスワード（OTP）を厳重に管理し、これらを他者と共有なさらないようご忠告いたします。',
    '**3. Royal Ha Long Hotel** ขอแนะนำให้ลูกค้ารักษารหัสผ่านสำหรับเข้าสู่ระบบบัญชีและรหัส OTP ไว้เป็นความลับ และไม่แบ่งปันรหัสผ่านหรือรหัส OTP ดังกล่าวแก่ผู้อื่น',
  ),
  L(
    '**4.** Khách hàng nên bảo quản thiết bị điện tử trong quá trình sử dụng; Khách hàng nên khóa, đăng xuất, hoặc thoát khỏi tài khoản trên website của **Royal Ha Long Hotel** khi không sử dụng.',
    '**4.** Customers should keep their electronic devices secure while in use, and should lock, sign out of or exit their account on the **Royal Ha Long Hotel** website when it is not in use.',
    '**4.** 客户在使用过程中应妥善保管电子设备；不使用时，应锁定、登出或退出 **Royal Ha Long Hotel** 网站上的账户。',
    '**4.** 고객께서는 사용 중인 전자기기를 안전하게 관리하시고, 사용하지 않으실 때에는 **Royal Ha Long Hotel** 웹사이트의 계정을 잠그거나 로그아웃 또는 종료해 주시기 바랍니다.',
    '**4.** お客様は、ご使用中の電子機器を適切に管理し、ご利用にならないときは **Royal Ha Long Hotel** ウェブサイトのアカウントをロック、ログアウトまたは終了してください。',
    '**4.** ลูกค้าควรดูแลรักษาอุปกรณ์อิเล็กทรอนิกส์ระหว่างการใช้งาน และควรล็อก ออกจากระบบ หรือปิดบัญชีบนเว็บไซต์ของ **Royal Ha Long Hotel** เมื่อไม่ได้ใช้งาน',
  ),
]

const PRIV_5_H = L(
  'CAM KẾT BẢO VỆ THÔNG TIN CÁ NHÂN KHÁCH HÀNG',
  'OUR UNDERTAKING TO PROTECT CUSTOMERS’ PERSONAL INFORMATION',
  '保护客户个人信息的承诺',
  '고객 개인정보 보호 약속',
  'お客様の個人情報保護に関するお約束',
  'คำมั่นในการคุ้มครองข้อมูลส่วนบุคคลของลูกค้า',
)

const PRIV_5 = [
  L(
    '**Royal Ha Long Hotel** luôn đảm bảo rằng mọi thông tin cá nhân của khách hàng sẽ được lưu giữ an toàn. Ngoại trừ các trường hợp về việc sử dụng thông tin cá nhân như đã nêu trong chính sách này, chúng tôi cam kết sẽ không tiết lộ thông tin cá nhân khách hàng ra ngoài vì mục đích thương mại. Chúng tôi có thể tiết lộ hoặc cung cấp thông tin cá nhân của khách hàng trong các trường hợp thật sự cần thiết như sau:',
    '**Royal Ha Long Hotel** always ensures that all customers’ personal information is kept securely. Except for the uses of personal information set out in this policy, we undertake not to disclose customers’ personal information externally for commercial purposes. We may disclose or provide a customer’s personal information only where it is genuinely necessary, as follows:',
    '**Royal Ha Long Hotel** 始终确保客户的一切个人信息得到安全保管。除本政策所述的个人信息使用情形外，我们承诺不会为商业目的对外披露客户个人信息。仅在下列确有必要的情形下，我们可能披露或提供客户个人信息：',
    '**Royal Ha Long Hotel**은 고객의 모든 개인정보가 안전하게 보관되도록 항상 보장합니다. 본 방침에 명시된 개인정보 이용의 경우를 제외하고, 저희는 상업적 목적으로 고객의 개인정보를 외부에 공개하지 않을 것을 약속드립니다. 다음과 같이 실질적으로 필요한 경우에 한하여 고객의 개인정보를 공개하거나 제공할 수 있습니다.',
    '**Royal Ha Long Hotel** は、お客様のすべての個人情報が安全に保管されるよう常に努めております。本ポリシーに定める個人情報の利用の場合を除き、商業目的でお客様の個人情報を外部に開示しないことをお約束いたします。次のとおり真に必要な場合に限り、お客様の個人情報を開示または提供することがあります。',
    '**Royal Ha Long Hotel** ให้ความมั่นใจเสมอว่าข้อมูลส่วนบุคคลทั้งหมดของลูกค้าจะถูกเก็บรักษาไว้อย่างปลอดภัย ยกเว้นกรณีการใช้ข้อมูลส่วนบุคคลตามที่ระบุไว้ในนโยบายฉบับนี้ เราขอให้คำมั่นว่าจะไม่เปิดเผยข้อมูลส่วนบุคคลของลูกค้าออกสู่ภายนอกเพื่อวัตถุประสงค์ทางการค้า เราอาจเปิดเผยหรือให้ข้อมูลส่วนบุคคลของลูกค้าเฉพาะในกรณีที่จำเป็นอย่างแท้จริง ดังนี้',
  ),
  L(
    '(a) Khi có yêu cầu của cơ quan pháp luật',
    '(a) When required by a law enforcement authority',
    '（a）应执法机关要求时',
    '(a) 법 집행 기관의 요청이 있는 경우',
    '(a) 法執行機関から要請があった場合',
    '(a) เมื่อมีคำร้องขอจากหน่วยงานบังคับใช้กฎหมาย',
  ),
  L(
    '(b) Trong trường hợp mà điều đó giúp chúng tôi bảo vệ quyền lợi chính đáng của mình trước pháp luật',
    '(b) Where doing so helps us protect our legitimate rights before the law',
    '（b）在有助于我们依法维护自身正当权益的情形下',
    '(b) 그렇게 하는 것이 법 앞에서 저희의 정당한 권익을 지키는 데 도움이 되는 경우',
    '(b) 法の下で当社の正当な権利を守るために必要な場合',
    '(b) ในกรณีที่การกระทำดังกล่าวช่วยให้เราปกป้องสิทธิอันชอบธรรมของเราตามกฎหมาย',
  ),
  L(
    '(c) Tình huống khẩn cấp và cần thiết để bảo đảm quyền an toàn cá nhân của các thành viên khác',
    '(c) In an emergency, where it is necessary to safeguard the personal safety of other members',
    '（c）紧急情况下，为保障其他成员人身安全之必要',
    '(c) 긴급 상황에서 다른 회원의 신체적 안전을 보호하기 위하여 필요한 경우',
    '(c) 緊急の事態において、他の会員の身体の安全を守るために必要な場合',
    '(c) ในสถานการณ์ฉุกเฉินและจำเป็นเพื่อคุ้มครองความปลอดภัยส่วนบุคคลของสมาชิกรายอื่น',
  ),
]

const PRIV_6_H = L(
  'CÁC LOẠI DỮ LIỆU MÀ ROYAL HA LONG HOTEL XỬ LÝ',
  'THE TYPES OF DATA ROYAL HA LONG HOTEL PROCESSES',
  'Royal Ha Long Hotel 处理的数据类型',
  'Royal Ha Long Hotel이 처리하는 데이터의 유형',
  'Royal Ha Long Hotel が取り扱うデータの種類',
  'ประเภทข้อมูลที่ Royal Ha Long Hotel ประมวลผล',
)

const PRIV_6 = [
  L(
    'Để **Royal Ha Long Hotel** có thể cung cấp các sản phẩm, dịch vụ cho Khách hàng và/hoặc xử lý các yêu cầu của Khách hàng, **Royal Ha Long Hotel** có thể cần phải và/hoặc được yêu cầu phải thu thập dữ liệu cá nhân, bao gồm:',
    'In order for **Royal Ha Long Hotel** to supply products and services to the Customer and/or to handle the Customer’s requests, **Royal Ha Long Hotel** may need and/or be required to collect personal data, including:',
    '为使 **Royal Ha Long Hotel** 能够向客户提供产品与服务及／或处理客户的请求，**Royal Ha Long Hotel** 可能需要及／或被要求收集个人数据，包括：',
    '**Royal Ha Long Hotel**이 고객께 상품과 서비스를 제공하고/또는 고객의 요청을 처리하기 위하여, **Royal Ha Long Hotel**은 다음을 포함한 개인정보를 수집할 필요가 있거나 수집하도록 요구받을 수 있습니다.',
    '**Royal Ha Long Hotel** がお客様に商品・サービスを提供し、および／またはお客様のご要望に対応するため、**Royal Ha Long Hotel** は次を含む個人データを収集する必要が生じ、または収集を求められる場合があります。',
    'เพื่อให้ **Royal Ha Long Hotel** สามารถจัดหาผลิตภัณฑ์และบริการแก่ลูกค้า และ/หรือดำเนินการตามคำขอของลูกค้า **Royal Ha Long Hotel** อาจจำเป็นและ/หรือถูกกำหนดให้ต้องเก็บรวบรวมข้อมูลส่วนบุคคล ซึ่งรวมถึง',
  ),
  L(
    '(a) Dữ liệu cá nhân cơ bản của Khách hàng và các cá nhân có liên quan của Khách hàng;',
    '(a) Basic personal data of the Customer and of individuals related to the Customer;',
    '（a）客户及其关联个人的基本个人数据；',
    '(a) 고객 및 고객과 관련된 개인의 기본 개인정보',
    '(a) お客様およびお客様の関係者の基本的な個人データ。',
    '(a) ข้อมูลส่วนบุคคลพื้นฐานของลูกค้าและของบุคคลที่เกี่ยวข้องกับลูกค้า',
  ),
  L(
    '(b) Dữ liệu cá nhân nhạy cảm của Khách hàng và các cá nhân có liên quan của Khách hàng;',
    '(b) Sensitive personal data of the Customer and of individuals related to the Customer;',
    '（b）客户及其关联个人的敏感个人数据；',
    '(b) 고객 및 고객과 관련된 개인의 민감 개인정보',
    '(b) お客様およびお客様の関係者の機微な個人データ。',
    '(b) ข้อมูลส่วนบุคคลอ่อนไหวของลูกค้าและของบุคคลที่เกี่ยวข้องกับลูกค้า',
  ),
  L(
    '(c) Dữ liệu liên quan đến các trang tin điện tử hoặc ứng dụng: dữ liệu kỹ thuật (như đã nêu ở trên, bao gồm loại thiết bị, hệ điều hành, loại trình duyệt, cài đặt trình duyệt, địa chỉ IP, cài đặt ngôn ngữ, ngày và giờ kết nối với trang tin điện tử, thống kê sử dụng ứng dụng, cài đặt ứng dụng, ngày và giờ kết nối với ứng dụng, dữ liệu vị trí và thông tin liên lạc kỹ thuật khác); chi tiết đăng nhập bảo mật; dữ liệu sử dụng, …',
    '(c) Data relating to the websites or applications: technical data (as described above, including device type, operating system, browser type, browser settings, IP address, language settings, the date and time of connection to the website, application usage statistics, application settings, the date and time of connection to the application, location data and other technical communication information); secure login details; usage data, and so on.',
    '（c）与网站或应用程序相关的数据：技术数据（如上所述，包括设备类型、操作系统、浏览器类型、浏览器设置、IP 地址、语言设置、连接网站的日期与时间、应用程序使用统计、应用程序设置、连接应用程序的日期与时间、位置数据及其他技术通信信息）；安全登录详情；使用数据等。',
    '(c) 웹사이트 또는 애플리케이션과 관련된 데이터: 기술 데이터(위에 기술한 바와 같이 기기 유형, 운영체제, 브라우저 종류, 브라우저 설정, IP 주소, 언어 설정, 웹사이트 접속 일시, 애플리케이션 사용 통계, 애플리케이션 설정, 애플리케이션 접속 일시, 위치 데이터 및 기타 기술적 통신 정보), 보안 로그인 상세 정보, 이용 데이터 등',
    '(c) ウェブサイトまたはアプリケーションに関するデータ：技術データ（上記のとおり、デバイスの種類、オペレーティングシステム、ブラウザの種類、ブラウザ設定、IPアドレス、言語設定、ウェブサイトへの接続日時、アプリケーションの利用統計、アプリケーション設定、アプリケーションへの接続日時、位置データその他の技術的通信情報を含む）、セキュリティログインの詳細、利用データなど。',
    '(c) ข้อมูลที่เกี่ยวข้องกับเว็บไซต์หรือแอปพลิเคชัน: ข้อมูลทางเทคนิค (ตามที่ระบุข้างต้น รวมถึงประเภทอุปกรณ์ ระบบปฏิบัติการ ประเภทเบราว์เซอร์ การตั้งค่าเบราว์เซอร์ ที่อยู่ IP การตั้งค่าภาษา วันและเวลาที่เชื่อมต่อเว็บไซต์ สถิติการใช้งานแอปพลิเคชัน การตั้งค่าแอปพลิเคชัน วันและเวลาที่เชื่อมต่อแอปพลิเคชัน ข้อมูลตำแหน่ง และข้อมูลการสื่อสารทางเทคนิคอื่น ๆ) รายละเอียดการเข้าสู่ระบบอย่างปลอดภัย ข้อมูลการใช้งาน ฯลฯ',
  ),
  L(
    '(d) Dữ liệu tiếp thị: các mối quan tâm đối với quảng cáo; dữ liệu cookie; dữ liệu clickstream; lịch sử duyệt web; phản ứng với tiếp thị trực tiếp; và lựa chọn không tham gia tiếp thị trực tiếp.',
    '(d) Marketing data: advertising interests; cookie data; clickstream data; browsing history; responses to direct marketing; and choices to opt out of direct marketing.',
    '（d）营销数据：广告兴趣；Cookie 数据；点击流数据；浏览历史；对直接营销的反馈；以及退出直接营销的选择。',
    '(d) 마케팅 데이터: 광고 관심사, 쿠키 데이터, 클릭스트림 데이터, 웹 열람 기록, 다이렉트 마케팅에 대한 반응, 다이렉트 마케팅 수신 거부 선택.',
    '(d) マーケティングデータ：広告への関心、クッキーデータ、クリックストリームデータ、閲覧履歴、ダイレクトマーケティングへの反応、およびダイレクトマーケティングの受信拒否の選択。',
    '(d) ข้อมูลการตลาด: ความสนใจต่อโฆษณา ข้อมูลคุกกี้ ข้อมูลคลิกสตรีม ประวัติการท่องเว็บ การตอบสนองต่อการตลาดทางตรง และการเลือกไม่รับการตลาดทางตรง',
  ),
]

const PRIV_7_H = L(
  'CÁCH THỨC THU THẬP DỮ LIỆU CÁ NHÂN',
  'HOW PERSONAL DATA IS COLLECTED',
  '个人数据的收集方式',
  '개인정보 수집 방법',
  '個人データの収集方法',
  'วิธีการเก็บรวบรวมข้อมูลส่วนบุคคล',
)

const PRIV_7 = [
  L(
    '**Royal Ha Long Hotel** thực hiện thu thập dữ liệu cá nhân từ Khách hàng theo các phương thức sau:',
    '**Royal Ha Long Hotel** collects personal data from Customers in the following ways:',
    '**Royal Ha Long Hotel** 通过以下方式收集客户的个人数据：',
    '**Royal Ha Long Hotel**은 다음과 같은 방법으로 고객으로부터 개인정보를 수집합니다.',
    '**Royal Ha Long Hotel** は、次の方法によりお客様から個人データを収集いたします。',
    '**Royal Ha Long Hotel** เก็บรวบรวมข้อมูลส่วนบุคคลจากลูกค้าด้วยวิธีการดังต่อไปนี้',
  ),
  L(
    '1. Trực tiếp từ Khách hàng bằng các phương tiện khác nhau:',
    '1. Directly from the Customer by various means:',
    '1. 通过各种途径直接自客户处收集：',
    '1. 여러 수단을 통해 고객으로부터 직접 수집:',
    '1. さまざまな手段により、お客様から直接収集する場合：',
    '1. โดยตรงจากลูกค้าผ่านช่องทางต่าง ๆ',
  ),
  L(
    '(a) Khi Khách hàng gửi yêu cầu đăng ký hoặc điền thông tin vào bất kỳ biểu mẫu nào khác liên quan tới các sản phẩm và dịch vụ của **Royal Ha Long Hotel**, đối tác của **Royal Ha Long Hotel**.',
    '(a) When the Customer submits a registration request or fills in any other form relating to the products and services of **Royal Ha Long Hotel** or of its partners.',
    '（a）客户提交注册申请或填写与 **Royal Ha Long Hotel** 及其合作伙伴产品与服务相关的任何其他表单时。',
    '(a) 고객이 등록 요청을 제출하거나 **Royal Ha Long Hotel** 및 그 파트너의 상품·서비스와 관련된 그 밖의 양식을 작성하실 때',
    '(a) お客様が登録のお申し込みをされたとき、または **Royal Ha Long Hotel** およびそのパートナーの商品・サービスに関するその他の様式にご記入いただいたとき。',
    '(a) เมื่อลูกค้าส่งคำขอลงทะเบียนหรือกรอกข้อมูลในแบบฟอร์มอื่นใดที่เกี่ยวข้องกับผลิตภัณฑ์และบริการของ **Royal Ha Long Hotel** และพันธมิตรของ **Royal Ha Long Hotel**',
  ),
  L(
    '(b) Khi Khách hàng tương tác với nhân viên dịch vụ khách hàng của Công ty, ví dụ như thông qua các cuộc gọi điện thoại, thư từ, gặp mặt trực tiếp, gửi thư điện tử hoặc tương tác trên mạng xã hội;',
    '(b) When the Customer interacts with the Company’s customer service staff, for example by telephone call, letter, face-to-face meeting, email or social media;',
    '（b）客户与本公司客服人员互动时，例如通过电话、信函、面谈、电子邮件或社交媒体；',
    '(b) 고객이 회사의 고객서비스 담당자와 전화, 서신, 대면 면담, 이메일 또는 소셜미디어 등을 통해 소통하실 때',
    '(b) お客様が当社のカスタマーサービス担当者と、電話、書簡、対面、電子メールまたはソーシャルメディアなどを通じてやり取りをされたとき。',
    '(b) เมื่อลูกค้ามีปฏิสัมพันธ์กับพนักงานฝ่ายบริการลูกค้าของบริษัท เช่น ทางโทรศัพท์ จดหมาย การพบปะโดยตรง อีเมล หรือผ่านสื่อสังคมออนไลน์',
  ),
  L(
    '(c) Khi Khách hàng sử dụng một số dịch vụ của **Royal Ha Long Hotel**, ví dụ như các trang web và ứng dụng bao gồm việc thiết lập các tài khoản trực tuyến với **Royal Ha Long Hotel**;',
    '(c) When the Customer uses certain services of **Royal Ha Long Hotel**, such as its websites and applications, including setting up online accounts with **Royal Ha Long Hotel**;',
    '（c）客户使用 **Royal Ha Long Hotel** 的某些服务时，例如网站与应用程序，包括在 **Royal Ha Long Hotel** 开设在线账户；',
    '(c) 고객이 **Royal Ha Long Hotel**의 일부 서비스, 예컨대 웹사이트와 애플리케이션을 이용하실 때(**Royal Ha Long Hotel**에 온라인 계정을 개설하는 경우 포함)',
    '(c) お客様が **Royal Ha Long Hotel** の一部のサービス、たとえばウェブサイトやアプリケーションをご利用になるとき（**Royal Ha Long Hotel** でのオンラインアカウント開設を含む）。',
    '(c) เมื่อลูกค้าใช้บริการบางประการของ **Royal Ha Long Hotel** เช่น เว็บไซต์และแอปพลิเคชัน รวมถึงการสร้างบัญชีออนไลน์กับ **Royal Ha Long Hotel**',
  ),
  L(
    '(d) Khi Khách hàng được liên hệ và phản hồi lại các đại diện tiếp thị và các nhân viên dịch vụ khách hàng của **Royal Ha Long Hotel**;',
    '(d) When the Customer is contacted by, and replies to, marketing representatives and customer service staff of **Royal Ha Long Hotel**;',
    '（d）客户接到 **Royal Ha Long Hotel** 营销代表及客服人员联系并作出回应时；',
    '(d) 고객이 **Royal Ha Long Hotel**의 마케팅 담당자 및 고객서비스 직원의 연락을 받고 이에 회신하실 때',
    '(d) お客様が **Royal Ha Long Hotel** のマーケティング担当者およびカスタマーサービス担当者から連絡を受け、これにご返答されたとき。',
    '(d) เมื่อลูกค้าได้รับการติดต่อและตอบกลับตัวแทนการตลาดและพนักงานฝ่ายบริการลูกค้าของ **Royal Ha Long Hotel**',
  ),
  L(
    '(e) Khi Khách hàng gửi thông tin cá nhân của mình cho Công ty vì bất kỳ lý do nào khác, bao gồm cả khi Khách hàng đăng ký sử dụng thử miễn phí bất kỳ sản phẩm và dịch vụ nào hoặc khi Khách hàng thể hiện quan tâm đến bất kỳ sản phẩm và dịch vụ nào của Công ty.',
    '(e) When the Customer sends their personal information to the Company for any other reason, including when the Customer signs up for a free trial of any product or service, or expresses interest in any of the Company’s products or services.',
    '（e）客户出于任何其他原因向本公司提供其个人信息时，包括客户注册任何产品或服务的免费试用，或对本公司任何产品或服务表示兴趣时。',
    '(e) 고객이 그 밖의 어떠한 사유로든 회사에 자신의 개인정보를 제공하실 때. 여기에는 상품·서비스의 무료 체험을 신청하시거나 회사의 상품·서비스에 관심을 표명하시는 경우가 포함됩니다.',
    '(e) お客様がその他の理由により当社に個人情報をお送りになるとき。これには、商品・サービスの無料トライアルにお申し込みの場合や、当社の商品・サービスにご関心をお示しになった場合が含まれます。',
    '(e) เมื่อลูกค้าส่งข้อมูลส่วนบุคคลของตนให้บริษัทด้วยเหตุผลอื่นใด รวมถึงเมื่อลูกค้าสมัครทดลองใช้ผลิตภัณฑ์หรือบริการใด ๆ โดยไม่เสียค่าใช้จ่าย หรือเมื่อลูกค้าแสดงความสนใจในผลิตภัณฑ์หรือบริการใด ๆ ของบริษัท',
  ),
  L(
    '(f) Khi Khách hàng mua hoặc sử dụng các dịch vụ của bên thứ ba thông qua **Royal Ha Long Hotel**.',
    '(f) When the Customer purchases or uses third-party services through **Royal Ha Long Hotel**.',
    '（f）客户通过 **Royal Ha Long Hotel** 购买或使用第三方服务时。',
    '(f) 고객이 **Royal Ha Long Hotel**을 통해 제3자의 서비스를 구매하거나 이용하실 때',
    '(f) お客様が **Royal Ha Long Hotel** を通じて第三者のサービスをご購入またはご利用になるとき。',
    '(f) เมื่อลูกค้าซื้อหรือใช้บริการของบุคคลภายนอกผ่าน **Royal Ha Long Hotel**',
  ),
  L(
    '2. Từ các bên thứ ba khác:',
    '2. From other third parties:',
    '2. 自其他第三方收集：',
    '2. 그 밖의 제3자로부터 수집:',
    '2. その他の第三者から収集する場合：',
    '2. จากบุคคลภายนอกอื่น ๆ',
  ),
  L(
    '(a) Nếu Khách hàng tương tác với nội dung hoặc quảng cáo của bên thứ ba trên trang tin điện tử hoặc trong ứng dụng, Công ty có thể nhận được thông tin cá nhân của Khách hàng từ bên thứ ba có liên quan, theo chính sách bảo mật hiện hành hợp pháp của bên thứ ba đó.',
    '(a) If the Customer interacts with third-party content or advertising on the website or within the application, the Company may receive the Customer’s personal information from the third party concerned, in accordance with that third party’s lawful privacy policy in force.',
    '（a）若客户在网站或应用程序内与第三方内容或广告互动，本公司可能依该第三方现行合法隐私政策，自该第三方处获得客户的个人信息。',
    '(a) 고객이 웹사이트 또는 애플리케이션 내의 제3자 콘텐츠나 광고와 상호작용하시는 경우, 회사는 해당 제3자의 적법한 현행 개인정보 처리방침에 따라 그 제3자로부터 고객의 개인정보를 제공받을 수 있습니다.',
    '(a) お客様がウェブサイトまたはアプリケーション内の第三者コンテンツもしくは広告と関わりを持たれた場合、当社は、当該第三者の適法な現行プライバシーポリシーに従い、その第三者からお客様の個人情報を受領することがあります。',
    '(a) หากลูกค้ามีปฏิสัมพันธ์กับเนื้อหาหรือโฆษณาของบุคคลภายนอกบนเว็บไซต์หรือในแอปพลิเคชัน บริษัทอาจได้รับข้อมูลส่วนบุคคลของลูกค้าจากบุคคลภายนอกที่เกี่ยวข้อง ตามนโยบายความเป็นส่วนตัวที่ชอบด้วยกฎหมายซึ่งบุคคลภายนอกนั้นใช้บังคับอยู่',
  ),
  L(
    '(b) Nếu Khách hàng chọn thanh toán điện tử trực tiếp tới **Royal Ha Long Hotel** hoặc thông qua trang tin điện tử hoặc ứng dụng, **Royal Ha Long Hotel** có thể nhận được dữ liệu cá nhân của Khách hàng từ các bên thứ ba, chẳng hạn như nhà cung cấp dịch vụ thanh toán, cho mục đích thanh toán đó.',
    '(b) If the Customer chooses to pay electronically direct to **Royal Ha Long Hotel** or through the website or application, **Royal Ha Long Hotel** may receive the Customer’s personal data from third parties, such as payment service providers, for the purpose of that payment.',
    '（b）若客户选择直接向 **Royal Ha Long Hotel** 或通过网站、应用程序进行电子支付，**Royal Ha Long Hotel** 可能为该笔支付之目的，自支付服务提供商等第三方处获得客户的个人数据。',
    '(b) 고객이 **Royal Ha Long Hotel**에 직접 또는 웹사이트·애플리케이션을 통해 전자 결제를 선택하시는 경우, **Royal Ha Long Hotel**은 해당 결제 목적으로 결제서비스 제공업체 등 제3자로부터 고객의 개인정보를 제공받을 수 있습니다.',
    '(b) お客様が **Royal Ha Long Hotel** へ直接、またはウェブサイトもしくはアプリケーションを通じて電子決済をお選びになった場合、**Royal Ha Long Hotel** は当該決済の目的のため、決済サービス提供者などの第三者からお客様の個人データを受領することがあります。',
    '(b) หากลูกค้าเลือกชำระเงินทางอิเล็กทรอนิกส์โดยตรงกับ **Royal Ha Long Hotel** หรือผ่านเว็บไซต์หรือแอปพลิเคชัน **Royal Ha Long Hotel** อาจได้รับข้อมูลส่วนบุคคลของลูกค้าจากบุคคลภายนอก เช่น ผู้ให้บริการชำระเงิน เพื่อวัตถุประสงค์ของการชำระเงินนั้น',
  ),
  L(
    '(c) Để tuân thủ các nghĩa vụ của mình theo luật hiện hành, **Royal Ha Long Hotel** có thể tiếp nhận dữ liệu cá nhân về Khách hàng từ các cơ quan pháp luật và cơ quan công quyền theo quy định pháp luật.',
    '(c) In order to comply with its obligations under applicable law, **Royal Ha Long Hotel** may receive personal data about the Customer from law enforcement bodies and public authorities as provided by law.',
    '（c）为履行现行法律规定的义务，**Royal Ha Long Hotel** 可依法自执法机关与公权力机关处接收有关客户的个人数据。',
    '(c) 현행 법령상의 의무를 이행하기 위하여, **Royal Ha Long Hotel**은 법령이 정하는 바에 따라 법 집행 기관 및 공공 기관으로부터 고객에 관한 개인정보를 제공받을 수 있습니다.',
    '(c) 現行法令上の義務を履行するため、**Royal Ha Long Hotel** は、法令の定めるところにより、法執行機関および公的機関からお客様に関する個人データを受領することがあります。',
    '(c) เพื่อปฏิบัติตามหน้าที่ของตนภายใต้กฎหมายที่ใช้บังคับ **Royal Ha Long Hotel** อาจได้รับข้อมูลส่วนบุคคลเกี่ยวกับลูกค้าจากหน่วยงานบังคับใช้กฎหมายและหน่วยงานของรัฐตามที่กฎหมายกำหนด',
  ),
  L(
    '(d) **Royal Ha Long Hotel** có thể tiếp nhận được dữ liệu cá nhân về Khách hàng từ các nguồn công khai (như danh bạ điện thoại, thông tin quảng cáo/tờ rơi, các thông tin được công khai trên các trang tin điện tử, v.v.).',
    '(d) **Royal Ha Long Hotel** may obtain personal data about the Customer from public sources (such as telephone directories, advertising material and leaflets, information published on websites, and so on).',
    '（d）**Royal Ha Long Hotel** 可能自公开来源（如电话簿、广告资料／宣传单、网站上公开的信息等）获得有关客户的个人数据。',
    '(d) **Royal Ha Long Hotel**은 공개된 출처(전화번호부, 광고물·전단, 웹사이트에 공개된 정보 등)로부터 고객에 관한 개인정보를 취득할 수 있습니다.',
    '(d) **Royal Ha Long Hotel** は、公開されている情報源（電話帳、広告物・チラシ、ウェブサイト上で公開された情報など）からお客様に関する個人データを取得することがあります。',
    '(d) **Royal Ha Long Hotel** อาจได้รับข้อมูลส่วนบุคคลเกี่ยวกับลูกค้าจากแหล่งข้อมูลสาธารณะ (เช่น สมุดโทรศัพท์ สื่อโฆษณา/ใบปลิว ข้อมูลที่เผยแพร่บนเว็บไซต์ ฯลฯ)',
  ),
  L(
    'Bất cứ khi nào thu thập dữ liệu cá nhân như vậy, **Royal Ha Long Hotel** sẽ đảm bảo việc nhận dữ liệu từ các bên thứ ba có liên quan theo những cách hợp pháp, đồng thời yêu cầu các bên thứ ba đó chịu trách nhiệm tuân thủ quy định của pháp luật về bảo vệ dữ liệu cá nhân.',
    'Whenever such personal data is collected, **Royal Ha Long Hotel** will ensure that the data is received from the third parties concerned by lawful means, and will require those third parties to be responsible for complying with personal data protection law.',
    '在收集此类个人数据时，**Royal Ha Long Hotel** 将确保以合法方式自相关第三方接收数据，并要求该等第三方负责遵守个人数据保护法律的规定。',
    '그러한 개인정보를 수집할 때에는 언제나, **Royal Ha Long Hotel**은 관련 제3자로부터 적법한 방법으로 데이터를 제공받도록 하며, 해당 제3자가 개인정보 보호 법령을 준수할 책임을 지도록 요구합니다.',
    'そのような個人データを収集する際には、**Royal Ha Long Hotel** は、関係する第三者から適法な方法でデータを受領することを確保するとともに、当該第三者に対し個人データ保護法令の遵守について責任を負うことを求めます。',
    'เมื่อใดก็ตามที่มีการเก็บรวบรวมข้อมูลส่วนบุคคลดังกล่าว **Royal Ha Long Hotel** จะดูแลให้การรับข้อมูลจากบุคคลภายนอกที่เกี่ยวข้องเป็นไปโดยวิธีการที่ชอบด้วยกฎหมาย และจะกำหนดให้บุคคลภายนอกเหล่านั้นรับผิดชอบในการปฏิบัติตามกฎหมายว่าด้วยการคุ้มครองข้อมูลส่วนบุคคล',
  ),
]

const PRIV_8_H = L(
  'NHỮNG NGƯỜI HOẶC TỔ CHỨC CÓ THỂ ĐƯỢC TIẾP CẬN VỚI THÔNG TIN CÁ NHÂN CỦA KHÁCH HÀNG',
  'WHO MAY HAVE ACCESS TO A CUSTOMER’S PERSONAL INFORMATION',
  '可能接触客户个人信息的人员或机构',
  '고객의 개인정보에 접근할 수 있는 사람 또는 기관',
  'お客様の個人情報にアクセスしうる者または組織',
  'บุคคลหรือองค์กรที่อาจเข้าถึงข้อมูลส่วนบุคคลของลูกค้า',
)

const PRIV_8 = [
  L(
    'Khách hàng đồng ý rằng, trong trường hợp cần thiết, các cơ quan/ tổ chức/cá nhân sau có quyền được tiếp cận và thu thập các thông tin cá nhân của mình, bao gồm:',
    'The Customer agrees that, where necessary, the following bodies, organisations and individuals are entitled to access and collect their personal information, namely:',
    '客户同意，在必要情形下，下列机关／组织／个人有权接触并收集其个人信息，包括：',
    '고객께서는 필요한 경우 다음의 기관·조직·개인이 자신의 개인정보에 접근하고 이를 수집할 권한이 있음에 동의하십니다.',
    'お客様は、必要な場合に、次の機関・組織・個人がご自身の個人情報にアクセスし、これを収集する権限を有することに同意されます。',
    'ลูกค้าตกลงว่า ในกรณีที่จำเป็น หน่วยงาน/องค์กร/บุคคลดังต่อไปนี้มีสิทธิเข้าถึงและเก็บรวบรวมข้อมูลส่วนบุคคลของตน ได้แก่',
  ),
  L(
    '1. Ban quản trị, nhân viên **Royal Ha Long Hotel**',
    '1. The management and staff of **Royal Ha Long Hotel**',
    '1. **Royal Ha Long Hotel** 的管理层与员工',
    '1. **Royal Ha Long Hotel**의 경영진 및 임직원',
    '1. **Royal Ha Long Hotel** の経営陣および従業員',
    '1. คณะผู้บริหารและพนักงานของ **Royal Ha Long Hotel**',
  ),
  L(
    '1. Bên thứ ba có dịch vụ tích hợp với website/ứng dụng',
    '1. Third parties whose services are integrated with the website or application',
    '1. 与本网站／应用程序集成服务的第三方',
    '1. 웹사이트·애플리케이션에 서비스가 연동된 제3자',
    '1. ウェブサイトまたはアプリケーションにサービスを統合している第三者',
    '1. บุคคลภายนอกที่มีบริการเชื่อมต่อกับเว็บไซต์/แอปพลิเคชัน',
  ),
  L(
    '1. Đơn vị vận chuyển liên kết với Công ty để giao hàng cho khách hàng',
    '1. Delivery partners engaged by the Company to deliver goods to customers',
    '1. 与本公司合作、向客户交付货物的承运单位',
    '1. 고객에게 물품을 배송하기 위하여 회사와 제휴한 운송업체',
    '1. お客様への配送のため当社と提携する運送事業者',
    '1. ผู้ให้บริการขนส่งที่ร่วมกับบริษัทเพื่อจัดส่งสินค้าให้ลูกค้า',
  ),
  L(
    '1. Cố vấn tài chính, pháp lý và Công ty kiểm toán',
    '1. Financial and legal advisers, and the auditing firm',
    '1. 财务顾问、法律顾问及审计公司',
    '1. 재무·법률 자문가 및 회계법인',
    '1. 財務・法務アドバイザーおよび監査法人',
    '1. ที่ปรึกษาทางการเงิน ที่ปรึกษากฎหมาย และบริษัทผู้สอบบัญชี',
  ),
  L(
    '1. Bên khiếu nại chứng minh được hành vi vi phạm của khách hàng',
    '1. A complainant who can prove a breach committed by the customer',
    '1. 能够证明客户存在违规行为的投诉方',
    '1. 고객의 위반 행위를 입증할 수 있는 이의 제기자',
    '1. お客様の違反行為を証明できる申立人',
    '1. ผู้ร้องเรียนที่สามารถพิสูจน์การกระทำผิดของลูกค้าได้',
  ),
  L(
    '1. Theo yêu cầu của cơ quan nhà nước có thẩm quyền',
    '1. At the request of a competent state authority',
    '1. 依有权国家机关的要求',
    '1. 권한 있는 국가기관의 요청에 따라',
    '1. 権限を有する国家機関の要請に基づく場合',
    '1. ตามคำร้องขอของหน่วยงานรัฐที่มีอำนาจ',
  ),
]

const PRIV_9_H = L(
  'XỬ LÝ DỮ LIỆU CÁ NHÂN TRONG MỘT SỐ TRƯỜNG HỢP ĐẶC BIỆT',
  'PROCESSING OF PERSONAL DATA IN CERTAIN SPECIAL CASES',
  '若干特殊情形下的个人数据处理',
  '특정 예외적 상황에서의 개인정보 처리',
  '一定の特別な場合における個人データの取扱い',
  'การประมวลผลข้อมูลส่วนบุคคลในบางกรณีพิเศษ',
)

const PRIV_9 = [
  L(
    '**Royal Ha Long Hotel** đảm bảo thực hiện xử lý dữ liệu cá nhân của Khách hàng đáp ứng đầy đủ các yêu cầu của Pháp luật trong các trường hợp đặc biệt nêu sau:',
    '**Royal Ha Long Hotel** ensures that the processing of the Customer’s personal data fully meets the requirements of the law in the following special cases:',
    '在下列特殊情形中，**Royal Ha Long Hotel** 确保对客户个人数据的处理完全符合法律要求：',
    '**Royal Ha Long Hotel**은 다음의 예외적 상황에서 고객의 개인정보 처리가 법령의 요건을 온전히 충족하도록 보장합니다.',
    '**Royal Ha Long Hotel** は、次の特別な場合において、お客様の個人データの取扱いが法令の要件を完全に満たすことを保証いたします。',
    '**Royal Ha Long Hotel** ขอรับรองว่าการประมวลผลข้อมูลส่วนบุคคลของลูกค้าจะเป็นไปตามข้อกำหนดของกฎหมายอย่างครบถ้วนในกรณีพิเศษดังต่อไปนี้',
  ),
  L(
    '1. Đoạn phim của máy quay giám sát (CCTV), trong trường hợp cụ thể, cũng có thể được sử dụng cho các mục đích sau đây:',
    '1. Closed-circuit television (CCTV) footage may also, in specific cases, be used for the following purposes:',
    '1. 在特定情形下，闭路电视（CCTV）录像亦可用于下列目的：',
    '1. 특정한 경우 폐쇄회로 텔레비전(CCTV) 영상은 다음 목적으로도 이용될 수 있습니다.',
    '1. 特定の場合には、防犯カメラ（CCTV）の映像を次の目的にも使用することがあります。',
    '1. ภาพจากกล้องวงจรปิด (CCTV) อาจถูกนำไปใช้ในกรณีเฉพาะเพื่อวัตถุประสงค์ดังต่อไปนี้ด้วย',
  ),
  L(
    '(a). Cho các mục đích đảm bảo chất lượng;',
    '(a) For quality assurance purposes;',
    '（a）为质量保证之目的；',
    '(a) 품질 보증 목적',
    '(a) 品質保証の目的のため。',
    '(a) เพื่อวัตถุประสงค์ในการประกันคุณภาพ',
  ),
  L(
    '(b). Cho mục đích an ninh công cộng và an toàn lao động;',
    '(b) For public security and occupational safety purposes;',
    '（b）为公共安全与劳动安全之目的；',
    '(b) 공공 안전 및 산업 안전 목적',
    '(b) 公共の安全および労働安全の目的のため。',
    '(b) เพื่อวัตถุประสงค์ด้านความมั่นคงสาธารณะและความปลอดภัยในการทำงาน',
  ),
  L(
    '(c). Phát hiện và ngăn chặn việc sử dụng đáng ngờ, không phù hợp hoặc không được phép của các tiện ích, sản phẩm, dịch vụ và/hoặc cơ sở của Công ty;',
    '(c) To detect and prevent suspicious, inappropriate or unauthorised use of the Company’s facilities, products, services and/or premises;',
    '（c）发现并阻止对本公司设施、产品、服务及／或场所的可疑、不当或未经许可的使用；',
    '(c) 회사의 시설·상품·서비스 및/또는 부지에 대한 의심스럽거나 부적절하거나 허가받지 않은 사용을 적발하고 방지하기 위하여',
    '(c) 当社の設備、商品、サービスおよび／または施設に対する不審、不適切または無許可の利用を発見し、防止するため。',
    '(c) เพื่อตรวจพบและป้องกันการใช้สิ่งอำนวยความสะดวก ผลิตภัณฑ์ บริการ และ/หรือสถานที่ของบริษัทในลักษณะที่น่าสงสัย ไม่เหมาะสม หรือไม่ได้รับอนุญาต',
  ),
  L(
    '(d). Phát hiện và ngăn chặn hành vi phạm tội;',
    '(d) To detect and prevent criminal conduct;',
    '（d）发现并阻止犯罪行为；',
    '(d) 범죄 행위를 적발하고 방지하기 위하여',
    '(d) 犯罪行為を発見し、防止するため。',
    '(d) เพื่อตรวจพบและป้องกันการกระทำความผิดทางอาญา',
  ),
  L(
    '(e). Tiến hành điều tra các sự cố.',
    '(e) To carry out investigations into incidents.',
    '（e）对事件进行调查。',
    '(e) 사고에 대한 조사를 수행하기 위하여',
    '(e) 事案の調査を行うため。',
    '(e) เพื่อดำเนินการสอบสวนเหตุการณ์ต่าง ๆ',
  ),
  L(
    '2. **Royal Ha Long Hotel** luôn tôn trọng và bảo vệ dữ liệu cá nhân của trẻ em. Ngoài các biện pháp bảo vệ dữ liệu cá nhân được quy định theo pháp luật, trước khi xử lý dữ liệu cá nhân của trẻ em, Công ty sẽ thực hiện xác minh tuổi của trẻ em và yêu cầu sự đồng ý của (i) trẻ em và/hoặc (ii) cha, mẹ hoặc người giám hộ của trẻ em theo quy định của pháp luật.',
    '2. **Royal Ha Long Hotel** always respects and protects children’s personal data. In addition to the personal data protection measures required by law, before processing a child’s personal data the Company will verify the child’s age and obtain the consent of (i) the child and/or (ii) the child’s parent or guardian, as required by law.',
    '2. **Royal Ha Long Hotel** 始终尊重并保护儿童的个人数据。除法律规定的个人数据保护措施外，在处理儿童个人数据之前，本公司将核实儿童年龄，并依法取得（i）儿童本人及／或（ii）其父母或监护人的同意。',
    '2. **Royal Ha Long Hotel**은 아동의 개인정보를 항상 존중하고 보호합니다. 법령이 정한 개인정보 보호 조치 외에도, 아동의 개인정보를 처리하기에 앞서 회사는 아동의 연령을 확인하고 법령에 따라 (i) 아동 본인 및/또는 (ii) 아동의 부모 또는 후견인의 동의를 받습니다.',
    '2. **Royal Ha Long Hotel** は、常に子どもの個人データを尊重し、保護いたします。法令が定める個人データ保護措置に加え、子どもの個人データを取り扱う前に、当社は子どもの年齢を確認し、法令に従って (i) 子ども本人および／または (ii) その父母もしくは後見人の同意を取得いたします。',
    '2. **Royal Ha Long Hotel** เคารพและคุ้มครองข้อมูลส่วนบุคคลของเด็กเสมอ นอกเหนือจากมาตรการคุ้มครองข้อมูลส่วนบุคคลตามที่กฎหมายกำหนด ก่อนประมวลผลข้อมูลส่วนบุคคลของเด็ก บริษัทจะตรวจสอบอายุของเด็ก และขอความยินยอมจาก (i) เด็ก และ/หรือ (ii) บิดา มารดา หรือผู้ปกครองของเด็ก ตามที่กฎหมายกำหนด',
  ),
  L(
    '3. Bên cạnh tuân thủ theo các quy định pháp luật có liên quan khác, đối với việc xử lý dữ liệu cá nhân liên quan đến dữ liệu cá nhân của người bị tuyên bố mất tích/ người đã chết, Công ty sẽ phải được sự đồng ý của một trong số những người có liên quan theo quy định của pháp luật hiện hành.',
    '3. In addition to complying with other relevant legal provisions, where the processing concerns the personal data of a person declared missing or of a deceased person, the Company must obtain the consent of one of the related persons as provided by applicable law.',
    '3. 除遵守其他相关法律规定外，涉及被宣告失踪者／已故者个人数据的处理，本公司须依现行法律规定取得相关人员之一的同意。',
    '3. 그 밖의 관련 법령을 준수하는 것 외에도, 실종 선고를 받은 사람 또는 사망한 사람의 개인정보 처리와 관련하여 회사는 현행 법령이 정하는 관련인 중 한 사람의 동의를 받아야 합니다.',
    '3. その他の関連法令を遵守することに加え、失踪宣告を受けた者または死亡した者の個人データの取扱いについては、当社は現行法令の定めるところにより、関係者のいずれかの同意を得なければなりません。',
    '3. นอกเหนือจากการปฏิบัติตามบทบัญญัติของกฎหมายอื่นที่เกี่ยวข้องแล้ว สำหรับการประมวลผลข้อมูลส่วนบุคคลของผู้ที่ถูกประกาศว่าสาบสูญ/ผู้ถึงแก่ความตาย บริษัทจะต้องได้รับความยินยอมจากบุคคลที่เกี่ยวข้องรายใดรายหนึ่งตามที่กฎหมายที่ใช้บังคับกำหนด',
  ),
]

const PRIV_10_H = L(
  'THỜI GIAN LƯU TRỮ THÔNG TIN',
  'HOW LONG INFORMATION IS KEPT',
  '信息保存期限',
  '정보 보관 기간',
  '情報の保存期間',
  'ระยะเวลาการเก็บรักษาข้อมูล',
)

const PRIV_10 = [
  L(
    'Thông tin của khách hàng sẽ được giữ đúng trong thời hạn pháp luật quy định hoặc chỉ sử dụng cho mục đích mà thông tin đó được thu thập.',
    'Customer information is kept for exactly the period laid down by law, or used only for the purpose for which it was collected.',
    '客户信息将严格保存于法律规定的期限内，或仅用于其被收集时的目的。',
    '고객 정보는 법령이 정한 기간 동안만 보관되거나, 수집 목적으로만 이용됩니다.',
    'お客様の情報は、法令が定める期間に限って保存され、または収集の目的のためにのみ使用されます。',
    'ข้อมูลของลูกค้าจะถูกเก็บรักษาไว้ตามระยะเวลาที่กฎหมายกำหนด หรือใช้เพียงเพื่อวัตถุประสงค์ที่ได้เก็บรวบรวมข้อมูลนั้นมาเท่านั้น',
  ),
]

const PRIV_11_H = L(
  'CÁCH THỨC XỬ LÝ DỮ LIỆU',
  'HOW DATA IS PROCESSED',
  '数据处理方式',
  '데이터 처리 방법',
  'データの処理方法',
  'วิธีการประมวลผลข้อมูล',
)

const PRIV_11 = [
  L(
    '**Royal Ha Long Hotel** áp dụng một hoặc nhiều hoạt động tác động tới dữ liệu cá nhân như: thu thập, ghi, phân tích, xác nhận, lưu trữ, chỉnh sửa, công khai, kết hợp, truy cập, truy xuất, thu hồi, mã hóa, giải mã, sao chép, chia sẻ, truyền đưa, cung cấp, chuyển giao, xóa, hủy dữ liệu cá nhân hoặc các hành động khác có liên quan.',
    '**Royal Ha Long Hotel** applies one or more operations affecting personal data, such as: collecting, recording, analysing, confirming, storing, amending, disclosing, combining, accessing, retrieving, recalling, encrypting, decrypting, copying, sharing, transmitting, providing, transferring, erasing or destroying personal data, or other related actions.',
    '**Royal Ha Long Hotel** 对个人数据实施一项或多项操作，例如：收集、记录、分析、确认、存储、修改、公开、组合、访问、检索、召回、加密、解密、复制、共享、传输、提供、转移、删除、销毁个人数据，或其他相关行为。',
    '**Royal Ha Long Hotel**은 개인정보에 영향을 미치는 하나 이상의 활동, 즉 수집, 기록, 분석, 확인, 저장, 수정, 공개, 결합, 접근, 검색, 회수, 암호화, 복호화, 복제, 공유, 전송, 제공, 이전, 삭제, 파기 또는 그 밖의 관련 행위를 수행합니다.',
    '**Royal Ha Long Hotel** は、個人データに影響を及ぼす一つまたは複数の行為、すなわち収集、記録、分析、確認、保存、修正、公開、結合、アクセス、検索、回収、暗号化、復号、複製、共有、送信、提供、移転、削除、破棄その他の関連行為を行います。',
    '**Royal Ha Long Hotel** ดำเนินการอย่างหนึ่งอย่างใดหรือหลายอย่างที่กระทบต่อข้อมูลส่วนบุคคล เช่น การเก็บรวบรวม บันทึก วิเคราะห์ ยืนยัน จัดเก็บ แก้ไข เปิดเผย รวม เข้าถึง สืบค้น เรียกคืน เข้ารหัส ถอดรหัส ทำสำเนา แบ่งปัน ส่งผ่าน ให้ โอน ลบ ทำลายข้อมูลส่วนบุคคล หรือการกระทำอื่นที่เกี่ยวข้อง',
  ),
]

const PRIV_12_H = L('COOKIES', 'COOKIES', 'COOKIES（小型文本文件）', '쿠키', 'クッキー', 'คุกกี้')

const PRIV_12 = [
  L(
    '1. Khi Khách hàng sử dụng hoặc truy cập các website, trang tin trực tuyến (sau đây gọi chung là “trang tin điện tử”) của **Royal Ha Long Hotel**, **Royal Ha Long Hotel** có thể đặt một hoặc nhiều cookie trên thiết bị của Khách hàng. “Cookie” là một tệp nhỏ được đặt trên thiết bị của Khách hàng khi Khách hàng truy cập một trang tin điện tử, nó ghi lại thông tin về thiết bị, trình duyệt của Khách hàng và trong một số trường hợp, sở thích và thói quen duyệt tin điện tử của Khách hàng. **Royal Ha Long Hotel** có thể sử dụng thông tin này để nhận diện Khách hàng khi Khách hàng quay lại các trang tin điện tử của **Royal Ha Long Hotel**, để cung cấp các dịch vụ được cá nhân hóa trên các trang tin điện tử của **Royal Ha Long Hotel**, để biên soạn số liệu phân tích nhằm hiểu rõ hơn về hoạt động của trang tin điện tử và để cải thiện các trang tin điện tử của **Royal Ha Long Hotel**. Khách hàng có thể sử dụng cài đặt trình duyệt của mình để xóa hoặc chặn cookie trên thiết bị của mình. Tuy nhiên, nếu Khách hàng quyết định không chấp nhận hoặc chặn cookie từ các trang tin điện tử của **Royal Ha Long Hotel**, Khách hàng có thể không tận dụng hết tất cả các tính năng của các trang tin điện tử của **Royal Ha Long Hotel**.',
    '1. When the Customer uses or visits the websites and online pages (together, the “websites”) of **Royal Ha Long Hotel**, **Royal Ha Long Hotel** may place one or more cookies on the Customer’s device. A “cookie” is a small file placed on the Customer’s device when the Customer visits a website; it records information about the Customer’s device and browser and, in some cases, the Customer’s browsing preferences and habits. **Royal Ha Long Hotel** may use this information to recognise the Customer on their return to the websites of **Royal Ha Long Hotel**, to provide personalised services on those websites, to compile analytics in order to understand website activity better, and to improve the websites of **Royal Ha Long Hotel**. The Customer may use their browser settings to delete or block cookies on their device. However, if the Customer decides not to accept or to block cookies from the websites of **Royal Ha Long Hotel**, the Customer may not be able to make full use of all the features of those websites.',
    '1. 当客户使用或访问 **Royal Ha Long Hotel** 的网站及在线页面（以下统称“网站”）时，**Royal Ha Long Hotel** 可能在客户设备上放置一个或多个 cookie。“Cookie”是客户访问网站时放置在其设备上的小文件，记录客户设备与浏览器的信息，在某些情况下还记录客户的浏览偏好与习惯。**Royal Ha Long Hotel** 可利用这些信息在客户再次访问 **Royal Ha Long Hotel** 网站时识别客户、在网站上提供个性化服务、汇编分析数据以更好了解网站运行情况，并改进 **Royal Ha Long Hotel** 的网站。客户可通过浏览器设置删除或阻止设备上的 cookie。但若客户决定不接受或阻止来自 **Royal Ha Long Hotel** 网站的 cookie，可能无法充分使用这些网站的全部功能。',
    '1. 고객께서 **Royal Ha Long Hotel**의 웹사이트 및 온라인 페이지(이하 통칭 “웹사이트”)를 이용하거나 방문하실 때, **Royal Ha Long Hotel**은 고객의 기기에 하나 이상의 쿠키를 저장할 수 있습니다. “쿠키”란 고객이 웹사이트를 방문하실 때 기기에 저장되는 작은 파일로, 고객의 기기와 브라우저에 관한 정보를, 경우에 따라서는 고객의 열람 취향과 습관을 기록합니다. **Royal Ha Long Hotel**은 이 정보를 이용하여 고객이 **Royal Ha Long Hotel**의 웹사이트에 다시 방문하실 때 이를 인식하고, 웹사이트에서 맞춤형 서비스를 제공하며, 웹사이트 활동을 더 잘 이해하기 위한 분석 자료를 작성하고, **Royal Ha Long Hotel**의 웹사이트를 개선할 수 있습니다. 고객께서는 브라우저 설정을 통해 기기의 쿠키를 삭제하거나 차단하실 수 있습니다. 다만 **Royal Ha Long Hotel** 웹사이트의 쿠키를 허용하지 않거나 차단하기로 결정하시는 경우, 해당 웹사이트의 모든 기능을 온전히 활용하지 못하실 수 있습니다.',
    '1. お客様が **Royal Ha Long Hotel** のウェブサイトおよびオンラインページ（以下総称して「ウェブサイト」）をご利用またはご訪問になる際、**Royal Ha Long Hotel** はお客様の端末に一つまたは複数のクッキーを保存する場合があります。「クッキー」とは、お客様がウェブサイトをご訪問になった際に端末に保存される小さなファイルで、お客様の端末およびブラウザに関する情報、場合によってはお客様の閲覧の嗜好や習慣を記録します。**Royal Ha Long Hotel** はこの情報を用いて、お客様が **Royal Ha Long Hotel** のウェブサイトに再訪された際にお客様を認識し、ウェブサイト上でパーソナライズされたサービスを提供し、ウェブサイトの動きをより深く理解するための分析データを作成し、**Royal Ha Long Hotel** のウェブサイトを改善することがあります。お客様は、ブラウザの設定により端末上のクッキーを削除またはブロックすることができます。ただし、**Royal Ha Long Hotel** のウェブサイトからのクッキーを受け入れない、またはブロックするとお決めになった場合、当該ウェブサイトのすべての機能を十分にご利用いただけないことがあります。',
    '1. เมื่อลูกค้าใช้งานหรือเข้าชมเว็บไซต์และหน้าออนไลน์ (ต่อไปนี้เรียกรวมกันว่า “เว็บไซต์”) ของ **Royal Ha Long Hotel** **Royal Ha Long Hotel** อาจวางคุกกี้หนึ่งรายการหรือมากกว่านั้นไว้บนอุปกรณ์ของลูกค้า “คุกกี้” คือไฟล์ขนาดเล็กที่ถูกวางไว้บนอุปกรณ์ของลูกค้าเมื่อลูกค้าเข้าชมเว็บไซต์ ซึ่งบันทึกข้อมูลเกี่ยวกับอุปกรณ์และเบราว์เซอร์ของลูกค้า และในบางกรณีรวมถึงความชอบและพฤติกรรมการท่องเว็บของลูกค้า **Royal Ha Long Hotel** อาจใช้ข้อมูลนี้เพื่อจดจำลูกค้าเมื่อกลับมาเยี่ยมชมเว็บไซต์ของ **Royal Ha Long Hotel** อีกครั้ง เพื่อให้บริการที่ปรับให้เหมาะกับแต่ละบุคคลบนเว็บไซต์ เพื่อรวบรวมข้อมูลเชิงวิเคราะห์ให้เข้าใจการทำงานของเว็บไซต์ได้ดียิ่งขึ้น และเพื่อปรับปรุงเว็บไซต์ของ **Royal Ha Long Hotel** ลูกค้าสามารถใช้การตั้งค่าเบราว์เซอร์เพื่อลบหรือบล็อกคุกกี้บนอุปกรณ์ของตนได้ อย่างไรก็ตาม หากลูกค้าเลือกที่จะไม่ยอมรับหรือบล็อกคุกกี้จากเว็บไซต์ของ **Royal Ha Long Hotel** ลูกค้าอาจไม่สามารถใช้ฟังก์ชันทั้งหมดของเว็บไซต์ได้อย่างเต็มที่',
  ),
  L(
    '2. **Royal Ha Long Hotel** có thể xử lý thông tin cá nhân của Khách hàng thông qua công nghệ cookie, theo các quy định của Điều khoản này. **Royal Ha Long Hotel** cũng có thể sử dụng biện pháp tiếp thị lại để phân phát quảng cáo cho những cá nhân mà **Royal Ha Long Hotel** biết trước đây đã truy cập trang tin điện tử của mình.',
    '2. **Royal Ha Long Hotel** may process the Customer’s personal information through cookie technology in accordance with the provisions of this clause. **Royal Ha Long Hotel** may also use remarketing to serve advertisements to individuals whom **Royal Ha Long Hotel** knows to have previously visited its websites.',
    '2. **Royal Ha Long Hotel** 可依本条规定通过 cookie 技术处理客户的个人信息。**Royal Ha Long Hotel** 亦可使用再营销手段，向 **Royal Ha Long Hotel** 已知曾访问其网站的个人投放广告。',
    '2. **Royal Ha Long Hotel**은 본 조항의 규정에 따라 쿠키 기술을 통해 고객의 개인정보를 처리할 수 있습니다. 또한 **Royal Ha Long Hotel**은 리마케팅을 이용하여, 이전에 자사 웹사이트를 방문한 것으로 파악된 개인에게 광고를 노출할 수 있습니다.',
    '2. **Royal Ha Long Hotel** は、本条の規定に従い、クッキー技術を通じてお客様の個人情報を処理することがあります。また **Royal Ha Long Hotel** は、以前に自社ウェブサイトを訪問したと把握している個人に対して広告を配信するため、リマーケティングを利用することがあります。',
    '2. **Royal Ha Long Hotel** อาจประมวลผลข้อมูลส่วนบุคคลของลูกค้าผ่านเทคโนโลยีคุกกี้ ตามบทบัญญัติของข้อกำหนดนี้ **Royal Ha Long Hotel** ยังอาจใช้การตลาดซ้ำ (remarketing) เพื่อแสดงโฆษณาแก่บุคคลที่ **Royal Ha Long Hotel** ทราบว่าเคยเข้าชมเว็บไซต์ของตนมาก่อน',
  ),
  L(
    '3. Trong phạm vi các bên thứ ba đã gán nội dung lên trên các trang tin điện tử của **Royal Ha Long Hotel** (ví dụ: các tính năng truyền thông xã hội), các bên thứ ba đó có thể thu thập thông tin cá nhân của Khách hàng (ví dụ: dữ liệu cookie) nếu Khách hàng chọn tương tác với nội dung của bên thứ ba đó hoặc sử dụng các dịch vụ của bên thứ ba.',
    '3. To the extent that third parties have embedded content on the websites of **Royal Ha Long Hotel** (for example, social media features), those third parties may collect the Customer’s personal information (for example, cookie data) if the Customer chooses to interact with that third-party content or to use third-party services.',
    '3. 在第三方于 **Royal Ha Long Hotel** 网站嵌入内容（例如社交媒体功能）的范围内，若客户选择与该第三方内容互动或使用第三方服务，该等第三方可能收集客户的个人信息（例如 cookie 数据）。',
    '3. 제3자가 **Royal Ha Long Hotel**의 웹사이트에 콘텐츠를 삽입한 범위 내에서(예: 소셜미디어 기능), 고객께서 해당 제3자 콘텐츠와 상호작용하거나 제3자 서비스를 이용하기로 선택하시는 경우, 그 제3자가 고객의 개인정보(예: 쿠키 데이터)를 수집할 수 있습니다.',
    '3. 第三者が **Royal Ha Long Hotel** のウェブサイトにコンテンツを埋め込んでいる範囲において（例：ソーシャルメディア機能）、お客様が当該第三者のコンテンツと関わること、または第三者のサービスをご利用になることをお選びの場合、当該第三者がお客様の個人情報（例：クッキーデータ）を収集することがあります。',
    '3. ในขอบเขตที่บุคคลภายนอกได้ฝังเนื้อหาไว้บนเว็บไซต์ของ **Royal Ha Long Hotel** (เช่น ฟีเจอร์สื่อสังคมออนไลน์) บุคคลภายนอกเหล่านั้นอาจเก็บรวบรวมข้อมูลส่วนบุคคลของลูกค้า (เช่น ข้อมูลคุกกี้) หากลูกค้าเลือกที่จะมีปฏิสัมพันธ์กับเนื้อหาของบุคคลภายนอกนั้นหรือใช้บริการของบุคคลภายนอก',
  ),
]

const PRIV_13_H = L(
  'THAY ĐỔI CHÍNH SÁCH BẢO MẬT',
  'CHANGES TO THIS PRIVACY POLICY',
  '隐私政策的变更',
  '개인정보 처리방침의 변경',
  'プライバシーポリシーの変更',
  'การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว',
)

const PRIV_13 = [
  L(
    '**Royal Ha Long Hotel** có quyền thay đổi và chỉnh sửa chính sách bảo mật này vào bất kỳ lúc nào. Chúng tôi sẽ cập nhật những thay đổi trên website/ứng dụng. Nếu khách hàng có khiếu nại hay đóng góp về chính sách của **Royal Ha Long Hotel**, xin vui lòng liên hệ với chúng tôi qua hai hình thức sau:',
    '**Royal Ha Long Hotel** reserves the right to change and amend this privacy policy at any time. We will publish any changes on the website and application. If a customer has a complaint or a comment about the policy of **Royal Ha Long Hotel**, please contact us in either of the following two ways:',
    '**Royal Ha Long Hotel** 有权随时变更和修改本隐私政策。我们将在网站／应用程序上更新相关变更。客户如对 **Royal Ha Long Hotel** 的政策有投诉或建议，请通过以下两种方式与我们联系：',
    '**Royal Ha Long Hotel**은 언제든지 본 개인정보 처리방침을 변경·수정할 권리를 보유합니다. 변경 사항은 웹사이트·애플리케이션에 게시하겠습니다. **Royal Ha Long Hotel**의 방침에 대한 불만이나 의견이 있으신 경우 다음 두 가지 방법으로 연락해 주시기 바랍니다.',
    '**Royal Ha Long Hotel** は、本プライバシーポリシーをいつでも変更・修正する権利を有します。変更内容はウェブサイトおよびアプリケーションで更新いたします。**Royal Ha Long Hotel** のポリシーについてご意見・お申し出がある場合は、次の2つの方法でご連絡ください。',
    '**Royal Ha Long Hotel** ขอสงวนสิทธิ์ในการเปลี่ยนแปลงและแก้ไขนโยบายความเป็นส่วนตัวฉบับนี้ได้ทุกเมื่อ เราจะปรับปรุงการเปลี่ยนแปลงดังกล่าวบนเว็บไซต์/แอปพลิเคชัน หากลูกค้ามีข้อร้องเรียนหรือข้อเสนอแนะเกี่ยวกับนโยบายของ **Royal Ha Long Hotel** กรุณาติดต่อเราผ่าน 2 ช่องทางต่อไปนี้',
  ),
  L(
    '**Hotline miễn phí:** 0904 030 222',
    '**Freephone hotline:** 0904 030 222',
    '**免费热线：** 0904 030 222',
    '**무료 상담 전화:** 0904 030 222',
    '**フリーダイヤル：** 0904 030 222',
    '**สายด่วนฟรี:** 0904 030 222',
  ),
  L(
    '**Email:** sales@royalhalonghotel.com',
    '**Email:** sales@royalhalonghotel.com',
    '**电子邮箱：** sales@royalhalonghotel.com',
    '**이메일:** sales@royalhalonghotel.com',
    '**メール：** sales@royalhalonghotel.com',
    '**อีเมล:** sales@royalhalonghotel.com',
  ),
]

const PRIV_14_H = L(
  'BẢO VỆ TRẺ VỊ THÀNH NIÊN',
  'PROTECTION OF MINORS',
  '未成年人保护',
  '미성년자 보호',
  '未成年者の保護',
  'การคุ้มครองผู้เยาว์',
)

const PRIV_14 = [
  L(
    'Về nguyên tắc, trẻ em và thanh thiếu niên có năng lực pháp lý hạn chế không được phép chuyển bất kỳ dữ liệu cá nhân nào đến trang web của chúng tôi mà không có sự đồng ý trước của (các) cha mẹ hoặc (các) người giám hộ hợp pháp của chúng. **Royal Ha Long Hotel** sẽ không cố ý thu thập dữ liệu cá nhân của trẻ em hoặc thanh thiếu niên có năng lực pháp lý hạn chế, sử dụng những dữ liệu này dưới bất kỳ hình thức nào hoặc tiết lộ những dữ liệu này cho bên thứ ba mà không được phép.',
    'As a matter of principle, children and young people with limited legal capacity may not transmit any personal data to our website without the prior consent of their parent(s) or legal guardian(s). **Royal Ha Long Hotel** will not knowingly collect the personal data of children or of young people with limited legal capacity, use such data in any form, or disclose such data to third parties without authorisation.',
    '原则上，未成年人及法律行为能力受限的青少年，未经其父母或法定监护人事先同意，不得向本网站传送任何个人数据。**Royal Ha Long Hotel** 不会故意收集儿童或法律行为能力受限青少年的个人数据，不会以任何形式使用此类数据，亦不会未经许可向第三方披露此类数据。',
    '원칙적으로, 아동 및 법적 능력이 제한된 청소년은 부모 또는 법정대리인의 사전 동의 없이 저희 웹사이트에 어떠한 개인정보도 전송해서는 안 됩니다. **Royal Ha Long Hotel**은 아동 또는 법적 능력이 제한된 청소년의 개인정보를 고의로 수집하거나, 그러한 정보를 어떤 형태로든 이용하거나, 허가 없이 제3자에게 공개하지 않습니다.',
    '原則として、子どもおよび法的行為能力が制限された青少年は、父母または法定後見人の事前の同意なく、弊社ウェブサイトにいかなる個人データも送信することはできません。**Royal Ha Long Hotel** は、子どもまたは法的行為能力が制限された青少年の個人データを故意に収集し、いかなる形であれ使用し、または許可なく第三者に開示することはいたしません。',
    'โดยหลักการ เด็กและเยาวชนที่มีความสามารถทางกฎหมายจำกัดไม่ได้รับอนุญาตให้ส่งข้อมูลส่วนบุคคลใด ๆ มายังเว็บไซต์ของเราโดยไม่ได้รับความยินยอมล่วงหน้าจากบิดามารดาหรือผู้ปกครองตามกฎหมาย **Royal Ha Long Hotel** จะไม่เก็บรวบรวมข้อมูลส่วนบุคคลของเด็กหรือเยาวชนที่มีความสามารถทางกฎหมายจำกัดโดยเจตนา ไม่ใช้ข้อมูลดังกล่าวในรูปแบบใด ๆ และไม่เปิดเผยข้อมูลนั้นแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต',
  ),
]

const PRIV_15_H = L(
  'ĐỊA CHỈ CỦA ĐƠN VỊ THU THẬP VÀ QUẢN LÝ THÔNG TIN CÁ NHÂN',
  'ADDRESS OF THE ENTITY THAT COLLECTS AND MANAGES PERSONAL INFORMATION',
  '收集与管理个人信息单位的地址',
  '개인정보를 수집·관리하는 주체의 주소',
  '個人情報を収集・管理する事業者の所在地',
  'ที่อยู่ของหน่วยงานผู้เก็บรวบรวมและบริหารจัดการข้อมูลส่วนบุคคล',
)

const PRIV_15 = [
  L(
    '**ROYAL HA LONG HOTEL**',
    '**ROYAL HA LONG HOTEL**',
    '**ROYAL HA LONG HOTEL**',
    '**ROYAL HA LONG HOTEL**',
    '**ROYAL HA LONG HOTEL**',
    '**ROYAL HA LONG HOTEL**',
  ),
  L(
    '**Hotline:** [0904 030 222](tel:+84904030222) – **Địa chỉ:** Đường Hạ Long, Phường Bãi Cháy, TP Hạ Long, Tỉnh Quảng Ninh, Việt Nam.',
    '**Hotline:** [0904 030 222](tel:+84904030222) – **Address:** Ha Long Road, Bai Chay Ward, Ha Long City, Quang Ninh Province, Vietnam.',
    '**热线：** [0904 030 222](tel:+84904030222) — **地址：** 越南广宁省下龙市拜寨坊下龙路。',
    '**대표 전화:** [0904 030 222](tel:+84904030222) – **주소:** 베트남 꽝닌성 하롱시 바이짜이동 하롱로.',
    '**ホットライン：** [0904 030 222](tel:+84904030222) – **住所：** ベトナム・クアンニン省ハロン市バイチャイ坊ハロン通り。',
    '**สายด่วน:** [0904 030 222](tel:+84904030222) – **ที่อยู่:** ถนนฮาลอง แขวงบ๊ายจ๋าย เมืองฮาลอง จังหวัดกว๋างนิญ ประเทศเวียดนาม',
  ),
  L(
    '**Email:** sales@royalhalonghotel.com',
    '**Email:** sales@royalhalonghotel.com',
    '**电子邮箱：** sales@royalhalonghotel.com',
    '**이메일:** sales@royalhalonghotel.com',
    '**メール：** sales@royalhalonghotel.com',
    '**อีเมล:** sales@royalhalonghotel.com',
  ),
]

const PRIV_16_H = L(
  'PHƯƠNG THỨC VÀ CÔNG CỤ ĐỂ NGƯỜI DÙNG TIẾP CẬN VÀ CHỈNH SỬA DỮ LIỆU CÁ NHÂN CỦA MÌNH',
  'HOW USERS CAN ACCESS AND CORRECT THEIR OWN PERSONAL DATA',
  '用户查阅与更正自身个人数据的方式与途径',
  '이용자가 자신의 개인정보를 열람하고 수정하는 방법과 수단',
  '利用者がご自身の個人データにアクセスし訂正するための方法と手段',
  'วิธีการและเครื่องมือให้ผู้ใช้เข้าถึงและแก้ไขข้อมูลส่วนบุคคลของตน',
)

const PRIV_16 = [
  L(
    'Bạn có quyền bất cứ lúc nào để hỏi về dữ liệu cá nhân được lưu trữ, nguồn gốc của họ và người nhận dữ liệu đó, cũng như phạm vi và mục đích của việc xử lý dữ liệu. Hơn nữa, bạn có thể yêu cầu sửa dữ liệu không chính xác liên quan đến người của bạn. Nếu bạn muốn lấy thông tin về dữ liệu được lưu trữ hoặc có câu hỏi liên quan đến chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua số **Hotline:** 0904 030 222 của chúng tôi hoặc gửi thư trực tiếp cho người liên hệ của chúng tôi về chính sách dữ liệu này qua địa chỉ: [sales@royalhalonghotel.com](mailto:sales@royalhalonghotel.com).',
    'You have the right at any time to ask about the personal data held, its origin and the recipients of that data, as well as the scope and purpose of the processing. You may also request the correction of inaccurate data relating to you. If you would like information about the data held, or have a question about this privacy policy, please contact us on our **hotline:** 0904 030 222, or write directly to our contact for this data policy at [sales@royalhalonghotel.com](mailto:sales@royalhalonghotel.com).',
    '您有权随时查询所存储的个人数据、其来源及数据接收方，以及数据处理的范围与目的。此外，您可要求更正与您本人有关的不准确数据。如您希望了解所存储数据的信息，或对本隐私政策有疑问，请拨打我们的 **热线：** 0904 030 222，或直接致函本数据政策联系人：[sales@royalhalonghotel.com](mailto:sales@royalhalonghotel.com)。',
    '귀하께서는 보관된 개인정보, 그 출처와 수령인, 그리고 처리의 범위와 목적에 대해 언제든지 문의하실 권리가 있습니다. 또한 귀하와 관련된 부정확한 정보의 정정을 요청하실 수 있습니다. 보관된 정보에 관한 안내를 원하시거나 본 개인정보 처리방침에 관해 질문이 있으시면 **대표 전화** 0904 030 222로 연락해 주시거나, 본 데이터 정책 담당자에게 [sales@royalhalonghotel.com](mailto:sales@royalhalonghotel.com)으로 직접 서면 문의해 주시기 바랍니다.',
    'お客様は、保存されている個人データ、その出所および当該データの受領者、ならびに処理の範囲と目的について、いつでもお問い合わせいただく権利を有します。また、お客様ご自身に関する不正確なデータの訂正をご請求いただけます。保存データに関する情報をご希望の場合、または本プライバシーポリシーについてご質問がある場合は、**ホットライン** 0904 030 222 までご連絡いただくか、本データポリシーの担当者宛に [sales@royalhalonghotel.com](mailto:sales@royalhalonghotel.com) へ直接お書き送りください。',
    'ท่านมีสิทธิสอบถามเกี่ยวกับข้อมูลส่วนบุคคลที่จัดเก็บไว้ แหล่งที่มา และผู้รับข้อมูลดังกล่าว ตลอดจนขอบเขตและวัตถุประสงค์ของการประมวลผลได้ตลอดเวลา นอกจากนี้ ท่านสามารถขอให้แก้ไขข้อมูลที่ไม่ถูกต้องซึ่งเกี่ยวข้องกับตัวท่านได้ หากท่านต้องการข้อมูลเกี่ยวกับข้อมูลที่จัดเก็บไว้ หรือมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวฉบับนี้ กรุณาติดต่อเราทาง **สายด่วน:** 0904 030 222 หรือเขียนถึงผู้ประสานงานด้านนโยบายข้อมูลของเราโดยตรงที่ [sales@royalhalonghotel.com](mailto:sales@royalhalonghotel.com)',
  ),
]

const PRIV_17_H = L(
  'CƠ CHẾ TIẾP NHẬN VÀ GIẢI QUYẾT KHIẾU NẠI LIÊN QUAN ĐẾN VIỆC THÔNG TIN CỦA KHÁCH HÀNG',
  'HOW COMPLAINTS ABOUT CUSTOMER INFORMATION ARE RECEIVED AND RESOLVED',
  '涉及客户信息之投诉的受理与处理机制',
  '고객 정보 관련 불만의 접수 및 처리 절차',
  'お客様の情報に関する苦情の受付および解決の仕組み',
  'กลไกการรับและแก้ไขข้อร้องเรียนเกี่ยวกับข้อมูลของลูกค้า',
)

const PRIV_17 = [
  L(
    'Khi phát hiện thông tin cá nhân của mình bị sử dụng sai mục đích hoặc phạm vi, khách hàng gửi email khiếu nại đến email: **sales@royalhalonghotel.com** hoặc gọi điện thoại tới số: **0904 030 222** để khiếu nại và cung cấp chứng cứ liên quan tới vụ việc cho Ban quản trị. Ban quản trị cam kết sẽ phản hồi ngay lập tức hoặc muộn nhất là trong vòng 24 (hai mươi tư) giờ làm việc kể từ thời điểm nhận được khiếu nại.',
    'On discovering that their personal information has been used for the wrong purpose or beyond the agreed scope, the customer should send a complaint by email to **sales@royalhalonghotel.com** or telephone **0904 030 222** in order to lodge the complaint and provide the management with the relevant evidence. The management undertakes to respond immediately, and in any event within 24 (twenty-four) working hours of receiving the complaint.',
    '客户如发现其个人信息被用于错误目的或超出约定范围，请发送投诉邮件至 **sales@royalhalonghotel.com**，或致电 **0904 030 222** 进行投诉，并向管理层提供与该事件相关的证据。管理层承诺立即回复，最迟不超过收到投诉后 24（二十四）个工作小时。',
    '고객께서 자신의 개인정보가 잘못된 목적 또는 범위를 넘어 이용되었음을 발견하신 경우, **sales@royalhalonghotel.com**으로 이의 제기 이메일을 보내시거나 **0904 030 222**로 전화하시어 불만을 제기하고 해당 사안과 관련된 증거를 경영진에 제출해 주시기 바랍니다. 경영진은 즉시, 늦어도 불만 접수 시점으로부터 24(이십사) 근무시간 이내에 회신할 것을 약속드립니다.',
    'お客様は、ご自身の個人情報が誤った目的または範囲を超えて使用されていることを発見された場合、**sales@royalhalonghotel.com** 宛に苦情のメールをお送りいただくか、**0904 030 222** までお電話のうえ、当該事案に関する証拠を経営陣にご提供ください。経営陣は、直ちに、遅くとも苦情を受領した時点から24（二十四）営業時間以内にご回答することをお約束いたします。',
    'เมื่อพบว่าข้อมูลส่วนบุคคลของตนถูกนำไปใช้ผิดวัตถุประสงค์หรือเกินขอบเขต ลูกค้าสามารถส่งอีเมลร้องเรียนมาที่ **sales@royalhalonghotel.com** หรือโทรศัพท์ไปที่ **0904 030 222** เพื่อร้องเรียนและมอบหลักฐานที่เกี่ยวข้องกับเรื่องดังกล่าวแก่คณะผู้บริหาร คณะผู้บริหารขอให้คำมั่นว่าจะตอบกลับทันที หรืออย่างช้าที่สุดภายใน 24 (ยี่สิบสี่) ชั่วโมงทำการนับแต่เวลาที่ได้รับข้อร้องเรียน',
  ),
]

const PRIV_18_H = L(
  'ĐIỀU KHOẢN CHUNG',
  'GENERAL PROVISIONS',
  '一般条款',
  '일반 조항',
  '一般条項',
  'ข้อกำหนดทั่วไป',
)

const PRIV_18 = [
  L(
    '1. Chính sách này có hiệu lực từ ngày **01/11/2024**. Khách hàng hiểu và đồng ý rằng, Chính sách này có thể được sửa đổi theo từng thời kỳ và được thông báo tới Khách hàng thông qua các Kênh giao dịch của **Royal Ha Long Hotel** trước khi áp dụng. Những thay đổi và thời điểm có hiệu lực sẽ được cập nhật và công bố tại các Kênh giao dịch và các kênh khác của **Royal Ha Long Hotel**. Việc Khách hàng tiếp tục sử dụng dịch vụ sau thời hạn thông báo về các nội dung sửa đổi, bổ sung trong từng thời kỳ đồng nghĩa với việc Khách hàng đã chấp nhận các nội dung sửa đổi, bổ sung đó.',
    '1. This policy takes effect on **1 November 2024**. The Customer understands and agrees that this policy may be amended from time to time and notified to the Customer through the transaction channels of **Royal Ha Long Hotel** before it applies. The changes and their effective dates will be updated and published on the transaction channels and other channels of **Royal Ha Long Hotel**. The Customer’s continued use of the services after the notice period for the amendments and supplements in force from time to time means that the Customer has accepted those amendments and supplements.',
    '1. 本政策自 **2024 年 11 月 1 日** 起生效。客户理解并同意，本政策可能不时修订，并在适用前通过 **Royal Ha Long Hotel** 的交易渠道通知客户。变更内容及生效时间将在 **Royal Ha Long Hotel** 的交易渠道及其他渠道更新公布。客户在有关修订、补充内容的通知期满后继续使用服务，即表示已接受该等修订与补充。',
    '1. 본 방침은 **2024년 11월 1일**부터 효력이 발생합니다. 고객께서는 본 방침이 수시로 개정될 수 있으며 적용 전에 **Royal Ha Long Hotel**의 거래 채널을 통해 고객께 고지된다는 점을 이해하고 이에 동의하십니다. 변경 내용과 효력 발생 시점은 **Royal Ha Long Hotel**의 거래 채널 및 기타 채널에 갱신·공지됩니다. 수시 개정·추가 내용에 대한 고지 기간 이후에도 고객께서 서비스를 계속 이용하시는 것은 해당 개정·추가 내용을 수락하신 것으로 봅니다.',
    '1. 本ポリシーは **2024年11月1日** に発効します。お客様は、本ポリシーが随時改定される場合があり、適用前に **Royal Ha Long Hotel** の取引チャネルを通じてお客様に通知されることをご理解のうえ同意されます。変更内容および発効時期は、**Royal Ha Long Hotel** の取引チャネルその他のチャネルにて更新・公表されます。随時の改定・追加内容に関する通知期間の経過後もお客様がサービスのご利用を継続される場合、当該改定・追加内容をご承諾いただいたものとみなされます。',
    '1. นโยบายฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่ **1 พฤศจิกายน 2567 (01/11/2024)** ลูกค้าเข้าใจและตกลงว่านโยบายฉบับนี้อาจได้รับการแก้ไขเป็นครั้งคราว และจะแจ้งให้ลูกค้าทราบผ่านช่องทางการทำธุรกรรมของ **Royal Ha Long Hotel** ก่อนนำมาใช้ การเปลี่ยนแปลงและช่วงเวลาที่มีผลบังคับใช้จะได้รับการปรับปรุงและประกาศไว้ที่ช่องทางการทำธุรกรรมและช่องทางอื่นของ **Royal Ha Long Hotel** การที่ลูกค้าใช้บริการต่อไปภายหลังพ้นกำหนดการแจ้งเกี่ยวกับเนื้อหาที่แก้ไขเพิ่มเติมในแต่ละคราว ย่อมหมายความว่าลูกค้าได้ยอมรับเนื้อหาที่แก้ไขเพิ่มเติมนั้นแล้ว',
  ),
  L(
    '2. Khách hàng đã biết rõ và đồng ý bản Chính sách này cũng là Thông báo xử lý dữ liệu cá nhân quy định tại Điều 13 Nghị định 13/NĐ-CP/2023 và được sửa đổi, bổ sung trong từng thời kỳ trước khi **Royal Ha Long Hotel** tiến hành Xử lý dữ liệu cá nhân. Theo đó. **Royal Ha Long Hotel** không cần thực hiện thêm bất kỳ biện pháp nào khác nằm mục đích thông báo việc Xử lý dữ liệu cá nhân cho Khách hàng.',
    '2. The Customer acknowledges and agrees that this policy also constitutes the notice of personal data processing provided for in Article 13 of Decree No. 13/ND-CP/2023 (Vietnam), as amended and supplemented from time to time, given before **Royal Ha Long Hotel** carries out the processing of personal data. Accordingly, **Royal Ha Long Hotel** need not take any further measure for the purpose of notifying the Customer of the processing of personal data.',
    '2. 客户已明确知悉并同意，本政策同时构成越南《第 13/ND-CP/2023 号政府议定》（Nghị định 13/ND-CP/2023）第 13 条规定的个人数据处理告知书（含不时的修订与补充），于 **Royal Ha Long Hotel** 进行个人数据处理之前作出。据此，**Royal Ha Long Hotel** 无需再采取任何其他措施向客户告知个人数据处理事宜。',
    '2. 고객께서는 본 방침이 베트남 정부 시행령 제13/ND-CP/2023호(Nghị định 13/ND-CP/2023) 제13조에 규정된 개인정보 처리 통지에 해당하며(수시 개정·보완 포함), **Royal Ha Long Hotel**이 개인정보 처리를 시행하기 전에 이루어진 것임을 분명히 알고 이에 동의하십니다. 따라서 **Royal Ha Long Hotel**은 고객께 개인정보 처리를 통지할 목적으로 그 밖의 조치를 추가로 취할 필요가 없습니다.',
    '2. お客様は、本ポリシーが、ベトナム政令第13/ND-CP/2023号（Nghị định 13/ND-CP/2023）第13条に定める個人データ処理に関する通知（随時の改定・補足を含む）にも該当し、**Royal Ha Long Hotel** が個人データの処理を行う前に行われたものであることを明確にご承知のうえ同意されます。したがって **Royal Ha Long Hotel** は、個人データの処理をお客様に通知する目的でこれ以上の措置を講じる必要はありません。',
    '2. ลูกค้าได้รับทราบอย่างชัดแจ้งและตกลงว่า นโยบายฉบับนี้ถือเป็นหนังสือแจ้งการประมวลผลข้อมูลส่วนบุคคลตามที่กำหนดไว้ในมาตรา 13 แห่งพระราชกฤษฎีกาเลขที่ 13/ND-CP/2023 ของเวียดนาม (Nghị định 13/ND-CP/2023) รวมถึงที่แก้ไขเพิ่มเติมเป็นครั้งคราว ซึ่งได้แจ้งไว้ก่อนที่ **Royal Ha Long Hotel** จะดำเนินการประมวลผลข้อมูลส่วนบุคคล ดังนั้น **Royal Ha Long Hotel** จึงไม่จำเป็นต้องดำเนินมาตรการอื่นใดเพิ่มเติมเพื่อแจ้งการประมวลผลข้อมูลส่วนบุคคลแก่ลูกค้าอีก',
  ),
  L(
    '3. Khách hàng cam kết thực hiện nghiêm túc các quy định tại Chính sách này. Các vấn đề chưa được quy định, các Bên thống nhất thực hiện theo quy định của pháp luật, hướng dẫn của cơ quan Nhà nước có thẩm quyền và/hoặc các sửa đổi, bổ sung Chính sách này được **Royal Ha Long Hotel** thông báo cho khách hàng trong từng thời kỳ.',
    '3. The Customer undertakes to observe the provisions of this policy strictly. On matters not yet provided for, the Parties agree to follow the law, the guidance of the competent state authorities and/or the amendments and supplements to this policy notified by **Royal Ha Long Hotel** to customers from time to time.',
    '3. 客户承诺严格遵守本政策的各项规定。对于尚未规定的事项，双方一致同意依照法律规定、有权国家机关的指导意见及／或 **Royal Ha Long Hotel** 不时通知客户的本政策修订与补充内容执行。',
    '3. 고객께서는 본 방침의 규정을 성실히 이행할 것을 약속하십니다. 아직 규정되지 않은 사항에 대하여 양 당사자는 법령, 권한 있는 국가기관의 지침 및/또는 **Royal Ha Long Hotel**이 수시로 고객께 고지하는 본 방침의 개정·추가 내용에 따르기로 합의합니다.',
    '3. お客様は、本ポリシーの規定を厳格に遵守することをお約束されます。未だ定めのない事項については、両当事者は、法令、権限を有する国家機関の指導、および／または **Royal Ha Long Hotel** が随時お客様に通知する本ポリシーの改定・追加内容に従うことに合意します。',
    '3. ลูกค้าให้คำมั่นว่าจะปฏิบัติตามข้อกำหนดในนโยบายฉบับนี้อย่างเคร่งครัด สำหรับเรื่องที่ยังมิได้กำหนดไว้ คู่สัญญาตกลงให้ปฏิบัติตามบทบัญญัติของกฎหมาย แนวทางของหน่วยงานรัฐที่มีอำนาจ และ/หรือการแก้ไขเพิ่มเติมนโยบายฉบับนี้ที่ **Royal Ha Long Hotel** แจ้งให้ลูกค้าทราบในแต่ละคราว',
  ),
  L(
    '4. Khách hàng có thể thấy quảng cáo hoặc nội dung khác trên bất kỳ trang tin điện tử, ứng dụng hoặc thiết bị nào có thể liên kết đến các trang tin điện tử hoặc dịch vụ của các đối tác, nhà quảng cáo, nhà tài trợ hoặc các bên thứ ba khác.',
    '4. The Customer may see advertising or other content on any website, application or device that may link to the websites or services of partners, advertisers, sponsors or other third parties.',
    '4. 客户可能在任何网站、应用程序或设备上看到广告或其他内容，这些内容可能链接至合作伙伴、广告商、赞助商或其他第三方的网站或服务。',
    '4. 고객께서는 어떤 웹사이트, 애플리케이션 또는 기기에서든 파트너, 광고주, 후원사 또는 그 밖의 제3자의 웹사이트나 서비스로 연결될 수 있는 광고 또는 기타 콘텐츠를 보실 수 있습니다.',
    '4. お客様は、いかなるウェブサイト、アプリケーションまたは端末においても、パートナー、広告主、スポンサーその他の第三者のウェブサイトまたはサービスへリンクしうる広告その他のコンテンツをご覧になる場合があります。',
    '4. ลูกค้าอาจพบโฆษณาหรือเนื้อหาอื่นบนเว็บไซต์ แอปพลิเคชัน หรืออุปกรณ์ใด ๆ ซึ่งอาจเชื่อมโยงไปยังเว็บไซต์หรือบริการของพันธมิตร ผู้ลงโฆษณา ผู้สนับสนุน หรือบุคคลภายนอกอื่น ๆ',
  ),
  L(
    '**Royal Ha Long Hotel** không kiểm soát nội dung hoặc các liên kết xuất hiện trên các trang tin điện tử hoặc dịch vụ của bên thứ ba và không chịu trách nhiệm hoặc/và trách nhiệm pháp lý đối với các hoạt động được sử dụng bởi các trang tin điện tử hoặc dịch vụ của bên thứ ba được liên kết đến hoặc từ bất kỳ trang tin điện tử, ứng dụng hoặc thiết bị nào. Các trang tin điện tử và dịch vụ này có thể tuân theo các chính sách bảo mật và điều khoản sử dụng của riêng của bên thứ ba.',
    '**Royal Ha Long Hotel** does not control the content or the links that appear on third-party websites or services, and accepts no responsibility or legal liability for the practices employed by third-party websites or services linked to or from any website, application or device. Those websites and services may be subject to the third party’s own privacy policies and terms of use.',
    '**Royal Ha Long Hotel** 不控制第三方网站或服务上出现的内容或链接，对于链接至或来自任何网站、应用程序或设备的第三方网站或服务所采取的做法，不承担任何责任或法律责任。该等网站与服务可能适用第三方自身的隐私政策与使用条款。',
    '**Royal Ha Long Hotel**은 제3자 웹사이트나 서비스에 나타나는 콘텐츠 또는 링크를 통제하지 않으며, 어떤 웹사이트·애플리케이션·기기로 연결되거나 그로부터 연결된 제3자 웹사이트·서비스가 취하는 관행에 대하여 어떠한 책임이나 법적 책임도 지지 않습니다. 해당 웹사이트와 서비스에는 제3자 자체의 개인정보 처리방침과 이용약관이 적용될 수 있습니다.',
    '**Royal Ha Long Hotel** は、第三者のウェブサイトまたはサービス上に表示されるコンテンツやリンクを管理しておらず、いかなるウェブサイト、アプリケーションまたは端末からリンクされ、あるいはこれらへリンクする第三者のウェブサイトまたはサービスが採る取扱いについて、一切の責任および法的責任を負いません。これらのウェブサイトおよびサービスには、当該第三者独自のプライバシーポリシーおよび利用規約が適用される場合があります。',
    '**Royal Ha Long Hotel** ไม่ได้ควบคุมเนื้อหาหรือลิงก์ที่ปรากฏบนเว็บไซต์หรือบริการของบุคคลภายนอก และไม่รับผิดชอบหรือรับผิดตามกฎหมายต่อแนวปฏิบัติที่เว็บไซต์หรือบริการของบุคคลภายนอกซึ่งเชื่อมโยงไปยังหรือมาจากเว็บไซต์ แอปพลิเคชัน หรืออุปกรณ์ใด ๆ นำมาใช้ เว็บไซต์และบริการเหล่านี้อาจอยู่ภายใต้นโยบายความเป็นส่วนตัวและข้อกำหนดการใช้งานของบุคคลภายนอกนั้นเอง',
  ),
  L(
    '5. Chính sách này được giao kết trên cơ sở thiện chí giữa **Royal Ha Long Hotel** và Khách hàng. Trong quá trình thực hiện nếu phát sinh tranh chấp, các Bên sẽ chủ động giải quyết thông qua thương lượng, hòa giải. Trường hợp hòa giải không thành, tranh chấp sẽ được đưa ra Tòa án nhân dân có thẩm quyền để giải quyết theo quy định của pháp luật.',
    '5. This policy is entered into in good faith between **Royal Ha Long Hotel** and the Customer. If a dispute arises during its performance, the Parties will seek to resolve it through negotiation and conciliation. If conciliation fails, the dispute will be brought before the competent People’s Court (Tòa án nhân dân) for resolution in accordance with the law.',
    '5. 本政策系 **Royal Ha Long Hotel** 与客户本着善意订立。履行过程中如发生争议，双方将主动通过协商、调解解决。调解不成的，争议将提交有管辖权的人民法院（Tòa án nhân dân）依法解决。',
    '5. 본 방침은 **Royal Ha Long Hotel**과 고객 간에 신의성실의 원칙에 따라 체결됩니다. 이행 과정에서 분쟁이 발생하는 경우 양 당사자는 협상과 조정을 통해 자발적으로 해결합니다. 조정이 성립되지 않는 경우, 분쟁은 관할 인민법원(Tòa án nhân dân)에 제기되어 법령에 따라 해결됩니다.',
    '5. 本ポリシーは、**Royal Ha Long Hotel** とお客様との間で誠実に締結されます。履行の過程で紛争が生じた場合、両当事者は協議および調停により自主的に解決を図ります。調停が成立しない場合、紛争は管轄の人民裁判所（Tòa án nhân dân）に提起され、法令に従って解決されます。',
    '5. นโยบายฉบับนี้ทำขึ้นบนพื้นฐานของความสุจริตระหว่าง **Royal Ha Long Hotel** กับลูกค้า หากเกิดข้อพิพาทระหว่างการปฏิบัติตาม คู่สัญญาจะดำเนินการแก้ไขโดยการเจรจาและไกล่เกลี่ย หากการไกล่เกลี่ยไม่เป็นผล ข้อพิพาทจะถูกนำเสนอต่อศาลประชาชนที่มีเขตอำนาจ (Tòa án nhân dân) เพื่อวินิจฉัยตามที่กฎหมายกำหนด',
  ),
  L(
    '6. Khách hàng đã đọc kỹ, hiểu rõ các quyền và nghĩa vụ và đồng ý với toàn bộ nội dung của bản Chính sách bảo mật này.',
    '6. The Customer has read this privacy policy carefully, understands the rights and obligations it sets out, and agrees to all of its contents.',
    '6. 客户已仔细阅读本隐私政策，明了其中所载权利与义务，并同意其全部内容。',
    '6. 고객께서는 본 개인정보 처리방침을 주의 깊게 읽고 그에 정한 권리와 의무를 충분히 이해하였으며, 그 내용 전부에 동의하셨습니다.',
    '6. お客様は、本プライバシーポリシーを十分にお読みになり、そこに定める権利と義務をご理解のうえ、その内容のすべてに同意されました。',
    '6. ลูกค้าได้อ่านนโยบายความเป็นส่วนตัวฉบับนี้อย่างละเอียด เข้าใจสิทธิและหน้าที่ที่กำหนดไว้ และตกลงยอมรับเนื้อหาทั้งหมดของนโยบายฉบับนี้',
  ),
]

const PRIV_SEO = seo(
  L(
    'Chính sách bảo mật — Royal Hạ Long Hotel',
    'Privacy policy — Royal Ha Long Hotel',
    '隐私政策 — Royal Ha Long Hotel',
    '개인정보 처리방침 — Royal Ha Long Hotel',
    'プライバシーポリシー — Royal Ha Long Hotel',
    'นโยบายความเป็นส่วนตัว — Royal Ha Long Hotel',
  ),
  L(
    'Royal Hạ Long Hotel thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của khách hàng như thế nào — phạm vi, mục đích, cookie, quyền của khách và cách khiếu nại.',
    'How Royal Ha Long Hotel collects, uses, stores and protects guests’ personal data — scope, purposes, cookies, your rights and how to complain.',
    'Royal Ha Long Hotel 如何收集、使用、存储并保护宾客个人数据——范围、目的、Cookie、您的权利以及投诉方式。',
    'Royal Ha Long Hotel이 고객의 개인정보를 수집·이용·보관·보호하는 방법 — 범위, 목적, 쿠키, 고객의 권리, 불만 제기 절차.',
    'Royal Ha Long Hotel によるお客様の個人データの収集・利用・保存・保護について — 範囲、目的、クッキー、お客様の権利、苦情のお申し出方法。',
    'Royal Ha Long Hotel เก็บรวบรวม ใช้ จัดเก็บ และคุ้มครองข้อมูลส่วนบุคคลของผู้เข้าพักอย่างไร — ขอบเขต วัตถุประสงค์ คุกกี้ สิทธิของท่าน และวิธีร้องเรียน',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  page.terms-and-conditions — 11 khối
 * ══════════════════════════════════════════════════════════════════ */

const TERM_TITLE = L(
  'CÁC ĐIỀU KHOẢN VÀ ĐIỀU KIỆN',
  'TERMS AND CONDITIONS',
  '条款与条件',
  '이용약관',
  '利用規約',
  'ข้อกำหนดและเงื่อนไข',
)

const TERM_HERO_ALT = L(
  'Nhân viên hành lý mặc đồng phục trắng mở cửa xe tại sảnh đón sáng đèn, cửa kính viền vàng của khách sạn bên trái',
  'A bellman in a white uniform opening a car door under the lit porte-cochère, the hotel’s gold-framed glass doors to the left',
  '身着白色制服的行李员在灯火通明的雨篷下为轿车开门，左侧是酒店金框玻璃门',
  '불 밝힌 차량 진입로에서 흰 유니폼의 벨맨이 차 문을 열어 주는 모습, 왼쪽에는 금빛 테두리의 호텔 유리문',
  '明るく照らされた車寄せで車のドアを開ける白い制服のベルマン、左手には金の枠のホテルのガラス扉',
  'พนักงานยกกระเป๋าในชุดสีขาวเปิดประตูรถใต้ทางเข้าที่สว่างไสว ด้านซ้ายคือประตูกระจกกรอบทองของโรงแรม',
)

const TERM_1_H = L(
  'PHƯƠNG THỨC ĐẶT PHÒNG',
  'HOW TO BOOK',
  '预订方式',
  '예약 방법',
  'ご予約方法',
  'วิธีการจองห้องพัก',
)

const TERM_1 = [
  L(
    'Khách có thể đặt phòng thông qua Website royalhalonghotel.com, gửi email đến địa chỉ mail: [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) hoặc gọi điện đển hotline đặt phòng **(+84) 904 030 222 – (+84) 2033 848 777**',
    'Guests may book through the website royalhalonghotel.com, by email to [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com), or by calling the reservations hotline on **(+84) 904 030 222 – (+84) 2033 848 777**',
    '宾客可通过网站 royalhalonghotel.com 预订，发送邮件至 [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com)，或致电预订热线 **(+84) 904 030 222 – (+84) 2033 848 777**',
    '고객께서는 웹사이트 royalhalonghotel.com을 통하거나, [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com)으로 이메일을 보내시거나, 예약 전용 전화 **(+84) 904 030 222 – (+84) 2033 848 777**로 연락하시어 예약하실 수 있습니다.',
    'ご予約は、ウェブサイト royalhalonghotel.com、メール [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com)、または予約ホットライン **(+84) 904 030 222 – (+84) 2033 848 777** にて承ります。',
    'ท่านสามารถจองห้องพักผ่านเว็บไซต์ royalhalonghotel.com ส่งอีเมลมาที่ [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) หรือโทรศัพท์ไปยังสายด่วนสำรองห้องพัก **(+84) 904 030 222 – (+84) 2033 848 777**',
  ),
]

const TERM_2_H = L(
  'CHÍNH SÁCH TRẺ EM VÀ GIƯỜNG PHỤ',
  'CHILDREN AND EXTRA BED POLICY',
  '儿童与加床政策',
  '어린이 및 엑스트라 베드 정책',
  'お子様・エキストラベッドに関する規定',
  'นโยบายสำหรับเด็กและเตียงเสริม',
)

const TERM_2 = [
  L(
    '1. Cũi cho trẻ sơ sinh được cung cấp miễn phí trong trường hợp khách có yêu cầu trước và tùy thuộc vào tình trạng sẵn có của khu nghỉ.',
    '1. A cot for an infant is provided free of charge on prior request and subject to availability at the resort.',
    '1. 婴儿床在提前申请且酒店有空余的情况下免费提供。',
    '1. 영유아용 아기침대는 사전 요청 시 리조트의 보유 상황에 따라 무료로 제공됩니다.',
    '1. 乳児用ベビーベッドは、事前にご希望をいただき、施設に空きがある場合に無料でご用意いたします。',
    '1. เปลเด็กอ่อนให้บริการฟรีเมื่อแจ้งความประสงค์ล่วงหน้าและขึ้นอยู่กับจำนวนที่ว่างของรีสอร์ท',
  ),
  L(
    '1. Trẻ em dưới 6 tuổi được miễn phí khi ở chung giường với ba mẹ, mỗi phòng miễn phí tối đa 01 trẻ em. Trẻ tiếp theo sẽ áp dụng theo chính sách giường phụ.',
    '1. Children under 6 stay free of charge when sharing a bed with their parents; a maximum of one child per room stays free. Any further child is subject to the extra bed policy.',
    '1. 6 岁以下儿童与父母同床免费，每间客房最多免费 1 名儿童。第二名及以上儿童适用加床政策。',
    '1. 만 6세 미만 어린이는 부모와 같은 침대를 사용할 경우 무료이며, 객실당 최대 1명까지 무료입니다. 추가 어린이는 엑스트라 베드 정책이 적용됩니다.',
    '1. 6歳未満のお子様は、ご両親と同じベッドをご使用の場合は無料です（1室につき最大1名まで無料）。2人目以降のお子様にはエキストラベッドの規定が適用されます。',
    '1. เด็กอายุต่ำกว่า 6 ปีเข้าพักฟรีเมื่อนอนเตียงเดียวกับบิดามารดา โดยฟรีสูงสุด 1 คนต่อห้อง เด็กคนถัดไปจะใช้นโยบายเตียงเสริม',
  ),
  L(
    '1. Giường phụ sẽ phụ thuộc vào tình trạng sẵn có tại khu nghỉ, tối đa mỗi phòng có thể kê 1 giường phụ.',
    '1. Extra beds are subject to availability at the resort; a maximum of one extra bed may be placed in each room.',
    '1. 加床视酒店库存情况而定，每间客房最多可加 1 张床。',
    '1. 엑스트라 베드는 리조트의 보유 상황에 따르며, 객실당 최대 1개까지 설치할 수 있습니다.',
    '1. エキストラベッドは施設の空き状況によります。1室につき最大1台までご用意可能です。',
    '1. เตียงเสริมขึ้นอยู่กับจำนวนที่ว่างของรีสอร์ท โดยเสริมได้สูงสุด 1 เตียงต่อห้อง',
  ),
  L(
    '1. Tuổi được xác định theo năm, không theo ngày tháng năm sinh. Trẻ em từ 12 tuổi trở lên được áp dụng giá người lớn',
    '1. Age is counted by year of birth, not by full date of birth. Children aged 12 and over are charged at the adult rate',
    '1. 年龄按出生年份计算，而非按具体出生日期。12 岁及以上儿童按成人价收费',
    '1. 나이는 출생 연도를 기준으로 계산하며 생년월일 전체를 기준으로 하지 않습니다. 만 12세 이상 어린이는 성인 요금이 적용됩니다',
    '1. 年齢は生年（年単位）で判定し、生年月日では判定いたしません。12歳以上のお子様は大人料金が適用されます',
    '1. อายุคำนวณตามปีเกิด ไม่ใช่ตามวันเดือนปีเกิด เด็กอายุ 12 ปีขึ้นไปคิดในอัตราผู้ใหญ่',
  ),
]

const TERM_3_H = L(
  'PHỤ THU/KHÁCH',
  'SURCHARGE PER GUEST',
  '每位客人附加费',
  '1인당 추가 요금',
  'お1人様あたりの追加料金',
  'ค่าบริการเพิ่มต่อท่าน',
)

const TERM_3 = [
  L(
    '1. Trẻ từ 06 đến 11 tuổi – ngủ chung giường với bố mẹ và ăn sáng: **VND 300.000 Người/Đêm**.',
    '1. Children aged 6 to 11 sharing a bed with their parents, breakfast included: **VND 300,000 per person per night**.',
    '1. 6 至 11 岁儿童与父母同床并含早餐：**每人每晚 300,000 越南盾**。',
    '1. 만 6~11세 어린이가 부모와 같은 침대를 사용하며 조식 포함: **1인 1박당 300,000 VND**.',
    '1. 6歳から11歳のお子様が両親と同じベッドをご使用、朝食付き：**お1人様1泊 300,000 VND**。',
    '1. เด็กอายุ 6 ถึง 11 ปี นอนเตียงเดียวกับบิดามารดาและรวมอาหารเช้า: **300,000 ดองเวียดนาม ต่อคนต่อคืน**',
  ),
  L(
    '1. Trẻ dưới 11 tuổi, có giường phụ và ăn sáng: **VND 600.000 Người/Đêm** .',
    '1. Children under 11 with an extra bed, breakfast included: **VND 600,000 per person per night**.',
    '1. 11 岁以下儿童，含加床与早餐：**每人每晚 600,000 越南盾**。',
    '1. 만 11세 미만 어린이, 엑스트라 베드 및 조식 포함: **1인 1박당 600,000 VND**.',
    '1. 11歳未満のお子様、エキストラベッドおよび朝食付き：**お1人様1泊 600,000 VND**。',
    '1. เด็กอายุต่ำกว่า 11 ปี พร้อมเตียงเสริมและอาหารเช้า: **600,000 ดองเวียดนาม ต่อคนต่อคืน**',
  ),
  L(
    '1. Trẻ từ 12 tuổi trở lên, có giường phụ và ăn sáng: **VND 600.000 Người/Đêm**',
    '1. Guests aged 12 and over with an extra bed, breakfast included: **VND 600,000 per person per night**',
    '1. 12 岁及以上，含加床与早餐：**每人每晚 600,000 越南盾**',
    '1. 만 12세 이상, 엑스트라 베드 및 조식 포함: **1인 1박당 600,000 VND**',
    '1. 12歳以上のお客様、エキストラベッドおよび朝食付き：**お1人様1泊 600,000 VND**',
    '1. ผู้เข้าพักอายุ 12 ปีขึ้นไป พร้อมเตียงเสริมและอาหารเช้า: **600,000 ดองเวียดนาม ต่อคนต่อคืน**',
  ),
]

const TERM_4_H = L(
  'QUY ĐỊNH VỀ NHẬN/TRẢ PHÒNG',
  'CHECK-IN AND CHECK-OUT',
  '入住与退房规定',
  '체크인 및 체크아웃 규정',
  'チェックイン・チェックアウトについて',
  'ข้อกำหนดการเช็กอิน/เช็กเอาต์',
)

const TERM_4 = [
  L(
    'Trừ khi có thông báo và/hoặc xác nhận khác từ Khách Sạn, quy định về nhận và trả phòng được áp dụng như sau:',
    'Unless the Hotel gives notice and/or confirmation to the contrary, the following check-in and check-out rules apply:',
    '除酒店另有通知及／或确认外，入住与退房规定如下：',
    '호텔이 달리 통지하거나 확인하지 않는 한, 체크인 및 체크아웃 규정은 다음과 같이 적용됩니다.',
    'ホテルから別段のご案内および／またはご確認がない限り、チェックインおよびチェックアウトの規定は次のとおりです。',
    'เว้นแต่โรงแรมจะแจ้งและ/หรือยืนยันเป็นอย่างอื่น ข้อกำหนดการเช็กอินและเช็กเอาต์มีดังนี้',
  ),
  L(
    '1. Giờ nhận phòng từ **14:00** giờ chiều, giờ trả phòng muộn nhất là **12:00** giờ trưa.',
    '1. Check-in from **14:00**; check-out no later than **12:00** noon.',
    '1. 入住时间为 **14:00** 起，退房时间最迟为中午 **12:00**。',
    '1. 체크인은 **14:00**부터, 체크아웃은 늦어도 정오 **12:00**까지입니다.',
    '1. チェックインは **14:00** より、チェックアウトは遅くとも正午 **12:00** までです。',
    '1. เวลาเช็กอินตั้งแต่ **14:00** น. และเช็กเอาต์ไม่เกิน **12:00** น.',
  ),
  L(
    '1. Quý khách có thể được xem xét nhận phòng sớm hay trả phòng muộn miễn phí tùy thuộc tình trạng phòng trống tại thời điểm nhận phòng & trả phòng. Nếu Quý khách muốn đảm bảo 100% nhận phòng sớm hoặc trả phòng muộn thì bắt buộc phải trả thêm phí (dựa trên giá phòng công bố) như sau:',
    '1. Early check-in or late check-out may be granted free of charge depending on room availability at the time of arrival and departure. If you wish to guarantee early check-in or late check-out with certainty, an additional charge (based on the published room rate) applies as follows:',
    '1. 提前入住或延迟退房可视抵离时的客房空余情况酌情免费提供。若您希望百分之百确保提前入住或延迟退房，则须按公布房价加收下列费用：',
    '1. 얼리 체크인 또는 레이트 체크아웃은 도착 및 출발 시점의 객실 여유 상황에 따라 무료로 제공될 수 있습니다. 확실히 보장받기를 원하실 경우, 공시 객실 요금을 기준으로 다음과 같은 추가 요금이 부과됩니다.',
    '1. アーリーチェックインまたはレイトチェックアウトは、ご到着・ご出発時の空室状況により無料で承れる場合があります。確実にご利用を保証されたい場合は、公表料金に基づき次の追加料金を申し受けます。',
    '1. การเช็กอินก่อนเวลาหรือเช็กเอาต์ล่าช้าอาจได้รับการพิจารณาให้ฟรี ขึ้นอยู่กับจำนวนห้องว่าง ณ เวลาที่เข้าพักและออกจากที่พัก หากท่านประสงค์จะรับประกัน 100% จะต้องชำระค่าบริการเพิ่มเติม (คำนวณจากราคาห้องพักที่ประกาศ) ดังนี้',
  ),
  L(
    '1. Nhận phòng sớm trước **06:00**: thanh toán thêm **100%** phí phòng ở **01 ngày**',
    '1. Early check-in before **06:00**: an additional **100%** of the room rate for **one day**',
    '1. **06:00** 前提前入住：加收 **1 天** 房费的 **100%**',
    '1. **06:00** 이전 얼리 체크인: **1일** 객실 요금의 **100%** 추가 지불',
    '1. **06:00** より前のアーリーチェックイン：**1日**分の室料の **100%** を追加',
    '1. เช็กอินก่อนเวลา **06:00** น.: ชำระเพิ่ม **100%** ของค่าห้องพัก **1 วัน**',
  ),
  L(
    '1. Nhận phòng sớm từ **06:00** đến **12:00**: thanh toán thêm **50%** phí phòng ở **01 ngày**',
    '1. Early check-in between **06:00** and **12:00**: an additional **50%** of the room rate for **one day**',
    '1. **06:00** 至 **12:00** 提前入住：加收 **1 天** 房费的 **50%**',
    '1. **06:00**부터 **12:00** 사이 얼리 체크인: **1일** 객실 요금의 **50%** 추가 지불',
    '1. **06:00** から **12:00** までのアーリーチェックイン：**1日**分の室料の **50%** を追加',
    '1. เช็กอินก่อนเวลาระหว่าง **06:00** ถึง **12:00** น.: ชำระเพิ่ม **50%** ของค่าห้องพัก **1 วัน**',
  ),
  L(
    '1. Trả phòng muộn sau **12:00** đến **18:00:** thanh toán thêm **50%** phí phòng ở **01 ngày**',
    '1. Late check-out after **12:00** and up to **18:00:** an additional **50%** of the room rate for **one day**',
    '1. **12:00** 之后至 **18:00** 延迟退房：加收 **1 天** 房费的 **50%**',
    '1. **12:00** 이후 **18:00**까지 레이트 체크아웃: **1일** 객실 요금의 **50%** 추가 지불',
    '1. **12:00** 以降 **18:00** までのレイトチェックアウト：**1日**分の室料の **50%** を追加',
    '1. เช็กเอาต์ล่าช้าหลัง **12:00** ถึง **18:00** น.: ชำระเพิ่ม **50%** ของค่าห้องพัก **1 วัน**',
  ),
  L(
    '1. Trả phòng muộn sau **18:00:** thanh toán thêm **100%** phí phòng ở **01 ngày**',
    '1. Late check-out after **18:00:** an additional **100%** of the room rate for **one day**',
    '1. **18:00** 之后延迟退房：加收 **1 天** 房费的 **100%**',
    '1. **18:00** 이후 레이트 체크아웃: **1일** 객실 요금의 **100%** 추가 지불',
    '1. **18:00** 以降のレイトチェックアウト：**1日**分の室料の **100%** を追加',
    '1. เช็กเอาต์ล่าช้าหลัง **18:00** น.: ชำระเพิ่ม **100%** ของค่าห้องพัก **1 วัน**',
  ),
  L(
    '1. Quy định khi nhận phòng tại quầy lễ tân: Giấy tờ tùy thân là yêu cầu bắt buộc để nhận phòng. Quý khách vui lòng tạm ứng với Lễ Tân lúc nhận phòng là **VND 1.000.000/phòng/đêm** cho những chi phí phát sinh ngoài tiền phòng và Quý khách sẽ được hoàn trả lại nếu không sử dụng dịch vụ của Khách sạn.',
    '1. Rules on checking in at reception: photographic identification is compulsory in order to check in. Please leave a deposit with reception on arrival of **VND 1,000,000 per room per night** against incidental charges outside the room rate; the deposit is refunded if you do not use the Hotel’s chargeable services.',
    '1. 前台办理入住的规定：办理入住必须出示身份证件。请于入住时向前台预付 **每间客房每晚 1,000,000 越南盾** 作为房费之外杂费的押金；若未使用酒店相关收费服务，押金将全额退还。',
    '1. 프런트 체크인 시 규정: 체크인을 위해서는 신분증 제시가 필수입니다. 객실 요금 외 부대 비용에 대비하여 체크인 시 프런트에 **객실당 1박 1,000,000 VND**의 보증금을 맡겨 주시기 바라며, 호텔의 유료 서비스를 이용하지 않으신 경우 전액 환불해 드립니다.',
    '1. フロントでのチェックインに関する規定：チェックインには身分証明書のご提示が必須です。室料以外の付帯費用に備え、ご到着時にフロントへ **1室1泊あたり 1,000,000 VND** をデポジットとしてお預けください。ホテルの有料サービスをご利用にならなかった場合は全額ご返金いたします。',
    '1. ข้อกำหนดเมื่อเช็กอินที่เคาน์เตอร์ต้อนรับ: ต้องแสดงเอกสารแสดงตนเพื่อเช็กอิน กรุณาวางเงินประกันกับพนักงานต้อนรับเมื่อเช็กอินจำนวน **1,000,000 ดองเวียดนาม ต่อห้องต่อคืน** สำหรับค่าใช้จ่ายนอกเหนือค่าห้องพัก และจะได้รับคืนเต็มจำนวนหากท่านไม่ได้ใช้บริการที่มีค่าใช้จ่ายของโรงแรม',
  ),
  L(
    '1. Khách cần xuất trình Xác nhận đặt phòng hoặc Mã đặt phòng của Yêu Cầu Dịch Vụ đã thanh toán thành công trên Trang Web www.royalhalonghotel.com. Trong trường hợp Khách không xuất trình được Xác nhận đặt phòng hay Mã đặt phòng của Yêu Cầu Dịch Vụ đã thanh toán thành công, Khách cần cung cấp thông tin đặt phòng bao gồm tên người đặt phòng, số điện thoại, số lượng phòng đặt… để Lễ tân kiểm tra thông tin trên Hệ thống. Trong trường hợp Lễ tân không xác nhận được thông tin của Khách, Khách sạn có quyền từ chối Yêu Cầu Dịch Vụ của Khách.',
    '1. Guests must present the booking confirmation or the booking code of a Service Request successfully paid for on the website www.royalhalonghotel.com. If the guest cannot present the booking confirmation or the booking code of a successfully paid Service Request, the guest must provide booking details — the name of the person who made the booking, a telephone number, the number of rooms booked and so on — so that reception can check the information in the system. If reception is unable to confirm the guest’s details, the Hotel reserves the right to refuse the guest’s Service Request.',
    '1. 宾客须出示在网站 www.royalhalonghotel.com 上成功支付的服务申请之预订确认函或预订编码。若宾客无法出示已成功付款的预订确认函或预订编码，须提供预订信息，包括预订人姓名、电话号码、预订房间数量等，以便前台在系统中核实。若前台无法确认宾客信息，酒店有权拒绝该服务申请。',
    '1. 고객께서는 웹사이트 www.royalhalonghotel.com에서 결제가 완료된 서비스 요청의 예약 확인서 또는 예약 번호를 제시하셔야 합니다. 결제가 완료된 예약 확인서나 예약 번호를 제시하지 못하시는 경우, 예약자 성명, 전화번호, 예약 객실 수 등 예약 정보를 제공해 주셔야 프런트가 시스템에서 확인할 수 있습니다. 프런트가 고객의 정보를 확인하지 못하는 경우, 호텔은 해당 서비스 요청을 거절할 권리가 있습니다.',
    '1. お客様は、ウェブサイト www.royalhalonghotel.com でお支払いが完了したサービスリクエストの予約確認書または予約番号をご提示ください。お支払い済みの予約確認書または予約番号をご提示いただけない場合は、予約者氏名、電話番号、予約室数などの予約情報をお知らせいただき、フロントがシステムで確認いたします。フロントがお客様の情報を確認できない場合、ホテルは当該サービスリクエストをお断りする権利を有します。',
    '1. ผู้เข้าพักต้องแสดงหนังสือยืนยันการจองหรือรหัสการจองของคำขอรับบริการที่ชำระเงินสำเร็จแล้วบนเว็บไซต์ www.royalhalonghotel.com หากผู้เข้าพักไม่สามารถแสดงหนังสือยืนยันการจองหรือรหัสการจองที่ชำระเงินสำเร็จได้ ผู้เข้าพักต้องให้ข้อมูลการจอง ได้แก่ ชื่อผู้จอง หมายเลขโทรศัพท์ จำนวนห้องที่จอง ฯลฯ เพื่อให้พนักงานต้อนรับตรวจสอบข้อมูลในระบบ หากพนักงานต้อนรับไม่สามารถยืนยันข้อมูลของผู้เข้าพักได้ โรงแรมมีสิทธิปฏิเสธคำขอรับบริการของผู้เข้าพัก',
  ),
]

const TERM_5_H = L(
  'PHƯƠNG THỨC ĐỔI PHÒNG, ĐỔI NGÀY NHẬN PHÒNG ĐÃ THANH TOÁN',
  'CHANGING A PAID ROOM OR ARRIVAL DATE',
  '已付款订单的换房与改期方式',
  '결제 완료된 객실 또는 투숙일 변경 방법',
  'お支払い済みのお部屋・ご到着日の変更方法',
  'วิธีเปลี่ยนห้องพักหรือวันเข้าพักที่ชำระเงินแล้ว',
)

const TERM_5 = [
  L(
    'Quý khách vui lòng liên hê với bộ phận đặt phòng Khu nghỉ qua địa chỉ mail [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) hoặc số điện thoại **0904 030 222**.',
    'Please contact the resort’s reservations team at [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) or on **0904 030 222**.',
    '请通过邮箱 [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) 或电话 **0904 030 222** 联系酒店预订部。',
    '리조트 예약부([info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) 또는 **0904 030 222**)로 연락해 주시기 바랍니다.',
    '施設の予約部（[info@royalhalonghotel.com](mailto:info@royalhalonghotel.com)／**0904 030 222**）までご連絡ください。',
    'กรุณาติดต่อแผนกสำรองห้องพักของรีสอร์ทที่อีเมล [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) หรือโทร **0904 030 222**',
  ),
]

const TERM_6_H = L(
  'CÁCH THỨC ĐẢM BẢO HOÀN TIỀN, CHI PHÍ CHO VIỆC HOÀN TRẢ',
  'REFUND GUARANTEE AND REFUND COSTS',
  '退款保障与退款费用',
  '환불 보장 및 환불 비용',
  '返金の保証および返金にかかる費用',
  'การรับประกันการคืนเงินและค่าใช้จ่ายในการคืนเงิน',
)

const TERM_6 = [
  L(
    'Tùy thuộc vào chính sách của từng gói ưu đãi mà yêu cầu hủy đặt phòng của Khách có thể được hoàn tiền hoàn toàn, hoàn tiền một phần hoặc không được hoàn tiền. Vui lòng liên hệ bộ phận đặt phòng qua địa chỉ mail [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) để được tư vấn và hỗ trợ cụ thể.',
    'Depending on the policy of each package, a cancellation request may be fully refundable, partly refundable or non-refundable. Please contact the reservations team at [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) for specific advice and assistance.',
    '视各优惠套餐的政策而定，客人的取消预订申请可能全额退款、部分退款或不予退款。具体咨询与协助请联系预订部邮箱 [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com)。',
    '각 패키지의 정책에 따라 고객의 예약 취소 요청은 전액 환불, 부분 환불 또는 환불 불가가 될 수 있습니다. 구체적인 안내와 도움은 예약부 [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com)으로 문의해 주시기 바랍니다.',
    '各プランの規定により、お客様のキャンセルのお申し出は全額返金、一部返金、または返金不可となる場合があります。詳しいご案内とサポートについては、予約部 [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) までお問い合わせください。',
    'ขึ้นอยู่กับนโยบายของแต่ละแพ็กเกจ คำขอยกเลิกการจองของผู้เข้าพักอาจได้รับเงินคืนเต็มจำนวน คืนบางส่วน หรือไม่ได้รับเงินคืน กรุณาติดต่อแผนกสำรองห้องพักที่อีเมล [info@royalhalonghotel.com](mailto:info@royalhalonghotel.com) เพื่อขอคำแนะนำและความช่วยเหลือเฉพาะกรณี',
  ),
]

const TERM_7_H = L(
  'MÙA DU LỊCH',
  'TRAVEL SEASONS',
  '旅游季节',
  '여행 시즌',
  'シーズン区分',
  'ฤดูกาลท่องเที่ยว',
)

const TERM_7 = [
  L(
    '**Mùa Bình thường:** 01.01 – 27.04 | 02.05 – 31.05 | 16.08 – 30.08 | 03.09 – 31.12',
    '**Normal season:** 01.01 – 27.04 | 02.05 – 31.05 | 16.08 – 30.08 | 03.09 – 31.12',
    '**平季：** 01.01 – 27.04 | 02.05 – 31.05 | 16.08 – 30.08 | 03.09 – 31.12',
    '**일반 시즌:** 01.01 – 27.04 | 02.05 – 31.05 | 16.08 – 30.08 | 03.09 – 31.12',
    '**通常シーズン：** 01.01 – 27.04 | 02.05 – 31.05 | 16.08 – 30.08 | 03.09 – 31.12',
    '**ฤดูกาลปกติ:** 01.01 – 27.04 | 02.05 – 31.05 | 16.08 – 30.08 | 03.09 – 31.12',
  ),
  L(
    '**Mùa Lễ Tết:** 28.04 – 01.05 | 31.08 – 02.09',
    '**Public holiday season:** 28.04 – 01.05 | 31.08 – 02.09',
    '**节假日季：** 28.04 – 01.05 | 31.08 – 02.09',
    '**공휴일 시즌:** 28.04 – 01.05 | 31.08 – 02.09',
    '**祝祭日シーズン：** 28.04 – 01.05 | 31.08 – 02.09',
    '**ฤดูกาลวันหยุดนักขัตฤกษ์:** 28.04 – 01.05 | 31.08 – 02.09',
  ),
  L(
    '**Mùa Cao điểm:** 01.06 – 15.08',
    '**Peak season:** 01.06 – 15.08',
    '**旺季：** 01.06 – 15.08',
    '**성수기:** 01.06 – 15.08',
    '**ハイシーズン：** 01.06 – 15.08',
    '**ฤดูกาลท่องเที่ยวสูงสุด:** 01.06 – 15.08',
  ),
]

const TERM_8_H = L(
  'CHÍNH SÁCH HỦY ĐẶT PHÒNG',
  'CANCELLATION POLICY',
  '取消预订政策',
  '예약 취소 정책',
  'キャンセルポリシー',
  'นโยบายการยกเลิกการจอง',
)

const TERM_8 = [
  L(
    '**Mùa Bình thường:**',
    '**Normal season:**',
    '**平季：**',
    '**일반 시즌:**',
    '**通常シーズン：**',
    '**ฤดูกาลปกติ:**',
  ),
  L(
    '- Free of Charge: **trên 05 ngày trước khi đến**',
    '- Free of charge: **more than 5 days before arrival**',
    '- 免费取消：**抵店前 5 天以上**',
    '- 무료 취소: **도착 5일 이전**',
    '- 無料：**ご到着の5日前より前**',
    '- ไม่มีค่าใช้จ่าย: **มากกว่า 5 วันก่อนวันเข้าพัก**',
  ),
  L(
    '- 100% Giá trị đặt phòng: **1 – 4 ngày**',
    '- 100% of the booking value: **1 – 4 days**',
    '- 收取订单全额（100%）：**1 – 4 天**',
    '- 예약 금액의 100%: **1~4일**',
    '- ご予約金額の100%：**1～4日**',
    '- 100% ของมูลค่าการจอง: **1 – 4 วัน**',
  ),
  L(
    '**Mùa Lễ Tết:**',
    '**Public holiday season:**',
    '**节假日季：**',
    '**공휴일 시즌:**',
    '**祝祭日シーズン：**',
    '**ฤดูกาลวันหยุดนักขัตฤกษ์:**',
  ),
  L(
    '- Free of Charge: trên **31 ngày trước khi đến**',
    '- Free of charge: more than **31 days before arrival**',
    '- 免费取消：**抵店前 31 天以上**',
    '- 무료 취소: **도착 31일 이전**',
    '- 無料：**ご到着の31日前より前**',
    '- ไม่มีค่าใช้จ่าย: มากกว่า **31 วันก่อนวันเข้าพัก**',
  ),
  L(
    '- 50% Giá trị đặt phòng: **30 – 21 ngày**',
    '- 50% of the booking value: **30 – 21 days**',
    '- 收取订单 50%：**30 – 21 天**',
    '- 예약 금액의 50%: **30~21일**',
    '- ご予約金額の50%：**30～21日**',
    '- 50% ของมูลค่าการจอง: **30 – 21 วัน**',
  ),
  L(
    '- 100% Giá trị đặt phòng: **<21 ngày**',
    '- 100% of the booking value: **fewer than 21 days**',
    '- 收取订单全额（100%）：**少于 21 天**',
    '- 예약 금액의 100%: **21일 미만**',
    '- ご予約金額の100%：**21日未満**',
    '- 100% ของมูลค่าการจอง: **น้อยกว่า 21 วัน**',
  ),
  L(
    '**Mùa Cao điểm:**',
    '**Peak season:**',
    '**旺季：**',
    '**성수기:**',
    '**ハイシーズン：**',
    '**ฤดูกาลท่องเที่ยวสูงสุด:**',
  ),
  L(
    '- Free of Charge: **15 ngày trước khi đến**',
    '- Free of charge: **15 days before arrival**',
    '- 免费取消：**抵店前 15 天**',
    '- 무료 취소: **도착 15일 전**',
    '- 無料：**ご到着の15日前**',
    '- ไม่มีค่าใช้จ่าย: **15 วันก่อนวันเข้าพัก**',
  ),
  L(
    '- 100% Giá trị đặt phòng: **1 – 14 ngày**',
    '- 100% of the booking value: **1 – 14 days**',
    '- 收取订单全额（100%）：**1 – 14 天**',
    '- 예약 금액의 100%: **1~14일**',
    '- ご予約金額の100%：**1～14日**',
    '- 100% ของมูลค่าการจอง: **1 – 14 วัน**',
  ),
]

const TERM_9_H = L(
  'QUY ĐỊNH VỀ VOUCHER VÀ SỬ DỤNG VOUCHER',
  'VOUCHERS AND THEIR USE',
  '礼券及其使用规定',
  '바우처 및 사용 규정',
  'バウチャーおよびそのご利用に関する規定',
  'ข้อกำหนดเกี่ยวกับวอชเชอร์และการใช้วอชเชอร์',
)

const TERM_9 = [
  L(
    'Trừ khi có thỏa thuận khác hoặc Royal Hạ Long Hotel có chính sách khác, Khách sử dụng Voucher phải tuân thủ các quy định tại Điều khoản chung, quy định chung, các điều kiện khác quy định trên Voucher và/hoặc chính sách cung cấp Dịch Vụ tương ứng với loại Voucher được Royal Hạ Long phát hành tại thời điểm mà Khách sử dụng. Voucher gốc phải được xuất trình và thu hồi tại thời điểm nhận phòng, trong trường hợp không xuất trình được Voucher đủ điều kiện sử dụng thì Khách phải thanh toán trực tiếp theo Giá Công Bố tại thời điểm nhận phòng. Voucher không có giá trị quy đổi sang tiền mặt hoặc các dịch vụ khác và chỉ được sử dụng 1 lần không hoàn lại. Không trả lại tiền thừa nếu không dùng hết giá trị Voucher. Voucher không được áp dụng đồng thời cùng các chương trình khuyến mãi khác & không được sử dụng để tích điểm vào thẻ hội viên. Voucher khi sử dụng phải còn nguyên vẹn, không tẩy xóa hoặc rách rời chắp vá. Voucher không được phát hành đổi trong trường hợp bị mất hoặc hư hỏng. Áp dụng 01 Voucher/01 hóa đơn. Voucher không có giá trị quy đổi thành tiền mặt hoặc Voucher có giá trị nhỏ hơn. Nếu giá trị dịch vụ nhỏ hơn giá trị Voucher, Khách không được hoàn lại khoản tiền dư.',
    'Unless otherwise agreed or unless Royal Ha Long Hotel has a different policy, guests using a Voucher must comply with the General Terms, the general rules, the other conditions set out on the Voucher and/or the service policy applicable to the type of Voucher issued by Royal Ha Long at the time the guest uses it. The original Voucher must be presented and surrendered at check-in; if a valid Voucher cannot be presented, the guest must pay directly at the published rate at check-in. A Voucher cannot be exchanged for cash or for other services and may be used once only, without refund. No change is given if the full value of the Voucher is not used. A Voucher may not be combined with other promotions and may not be used to earn membership card points. A Voucher must be intact when used, with no erasures, tears or repairs. A Voucher is not reissued if lost or damaged. One Voucher applies per invoice. A Voucher has no cash value and cannot be exchanged for Vouchers of lower value. If the value of the service is lower than the value of the Voucher, the guest is not refunded the difference.',
    '除另有约定或 Royal Ha Long Hotel 另有政策外，使用礼券的宾客须遵守《一般条款》、一般规定、礼券上载明的其他条件，及／或 Royal Ha Long 在宾客使用时所发行对应券种的服务提供政策。原件礼券须在办理入住时出示并回收；如无法出示符合使用条件的礼券，宾客须在办理入住时按公布价直接付款。礼券不可兑换现金或其他服务，仅限使用一次且不可退还。礼券价值未用尽的，不找零。礼券不可与其他促销活动同时使用，亦不可用于会员卡积分。使用时礼券须完整无缺，不得涂改、撕裂或拼补。礼券遗失或损毁不予补发。每张发票限用 1 张礼券。礼券不具现金价值，也不可兑换为面值更小的礼券。若服务价值低于礼券面值，宾客不获退还差额。',
    '달리 합의하거나 Royal Ha Long Hotel의 별도 정책이 있는 경우를 제외하고, 바우처를 사용하시는 고객은 일반 약관, 일반 규정, 바우처에 명시된 그 밖의 조건 및/또는 고객이 사용하는 시점에 Royal Ha Long이 발행한 해당 바우처 종류에 적용되는 서비스 제공 정책을 준수하셔야 합니다. 원본 바우처는 체크인 시 제시하고 회수되어야 하며, 사용 요건을 갖춘 바우처를 제시하지 못하시는 경우 고객께서는 체크인 시 공시 요금으로 직접 결제하셔야 합니다. 바우처는 현금이나 다른 서비스로 교환할 수 없으며 1회에 한해 사용 가능하고 환불되지 않습니다. 바우처 금액을 전부 사용하지 않으셔도 잔액은 반환되지 않습니다. 바우처는 다른 프로모션과 중복 적용할 수 없고 멤버십 카드 적립에도 사용할 수 없습니다. 사용 시 바우처는 훼손이나 지움, 찢김, 이어 붙인 자국이 없는 온전한 상태여야 합니다. 분실 또는 훼손된 바우처는 재발행되지 않습니다. 영수증 1장당 바우처 1장이 적용됩니다. 바우처는 현금 가치가 없으며 더 낮은 금액의 바우처로 교환할 수 없습니다. 서비스 금액이 바우처 금액보다 적은 경우 고객께서는 차액을 돌려받지 못하십니다.',
    '別段の合意がある場合または Royal Ha Long Hotel が別途ポリシーを定めている場合を除き、バウチャーをご利用のお客様は、一般条項、一般規定、バウチャーに記載のその他の条件、および／またはご利用時点で Royal Ha Long が発行した当該バウチャー種別に対応するサービス提供ポリシーを遵守いただく必要があります。原本のバウチャーはチェックイン時にご提示のうえご返却いただきます。ご利用条件を満たすバウチャーをご提示いただけない場合、お客様はチェックイン時に公表料金にて直接お支払いいただきます。バウチャーは現金その他のサービスへの交換はできず、1回限りのご利用で払い戻しはいたしません。バウチャーの金額を使い切らなかった場合でも差額の返金はいたしません。バウチャーは他のキャンペーンとの併用はできず、会員カードのポイント加算にもご利用いただけません。ご利用時のバウチャーは、消去、破れ、継ぎ接ぎのない完全な状態である必要があります。紛失または破損したバウチャーの再発行はいたしません。1請求書につきバウチャー1枚が適用されます。バウチャーに現金価値はなく、より少額のバウチャーへの交換もできません。サービスの金額がバウチャーの金額を下回る場合、お客様に差額は返金されません。',
    'เว้นแต่จะตกลงเป็นอย่างอื่นหรือ Royal Ha Long Hotel มีนโยบายอื่น ผู้เข้าพักที่ใช้วอชเชอร์ต้องปฏิบัติตามข้อกำหนดทั่วไป ระเบียบทั่วไป เงื่อนไขอื่นที่ระบุไว้บนวอชเชอร์ และ/หรือนโยบายการให้บริการที่สอดคล้องกับประเภทวอชเชอร์ที่ Royal Ha Long ออกให้ ณ เวลาที่ผู้เข้าพักใช้ ต้องแสดงวอชเชอร์ฉบับจริงและส่งคืน ณ เวลาเช็กอิน หากไม่สามารถแสดงวอชเชอร์ที่มีคุณสมบัติครบถ้วนได้ ผู้เข้าพักต้องชำระเงินโดยตรงตามราคาที่ประกาศ ณ เวลาเช็กอิน วอชเชอร์ไม่สามารถแลกเป็นเงินสดหรือบริการอื่น และใช้ได้เพียงครั้งเดียวโดยไม่คืนเงิน ไม่มีการทอนเงินหากใช้ไม่เต็มมูลค่าวอชเชอร์ วอชเชอร์ไม่สามารถใช้ร่วมกับรายการส่งเสริมการขายอื่น และไม่สามารถใช้สะสมคะแนนบัตรสมาชิก วอชเชอร์ที่นำมาใช้ต้องอยู่ในสภาพสมบูรณ์ ไม่มีรอยลบ ฉีกขาด หรือต่อปะ วอชเชอร์จะไม่ออกให้ใหม่ในกรณีสูญหายหรือชำรุด ใช้ได้ 1 วอชเชอร์ต่อ 1 ใบเสร็จ วอชเชอร์ไม่มีมูลค่าเป็นเงินสดและไม่สามารถแลกเป็นวอชเชอร์ที่มีมูลค่าน้อยกว่าได้ หากมูลค่าบริการต่ำกว่ามูลค่าวอชเชอร์ ผู้เข้าพักจะไม่ได้รับเงินส่วนต่างคืน',
  ),
]

const TERM_10_H = L(
  'QUY ĐỊNH CHUNG',
  'HOUSE RULES',
  '一般规定',
  '일반 규정',
  '一般規定',
  'ข้อกำหนดทั่วไป',
)

const TERM_10 = [
  L(
    '1. Khách hàng xuất trình một trong các giấy tờ pháp lý thể hiện thông tin về số định danh cá nhân theo quy định của pháp luật khi làm thủ tục đăng ký nhận phòng.',
    '1. Guests must present one of the legal documents showing their personal identification number, as required by law, when checking in.',
    '1. 办理入住登记时，宾客须按法律规定出示载有个人身份识别号码的法定证件之一。',
    '1. 체크인 수속 시 고객께서는 법령이 정하는 바에 따라 개인 식별번호가 기재된 법정 증명서 중 하나를 제시하셔야 합니다.',
    '1. チェックイン手続きの際、お客様は法令の定めにより、個人識別番号が記載された法定書類のいずれかをご提示ください。',
    '1. ผู้เข้าพักต้องแสดงเอกสารทางกฎหมายอย่างใดอย่างหนึ่งที่ระบุหมายเลขประจำตัวบุคคลตามที่กฎหมายกำหนด เมื่อทำการลงทะเบียนเช็กอิน',
  ),
  L(
    '1. Khách hàng không được mang vào khách sạn các loại vũ khí, chất phóng xạ, chất có độc tính, các chất gây cháy nổ, vật nuôi và những hàng cấm khác theo quy định của pháp luật hoặc của Chính quyền địa phương.',
    '1. Guests may not bring into the hotel any weapons, radioactive materials, toxic substances, flammable or explosive substances, pets, or other goods prohibited by law or by the local authorities.',
    '1. 宾客不得将武器、放射性物质、有毒物质、易燃易爆物品、宠物，以及法律或地方政府规定的其他违禁物品带入酒店。',
    '1. 고객께서는 무기, 방사성 물질, 독성 물질, 인화성·폭발성 물질, 반려동물, 그 밖에 법령이나 지방정부가 금지하는 물품을 호텔에 반입하실 수 없습니다.',
    '1. お客様は、武器、放射性物質、有毒物質、引火性・爆発性物質、ペット、その他法令または地方自治体が禁止する物品をホテル内に持ち込むことはできません。',
    '1. ผู้เข้าพักไม่ได้รับอนุญาตให้นำอาวุธ วัตถุกัมมันตรังสี สารมีพิษ สารไวไฟหรือระเบิด สัตว์เลี้ยง และสิ่งของต้องห้ามอื่น ๆ ตามที่กฎหมายหรือหน่วยงานท้องถิ่นกำหนด เข้ามาในโรงแรม',
  ),
  L(
    '1. Nghiêm cấm mọi hình thức cờ bạc, sử dụng ma túy, mại dâm trong khu vực Khách sạn. Trong trường hợp vi phạm thì Khách hàng phải hoàn toàn chịu trách nhiệm trước pháp luật Việt Nam và Khách sạn.',
    '1. All forms of gambling, drug use and prostitution are strictly prohibited within the Hotel. In the event of a breach, the guest bears full responsibility before Vietnamese law and before the Hotel.',
    '1. 酒店区域内严禁一切形式的赌博、吸毒与卖淫嫖娼。如有违反，宾客须对越南法律及酒店承担全部责任。',
    '1. 호텔 구역 내에서는 모든 형태의 도박, 마약 사용, 성매매를 엄격히 금지합니다. 위반 시 고객께서는 베트남 법률과 호텔에 대하여 전적인 책임을 지셔야 합니다.',
    '1. ホテル敷地内でのあらゆる形態の賭博、薬物使用、売買春を厳に禁じます。違反があった場合、お客様はベトナムの法律およびホテルに対して全責任を負うものとします。',
    '1. ห้ามการพนันทุกรูปแบบ การใช้ยาเสพติด และการค้าประเวณีภายในบริเวณโรงแรมโดยเด็ดขาด หากฝ่าฝืน ผู้เข้าพักต้องรับผิดชอบอย่างเต็มที่ต่อกฎหมายเวียดนามและต่อโรงแรม',
  ),
  L(
    '1. Khách hàng không hút thuốc trong phòng và các khu vực công cộng ngoại trừ khu vực hút thuốc.',
    '1. Guests must not smoke in the rooms or in public areas, except in the designated smoking area.',
    '1. 除吸烟区外，宾客不得在客房及公共区域吸烟。',
    '1. 고객께서는 지정된 흡연 구역을 제외하고 객실 및 공공 구역에서 흡연하실 수 없습니다.',
    '1. 喫煙所を除き、客室および公共エリアでの喫煙はご遠慮ください。',
    '1. ผู้เข้าพักไม่สูบบุหรี่ในห้องพักและพื้นที่สาธารณะ ยกเว้นในเขตสูบบุหรี่ที่กำหนด',
  ),
  L(
    '1. Khi nhận phòng khách hàng vui lòng kiểm tra số lượng và tình trạng tài sản hiện có ở trong phòng theo “Danh mục tài sản trong phòng khách”. Nếu không đủ hoặc trong tình trạng hỏng hóc thì quý khách vui lòng báo ngay cho Lễ tân, đồng thời sẽ chịu hoàn toàn trách nhiệm với mất mát, hư hỏng nếu có xảy ra trong quá trình lưu trú.',
    '1. On checking in, please check the quantity and condition of the items in the room against the “Inventory of items in the guest room”. If anything is missing or damaged, please inform reception at once; the guest is otherwise fully responsible for any loss or damage occurring during the stay.',
    '1. 办理入住时，请按《客房物品清单》核对房内物品的数量与状况。如有短缺或损坏，请立即通知前台；否则宾客须对入住期间发生的遗失或损坏承担全部责任。',
    '1. 체크인 시 “객실 비품 목록”에 따라 객실 내 물품의 수량과 상태를 확인해 주시기 바랍니다. 부족하거나 파손된 것이 있으면 즉시 프런트에 알려 주시고, 그렇지 않을 경우 투숙 기간 중 발생하는 분실이나 파손에 대해 고객께서 전적으로 책임지시게 됩니다.',
    '1. チェックインの際は、「客室備品リスト」に従って室内の備品の数量と状態をご確認ください。不足や破損がある場合はただちにフロントへお知らせください。お知らせがない場合、ご滞在中に生じた紛失・破損についてはお客様が全責任を負われます。',
    '1. เมื่อเช็กอิน กรุณาตรวจสอบจำนวนและสภาพของทรัพย์สินที่มีอยู่ในห้องตาม “รายการทรัพย์สินในห้องพัก” หากไม่ครบหรืออยู่ในสภาพชำรุด กรุณาแจ้งพนักงานต้อนรับทันที มิฉะนั้นผู้เข้าพักจะต้องรับผิดชอบอย่างเต็มที่ต่อการสูญหายหรือเสียหายที่เกิดขึ้นระหว่างการเข้าพัก',
  ),
  L(
    '1. Tài sản có giá trị như đồ trang sức, tiền và các thiết bị điện tử cá nhân phải được cất giữ trong két sắt tại phòng. Khách sạn không có trách nhiệm pháp lý đối với những mất mát hay hư hại về tài sản cá nhân của Khách hàng trong trường hợp Khách hàng không thực hiện theo quy định.',
    '1. Valuables such as jewellery, cash and personal electronic devices must be kept in the in-room safe. The Hotel accepts no legal liability for loss of or damage to a guest’s personal property where the guest has not followed this rule.',
    '1. 珠宝首饰、现金及个人电子设备等贵重物品须存放于客房保险箱内。宾客未遵守本规定的，酒店对其个人财物的遗失或损坏不承担法律责任。',
    '1. 귀금속, 현금, 개인 전자기기 등 귀중품은 객실 내 금고에 보관하셔야 합니다. 고객께서 이 규정을 따르지 않으신 경우, 호텔은 고객의 개인 물품의 분실이나 훼손에 대하여 법적 책임을 지지 않습니다.',
    '1. 貴金属、現金、個人用電子機器などの貴重品は、客室内のセーフティボックスに保管してください。お客様がこの規定に従われなかった場合、ホテルはお客様の私物の紛失・破損について法的責任を負いません。',
    '1. ทรัพย์สินมีค่า เช่น เครื่องประดับ เงินสด และอุปกรณ์อิเล็กทรอนิกส์ส่วนตัว ต้องเก็บไว้ในตู้นิรภัยภายในห้องพัก โรงแรมไม่รับผิดตามกฎหมายต่อการสูญหายหรือเสียหายของทรัพย์สินส่วนตัวของผู้เข้าพัก ในกรณีที่ผู้เข้าพักไม่ปฏิบัติตามข้อกำหนดนี้',
  ),
  L(
    '1. Đảm bảo người thân đến thăm khách hàng tại khách sạn phải đăng ký tại quầy Lễ tân và tuân thủ nội quy của khách sạn.',
    '1. Please ensure that relatives visiting you at the hotel register at reception and comply with the hotel’s house rules.',
    '1. 请确保来酒店探访的亲友在前台登记，并遵守酒店内部规定。',
    '1. 호텔로 고객을 방문하는 가족·지인은 반드시 프런트에 등록하고 호텔 내규를 준수하도록 해 주시기 바랍니다.',
    '1. ホテルにお客様をお訪ねになるご家族・ご知人は、必ずフロントでご登録のうえ、ホテルの館内規則をお守りいただくようご配慮ください。',
    '1. กรุณาดูแลให้ญาติหรือผู้มาเยี่ยมผู้เข้าพักที่โรงแรมลงทะเบียนที่เคาน์เตอร์ต้อนรับและปฏิบัติตามระเบียบของโรงแรม',
  ),
  L(
    '1. Khách hàng không sử dụng phòng ngủ cho các mục đích khác như văn phòng giao dịch.',
    '1. Guests must not use the bedroom for other purposes, such as a business office.',
    '1. 宾客不得将客房用作交易办公场所等其他用途。',
    '1. 고객께서는 객실을 사무실 등 다른 용도로 사용하실 수 없습니다.',
    '1. お客様は、客室を商談用オフィスなど他の目的でご使用になれません。',
    '1. ผู้เข้าพักต้องไม่ใช้ห้องนอนเพื่อวัตถุประสงค์อื่น เช่น เป็นสำนักงานทำธุรกรรม',
  ),
  L(
    '1. Vì lý do an ninh, khách hàng không được tự ý đổi phòng hoặc di chuyển trang thiết bị, đồ đạc trong phòng sang phòng khác mà không thông báo cho quầy lễ tân.',
    '1. For security reasons, guests may not change rooms on their own initiative, or move equipment and furnishings from one room to another, without informing reception.',
    '1. 出于安全考虑，宾客不得未经通知前台自行换房，或将房内设备、物品移至其他房间。',
    '1. 보안상의 이유로 고객께서는 프런트에 알리지 않고 임의로 객실을 바꾸시거나 객실 내 설비·비품을 다른 객실로 옮기실 수 없습니다.',
    '1. 保安上の理由により、お客様はフロントにお知らせなく勝手にお部屋を変更されたり、客室内の設備・備品を他のお部屋へ移動されたりすることはできません。',
    '1. ด้วยเหตุผลด้านความปลอดภัย ผู้เข้าพักไม่สามารถเปลี่ยนห้องเองหรือเคลื่อนย้ายอุปกรณ์และเครื่องเรือนในห้องไปยังห้องอื่นโดยไม่แจ้งเคาน์เตอร์ต้อนรับ',
  ),
  L(
    '1. Khách hàng thanh toán toàn bộ các hóa đơn và trả chìa khóa phòng cho lễ tân trước khi rời khách sạn.',
    '1. Guests must settle all bills and return the room key to reception before leaving the hotel.',
    '1. 宾客离店前须结清全部账单并将房卡交还前台。',
    '1. 고객께서는 호텔을 떠나시기 전에 모든 요금을 정산하시고 객실 열쇠를 프런트에 반납해 주셔야 합니다.',
    '1. お客様は、ご出発前にすべてのご精算を済ませ、ルームキーをフロントにご返却ください。',
    '1. ผู้เข้าพักต้องชำระค่าใช้จ่ายทั้งหมดและคืนกุญแจห้องให้พนักงานต้อนรับก่อนออกจากโรงแรม',
  ),
  L(
    '1. Khách hàng tuân thủ các quy định của Nhà nước và của Khách sạn về đảm bảo an toàn phòng, chống dịch bệnh.',
    '1. Guests must comply with state and Hotel regulations on safety and on the prevention and control of epidemics.',
    '1. 宾客须遵守国家与酒店关于安全保障及疫病防控的各项规定。',
    '1. 고객께서는 안전 확보 및 감염병 예방·방역에 관한 국가 및 호텔의 규정을 준수하셔야 합니다.',
    '1. お客様は、安全確保および感染症の予防・防疫に関する国および ホテルの規定を遵守してください。',
    '1. ผู้เข้าพักต้องปฏิบัติตามข้อกำหนดของรัฐและของโรงแรมเกี่ยวกับการรักษาความปลอดภัยและการป้องกันควบคุมโรคระบาด',
  ),
  L(
    '1. Tuân thủ quy định về an toàn khi đang ở trên xe di chuyển trong khu vực Khách Sạn.',
    '1. Observe the safety rules while travelling in a vehicle within the Hotel grounds.',
    '1. 在酒店区域内乘车移动时，须遵守安全规定。',
    '1. 호텔 부지 내에서 차량으로 이동하실 때에는 안전 규정을 지켜 주시기 바랍니다.',
    '1. ホテル敷地内を車両で移動される際は、安全に関する規定をお守りください。',
    '1. ปฏิบัติตามข้อกำหนดด้านความปลอดภัยขณะโดยสารยานพาหนะภายในบริเวณโรงแรม',
  ),
  L(
    '1. Cư xử đúng mực tại nơi công cộng: Tôn trọng nguyên tắc đến trước được phục vụ trước; Ưu tiên phụ nữ mang thai, người khuyết tật, người già, yếu; Không gây ồn ào, la hét; Không đặt chân hay gác chân trên ghế và không làm những hành động thiếu văn hóa khác ở những khu vực công cộng; Quản lý trẻ em tại khu vực công cộng.',
    '1. Behave appropriately in public areas: respect the first-come, first-served principle; give priority to pregnant women, people with disabilities and elderly or frail guests; do not make noise or shout; do not put your feet on the seats or behave in other uncivil ways in public areas; supervise children in public areas.',
    '1. 在公共场所举止得体：遵守先到先served的先后次序；礼让孕妇、残障人士、老弱人士；不喧哗吵闹；不将脚放置或搁在座椅上，不在公共区域做出其他不文明举动；在公共区域看管好儿童。',
    '1. 공공 구역에서는 예의를 지켜 주십시오. 선착순 원칙을 존중하고, 임산부·장애인·노약자를 배려하며, 소란을 피우거나 큰 소리를 내지 마시고, 의자에 발을 올리거나 걸치는 등 공공 구역에서 무례한 행동을 삼가시며, 어린이를 잘 돌봐 주시기 바랍니다.',
    '1. 公共エリアでは節度あるお振る舞いをお願いいたします。先着順の原則を尊重し、妊婦の方、障がいのある方、ご高齢・お体の弱い方を優先し、騒いだり大声を出したりせず、椅子に足を乗せる・掛けるなど公共エリアでの無作法な行為はお控えいただき、お子様の見守りをお願いいたします。',
    '1. ประพฤติตนอย่างเหมาะสมในพื้นที่สาธารณะ: เคารพหลักมาก่อนได้รับบริการก่อน ให้ความสำคัญแก่สตรีมีครรภ์ ผู้พิการ ผู้สูงอายุและผู้อ่อนแอ ไม่ส่งเสียงดังหรือตะโกน ไม่วางเท้าหรือพาดเท้าบนเก้าอี้ และไม่กระทำการอันไม่สุภาพอื่น ๆ ในพื้นที่สาธารณะ ตลอดจนดูแลเด็กในพื้นที่สาธารณะ',
  ),
  L(
    '1. Khi ra khỏi phòng, Khách cần đảm bảo (i) tất cả các thiết bị điện đã được trả về nguyên trạng; (ii) cửa phòng đã được khóa an toàn; và (iii) không đưa chìa khóa phòng cho người khác.',
    '1. On leaving the room, the guest must ensure that (i) all electrical equipment has been returned to its original state; (ii) the room door is securely locked; and (iii) the room key is not given to anyone else.',
    '1. 离开房间时，宾客须确保：（i）所有电器设备已恢复原状；（ii）房门已安全锁好；（iii）不将房卡交予他人。',
    '1. 객실을 나가실 때 고객께서는 (i) 모든 전기 기기를 원래 상태로 되돌리고, (ii) 객실 문을 안전하게 잠그며, (iii) 객실 열쇠를 타인에게 건네지 않도록 하셔야 합니다.',
    '1. 客室を出られる際、お客様は (i) すべての電気機器を元の状態に戻し、(ii) 客室のドアを確実に施錠し、(iii) ルームキーを他人にお渡しにならないようご確認ください。',
    '1. เมื่อออกจากห้องพัก ผู้เข้าพักต้องตรวจสอบให้แน่ใจว่า (i) อุปกรณ์ไฟฟ้าทั้งหมดกลับสู่สภาพเดิม (ii) ประตูห้องพักถูกล็อกอย่างปลอดภัย และ (iii) ไม่มอบกุญแจห้องให้ผู้อื่น',
  ),
  L(
    '1. Khách hàng không được phép nấu ăn trong phòng, tuyệt đối tuân thủ các quy định của Khách Sạn về sử dụng các thiết bị điện đúng mục đích.',
    '1. Guests are not permitted to cook in the room and must strictly observe the Hotel’s rules on using electrical equipment for its intended purpose.',
    '1. 宾客不得在客房内烹饪，须严格遵守酒店关于按用途使用电器设备的规定。',
    '1. 고객께서는 객실 내에서 취사하실 수 없으며, 전기 기기를 본래 용도로 사용하는 것에 관한 호텔 규정을 철저히 준수하셔야 합니다.',
    '1. 客室内での調理はご遠慮いただき、電気機器を本来の用途で使用することに関するホテルの規定を厳守してください。',
    '1. ผู้เข้าพักไม่ได้รับอนุญาตให้ประกอบอาหารในห้องพัก และต้องปฏิบัติตามข้อกำหนดของโรงแรมเรื่องการใช้อุปกรณ์ไฟฟ้าให้ตรงตามวัตถุประสงค์อย่างเคร่งครัด',
  ),
  L(
    '1. Không mang các loại thức ăn, đồ uống, trái cây, thực phẩm nặng mùi (sầu riêng, mít, các loại mắm…) vào trong phòng Khách Sạn.',
    '1. Do not bring strong-smelling food, drinks or fruit (durian, jackfruit, fermented fish sauces and the like) into the Hotel rooms.',
    '1. 请勿将气味浓烈的食品、饮料、水果（榴莲、菠萝蜜、各类鱼露虾酱等）带入酒店客房。',
    '1. 냄새가 강한 음식, 음료, 과일(두리안, 잭프루트, 각종 젓갈류 등)을 호텔 객실에 반입하지 말아 주십시오.',
    '1. においの強い食べ物、飲み物、果物（ドリアン、ジャックフルーツ、各種の魚醤・塩辛など）を客室にお持ち込みにならないでください。',
    '1. ห้ามนำอาหาร เครื่องดื่ม ผลไม้ และอาหารที่มีกลิ่นแรง (ทุเรียน ขนุน น้ำปลาร้าหรือของหมักดองต่าง ๆ) เข้ามาในห้องพักของโรงแรม',
  ),
  L(
    '1. Quý khách vui lòng tuân thủ thời gian hoạt động của hồ bơi tại cơ sở (có thể có thay đổi phụ thuộc vào tính chất của thời tiết, mùa trong năm). Khách hàng sử dụng hồ bơi trước và sau thời gian hoạt động (các cơ sở khác nhau có thể có thời gian đóng cửa/mở cửa khác nhau tùy thuộc vào địa lý/mùa) phải tự đảm bảo và chịu trách nhiệm đối với an toàn sức khỏe, tính mạng của bản thân mà không có bất cứ khiếu nại nào đối với Khách Sạn.',
    '1. Please observe the opening hours of the swimming pool at the property (these may change depending on the weather and the season). Guests who use the pool before or after opening hours (different properties may have different opening and closing times depending on location and season) do so entirely at their own risk and are responsible for their own health and safety, with no claim of any kind against the Hotel.',
    '1. 请遵守本酒店泳池的开放时间（可能因天气状况与季节而调整）。在开放时间之前或之后使用泳池的宾客（不同场所的开闭时间可能因地理位置／季节而异），须自行确保并承担自身健康与生命安全的责任，且不得向酒店提出任何索赔。',
    '1. 시설 내 수영장의 운영 시간을 지켜 주시기 바랍니다(날씨와 계절에 따라 변경될 수 있습니다). 운영 시간 전후에 수영장을 이용하시는 고객께서는(시설마다 지리적 조건과 계절에 따라 개장·폐장 시간이 다를 수 있습니다) 본인의 건강과 생명 안전을 스스로 책임지셔야 하며, 호텔에 대하여 어떠한 청구도 하실 수 없습니다.',
    '1. 施設内プールの営業時間をお守りください（天候や季節により変更となる場合があります）。営業時間の前後にプールをご利用になるお客様は（施設ごとに立地や季節により開場・閉場時間が異なる場合があります）、ご自身の健康と生命の安全について自己責任を負うものとし、ホテルに対していかなる請求も行えません。',
    '1. กรุณาปฏิบัติตามเวลาทำการของสระว่ายน้ำภายในสถานที่ (อาจเปลี่ยนแปลงตามสภาพอากาศและฤดูกาล) ผู้เข้าพักที่ใช้สระว่ายน้ำก่อนหรือหลังเวลาทำการ (แต่ละสถานที่อาจมีเวลาเปิด/ปิดต่างกันตามภูมิประเทศ/ฤดูกาล) ต้องรับผิดชอบต่อความปลอดภัยด้านสุขภาพและชีวิตของตนเอง โดยไม่สามารถเรียกร้องใด ๆ ต่อโรงแรมได้',
  ),
  L(
    '1. Khách vui lòng mặc trang phục phù hợp khi ở trong khu vực chung của Khách Sạn, đặc biệt ở những khu vực công cộng như tiền sảnh, nhà hàng…để thể hiện sự tôn trọng đối với các nền văn hoá khác, Khách tuyệt đối không ở trong tình trạng khoả thân, kể cả trẻ em.',
    '1. Please dress appropriately in the shared areas of the Hotel, particularly in public areas such as the lobby and the restaurants, out of respect for other cultures. Guests must never be nude, including children.',
    '1. 在酒店公共区域，尤其是大堂、餐厅等公共场所，请着装得体，以示对不同文化的尊重。宾客（包括儿童）绝不可赤身裸体。',
    '1. 다른 문화에 대한 존중의 뜻으로, 호텔 공용 구역, 특히 로비와 레스토랑 등 공공 장소에서는 적절한 복장을 착용해 주시기 바랍니다. 어린이를 포함하여 고객께서는 절대로 나체 상태로 계셔서는 안 됩니다.',
    '1. 他の文化への敬意を示すため、ホテルの共用エリア、とりわけロビーやレストランなどの公共の場では、ふさわしい服装をお願いいたします。お子様を含め、裸体でのご滞在は固くお断りいたします。',
    '1. กรุณาแต่งกายให้เหมาะสมเมื่ออยู่ในพื้นที่ส่วนกลางของโรงแรม โดยเฉพาะพื้นที่สาธารณะ เช่น ล็อบบี้ ห้องอาหาร เพื่อแสดงความเคารพต่อวัฒนธรรมอื่น ผู้เข้าพักต้องไม่อยู่ในสภาพเปลือยกายโดยเด็ดขาด รวมถึงเด็กด้วย',
  ),
  L(
    '1. Thực hiện các thủ tục khác theo quy định của Royal Hạ Long và cơ quan chức năng quản lý lưu trú tại địa phương tại từng thời điểm (nếu có).',
    '1. Complete any other formalities required from time to time by Royal Ha Long and by the local authorities responsible for accommodation management (if any).',
    '1. 按 Royal Ha Long 及当地住宿管理主管机关不时规定，办理其他手续（如有）。',
    '1. Royal Ha Long 및 지역 숙박 관리 당국이 수시로 정하는 그 밖의 절차(있는 경우)를 이행해 주시기 바랍니다.',
    '1. Royal Ha Long および地域の宿泊管理当局が随時定めるその他の手続き（ある場合）を行ってください。',
    '1. ดำเนินการตามขั้นตอนอื่น ๆ ตามที่ Royal Ha Long และหน่วยงานกำกับดูแลที่พักในท้องถิ่นกำหนดในแต่ละช่วงเวลา (ถ้ามี)',
  ),
  L(
    '1. Ban quản lý Khách Sạn có thể yêu cầu Khách hàng phải rời Khách Sạn mà không hoàn trả bất cứ chi phí nào đối với những Quý Khách cố tình bỏ qua và vi phạm những quy định và nội quy của Khách Sạn.',
    '1. The Hotel management may require a guest to leave the Hotel, without any refund, where that guest deliberately disregards and breaches the Hotel’s rules and regulations.',
    '1. 对于故意无视并违反酒店规定与内部规章的宾客，酒店管理层可要求其离店，且不退还任何费用。',
    '1. 호텔의 규정과 내규를 고의로 무시하고 위반하는 고객에 대하여, 호텔 경영진은 어떠한 비용도 환불하지 않고 퇴실을 요구할 수 있습니다.',
    '1. ホテルの規定および館内規則を故意に無視・違反されるお客様に対し、ホテル経営陣は費用を一切返金することなくご退去を求める場合があります。',
    '1. ฝ่ายบริหารโรงแรมอาจขอให้ผู้เข้าพักออกจากโรงแรมโดยไม่คืนค่าใช้จ่ายใด ๆ สำหรับผู้เข้าพักที่จงใจเพิกเฉยและฝ่าฝืนข้อกำหนดและระเบียบของโรงแรม',
  ),
  L(
    '1. Quy định tiếng ồn: sau 22:00 giờ Khách hàng không được mở tivi, nhạc bằng loa có âm lượng quá lớn hoặc nói chuyện quá lớn để đảm bảo trật tự chung. Tiếng ồn sẽ bị coi là quá mức khi các Khách hàng của Khách sạn cảm thấy phiền hoặc khó chịu.',
    '1. Noise rule: after 22:00, guests must not play the television or music through speakers at excessive volume, or speak too loudly, so that general order is preserved. Noise is regarded as excessive when other guests of the Hotel find it disturbing or unpleasant.',
    '1. 噪音规定：22:00 之后，宾客不得以过大音量播放电视、音乐，或大声交谈，以维护公共秩序。当酒店其他宾客感到受扰或不适时，即视为噪音过度。',
    '1. 소음 규정: 공공 질서 유지를 위해 22:00 이후에는 텔레비전이나 스피커를 통한 음악을 지나치게 큰 음량으로 틀거나 큰 소리로 대화하셔서는 안 됩니다. 호텔의 다른 고객이 방해되거나 불쾌하다고 느끼는 경우 소음이 과도한 것으로 봅니다.',
    '1. 騒音に関する規定：公共の秩序を保つため、22:00 以降はテレビやスピーカーによる音楽を過度な音量で流したり、大声で会話をされたりしないでください。ホテルの他のお客様が迷惑または不快に感じられる場合、騒音は過度であるとみなされます。',
    '1. ข้อกำหนดเรื่องเสียงรบกวน: หลังเวลา 22:00 น. ผู้เข้าพักต้องไม่เปิดโทรทัศน์หรือเพลงผ่านลำโพงด้วยระดับเสียงที่ดังเกินไป หรือพูดคุยเสียงดังเกินควร เพื่อรักษาความสงบเรียบร้อยโดยรวม เสียงจะถือว่าดังเกินไปเมื่อผู้เข้าพักท่านอื่นของโรงแรมรู้สึกถูกรบกวนหรือไม่สบายใจ',
  ),
  L(
    '1. Thực hiện các thủ tục khác theo quy định của Royal Hạ Long tại từng thời điểm (nếu có).',
    '1. Complete any other formalities required from time to time by Royal Ha Long (if any).',
    '1. 按 Royal Ha Long 不时规定办理其他手续（如有）。',
    '1. Royal Ha Long이 수시로 정하는 그 밖의 절차(있는 경우)를 이행해 주시기 바랍니다.',
    '1. Royal Ha Long が随時定めるその他の手続き（ある場合）を行ってください。',
    '1. ดำเนินการตามขั้นตอนอื่น ๆ ตามที่ Royal Ha Long กำหนดในแต่ละช่วงเวลา (ถ้ามี)',
  ),
  L(
    '1. Riêng đối với dịch vụ **Vui chơi có thưởng (Casino)** Khách hàng phải đáp ứng các điều kiện: Có **quốc tịch nước ngoài** và trên **18 tuổi**.',
    '1. For the **prize-winning entertainment (Casino)** service specifically, guests must meet the following conditions: hold **foreign nationality** and be over **18 years of age**.',
    '1. 对于 **有奖娱乐（娱乐场／Casino）** 服务，宾客须满足以下条件：持 **外国国籍** 且年满 **18 周岁以上**。',
    '1. 특히 **상금이 걸린 오락(카지노)** 서비스의 경우, 고객께서는 **외국 국적**을 보유하고 **만 18세** 이상이어야 한다는 조건을 충족하셔야 합니다.',
    '1. **賞金の出る娯楽（カジノ）** のサービスについては、お客様は **外国籍** であり、**18歳** を超えていることが条件となります。',
    '1. เฉพาะบริการ **สถานบันเทิงที่มีรางวัล (คาสิโน)** ผู้เข้าพักต้องมีคุณสมบัติดังนี้: ถือ **สัญชาติต่างชาติ** และมีอายุเกิน **18 ปี**',
  ),
]

const TERM_SEO = seo(
  L(
    'Điều khoản và điều kiện — Royal Hạ Long Hotel',
    'Terms and conditions — Royal Ha Long Hotel',
    '条款与条件 — Royal Ha Long Hotel',
    '이용약관 — Royal Ha Long Hotel',
    '利用規約 — Royal Ha Long Hotel',
    'ข้อกำหนดและเงื่อนไข — Royal Ha Long Hotel',
  ),
  L(
    'Điều khoản đặt phòng tại Royal Hạ Long Hotel: giờ nhận/trả phòng, chính sách trẻ em và giường phụ, mùa du lịch, chính sách hủy, voucher và quy định chung.',
    'Booking terms at Royal Ha Long Hotel: check-in and check-out times, children and extra bed policy, travel seasons, cancellation policy, vouchers and house rules.',
    'Royal Ha Long Hotel 的预订条款：入住与退房时间、儿童与加床政策、旅游季节、取消政策、礼券及一般规定。',
    'Royal Ha Long Hotel 예약 약관 — 체크인·체크아웃 시간, 어린이 및 엑스트라 베드 정책, 시즌 구분, 취소 정책, 바우처, 일반 규정.',
    'Royal Ha Long Hotel のご予約規約 — チェックイン・チェックアウト時間、お子様とエキストラベッド、シーズン区分、キャンセルポリシー、バウチャー、館内規定。',
    'ข้อกำหนดการจองกับ Royal Ha Long Hotel: เวลาเช็กอิน/เช็กเอาต์ นโยบายสำหรับเด็กและเตียงเสริม ฤดูกาลท่องเที่ยว นโยบายการยกเลิก วอชเชอร์ และข้อกำหนดทั่วไป',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  post.canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel
 *
 *  Bài quan trọng nhất trong nhóm: cảnh báo fanpage giả mạo. Khách nước
 *  ngoài chính là người dễ bị lừa nhất, nên bản dịch phải giữ ĐÚNG địa chỉ,
 *  số tài khoản, số điện thoại, email — không chuyển ngữ, không viết tắt,
 *  không "làm gọn".
 * ══════════════════════════════════════════════════════════════════ */

const FB_URL = 'https://www.facebook.com/royalhalonghotelandvillas'

const POST_FB_TITLE = L(
  'CẢNH BÁO TRANG FACEBOOK GIẢ MẠO KHÁCH SẠN ROYAL HALONG HOTEL',
  'WARNING: FAKE FACEBOOK PAGES IMPERSONATING ROYAL HALONG HOTEL',
  '警告：冒充 ROYAL HALONG HOTEL 的虚假 FACEBOOK 页面',
  '경고: ROYAL HALONG HOTEL을 사칭하는 가짜 페이스북 페이지',
  '【注意喚起】ROYAL HALONG HOTEL をかたる偽 Facebook ページにご注意ください',
  'คำเตือน: เพจเฟซบุ๊กปลอมที่แอบอ้างเป็น ROYAL HALONG HOTEL',
)

const POST_FB_EXCERPT = L(
  'Hiện nay, có một số trang Facebook mạo danh fanpage chính thức của khách sạn, sử dụng trái phép tên thương hiệu, nội dung và hình ảnh nhằm gây nhầm lẫn cho khách hàng và đối tác.',
  'A number of Facebook pages are currently impersonating the hotel’s official page, using our brand name, content and images without permission in order to mislead guests and partners.',
  '目前有若干 Facebook 页面冒充本酒店官方专页，未经许可使用本品牌名称、内容与图片，误导客户与合作伙伴。',
  '현재 일부 페이스북 페이지가 호텔의 공식 페이지를 사칭하여 브랜드명과 콘텐츠, 이미지를 무단으로 사용하며 고객과 파트너를 혼란에 빠뜨리고 있습니다.',
  '現在、当ホテルの公式ページをかたる Facebook ページが複数存在し、ブランド名・コンテンツ・画像を無断で使用して、お客様やお取引先を誤解させています。',
  'ขณะนี้มีเพจเฟซบุ๊กหลายเพจแอบอ้างเป็นเพจทางการของโรงแรม โดยนำชื่อแบรนด์ เนื้อหา และภาพไปใช้โดยไม่ได้รับอนุญาต เพื่อทำให้ลูกค้าและคู่ค้าเข้าใจผิด',
)

const POST_FB_ALT = L(
  'Ảnh chụp màn hình fanpage chính thức “Royal Ha Long Hotel & Villas” trên Facebook, kèm dòng chữ khẳng định đây là fanpage duy nhất và email đặt phòng info@royalhalonghotel.com',
  'Screenshot of the official Facebook page “Royal Ha Long Hotel & Villas”, captioned to confirm it is the only official page and that bookings are confirmed from info@royalhalonghotel.com',
  '官方 Facebook 专页“Royal Ha Long Hotel & Villas”的截图，附注说明这是唯一官方专页，订房确认邮箱为 info@royalhalonghotel.com',
  '공식 페이스북 페이지 “Royal Ha Long Hotel & Villas” 화면 캡처. 이것이 유일한 공식 페이지이며 예약 확인 이메일은 info@royalhalonghotel.com임을 알리는 문구가 함께 표시되어 있음',
  '公式 Facebook ページ「Royal Ha Long Hotel & Villas」のスクリーンショット。唯一の公式ページであること、予約確認メールは info@royalhalonghotel.com であることを示す文言つき',
  'ภาพหน้าจอเพจเฟซบุ๊กทางการ “Royal Ha Long Hotel & Villas” พร้อมข้อความยืนยันว่านี่คือเพจทางการเพียงเพจเดียว และอีเมลยืนยันการจองคือ info@royalhalonghotel.com',
)

const POST_FB_BODY = [
  L(
    'Hiện nay, có một số trang Facebook mạo danh fanpage chính thức của khách sạn, sử dụng trái phép tên thương hiệu, nội dung và hình ảnh nhằm gây nhầm lẫn cho khách hàng và đối tác.',
    'A number of Facebook pages are currently impersonating the hotel’s official page, using our brand name, content and images without permission in order to mislead guests and partners.',
    '目前有若干 Facebook 页面冒充本酒店官方专页，未经许可使用本品牌名称、内容与图片，误导客户与合作伙伴。',
    '현재 일부 페이스북 페이지가 호텔의 공식 페이지를 사칭하여 브랜드명과 콘텐츠, 이미지를 무단으로 사용하며 고객과 파트너를 혼란에 빠뜨리고 있습니다.',
    '現在、当ホテルの公式ページをかたる Facebook ページが複数存在し、ブランド名・コンテンツ・画像を無断で使用して、お客様やお取引先を誤解させています。',
    'ขณะนี้มีเพจเฟซบุ๊กหลายเพจแอบอ้างเป็นเพจทางการของโรงแรม โดยนำชื่อแบรนด์ เนื้อหา และภาพไปใช้โดยไม่ได้รับอนุญาต เพื่อทำให้ลูกค้าและคู่ค้าเข้าใจผิด',
  ),
  L(
    'Để đảm bảo quyền lợi và an toàn giao dịch, Royal Halong Hotel & Villas chỉ xác nhận thông tin khi hội đủ tất cả các yếu tố sau:',
    'To protect your interests and the safety of your transaction, Royal Halong Hotel & Villas confirms information only when all of the following conditions are met:',
    '为保障您的权益与交易安全，Royal Halong Hotel & Villas 仅在同时满足以下全部条件时才确认信息：',
    '고객의 권익과 거래 안전을 위하여 Royal Halong Hotel & Villas는 다음 조건을 모두 충족하는 경우에만 정보를 확인해 드립니다.',
    'お客様の権利と取引の安全を守るため、Royal Halong Hotel & Villas は次のすべての条件を満たす場合にのみ情報を確認いたします。',
    'เพื่อคุ้มครองสิทธิประโยชน์และความปลอดภัยในการทำธุรกรรม Royal Halong Hotel & Villas จะยืนยันข้อมูลก็ต่อเมื่อครบองค์ประกอบทั้งหมดต่อไปนี้เท่านั้น',
  ),
  L(
    '**KÊNH CHÍNH THỨC DUY NHẤT CỦA KHÁCH SẠN:**',
    '**THE HOTEL’S ONLY OFFICIAL CHANNELS:**',
    '**本酒店唯一官方渠道：**',
    '**호텔의 유일한 공식 채널:**',
    '**当ホテルの唯一の公式チャネル：**',
    '**ช่องทางทางการเพียงช่องทางเดียวของโรงแรม:**',
  ),
  L(
    `- Fanpage: [${FB_URL}](${FB_URL})`,
    `- Facebook page: [${FB_URL}](${FB_URL})`,
    `- Facebook 专页：[${FB_URL}](${FB_URL})`,
    `- 페이스북 페이지: [${FB_URL}](${FB_URL})`,
    `- Facebook ページ：[${FB_URL}](${FB_URL})`,
    `- เพจเฟซบุ๊ก: [${FB_URL}](${FB_URL})`,
  ),
  L(
    '- Website: https://royalhalonghotel.com',
    '- Website: https://royalhalonghotel.com',
    '- 网站：https://royalhalonghotel.com',
    '- 웹사이트: https://royalhalonghotel.com',
    '- ウェブサイト：https://royalhalonghotel.com',
    '- เว็บไซต์: https://royalhalonghotel.com',
  ),
  L(
    '- Hotline: +84 203 3848 777 | 0904 030 222',
    '- Hotline: +84 203 3848 777 | 0904 030 222',
    '- 热线：+84 203 3848 777 | 0904 030 222',
    '- 대표 전화: +84 203 3848 777 | 0904 030 222',
    '- ホットライン：+84 203 3848 777 | 0904 030 222',
    '- สายด่วน: +84 203 3848 777 | 0904 030 222',
  ),
  L(
    '- Email xác nhận đặt phòng duy nhất: info@royalhalonghotel.com',
    '- The only email address that confirms bookings: info@royalhalonghotel.com',
    '- 唯一的订房确认邮箱：info@royalhalonghotel.com',
    '- 예약을 확인해 드리는 유일한 이메일 주소: info@royalhalonghotel.com',
    '- ご予約の確認を行う唯一のメールアドレス：info@royalhalonghotel.com',
    '- อีเมลยืนยันการจองเพียงที่อยู่เดียว: info@royalhalonghotel.com',
  ),
  L(
    '- Thông tin chuyển khoản chính thức:',
    '- Official bank transfer details:',
    '- 官方转账信息：',
    '- 공식 계좌 이체 정보:',
    '- 公式の振込先情報：',
    '- ข้อมูลการโอนเงินอย่างเป็นทางการ:',
  ),
  L(
    '- Tên tài khoản: Công ty Cổ phần Quốc tế Hoàng Gia',
    '- Account name: Công ty Cổ phần Quốc tế Hoàng Gia',
    '- 账户名称：Công ty Cổ phần Quốc tế Hoàng Gia',
    '- 예금주: Công ty Cổ phần Quốc tế Hoàng Gia',
    '- 口座名義：Công ty Cổ phần Quốc tế Hoàng Gia',
    '- ชื่อบัญชี: Công ty Cổ phần Quốc tế Hoàng Gia',
  ),
  L(
    '- Số tài khoản: 662100000168',
    '- Account number: 662100000168',
    '- 账号：662100000168',
    '- 계좌번호: 662100000168',
    '- 口座番号：662100000168',
    '- เลขที่บัญชี: 662100000168',
  ),
  L(
    '- Ngân hàng: PVcomBank – Chi nhánh Quảng Ninh',
    '- Bank: PVcomBank – Quang Ninh branch',
    '- 银行：PVcomBank 广宁分行',
    '- 은행: PVcomBank 꽝닌 지점',
    '- 銀行：PVcomBank クアンニン支店',
    '- ธนาคาร: PVcomBank สาขากว๋างนิญ',
  ),
  L(
    'Ngoài các thông tin trên, tất cả các fanpage, website, email hoặc tài khoản khác đều là giả mạo.',
    'Apart from the details above, every other page, website, email address or account is fraudulent.',
    '除上述信息外，其他任何专页、网站、邮箱或账户均属伪冒。',
    '위에 안내된 정보 외의 모든 페이지, 웹사이트, 이메일 주소 또는 계좌는 모두 가짜입니다.',
    '上記以外のページ、ウェブサイト、メールアドレス、口座は、すべて偽物です。',
    'นอกเหนือจากข้อมูลข้างต้น เพจ เว็บไซต์ อีเมล หรือบัญชีอื่นใดล้วนเป็นของปลอมทั้งสิ้น',
  ),
  L(
    'Mọi hành vi sao chép, giả mạo hoặc mạo danh thương hiệu sẽ được báo cáo đến Meta và xử lý theo đúng quy định pháp luật.',
    'Any copying, forgery or impersonation of the brand will be reported to Meta and dealt with in accordance with the law.',
    '任何复制、伪造或冒用本品牌的行为，均将向 Meta 举报并依法处理。',
    '브랜드를 복제·위조하거나 사칭하는 모든 행위는 Meta에 신고되고 법령에 따라 처리됩니다.',
    'ブランドの複製、偽造、なりすまし行為は、すべて Meta に通報し、法令に従って対処いたします。',
    'การคัดลอก ปลอมแปลง หรือแอบอ้างแบรนด์ทุกกรณีจะถูกรายงานต่อ Meta และดำเนินการตามกฎหมาย',
  ),
  L(
    'Quý khách hàng vui lòng kiểm tra kỹ trước khi thực hiện giao dịch. Mọi thắc mắc, vui lòng liên hệ trực tiếp với khách sạn qua các kênh chính thức.',
    'Please check carefully before making any transaction. If you have any doubt, contact the hotel directly through the official channels above.',
    '请在进行交易前仔细核对。如有任何疑问，请通过上述官方渠道直接联系酒店。',
    '거래를 진행하시기 전에 반드시 꼼꼼히 확인해 주십시오. 의문이 있으시면 위의 공식 채널로 호텔에 직접 연락해 주시기 바랍니다.',
    'お取引の前に必ずよくご確認ください。ご不明な点がございましたら、上記の公式チャネルより直接ホテルへお問い合わせください。',
    'กรุณาตรวจสอบให้ถี่ถ้วนก่อนทำธุรกรรม หากมีข้อสงสัยประการใด กรุณาติดต่อโรงแรมโดยตรงผ่านช่องทางทางการข้างต้น',
  ),
  L(
    '────── ROYAL HALONG HOTEL & VILLAS ──────',
    '────── ROYAL HALONG HOTEL & VILLAS ──────',
    '────── ROYAL HALONG HOTEL & VILLAS ──────',
    '────── ROYAL HALONG HOTEL & VILLAS ──────',
    '────── ROYAL HALONG HOTEL & VILLAS ──────',
    '────── ROYAL HALONG HOTEL & VILLAS ──────',
  ),
  L(
    'Khách sạn di sản bên bờ di sản',
    'A heritage hotel on the shore of a World Heritage bay',
    '世界遗产海湾之畔的传承之居',
    '세계유산 해안에 자리한 헤리티지 호텔',
    '世界遺産の湾のほとりに佇むヘリテージホテル',
    'โรงแรมแห่งมรดกริมอ่าวมรดกโลก',
  ),
  L(
    'Địa chỉ/ Add: Ha Long Road, Bãi Cháy, Hạ Long, Quảng Ninh',
    'Address: Ha Long Road, Bai Chay, Ha Long, Quang Ninh',
    '地址：Ha Long Road, Bai Chay, Ha Long, Quang Ninh（越南广宁省下龙市拜寨坊下龙路）',
    '주소: Ha Long Road, Bai Chay, Ha Long, Quang Ninh (베트남 꽝닌성 하롱시 바이짜이)',
    '住所：Ha Long Road, Bai Chay, Ha Long, Quang Ninh（ベトナム・クアンニン省ハロン市バイチャイ）',
    'ที่อยู่: Ha Long Road, Bai Chay, Ha Long, Quang Ninh (บ๊ายจ๋าย เมืองฮาลอง จังหวัดกว๋างนิญ)',
  ),
  L(
    'Hotline: 0203 3848 777 | 0904 030 222',
    'Hotline: 0203 3848 777 | 0904 030 222',
    '热线：0203 3848 777 | 0904 030 222',
    '대표 전화: 0203 3848 777 | 0904 030 222',
    'ホットライン：0203 3848 777 | 0904 030 222',
    'สายด่วน: 0203 3848 777 | 0904 030 222',
  ),
  L(
    'Website: www.royalhalonghotel.com',
    'Website: www.royalhalonghotel.com',
    '网站：www.royalhalonghotel.com',
    '웹사이트: www.royalhalonghotel.com',
    'ウェブサイト：www.royalhalonghotel.com',
    'เว็บไซต์: www.royalhalonghotel.com',
  ),
  L(
    'Email: info@royalhalonghotel.com',
    'Email: info@royalhalonghotel.com',
    '电子邮箱：info@royalhalonghotel.com',
    '이메일: info@royalhalonghotel.com',
    'メール：info@royalhalonghotel.com',
    'อีเมล: info@royalhalonghotel.com',
  ),
]

const POST_FB_SEO = seo(
  L(
    'Cảnh báo trang Facebook giả mạo — Royal Hạ Long Hotel',
    'Warning: fake Facebook pages — Royal Ha Long Hotel',
    '虚假 Facebook 页面警告 — Royal Ha Long Hotel',
    '가짜 페이스북 페이지 경고 — Royal Ha Long Hotel',
    '偽 Facebook ページへの注意喚起 — Royal Ha Long Hotel',
    'คำเตือนเพจเฟซบุ๊กปลอม — Royal Ha Long Hotel',
  ),
  L(
    'Một số trang Facebook đang mạo danh Royal Halong Hotel & Villas. Đây là danh sách kênh chính thức duy nhất: fanpage, website, hotline, email và tài khoản ngân hàng.',
    'Some Facebook pages are impersonating Royal Halong Hotel & Villas. Here are our only official channels: page, website, hotline, email and bank account.',
    '有 Facebook 页面正在冒充 Royal Halong Hotel & Villas。以下为我们唯一的官方渠道：专页、网站、热线、邮箱与银行账户。',
    '일부 페이스북 페이지가 Royal Halong Hotel & Villas를 사칭하고 있습니다. 유일한 공식 채널인 페이지, 웹사이트, 대표 전화, 이메일, 계좌 정보를 확인하세요.',
    'Royal Halong Hotel & Villas をかたる Facebook ページがあります。唯一の公式チャネル（ページ、ウェブサイト、ホットライン、メール、銀行口座）をご確認ください。',
    'มีเพจเฟซบุ๊กบางเพจแอบอ้างเป็น Royal Halong Hotel & Villas นี่คือช่องทางทางการเพียงช่องทางเดียวของเรา: เพจ เว็บไซต์ สายด่วน อีเมล และบัญชีธนาคาร',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  post.quy-2-2023-… — bản tin kết quả kinh doanh quý II/2023.
 *  Số liệu giữ NGUYÊN: 24,2 tỷ / 55 tỷ / 4,60 tỷ đồng.
 * ══════════════════════════════════════════════════════════════════ */

const POST_Q2_TITLE = L(
  'Quý 2/2023, CTCP Quốc Tế Hoàng Gia (RIC): Kiên Trì Với Mục Tiêu Kinh Doanh Ổn Định',
  'Q2 2023: Royal International Corporation (RIC) holds to its goal of steady business',
  '2023 年第二季度，皇家国际股份公司（RIC）：坚守稳健经营目标',
  '2023년 2분기, 호앙지아 국제주식회사(RIC): 안정적인 사업 목표를 향해 꾸준히',
  '2023年第2四半期、ホアンザー国際株式会社（RIC）：安定した事業目標を堅持',
  'ไตรมาส 2/2566 บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล (RIC): ยืนหยัดกับเป้าหมายธุรกิจที่มั่นคง',
)

const POST_Q2_EXCERPT = L(
  'Kết quả kinh doanh 6 tháng đầu năm cho thấy ngành du lịch nói chung, CTCP quốc tế Hoàng Gia – Royal Hạ Long (RIC) nói riêng vẫn đối diện với nhiều khó khăn, thách thức theo cùng sự phục hồi chậm của ngành.',
  'The first-half results show that tourism in general, and Royal International Corporation – Royal Ha Long (RIC) in particular, still face considerable difficulties and challenges as the sector recovers slowly.',
  '上半年经营业绩显示，随着行业复苏缓慢，旅游业整体、尤其是皇家国际股份公司——Royal Ha Long（RIC）仍面临诸多困难与挑战。',
  '상반기 경영 실적은 관광업 전반, 특히 호앙지아 국제주식회사 – Royal Ha Long(RIC)이 업계의 더딘 회복 속에서 여전히 많은 어려움과 도전에 직면해 있음을 보여 줍니다.',
  '上半期の業績は、観光業全般、とりわけホアンザー国際株式会社 – Royal Ha Long（RIC）が、業界の回復の遅れとともに依然として多くの困難と課題に直面していることを示しています。',
  'ผลประกอบการครึ่งปีแรกแสดงให้เห็นว่าอุตสาหกรรมท่องเที่ยวโดยรวม และโดยเฉพาะบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล – Royal Ha Long (RIC) ยังคงเผชิญความยากลำบากและความท้าทายหลายประการ ไปพร้อมกับการฟื้นตัวที่ล่าช้าของอุตสาหกรรม',
)

const POST_Q2_ALT = L(
  'Toà khách sạn màu trắng với biển hiệu ROYAL HALONG HOTEL trên nóc, nhìn từ khu vườn có ô che và bàn ghế mây; lối vào Royal Casino nằm bên phải',
  'The white hotel tower with its rooftop ROYAL HALONG HOTEL sign, seen across the garden with parasols and wicker chairs; the Royal Casino entrance to the right',
  '白色酒店主楼与屋顶 ROYAL HALONG HOTEL 标识，从设有遮阳伞与藤椅的花园望去；右侧为 Royal Casino 入口',
  '옥상에 ROYAL HALONG HOTEL 간판이 달린 흰색 호텔 건물을 파라솔과 등나무 의자가 놓인 정원 너머로 바라본 모습, 오른쪽에는 Royal Casino 입구',
  '屋上に ROYAL HALONG HOTEL のサインを掲げた白いホテル棟を、パラソルと籐椅子の並ぶ庭越しに望む。右手には Royal Casino の入口',
  'อาคารโรงแรมสีขาวพร้อมป้าย ROYAL HALONG HOTEL บนดาดฟ้า มองข้ามสวนที่มีร่มและเก้าอี้หวาย ทางขวาคือทางเข้า Royal Casino',
)

const POST_Q2_BODY = [
  L(
    'Kết quả kinh doanh 6 tháng đầu năm cho thấy ngành du lịch nói chung, CTCP quốc tế Hoàng Gia – Royal Hạ Long (RIC) nói riêng vẫn đối diện với nhiều khó khăn, thách thức theo cùng sự phục hồi chậm của ngành.',
    'The first-half results show that tourism in general, and Royal International Corporation – Royal Ha Long (RIC) in particular, still face considerable difficulties and challenges as the sector recovers slowly.',
    '上半年经营业绩显示，随着行业复苏缓慢，旅游业整体、尤其是皇家国际股份公司——Royal Ha Long（RIC）仍面临诸多困难与挑战。',
    '상반기 경영 실적은 관광업 전반, 특히 호앙지아 국제주식회사 – Royal Ha Long(RIC)이 업계의 더딘 회복 속에서 여전히 많은 어려움과 도전에 직면해 있음을 보여 줍니다.',
    '上半期の業績は、観光業全般、とりわけホアンザー国際株式会社 – Royal Ha Long（RIC）が、業界の回復の遅れとともに依然として多くの困難と課題に直面していることを示しています。',
    'ผลประกอบการครึ่งปีแรกแสดงให้เห็นว่าอุตสาหกรรมท่องเที่ยวโดยรวม และโดยเฉพาะบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล – Royal Ha Long (RIC) ยังคงเผชิญความยากลำบากและความท้าทายหลายประการ ไปพร้อมกับการฟื้นตัวที่ล่าช้าของอุตสาหกรรม',
  ),
  L(
    'Báo cáo tài chính quý II/2023 của RIC vừa công bố cho thấy, tổng doanh thu bán hàng và cung cấp dịch vụ trong kỳ đạt hơn 24,2 tỷ đồng. Lũy kế 6 tháng đầu năm 2023, tổng doanh thu ghi nhận đạt hơn 55 tỷ đồng, tăng nhẹ hơn 4,60 tỷ đồng so với cùng kỳ năm ngoái.',
    'RIC’s newly published financial statements for the second quarter of 2023 show total revenue from sales and services for the period of more than VND 24.2 billion. For the first six months of 2023 as a whole, total revenue reached more than VND 55 billion, a modest increase of more than VND 4.60 billion on the same period last year.',
    'RIC 刚刚公布的 2023 年第二季度财务报告显示，本期商品销售与服务提供总收入超过 242 亿越南盾。2023 年上半年累计，总收入超过 550 亿越南盾，较去年同期小幅增加逾 46 亿越南盾。',
    'RIC가 최근 공시한 2023년 2분기 재무제표에 따르면, 해당 기간 상품 판매 및 용역 제공 총매출은 242억 동을 넘었습니다. 2023년 상반기 누적 총매출은 550억 동을 넘어, 전년 동기 대비 46억 동 남짓 소폭 증가했습니다.',
    'RIC が公表した2023年第2四半期の財務諸表によると、当期の商品販売およびサービス提供による総売上高は242億ドンを超えました。2023年上半期の累計では、総売上高は550億ドンを超え、前年同期比で46億ドン余りの小幅な増加となりました。',
    'งบการเงินไตรมาส 2 ปี 2566 ที่ RIC เพิ่งเปิดเผยแสดงให้เห็นว่า รายได้รวมจากการขายสินค้าและการให้บริการในงวดดังกล่าวอยู่ที่กว่า 24,200 ล้านดองเวียดนาม สะสมครึ่งปีแรกของปี 2566 รายได้รวมอยู่ที่กว่า 55,000 ล้านดอง เพิ่มขึ้นเล็กน้อยกว่า 4,600 ล้านดองเมื่อเทียบกับช่วงเดียวกันของปีก่อน',
  ),
  L(
    'CTCP quốc tế Hoàng Gia tiếp tục đồng hành cùng Tp. Hạ Long, tỉnh Quảng Ninh đẩy mạnh nhiều biện pháp kích cầu du lịch, tạo điều kiện tốt nhất cho việc thu hút khách quốc tế trở lại, xây dựng cơ sở dữ liệu online về các tour du lịch, các điểm nghỉ dưỡng, vui chơi dịch vụ giải trí cho du khách trong và ngoài nước.',
    'Royal International Corporation continues to work alongside Ha Long City and Quang Ninh province on a range of measures to stimulate tourism, creating the best possible conditions to bring international visitors back and building an online database of tours, resorts and leisure and entertainment venues for domestic and foreign travellers.',
    '皇家国际股份公司继续与下龙市及广宁省携手，推行多项旅游刺激措施，为吸引国际游客回流创造最佳条件，并为国内外游客建立关于旅游线路、度假地及休闲娱乐服务场所的线上数据库。',
    '호앙지아 국제주식회사는 하롱시 및 꽝닌성과 함께 다양한 관광 진작 조치를 추진하며, 국제 관광객이 돌아올 수 있는 최상의 여건을 마련하고, 국내외 여행객을 위한 투어·리조트·여가 및 엔터테인먼트 시설의 온라인 데이터베이스를 구축해 나가고 있습니다.',
    'ホアンザー国際株式会社は、ハロン市およびクアンニン省とともに観光需要喚起のさまざまな施策を推進し、国際観光客の再来に向けた最良の環境を整えるとともに、国内外の旅行者に向けたツアー、リゾート、レジャー・娯楽施設のオンラインデータベースの構築を進めています。',
    'บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล ยังคงร่วมมือกับนครฮาลองและจังหวัดกว๋างนิญในการผลักดันมาตรการกระตุ้นการท่องเที่ยวหลายด้าน สร้างเงื่อนไขที่ดีที่สุดเพื่อดึงดูดนักท่องเที่ยวต่างชาติกลับมา และจัดทำฐานข้อมูลออนไลน์เกี่ยวกับทัวร์ท่องเที่ยว แหล่งพักผ่อน และสถานบริการบันเทิงสำหรับนักท่องเที่ยวทั้งในและต่างประเทศ',
  ),
]

const POST_Q2_SEO = seo(
  L(
    'Quý 2/2023: RIC kiên trì mục tiêu kinh doanh ổn định',
    'Q2 2023: RIC holds to its goal of steady business',
    '2023 年第二季度：RIC 坚守稳健经营目标',
    '2023년 2분기: RIC, 안정적 사업 목표 유지',
    '2023年第2四半期：RIC、安定した事業目標を堅持',
    'ไตรมาส 2/2566: RIC ยืนหยัดกับเป้าหมายธุรกิจที่มั่นคง',
  ),
  L(
    'Báo cáo tài chính quý II/2023 của CTCP Quốc tế Hoàng Gia (RIC): doanh thu kỳ đạt hơn 24,2 tỷ đồng, luỹ kế 6 tháng hơn 55 tỷ đồng.',
    'Royal International Corporation (RIC) Q2 2023 results: revenue of more than VND 24.2 billion for the quarter and more than VND 55 billion for the half year.',
    '皇家国际股份公司（RIC）2023 年第二季度业绩：当季收入逾 242 亿越南盾，上半年累计逾 550 亿越南盾。',
    '호앙지아 국제주식회사(RIC) 2023년 2분기 실적 — 분기 매출 242억 동 이상, 상반기 누적 550억 동 이상.',
    'ホアンザー国際株式会社（RIC）2023年第2四半期業績 — 四半期売上高242億ドン超、上半期累計550億ドン超。',
    'ผลประกอบการไตรมาส 2/2566 ของบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล (RIC): รายได้ไตรมาสกว่า 24,200 ล้านดอง สะสมครึ่งปีกว่า 55,000 ล้านดอง',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  post.thong-cao-bao-chi-… — thông cáo báo chí ĐHĐCĐ thường niên 2023.
 *  Ngày 26/4/2023, các con số 117,76 tỷ / 57% / 44,3 tỷ / 4000 lượt /
 *  3,5 lần / 1/3 / 109% / 246,5 tỷ giữ NGUYÊN.
 * ══════════════════════════════════════════════════════════════════ */

const POST_PR_TITLE = L(
  '[Thông Cáo Báo Chí] ĐHCĐ CTCP Quốc Tế Hoàng Gia: Khởi Sắc Cùng Du Lịch Địa Phương',
  '[Press release] Royal International Corporation AGM: brightening alongside local tourism',
  '【新闻稿】皇家国际股份公司股东大会：与本地旅游一同回暖',
  '[보도자료] 호앙지아 국제주식회사 주주총회: 지역 관광과 함께 되살아나다',
  '【プレスリリース】ホアンザー国際株式会社 株主総会：地域観光とともに上向く',
  '[ข่าวประชาสัมพันธ์] การประชุมผู้ถือหุ้นบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล: เติบโตไปพร้อมการท่องเที่ยวท้องถิ่น',
)

const POST_PR_EXCERPT = L(
  '(Hạ Long) Ngày 26/4/2023, CTCP quốc tế Hoàng Gia – Royal (mã chứng khoán: RIC) đã tổ chức Đại hội đồng cổ đông thường niên năm 2023, tổng kết tình hình hoạt động sản xuất kinh doanh năm 2022, đưa ra kế hoạch năm 2023.',
  '(Ha Long) On 26 April 2023, Royal International Corporation – Royal (ticker: RIC) held its 2023 annual general meeting, reviewing its business performance in 2022 and setting out its plan for 2023.',
  '（下龙）2023 年 4 月 26 日，皇家国际股份公司——Royal（股票代码：RIC）召开 2023 年年度股东大会，总结 2022 年生产经营情况并提出 2023 年计划。',
  '(하롱) 2023년 4월 26일, 호앙지아 국제주식회사 – Royal(종목코드: RIC)이 2023년 정기 주주총회를 열어 2022년 경영 실적을 결산하고 2023년 계획을 제시했습니다.',
  '（ハロン）2023年4月26日、ホアンザー国際株式会社 – Royal（証券コード：RIC）は2023年定時株主総会を開催し、2022年の事業実績を総括するとともに2023年の計画を示しました。',
  '(ฮาลอง) วันที่ 26 เมษายน 2566 บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล – Royal (รหัสหลักทรัพย์: RIC) จัดการประชุมสามัญผู้ถือหุ้นประจำปี 2566 สรุปผลการดำเนินงานปี 2565 และเสนอแผนงานปี 2566',
)

const POST_PR_ALT = L(
  'Toàn cảnh khu khách sạn nhìn từ trên cao lúc bình minh, mặt trời lên sau ngọn đồi xanh, hàng cọ và tán cây phía trước',
  'An aerial view of the hotel complex at sunrise, the sun rising behind a green hill with palms and treetops in the foreground',
  '日出时分俯瞰酒店建筑群，阳光自青翠山丘后升起，前景是棕榈与树冠',
  '동틀 무렵 상공에서 내려다본 호텔 단지, 초록 언덕 뒤로 떠오르는 해와 앞쪽의 야자수와 나무 우듬지',
  '日の出のホテル全景を上空から望む。緑の丘の向こうから昇る朝日と、手前のヤシの木々',
  'ภาพมุมสูงของอาคารโรงแรมยามอรุณรุ่ง ดวงอาทิตย์ขึ้นหลังเนินเขาเขียว ด้านหน้าเป็นแนวต้นปาล์มและยอดไม้',
)

const POST_PR_BODY = [
  L(
    '(Hạ Long) Ngày 26/4/2023, CTCP quốc tế Hoàng Gia – Royal (mã chứng khoán: RIC) đã tổ chức Đại hội đồng cổ đông thường niên năm 2023, tổng kết tình hình hoạt động sản xuất kinh doanh năm 2022, đưa ra kế hoạch năm 2023, đánh dấu những nỗ lực của công ty trong bối cảnh ngành du lịch đang khởi sắc.',
    '(Ha Long) On 26 April 2023, Royal International Corporation – Royal (ticker: RIC) held its 2023 annual general meeting, reviewing its business performance in 2022 and setting out its plan for 2023 — a marker of the company’s efforts as tourism begins to pick up again.',
    '（下龙）2023 年 4 月 26 日，皇家国际股份公司——Royal（股票代码：RIC）召开 2023 年年度股东大会，总结 2022 年生产经营情况并提出 2023 年计划，标志着公司在旅游业回暖背景下所作的努力。',
    '(하롱) 2023년 4월 26일, 호앙지아 국제주식회사 – Royal(종목코드: RIC)이 2023년 정기 주주총회를 열어 2022년 경영 실적을 결산하고 2023년 계획을 제시했습니다. 관광업이 되살아나는 국면에서 회사가 기울인 노력을 보여 주는 자리였습니다.',
    '（ハロン）2023年4月26日、ホアンザー国際株式会社 – Royal（証券コード：RIC）は2023年定時株主総会を開催し、2022年の事業実績を総括するとともに2023年の計画を示しました。観光業が上向くなかでの同社の努力を示すものです。',
    '(ฮาลอง) วันที่ 26 เมษายน 2566 บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล – Royal (รหัสหลักทรัพย์: RIC) จัดการประชุมสามัญผู้ถือหุ้นประจำปี 2566 สรุปผลการดำเนินงานปี 2565 และเสนอแผนงานปี 2566 อันเป็นเครื่องหมายแห่งความพยายามของบริษัทท่ามกลางการฟื้นตัวของอุตสาหกรรมท่องเที่ยว',
  ),
  L(
    'h4| **Kết quả sản xuất kinh doanh năm 2022: Nỗ lực ở nhiều mặt**',
    'h4| **Business results in 2022: effort on many fronts**',
    'h4| **2022 年生产经营成果：多方面的努力**',
    'h4| **2022년 경영 실적: 여러 방면에서의 노력**',
    'h4| **2022年の事業実績：多方面での努力**',
    'h4| **ผลการดำเนินงานปี 2565: ความพยายามในหลายด้าน**',
  ),
  L(
    'Mặc dù tình hình dịch bệnh Covid – 19 đã được khống chế, du lịch có sự khởi sắc, nhưng lượng khách quốc tế & trong nước vẫn hạn chế.',
    'Although the Covid-19 epidemic has been brought under control and tourism has picked up, the numbers of international and domestic visitors remain limited.',
    '尽管新冠疫情已得到控制、旅游业有所回暖，但国际与国内客流量仍然有限。',
    '코로나19 상황이 통제되고 관광업이 되살아났음에도, 국제 및 국내 관광객 수는 여전히 제한적입니다.',
    '新型コロナウイルスの感染状況は抑制され、観光にも明るさが戻りましたが、国際・国内ともに旅行者数は依然として限られています。',
    'แม้สถานการณ์โรคระบาดโควิด-19 จะถูกควบคุมได้และการท่องเที่ยวเริ่มฟื้นตัว แต่จำนวนนักท่องเที่ยวต่างชาติและในประเทศยังคงมีอยู่อย่างจำกัด',
  ),
  L(
    'Năm 2022, doanh thu công ty ghi nhận hơn 117,76 tỷ đồng, tăng 57% so với năm 2021. Việc cơ cấu lại mô hình hoạt động giúp doanh nghiệp tiết giảm được chi phí, đưa mức lỗ của năm 2022 thấp hơn so với 2021 là trên 44,3 tỷ đồng. Công ty đã rất nỗ lực triển khai đồng bộ các giải pháp khác nhau để đẩy mạnh các hoạt động kinh doanh, tái cơ cấu mô hình hoạt động, cơ cấu tài chính ổn định hơn để thúc đẩy các hoạt động khai thác dịch vụ lưu trú và phục vụ giải trí của Royal Hotel, đặc biệt nhóm khách quốc tế.',
    'In 2022 the company recorded revenue of more than VND 117.76 billion, up 57% on 2021. Restructuring its operating model allowed the business to cut costs, bringing the 2022 loss more than VND 44.3 billion below that of 2021. The company worked hard to roll out a coordinated set of measures to strengthen its commercial activity, restructure its operating model and put its finances on a steadier footing, in order to drive the accommodation and entertainment services of Royal Hotel, particularly among international guests.',
    '2022 年，公司录得收入逾 1,177.6 亿越南盾，较 2021 年增长 57%。经营模式重构帮助企业节约成本，使 2022 年亏损较 2021 年减少逾 443 亿越南盾。公司大力推行一系列综合举措，以促进经营活动、重构经营模式、稳固财务结构，从而带动 Royal Hotel 的住宿与娱乐服务，尤其面向国际客群。',
    '2022년 회사 매출은 1,177억 6천만 동을 넘어 2021년 대비 57% 증가했습니다. 운영 모델 재편을 통해 비용을 절감하여 2022년 손실을 2021년보다 443억 동 이상 줄였습니다. 회사는 사업 활동을 강화하고 운영 모델을 재편하며 재무 구조를 한층 안정시키기 위한 여러 해법을 일관되게 추진하여, 특히 국제 고객층을 대상으로 Royal Hotel의 숙박 및 엔터테인먼트 서비스를 견인하고자 힘썼습니다.',
    '2022年の売上高は1,177億6千万ドンを超え、2021年比57%増となりました。事業モデルの再構築により経費を削減し、2022年の損失は2021年より443億ドン以上圧縮されました。同社は、事業活動の強化、運営モデルの再編、より安定した財務構造の構築に向けた各種施策を一体的に推進し、とりわけ国際のお客様に向けた Royal Hotel の宿泊・娯楽サービスの伸長に努めました。',
    'ในปี 2565 บริษัทมีรายได้กว่า 117,760 ล้านดองเวียดนาม เพิ่มขึ้น 57% เมื่อเทียบกับปี 2564 การปรับโครงสร้างรูปแบบการดำเนินงานช่วยให้บริษัทลดต้นทุนได้ ทำให้ผลขาดทุนปี 2565 ต่ำกว่าปี 2564 กว่า 44,300 ล้านดอง บริษัทได้ทุ่มเทดำเนินมาตรการต่าง ๆ อย่างสอดประสานเพื่อผลักดันกิจกรรมทางธุรกิจ ปรับโครงสร้างรูปแบบการดำเนินงานและโครงสร้างทางการเงินให้มั่นคงยิ่งขึ้น เพื่อส่งเสริมการให้บริการที่พักและบริการบันเทิงของ Royal Hotel โดยเฉพาะกลุ่มนักท่องเที่ยวต่างชาติ',
  ),
  L(
    'Cũng trong năm 2022, CTCP quốc tế Hoàng Gia đã đưa vào khai thác hoạt động Cung Hội nghị quốc tế Hoàng Gia trở thành địa điểm tổ chức các sự kiện lớn mang tầm quốc gia và khu vực, đón hơn 4000 lượt khách tham dự như: Hội nghị Hội đồng tư vấn kinh doanh APEC lần thứ 3 (ABAC 3); Diễn đàn Du lịch liên khu vực Đông Á (EATOF); Hội nghị Quốc tế Bộ Công thương,…',
    'Also in 2022, Royal International Corporation brought the Royal International Convention Palace into operation, making it a venue for major national and regional events and welcoming more than 4,000 delegates — among them the 3rd APEC Business Advisory Council meeting (ABAC 3), the East Asia Inter-Regional Tourism Forum (EATOF) and an international conference of the Ministry of Industry and Trade.',
    '同样在 2022 年，皇家国际股份公司启用皇家国际会议宫，使其成为举办国家级与区域级大型活动的场所，接待与会宾客逾 4,000 人次，如：APEC 工商咨询理事会第三次会议（ABAC 3）；东亚区域间旅游论坛（EATOF）；工贸部国际会议等。',
    '또한 2022년 호앙지아 국제주식회사는 로열 인터내셔널 컨벤션 팰리스를 가동하여 국가 및 역내 대형 행사의 개최 장소로 자리매김했으며, 제3차 APEC 기업인자문위원회 회의(ABAC 3), 동아시아 지역 간 관광 포럼(EATOF), 산업무역부 국제회의 등으로 4,000명이 넘는 참가자를 맞이했습니다.',
    '同じく2022年、ホアンザー国際株式会社はロイヤル国際コンベンションパレスの運営を開始し、国家的・地域的規模の大型イベントの会場として、4,000名を超える参加者を迎えました。第3回APECビジネス諮問委員会会合（ABAC 3）、東アジア地域間観光フォーラム（EATOF）、商工省の国際会議などです。',
    'ในปี 2565 เช่นกัน บริษัท ฮหว่างซา อินเตอร์เนชั่นแนล ได้เปิดดำเนินการรอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ ให้เป็นสถานที่จัดงานใหญ่ระดับชาติและระดับภูมิภาค ต้อนรับผู้เข้าร่วมกว่า 4,000 คน อาทิ การประชุมสภาที่ปรึกษาธุรกิจเอเปคครั้งที่ 3 (ABAC 3) เวทีการท่องเที่ยวระหว่างภูมิภาคเอเชียตะวันออก (EATOF) และการประชุมระหว่างประเทศของกระทรวงอุตสาหกรรมและการค้า ฯลฯ',
  ),
  L(
    'Riêng trong quý I/2023, doanh thu thuần của CTCP quốc tế Hoàng Gia ghi nhận đạt gấp 3,5 lần so với cùng kỳ của năm trước, cho thấy sự tăng trưởng khả quan và đặt nền tảng kỳ vọng cho hoạt động sản xuất kinh doanh năm nay của công ty. Đặc biệt chi phí quản lý doanh nghiệp giảm tới 1/3 cho thấy hiệu quả hoạt động ổn định trở lại của Royal.',
    'In the first quarter of 2023 alone, Royal International Corporation’s net revenue was 3.5 times that of the same period a year earlier — encouraging growth that lays the foundation for expectations of the company’s performance this year. Notably, administrative expenses fell by a third, a sign that Royal’s operations are returning to steady efficiency.',
    '仅 2023 年第一季度，皇家国际股份公司的净收入即达到上年同期的 3.5 倍，显示出可观增长，并为公司今年的生产经营奠定预期基础。尤其是企业管理费用下降达三分之一，表明 Royal 的运营效率正稳步恢复。',
    '2023년 1분기만 보아도 호앙지아 국제주식회사의 순매출은 전년 동기의 3.5배에 달해, 고무적인 성장세를 보이며 올해 경영 실적에 대한 기대의 토대를 마련했습니다. 특히 관리비가 3분의 1이나 줄어 Royal의 운영 효율이 다시 안정을 찾고 있음을 보여 줍니다.',
    '2023年第1四半期だけでも、ホアンザー国際株式会社の純売上高は前年同期の3.5倍に達し、堅調な成長を示すとともに、今年度の事業への期待の基盤を築きました。とりわけ一般管理費が3分の1減少したことは、Royal の事業効率が再び安定しつつあることを示しています。',
    'เฉพาะไตรมาส 1 ปี 2566 รายได้สุทธิของบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล อยู่ที่ 3.5 เท่าของช่วงเดียวกันปีก่อน สะท้อนการเติบโตที่น่าพอใจและวางรากฐานความคาดหวังต่อผลการดำเนินงานของบริษัทในปีนี้ โดยเฉพาะค่าใช้จ่ายในการบริหารที่ลดลงถึง 1 ใน 3 แสดงให้เห็นว่าประสิทธิภาพการดำเนินงานของ Royal กลับมามั่นคงอีกครั้ง',
  ),
  L(
    'h4| **Năm 2023: Mục tiêu doanh thu tăng gấp đôi, báo lãi trở lại**',
    'h4| **2023: doubling the revenue target and returning to profit**',
    'h4| **2023 年：收入目标翻倍，重回盈利**',
    'h4| **2023년: 매출 목표 두 배, 흑자 전환**',
    'h4| **2023年：売上目標を倍増し、黒字転換へ**',
    'h4| **ปี 2566: เป้าหมายรายได้เพิ่มเท่าตัว และกลับมามีกำไร**',
  ),
  L(
    'Năm 2023, Chính phủ và các địa phương đang nỗ lực mở rộng các hoạt động thu hút khách du lịch quốc tế trở lại. Đây là cơ hội cho Royal Hotel tập trung triển khai đồng bộ nhiều chương trình để đẩy mạnh khai thác khách du lịch quốc tế thông qua việc phối hợp với các hãng hàng không, các công ty lữ hành, đại lý trong và ngoài nước xây dựng các tours du lịch đa dạng, mang tính chất đặc thù, phù hợp với nhiều đối tượng khách du lịch.',
    'In 2023 the government and local authorities are working to widen the drive to bring international visitors back. This gives Royal Hotel the chance to roll out a coordinated set of programmes to attract more international travellers, working with airlines, tour operators and agents at home and abroad to build a varied and distinctive range of tours suited to many kinds of visitor.',
    '2023 年，政府与各地方正努力扩大吸引国际游客回流的各项活动。这为 Royal Hotel 提供了机会，可综合推行多项计划以加大对国际客源的开发，与国内外航空公司、旅行社及代理商合作，打造多样、具特色、适合不同客群的旅游线路。',
    '2023년 정부와 지방정부는 국제 관광객을 다시 불러들이기 위한 활동을 확대하고 있습니다. 이는 Royal Hotel이 여러 프로그램을 일관되게 추진하여 국제 관광객 유치를 강화할 기회로, 국내외 항공사·여행사·대리점과 협력하여 다양한 고객층에 맞는 특색 있는 투어 상품을 개발하고 있습니다.',
    '2023年、政府および地方自治体は国際観光客を呼び戻す取り組みの拡大に努めています。これは Royal Hotel にとって、国内外の航空会社・旅行会社・代理店と連携し、多様なお客様層に合った特色あるツアーを造成することで、国際観光客の誘致を強化する各種プログラムを一体的に展開する好機となっています。',
    'ในปี 2566 รัฐบาลและท้องถิ่นต่าง ๆ กำลังเร่งขยายกิจกรรมเพื่อดึงดูดนักท่องเที่ยวต่างชาติกลับมา นี่เป็นโอกาสให้ Royal Hotel มุ่งดำเนินโครงการต่าง ๆ อย่างสอดประสานเพื่อเร่งเจาะกลุ่มนักท่องเที่ยวต่างชาติ ผ่านการร่วมมือกับสายการบิน บริษัทนำเที่ยว และตัวแทนทั้งในและต่างประเทศ ในการสร้างสรรค์ทัวร์ที่หลากหลาย มีเอกลักษณ์ และเหมาะกับนักท่องเที่ยวหลายกลุ่ม',
  ),
  L(
    'Trong kế hoạch năm 2023, định hướng kinh doanh của công ty tăng trưởng 109% doanh thu, tương đương 246,5 tỷ đồng. Bên cạnh đó, Công ty sẽ đẩy mạnh nâng cấp, chuẩn bị đầu tư, mở rộng và phát triển dự án Khu Biệt thự và Khách sạn. Trong dài hạn, định hướng của Royal là tối đa hóa các giá trị và nỗ lực trở thành thương hiệu và điểm đến dịch vụ du lịch giải trí hấp dẫn tại Việt Nam, có uy tín trên thị trường quốc tế.',
    'The 2023 plan targets revenue growth of 109%, equivalent to VND 246.5 billion. Alongside this, the Company will press ahead with upgrades and prepare to invest in, expand and develop the Villas and Hotel project. In the longer term, Royal’s direction is to maximise value and to become an appealing tourism and leisure brand and destination in Vietnam with standing on the international market.',
    '2023 年计划中，公司经营目标为收入增长 109%，约合 2,465 亿越南盾。同时，公司将加快升级改造，筹备投资、扩建并发展别墅与酒店项目。长远而言，Royal 的方向是最大化各项价值，努力成为越南具吸引力的旅游娱乐服务品牌与目的地，并在国际市场上享有信誉。',
    '2023년 계획에서 회사의 사업 목표는 매출 109% 성장, 금액으로는 2,465억 동입니다. 아울러 회사는 업그레이드를 가속하고 빌라·호텔 프로젝트의 투자 준비와 확장·개발을 추진할 예정입니다. 장기적으로 Royal의 방향은 가치를 극대화하고, 베트남에서 매력적인 관광·레저 브랜드이자 목적지로서 국제 시장에서도 신뢰받는 위치에 오르는 것입니다.',
    '2023年の計画では、売上高109%成長、金額にして2,465億ドンを事業目標としています。あわせて同社は、改修を加速し、ヴィラ・ホテルプロジェクトへの投資準備と拡張・開発を進めます。長期的には、Royal は価値の最大化を図り、ベトナムにおける魅力的な観光・レジャーのブランドかつデスティネーションとして、国際市場でも信頼を得ることを目指します。',
    'ในแผนปี 2566 บริษัทตั้งเป้าการเติบโตของรายได้ 109% คิดเป็นราว 246,500 ล้านดอง นอกจากนี้ บริษัทจะเร่งปรับปรุงยกระดับ เตรียมการลงทุน ขยายและพัฒนาโครงการวิลล่าและโรงแรม ในระยะยาว ทิศทางของ Royal คือการสร้างมูลค่าสูงสุด และมุ่งเป็นแบรนด์และจุดหมายด้านบริการท่องเที่ยวและบันเทิงที่น่าดึงดูดในเวียดนาม ซึ่งมีชื่อเสียงในตลาดต่างประเทศ',
  ),
  L(
    'Việc này cho thấy quyết tâm của Công ty Cổ phần Quốc tế Hoàng Gia trong phát triển các sản phẩm mới, để bám sát mục tiêu kinh doanh, tiếp tục nâng cao doanh thu, lợi nhuận năm nay và các năm trở về sau, đóng góp cho du lịch, đầu tư của địa phương.',
    'This shows Royal International Corporation’s determination to develop new products, stay close to its business targets, and continue to raise revenue and profit this year and in the years ahead, contributing to local tourism and investment.',
    '这体现了皇家国际股份公司发展新产品的决心，以紧扣经营目标，持续提升今年及今后各年的收入与利润，为当地旅游与投资作出贡献。',
    '이는 호앙지아 국제주식회사가 신규 상품을 개발하여 사업 목표를 충실히 따르고, 올해와 이후 몇 해 동안 매출과 이익을 계속 끌어올려 지역의 관광과 투자에 기여하겠다는 의지를 보여 줍니다.',
    'これは、ホアンザー国際株式会社が新たな商品を開発し、事業目標に忠実に、今年およびこれからの各年の売上と利益を高め続け、地域の観光と投資に貢献していく決意を示すものです。',
    'สิ่งนี้แสดงถึงความมุ่งมั่นของบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล ในการพัฒนาผลิตภัณฑ์ใหม่ เพื่อยึดมั่นในเป้าหมายทางธุรกิจ ยกระดับรายได้และกำไรทั้งในปีนี้และปีต่อ ๆ ไป อันเป็นการมีส่วนร่วมต่อการท่องเที่ยวและการลงทุนของท้องถิ่น',
  ),
]

const POST_PR_SEO = seo(
  L(
    'ĐHCĐ 2023 CTCP Quốc tế Hoàng Gia: khởi sắc cùng du lịch địa phương',
    'RIC 2023 AGM: brightening alongside local tourism',
    '皇家国际 2023 年股东大会：与本地旅游一同回暖',
    'RIC 2023년 주주총회: 지역 관광과 함께 되살아나다',
    'RIC 2023年株主総会：地域観光とともに上向く',
    'ประชุมผู้ถือหุ้น 2566 ของ RIC: เติบโตไปพร้อมการท่องเที่ยวท้องถิ่น',
  ),
  L(
    'Thông cáo báo chí ĐHĐCĐ thường niên 2023 của CTCP Quốc tế Hoàng Gia: doanh thu 2022 hơn 117,76 tỷ đồng, kế hoạch 2023 tăng 109% lên 246,5 tỷ đồng.',
    'Press release on Royal International Corporation’s 2023 AGM: 2022 revenue of more than VND 117.76 billion and a 2023 plan for 109% growth to VND 246.5 billion.',
    '皇家国际股份公司 2023 年年度股东大会新闻稿：2022 年收入逾 1,177.6 亿越南盾，2023 年计划增长 109% 至 2,465 亿越南盾。',
    '호앙지아 국제주식회사 2023년 정기 주주총회 보도자료 — 2022년 매출 1,177억 6천만 동 이상, 2023년 계획은 109% 성장한 2,465억 동.',
    'ホアンザー国際株式会社 2023年定時株主総会のプレスリリース — 2022年売上高1,177億6千万ドン超、2023年計画は109%増の2,465億ドン。',
    'ข่าวประชาสัมพันธ์การประชุมสามัญผู้ถือหุ้นปี 2566 ของบริษัท ฮหว่างซา อินเตอร์เนชั่นแนล: รายได้ปี 2565 กว่า 117,760 ล้านดอง แผนปี 2566 เติบโต 109% เป็น 246,500 ล้านดอง',
  ),
)

/* ══════════════════════════════════════════════════════════════════ *
 *  GHI LÊN SANITY
 *
 *  Mọi document đều ĐỌC cấu trúc đang có rồi chỉ thay các field chữ + `alt`,
 *  không dựng lại mảng `sections` từ đầu. Lý do: `_key` của từng section và
 *  `asset._ref` của ảnh nền là thứ Studio và các script khác đang tham chiếu
 *  tới; dựng lại sẽ sinh `_key` mới và làm mất mọi thay đổi ai đó vừa ghi ở
 *  field không thuộc phần dịch (ví dụ `height` của hero).
 * ══════════════════════════════════════════════════════════════════ */

async function sectionsOf(id: string): Promise<any[]> {
  const doc: any = await getDoc(id)
  if (!doc) throw new Error(`${id}: không có document`)
  if (!Array.isArray(doc.sections)) throw new Error(`${id}: không có mảng sections`)
  return JSON.parse(JSON.stringify(doc.sections))
}

/** Lấy đúng một section theo `_key`, kiểm luôn `_type` — section bị đổi kiểu
 *  giữa chừng thì đứng script chứ đừng ghi chữ vào nhầm khối. */
function sec(sections: any[], key: string, type: string): any {
  const s = sections.find((x) => x._key === key)
  if (!s) throw new Error(`không có section "${key}" (đang có: ${sections.map((x) => x._key).join(', ')})`)
  if (s._type !== type) throw new Error(`section "${key}" là <${s._type}>, mong <${type}>`)
  return s
}

/* ------------------------------------------------------------------ */

async function writeNews() {
  const sections = await sectionsOf('page.news')
  const hero = sec(sections, 'sec-0', 'heroSection')
  hero.heading = six(NEWS_TITLE, 'page.news hero.heading')
  hero.subheading = six(HOTEL_AND_VILLAS, 'page.news hero.subheading')
  setAlt(hero.background, 'Royal-Halong-Hotel-news-header.jpg', NEWS_HERO_ALT, 'page.news hero')
  await patchDoc('page.news', {
    title: six(NEWS_TITLE, 'page.news title'),
    seo: NEWS_SEO,
    sections,
  })
}

async function writeAnnouncement() {
  const sections = await sectionsOf('page.our-announcement')
  const hero = sec(sections, 'sec-0', 'heroSection')
  hero.heading = six(ANN_TITLE, 'page.our-announcement hero.heading')
  hero.subheading = six(HOTEL_AND_VILLAS, 'page.our-announcement hero.subheading')
  setAlt(hero.background, 'Royal-Ha-Long-Hotel-Overview-03.jpg', ANN_HERO_ALT, 'page.our-announcement hero')
  const list = sec(sections, 'sec-1', 'richTextSection')
  list.content = content('ann1', ANN_ROWS)
  await patchDoc('page.our-announcement', {
    title: six(ANN_TITLE, 'page.our-announcement title'),
    seo: ANN_SEO,
    sections,
  })
}

async function writeReservation() {
  const sections = await sectionsOf('page.reservation')
  const hero = sec(sections, 'sec-0', 'heroSection')
  hero.heading = six(RESV_TITLE, 'page.reservation hero.heading')
  hero.subheading = six(RESV_SUB, 'page.reservation hero.subheading')
  setAlt(hero.background, 'Royal-Ha-Long-Hotel-banner.jpg', RESV_HERO_ALT, 'page.reservation hero')
  // sec-1 là <bookingWidgetSection>: widget SecureBookings không có field chữ
  // nào, nhưng vẫn kiểm để script đứng nếu ai đó đổi khối này đi.
  sec(sections, 'sec-1', 'bookingWidgetSection')
  await patchDoc('page.reservation', {
    title: six(RESV_TITLE, 'page.reservation title'),
    seo: RESV_SEO,
    sections,
  })
}

async function writePayment() {
  const sections = await sectionsOf('page.payment-methods')
  const hero = sec(sections, 'sec-0', 'heroSection')
  hero.heading = six(PAY_TITLE, 'page.payment-methods hero.heading')
  setAlt(hero.background, 'Royal-Halong-Hotel-staff-07.jpg', PAY_HERO_ALT, 'page.payment-methods hero')
  const body = sec(sections, 'sec-1', 'richTextSection')
  body.content = content('pay1', PAY_1)
  await patchDoc('page.payment-methods', {
    title: six(PAY_TITLE, 'page.payment-methods title'),
    seo: PAY_SEO,
    sections,
  })
}

/** Một khối văn bản pháp lý: tiêu đề (có thể không có) + nội dung. */
type LegalBlock = { key: string; heading?: Six; rows: Six[] }

async function writeLegal(
  id: string,
  title: Six,
  heroFile: string,
  heroAlt: Six,
  seoObj: ReturnType<typeof seo>,
  blocks: LegalBlock[],
) {
  const sections = await sectionsOf(id)
  const hero = sec(sections, 'sec-0', 'heroSection')
  hero.heading = six(title, `${id} hero.heading`)
  setAlt(hero.background, heroFile, heroAlt, `${id} hero`)
  for (const b of blocks) {
    const s = sec(sections, b.key, 'richTextSection')
    if (b.heading) s.heading = six(b.heading, `${id} ${b.key}.heading`)
    s.content = content(`${id}-${b.key}`, b.rows)
  }
  // Mọi richTextSection trong document phải nằm trong danh sách trên — thiếu
  // một khối nghĩa là có điều khoản không được dịch mà không ai biết.
  const covered = new Set(blocks.map((b) => b.key))
  for (const s of sections) {
    if (s._type === 'richTextSection' && !covered.has(s._key)) {
      throw new Error(`${id}: khối "${s._key}" chưa có bản dịch trong script`)
    }
  }
  await patchDoc(id, { title: six(title, `${id} title`), seo: seoObj, sections })
}

const PRIVACY_BLOCKS: LegalBlock[] = [
  { key: 'sec-1', rows: PRIV_1 },
  { key: 'sec-2', heading: PRIV_2_H, rows: PRIV_2 },
  { key: 'sec-3', heading: PRIV_3_H, rows: PRIV_3 },
  { key: 'sec-4', heading: PRIV_4_H, rows: PRIV_4 },
  { key: 'sec-5', heading: PRIV_5_H, rows: PRIV_5 },
  { key: 'sec-6', heading: PRIV_6_H, rows: PRIV_6 },
  { key: 'sec-7', heading: PRIV_7_H, rows: PRIV_7 },
  { key: 'sec-8', heading: PRIV_8_H, rows: PRIV_8 },
  { key: 'sec-9', heading: PRIV_9_H, rows: PRIV_9 },
  { key: 'sec-10', heading: PRIV_10_H, rows: PRIV_10 },
  { key: 'sec-11', heading: PRIV_11_H, rows: PRIV_11 },
  { key: 'sec-12', heading: PRIV_12_H, rows: PRIV_12 },
  { key: 'sec-13', heading: PRIV_13_H, rows: PRIV_13 },
  { key: 'sec-14', heading: PRIV_14_H, rows: PRIV_14 },
  { key: 'sec-15', heading: PRIV_15_H, rows: PRIV_15 },
  { key: 'sec-16', heading: PRIV_16_H, rows: PRIV_16 },
  { key: 'sec-17', heading: PRIV_17_H, rows: PRIV_17 },
  { key: 'sec-18', heading: PRIV_18_H, rows: PRIV_18 },
]

const TERMS_BLOCKS: LegalBlock[] = [
  { key: 'sec-1', heading: TERM_1_H, rows: TERM_1 },
  { key: 'sec-2', heading: TERM_2_H, rows: TERM_2 },
  { key: 'sec-3', heading: TERM_3_H, rows: TERM_3 },
  { key: 'sec-4', heading: TERM_4_H, rows: TERM_4 },
  { key: 'sec-5', heading: TERM_5_H, rows: TERM_5 },
  { key: 'sec-6', heading: TERM_6_H, rows: TERM_6 },
  { key: 'sec-7', heading: TERM_7_H, rows: TERM_7 },
  { key: 'sec-8', heading: TERM_8_H, rows: TERM_8 },
  { key: 'sec-9', heading: TERM_9_H, rows: TERM_9 },
  { key: 'sec-10', heading: TERM_10_H, rows: TERM_10 },
]

/* ------------------------------------------------------------------ */

async function writePost(
  id: string,
  keyBase: string,
  title: Six,
  excerpt: Six,
  bodyRows: Six[],
  coverFile: string,
  coverAlt: Six,
  seoObj: ReturnType<typeof seo>,
) {
  const doc: any = await getDoc(id)
  if (!doc) throw new Error(`${id}: không có document`)
  if (!doc.coverImage) throw new Error(`${id}: không có coverImage`)
  const cover = JSON.parse(JSON.stringify(doc.coverImage))
  setAlt(cover, coverFile, coverAlt, `${id} coverImage`)
  await patchDoc(id, {
    title: six(title, `${id} title`),
    excerpt: six(excerpt, `${id} excerpt`),
    body: content(keyBase, bodyRows),
    coverImage: cover,
    seo: seoObj,
  })
}

/* ------------------------------------------------------------------ */

const IDS = [
  'page.news',
  'page.our-announcement',
  'page.payment-methods',
  'page.reservation',
  'page.privacy-policy',
  'page.terms-and-conditions',
  'post.canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
  'post.quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh',
  'post.thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong',
]

async function main() {
  console.log('Tin tức + tiện ích + pháp lý — ghi 9 document\n')

  await writeNews()
  await writeAnnouncement()
  await writeReservation()
  await writePayment()

  await writeLegal(
    'page.privacy-policy',
    PRIV_TITLE,
    'chinh-sach-bao-mat.jpg',
    PRIV_HERO_ALT,
    PRIV_SEO,
    PRIVACY_BLOCKS,
  )
  await writeLegal(
    'page.terms-and-conditions',
    TERM_TITLE,
    'Royal-Ha-Long-Lobby-01.jpg',
    TERM_HERO_ALT,
    TERM_SEO,
    TERMS_BLOCKS,
  )

  await writePost(
    'post.canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
    'fb',
    POST_FB_TITLE,
    POST_FB_EXCERPT,
    POST_FB_BODY,
    'Facebook.jpg',
    POST_FB_ALT,
    POST_FB_SEO,
  )
  await writePost(
    'post.quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh',
    'q2',
    POST_Q2_TITLE,
    POST_Q2_EXCERPT,
    POST_Q2_BODY,
    'Royal-Ha-Long-slider-01.jpg',
    POST_Q2_ALT,
    POST_Q2_SEO,
  )
  await writePost(
    'post.thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong',
    'pr',
    POST_PR_TITLE,
    POST_PR_EXCERPT,
    POST_PR_BODY,
    'Royal-Ha-Long-Gallery-Hotel-06.jpg',
    POST_PR_ALT,
    POST_PR_SEO,
  )

  console.log('\nSoát lại:')
  let holes = 0
  for (const id of IDS) holes += await assertFullyTranslated(id)
  if (holes) {
    console.error(`\n✗ còn ${holes} field chưa đủ 6 ngôn ngữ`)
    process.exit(1)
  }
  console.log(`\n✓ ${IDS.length} document, 0 field thiếu bản dịch`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
