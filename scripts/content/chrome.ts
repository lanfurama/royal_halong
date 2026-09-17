/**
 * Dịch KHUNG DÙNG CHUNG: menu header, cột footer, thông tin site.
 *
 * Tách riêng khỏi script của từng trang vì `navigation` và `siteSettings` là
 * hai document mà MỌI trang đều đọc — để mỗi script trang tự vá một phần của
 * chúng thì lần ghi sau sẽ đè lần ghi trước.
 *
 * Nhãn menu header chọn theo NGÂN SÁCH BỀ NGANG chứ không chọn bản dịch sát
 * nghĩa nhất: ở 1180px (ngưỡng `nav`, chật nhất) tám mục chỉ có 614px
 * (xem CLAUDE.md § Header). Vì thế "LƯU TRÚ" sang tiếng Anh là `ROOMS` chứ
 * không phải `ACCOMMODATION` — dài hơn 6 ký tự là chồng lấn logo.
 */
import { LOCALES, type Locale } from '../../lib/i18n'
import { patchDoc, assertFullyTranslated } from './write'

type Six = Record<Locale, string>
const L = (vi: string, en: string, zh: string, ko: string, ja: string, th: string): Six => ({ vi, en, zh, ko, ja, th })

/** Nhãn từng mục menu header, theo `_key` của `navItem`. */
const HEADER: Record<string, Six> = {
  'nav-0': L('LƯU TRÚ', 'ROOMS', '客房', '객실', '客室', 'ห้องพัก'),
  'nav-1': L('CASINO', 'CASINO', '娱乐场', '카지노', 'カジノ', 'คาสิโน'),
  'nav-2': L('ẨM THỰC', 'DINING', '餐饮', '다이닝', 'ダイニング', 'ร้านอาหาร'),
  'nav-3': L('HỘI NGHỊ & TIỆC CƯỚI', 'MEETINGS & WEDDINGS', '会议与婚礼', '회의 & 웨딩', '会議・ウエディング', 'ประชุม & แต่งงาน'),
  'nav-4': L('TRẢI NGHIỆM', 'EXPERIENCES', '体验', '경험', '体験', 'ประสบการณ์'),
  'nav-5': L('THƯ VIỆN', 'GALLERY', '图片库', '갤러리', 'ギャラリー', 'แกลเลอรี'),
  'nav-6': L('TIN TỨC', 'NEWS', '新闻', '뉴스', 'ニュース', 'ข่าวสาร'),
  'nav-7': L('ƯU ĐÃI', 'OFFERS', '优惠', '프로모션', '特別プラン', 'โปรโมชัน'),
  'nav-8': L('ĐẶT PHÒNG', 'BOOK NOW', '立即预订', '지금 예약', '今すぐ予約', 'จองเลย'),
}

/** Mục con trong dropdown — không bị ngân sách bề ngang của thanh menu. */
const CHILDREN: Record<string, Six> = {
  'nav-3-0': L('TIỆC CƯỚI', 'WEDDINGS', '婚礼', '웨딩', 'ウエディング', 'งานแต่งงาน'),
  'nav-3-1': L(
    'CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG',
    'ROYAL INTERNATIONAL CONVENTION PALACE',
    '皇家国际会议宫',
    '로열 인터내셔널 컨벤션 팰리스',
    'ロイヤル国際コンベンションパレス',
    'รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ',
  ),
  'nav-6-0': L('TIN TỨC & BÁO CHÍ', 'NEWS & PRESS', '新闻与媒体', '뉴스 & 보도자료', 'ニュース・プレス', 'ข่าวสารและสื่อ'),
  'nav-6-1': L('THÔNG BÁO', 'ANNOUNCEMENTS', '公告', '공지사항', 'お知らせ', 'ประกาศ'),
}

const FOOTER_TITLES: Record<string, Six> = {
  'col-0': L('Thông tin', 'Information', '信息', '안내', 'インフォメーション', 'ข้อมูล'),
  'col-1': L('Khám phá', 'Explore', '探索', '둘러보기', '見どころ', 'สำรวจ'),
}

const FOOTER_LINKS: Record<string, Six> = {
  'col-0-0': L('Chính sách chung', 'Terms & conditions', '条款与条件', '이용약관', '利用規約', 'ข้อกำหนดและเงื่อนไข'),
  'col-0-1': L('Chính sách bảo mật', 'Privacy policy', '隐私政策', '개인정보 처리방침', 'プライバシーポリシー', 'นโยบายความเป็นส่วนตัว'),
  'col-0-2': L('Phương thức thanh toán', 'Payment methods', '支付方式', '결제 수단', 'お支払い方法', 'วิธีการชำระเงิน'),
  'col-1-0': L('Lưu trú', 'Rooms & villas', '客房与别墅', '객실 & 빌라', '客室・ヴィラ', 'ห้องพักและวิลล่า'),
  'col-1-1': L('Casino', 'Casino', '娱乐场', '카지노', 'カジノ', 'คาสิโน'),
  'col-1-2': L('Ẩm thực', 'Dining', '餐饮', '다이닝', 'ダイニング', 'ร้านอาหาร'),
  'col-1-3': L('Cung hội nghị', 'Convention palace', '会议宫', '컨벤션 팰리스', 'コンベンションパレス', 'คอนเวนชัน พาเลซ'),
  'col-1-4': L('Tiệc cưới', 'Weddings', '婚礼', '웨딩', 'ウエディング', 'งานแต่งงาน'),
  'col-1-5': L('Trải nghiệm', 'Experiences', '体验', '경험', '体験', 'ประสบการณ์'),
  'col-1-6': L('Ưu đãi', 'Offers', '优惠', '프로모션', '特別プラン', 'โปรโมชัน'),
}

const SETTINGS: Record<string, Six> = {
  // TÊN THƯƠNG HIỆU GIỮ DẠNG LATINH Ở CẢ SÁU NGÔN NGỮ — đúng theo
  // `GLOSSARY.md`, và bản dịch nội dung của cả tám nhóm đã theo quy ước đó.
  //
  // Bản đầu ở đây phiên âm sang từng thị trường (`皇家下龙酒店`,
  // `ロイヤル・ハロン・ホテル`, …) và điều đó sinh ra một lỗi thấy được trên
  // mọi trang: `seo.metaTitle` do người viết nội dung đặt đã kèm sẵn tên
  // khách sạn dạng Latinh, rồi `buildMetadata()` nối thêm `brandName` lần
  // nữa — thẻ `<title>` mang tên khách sạn HAI LẦN, ở HAI DẠNG khác nhau:
  //
  //   ニュース・プレス — Royal Ha Long Hotel — ロイヤル・ハロン・ホテル
  //
  // Google cắt `<title>` quanh 60 ký tự, nên phần lặp đó ăn mất chỗ của nội
  // dung thật. `titleWithBrand()` (lib/seo.ts) nay bỏ được phần lặp, nhưng nó
  // chỉ nhận ra khi hai bên viết CÙNG một dạng.
  //
  // Đây cũng là dạng khách quốc tế gõ khi tìm phòng và là dạng in trên chính
  // toà nhà. Tên công ty, địa chỉ, cơ quan cấp phép bên dưới VẪN dịch —
  // chúng là thông tin mô tả, không phải tên thương hiệu.
  brandName: L(
    'ROYAL HẠ LONG HOTEL',
    'ROYAL HA LONG HOTEL',
    'ROYAL HA LONG HOTEL',
    'ROYAL HA LONG HOTEL',
    'ROYAL HA LONG HOTEL',
    'ROYAL HA LONG HOTEL',
  ),
  companyName: L(
    'Công ty Cổ phần Quốc tế Hoàng Gia',
    'Royal International Corporation',
    '皇家国际股份公司',
    '로열 인터내셔널 주식회사',
    'ロイヤル・インターナショナル株式会社',
    'บริษัท รอยัล อินเตอร์เนชั่นแนล จำกัด (มหาชน)',
  ),
  addressFull: L(
    'Đường Hạ Long, Phường Bãi Cháy, Tỉnh Quảng Ninh, Việt Nam',
    'Ha Long Road, Bai Chay Ward, Quang Ninh Province, Vietnam',
    '越南广宁省拜寨坊下龙路',
    '베트남 꽝닌성 바이짜이동 하롱로',
    'ベトナム クアンニン省 バイチャイ坊 ハロン通り',
    'ถนนฮาลอง แขวงบ๊ายจ๋าย จังหวัดกว๋างนิญ ประเทศเวียดนาม',
  ),
  addressShort: L(
    'Bãi Cháy, TP. Hạ Long, Việt Nam',
    'Bai Chay, Ha Long City, Vietnam',
    '越南下龙市拜寨',
    '베트남 하롱시 바이짜이',
    'ベトナム ハロン市 バイチャイ',
    'บ๊ายจ๋าย เมืองฮาลอง เวียดนาม',
  ),
  copyright: L(
    '© 2026 Royal Halong Hotel. Bảo lưu mọi quyền.',
    '© 2026 Royal Halong Hotel. All rights reserved.',
    '© 2026 Royal Halong Hotel. 版权所有。',
    '© 2026 Royal Halong Hotel. All rights reserved.',
    '© 2026 Royal Halong Hotel. All rights reserved.',
    '© 2026 Royal Halong Hotel. สงวนลิขสิทธิ์',
  ),
  licenseIssuer: L(
    'Sở Kế hoạch và Đầu tư Tỉnh Quảng Ninh',
    'Quang Ninh Provincial Department of Planning and Investment',
    '广宁省计划投资厅',
    '꽝닌성 기획투자국',
    'クアンニン省計画投資局',
    'กรมวางแผนและการลงทุน จังหวัดกว๋างนิญ',
  ),
}

async function main() {
  const { writeClient } = await import('./write')
  const nav: any = await writeClient.fetch(`*[_id == "navigation"][0]`)
  if (!nav) throw new Error('Không có document `navigation`')

  // Vá tại chỗ trên bản sao: giữ nguyên `_key`/`reference`/thứ tự, chỉ thay
  // `label`. Ghi lại cả mảng thay vì patch từng đường dẫn con — Sanity không
  // cho `set` theo `_key` lồng nhiều tầng mà không có khai báo đường dẫn dài
  // và dễ sai; mảng này chỉ 9 phần tử.
  for (const item of nav.header ?? []) {
    const label = HEADER[item._key]
    if (!label) throw new Error(`HEADER thiếu bản dịch cho _key "${item._key}"`)
    item.label = { ...label }
    if (item.link) item.link.label = { ...label }
    for (const child of item.children ?? []) {
      const childLabel = CHILDREN[child._key]
      if (!childLabel) throw new Error(`CHILDREN thiếu bản dịch cho _key "${child._key}"`)
      child.label = { ...childLabel }
      if (child.link) child.link.label = { ...childLabel }
    }
  }

  for (const col of nav.footerColumns ?? []) {
    const title = FOOTER_TITLES[col._key]
    if (!title) throw new Error(`FOOTER_TITLES thiếu "${col._key}"`)
    col.title = { ...title }
    for (const link of col.links ?? []) {
      const label = FOOTER_LINKS[link._key]
      if (!label) throw new Error(`FOOTER_LINKS thiếu "${link._key}"`)
      link.label = { ...label }
    }
  }

  await patchDoc('navigation', { header: nav.header, footerColumns: nav.footerColumns })
  await patchDoc('siteSettings', SETTINGS)

  let holes = 0
  holes += await assertFullyTranslated('navigation')
  holes += await assertFullyTranslated('siteSettings')

  // In độ dài nhãn menu để soi ngân sách bề ngang trước khi mở trình duyệt.
  console.log('\nĐộ dài nhãn menu (8 mục, chưa tính ĐẶT PHÒNG):')
  for (const l of LOCALES) {
    const total = Object.entries(HEADER)
      .filter(([k]) => k !== 'nav-8')
      .reduce((n, [, v]) => n + v[l].length, 0)
    console.log(`  ${l}: ${total} ký tự`)
  }
  process.exit(holes ? 1 : 0)
}

main()
