/**
 * Nhóm C — Hội nghị & Tiệc cưới.
 *
 * Ghi vào ĐÚNG năm document: `page.royal-international-convention-palace`,
 * `page.wedding`, `hall.ha-long`, `hall.hoang-gia`, `hall.royal-bay-lounge`.
 * Không chạm vào document của nhóm khác — `galleryAlbum.cung-hoi-nghi` và
 * `galleryAlbum.tiec-cuoi` chỉ được THAM CHIẾU.
 *
 * Chạy: `npx tsx scripts/content/hoi-nghi-tiec-cuoi.ts`
 * Idempotent: `resetKeys()` ở đầu + thứ tự dựng cố định => `_key` giống hệt
 * nhau qua mọi lần chạy, `patchDoc` ghi đè đúng cùng một cấu trúc.
 *
 * NGUỒN SỐ LIỆU (không có số nào tự bịa):
 * - `royal-international-convention-palace/index.html` — văn bản giới thiệu,
 *   quy mô 5 tầng / 2 ballroom / 3 phòng họp, tổng sức chứa gần 2.000 khách.
 * - `wp-content/uploads/2023/05/COVENTION-PALACE-CAPACITY-6.jpg` — bảng "SƠ ĐỒ
 *   MẶT BẰNG VÀ SỨC CHỨA" của chính khách sạn: diện tích, kích thước và sức
 *   chứa 17 phòng theo sáu kiểu bố trí. Đây là nguồn CHỐT cho mọi con số m².
 * - `wedding/index.html` — đoạn giới thiệu tiệc cưới, số hotline ở chân trang.
 *
 * MÂU THUẪN ĐÃ XỬ LÝ (xem NOTES của cặp):
 * - `hall.ha-long.areaSqm` = 762 (Sanity) / "762 M2" (tiêu đề HTML) nhưng phần
 *   mô tả HTML và bảng sức chứa đều ghi **768**  -> lấy 768.
 * - `hall.hoang-gia.areaSqm` = 762 (Sanity) / "762 M2" (tiêu đề HTML) nhưng
 *   phần mô tả HTML và bảng sức chứa đều ghi **672** -> lấy 672.
 *   "762" là lỗi gõ ở tiêu đề của bản clone, bị chép sang Sanity cho CẢ HAI
 *   sảnh — cùng một con số sai cho hai phòng khác nhau là bằng chứng rõ nhất.
 *
 * VÒNG 2 (Agent 2 — Dịch & soát): 103 field còn trống zh/ko/ja/th đã được điền.
 * Ba helper nháp `draft()` / `draftBlock()` / `dfig()` của vòng 1 đã bỏ, thay
 * bằng `loc()` / `blockLoc()` / `fig()` của `build.ts` — ba hàm này NÉM LỖI khi
 * thiếu bất kỳ ngôn ngữ nào, nên từ nay không thể lặng lẽ để sót một bản dịch.
 *
 * QUY ƯỚC DỊCH (theo `GLOSSARY.md`, khớp với menu đã dịch ở `chrome.ts`):
 * - "CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG" = 皇家国际会议宫 · 로열 인터내셔널
 *   컨벤션 팰리스 · ロイヤル国際コンベンションパレス · รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ.
 *   Lấy NGUYÊN dạng trong `chrome.ts` (mục con `nav-3-1`) — lệch một chữ là
 *   khách bấm menu rồi vào trang thấy tên khác.
 * - Tên riêng giữ nguyên ở cả sáu: `Ha Long Ball Room`, `Hoang Gia Ball Room`,
 *   `Royal / Bay Lounge`, `Bái Tử Long` (giữ cả dấu tiếng Việt), `PV - VIP`,
 *   `Royal Ha Long Hotel`.
 * - Sáu kiểu bố trí dùng thuật ngữ MICE bản địa, KHÔNG dịch nghĩa đen:
 *   nhà hát = 剧院式 / 극장식 / シアター形式 / แบบโรงละคร;
 *   vuông rỗng = 回字型 / ㅁ자형 / 口の字形 / แบบสี่เหลี่ยมกลวง; v.v.
 * - Đơn vị diện tích: zh/ko/ja giữ "m²", th dùng "ตร.ม." theo lối viết bản địa.
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { key, resetKeys, loc, blockLoc, fig, linkTo } from './build'
import { patchDoc, assertFullyTranslated } from './write'

resetKeys()

/* ------------------------------------------------------------------ *
 * Helper
 * ------------------------------------------------------------------ */

type Six = Record<Locale, string>

/** Chuỗi GIỐNG NHAU ở cả sáu ngôn ngữ — tên riêng và con số thuần.
 * Dịch "Ha Long Ball Room" hay "768" là sai, nên không đi qua `loc()`. */
function same(v: string): Six {
  return Object.fromEntries(LOCALES.map((l) => [l, v])) as Six
}

/** Số có dấu phân cách hàng nghìn: `vi` dùng dấu chấm, năm ngôn ngữ còn lại
 * dùng dấu phẩy. */
function n(value: number): Six {
  const grouped = value.toLocaleString('en-US')
  return { vi: grouped.replace(/,/g, '.'), en: grouped, zh: grouped, ko: grouped, ja: grouped, th: grouped }
}

/** "1.000 khách" / "1,000 guests" / … — dạng lấy thẳng từ GLOSSARY.md
 * (Khách | guests | 位客人 | 명 | 名 | ท่าน). */
function guests(value: number): Six {
  const num = n(value)
  return {
    vi: `${num.vi} khách`,
    en: `${num.en} guests`,
    zh: `${num.zh} 位客人`,
    ko: `${num.ko}명`,
    ja: `${num.ja}名`,
    th: `${num.th} ท่าน`,
  }
}

const usedImages = new Set<string>()

/** `fig()` của build.ts + ghi lại tên file để in ra ở cuối. */
function image(name: string, alt: Six) {
  usedImages.add(name)
  return fig(name, loc(alt))
}

/** Một ô `localeString` trong mảng (headers / cells) — Sanity đòi `_key`. */
function cell(value: Six) {
  return { _type: 'localeString', _key: key('c'), ...value }
}

/**
 * `localeSlug` đủ sáu ngôn ngữ, CÙNG MỘT giá trị.
 *
 * Không dịch đường dẫn: `/en/wedding` và `/ja/wedding` phải giữ nguyên (điều
 * phối viên kiểm bằng đúng URL đó), và mọi liên kết ngoài đang trỏ vào slug
 * này. Điền đủ sáu thay vì để trống `en..th` chỉ để `assertFullyTranslated`
 * không báo giả — `resolveSlug()` vốn đã rơi về `vi`, nên kết quả định tuyến
 * trước và sau khi điền là y hệt nhau.
 */
function slugAll(current: string) {
  return Object.fromEntries(
    LOCALES.map((l) => [l, { _type: 'slug', current }]),
  ) as Record<Locale, { _type: string; current: string }>
}

/* ------------------------------------------------------------------ *
 * Cụm từ dùng lại ở cả hai trang — khai một chỗ để sáu ngôn ngữ không trôi
 * khỏi nhau giữa trang Cung Hội nghị và trang Tiệc cưới.
 * ------------------------------------------------------------------ */

/** Tên Cung Hội nghị, dạng VIẾT HOA của hero. Khớp `nav-3-1` trong chrome.ts. */
const PALACE_CAPS: Six = {
  vi: 'CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG',
  en: 'ROYAL INTERNATIONAL CONVENTION PALACE',
  zh: '皇家国际会议宫',
  ko: '로열 인터내셔널 컨벤션 팰리스',
  ja: 'ロイヤル国際コンベンションパレス',
  th: 'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
}

/** Cùng tên đó trong câu văn (en viết thường theo lối câu). */
const PALACE: Six = {
  vi: 'Cung Hội nghị Quốc tế Hoàng Gia Hạ Long',
  en: 'Royal International Convention Palace',
  zh: '皇家国际会议宫',
  ko: '로열 인터내셔널 컨벤션 팰리스',
  ja: 'ロイヤル国際コンベンションパレス',
  th: 'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
}

/** "TIỆC CƯỚI" — lấy từ GLOSSARY.md, khớp mục menu `nav-3-0`. */
const WEDDINGS_CAPS: Six = {
  vi: 'TIỆC CƯỚI',
  en: 'WEDDINGS',
  zh: '婚礼',
  ko: '웨딩',
  ja: 'ウエディング',
  th: 'งานแต่งงาน',
}

/* ------------------------------------------------------------------ *
 * BẢNG SỨC CHỨA — chép nguyên từ COVENTION-PALACE-CAPACITY-6.jpg
 * ------------------------------------------------------------------ */

const DASH = same('—')

/** "16 (Round)" / "18 (Long Table)" trên bảng gốc — có chữ nên phải dịch. */
const ROUND_16: Six = {
  vi: '16 (bàn tròn)',
  en: '16 (round table)',
  zh: '16（圆桌）',
  ko: '16 (원형 테이블)',
  ja: '16（円卓）',
  th: '16 (โต๊ะกลม)',
}
const LONG_18: Six = {
  vi: '18 (bàn dài)',
  en: '18 (long table)',
  zh: '18（长桌）',
  ko: '18 (긴 테이블)',
  ja: '18（長テーブル）',
  th: '18 (โต๊ะยาว)',
}

/** Sáu kiểu bố trí — dùng chung cho tiêu đề cột của bảng và `hall.layouts[]`,
 * nên không thể lệch nhau giữa bảng và thẻ sảnh. Thuật ngữ MICE bản địa:
 * người đọc tiếng Nhật tìm "シアター形式" chứ không tìm "劇場スタイル". */
const L_BANQUET: Six = { vi: 'Tiệc ngồi', en: 'Banquet', zh: '宴会式', ko: '연회식', ja: 'バンケット', th: 'แบบจัดเลี้ยง' }
const L_CLASSROOM: Six = { vi: 'Lớp học', en: 'Classroom', zh: '课堂式', ko: '교실식', ja: 'スクール', th: 'แบบห้องเรียน' }
const L_DOUBLE_U: Six = { vi: 'Chữ U đôi', en: 'Double U-shape', zh: '双U型', ko: '더블 U자형', ja: '二重U字', th: 'แบบตัวยูคู่' }
const L_THEATRE: Six = { vi: 'Nhà hát', en: 'Theatre', zh: '剧院式', ko: '극장식', ja: 'シアター', th: 'แบบโรงละคร' }
const L_HOLLOW: Six = { vi: 'Vuông rỗng', en: 'Hollow square', zh: '回字型', ko: 'ㅁ자형', ja: '口の字', th: 'แบบสี่เหลี่ยมกลวง' }
const L_COCKTAIL: Six = { vi: 'Tiệc đứng', en: 'Standing cocktail', zh: '鸡尾酒会式', ko: '칵테일식', ja: 'カクテル', th: 'แบบค็อกเทล' }

/** [tên phòng, diện tích m², kích thước vi, kích thước en, tiệc ngồi, lớp học,
 *  chữ U đôi, nhà hát, vuông rỗng, tiệc đứng]. `null` = ô gạch ngang. */
type Row = [string, number, string, string, unknown, number | null, number | null, number | null, number | null, number | null]

const CAPACITY_ROWS: Row[] = [
  ['Ha Long Ball Room', 768, '32 × 24', '32 × 24', 550, 430, 430, 1000, 300, 1000],
  ['Ha Long 1', 384, '16 × 24', '16 × 24', 230, 200, 200, 350, 180, 300],
  ['Ha Long 2', 384, '16 × 24', '16 × 24', 230, 200, 200, 350, 180, 300],
  ['Hoang Gia Ball Room', 672, '21 × 32', '21 × 32', 350, 220, 220, 360, 190, 650],
  ['Hoang Gia 1+2', 504, '21 × 24', '21 × 24', 240, 150, 150, 280, 140, 500],
  ['Hoang Gia 1', 336, '21 × 16', '21 × 16', 140, 80, 80, 140, 80, 280],
  ['Hoang Gia 2+3', 336, '21 × 16', '21 × 16', 140, 80, 80, 140, 80, 280],
  ['Hoang Gia 2', 168, '21 × 8', '21 × 8', 100, 80, 80, 140, 72, 180],
  ['Hoang Gia 3', 168, '21 × 8', '21 × 8', 100, 80, 80, 140, 72, 180],
  ['Bay Lounge', 36, '5,2 × 7', '5.2 × 7', ROUND_16, null, null, null, null, null],
  ['Royal Lounge', 36, '5,2 × 7', '5.2 × 7', LONG_18, null, null, null, null, null],
  ['Lobby', 144, '24 × 6', '24 × 6', 100, null, null, null, null, null],
  ['Bái Tử Long 1', 64, '8 × 8', '8 × 8', 50, 40, 24, 50, 36, 50],
  ['Bái Tử Long 2', 32, '4 × 8', '4 × 8', 24, 24, 24, 30, 24, 30],
  ['PV - VIP 1', 60, '8 × 7,5', '8 × 7.5', 30, null, null, null, null, null],
  ['PV - VIP 2', 20, '6 × 3,5', '6 × 3.5', 10, null, null, null, null, null],
  ['PV - VIP 3', 20, '6 × 3,5', '6 × 3.5', 10, null, null, null, null, null],
]

function capacityCell(value: unknown) {
  if (value === null) return cell(DASH)
  if (typeof value === 'number') return cell(n(value))
  return cell(value as Six)
}

const capacityTable = {
  _type: 'tableSection',
  _key: 'sec-capacity',
  heading: loc({
    vi: 'Sơ đồ mặt bằng và sức chứa',
    en: 'Floor plan and capacity',
    zh: '平面图与容纳人数',
    ko: '평면도 및 수용 인원',
    ja: 'フロアプランと収容人数',
    th: 'ผังพื้นที่และความจุ',
  }),
  caption: loc({
    vi: 'Số khách tối đa của từng phòng theo sáu kiểu bố trí. Số liệu lấy từ sơ đồ mặt bằng chính thức của Cung Hội nghị Quốc tế Hoàng Gia Hạ Long.',
    en: 'Maximum number of guests per room in each of six layouts, taken from the official floor plan of the Royal International Convention Palace.',
    zh: '各厅在六种布置方式下的最大容纳人数，数据取自皇家国际会议宫的官方平面图。',
    ko: '여섯 가지 배치 방식에 따른 각 회의실의 최대 수용 인원입니다. 로열 인터내셔널 컨벤션 팰리스의 공식 평면도를 기준으로 합니다.',
    ja: '六つのレイアウトごとの各会場の最大収容人数です。ロイヤル国際コンベンションパレスの公式フロアプランに基づいています。',
    th: 'จำนวนแขกสูงสุดของแต่ละห้องตามรูปแบบการจัดที่นั่งทั้งหกแบบ ข้อมูลอ้างอิงจากผังพื้นที่อย่างเป็นทางการของรอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
  }),
  headers: [
    cell(loc({ vi: 'Phòng họp', en: 'Meeting room', zh: '会议室', ko: '회의실', ja: '会場', th: 'ห้องประชุม' })),
    cell(loc({ vi: 'Diện tích (m²)', en: 'Area (m²)', zh: '面积 (m²)', ko: '면적 (m²)', ja: '面積 (m²)', th: 'พื้นที่ (ตร.ม.)' })),
    // Ở 390px bảng 9 cột ép mỗi cột còn ~46px. Tiêu đề cột này là ô dài nhất
    // và nó quyết định chiều cao CẢ HÀNG tiêu đề: bản đầu ghi
    // '크기 가로 × 세로 (m)' xuống dòng MỘT CHỮ MỘT DÒNG thành 8 dòng (đo:
    // hàng tiêu đề 177px ở ko, 137px ở zh/ja). Bỏ danh từ dẫn ('크기' / '尺寸'
    // / '寸法' / 'ขนาด') — cột đã đứng cạnh cột diện tích nên không mơ hồ, và
    // 'dài × rộng' vẫn còn nguyên.
    cell(loc({
      vi: 'Kích thước D × R (m)',
      en: 'Dimensions L × W (m)',
      zh: '长×宽 (m)',
      ko: '가로×세로 (m)',
      ja: '縦×横 (m)',
      th: 'ยาว × กว้าง (ม.)',
    })),
    cell(loc(L_BANQUET)),
    cell(loc(L_CLASSROOM)),
    cell(loc(L_DOUBLE_U)),
    cell(loc(L_THEATRE)),
    cell(loc(L_HOLLOW)),
    cell(loc(L_COCKTAIL)),
  ],
  rows: CAPACITY_ROWS.map((row) => {
    const [name, area, dimVi, dimEn, ...rest] = row
    return {
      _type: 'row',
      _key: key('tr'),
      cells: [
        cell(same(name)),
        cell(n(area)),
        cell({ vi: dimVi, en: dimEn, zh: dimEn, ko: dimEn, ja: dimEn, th: dimEn }),
        ...rest.map(capacityCell),
      ],
    }
  }),
}

/* ================================================================== *
 * TRANG 1 — CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG
 * ================================================================== */

const conventionSections = [
  {
    _type: 'heroSection',
    _key: 'sec-hero',
    heading: loc(PALACE_CAPS),
    subheading: loc({
      vi: 'HỘI NGHỊ & SỰ KIỆN',
      en: 'MEETINGS & EVENTS',
      zh: '会议与活动',
      ko: '회의 & 행사',
      ja: '会議・イベント',
      th: 'การประชุมและอีเวนต์',
    }),
    background: image('ROYAL-INTERNATIONAL-CONVENTION-PALACE2.jpg', {
      vi: 'Đại sảnh Cung Hội nghị: sàn đá đen bóng khảm hoa văn tròn, tường ốp trắng viền vàng và ba chùm đèn pha lê dưới trần vòm vẽ mây trời',
      en: 'The Convention Palace foyer: a polished black stone floor with inlaid medallions, white panelled walls picked out in gold, and three crystal chandeliers under sky-painted ceiling domes',
      zh: '会议宫大堂：抛光黑色石材地面镶嵌圆形花纹，白色护墙板描金边，三盏水晶吊灯悬于绘有蓝天白云的穹顶之下',
      ko: '컨벤션 팰리스 로비: 원형 문양을 상감한 광택 검은 석재 바닥, 금테를 두른 흰색 패널 벽, 하늘과 구름을 그린 돔 천장 아래 놓인 크리스털 샹들리에 세 개',
      ja: 'コンベンションパレスのロビー。円形の紋様を象嵌した黒い磨き石の床、金の縁取りを施した白い羽目板の壁、青空と雲を描いたドーム天井の下に三基のクリスタルシャンデリアが下がる',
      th: 'โถงต้อนรับของคอนเวนชัน พาเลซ พื้นหินสีดำขัดเงาฝังลวดลายวงกลม ผนังบุไม้สีขาวขอบทอง และโคมระย้าคริสตัลสามช่อใต้เพดานโดมที่วาดเป็นท้องฟ้ากับหมู่เมฆ',
    }),
    height: 'full',
  },
  {
    _type: 'imageTextSection',
    _key: 'sec-intro',
    // KHÔNG lặp lại 'HỘI NGHỊ & SỰ KIỆN' của hero ngay bên trên: hai dòng chữ
    // nhỏ giống hệt nhau cách nhau một màn hình đọc ra như lỗi dựng trang.
    eyebrow: loc({
      vi: 'ĐIỂM ĐẾN MICE',
      en: 'A MICE DESTINATION',
      zh: 'MICE 目的地',
      ko: 'MICE 목적지',
      ja: 'MICEデスティネーション',
      th: 'จุดหมาย MICE',
    }),
    heading: loc({
      vi: 'Cung hội nghị đẳng cấp thế giới',
      en: 'A convention palace built for world-class events',
      zh: '世界级规格的会议宫',
      ko: '세계적 수준의 행사를 위한 컨벤션 팰리스',
      ja: '世界水準のイベントのためのコンベンションパレス',
      th: 'คอนเวนชัน พาเลซ สำหรับงานระดับโลก',
    }),
    content: blockLoc({
      vi: [
        'Cung Hội nghị Quốc tế Hoàng Gia Hạ Long mang thiết kế cổ điển của cung điện hoàng gia châu Âu, với cách bố trí phòng họp và đại sảnh khoa học, hiện đại, đa chức năng, đáp ứng được những sự kiện lớn có yêu cầu rất khác nhau. Đây là điểm đến tổ chức sự kiện hàng đầu của vùng duyên hải Bắc Bộ, và là cú hích được kỳ vọng cho du lịch MICE của tỉnh Quảng Ninh.',
        '- Quy mô 5 tầng, gồm 2 phòng ballroom và 3 phòng họp chức năng',
        '- Tổng sức chứa lên tới gần 2.000 khách',
        '- Thiết kế tân cổ điển, kết nối thuận tiện với hệ thống nhà hàng, bar và cafe của khách sạn',
      ],
      en: [
        'The Royal International Convention Palace takes its design from the classical royal palaces of Europe, and arranges its meeting rooms and grand foyers so that very different kinds of large event can run in the same building. It is one of the leading event addresses on the northern coast of Vietnam, and the venue on which Quang Ninh province has pinned its hopes for MICE tourism.',
        '- Five floors, holding two ballrooms and three function rooms',
        '- Close to 2,000 guests in total',
        '- Neo-classical interiors, connected directly to the hotel’s restaurants, bars and cafe',
      ],
      zh: [
        '皇家国际会议宫以欧洲皇家宫殿的古典风格建成，会议室与大堂的布局科学、现代而多功能，足以承接要求迥异的大型活动。这里是越南北部沿海地区首屈一指的活动举办地，也是广宁省寄望推动 MICE 旅游的一处标志性场所。',
        '- 共 5 层，设 2 间宴会厅与 3 间多功能会议室',
        '- 总容纳人数近 2,000 位客人',
        '- 新古典主义室内设计，与酒店的餐厅、酒吧和咖啡厅直接相连',
      ],
      ko: [
        '로열 인터내셔널 컨벤션 팰리스는 유럽 왕궁의 고전적인 양식을 따라 지었으며, 회의실과 그랜드 로비를 합리적이고 현대적이며 다목적으로 배치해 성격이 전혀 다른 대형 행사도 한 건물에서 치를 수 있습니다. 베트남 북부 해안을 대표하는 행사 공간이자, 꽝닌성이 MICE 관광의 도약을 기대하는 곳입니다.',
        '- 5개 층, 볼룸 2개와 다목적 회의실 3개',
        '- 총 수용 인원 약 2,000명',
        '- 신고전주의 인테리어, 호텔의 레스토랑과 바, 카페와 바로 연결',
      ],
      ja: [
        'ロイヤル国際コンベンションパレスは、ヨーロッパの王宮に見られる古典様式を受け継ぎ、会議室と大ホールを合理的かつ現代的な多目的レイアウトで配しています。性格の異なる大型イベントを同じ建物で進行できるのが特徴です。ベトナム北部沿岸を代表するイベント会場であり、クアンニン省がMICE観光の起爆剤として期待を寄せる施設でもあります。',
        '- 5階建て、ボールルーム2室と多目的会議室3室',
        '- 総収容人数は約2,000名',
        '- ネオクラシカルの内装。ホテルのレストラン、バー、カフェと直結',
      ],
      th: [
        'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ ออกแบบตามแบบพระราชวังคลาสสิกของยุโรป จัดวางห้องประชุมและโถงใหญ่อย่างเป็นระบบ ทันสมัย และใช้งานได้หลากหลาย รองรับงานขนาดใหญ่ที่มีความต้องการแตกต่างกันได้ในอาคารเดียว ที่นี่คือจุดหมายการจัดงานชั้นนำของชายฝั่งภาคเหนือเวียดนาม และเป็นความหวังของจังหวัดกว๋างนิญในการผลักดันการท่องเที่ยวเชิง MICE',
        '- อาคาร 5 ชั้น มีบอลรูม 2 ห้องและห้องประชุมอเนกประสงค์ 3 ห้อง',
        '- ความจุรวมเกือบ 2,000 ท่าน',
        '- ตกแต่งสไตล์นีโอคลาสสิก เชื่อมต่อโดยตรงกับร้านอาหาร บาร์ และคาเฟ่ของโรงแรม',
      ],
    }),
    image: image('Convention-Center-Halong-04.jpg', {
      vi: 'Ballroom bày tiệc: hàng chục bàn tròn phủ khăn trắng hướng về sân khấu màn hình LED, đèn chùm pha lê dọc hai bên và đèn sân khấu vàng xanh hắt lên trần',
      en: 'A ballroom laid for a banquet: dozens of round tables in white linen facing an LED stage, crystal chandeliers down both sides and yellow-and-blue stage lights washing the ceiling',
      zh: '宴会厅摆台：数十张铺白色桌布的圆桌面向 LED 屏舞台，两侧悬挂水晶吊灯，黄蓝舞台灯光投射在天花板上',
      ko: '연회를 차린 볼룸: 흰 리넨을 씌운 원형 테이블 수십 개가 LED 무대를 향하고, 양옆으로 크리스털 샹들리에가 이어지며 노란색과 푸른색 무대 조명이 천장을 비춥니다',
      ja: '宴会の準備が整ったボールルーム。白いクロスを掛けた円卓が数十卓、LEDスクリーンの舞台を向いて並び、両側にクリスタルシャンデリア、黄と青の舞台照明が天井を照らす',
      th: 'บอลรูมที่จัดโต๊ะจัดเลี้ยง โต๊ะกลมปูผ้าขาวหลายสิบตัวหันเข้าหาเวทีจอ LED มีโคมระย้าคริสตัลเรียงสองข้างและไฟเวทีสีเหลืองน้ำเงินสาดขึ้นเพดาน',
    }),
    imageSide: 'right',
    tone: 'white',
    imageFit: 'cover',
  },
  {
    _type: 'hallListSection',
    _key: 'sec-halls',
    heading: loc({
      vi: 'Các sảnh và phòng họp',
      en: 'Halls and meeting rooms',
      zh: '各宴会厅与会议室',
      ko: '연회장과 회의실',
      ja: 'ボールルームと会議室',
      th: 'ห้องจัดเลี้ยงและห้องประชุม',
    }),
  },
  capacityTable,
  {
    _type: 'imageTextSection',
    _key: 'sec-layouts',
    eyebrow: loc({ vi: 'BỐ TRÍ', en: 'LAYOUTS', zh: '布置方式', ko: '배치', ja: 'レイアウト', th: 'การจัดผัง' }),
    heading: loc({
      vi: 'Sáu kiểu bố trí, hai ballroom chia được',
      en: 'Six seating layouts, two ballrooms that divide',
      zh: '六种布置方式，两间宴会厅皆可分隔',
      ko: '여섯 가지 배치, 나눌 수 있는 두 개의 볼룸',
      ja: '六つのレイアウト、分割できる二つのボールルーム',
      th: 'หกรูปแบบการจัดที่นั่ง และบอลรูมสองห้องที่แบ่งได้',
    }),
    content: blockLoc({
      vi: [
        'Mỗi sảnh được kê theo sáu kiểu: tiệc ngồi, lớp học, chữ U đôi, nhà hát, vuông rỗng và tiệc đứng. Bảng bên trên cho số khách tối đa của từng kiểu, để ban tổ chức và bộ phận hội nghị làm việc trên cùng một con số ngay từ cuộc gọi đầu tiên.',
        'Hai phòng ballroom đều chia được bằng vách ngăn. Ha Long 768 m² tách thành hai sảnh 384 m², mỗi sảnh nhận 230 khách tiệc ngồi. Hoang Gia 672 m² tách thành các phòng 504 m², 336 m² và 168 m². Nhờ vậy một hội nghị buổi sáng và một tiệc tối có thể chạy song song trong cùng toà nhà, không phải dọn sảnh giữa chừng.',
      ],
      en: [
        'Every hall is set in one of six layouts — banquet, classroom, double U-shape, theatre, hollow square and standing cocktail. The table above gives the maximum head count for each one, so that the organiser and the conference team work from the same figure on the very first call.',
        'Both ballrooms divide with movable partitions. Ha Long, 768 m², splits into two 384 m² halls seating 230 each at a banquet. Hoang Gia, 672 m², splits into rooms of 504 m², 336 m² and 168 m². A morning conference and an evening banquet can therefore run in parallel in the same building, with no turnaround in between.',
      ],
      zh: [
        '每个厅可按六种方式布置：宴会式、课堂式、双U型、剧院式、回字型和鸡尾酒会式。上方表格列出每种方式的最大接待人数，让主办方与会议部门从第一通电话起就依据同一组数字商讨。',
        '两间宴会厅均可用活动隔断分隔。Ha Long Ball Room 768 m² 可分为两个 384 m² 的厅，每厅宴会式接待 230 位客人；Hoang Gia Ball Room 672 m² 可分为 504 m²、336 m² 和 168 m² 的房间。因此上午的会议与晚上的宴会可以在同一栋楼内并行，中途无需撤场重摆。',
      ],
      ko: [
        '각 홀은 연회식, 교실식, 더블 U자형, 극장식, ㅁ자형, 칵테일식 등 여섯 가지로 배치할 수 있습니다. 위 표에 배치별 최대 인원을 정리해 두어, 주최 측과 컨벤션팀이 첫 통화부터 같은 숫자를 놓고 논의할 수 있습니다.',
        '두 볼룸 모두 이동식 파티션으로 나뉩니다. 768 m²의 Ha Long Ball Room은 384 m² 홀 두 개로 나뉘어 각각 연회식 230명을 수용하고, 672 m²의 Hoang Gia Ball Room은 504 m², 336 m², 168 m² 규모로 나뉩니다. 덕분에 오전 회의와 저녁 연회를 같은 건물에서 나란히 진행할 수 있고, 중간에 장을 다시 차릴 필요가 없습니다.',
      ],
      ja: [
        '各ホールはバンケット形式、スクール形式、二重U字形、シアター形式、口の字形、カクテル形式の六通りに設営できます。上の表に形式ごとの最大人数をまとめているため、主催者と宴会担当は最初の一本の電話から同じ数字を見て打ち合わせができます。',
        '二つのボールルームはいずれも可動間仕切りで分割できます。768 m²のHa Long Ball Roomは384 m²のホール二つに分かれ、それぞれバンケット形式で230名。672 m²のHoang Gia Ball Roomは504 m²、336 m²、168 m²に分かれます。午前の会議と夜の宴会を同じ建物で並行して進められ、途中で設営をやり直す必要がありません。',
      ],
      th: [
        'แต่ละห้องจัดได้หกรูปแบบ ได้แก่ แบบจัดเลี้ยง แบบห้องเรียน แบบตัวยูคู่ แบบโรงละคร แบบสี่เหลี่ยมกลวง และแบบค็อกเทล ตารางด้านบนระบุจำนวนแขกสูงสุดของแต่ละรูปแบบ เพื่อให้ผู้จัดงานและฝ่ายจัดประชุมใช้ตัวเลขชุดเดียวกันตั้งแต่การติดต่อครั้งแรก',
        'บอลรูมทั้งสองห้องแบ่งได้ด้วยผนังกั้นเคลื่อนที่ Ha Long Ball Room ขนาด 768 ตร.ม. แบ่งเป็นสองห้อง ห้องละ 384 ตร.ม. รองรับแบบจัดเลี้ยงห้องละ 230 ท่าน ส่วน Hoang Gia Ball Room ขนาด 672 ตร.ม. แบ่งเป็นห้องขนาด 504, 336 และ 168 ตร.ม. งานประชุมช่วงเช้าและงานเลี้ยงช่วงค่ำจึงจัดคู่ขนานในอาคารเดียวกันได้ โดยไม่ต้องรื้อจัดใหม่ระหว่างวัน',
      ],
    }),
    image: image('Royal-Ha-Long-Gallery-Convention-22.jpg', {
      vi: 'Phòng họp kê kiểu vuông rỗng: dãy bàn phủ khăn vàng ghép thành hình chữ nhật lớn, ghế bọc trắng quanh bàn, phông hội nghị trên màn hình ở đầu phòng',
      en: 'A meeting room in hollow-square layout: tables skirted in gold joined into a large rectangle, white-covered chairs around them, and a conference backdrop on the screen at the head of the room',
      zh: '回字型布置的会议室：铺金色桌裙的长桌拼成一个大矩形，四周摆放白色椅套的座椅，房间前端的屏幕上显示会议背景板',
      ko: 'ㅁ자형으로 배치한 회의실: 금색 테이블 스커트를 두른 테이블을 큰 직사각형으로 이어 붙이고 흰 커버를 씌운 의자를 둘렀으며, 정면 스크린에는 회의 배경 화면이 떠 있습니다',
      ja: '口の字形に設営した会議室。金色のテーブルスカートを掛けた机を大きな長方形に組み、白いカバーの椅子を並べ、正面のスクリーンには会議のバックボードが映る',
      th: 'ห้องประชุมจัดแบบสี่เหลี่ยมกลวง โต๊ะคลุมผ้าสีทองต่อกันเป็นสี่เหลี่ยมผืนผ้าขนาดใหญ่ เก้าอี้คลุมผ้าขาวเรียงรอบโต๊ะ และจอด้านหน้าห้องแสดงฉากหลังของงานประชุม',
    }),
    imageSide: 'left',
    tone: 'cream',
    imageFit: 'cover',
  },
  {
    _type: 'imageTextSection',
    _key: 'sec-services',
    eyebrow: loc({ vi: 'DỊCH VỤ', en: 'SERVICES', zh: '配套服务', ko: '서비스', ja: 'サービス', th: 'บริการ' }),
    heading: loc({
      vi: 'Sân khấu, âm thanh, ánh sáng và những phòng nhỏ quanh sự kiện',
      en: 'Stage, sound and light — and the small rooms around the main event',
      zh: '舞台、音响、灯光，以及主会场周边的小房间',
      ko: '무대와 음향, 조명 그리고 행사장 주변의 작은 방들',
      ja: '舞台、音響、照明、そしてメイン会場を囲む小部屋',
      th: 'เวที เสียง แสง และห้องเล็ก ๆ รอบงานหลัก',
    }),
    content: blockLoc({
      vi: [
        'Các sảnh được trang bị hệ thống ánh sáng và âm thanh hiện đại; riêng sảnh Ha Long có khán đài sức chứa lớn cho những chương trình cần chỗ ngồi bậc thang. Sân khấu, màn hình LED và sơ đồ bàn ghế dựng riêng theo từng sự kiện.',
        'Quanh hai phòng ballroom là những không gian phụ trợ mà một sự kiện dài ngày luôn cần: đại sảnh 144 m² đón 100 khách cho tiệc trà và bàn đăng ký, ba phòng VIP 60 m² và 20 m², hai phòng Bái Tử Long 64 m² và 32 m² cho họp nhóm — cùng hệ thống nhà hàng, bar và cafe nối thẳng vào toà nhà.',
      ],
      en: [
        'The halls carry modern sound and lighting systems, and Ha Long adds tiered seating for programmes that need a raked auditorium. Stage, LED screen and seating plan are built for each individual event.',
        'Around the two ballrooms sit the support spaces that a multi-day event always needs: a 144 m² foyer seating 100 for coffee breaks and registration desks, three VIP rooms of 60 m² and 20 m², and two Bái Tử Long rooms of 64 m² and 32 m² for breakout sessions — with the hotel’s restaurants, bars and cafe connected straight into the building.',
      ],
      zh: [
        '各厅均配备现代化的灯光与音响系统；Ha Long Ball Room 另设可容纳大量观众的阶梯看台，适合需要层级座席的节目。舞台、LED 屏幕与桌椅布置图均按每场活动单独搭建。',
        '两间宴会厅周围是多日活动必不可少的配套空间：144 m² 的大堂可接待 100 位客人，用于茶歇与签到台；三间 60 m² 和 20 m² 的 VIP 室；两间 64 m² 和 32 m² 的 Bái Tử Long 分组会议室——以及与楼内直接相连的餐厅、酒吧和咖啡厅。',
      ],
      ko: [
        '모든 홀에 현대적인 조명과 음향 설비를 갖추었고, Ha Long Ball Room에는 계단식 좌석이 필요한 프로그램을 위한 대규모 관람석이 마련되어 있습니다. 무대와 LED 스크린, 좌석 배치도는 행사마다 따로 설계합니다.',
        '두 볼룸 주변에는 여러 날 이어지는 행사에 꼭 필요한 부속 공간이 있습니다. 144 m² 로비는 티 브레이크와 등록 데스크를 위해 100명을 수용하고, 60 m²와 20 m² VIP룸 세 개, 분임 토의를 위한 64 m²와 32 m²의 Bái Tử Long 룸 두 개가 있으며, 레스토랑과 바, 카페가 건물과 바로 이어집니다.',
      ],
      ja: [
        '各ホールには最新の照明・音響設備を備え、Ha Long Ball Roomには段差のある客席を要する演目のための大型スタンド席があります。舞台、LEDスクリーン、テーブルと椅子の配置図はイベントごとに個別に組み立てます。',
        '二つのボールルームの周りには、長期開催のイベントに欠かせない付帯スペースが並びます。144 m²のロビーはティーブレイクと受付デスク用に100名、60 m²と20 m²のVIPルームが三室、分科会向けに64 m²と32 m²のBái Tử Longルームが二室。さらにレストラン、バー、カフェが建物に直結しています。',
      ],
      th: [
        'ทุกห้องติดตั้งระบบแสงและเสียงที่ทันสมัย โดยเฉพาะ Ha Long Ball Room ที่มีอัฒจันทร์ความจุสูงสำหรับรายการที่ต้องใช้ที่นั่งแบบขั้นบันได เวที จอ LED และผังโต๊ะเก้าอี้จัดขึ้นใหม่ตามแต่ละงาน',
        'รอบบอลรูมทั้งสองห้องมีพื้นที่สนับสนุนที่งานหลายวันต้องใช้เสมอ ได้แก่ โถงขนาด 144 ตร.ม. รองรับ 100 ท่านสำหรับพักเบรกและโต๊ะลงทะเบียน ห้อง VIP สามห้องขนาด 60 และ 20 ตร.ม. และห้อง Bái Tử Long สองห้องขนาด 64 และ 32 ตร.ม. สำหรับประชุมกลุ่มย่อย พร้อมร้านอาหาร บาร์ และคาเฟ่ที่เชื่อมตรงเข้าอาคาร',
      ],
    }),
    image: image('Royal-Ha-Long-Gallery-Convention-17.jpg', {
      vi: 'Sảnh kê kiểu nhà hát: hàng trăm ghế phủ áo trắng thắt nơ vàng hướng lên sân khấu màn hình LED, phông sao đen phía sau và đèn chùm pha lê dọc hai bên',
      en: 'A hall in theatre layout: hundreds of white chair covers with gold sashes facing an LED stage, a black star-cloth backdrop behind it and crystal chandeliers down both sides',
      zh: '剧院式布置的大厅：数百把白色椅套配金色蝴蝶结的座椅面向 LED 屏舞台，舞台后是黑色星幕，两侧悬挂水晶吊灯',
      ko: '극장식으로 배치한 홀: 금색 리본을 묶은 흰 의자 커버 수백 개가 LED 무대를 향하고, 무대 뒤에는 검은 별빛 커튼, 양옆에는 크리스털 샹들리에가 이어집니다',
      ja: 'シアター形式に設営したホール。金のリボンを結んだ白い椅子カバーが数百脚、LEDスクリーンの舞台に向かって並び、背後に黒いスタークロス、両側にクリスタルシャンデリアが連なる',
      th: 'ห้องโถงจัดแบบโรงละคร เก้าอี้คลุมผ้าขาวผูกโบว์สีทองหลายร้อยตัวหันเข้าหาเวทีจอ LED ด้านหลังเป็นฉากดาวสีดำ และมีโคมระย้าคริสตัลเรียงสองข้าง',
    }),
    imageSide: 'right',
    tone: 'white',
    imageFit: 'cover',
  },
  {
    _type: 'galleryCarouselSection',
    _key: 'sec-gallery',
    heading: loc({
      vi: 'Bên trong Cung Hội nghị',
      en: 'Inside the Convention Palace',
      zh: '走进会议宫',
      ko: '컨벤션 팰리스 둘러보기',
      ja: 'コンベンションパレスの内側',
      th: 'ภายในคอนเวนชัน พาเลซ',
    }),
    album: { _type: 'reference', _ref: 'galleryAlbum.cung-hoi-nghi' },
  },
  {
    _type: 'leadFormSection',
    _key: 'sec-form',
    heading: loc({
      vi: 'Yêu cầu báo giá hội nghị',
      en: 'Request a conference proposal',
      zh: '索取会议方案与报价',
      ko: '컨벤션 견적 요청',
      ja: '会議のお見積もりを依頼する',
      th: 'ขอใบเสนอราคาสำหรับงานประชุม',
    }),
    description: loc({
      vi: 'Cho chúng tôi biết quy mô và thời gian sự kiện, bộ phận hội nghị sẽ gửi phương án sảnh, sơ đồ bàn ghế và báo giá phù hợp.',
      en: 'Tell us the size and the dates of your event, and the conference team will come back with a hall plan, a seating layout and a quotation to match.',
      zh: '请告诉我们活动的规模与日期，会议部门将回复合适的场地方案、桌椅布置图与报价。',
      ko: '행사 규모와 일정을 알려주시면 컨벤션팀이 알맞은 홀 구성과 좌석 배치도, 견적을 보내드립니다.',
      ja: 'イベントの規模と日程をお知らせください。宴会担当より、ご希望に合う会場のご提案、席次図、お見積もりをお送りします。',
      th: 'แจ้งขนาดงานและวันที่ที่ต้องการ แล้วฝ่ายจัดประชุมจะส่งแผนห้อง ผังที่นั่ง และใบเสนอราคาที่เหมาะสมกลับไป',
    }),
    formType: 'mice',
    successMessage: loc({
      vi: 'Cảm ơn bạn. Bộ phận hội nghị sẽ liên hệ lại trong thời gian sớm nhất.',
      en: 'Thank you. Our conference team will be in touch shortly.',
      zh: '感谢您的留言，会议部门将尽快与您联系。',
      ko: '감사합니다. 컨벤션팀이 곧 연락드리겠습니다.',
      ja: 'ありがとうございます。宴会担当より、追ってご連絡いたします。',
      th: 'ขอบคุณ ฝ่ายจัดประชุมจะติดต่อกลับโดยเร็วที่สุด',
    }),
  },
  {
    _type: 'ctaBandSection',
    _key: 'sec-cta',
    heading: loc({
      vi: 'Tiệc cưới tại Cung Hội nghị',
      en: 'Weddings at the Convention Palace',
      zh: '会议宫的婚礼',
      ko: '컨벤션 팰리스의 웨딩',
      ja: 'コンベンションパレスのウエディング',
      th: 'งานแต่งงานที่คอนเวนชัน พาเลซ',
    }),
    description: loc({
      vi: 'Cũng những sảnh này, dựng lại cho ngày cưới: cổng hoa, tháp bánh, tháp sâm-panh và một sân khấu của riêng hai bạn.',
      en: 'The same halls, reset for a wedding day: a floral gate, the cake tower, the champagne tower and a stage that belongs to the two of you.',
      zh: '还是这些厅，为婚礼重新布置：花门、蛋糕塔、香槟塔，以及一座只属于你们两人的舞台。',
      ko: '같은 홀을 결혼식에 맞춰 다시 꾸밉니다. 꽃 아치와 케이크 타워, 샴페인 타워, 그리고 두 사람만의 무대가 준비됩니다.',
      ja: '同じホールを、結婚式のために設え直します。花のゲート、ケーキタワー、シャンパンタワー、そしておふたりだけの舞台。',
      th: 'ห้องเดิมเหล่านี้ จัดใหม่เพื่อวันแต่งงาน ซุ้มดอกไม้ ทาวเวอร์เค้ก ทาวเวอร์แชมเปญ และเวทีที่เป็นของคุณทั้งสองคน',
    }),
    background: image('650181415_1776946873727630_2470051176797757595_n-1.jpg', {
      vi: 'Cô dâu chú rể cùng cắt chiếc bánh cưới nhiều tầng trên bàn phủ khăn ánh bạc, hoa cẩm tú cầu tím hồng bao quanh và phông sao lấp lánh phía sau',
      en: 'A bride and groom cutting a tiered wedding cake on a silver-sequinned table, surrounded by purple and pink hydrangeas with a sparkling star-cloth backdrop behind them',
      zh: '新娘与新郎在铺着银色亮片桌布的桌前共同切开多层婚礼蛋糕，四周环绕紫色与粉色绣球花，身后是闪亮的星幕',
      ko: '은빛 스팽글 테이블보를 덮은 테이블에서 신랑 신부가 여러 단으로 쌓은 웨딩 케이크를 함께 자르고, 보랏빛과 분홍빛 수국이 둘러싸며 뒤로는 반짝이는 별빛 커튼이 펼쳐집니다',
      ja: '銀色のスパンコールを敷いたテーブルで、新郎新婦が多段のウエディングケーキに入刀する。紫とピンクの紫陽花に囲まれ、背後にきらめくスタークロスが広がる',
      th: 'เจ้าบ่าวเจ้าสาวตัดเค้กแต่งงานหลายชั้นบนโต๊ะปูผ้าเลื่อมสีเงิน รายล้อมด้วยดอกไฮเดรนเยียสีม่วงและชมพู ด้านหลังเป็นฉากดาวระยิบระยับ',
    }),
    cta: linkTo('page.wedding', loc(WEDDINGS_CAPS)),
  },
]

/* ================================================================== *
 * TRANG 2 — TIỆC CƯỚI
 * ================================================================== */

const weddingSections = [
  {
    _type: 'heroSection',
    _key: 'sec-hero',
    heading: loc(WEDDINGS_CAPS),
    subheading: loc(PALACE_CAPS),
    background: image('653704045_1776947343727583_6583787246099743279_n-1.jpg', {
      vi: 'Sân khấu tiệc cưới trong ballroom: phông hoa giấy trắng khổng lồ, lối đi viền hoa pastel dẫn lên bục, dàn đèn tím xanh chiếu xuống từ trần',
      en: 'A wedding stage in the ballroom: a giant white paper-flower backdrop, an aisle edged with pastel blooms leading up to the dais, and purple-blue lights from the rig above',
      zh: '宴会厅里的婚礼舞台：巨幅白色纸花背景墙，两侧缀满粉彩花卉的通道通向台前，紫蓝色灯光自顶部灯架洒下',
      ko: '볼룸에 마련한 웨딩 무대: 거대한 흰색 종이꽃 배경, 파스텔 꽃으로 가장자리를 두른 버진로드가 단상으로 이어지고, 천장 조명에서 보랏빛과 푸른빛이 내려옵니다',
      ja: 'ボールルームのウエディングステージ。巨大な白いペーパーフラワーのバックドロップ、パステルの花で縁取られたバージンロードが壇上へ続き、天井の照明から紫と青の光が降り注ぐ',
      th: 'เวทีงานแต่งงานในบอลรูม ฉากหลังดอกไม้กระดาษสีขาวขนาดใหญ่ ทางเดินขนาบด้วยดอกไม้โทนพาสเทลทอดสู่แท่นพิธี และไฟสีม่วงน้ำเงินสาดลงมาจากรางไฟบนเพดาน',
    }),
    height: 'full',
  },
  {
    _type: 'imageTextSection',
    _key: 'sec-story',
    // Cùng lý do như `sec-intro` của trang Cung Hội nghị: hero đã nói 'TIỆC
    // CƯỚI' / 'WEDDINGS' rồi.
    eyebrow: loc({ vi: 'NGÀY TRỌNG ĐẠI', en: 'THE BIG DAY', zh: '人生大日子', ko: '인생의 그날', ja: '大切な一日', th: 'วันสำคัญ' }),
    heading: loc({
      vi: 'Trao lời hẹn ước bên Vịnh Hạ Long',
      en: 'Say your vows beside Ha Long Bay',
      zh: '在下龙湾畔许下誓言',
      ko: '하롱베이 곁에서 나누는 서약',
      ja: 'ハロン湾のほとりで誓いを交わす',
      th: 'กล่าวคำสาบานริมอ่าวฮาลอง',
    }),
    content: blockLoc({
      vi: [
        'Trao lời yêu thương với một nửa của bạn tại Cung Hội nghị Quốc tế Hoàng Gia. Trong không gian sang trọng với đèn chùm rực rỡ, tháp bánh và tháp sâm-panh lãng mạn, những trải nghiệm tại đây sẽ là một kỷ niệm khó quên trong cuộc đời.',
        'Toà nhà 5 tầng có hai phòng ballroom và ba phòng họp chức năng, tổng sức chứa gần 2.000 khách — đủ chỗ cho cả bữa gặp mặt mười sáu người của hai gia đình lẫn tiệc cưới một nghìn khách, và đủ gần nhau để không ai phải đi đâu xa giữa các nghi lễ.',
      ],
      en: [
        'Exchange your vows at the Royal International Convention Palace. Under bright chandeliers, beside the cake tower and the champagne tower, the day becomes one of the few a family keeps for good.',
        'The five-floor building holds two ballrooms and three function rooms, close to 2,000 guests in all — room for a sixteen-seat lunch between two families and for a thousand-guest reception alike, and close enough together that nobody has to travel between the ceremonies.',
      ],
      zh: [
        '在皇家国际会议宫与相爱的人许下誓言。水晶吊灯璀璨，蛋糕塔与香槟塔相伴，这一天会成为一家人长久珍藏的记忆。',
        '这栋 5 层建筑设有两间宴会厅与三间多功能会议室，总容纳人数近 2,000 位客人——既能安排两家十六人的见面午宴，也能承办千人婚宴；各厅相距不远，仪式之间无需奔波。',
      ],
      ko: [
        '로열 인터내셔널 컨벤션 팰리스에서 사랑하는 사람과 서약을 나눕니다. 환한 샹들리에 아래, 케이크 타워와 샴페인 타워 곁에서 보내는 하루는 온 가족이 오래 간직할 기억이 됩니다.',
        '5개 층 건물에 볼룸 두 개와 다목적 회의실 세 개가 있어 총 2,000명 가까이 수용합니다. 두 집안 열여섯 명이 모이는 상견례 자리도, 천 명 규모의 결혼 피로연도 함께 담을 수 있고, 각 공간이 가까워 예식 사이에 멀리 이동할 일이 없습니다.',
      ],
      ja: [
        'ロイヤル国際コンベンションパレスで、大切な人と誓いを交わします。きらめくシャンデリアの下、ケーキタワーとシャンパンタワーに彩られたその一日は、ご家族が長く心に留める記憶になります。',
        '5階建ての建物にボールルーム2室と多目的会議室3室を備え、総収容人数は約2,000名。両家十六名の顔合わせのお食事会から、千名規模の披露宴まで対応できます。各会場が近いので、儀式の合間に遠くまで移動する必要もありません。',
      ],
      th: [
        'กล่าวคำสาบานกับคนที่รักที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ ใต้แสงโคมระย้าที่สว่างไสว เคียงข้างทาวเวอร์เค้กและทาวเวอร์แชมเปญ วันนี้จะกลายเป็นความทรงจำที่ครอบครัวเก็บไว้ตลอดไป',
        'อาคาร 5 ชั้นแห่งนี้มีบอลรูม 2 ห้องและห้องประชุมอเนกประสงค์ 3 ห้อง ความจุรวมเกือบ 2,000 ท่าน รองรับได้ทั้งมื้ออาหารพบปะของสองครอบครัวสิบหกคน และงานเลี้ยงฉลองมงคลสมรสหนึ่งพันท่าน อีกทั้งแต่ละห้องอยู่ใกล้กัน ไม่ต้องเดินทางไกลระหว่างพิธี',
      ],
    }),
    image: image('Royal-Ha-Long-Gallery-Wedding-04.jpg', {
      vi: 'Tháp ly sâm-panh xếp cao trên bàn tròn phủ khăn trắng, bình hoa hồng phấn và bạc hà đặt bên cạnh, phía sau là ballroom đã bày kín bàn tiệc',
      en: 'A champagne tower stacked on a round table in white linen, a posy of pink roses and eucalyptus beside it, and the banquet-laid ballroom stretching away behind',
      zh: '铺白色桌布的圆桌上叠起高高的香槟塔，旁边摆着粉玫瑰与尤加利叶的花束，身后是已摆满宴席的宴会厅',
      ko: '흰 리넨을 씌운 원형 테이블 위에 높이 쌓은 샴페인 타워, 곁에 분홍 장미와 유칼립투스 꽃다발, 뒤로는 연회 준비를 마친 볼룸이 펼쳐집니다',
      ja: '白いクロスの円卓に高く積み上げたシャンパンタワー。傍らにピンクのバラとユーカリのブーケ、背後には宴席を整えたボールルームが広がる',
      th: 'ทาวเวอร์แชมเปญวางซ้อนสูงบนโต๊ะกลมปูผ้าขาว ข้าง ๆ เป็นช่อกุหลาบสีชมพูกับใบยูคาลิปตัส ด้านหลังคือบอลรูมที่จัดโต๊ะจัดเลี้ยงไว้เต็มห้อง',
    }),
    imageSide: 'left',
    tone: 'white',
    imageFit: 'cover',
  },
  {
    _type: 'cardGridSection',
    _key: 'sec-spaces',
    heading: loc({
      vi: 'Không gian tổ chức tiệc',
      en: 'Spaces for the celebration',
      zh: '婚宴场地',
      ko: '예식을 위한 공간',
      ja: '披露宴の会場',
      th: 'พื้นที่สำหรับงานฉลอง',
    }),
    subheading: loc({
      vi: 'Ba lựa chọn trong cùng một toà nhà — từ bữa gặp mặt hai gia đình tới tiệc cưới nghìn khách.',
      en: 'Three choices in a single building — from a lunch between two families to a thousand-guest reception.',
      zh: '同一栋楼里的三种选择——从两家人的见面餐叙，到千人婚宴。',
      ko: '한 건물 안의 세 가지 선택 — 두 집안의 상견례부터 천 명 규모의 피로연까지.',
      ja: '同じ建物の中に三つの選択肢 — 両家の顔合わせから千名規模の披露宴まで。',
      th: 'สามทางเลือกในอาคารเดียว ตั้งแต่มื้ออาหารพบปะของสองครอบครัว ไปจนถึงงานเลี้ยงหนึ่งพันท่าน',
    }),
    columns: 3,
    cards: [
      {
        _type: 'card',
        _key: 'card-ha-long',
        title: same('Ha Long Ball Room'),
        // Mô tả thẻ bị `line-clamp-2` cắt (xem CardGridSection) — đo ở 1440px
        // thì khung chữ cao 46px, ba dòng là mất dòng cuối. Giữ đúng hai dòng
        // Ở CẢ SÁU ngôn ngữ (đo lại bằng scrollHeight === clientHeight); phần
        // chia sảnh đã nói đủ ở danh sách sảnh và ở FAQ.
        description: loc({
          vi: '768 m² — tiệc ngồi 550 khách hoặc tiệc đứng 1.000 khách.',
          en: '768 m² — 550 guests seated at a banquet, or 1,000 standing.',
          zh: '768 m² — 宴会式 550 位客人，鸡尾酒会式 1,000 位。',
          ko: '768 m² — 연회식 550명, 칵테일식 1,000명.',
          ja: '768 m² — バンケット550名、カクテル1,000名。',
          th: '768 ตร.ม. — จัดเลี้ยง 550 ท่าน หรือค็อกเทล 1,000 ท่าน',
        }),
        image: image('Royal-Ha-Long-Wedding-07.jpg', {
          vi: 'Tiệc cưới kín khách trong ballroom: các bàn tròn phủ khăn trắng thắt nơ vàng, cô dâu đứng trên sân khấu trước phông hoa trắng và màn hình LED, đèn chùm pha lê sáng khắp trần',
          en: 'A ballroom packed for a wedding banquet: round tables in white linen with gold sashes, the bride on stage before a white floral backdrop and LED screen, crystal chandeliers lit across the ceiling',
          zh: '宾客满座的婚宴现场：铺白色桌布、系金色椅背结的圆桌，新娘站在白色花墙与 LED 屏前的舞台上，水晶吊灯照亮整个天花板',
          ko: '하객으로 가득 찬 결혼 피로연: 흰 리넨에 금색 새시를 두른 원형 테이블, 흰 꽃 배경과 LED 스크린 앞 무대에 선 신부, 천장을 밝히는 크리스털 샹들리에',
          ja: '満席の披露宴。白いクロスに金のサッシュを結んだ円卓が並び、白い花のバックドロップとLEDスクリーンの前の舞台に新婦が立つ。天井にはクリスタルシャンデリアが灯る',
          th: 'งานเลี้ยงแต่งงานที่แขกเต็มบอลรูม โต๊ะกลมปูผ้าขาวผูกโบว์สีทอง เจ้าสาวยืนบนเวทีหน้าฉากดอกไม้สีขาวและจอ LED โคมระย้าคริสตัลส่องสว่างทั่วเพดาน',
        }),
      },
      {
        _type: 'card',
        _key: 'card-hoang-gia',
        title: same('Hoang Gia Ball Room'),
        description: loc({
          vi: '672 m² — tiệc ngồi 350 khách hoặc tiệc đứng 650 khách.',
          en: '672 m² — 350 guests seated at a banquet, or 650 standing.',
          zh: '672 m² — 宴会式 350 位客人，鸡尾酒会式 650 位。',
          ko: '672 m² — 연회식 350명, 칵테일식 650명.',
          ja: '672 m² — バンケット350名、カクテル650名。',
          th: '672 ตร.ม. — จัดเลี้ยง 350 ท่าน หรือค็อกเทล 650 ท่าน',
        }),
        image: image('Royal-Ha-Long-Gallery-Convention-19.jpg', {
          vi: 'Sảnh tiệc trên thảm đỏ hoa văn vàng: các bàn tròn phủ khăn trắng với ghế thắt nơ vàng, rèm đỏ dọc tường và đèn chùm pha lê trên trần',
          en: 'A banquet hall on red carpet patterned in gold: round tables in white linen with gold-sashed chairs, red drapes along the walls and crystal chandeliers overhead',
          zh: '铺着金色花纹红地毯的宴会厅：白色桌布圆桌配金色椅背结的座椅，墙面挂红色帷幔，天花板悬水晶吊灯',
          ko: '금색 문양의 붉은 카펫 위 연회장: 흰 리넨 원형 테이블과 금색 리본을 묶은 의자, 벽을 따라 드리운 붉은 커튼, 천장의 크리스털 샹들리에',
          ja: '金の紋様が入った赤い絨毯の宴会場。白いクロスの円卓と金のサッシュを結んだ椅子、壁沿いの赤いドレープ、天井のクリスタルシャンデリア',
          th: 'ห้องจัดเลี้ยงบนพรมแดงลายทอง โต๊ะกลมปูผ้าขาวกับเก้าอี้ผูกโบว์สีทอง ผ้าม่านสีแดงตลอดแนวผนัง และโคมระย้าคริสตัลบนเพดาน',
        }),
      },
      {
        _type: 'card',
        _key: 'card-lounge',
        title: same('Royal / Bay Lounge'),
        description: loc({
          vi: 'Hai phòng 36 m² — bàn tròn 16 khách hoặc bàn dài 18 khách.',
          en: 'Two 36 m² rooms — 16 at a round table, or 18 at a long one.',
          zh: '两间 36 m² — 圆桌 16 位客人或长桌 18 位。',
          ko: '36 m² 두 개 — 원형 테이블 16명, 긴 테이블 18명.',
          ja: '36 m²が2室 — 円卓16名、長テーブル18名。',
          th: 'สองห้อง 36 ตร.ม. — โต๊ะกลม 16 ท่าน หรือโต๊ะยาว 18 ท่าน',
        }),
        image: image('Royal-Ha-Long-Gallery-Convention-26.jpg', {
          vi: 'Phòng khách nhỏ: hai hàng ghế bành bọc trắng quanh những bàn trà mặt đồng, tường ốp trắng phào chỉ vàng, tranh phong cảnh và một chùm đèn giữa trần',
          en: 'A small lounge: two rows of white armchairs around brass-topped coffee tables, white panelled walls with gilt mouldings, a landscape painting and a single chandelier at the centre of the ceiling',
          zh: '小型会客厅：两排白色扶手椅围着铜面茶几，白色护墙板配金色线脚，墙上挂风景画，天花板中央一盏吊灯',
          ko: '작은 라운지: 황동 상판 티테이블을 둘러싼 흰색 안락의자 두 줄, 금색 몰딩을 두른 흰 패널 벽, 풍경화 한 점과 천장 가운데의 샹들리에',
          ja: '小さなラウンジ。真鍮天板のティーテーブルを囲む白いアームチェアが二列、金のモールディングを施した白い羽目板の壁、風景画、天井中央のシャンデリア',
          th: 'เลานจ์ขนาดเล็ก เก้าอี้นวมสีขาวสองแถวล้อมโต๊ะกลางหน้าทองเหลือง ผนังบุไม้สีขาวคาดคิ้วทอง ภาพวาดทิวทัศน์ และโคมระย้าหนึ่งช่อกลางเพดาน',
        }),
      },
    ],
  },
  {
    _type: 'galleryCarouselSection',
    _key: 'sec-gallery',
    heading: loc({
      vi: 'Những đám cưới đã diễn ra tại đây',
      en: 'Weddings held here',
      zh: '在这里举行过的婚礼',
      ko: '이곳에서 열린 결혼식',
      ja: 'ここで行われた結婚式',
      th: 'งานแต่งงานที่จัดขึ้นที่นี่',
    }),
    album: { _type: 'reference', _ref: 'galleryAlbum.tiec-cuoi' },
  },
  {
    _type: 'faqSection',
    _key: 'sec-faq',
    heading: loc({
      vi: 'Câu hỏi thường gặp về tiệc cưới',
      en: 'Wedding questions, answered',
      zh: '婚礼常见问题',
      ko: '웨딩 자주 묻는 질문',
      ja: 'ウエディングのよくあるご質問',
      th: 'คำถามที่พบบ่อยเรื่องงานแต่งงาน',
    }),
    items: [
      {
        _type: 'faqItem',
        _key: 'faq-where',
        question: loc({
          vi: 'Tiệc cưới được tổ chức ở đâu trong khách sạn?',
          en: 'Where in the hotel are weddings held?',
          zh: '婚礼在酒店的哪个场地举行？',
          ko: '결혼식은 호텔 어디에서 열리나요?',
          ja: '結婚式はホテルのどこで行われますか。',
          th: 'งานแต่งงานจัดที่ส่วนไหนของโรงแรม',
        }),
        answer: blockLoc({
          vi: [
            'Tại Cung Hội nghị Quốc tế Hoàng Gia Hạ Long — toà nhà 5 tầng trong khuôn viên khách sạn, gồm hai phòng ballroom và ba phòng họp chức năng, tổng sức chứa gần 2.000 khách, kết nối thuận tiện với hệ thống nhà hàng, bar và cafe.',
          ],
          en: [
            'At the Royal International Convention Palace — a five-floor building inside the hotel grounds holding two ballrooms and three function rooms, close to 2,000 guests in total, connected directly to the restaurants, bars and cafe.',
          ],
          zh: [
            '在皇家国际会议宫——位于酒店园区内的 5 层建筑，设有两间宴会厅与三间多功能会议室，总容纳人数近 2,000 位客人，并与餐厅、酒吧和咖啡厅直接相连。',
          ],
          ko: [
            '호텔 부지 안에 있는 5개 층 건물, 로열 인터내셔널 컨벤션 팰리스에서 진행합니다. 볼룸 두 개와 다목적 회의실 세 개를 갖춰 총 2,000명 가까이 수용하며, 레스토랑과 바, 카페와 바로 이어집니다.',
          ],
          ja: [
            'ホテル敷地内にある5階建ての建物、ロイヤル国際コンベンションパレスで行います。ボールルーム2室と多目的会議室3室を備え、総収容人数は約2,000名。レストラン、バー、カフェとも直結しています。',
          ],
          th: [
            'จัดที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ อาคาร 5 ชั้นภายในพื้นที่โรงแรม มีบอลรูม 2 ห้องและห้องประชุมอเนกประสงค์ 3 ห้อง ความจุรวมเกือบ 2,000 ท่าน และเชื่อมต่อโดยตรงกับร้านอาหาร บาร์ และคาเฟ่',
          ],
        }),
      },
      {
        _type: 'faqItem',
        _key: 'faq-capacity',
        question: loc({
          vi: 'Sảnh lớn nhất chứa được bao nhiêu khách?',
          en: 'How many guests does the largest hall hold?',
          zh: '最大的宴会厅能容纳多少位客人？',
          ko: '가장 큰 홀은 몇 명까지 수용하나요?',
          ja: '一番大きなホールは何名まで収容できますか。',
          th: 'ห้องที่ใหญ่ที่สุดรองรับแขกได้กี่ท่าน',
        }),
        answer: blockLoc({
          vi: [
            'Ha Long Ball Room rộng 768 m² (32 × 24 m): 550 khách tiệc ngồi, 1.000 khách tiệc đứng, hoặc 1.000 chỗ kê kiểu nhà hát.',
            'Hoang Gia Ball Room rộng 672 m² (21 × 32 m): 350 khách tiệc ngồi hoặc 650 khách tiệc đứng.',
          ],
          en: [
            'Ha Long Ball Room covers 768 m² (32 × 24 m): 550 guests at a banquet, 1,000 standing, or 1,000 seats in theatre layout.',
            'Hoang Gia Ball Room covers 672 m² (21 × 32 m): 350 guests at a banquet or 650 standing.',
          ],
          zh: [
            'Ha Long Ball Room 面积 768 m²（32 × 24 m）：宴会式 550 位客人，鸡尾酒会式 1,000 位，剧院式 1,000 个座位。',
            'Hoang Gia Ball Room 面积 672 m²（21 × 32 m）：宴会式 350 位客人，鸡尾酒会式 650 位。',
          ],
          ko: [
            'Ha Long Ball Room은 768 m²(32 × 24 m)로 연회식 550명, 칵테일식 1,000명, 극장식 1,000석입니다.',
            'Hoang Gia Ball Room은 672 m²(21 × 32 m)로 연회식 350명 또는 칵테일식 650명입니다.',
          ],
          ja: [
            'Ha Long Ball Roomは768 m²（32 × 24 m）。バンケット形式550名、カクテル形式1,000名、シアター形式1,000席です。',
            'Hoang Gia Ball Roomは672 m²（21 × 32 m）。バンケット形式350名、カクテル形式650名です。',
          ],
          th: [
            'Ha Long Ball Room มีพื้นที่ 768 ตร.ม. (32 × 24 ม.) รองรับแบบจัดเลี้ยง 550 ท่าน แบบค็อกเทล 1,000 ท่าน หรือแบบโรงละคร 1,000 ที่นั่ง',
            'Hoang Gia Ball Room มีพื้นที่ 672 ตร.ม. (21 × 32 ม.) รองรับแบบจัดเลี้ยง 350 ท่าน หรือแบบค็อกเทล 650 ท่าน',
          ],
        }),
      },
      {
        _type: 'faqItem',
        _key: 'faq-small',
        question: loc({
          vi: 'Có không gian nhỏ cho lễ dạm ngõ hoặc bữa gặp mặt hai gia đình không?',
          en: 'Is there a smaller room for an engagement lunch or a meeting of the two families?',
          zh: '有适合订婚宴或两家见面餐叙的小型场地吗？',
          ko: '약혼식이나 상견례를 위한 작은 공간도 있나요?',
          ja: '結納や両家の顔合わせに使える小さな部屋はありますか。',
          th: 'มีห้องขนาดเล็กสำหรับงานหมั้นหรือมื้ออาหารพบปะของสองครอบครัวไหม',
        }),
        answer: blockLoc({
          vi: [
            'Có. Bay Lounge và Royal Lounge mỗi phòng 36 m²: Bay Lounge kê bàn tròn 16 khách, Royal Lounge kê bàn dài 18 khách.',
            'Nếu cần rộng hơn một chút, hai phòng Bái Tử Long 64 m² và 32 m² nhận lần lượt 50 và 24 khách tiệc ngồi.',
          ],
          en: [
            'Yes. Bay Lounge and Royal Lounge are 36 m² each: Bay Lounge seats 16 at a round table, Royal Lounge 18 at a long one.',
            'For something a little larger, the two Bái Tử Long rooms of 64 m² and 32 m² seat 50 and 24 respectively at a banquet.',
          ],
          zh: [
            '有。Bay Lounge 与 Royal Lounge 各 36 m²：Bay Lounge 设圆桌 16 位客人，Royal Lounge 设长桌 18 位。',
            '若需要再宽敞一些，Bái Tử Long 的两间房 64 m² 与 32 m² 宴会式分别接待 50 位和 24 位客人。',
          ],
          ko: [
            '있습니다. Bay Lounge와 Royal Lounge는 각각 36 m²로, Bay Lounge는 원형 테이블 16명, Royal Lounge는 긴 테이블 18명을 수용합니다.',
            '조금 더 넓은 자리가 필요하다면 64 m²와 32 m²의 Bái Tử Long 룸 두 곳이 연회식으로 각각 50명과 24명을 수용합니다.',
          ],
          ja: [
            'ございます。Bay LoungeとRoyal Loungeはそれぞれ36 m²。Bay Loungeは円卓で16名、Royal Loungeは長テーブルで18名です。',
            'もう少し広い席が必要な場合は、64 m²と32 m²のBái Tử Longルームがバンケット形式でそれぞれ50名と24名に対応します。',
          ],
          th: [
            'มี Bay Lounge และ Royal Lounge ห้องละ 36 ตร.ม. โดย Bay Lounge จัดโต๊ะกลม 16 ท่าน ส่วน Royal Lounge จัดโต๊ะยาว 18 ท่าน',
            'หากต้องการพื้นที่กว้างขึ้นเล็กน้อย ห้อง Bái Tử Long ขนาด 64 และ 32 ตร.ม. รองรับแบบจัดเลี้ยงได้ 50 และ 24 ท่านตามลำดับ',
          ],
        }),
      },
      {
        _type: 'faqItem',
        _key: 'faq-divide',
        question: loc({
          vi: 'Phòng ballroom có chia nhỏ được không?',
          en: 'Can the ballrooms be divided?',
          zh: '宴会厅可以分隔成小厅吗？',
          ko: '볼룸을 나눠 쓸 수 있나요?',
          ja: 'ボールルームは分割できますか。',
          th: 'บอลรูมแบ่งเป็นห้องย่อยได้ไหม',
        }),
        answer: blockLoc({
          vi: [
            'Được. Ha Long chia thành hai sảnh 384 m², mỗi sảnh nhận 230 khách tiệc ngồi. Hoang Gia chia thành các phòng 504 m², 336 m² và 168 m². Nhờ vậy lễ thành hôn và tiệc tối có thể diễn ra ở hai không gian liền kề trong cùng một buổi.',
          ],
          en: [
            'They can. Ha Long splits into two 384 m² halls, each seating 230 at a banquet; Hoang Gia into rooms of 504 m², 336 m² and 168 m². The ceremony and the dinner can therefore take place in two adjoining spaces on the same afternoon.',
          ],
          zh: [
            '可以。Ha Long Ball Room 可分为两个 384 m² 的厅，每厅宴会式接待 230 位客人；Hoang Gia Ball Room 可分为 504 m²、336 m² 和 168 m² 的房间。因此仪式与晚宴可以在同一个下午、于相邻的两个空间依次进行。',
          ],
          ko: [
            '가능합니다. Ha Long Ball Room은 384 m² 홀 두 개로 나뉘어 각각 연회식 230명을 수용하고, Hoang Gia Ball Room은 504 m², 336 m², 168 m² 규모로 나뉩니다. 덕분에 예식과 만찬을 같은 날 오후에 나란히 붙은 두 공간에서 이어 진행할 수 있습니다.',
          ],
          ja: [
            'できます。Ha Long Ball Roomは384 m²のホール二つに分かれ、それぞれバンケット形式で230名。Hoang Gia Ball Roomは504 m²、336 m²、168 m²に分かれます。挙式と晩餐を同じ日の午後に、隣り合う二つの空間で続けて行えます。',
          ],
          th: [
            'แบ่งได้ Ha Long Ball Room แบ่งเป็นสองห้อง ห้องละ 384 ตร.ม. รองรับแบบจัดเลี้ยงห้องละ 230 ท่าน ส่วน Hoang Gia Ball Room แบ่งเป็นห้องขนาด 504, 336 และ 168 ตร.ม. พิธีมงคลสมรสและงานเลี้ยงค่ำจึงจัดต่อเนื่องในสองห้องที่อยู่ติดกันภายในบ่ายเดียวได้',
          ],
        }),
      },
      {
        _type: 'faqItem',
        _key: 'faq-stay',
        question: loc({
          vi: 'Khách ở xa nghỉ lại ở đâu?',
          en: 'Where do guests travelling in stay?',
          zh: '远道而来的宾客可以住在哪里？',
          ko: '멀리서 오시는 하객은 어디에 묵나요?',
          ja: '遠方からのゲストはどこに宿泊できますか。',
          th: 'แขกที่เดินทางมาจากต่างถิ่นพักที่ไหน',
        }),
        answer: blockLoc({
          vi: [
            'Ngay tại Royal Hạ Long Hotel ở Bãi Cháy, cùng khuôn viên với Cung Hội nghị — khách dự tiệc không phải di chuyển giữa nơi nghỉ và nơi tổ chức.',
          ],
          en: [
            'At Royal Ha Long Hotel in Bai Chay, in the same grounds as the Convention Palace — guests never have to travel between where they sleep and where the wedding is held.',
          ],
          zh: [
            '就住在拜寨的 Royal Ha Long Hotel，与会议宫同处一个园区——宾客无需在住宿与婚宴场地之间往返。',
          ],
          ko: [
            '컨벤션 팰리스와 같은 부지에 있는 바이짜이의 Royal Ha Long Hotel에 묵으시면 됩니다. 숙소와 예식장 사이를 오갈 필요가 없습니다.',
          ],
          ja: [
            'コンベンションパレスと同じ敷地にある、バイチャイのRoyal Ha Long Hotelにご宿泊いただけます。宿泊先と会場の間を移動する必要はありません。',
          ],
          th: [
            'พักที่ Royal Ha Long Hotel ในบ๊ายจ๋าย ซึ่งอยู่ในพื้นที่เดียวกับคอนเวนชัน พาเลซ แขกจึงไม่ต้องเดินทางไปมาระหว่างที่พักกับสถานที่จัดงาน',
          ],
        }),
      },
      {
        _type: 'faqItem',
        _key: 'faq-contact',
        question: loc({
          vi: 'Muốn xem sảnh và đặt tiệc thì liên hệ ai?',
          en: 'Who do we contact to view a hall and make a booking?',
          zh: '想看场地和预订婚宴该联系谁？',
          ko: '홀을 둘러보고 예약하려면 어디로 연락하면 되나요?',
          ja: '会場を見学して予約するには、どこに連絡すればよいですか。',
          th: 'ต้องการดูห้องและจองงานเลี้ยง ติดต่อใคร',
        }),
        answer: blockLoc({
          vi: [
            'Hotline (+84) 2033 848 777 hoặc số di động (+84) 90 4030 222, email info@royalhalonghotel.com.',
            'Bạn cũng có thể để lại thông tin ở biểu mẫu ngay bên dưới — bộ phận tiệc cưới sẽ gọi lại.',
          ],
          en: [
            'Hotline (+84) 2033 848 777 or mobile (+84) 90 4030 222, email info@royalhalonghotel.com.',
            'You can also leave your details in the form just below and the wedding team will call you back.',
          ],
          zh: [
            '热线 (+84) 2033 848 777 或手机 (+84) 90 4030 222，邮箱 info@royalhalonghotel.com。',
            '您也可以在下方表单留下联系方式，婚礼部门会回电。',
          ],
          ko: [
            '핫라인 (+84) 2033 848 777 또는 휴대전화 (+84) 90 4030 222, 이메일 info@royalhalonghotel.com으로 연락 주십시오.',
            '아래 양식에 연락처를 남겨 주시면 웨딩팀이 전화드립니다.',
          ],
          ja: [
            'ホットライン (+84) 2033 848 777、携帯 (+84) 90 4030 222、メール info@royalhalonghotel.com までご連絡ください。',
            '下のフォームにご連絡先をご記入いただければ、ウエディング担当より折り返しお電話いたします。',
          ],
          th: [
            'สายด่วน (+84) 2033 848 777 หรือมือถือ (+84) 90 4030 222 อีเมล info@royalhalonghotel.com',
            'หรือฝากข้อมูลไว้ในแบบฟอร์มด้านล่าง แล้วฝ่ายงานแต่งงานจะโทรกลับ',
          ],
        }),
      },
    ],
  },
  {
    _type: 'leadFormSection',
    _key: 'sec-form',
    heading: loc({
      vi: 'Nhận tư vấn tiệc cưới',
      en: 'Talk to the wedding team',
      zh: '咨询婚礼团队',
      ko: '웨딩팀과 상담하기',
      ja: 'ウエディング担当に相談する',
      th: 'ปรึกษาทีมงานแต่งงาน',
    }),
    description: loc({
      vi: 'Để lại thông tin, bộ phận tiệc cưới của Royal Hạ Long sẽ liên hệ tư vấn thực đơn, sảnh tiệc và báo giá theo đúng ngày bạn dự định tổ chức.',
      en: 'Leave your details and the wedding team at Royal Ha Long Hotel will call you back to go through menus, halls and a quotation for the date you have in mind.',
      zh: '留下联系方式，Royal Ha Long Hotel 的婚礼部门会按您预定的日期，为您介绍菜单、宴会厅并提供报价。',
      ko: '연락처를 남겨 주시면 Royal Ha Long Hotel 웨딩팀이 희망하시는 날짜에 맞춰 메뉴와 연회장, 견적을 안내해 드립니다.',
      ja: 'ご連絡先をお残しください。Royal Ha Long Hotelのウエディング担当より、ご希望の日程に合わせてメニュー、会場、お見積もりをご案内いたします。',
      th: 'ฝากข้อมูลติดต่อไว้ แล้วฝ่ายงานแต่งงานของ Royal Ha Long Hotel จะติดต่อกลับเพื่อแนะนำเมนู ห้องจัดเลี้ยง และใบเสนอราคาตามวันที่คุณตั้งใจจัดงาน',
    }),
    formType: 'wedding',
    successMessage: loc({
      vi: 'Cảm ơn bạn. Bộ phận tiệc cưới sẽ liên hệ lại trong thời gian sớm nhất.',
      en: 'Thank you. Our wedding team will be in touch shortly.',
      zh: '感谢您的留言，婚礼部门将尽快与您联系。',
      ko: '감사합니다. 웨딩팀이 곧 연락드리겠습니다.',
      ja: 'ありがとうございます。ウエディング担当より、追ってご連絡いたします。',
      th: 'ขอบคุณ ฝ่ายงานแต่งงานจะติดต่อกลับโดยเร็วที่สุด',
    }),
  },
  {
    _type: 'ctaBandSection',
    _key: 'sec-cta',
    heading: loc({
      vi: 'Xem sức chứa của từng sảnh',
      en: 'See the capacity of every hall',
      zh: '查看各厅的容纳人数',
      ko: '홀별 수용 인원 보기',
      ja: '各ホールの収容人数を見る',
      th: 'ดูความจุของแต่ละห้อง',
    }),
    description: loc({
      vi: 'Diện tích, kích thước và số khách tối đa theo sáu kiểu bố trí — toàn bộ trong một bảng.',
      en: 'Area, dimensions and maximum head count in six layouts — all of it in one table.',
      zh: '面积、尺寸与六种布置方式下的最大接待人数——全部列在一张表里。',
      ko: '면적과 크기, 여섯 가지 배치별 최대 인원을 표 하나에 모두 담았습니다.',
      ja: '面積、寸法、六つのレイアウトごとの最大人数を、一つの表にまとめています。',
      th: 'พื้นที่ ขนาด และจำนวนแขกสูงสุดตามการจัดผังทั้งหกแบบ รวมอยู่ในตารางเดียว',
    }),
    background: image('Royal-Halong-Hotel-Convention-01.jpg', {
      vi: 'Phòng họp VIP: hai hàng ghế bành gỗ sơn son thếp vàng bọc gấm kem đối diện nhau, bàn trà đen ở giữa, rèm vàng và chùm đèn pha lê dưới trần vòm',
      en: 'A VIP meeting room: two facing rows of gilt-framed armchairs upholstered in cream brocade, black coffee tables between them, gold curtains and a crystal chandelier beneath a domed ceiling',
      zh: 'VIP 会议室：两排描金木框、米色锦缎面的扶手椅相对而设，中间摆黑色茶几，金色窗帘与穹顶下的水晶吊灯',
      ko: 'VIP 회의실: 금박 목재 프레임에 크림색 브로케이드를 씌운 안락의자 두 줄이 마주 놓이고, 사이에 검은 티테이블, 금색 커튼과 돔 천장 아래 크리스털 샹들리에',
      ja: 'VIP会議室。金彩を施した木枠にクリーム色のブロケードを張ったアームチェアが二列向かい合い、間に黒いティーテーブル、金色のカーテン、ドーム天井の下にクリスタルシャンデリア',
      th: 'ห้องประชุม VIP เก้าอี้นวมโครงไม้ปิดทองหุ้มผ้าไหมยกดอกสีครีมสองแถวหันเข้าหากัน โต๊ะกลางสีดำอยู่ตรงกลาง ผ้าม่านสีทอง และโคมระย้าคริสตัลใต้เพดานโดม',
    }),
    cta: linkTo('page.royal-international-convention-palace', loc({
      vi: 'CUNG HỘI NGHỊ',
      en: 'CONVENTION PALACE',
      zh: '会议宫',
      ko: '컨벤션 팰리스',
      ja: 'コンベンションパレス',
      th: 'คอนเวนชัน พาเลซ',
    })),
  },
]

/* ================================================================== *
 * BA PHÒNG HỘI NGHỊ
 * ================================================================== */

type LayoutSpec = [Six, number]

function layouts(specs: LayoutSpec[]) {
  return specs.map(([style, seats]) => ({
    _type: 'layout',
    _key: key('lay'),
    style: loc(style),
    seats,
  }))
}

const hallHaLong = {
  name: same('Ha Long Ball Room'),
  slug: slugAll('ha-long'),
  areaSqm: 768,
  capacity: guests(1000),
  layouts: layouts([
    [L_BANQUET, 550],
    [L_CLASSROOM, 430],
    [L_DOUBLE_U, 430],
    [L_THEATRE, 1000],
    [L_HOLLOW, 300],
    [L_COCKTAIL, 1000],
  ]),
  description: blockLoc({
    vi: [
      'Phòng lớn nhất của Cung Hội nghị Quốc tế Hoàng Gia Hạ Long: 768 m², kích thước 32 × 24 m, sức chứa lên tới 1.000 khách. Không gian rộng rãi, sang trọng, có khán đài sức chứa lớn — lựa chọn hàng đầu cho hội nghị, đại hội và tiệc cưới quy mô lớn.',
      'Chia được bằng vách ngăn thành Ha Long 1 và Ha Long 2, mỗi sảnh 384 m² (16 × 24 m), nhận 230 khách tiệc ngồi hoặc 350 chỗ kê kiểu nhà hát.',
    ],
    en: [
      'The largest room in the Royal International Convention Palace: 768 m², 32 × 24 m, holding up to 1,000 guests. A broad, richly finished space with tiered seating — the first choice for conferences, conventions and large wedding banquets.',
      'Partitions divide it into Ha Long 1 and Ha Long 2, each 384 m² (16 × 24 m), seating 230 at a banquet or 350 in theatre layout.',
    ],
    zh: [
      '皇家国际会议宫最大的厅：768 m²，尺寸 32 × 24 m，最多可容纳 1,000 位客人。空间开阔、装修考究，并设有大型阶梯看台——举办会议、大会和大型婚宴的首选。',
      '可用活动隔断分为 Ha Long 1 与 Ha Long 2，每厅 384 m²（16 × 24 m），宴会式接待 230 位客人，剧院式 350 个座位。',
    ],
    ko: [
      '로열 인터내셔널 컨벤션 팰리스에서 가장 큰 홀입니다. 768 m², 32 × 24 m 규모로 최대 1,000명을 수용하며, 넓고 격조 있는 공간에 대규모 관람석을 갖췄습니다. 회의와 총회, 대형 결혼 피로연에 가장 먼저 추천드리는 홀입니다.',
      '파티션으로 Ha Long 1과 Ha Long 2로 나뉘며, 각 홀은 384 m²(16 × 24 m)로 연회식 230명 또는 극장식 350석을 수용합니다.',
    ],
    ja: [
      'ロイヤル国際コンベンションパレスで最も大きなホールです。768 m²、32 × 24 m、最大1,000名を収容します。広々とした格調ある空間に大型のスタンド席を備え、会議や大会、大規模な披露宴で最初に挙がる会場です。',
      '可動間仕切りでHa Long 1とHa Long 2に分割でき、各ホールは384 m²（16 × 24 m）、バンケット形式230名、シアター形式350席です。',
    ],
    th: [
      'ห้องที่ใหญ่ที่สุดของรอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ พื้นที่ 768 ตร.ม. ขนาด 32 × 24 ม. รองรับได้ถึง 1,000 ท่าน พื้นที่กว้างขวางหรูหรา พร้อมอัฒจันทร์ความจุสูง จึงเป็นตัวเลือกแรกสำหรับงานประชุม งานสัมมนาใหญ่ และงานเลี้ยงแต่งงานขนาดใหญ่',
      'แบ่งด้วยผนังกั้นเป็น Ha Long 1 และ Ha Long 2 ห้องละ 384 ตร.ม. (16 × 24 ม.) รองรับแบบจัดเลี้ยง 230 ท่าน หรือแบบโรงละคร 350 ที่นั่ง',
    ],
  }),
  image: image('Royal-Ha-Long-Convention-01.jpg', {
    vi: 'Sảnh Ha Long bày tiệc: các bàn tròn phủ khăn vàng đồng với ghế bọc trắng, hàng đèn chùm pha lê dưới trần ô vuông, thảm hoa văn vân đá phủ kín sàn',
    en: 'Ha Long hall laid for a banquet: round tables draped in bronze-gold cloth with white-covered chairs, rows of crystal chandeliers under a coffered ceiling and a marbled-pattern carpet across the floor',
    zh: 'Ha Long Ball Room 摆台：铺古铜金色桌布的圆桌配白色椅套，方格天花板下悬挂成排水晶吊灯，地面铺满石纹图案地毯',
    ko: '연회를 차린 Ha Long Ball Room: 청동빛 금색 테이블보를 씌운 원형 테이블과 흰 커버 의자, 우물천장 아래 늘어선 크리스털 샹들리에, 바닥을 덮은 대리석 무늬 카펫',
    ja: '宴会を設えたHa Long Ball Room。ブロンズゴールドのクロスを掛けた円卓と白いカバーの椅子、格天井の下に連なるクリスタルシャンデリア、床一面の石目模様の絨毯',
    th: 'Ha Long Ball Room ที่จัดโต๊ะจัดเลี้ยง โต๊ะกลมคลุมผ้าสีทองบรอนซ์กับเก้าอี้คลุมผ้าขาว โคมระย้าคริสตัลเรียงแถวใต้เพดานหลุม และพรมลายหินอ่อนปูเต็มพื้น',
  }),
  gallery: [
    image('Royal-Ha-Long-Gallery-Convention-13.jpg', {
      vi: 'Sảnh kê hai dãy dài ghế bành bọc gấm vàng, giữa các ghế là bàn nhỏ đặt chai nước, thảm vân đá và đèn chùm pha lê chạy dọc trần',
      en: 'The hall set with two long rows of gold-brocade armchairs, small tables of bottled water between them, a marbled carpet and crystal chandeliers running the length of the ceiling',
      zh: '厅内两长排金色锦缎扶手椅，椅间小几上放着瓶装水，石纹地毯与成排水晶吊灯贯穿整个天花板',
      ko: '홀에 금색 브로케이드 안락의자가 두 줄로 길게 놓이고, 의자 사이 작은 탁자에는 생수병이 놓였으며, 대리석 무늬 카펫과 크리스털 샹들리에가 천장을 따라 이어집니다',
      ja: 'ホールに金のブロケードのアームチェアが二列長く並び、椅子の間の小卓にはボトルの水。石目模様の絨毯とクリスタルシャンデリアが天井に沿って続く',
      th: 'ห้องโถงจัดเก้าอี้นวมหุ้มผ้าไหมยกดอกสีทองเป็นสองแถวยาว โต๊ะเล็กระหว่างเก้าอี้วางขวดน้ำ พรมลายหินอ่อนและโคมระย้าคริสตัลทอดยาวตลอดเพดาน',
    }),
    image('Royal-Ha-Long-Gallery-Convention-15.jpg', {
      vi: 'Hội nghị kê kiểu vuông rỗng: dãy bàn phủ khăn cam ghép thành hình chữ nhật lớn, đại biểu ngồi quanh bàn, màn chiếu đặt ở cuối phòng',
      en: 'A conference in hollow-square layout: tables skirted in orange joined into a large rectangle with delegates seated around it, and a projection screen at the far end of the room',
      zh: '回字型布置的会议：铺橙色桌裙的长桌拼成大矩形，与会代表围桌而坐，房间尽头设有投影幕',
      ko: 'ㅁ자형으로 배치한 회의: 주황색 테이블 스커트를 두른 테이블이 큰 직사각형을 이루고 대표단이 둘러앉았으며, 방 끝에는 프로젝션 스크린이 놓였습니다',
      ja: '口の字形に設営した会議。オレンジのテーブルスカートを掛けた机が大きな長方形を成し、出席者が囲んで座る。部屋の奥にはプロジェクタースクリーン',
      th: 'การประชุมจัดแบบสี่เหลี่ยมกลวง โต๊ะคลุมผ้าสีส้มต่อกันเป็นสี่เหลี่ยมผืนผ้าขนาดใหญ่ ผู้เข้าร่วมนั่งล้อมรอบโต๊ะ และมีจอฉายภาพอยู่ท้ายห้อง',
    }),
  ],
}

const hallHoangGia = {
  name: same('Hoang Gia Ball Room'),
  slug: slugAll('hoang-gia'),
  areaSqm: 672,
  capacity: guests(650),
  layouts: layouts([
    [L_BANQUET, 350],
    [L_CLASSROOM, 220],
    [L_DOUBLE_U, 220],
    [L_THEATRE, 360],
    [L_HOLLOW, 190],
    [L_COCKTAIL, 650],
  ]),
  description: blockLoc({
    vi: [
      'Phòng họp 672 m², kích thước 21 × 32 m, phù hợp với những sự kiện, kỳ họp và hội nghị quy mô lớn. Phòng được trang bị hệ thống ánh sáng và âm thanh hiện đại, kết hợp lối thiết kế sang trọng tinh tế, đáp ứng nhiều mục đích sử dụng.',
      'Chia được thành các phòng nhỏ hơn: Hoang Gia 1+2 rộng 504 m², Hoang Gia 1 và Hoang Gia 2+3 rộng 336 m², Hoang Gia 2 và Hoang Gia 3 rộng 168 m².',
    ],
    en: [
      'A 672 m² room, 21 × 32 m, suited to large events, assemblies and conferences. It carries modern sound and lighting systems within a finely detailed interior that adapts to many kinds of programme.',
      'It divides into smaller rooms: Hoang Gia 1+2 at 504 m², Hoang Gia 1 and Hoang Gia 2+3 at 336 m², and Hoang Gia 2 and Hoang Gia 3 at 168 m².',
    ],
    zh: [
      '672 m² 的会议厅，尺寸 21 × 32 m，适合大型活动、会期与会议。厅内配备现代化灯光与音响系统，加上精致考究的设计，可满足多种用途。',
      '可分隔成更小的房间：Hoang Gia 1+2 为 504 m²，Hoang Gia 1 与 Hoang Gia 2+3 为 336 m²，Hoang Gia 2 与 Hoang Gia 3 为 168 m²。',
    ],
    ko: [
      '672 m², 21 × 32 m 규모의 홀로 대형 행사와 회기, 학술회의에 알맞습니다. 현대적인 조명·음향 설비에 섬세하고 격조 있는 디자인을 더해 다양한 용도를 소화합니다.',
      '더 작은 방으로 나눌 수 있습니다. Hoang Gia 1+2는 504 m², Hoang Gia 1과 Hoang Gia 2+3은 336 m², Hoang Gia 2와 Hoang Gia 3은 168 m²입니다.',
    ],
    ja: [
      '672 m²、21 × 32 mのホールで、大型イベントや会期、会議に適しています。最新の照明・音響設備に、細部まで整えた上質な意匠を合わせ、多様な用途に応えます。',
      'より小さな部屋に分割できます。Hoang Gia 1+2は504 m²、Hoang Gia 1とHoang Gia 2+3は336 m²、Hoang Gia 2とHoang Gia 3は168 m²です。',
    ],
    th: [
      'ห้องประชุมขนาด 672 ตร.ม. ขนาด 21 × 32 ม. เหมาะกับงานอีเวนต์ การประชุมสมัยสามัญ และงานสัมมนาขนาดใหญ่ ติดตั้งระบบแสงและเสียงที่ทันสมัย ผสานการออกแบบที่หรูหราประณีต จึงรองรับการใช้งานได้หลากหลาย',
      'แบ่งเป็นห้องย่อยได้ โดย Hoang Gia 1+2 มีพื้นที่ 504 ตร.ม. Hoang Gia 1 และ Hoang Gia 2+3 มีพื้นที่ 336 ตร.ม. ส่วน Hoang Gia 2 และ Hoang Gia 3 มีพื้นที่ 168 ตร.ม.',
    ],
  }),
  image: image('HOANG-GIA-2.jpg', {
    vi: 'Phòng Hoang Gia kê kiểu tiếp đón: hai dãy ghế bành trắng viền gỗ đối diện nhau dọc thảm đỏ hoa văn, bàn trà thấp ở giữa, màn hình và rèm nhung đỏ ở cuối phòng',
    en: 'Hoang Gia set for a reception: two facing rows of white wood-framed armchairs down a patterned red carpet, low tables between them, and a screen with red velvet drapes at the far end',
    zh: 'Hoang Gia Ball Room 按接待形式布置：两排白色木框扶手椅沿花纹红地毯相对而设，中间摆低矮茶几，房间尽头是屏幕与红色天鹅绒帷幕',
    ko: '접견 형식으로 배치한 Hoang Gia Ball Room: 문양이 들어간 붉은 카펫을 따라 흰색 목재 프레임 안락의자가 두 줄로 마주 놓이고, 사이에 낮은 티테이블, 방 끝에는 스크린과 붉은 벨벳 커튼이 있습니다',
    ja: '接見形式に設営したHoang Gia Ball Room。模様入りの赤い絨毯に沿って白い木枠のアームチェアが二列向かい合い、間に低いテーブル、奥にはスクリーンと赤いベルベットのドレープ',
    th: 'Hoang Gia Ball Room จัดแบบห้องรับรอง เก้าอี้นวมโครงไม้สีขาวสองแถวหันเข้าหากันตามแนวพรมแดงลายดอก โต๊ะกลางเตี้ยอยู่ระหว่างกลาง ท้ายห้องมีจอภาพและผ้าม่านกำมะหยี่สีแดง',
  }),
  gallery: [
    image('Royal-Ha-Long-Gallery-Convention-21.jpg', {
      vi: 'Phòng thảm đỏ hoa văn tròn kê hai dãy ghế bành kem đối diện nhau, bàn thấp cắm hoa trắng ở giữa, màn hình LED hiển thị phông hội nghị ở đầu phòng',
      en: 'A room on a red carpet of circular motifs, two facing rows of cream armchairs, low tables with white flowers between them and an LED screen showing a conference backdrop at the head of the room',
      zh: '铺圆形花纹红地毯的房间里，两排米色扶手椅相对而设，中间的矮几上插着白色鲜花，房间前端的 LED 屏显示会议背景板',
      ko: '원형 문양의 붉은 카펫이 깔린 방에 크림색 안락의자가 두 줄로 마주 놓이고, 사이의 낮은 탁자에는 흰 꽃이 꽂혔으며, 정면 LED 스크린에 회의 배경 화면이 떠 있습니다',
      ja: '円形の紋様が入った赤い絨毯の部屋に、クリーム色のアームチェアが二列向かい合う。間の低いテーブルには白い花、正面のLEDスクリーンには会議のバックボードが映る',
      th: 'ห้องปูพรมแดงลายวงกลม เก้าอี้นวมสีครีมสองแถวหันเข้าหากัน โต๊ะเตี้ยตรงกลางปักดอกไม้สีขาว และจอ LED ด้านหน้าห้องแสดงฉากหลังงานประชุม',
    }),
    image('Royal-Ha-Long-Gallery-Convention-20.jpg', {
      vi: 'Tiệc gala trên thảm đỏ hoa văn vàng: các bàn tròn phủ khăn trắng thắt nơ vàng quây quanh sân khấu màn hình LED, đèn chùm pha lê dọc hai bên',
      en: 'A gala dinner on red carpet patterned in gold: round tables in white linen with gold sashes gathered around an LED stage, crystal chandeliers down both sides',
      zh: '金色花纹红地毯上的晚宴：铺白色桌布、系金色蝴蝶结的圆桌环绕 LED 屏舞台，两侧悬挂水晶吊灯',
      ko: '금색 문양의 붉은 카펫 위 갈라 디너: 흰 리넨에 금색 리본을 묶은 원형 테이블이 LED 무대를 둘러싸고, 양옆으로 크리스털 샹들리에가 이어집니다',
      ja: '金の紋様が入った赤い絨毯の上のガラディナー。白いクロスに金のリボンを結んだ円卓がLEDスクリーンの舞台を囲み、両側にクリスタルシャンデリアが連なる',
      th: 'งานกาลาดินเนอร์บนพรมแดงลายทอง โต๊ะกลมปูผ้าขาวผูกโบว์สีทองล้อมรอบเวทีจอ LED และโคมระย้าคริสตัลเรียงสองข้าง',
    }),
  ],
}

const hallLounge = {
  name: same('Royal / Bay Lounge'),
  slug: slugAll('royal-bay-lounge'),
  areaSqm: 36,
  capacity: loc({
    vi: '16 – 18 khách',
    en: '16 – 18 guests',
    zh: '16 – 18 位客人',
    ko: '16 – 18명',
    ja: '16 – 18名',
    th: '16 – 18 ท่าน',
  }),
  layouts: layouts([
    [
      {
        vi: 'Bay Lounge — bàn tròn',
        en: 'Bay Lounge — round table',
        zh: 'Bay Lounge — 圆桌',
        ko: 'Bay Lounge — 원형 테이블',
        ja: 'Bay Lounge — 円卓',
        th: 'Bay Lounge — โต๊ะกลม',
      },
      16,
    ],
    [
      {
        vi: 'Royal Lounge — bàn dài',
        en: 'Royal Lounge — long table',
        zh: 'Royal Lounge — 长桌',
        ko: 'Royal Lounge — 긴 테이블',
        ja: 'Royal Lounge — 長テーブル',
        th: 'Royal Lounge — โต๊ะยาว',
      },
      18,
    ],
  ]),
  description: blockLoc({
    vi: [
      'Hai phòng 36 m² (5,2 × 7 m) mang thiết kế hiện đại và sang trọng, phù hợp cho các buổi gặp mặt và hội họp nhỏ. Phòng được setup thông minh, dễ bố trí lại theo nhu cầu của từng nhóm khách.',
      'Bay Lounge kê bàn tròn 16 khách, Royal Lounge kê bàn dài 18 khách.',
    ],
    en: [
      'Two rooms of 36 m² (5.2 × 7 m), modern and finely finished, made for small gatherings and private meetings. The fit-out is deliberately flexible and rearranges easily around each group.',
      'Bay Lounge seats 16 at a round table; Royal Lounge seats 18 at a long one.',
    ],
    zh: [
      '两间 36 m²（5.2 × 7 m）的房间，设计现代而考究，适合小型会面与会议。布置灵活，可按每组客人的需要重新调整。',
      'Bay Lounge 设圆桌 16 位客人，Royal Lounge 设长桌 18 位。',
    ],
    ko: [
      '36 m²(5.2 × 7 m) 규모의 두 개 룸으로, 현대적이고 품격 있는 디자인을 갖춰 소규모 모임과 회의에 알맞습니다. 세팅이 유연해 손님 구성에 따라 쉽게 다시 배치할 수 있습니다.',
      'Bay Lounge는 원형 테이블 16명, Royal Lounge는 긴 테이블 18명을 수용합니다.',
    ],
    ja: [
      '36 m²（5.2 × 7 m）の部屋が二室。現代的で上質な設えが、少人数の会合や打ち合わせに向いています。レイアウトは柔軟で、ご一行の構成に合わせて容易に組み替えられます。',
      'Bay Loungeは円卓で16名、Royal Loungeは長テーブルで18名です。',
    ],
    th: [
      'สองห้องขนาด 36 ตร.ม. (5.2 × 7 ม.) ออกแบบทันสมัยและหรูหรา เหมาะกับการพบปะและประชุมกลุ่มเล็ก จัดวางได้ยืดหยุ่น ปรับผังใหม่ตามความต้องการของแต่ละคณะได้ง่าย',
      'Bay Lounge จัดโต๊ะกลม 16 ท่าน ส่วน Royal Lounge จัดโต๊ะยาว 18 ท่าน',
    ],
  }),
  // Ảnh ĐẠI DIỆN phải là bức KHÔNG có chữ nung sẵn trong ảnh.
  //
  // Bản trước dùng `…Convention-23.jpg` — bức chụp một cuộc hội đàm, trong đó
  // phông nền in "HỌP SONG PHƯƠNG — DIỄN ĐÀN DU LỊCH LIÊN KHU VỰC ĐÔNG Á
  // (EATOF)" chiếm gần nửa khung. Chữ nằm TRONG pixel thì không dịch được:
  // khách Nhật, Hàn, Trung, Thái đều nhìn thấy một dòng tiếng Việt trên thẻ
  // giới thiệu sảnh. Đây đúng là lý do bức `Cuoi-la-terrasse-05.jpg` đã bị
  // loại khỏi thư viện ảnh ở vòng trước — cùng một nguyên tắc.
  //
  // `…Convention-26.jpg` là CHÍNH căn phòng đó, không chữ, và vốn đã nằm sẵn
  // trong `gallery` mà không chỗ nào render. Đổi chỗ hai bức là xong, không
  // phải tìm ảnh mới.
  image: image('Royal-Ha-Long-Gallery-Convention-26.jpg', {
    vi: 'Phòng khách nhỏ trần vòm: hai hàng ghế bành bọc trắng quanh bàn trà mặt đồng, tường ốp trắng phào chỉ vàng, tranh phong cảnh treo giữa tường',
    en: 'A small lounge beneath a domed ceiling: two rows of white armchairs around brass-topped coffee tables, white panelled walls with gilt mouldings and a landscape painting on the far wall',
    zh: '穹顶下的小型会客厅：两排白色扶手椅围着铜面茶几，白色护墙板配金色线脚，墙面中央挂着一幅风景画',
    ko: '돔 천장 아래 작은 라운지: 황동 상판 티테이블을 둘러싼 흰색 안락의자 두 줄, 금색 몰딩을 두른 흰 패널 벽, 벽 가운데 걸린 풍경화',
    ja: 'ドーム天井の下の小さなラウンジ。真鍮天板のティーテーブルを囲む白いアームチェアが二列、金のモールディングを施した白い羽目板の壁、壁の中央に風景画',
    th: 'เลานจ์ขนาดเล็กใต้เพดานโดม เก้าอี้นวมสีขาวสองแถวล้อมโต๊ะกลางหน้าทองเหลือง ผนังบุไม้สีขาวคาดคิ้วทอง และภาพวาดทิวทัศน์แขวนกลางผนัง',
  }),
  gallery: [
    image('Royal-Ha-Long-Gallery-Convention-23.jpg', {
      vi: 'Cuộc hội đàm song phương trong phòng nhỏ: hai đoàn ngồi trên ghế bành kem dọc bàn thấp, phông nền in tiêu đề hội nghị và cờ các nước phía sau',
      en: 'A bilateral talk in a small room: two delegations seated in cream armchairs along low tables, with a printed backdrop carrying the conference title and national flags behind them',
      zh: '小房间里的双边会谈：两方代表团坐在米色扶手椅上，沿低矮茶几相对，身后是印有会议名称与各国国旗的背景板',
      ko: '작은 방에서 열린 양자 회담: 두 대표단이 낮은 탁자를 사이에 두고 크림색 안락의자에 앉았고, 뒤로는 회의 명칭과 각국 국기가 인쇄된 배경막이 있습니다',
      ja: '小部屋での二国間会談。両代表団が低いテーブルを挟んでクリーム色のアームチェアに座り、背後には会議名と各国の国旗を印刷したバックボードが立つ',
      th: 'การหารือทวิภาคีในห้องขนาดเล็ก คณะผู้แทนสองฝ่ายนั่งบนเก้าอี้นวมสีครีมขนาบโต๊ะเตี้ย ด้านหลังเป็นฉากพิมพ์ชื่อการประชุมและธงชาติของแต่ละประเทศ',
    }),
  ],
}

/* ================================================================== *
 * GHI
 * ================================================================== */

async function main() {
  console.log('\n— Ghi hai trang —')
  await patchDoc('page.royal-international-convention-palace', {
    title: loc({
      vi: 'CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG',
      en: 'Royal International Convention Palace',
      zh: '皇家国际会议宫',
      ko: '로열 인터내셔널 컨벤션 팰리스',
      ja: 'ロイヤル国際コンベンションパレス',
      th: 'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
    }),
    slug: slugAll('royal-international-convention-palace'),
    seo: {
      _type: 'seo',
      metaDescription: loc({
        vi: 'Cung Hội nghị Quốc tế Hoàng Gia Hạ Long: 5 tầng, 2 phòng ballroom và 3 phòng họp, tổng sức chứa gần 2.000 khách. Xem diện tích và sức chứa từng sảnh theo sáu kiểu bố trí.',
        en: 'The Royal International Convention Palace: five floors, two ballrooms and three function rooms holding close to 2,000 guests. See the area and capacity of every hall in six layouts.',
        zh: '皇家国际会议宫：5 层楼，2 间宴会厅与 3 间会议室，总容纳人数近 2,000 位客人。查看各厅在六种布置方式下的面积与容纳人数。',
        ko: '로열 인터내셔널 컨벤션 팰리스: 5개 층, 볼룸 2개와 회의실 3개로 총 2,000명 가까이 수용합니다. 여섯 가지 배치별 각 홀의 면적과 수용 인원을 확인하세요.',
        ja: 'ロイヤル国際コンベンションパレス：5階建て、ボールルーム2室と会議室3室で総収容人数は約2,000名。六つのレイアウトごとの各ホールの面積と収容人数をご覧ください。',
        th: 'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ อาคาร 5 ชั้น บอลรูม 2 ห้องและห้องประชุม 3 ห้อง ความจุรวมเกือบ 2,000 ท่าน ดูพื้นที่และความจุของแต่ละห้องตามการจัดผังทั้งหกแบบ',
      }),
    },
    sections: conventionSections,
  })

  await patchDoc('page.wedding', {
    title: loc({
      vi: 'TIỆC CƯỚI',
      en: 'Weddings',
      zh: '婚礼',
      ko: '웨딩',
      ja: 'ウエディング',
      th: 'งานแต่งงาน',
    }),
    slug: slugAll('wedding'),
    seo: {
      _type: 'seo',
      metaDescription: loc({
        vi: 'Tiệc cưới tại Cung Hội nghị Quốc tế Hoàng Gia Hạ Long: sảnh 768 m² cho 550 khách tiệc ngồi hoặc 1.000 khách tiệc đứng, và những phòng 36 m² cho lễ dạm ngõ.',
        en: 'Weddings at the Royal International Convention Palace: a 768 m² ballroom seating 550 at a banquet or holding 1,000 standing, and 36 m² rooms for an engagement lunch.',
        zh: '皇家国际会议宫的婚礼：768 m² 宴会厅可安排宴会式 550 位客人或鸡尾酒会式 1,000 位，另有 36 m² 小厅用于订婚宴。',
        ko: '로열 인터내셔널 컨벤션 팰리스의 웨딩: 768 m² 홀은 연회식 550명 또는 칵테일식 1,000명을 수용하고, 36 m² 룸은 약혼식에 알맞습니다.',
        ja: 'ロイヤル国際コンベンションパレスのウエディング。768 m²のホールはバンケット形式550名、カクテル形式1,000名。36 m²の小部屋は結納にも使えます。',
        th: 'งานแต่งงานที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ ห้องขนาด 768 ตร.ม. รองรับแบบจัดเลี้ยง 550 ท่าน หรือแบบค็อกเทล 1,000 ท่าน และห้องขนาด 36 ตร.ม. สำหรับงานหมั้น',
      }),
    },
    sections: weddingSections,
  })

  console.log('\n— Ghi ba phòng hội nghị —')
  await patchDoc('hall.ha-long', hallHaLong)
  await patchDoc('hall.hoang-gia', hallHoangGia)
  await patchDoc('hall.royal-bay-lounge', hallLounge)

  console.log(`\n— Đã gắn ${usedImages.size} ảnh —`)
  Array.from(usedImages).sort().forEach((name) => console.log('   ' + name))

  console.log('\n— Kiểm tra bản dịch —')
  let holes = 0
  for (const id of [
    'page.royal-international-convention-palace',
    'page.wedding',
    'hall.ha-long',
    'hall.hoang-gia',
    'hall.royal-bay-lounge',
  ]) {
    holes += await assertFullyTranslated(id)
  }
  console.log(`\nTổng ${holes} field chưa đủ 6 ngôn ngữ.`)
  if (holes) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
