import { LOCALES, INTL_LOCALES, type Locale } from './i18n'

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

  // --- Nhãn dữ liệu lặp lại trên thẻ phòng / nhà hàng / phòng hội nghị ---
  // Trước đây sáu nhãn này viết thẳng tiếng Việt trong JSX
  // (`VenueListSection`, `HallListSection`, `RoomPage`, `RoomListSection`),
  // nên trang /ja/culinary hiện tên nhà hàng tiếng Nhật bên cạnh nhãn
  // "Địa điểm" tiếng Việt. Đây đúng là lớp lỗi mà file này sinh ra để chặn.
  labelLocation: {
    vi: 'Địa điểm',
    en: 'Location',
    zh: '位置',
    ko: '위치',
    ja: '場所',
    th: 'ที่ตั้ง',
  },
  labelCapacity: {
    vi: 'Sức chứa',
    en: 'Capacity',
    zh: '容纳人数',
    ko: '수용 인원',
    ja: '収容人数',
    th: 'ความจุ',
  },
  labelHours: {
    vi: 'Mở cửa',
    en: 'Hours',
    zh: '营业时间',
    ko: '운영 시간',
    ja: '営業時間',
    th: 'เวลาเปิดบริการ',
  },
  labelPhone: {
    vi: 'Điện thoại',
    en: 'Telephone',
    zh: '电话',
    ko: '전화',
    ja: '電話',
    th: 'โทรศัพท์',
  },
  labelArea: {
    vi: 'Diện tích',
    en: 'Area',
    zh: '面积',
    ko: '면적',
    ja: '広さ',
    th: 'พื้นที่',
  },
  // Nhãn của mảng `highlights` trên `venue` — schema gọi field đó là "Món đặc
  // trưng / Điểm nhấn", và dữ liệu thật đúng là cả hai: năm MÓN ở nhà hàng
  // Phúc Viên, nhưng ở ba quầy bar lại là đặc điểm không gian ("Âm nhạc du
  // dương", "Không gian xanh"). Nên nhãn phải trung tính — gọi tất cả là
  // "món đặc trưng" thì dòng của La Terrasse đọc ra sai.
  labelHighlights: {
    vi: 'Điểm nhấn',
    en: 'Highlights',
    zh: '亮点',
    ko: '하이라이트',
    ja: 'おすすめ',
    th: 'ไฮไลต์',
  },
  // Tên truy cập của dải mục lục nhảy tới từng điểm ẩm thực (trang /culinary).
  // Dùng ĐÚNG cách gọi "điểm ẩm thực" mà tiêu đề khối trong Sanity đã chốt ở
  // cả sáu ngôn ngữ, không đặt thêm một cách gọi thứ hai.
  diningIndex: {
    vi: 'Mục lục điểm ẩm thực',
    en: 'Where to eat & drink — index',
    zh: '餐饮场所目录',
    ko: '식음 시설 목차',
    ja: 'レストラン＆バー一覧',
    th: 'สารบัญร้านอาหารและบาร์',
  },
  viewMenu: {
    vi: 'Xem menu',
    en: 'View menu',
    zh: '查看菜单',
    ko: '메뉴 보기',
    ja: 'メニューを見る',
    th: 'ดูเมนู',
  },
  viewDetails: {
    vi: 'Xem chi tiết',
    en: 'View details',
    zh: '查看详情',
    ko: '자세히 보기',
    ja: '詳細を見る',
    th: 'ดูรายละเอียด',
  },
  bookNow: {
    vi: 'Đặt phòng',
    en: 'Book now',
    zh: '立即预订',
    ko: '지금 예약',
    ja: '今すぐ予約',
    th: 'จองเลย',
  },
  roomAmenities: {
    vi: 'Tiện nghi phòng',
    en: 'Room amenities',
    zh: '客房设施',
    ko: '객실 편의시설',
    ja: '客室設備',
    th: 'สิ่งอำนวยความสะดวกในห้องพัก',
  },
  roomPhotos: {
    vi: 'Hình ảnh phòng',
    en: 'Room photos',
    zh: '客房照片',
    ko: '객실 사진',
    ja: '客室写真',
    th: 'ภาพห้องพัก',
  },
  dataTableScroll: {
    vi: 'Bảng dữ liệu, cuộn ngang',
    en: 'Data table, scrolls horizontally',
    zh: '数据表格，可横向滚动',
    ko: '데이터 표, 가로로 스크롤됩니다',
    ja: 'データ表、横スクロールできます',
    th: 'ตารางข้อมูล เลื่อนแนวนอนได้',
  },
  notFoundTitle: {
    vi: 'Không tìm thấy trang',
    en: 'Page not found',
    zh: '未找到页面',
    ko: '페이지를 찾을 수 없습니다',
    ja: 'ページが見つかりません',
    th: 'ไม่พบหน้าที่ต้องการ',
  },
  notFoundBody: {
    vi: 'Trang bạn tìm không tồn tại hoặc đã được chuyển đi.',
    en: 'The page you are looking for does not exist or has been moved.',
    zh: '您访问的页面不存在或已被移动。',
    ko: '찾으시는 페이지가 존재하지 않거나 이동되었습니다.',
    ja: 'お探しのページは存在しないか、移動されました。',
    th: 'ไม่มีหน้าที่คุณค้นหา หรือหน้านี้ถูกย้ายไปแล้ว',
  },
  backHome: {
    vi: 'Về trang chủ',
    en: 'Back to home',
    zh: '返回首页',
    ko: '홈으로 돌아가기',
    ja: 'ホームに戻る',
    th: 'กลับสู่หน้าแรก',
  },

  // --- Chân trang: thông tin pháp lý doanh nghiệp ---
  // Ba nhãn này trước đây ghép thẳng trong JSX thành một câu tiếng Việt
  // ("GCN ĐKDN: 5700102119 do Sở KH&ĐT… cấp lần đầu ngày 01/07/2008"). Câu đó
  // không dịch được bằng cách thay từng mảnh: trật tự "do X cấp" đảo ngược ở
  // tiếng Nhật và tiếng Hàn, còn tiếng Thái không có giới từ tương đương. Nên
  // tách thành BA DÒNG CÓ NHÃN — cấu trúc này dịch được sang mọi ngôn ngữ mà
  // không phải bịa ngữ pháp.
  licenseLabel: {
    vi: 'GCN ĐKDN',
    en: 'Business registration no.',
    zh: '企业注册号',
    ko: '사업자등록번호',
    ja: '事業者登録番号',
    th: 'เลขทะเบียนนิติบุคคล',
  },
  licenseIssuerLabel: {
    vi: 'Nơi cấp',
    en: 'Issued by',
    zh: '签发机关',
    ko: '발급기관',
    ja: '発行機関',
    th: 'หน่วยงานที่ออก',
  },
  licenseDateLabel: {
    vi: 'Cấp lần đầu',
    en: 'First issued',
    zh: '首次签发',
    ko: '최초 발급일',
    ja: '初回発行日',
    th: 'ออกครั้งแรก',
  },
  // "Bộ Công Thương" là cơ quan nhà nước Việt Nam — giữ tên đầy đủ, dịch phần
  // mô tả xung quanh. Khách nước ngoài cần hiểu ĐÂY LÀ GÌ, không cần đoán.
  motNotified: {
    vi: 'Đã thông báo Bộ Công Thương',
    en: 'Registered with the Vietnam Ministry of Industry and Trade',
    zh: '已向越南工贸部备案',
    ko: '베트남 산업무역부 신고 완료',
    ja: 'ベトナム商工省へ届出済み',
    th: 'แจ้งจดทะเบียนกับกระทรวงอุตสาหกรรมและการค้าเวียดนามแล้ว',
  },
  motVerify: {
    vi: 'Xác thực đăng ký với Bộ Công Thương',
    en: 'Verify this registration with the Vietnam Ministry of Industry and Trade',
    zh: '在越南工贸部核验此备案',
    ko: '베트남 산업무역부에서 신고 내역 확인',
    ja: 'ベトナム商工省で届出内容を確認する',
    th: 'ตรวจสอบการจดทะเบียนนี้กับกระทรวงอุตสาหกรรมและการค้าเวียดนาม',
  },
  labelHotline: {
    vi: 'Đường dây nóng',
    en: 'Hotline',
    zh: '热线',
    ko: '핫라인',
    ja: 'ホットライン',
    th: 'สายด่วน',
  },
  closeLightbox: {
    vi: 'Đóng ảnh phóng to',
    en: 'Close',
    zh: '关闭',
    ko: '닫기',
    ja: '閉じる',
    th: 'ปิด',
  },
  labelMobile: {
    vi: 'Di động',
    en: 'Mobile',
    zh: '手机',
    ko: '휴대전화',
    ja: '携帯',
    th: 'มือถือ',
  },

  // Nhãn của màn hình chờ (`components/ui/LoadingScreen.tsx`). Nó vừa là chữ
  // NHÌN THẤY dưới logo, vừa là tên truy cập của vùng `role="status"` — nên
  // phải là một câu trạng thái ("đang tải"), không phải một danh từ ("tải").
  loading: {
    vi: 'Đang tải',
    en: 'Loading',
    zh: '加载中',
    ko: '불러오는 중',
    ja: '読み込み中',
    th: 'กำลังโหลด',
  },

  // Tên truy cập của thanh mục lục trong trang (`PageNavSection`). Trang
  // /wedding có HAI vùng `<nav>` ở đầu trang — menu chính của header và
  // thanh này. Trùng tên thì người dùng screen reader nghe "navigation" hai
  // lần mà không biết vùng nào dẫn đi đâu; cùng lý do với `mainMenuMore`.
  onThisPage: {
    vi: 'Mục lục trang',
    en: 'On this page',
    zh: '本页目录',
    ko: '이 페이지 목차',
    ja: 'このページの目次',
    th: 'สารบัญหน้านี้',
  },

  // Nhãn thanh trượt số khách (`CapacityPickerSection`).
  expectedGuests: {
    vi: 'Số khách dự kiến',
    en: 'Expected guests',
    zh: '预计客人数',
    ko: '예상 하객 수',
    ja: '予定人数',
    th: 'จำนวนแขกโดยประมาณ',
  },

  // Huy hiệu trên hàng sảnh còn nhận được số khách đang chọn. Một TÍNH TỪ
  // ngắn, không phải câu — nó đứng ngay sau tên sảnh trong cùng một ô.
  capacityFits: {
    vi: 'Vừa',
    en: 'Fits',
    zh: '可容纳',
    ko: '가능',
    ja: '収容可',
    th: 'รองรับได้',
  },

  // Ô gạch ngang trong bảng sức chứa = "sảnh này không kê được kiểu đó".
  // Screen reader đọc "—" thành "gạch ngang" hoặc bỏ qua hẳn, nên ô rỗng
  // phải có tên truy cập riêng (`aria-label`), không để mỗi dấu gạch.
  capacityNotOffered: {
    vi: 'Không áp dụng',
    en: 'Not offered',
    zh: '不适用',
    ko: '해당 없음',
    ja: '対応なし',
    th: 'ไม่รองรับ',
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
const GUEST_UNIT: Record<Locale, (n: string) => string> = {
  vi: (n) => `${n} khách`,
  // Số nhiều tiếng Anh đọc từ CHUỖI đã định dạng, không phải từ số: `'1'` là
  // trường hợp duy nhất dùng số ít, và `Intl` không chèn dấu phân tách vào
  // một chữ số nên phép so sánh này luôn đúng.
  en: (n) => `${n} ${n === '1' ? 'guest' : 'guests'}`,
  zh: (n) => `${n} 位`,
  ko: (n) => `${n}명`,
  ja: (n) => `${n}名`,
  th: (n) => `${n} ท่าน`,
}

/**
 * Số có dấu phân tách hàng nghìn theo đúng quy ước từng ngôn ngữ: `vi` dùng
 * dấu CHẤM (`1.000`), năm ngôn ngữ còn lại dùng dấu phẩy. Giống hệt hàm
 * `n()` trong `scripts/content/build.ts` — cùng một quy tắc, một bên cho nội
 * dung seed sẵn, một bên cho con số tính ra lúc chạy.
 *
 * Trước bản này `guestsLabel` nội suy số THÔ, nên nó đúng với thanh đặt
 * phòng (1–6 khách, không có hàng nghìn) và sẽ ra "1000 khách" ngay khi có
 * nơi thứ hai dùng số lớn — đúng chỗ khối tra sức chứa đang dùng.
 */
function formatCount(count: number, lang: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALES[lang]).format(count)
}

export function guestsLabel(count: number, lang: Locale): string {
  return GUEST_UNIT[lang](formatCount(count, lang))
}

/**
 * Câu tóm tắt dưới bảng sức chứa (`CapacityPickerSection`): "Với 420 khách,
 * 4 trong 8 không gian còn phù hợp."
 *
 * Là HÀM chứ không phải chuỗi trong `DICT` vì nó chèn hai con số vào giữa
 * câu, và trật tự từ khác nhau ở sáu ngôn ngữ — ghép `"Với " + n + " khách"`
 * ở nơi gọi là cách chắc chắn để bốn ngôn ngữ còn lại ra câu sai ngữ pháp.
 * Cùng lối viết với `GUEST_UNIT` ngay trên.
 *
 * `guests` nhận chuỗi ĐÃ định dạng (qua `guestsLabel`) chứ không phải số
 * thô: nó đã mang sẵn đơn vị đúng lượng từ của từng ngôn ngữ.
 */
const CAPACITY_NOTE: Record<Locale, (guests: string, fit: string, total: string) => string> = {
  vi: (g, fit, total) => `Với ${g}, ${fit} trong ${total} không gian còn phù hợp.`,
  en: (g, fit, total) => `For ${g}, ${fit} of ${total} spaces still fit.`,
  zh: (g, fit, total) => `按 ${g} 计算，${total} 个场地中有 ${fit} 个仍可容纳。`,
  ko: (g, fit, total) => `${g} 기준으로 ${total}개 공간 중 ${fit}개가 가능합니다.`,
  ja: (g, fit, total) => `${g}の場合、${total}会場のうち${fit}会場が対応できます。`,
  th: (g, fit, total) => `สำหรับ ${g} มี ${fit} จาก ${total} พื้นที่ที่ยังรองรับได้`,
}

/** Không sảnh nào đủ chỗ — câu này phải chỉ ra đường đi tiếp, không chỉ báo
 * "không có kết quả". Trạng thái RỖNG của khối tra sức chứa. */
const CAPACITY_NO_MATCH: Record<Locale, (guests: string) => string> = {
  vi: (g) => `Với ${g}, cần ghép nhiều sảnh — bộ phận tiệc cưới sẽ sắp xếp giúp bạn.`,
  en: (g) => `For ${g} the halls need to be combined — the wedding team will arrange it with you.`,
  zh: (g) => `按 ${g} 计算需要合并多个厅，婚礼团队会为您安排。`,
  ko: (g) => `${g} 규모는 여러 홀을 이어서 사용해야 합니다. 웨딩팀이 함께 준비해 드립니다.`,
  ja: (g) => `${g}規模では複数の会場をつなげる必要があります。ウエディング担当がご相談に応じます。`,
  th: (g) => `สำหรับ ${g} ต้องใช้หลายห้องรวมกัน ทีมงานจัดงานแต่งงานจะจัดเตรียมให้ท่าน`,
}

export function capacityNote(
  guests: string,
  fit: string,
  total: string,
  lang: Locale,
): string {
  return CAPACITY_NOTE[lang](guests, fit, total)
}

export function capacityNoMatch(guests: string, lang: Locale): string {
  return CAPACITY_NO_MATCH[lang](guests)
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
