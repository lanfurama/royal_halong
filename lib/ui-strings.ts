import { LOCALES, type Locale } from './i18n'

/**
 * Chuỗi giao diện — thứ KHÔNG nằm trong Sanity vì biên tập viên không sửa
 * (nhãn nút, tên truy cập cho screen reader, trạng thái form).
 *
 * Vì sao cần file này: trước khi có 6 ngôn ngữ, mỗi chỗ tự viết
 * `lang === 'vi' ? 'Đăng ký' : 'Subscribe'` — một biểu thức hai nhánh rải ở
 * 8 file. Thêm ngôn ngữ thứ ba là mọi khách Trung/Hàn/Nhật/Thái lặng lẽ nhận
 * bản tiếng Anh ở mọi nhánh `else` đó, không có gì báo. Một bảng duy nhất thì
 * TypeScript bắt được ngay khi thiếu bản dịch: `Record<Locale, string>` đòi
 * đủ sáu khoá.
 */
const DICT = {
  skipNav: {
    vi: 'Bỏ qua điều hướng',
    en: 'Skip to content',
    zh: '跳至主要内容',
    ko: '본문 바로가기',
    ja: '本文へスキップ',
    th: 'ข้ามไปยังเนื้อหาหลัก',
  },
  menu: { vi: 'Menu', en: 'Menu', zh: '菜单', ko: '메뉴', ja: 'メニュー', th: 'เมนู' },
  openMenu: {
    vi: 'Mở menu',
    en: 'Open menu',
    zh: '打开菜单',
    ko: '메뉴 열기',
    ja: 'メニューを開く',
    th: 'เปิดเมนู',
  },
  closeMenu: {
    vi: 'Đóng menu',
    en: 'Close menu',
    zh: '关闭菜单',
    ko: '메뉴 닫기',
    ja: 'メニューを閉じる',
    th: 'ปิดเมนู',
  },
  mainMenu: {
    vi: 'Menu chính',
    en: 'Main menu',
    zh: '主菜单',
    ko: '주 메뉴',
    ja: 'メインメニュー',
    th: 'เมนูหลัก',
  },
  mainMenuMobile: {
    vi: 'Menu chính (di động)',
    en: 'Main menu (mobile)',
    zh: '主菜单（移动版）',
    ko: '주 메뉴(모바일)',
    ja: 'メインメニュー（モバイル）',
    th: 'เมนูหลัก (มือถือ)',
  },
  // Menu ngang desktop bị LOGO cắt làm đôi (xem `Header.tsx`), nên nó là hai
  // vùng `<nav>` thật chứ không phải một. Hai vùng cùng vai trò mà trùng tên
  // truy cập thì người dùng screen reader nghe "navigation, Menu chính" hai
  // lần và không biết mình đang ở nửa nào — nửa sau phải có tên riêng.
  mainMenuMore: {
    vi: 'Menu chính (phần tiếp)',
    en: 'Main menu (continued)',
    zh: '主菜单（续）',
    ko: '주 메뉴(계속)',
    ja: 'メインメニュー（続き）',
    th: 'เมนูหลัก (ต่อ)',
  },
  language: { vi: 'Ngôn ngữ', en: 'Language', zh: '语言', ko: '언어', ja: '言語', th: 'ภาษา' },

  about: {
    vi: 'Về chúng tôi',
    en: 'About us',
    zh: '关于我们',
    ko: '소개',
    ja: '私たちについて',
    th: 'เกี่ยวกับเรา',
  },
  contact: {
    vi: 'Liên hệ',
    en: 'Contact',
    zh: '联系我们',
    ko: '문의하기',
    ja: 'お問い合わせ',
    th: 'ติดต่อเรา',
  },
  getOffers: {
    vi: 'Nhận ưu đãi',
    en: 'Get offers',
    zh: '获取优惠',
    ko: '프로모션 받기',
    ja: 'お得な情報',
    th: 'รับข้อเสนอพิเศษ',
  },
  emailPlaceholder: {
    vi: 'Email của bạn',
    en: 'Your email',
    zh: '您的邮箱',
    ko: '이메일 주소',
    ja: 'メールアドレス',
    th: 'อีเมลของคุณ',
  },
  subscribe: {
    vi: 'Đăng ký',
    en: 'Subscribe',
    zh: '订阅',
    ko: '구독하기',
    ja: '登録する',
    th: 'สมัครรับข่าวสาร',
  },
  sending: {
    vi: 'Đang gửi…',
    en: 'Sending…',
    zh: '发送中…',
    ko: '전송 중…',
    ja: '送信中…',
    th: 'กำลังส่ง…',
  },
  noPosts: {
    vi: 'Chưa có bài viết nào.',
    en: 'No articles yet.',
    zh: '暂无文章。',
    ko: '아직 게시글이 없습니다.',
    ja: '記事はまだありません。',
    th: 'ยังไม่มีบทความ',
  },

  photoGallery: {
    vi: 'Thư viện ảnh',
    en: 'Photo gallery',
    zh: '图片库',
    ko: '갤러리',
    ja: 'フォトギャラリー',
    th: 'แกลเลอรีภาพ',
  },
  viewAll: {
    vi: 'Xem toàn bộ',
    en: 'View all',
    zh: '查看全部',
    ko: '전체 보기',
    ja: 'すべて見る',
    th: 'ดูทั้งหมด',
  },
  prevImage: {
    vi: 'Ảnh trước',
    en: 'Previous image',
    zh: '上一张',
    ko: '이전 사진',
    ja: '前の写真',
    th: 'ภาพก่อนหน้า',
  },
  nextImage: {
    vi: 'Ảnh sau',
    en: 'Next image',
    zh: '下一张',
    ko: '다음 사진',
    ja: '次の写真',
    th: 'ภาพถัดไป',
  },
  zoomImage: {
    vi: 'Phóng to ảnh',
    en: 'Enlarge image',
    zh: '放大图片',
    ko: '사진 확대',
    ja: '写真を拡大',
    th: 'ขยายภาพ',
  },

  guestReviews: {
    vi: 'Cảm nhận của khách',
    en: 'Guest reviews',
    zh: '宾客评价',
    ko: '고객 후기',
    ja: 'お客様の声',
    th: 'รีวิวจากผู้เข้าพัก',
  },
  viewReview: {
    vi: 'Xem cảm nhận',
    en: 'View review',
    zh: '查看评价',
    ko: '후기 보기',
    ja: 'レビューを見る',
    th: 'ดูรีวิว',
  },

  checkIn: {
    vi: 'Nhận phòng',
    en: 'Check-in',
    zh: '入住日期',
    ko: '체크인',
    ja: 'チェックイン',
    th: 'เช็คอิน',
  },
  checkOut: {
    vi: 'Trả phòng',
    en: 'Check-out',
    zh: '退房日期',
    ko: '체크아웃',
    ja: 'チェックアウト',
    th: 'เช็คเอาท์',
  },
  guests: {
    vi: 'Khách',
    en: 'Guests',
    zh: '入住人数',
    ko: '인원',
    ja: 'ご利用人数',
    th: 'จำนวนผู้เข้าพัก',
  },
  addGuest: {
    vi: 'Thêm một khách',
    en: 'Add a guest',
    zh: '增加一位',
    ko: '인원 추가',
    ja: '人数を増やす',
    th: 'เพิ่มผู้เข้าพัก',
  },
  removeGuest: {
    vi: 'Bớt một khách',
    en: 'Remove a guest',
    zh: '减少一位',
    ko: '인원 감소',
    ja: '人数を減らす',
    th: 'ลดผู้เข้าพัก',
  },
  roomType: {
    vi: 'Loại phòng',
    en: 'Room type',
    zh: '房型',
    ko: '객실 타입',
    ja: 'お部屋タイプ',
    th: 'ประเภทห้องพัก',
  },
  checkAvailability: {
    vi: 'Kiểm tra phòng trống',
    en: 'Check availability',
    zh: '查询空房',
    ko: '예약 가능 확인',
    ja: '空室を検索',
    th: 'ตรวจสอบห้องว่าง',
  },

  findOnMap: {
    vi: 'Tìm chúng tôi trên bản đồ',
    en: 'Find us on the map',
    zh: '在地图上找到我们',
    ko: '지도에서 찾기',
    ja: '地図で見る',
    th: 'ค้นหาเราบนแผนที่',
  },
  getDirections: {
    vi: 'Chỉ đường',
    en: 'Get directions',
    zh: '路线导航',
    ko: '길찾기',
    ja: 'ルート案内',
    th: 'ดูเส้นทาง',
  },
  playVideo: {
    vi: 'Xem video giới thiệu',
    en: 'Watch the intro video',
    zh: '观看介绍视频',
    ko: '소개 영상 보기',
    ja: '紹介動画を見る',
    th: 'ดูวิดีโอแนะนำ',
  },
  closeVideo: {
    vi: 'Đóng video',
    en: 'Close video',
    zh: '关闭视频',
    ko: '영상 닫기',
    ja: '動画を閉じる',
    th: 'ปิดวิดีโอ',
  },
} satisfies Record<string, Record<Locale, string>>

export type UiKey = keyof typeof DICT

export function ui(key: UiKey, lang: Locale): string {
  return DICT[key][lang]
}

/**
 * "2 khách" / "2 guests" / "2位" …
 *
 * Không dùng `Intl.PluralRules` cho một chuỗi hai từ: trong sáu ngôn ngữ ở
 * đây chỉ tiếng Anh có số nhiều, và nó là trường hợp duy nhất cần rẽ nhánh.
 * Tiếng Trung/Nhật dùng LƯỢNG TỪ đứng sau số ("2位" / "2名"), tiếng Hàn và
 * tiếng Thái cũng vậy ("2명" / "2 ท่าน") — nên đây là phép ghép "số + đơn vị"
 * chứ không phải phép chia số ít/số nhiều.
 */
const GUEST_UNIT: Record<Locale, (n: number) => string> = {
  vi: (n) => `${n} khách`,
  en: (n) => `${n} ${n === 1 ? 'guest' : 'guests'}`,
  zh: (n) => `${n} 位`,
  ko: (n) => `${n}명`,
  ja: (n) => `${n}名`,
  th: (n) => `${n} ท่าน`,
}

export function guestsLabel(count: number, lang: Locale): string {
  return GUEST_UNIT[lang](count)
}

// Tự kiểm: mọi mục trong DICT phải có đủ sáu locale. `satisfies` ở trên đã
// bắt được lúc biên dịch; dòng này giữ cho một lần refactor sau (vd. đổi
// DICT sang import từ JSON, lúc đó `satisfies` không còn hiệu lực) vẫn nổ
// ngay ở test thay vì hiện chuỗi `undefined` trên production.
export function missingTranslations(): string[] {
  const gaps: string[] = []
  for (const [key, values] of Object.entries(DICT)) {
    for (const locale of LOCALES) {
      if (!(values as Record<string, string>)[locale]) gaps.push(`${key}.${locale}`)
    }
  }
  return gaps
}
