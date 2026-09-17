/**
 * Nhóm B — ẨM THỰC.
 *
 * Ghi vào ĐÚNG năm document: `page.culinary` và bốn `venue.*` loại `dining`.
 * Không chạm tới `venue.be-boi` / `venue.outdoor-swimming-pool` /
 * `venue.fitness-center` / `venue.renata-spa` (nhóm D giữ), không chạm
 * `navigation` / `siteSettings` / `homePage`.
 *
 * Chạy: `npx tsx scripts/content/am-thuc.ts` — idempotent, chạy bao nhiêu lần
 * cũng ra cùng một kết quả (`resetKeys()` ở đầu `main()` + `_key` đặt tay cho
 * section nên mỗi lần chạy sinh đúng cùng bộ khoá).
 *
 * NGUỒN SỐ LIỆU — chỉ lấy từ `culinary/index.html` (bản clone):
 *   - Phúc Viên: tầng 2, 250 khách + 2 phòng VIP, mở 24/7,
 *     hotline 0787 389 018 – 02033 848 777, 5 món đặc trưng, link menu Drive.
 *   - Piano Bar: trong sảnh, 40 chỗ ngồi, cocktail + đồ uống đặc biệt,
 *     cùng link menu Drive.
 *   - Pool Bar: cạnh bể bơi ngoài trời, đồ uống mát + đồ ăn nhẹ Á – Âu.
 *   - La Terrasse: quầy bar ngoài trời giữa khuôn viên kiểu Âu, trà nóng và
 *     quà chiều cuối tuần.
 * Bản clone KHÔNG có giờ mở cửa của ba quầy bar và không có menu riêng cho
 * Pool Bar / La Terrasse (thẻ `<a href="">` rỗng) — nên các field đó để trống,
 * không bịa. Chi tiết xem NOTES của cặp.
 *
 * Hai lỗi chính tả của bản clone đã sửa khi chép sang đây: "món u" và
 * "khuôn viên kiểu u" thực ra là "món Âu" / "khuôn viên kiểu Âu" (mất chữ Â
 * do lỗi mã hoá của bản WordPress gốc).
 *
 * ── ĐỦ SÁU NGÔN NGỮ ───────────────────────────────────────────────────────
 * Vòng dựng (Agent 1) chỉ viết `vi` + `en` và dùng bốn helper nháp `*D` nới
 * điều kiện xuống "đủ vi + en". Vòng dịch (Agent 2) đã điền `zh/ko/ja/th`,
 * nên file này gọi THẲNG `loc()` / `blockLoc()` / `fig()` / `linkTo()` /
 * `linkOut()` trong `build.ts`: xoá nhầm một bản dịch là script ném lỗi ngay
 * lúc dựng, KHÔNG âm thầm đẩy một field rỗng lên Sanity.
 *
 * Thuật ngữ và tên riêng lấy từ `GLOSSARY.md`:
 *   Phúc Viên → `Phuc Vien Restaurant` · 福缘中餐厅 · 푹비엔 레스토랑 ·
 *   フックヴィエン・レストラン · ภัตตาคารฟุกเวียน;
 *   `Piano Bar` / `Pool Bar` / `La Terrasse` giữ nguyên ở cả sáu.
 * Tên "Cung Hội nghị Quốc tế Hoàng Gia" ở zh/ko/ja/th lấy ĐÚNG dạng đã chốt
 * trong document dùng chung `navigation` (皇家国际会议宫 / 로열 인터내셔널
 * 컨벤션 팰리스 / ロイヤル国際コンベンションパレス / รอยัล อินเตอร์เนชั่นแนล
 * คอนเวนชัน พาเลซ) — đừng dịch lại một dạng thứ hai.
 *
 * Tên MÓN ĂN dùng dạng đã quen ở từng thị trường chứ không phiên âm từ tiếng
 * Việt: vịt quay Bắc Kinh → 北京烤鸭 / 베이징덕 / 北京ダック / เป็ดปักกิ่ง;
 * đậu phụ Càn Long → 乾隆豆腐 / 건륭 두부 / 乾隆豆腐 / เต้าหู้เฉียนหลง;
 * thịt quay xá xíu → 叉烧 / 차슈 / チャーシュー / หมูแดงชาชู.
 */
import { LOCALES } from '../../lib/i18n'
import { loc, blockLoc, fig, linkTo, linkOut, key, resetKeys } from './build'
import { patchDoc, assertFullyTranslated } from './write'

/* ------------------------------------------------------------------ *
 * Helper
 * ------------------------------------------------------------------ */

/** Mục `highlights` — mảng `localeString`, mỗi phần tử phải có `_key` + `_type`.
 * `_key` đánh theo chỉ số TRONG chính mảng này: thêm một chip cho Piano Bar
 * thì khoá của Pool Bar không được phép trôi theo. */
function chips(items: Record<string, string>[]) {
  return items.map((item, i) => ({
    _key: `h-${i}`,
    _type: 'localeString',
    ...loc(item as any),
  }))
}

/** Đường dẫn giống nhau ở cả sáu ngôn ngữ.
 * `DOC_BY_SLUG_QUERY` khớp slug theo BẤT KỲ locale nào nên sáu giá trị trùng
 * nhau không tạo xung đột; ghi đủ sáu để URL không đổi khi ai đó điền slug cho
 * một ngôn ngữ rồi bỏ quên ngôn ngữ khác. (`audit.ts` và
 * `assertFullyTranslated()` đều BỎ QUA `slug` khi đếm lỗ dịch, nên nhóm khác
 * để trống slug ngoài `vi` cũng chạy đúng — hai cách không phải đồng bộ.) */
function sameSlug(current: string) {
  const out: Record<string, { _type: 'slug'; current: string }> = {}
  for (const l of LOCALES) out[l] = { _type: 'slug', current }
  return out
}

/* ------------------------------------------------------------------ *
 * Hằng số lấy nguyên văn từ bản clone
 * ------------------------------------------------------------------ */

/** `culinary/index.html` — "Xem Menu Ngay" của Phúc Viên và của Piano Bar trỏ
 * CÙNG một file Drive. Pool Bar không có nút menu, La Terrasse có nút nhưng
 * `href=""` rỗng. */
const MENU_URL = 'https://drive.google.com/file/d/1F64SrHIc7mcniUfixwenkBPb3yMlvUcK/view'

/** "Hotline: 0787 389 018 - 02033 848 777" (khối đặt chỗ của Phúc Viên). */
const HOTLINE_RESTAURANT = '0787 389 018 – 02033 848 777'
/** Số tổng đài in ở chân mọi trang clone: "Hotline: (+84)2033 848 777". */
const HOTLINE_HOTEL = '02033 848 777'
const TEL_HREF = 'tel:+84787389018'

/* ------------------------------------------------------------------ *
 * ALT của 22 tấm ảnh
 *
 * Khai một chỗ rồi dùng lại: 29 `figure` của nhóm B chỉ trỏ vào 22 ảnh khác
 * nhau (ảnh của `page.culinary` lặp lại trong `gallery` của venue). Chép tay
 * hai lần là hai bản dịch sẽ trôi khỏi nhau ở lần sửa sau — cùng một tấm ảnh
 * mà screen reader đọc ra hai câu khác nhau.
 *
 * Mọi câu đều TẢ THỨ CÓ TRONG ẢNH (đã mở từng ảnh ra xem), không viết "ảnh
 * nhà hàng", không lặp lại tiêu đề khối.
 * ------------------------------------------------------------------ */

const ALT = {
  /** Royal-Ha-Long-Hotel-Restaurant-header-01.jpg */
  restaurantHeader01: loc({
    vi: 'Bàn ăn bày cá nướng, món xào trên đĩa nóng và đĩa rau trộn, xen giữa những chiếc khăn ăn trắng gấp hình tháp',
    en: 'A laid table of grilled fish, a sizzling plate and salad dishes between tall folded white napkins',
    zh: '餐桌上摆着烤鱼、铁板热炒和沙拉，中间立着折成塔形的白色餐巾',
    ko: '구운 생선과 철판 볶음 요리, 샐러드가 차려진 식탁, 그 사이에 탑 모양으로 접은 흰 냅킨이 놓여 있다',
    ja: '焼き魚と鉄板の炒め物、サラダが並ぶ食卓。間にタワー状に折った白いナプキンが立っている',
    th: 'โต๊ะอาหารที่จัดปลาย่าง จานร้อนผัด และสลัด แทรกด้วยผ้าเช็ดปากสีขาวพับเป็นทรงเจดีย์',
  }),

  /** Royal-Ha-Long-Restaurant-Phuc-Vien-05.jpg */
  phucVien05: loc({
    vi: 'Đầu bếp đội mũ trắng dùng kẹp gắp món chiên ra đĩa, hơi nóng bốc lên quanh tay',
    en: 'A chef in a white toque lifting fried food onto a plate with tongs, steam rising around his hands',
    zh: '戴白色厨师帽的厨师用夹子把炸物夹到盘中，热气在手边升腾',
    ko: '흰 조리모를 쓴 셰프가 집게로 튀김을 접시에 담고 있고 손 주위로 김이 오른다',
    ja: '白いコック帽の料理人がトングで揚げ物を皿に取り分け、手元から湯気が立ちのぼる',
    th: 'เชฟสวมหมวกสีขาวใช้ที่คีบคีบของทอดลงจาน ไอร้อนลอยขึ้นรอบมือ',
  }),

  /** Royal-Ha-Long-Restaurant-Phuc-Vien-04.jpg */
  phucVien04: loc({
    vi: 'Các đầu bếp nấu sau quầy bếp mở dưới chụp hút lớn, hơi nóng bốc lên trên dãy buffet',
    en: 'Chefs cooking behind an open kitchen counter under a large extractor hood, steam rising over the buffet line',
    zh: '厨师们在大型抽油烟罩下的开放厨台后烹饪，热气在自助餐台上方升起',
    ko: '큰 후드 아래 오픈 키친 카운터 뒤에서 셰프들이 요리하고, 뷔페 라인 위로 김이 오른다',
    ja: '大きなレンジフードの下、オープンキッチンのカウンターで料理人が調理し、ビュッフェ台の上に湯気が立つ',
    th: 'เหล่าเชฟทำอาหารหลังเคาน์เตอร์ครัวเปิดใต้เครื่องดูดควันขนาดใหญ่ ไอร้อนลอยขึ้นเหนือแนวบุฟเฟต์',
  }),

  /** DSC00626-scaled.jpg */
  toastRedWine: loc({
    vi: 'Thực khách nâng ly vang đỏ phía trên đĩa món chính, người ngồi đối diện cầm một bông hồng',
    en: 'A guest raising a glass of red wine above a plated main course, the person opposite holding a rose',
    zh: '客人在主菜上方举起红酒杯，对座的人手里拿着一枝玫瑰',
    ko: '손님이 메인 요리 위로 레드 와인 잔을 들어 올리고, 맞은편에 앉은 사람은 장미 한 송이를 들고 있다',
    ja: '客がメイン料理の上で赤ワインのグラスを掲げ、向かいの人は一輪のバラを手にしている',
    th: 'แขกยกแก้วไวน์แดงเหนือจานอาหารจานหลัก ส่วนคนที่นั่งตรงข้ามถือดอกกุหลาบหนึ่งดอก',
  }),

  /** Royal-Halong-Hotel-Restaurant-07.jpg */
  restaurant07: loc({
    vi: 'Phòng ăn trải thảm hoa văn vàng với ghế bọc xanh ô liu, bàn phủ khăn đỏ và bức tường vẽ khuông nhạc',
    en: 'A dining room with a gold patterned carpet, olive-green chairs, red-clothed tables and a musical-stave mural',
    zh: '餐厅铺着金色花纹地毯，橄榄绿座椅、红色桌布，墙上绘着五线谱',
    ko: '금색 문양 카펫이 깔린 식당에 올리브색 의자와 붉은 테이블보가 놓이고, 벽에는 오선지가 그려져 있다',
    ja: '金色の模様のカーペットを敷いた食堂。オリーブ色の椅子と赤いテーブルクロス、壁には五線譜が描かれている',
    th: 'ห้องอาหารปูพรมลายสีทอง เก้าอี้บุผ้าสีเขียวมะกอก โต๊ะคลุมผ้าสีแดง และผนังวาดลายบรรทัดห้าเส้น',
  }),

  /** Royal-Halong-Hotel-Restaurant-08.jpg */
  restaurant08: loc({
    vi: 'Bàn ăn bày các món nóng và khăn ăn trắng gấp hình tháp, phía sau là bức tường vẽ khuông nhạc và bông hồng vàng',
    en: 'A table of hot dishes and tall folded white napkins in front of a musical-stave mural and a yellow rose',
    zh: '餐桌上摆着热菜与折成塔形的白色餐巾，身后是绘有五线谱的墙面和一枝黄玫瑰',
    ko: '따뜻한 요리와 탑 모양으로 접은 흰 냅킨이 놓인 식탁, 뒤로는 오선지가 그려진 벽과 노란 장미가 보인다',
    ja: '温かい料理とタワー状に折った白いナプキンが並ぶ食卓。奥には五線譜を描いた壁と黄色いバラがある',
    th: 'โต๊ะอาหารจัดอาหารร้อนและผ้าเช็ดปากสีขาวพับเป็นทรงเจดีย์ ด้านหลังเป็นผนังวาดลายบรรทัดห้าเส้นและดอกกุหลาบสีเหลือง',
  }),

  /** Royal-Halong-Hotel-Restaurant-09.jpg */
  restaurant09: loc({
    vi: 'Quầy bánh với nhiều giỏ mây đựng baguette, croissant và bánh ngọt, ở giữa là tượng bánh mì trang trí',
    en: 'A bread counter of wicker baskets holding baguettes, croissants and pastries around a decorative bread sculpture',
    zh: '面包台上多个藤篮盛着法棍、可颂和糕点，中间立着一件面包造型的装饰摆件',
    ko: '여러 등나무 바구니에 바게트와 크루아상, 페이스트리가 담긴 빵 코너, 가운데에는 빵으로 만든 장식 조형물이 있다',
    ja: '籐のかごにバゲットやクロワッサン、焼き菓子を盛ったパンのコーナー。中央にパンの飾りオブジェが置かれている',
    th: 'เคาน์เตอร์ขนมปังมีตะกร้าหวายหลายใบใส่บาแกตต์ ครัวซองต์ และเพสตรี ตรงกลางเป็นประติมากรรมขนมปังสำหรับตกแต่ง',
  }),

  /** Royal-Halong-Hotel-Restaurant-10.jpg */
  restaurant10: loc({
    vi: 'Bàn dài bày cá nướng, món xào trên đĩa nóng và rau trộn, giữa bàn là bông hồng vàng cắm trong lọ',
    en: 'A long table of grilled fish, a sizzling plate and salads, a yellow rose in a vase at its centre',
    zh: '长桌上摆着烤鱼、铁板热炒和沙拉，桌子中央的花瓶里插着一枝黄玫瑰',
    ko: '긴 식탁에 구운 생선과 철판 요리, 샐러드가 놓이고 가운데 화병에 노란 장미가 꽂혀 있다',
    ja: '長いテーブルに焼き魚と鉄板の炒め物、サラダが並び、中央の花瓶に黄色いバラが挿してある',
    th: 'โต๊ะยาวจัดปลาย่าง จานร้อนผัด และสลัด กลางโต๊ะมีดอกกุหลาบสีเหลืองปักในแจกัน',
  }),

  /** Royal-Halong-Hotel-Restaurant-11.jpg */
  restaurant11: loc({
    vi: 'Đĩa phô mai cắt miếng, thịt nguội, giỏ bánh mì và ly nước cam đặt trên nền tối',
    en: 'A platter of cut cheeses, cured meats, a bread basket and a glass of orange juice on a dark surface',
    zh: '深色台面上摆着切块芝士、冷肉、面包篮和一杯橙汁',
    ko: '어두운 바탕 위에 잘라 놓은 치즈와 냉육, 빵 바구니, 오렌지주스 한 잔이 놓여 있다',
    ja: '暗い背景の上に、切り分けたチーズ、冷製肉、パンのかご、オレンジジュースのグラスが置かれている',
    th: 'จานชีสหั่นชิ้น เนื้อรมควัน ตะกร้าขนมปัง และแก้วน้ำส้ม วางอยู่บนพื้นหลังสีเข้ม',
  }),

  /** Royal-Halong-Hotel-Restaurant-06.jpg */
  restaurant06: loc({
    vi: 'Phòng ăn với bàn gỗ, ghế bọc xanh ô liu và quầy buffet dài màu vàng đồng chạy dọc tường',
    en: 'A dining room of wooden tables, olive-green chairs and a long golden buffet counter along the wall',
    zh: '餐厅内有木质餐桌、橄榄绿座椅，一条古铜色长自助餐台沿墙延伸',
    ko: '나무 테이블과 올리브색 의자가 놓인 식당, 벽을 따라 황동빛 긴 뷔페 카운터가 이어진다',
    ja: '木のテーブルとオリーブ色の椅子が並ぶ食堂。壁沿いに真鍮色の長いビュッフェカウンターが続く',
    th: 'ห้องอาหารที่มีโต๊ะไม้ เก้าอี้บุผ้าสีเขียวมะกอก และเคาน์เตอร์บุฟเฟต์ยาวสีทองแดงทอดตามแนวผนัง',
  }),

  /** Royal-Halong-Hotel-Restaurant-04.jpg */
  restaurant04: loc({
    vi: 'Đầu bếp đứng sau quầy buffet nóng, trên mặt quầy xếp chồng bát đĩa sứ trắng',
    en: 'A chef behind a hot buffet station, stacks of white china bowls and plates on the counter',
    zh: '厨师站在热餐自助台后，台面上叠放着白瓷碗碟',
    ko: '셰프가 온장 뷔페 스테이션 뒤에 서 있고, 카운터 위에는 흰 도자기 그릇과 접시가 쌓여 있다',
    ja: '温かい料理のビュッフェ台の後ろに料理人が立ち、カウンターには白い磁器の器と皿が積まれている',
    th: 'เชฟยืนอยู่หลังเคาน์เตอร์บุฟเฟต์อาหารร้อน บนเคาน์เตอร์วางซ้อนชามและจานกระเบื้องสีขาว',
  }),

  /** DSC00511-scaled.jpg */
  candlelitTable: loc({
    vi: 'Hai thực khách ngồi đối diện bên bàn thắp nến, trên bàn là ly vang đỏ và khăn ăn trắng',
    en: 'Two guests facing each other at a candlelit table set with red wine glasses and white napkins',
    zh: '两位客人在点着蜡烛的餐桌旁面对面而坐，桌上是红酒杯和白色餐巾',
    ko: '두 손님이 촛불을 켠 테이블에 마주 앉아 있고, 테이블에는 레드 와인 잔과 흰 냅킨이 놓여 있다',
    ja: 'キャンドルを灯したテーブルで二人の客が向かい合い、赤ワインのグラスと白いナプキンが置かれている',
    th: 'แขกสองท่านนั่งหันหน้าเข้าหากันที่โต๊ะจุดเทียน บนโต๊ะมีแก้วไวน์แดงและผ้าเช็ดปากสีขาว',
  }),

  /** DSC00801-scaled.jpg */
  cocktailClink: loc({
    vi: 'Hai bàn tay chạm ly cocktail — một ly đỏ dáng martini và một ly xanh cao trên khay gỗ',
    en: 'Two hands clinking cocktails — a red martini glass and a tall green one on a wooden tray',
    zh: '两只手在木托盘上举杯相碰——一杯红色马天尼杯，一杯高身绿色鸡尾酒',
    ko: '나무 트레이 위에서 두 손이 칵테일 잔을 맞부딪친다. 하나는 붉은 마티니 잔, 다른 하나는 길쭉한 초록빛 잔이다',
    ja: '木のトレイの上で二つの手がカクテルグラスを合わせる。ひとつは赤いマティーニグラス、もうひとつは背の高い緑のグラス',
    th: 'สองมือชนแก้วค็อกเทลบนถาดไม้ — แก้วมาร์ตินีสีแดงหนึ่งใบ และแก้วทรงสูงสีเขียวอีกหนึ่งใบ',
  }),

  /** Royal-Ha-Long-Gallery-Wedding-12.jpg */
  weddingArch: loc({
    vi: 'Cô dâu chú rể đứng dưới cổng hoa trắng, người dẫn chương trình cầm micro bên cạnh',
    en: 'A bride and groom beneath a white flower arch, a host with a microphone beside them',
    zh: '新娘与新郎站在白色花门下，司仪手持麦克风站在一旁',
    ko: '신랑 신부가 흰 꽃 아치 아래 서 있고, 옆에는 사회자가 마이크를 들고 있다',
    ja: '新郎新婦が白い花のアーチの下に立ち、そばで司会者がマイクを手にしている',
    th: 'เจ้าบ่าวเจ้าสาวยืนอยู่ใต้ซุ้มดอกไม้สีขาว โดยมีพิธีกรถือไมโครโฟนอยู่ข้าง ๆ',
  }),

  /** Royal-Ha-Long-Casino-11.jpg */
  pianoCocktails: loc({
    vi: 'Hai ly cocktail nhiều màu đặt trên bàn tròn, phía sau là cây đàn dương cầm trắng dưới ánh đèn tím',
    en: 'Two colourful cocktails on a round table in front of a white grand piano under purple light',
    zh: '圆桌上放着两杯色彩缤纷的鸡尾酒，背后是紫色灯光下的白色三角钢琴',
    ko: '둥근 테이블 위에 색색의 칵테일 두 잔이 놓여 있고, 뒤로는 보랏빛 조명 아래 흰 그랜드 피아노가 보인다',
    ja: '丸いテーブルに色とりどりのカクテルが二杯。奥には紫の照明に照らされた白いグランドピアノがある',
    th: 'ค็อกเทลหลากสีสองแก้ววางบนโต๊ะกลม ด้านหลังเป็นเปียโนสีขาวใต้แสงไฟสีม่วง',
  }),

  /** Royal-Halong-Hotel-piano-bar-01.jpg */
  lobbyChandelier: loc({
    vi: 'Sảnh khách sạn với đèn chùm pha lê dài, thảm tròn hoa văn đỏ và quầy lễ tân phía cuối',
    en: 'The hotel lobby with long crystal chandeliers, a round red patterned rug and the reception desk beyond',
    zh: '酒店大堂悬着长串水晶吊灯，地上是红色花纹圆毯，尽头是前台',
    ko: '긴 크리스털 샹들리에가 걸린 호텔 로비, 붉은 문양의 둥근 러그가 깔려 있고 안쪽에 리셉션 데스크가 있다',
    ja: '長いクリスタルシャンデリアが下がるホテルのロビー。赤い模様の丸いラグが敷かれ、奥にレセプションカウンターがある',
    th: 'ล็อบบี้โรงแรมที่มีโคมระย้าคริสตัลทรงยาว พรมกลมลายสีแดง และเคาน์เตอร์ต้อนรับอยู่ด้านใน',
  }),

  /** Royal-Halong-Hotel-four-season-swimming-pool-04.jpg */
  loungerCocktails: loc({
    vi: 'Hai khách nằm trên ghế tắm nắng bên bể bơi, mỗi người cầm một ly cocktail nhiều màu',
    en: 'Two guests on sun loungers beside the pool, each holding a colourful cocktail',
    zh: '两位客人躺在泳池边的日光躺椅上，各自手持一杯色彩缤纷的鸡尾酒',
    ko: '두 손님이 수영장 옆 선베드에 누워 각자 색색의 칵테일 한 잔씩 들고 있다',
    ja: '二人の客がプールサイドのサンラウンジャーに横たわり、それぞれ色鮮やかなカクテルを手にしている',
    th: 'แขกสองท่านนอนบนเตียงอาบแดดริมสระ แต่ละคนถือค็อกเทลหลากสีคนละแก้ว',
  }),

  /** Royal-Halong-Hotel-outdoor-swimming-pool-03.jpg */
  poolParasols: loc({
    vi: 'Bể bơi ngoài trời với hàng ô che nắng và ghế tắm nắng trước toà nhà trắng kiểu thuộc địa',
    en: 'The outdoor swimming pool with a row of parasols and sun loungers in front of a white colonial building',
    zh: '室外泳池边排开遮阳伞和日光躺椅，身后是一幢白色殖民风格建筑',
    ko: '야외 수영장 옆으로 파라솔과 선베드가 줄지어 있고, 뒤로 흰색 콜로니얼 양식 건물이 서 있다',
    ja: '屋外プールに沿ってパラソルとサンラウンジャーが並び、奥に白いコロニアル様式の建物が建つ',
    th: 'สระว่ายน้ำกลางแจ้งพร้อมแถวร่มกันแดดและเตียงอาบแดด ด้านหน้าอาคารสีขาวสไตล์โคโลเนียล',
  }),

  /** Royal-Halong-Hotel-outdoor-swimming-pool-02.jpg */
  poolPalms: loc({
    vi: 'Bể bơi ngoài trời uốn cong giữa hàng cọ cao và lối đi lát đá sáng màu',
    en: 'The curved outdoor swimming pool among tall palms and a pale stone deck',
    zh: '室外泳池在高大棕榈与浅色石铺步道之间弯曲延展',
    ko: '높은 야자수와 밝은 색 석재 데크 사이로 야외 수영장이 곡선을 그리며 이어진다',
    ja: '背の高いヤシの木と明るい石敷きのデッキのあいだを、屋外プールが曲線を描いて広がる',
    th: 'สระว่ายน้ำกลางแจ้งทอดโค้งอยู่ระหว่างแถวต้นปาล์มสูงและทางเดินปูหินสีอ่อน',
  }),

  /** 488706854_1470177697737884_8772341987698441772_n.jpg */
  terrassePavilion: loc({
    vi: 'Nhà chòi gỗ mang biển hiệu LA TERRASSE giữa vườn cây nhiệt đới và luống hoa, bên cạnh là bảng chào mừng',
    en: 'A wooden pavilion carrying the LA TERRASSE sign amid a tropical garden and flower beds, a welcome board beside it',
    zh: '一座挂着 LA TERRASSE 招牌的木亭立于热带花木之间，旁边放着一块欢迎牌',
    ko: 'LA TERRASSE 간판을 단 목조 정자가 열대 정원과 화단 사이에 서 있고, 옆에는 환영 안내판이 놓여 있다',
    ja: 'LA TERRASSE の看板を掲げた木造の東屋が、熱帯の庭と花壇のあいだに立ち、そばにウェルカムボードが置かれている',
    th: 'ศาลาไม้ติดป้าย LA TERRASSE ตั้งอยู่กลางสวนไม้เขตร้อนและแปลงดอกไม้ ข้าง ๆ มีป้ายต้อนรับ',
  }),

  /** Royal-Ha-Long-Gallery-Hotel-14.jpg */
  brickPath: loc({
    vi: 'Lối đi lát gạch đỏ chạy giữa thảm cỏ, cây cọ quạt và hàng cây cao trong khuôn viên khách sạn',
    en: 'A red-brick path running between lawn, fan palms and tall trees in the hotel grounds',
    zh: '红砖小径穿过草坪，两旁是蒲葵与高大树木，位于酒店园区之中',
    ko: '붉은 벽돌 길이 잔디밭 사이로 이어지고, 양옆에 부채야자와 큰 나무들이 늘어선 호텔 정원',
    ja: '赤レンガの小道が芝生の間を抜け、ビロウヤシと高い木々が並ぶホテルの庭園',
    th: 'ทางเดินปูอิฐสีแดงทอดผ่านสนามหญ้า ขนาบด้วยต้นปาล์มใบพัดและแถวต้นไม้สูงในสวนของโรงแรม',
  }),

  /** Royal-Ha-Long-Gallery-Hotel-12.jpg */
  whiteBuilding: loc({
    vi: 'Toà nhà trắng mái ngói nằm giữa vườn cây cổ thụ, phía trước là bậc thang và bồn cây thấp',
    en: 'A white tile-roofed building set among mature trees, with steps and low planters in front',
    zh: '白色瓦顶建筑掩映在古树园中，门前是台阶与矮花坛',
    ko: '기와지붕을 얹은 흰 건물이 고목이 우거진 정원 가운데 있고, 앞에는 계단과 낮은 화단이 있다',
    ja: '瓦屋根の白い建物が古木の庭に佇み、前には階段と低い植え込みがある',
    th: 'อาคารสีขาวหลังคากระเบื้องตั้งอยู่กลางสวนไม้ใหญ่ ด้านหน้ามีบันไดและกระบะต้นไม้เตี้ย',
  }),
}

/* ------------------------------------------------------------------ *
 * page.culinary — chồng section mới
 *
 * Bản cũ: hero + venueList + SÁU richTextSection không ảnh chép lại y nguyên
 * mô tả của bốn venue ngay bên trên. Bản này bỏ sạch richTextSection: mỗi
 * khối sau danh sách venue hoặc mang thông tin MỚI (nhịp một ngày, đặt bàn &
 * phòng VIP, tiệc cưới) hoặc mang ảnh.
 * ------------------------------------------------------------------ */

function culinarySections() {
  return [
    {
      _key: 'sec-0',
      _type: 'heroSection',
      // `heroSection` PHẢI đứng đầu: header chỉ trôi trong suốt lên ảnh khi
      // `.rhl-hero` là con đầu tiên của <main> (xem CLAUDE.md § Header).
      heading: loc({ vi: 'ẨM THỰC', en: 'DINING', zh: '餐饮', ko: '다이닝', ja: 'ダイニング', th: 'ร้านอาหาร' }),
      subheading: loc({
        vi: 'TRẢI NGHIỆM ẨM THỰC ĐA DẠNG TINH TÚY TẠI ROYAL HẠ LONG',
        en: 'A WORLD OF FLAVOURS AT ROYAL HA LONG',
        zh: '在 ROYAL HA LONG 品味多元精致美馔',
        ko: 'ROYAL HA LONG에서 만나는 다채로운 미식의 세계',
        ja: 'ROYAL HA LONG で味わう多彩な美食の世界',
        th: 'สัมผัสโลกแห่งรสชาติหลากหลายที่ ROYAL HA LONG',
      }),
      background: fig('Royal-Ha-Long-Hotel-Restaurant-header-01.jpg', ALT.restaurantHeader01),
      height: 'medium',
    },

    {
      _key: 'sec-1',
      _type: 'imageTextSection',
      eyebrow: loc({ vi: 'ẨM THỰC', en: 'DINING', zh: '餐饮', ko: '다이닝', ja: 'ダイニング', th: 'ร้านอาหาร' }),
      heading: loc({
        vi: 'Một nhà hàng, ba quầy bar',
        en: 'One restaurant, three bars',
        zh: '一家餐厅，三座酒吧',
        ko: '레스토랑 한 곳, 바 세 곳',
        ja: 'レストラン一軒、バー三軒',
        th: 'หนึ่งภัตตาคาร สามบาร์',
      }),
      content: blockLoc({
        vi: [
          'Ẩm thực ở Royal Hạ Long trải trên bốn không gian, mỗi nơi giữ một nhịp riêng: nhà hàng Phúc Viên trên tầng hai cho bữa chính, Piano Bar trong sảnh cho buổi tối, Pool Bar bên bể bơi cho giữa ngày và La Terrasse ngoài vườn cho buổi chiều.',
          'Bếp đi giữa hai mạch vị. Một bên là hải sản tươi sống của vịnh Hạ Long cùng các món Á như vịt quay Bắc Kinh, đậu phụ Càn Long, thịt quay xá xíu. Bên kia là các món Âu, tiêu biểu là bò bít tết ăn kèm sốt mù tạt, sốt tiêu hoặc sốt kem.',
          'Danh mục đồ uống chạy suốt từ tách trà nóng buổi chiều tới ly cocktail khuya, kèm rượu vang nhập khẩu.',
        ],
        en: [
          'Dining at Royal Ha Long unfolds across four spaces, each keeping its own rhythm: Phuc Vien Restaurant on the second floor for main meals, Piano Bar in the lobby for the evening, Pool Bar beside the swimming pool for the middle of the day, and La Terrasse in the grounds for the afternoon.',
          'The kitchen works along two lines. One is live seafood from Ha Long Bay alongside Asian dishes such as Peking duck, Can Long tofu and char siu roast pork. The other is European cooking, led by steak served with mustard, pepper or cream sauce.',
          'The drinks list runs from a pot of afternoon tea to a late cocktail, with imported wines alongside.',
        ],
        zh: [
          'Royal Ha Long 的餐饮分布在四处空间，各有各的节奏：二楼的福缘中餐厅供应正餐，大堂的 Piano Bar 属于夜晚，泳池畔的 Pool Bar 陪伴午间，花园中的 La Terrasse 留给午后。',
          '厨房沿着两条味觉脉络展开。一边是下龙湾的鲜活海鲜，以及北京烤鸭、乾隆豆腐、叉烧等亚洲菜式；另一边是欧陆菜，以搭配芥末酱、黑椒酱或奶油酱的牛排为代表。',
          '酒水单从午后的一壶热茶一路延伸到深夜的一杯鸡尾酒，并备有进口葡萄酒。',
        ],
        ko: [
          'Royal Ha Long의 다이닝은 네 곳의 공간에 나뉘어 있으며 저마다 다른 리듬을 지닙니다. 2층 푹비엔 레스토랑은 정찬을, 로비의 Piano Bar는 저녁을, 수영장 옆 Pool Bar는 한낮을, 정원의 La Terrasse는 오후를 맡습니다.',
          '주방은 두 갈래 맛의 흐름을 따릅니다. 한쪽은 하롱베이의 활어 해산물과 베이징덕, 건륭 두부, 차슈 같은 아시아 요리입니다. 다른 한쪽은 머스터드·후추·크림 소스를 곁들인 스테이크로 대표되는 유럽 요리입니다.',
          '음료 리스트는 오후의 따뜻한 차 한 잔부터 늦은 밤의 칵테일까지 이어지며, 수입 와인도 함께 갖추고 있습니다.',
        ],
        ja: [
          'Royal Ha Long のダイニングは四つの空間に分かれ、それぞれ異なるリズムを保っています。2階のフックヴィエン・レストランは食事の中心、ロビーの Piano Bar は夜、プールサイドの Pool Bar は日中、庭園の La Terrasse は午後を担います。',
          '厨房は二つの味の流れを行き来します。ひとつはハロン湾の活きた海鮮と、北京ダック、乾隆豆腐、チャーシューなどのアジア料理。もうひとつはマスタード、ペッパー、クリームのソースを添えたステーキを代表とするヨーロッパ料理です。',
          'ドリンクリストは午後の温かいお茶から深夜のカクテルまで続き、輸入ワインも取りそろえています。',
        ],
        th: [
          'ร้านอาหารของ Royal Ha Long กระจายอยู่ในสี่พื้นที่ แต่ละแห่งมีจังหวะของตัวเอง ภัตตาคารฟุกเวียนบนชั้นสองสำหรับมื้อหลัก Piano Bar ในล็อบบี้สำหรับยามค่ำ Pool Bar ริมสระสำหรับกลางวัน และ La Terrasse ในสวนสำหรับยามบ่าย',
          'ครัวเดินไปบนสองสายรสชาติ ด้านหนึ่งคืออาหารทะเลสดจากอ่าวฮาลอง พร้อมอาหารเอเชียอย่างเป็ดปักกิ่ง เต้าหู้เฉียนหลง และหมูแดงชาชู อีกด้านหนึ่งคืออาหารยุโรป โดยมีสเต๊กเสิร์ฟพร้อมซอสมัสตาร์ด ซอสพริกไทย หรือซอสครีมเป็นตัวชูโรง',
          'รายการเครื่องดื่มทอดยาวตั้งแต่ชาร้อนยามบ่ายไปจนถึงค็อกเทลยามดึก พร้อมไวน์นำเข้า',
        ],
      }),
      image: fig('Royal-Ha-Long-Restaurant-Phuc-Vien-05.jpg', ALT.phucVien05),
      imageSide: 'right',
      imageFit: 'cover',
      tone: 'white',
    },

    {
      _key: 'sec-2',
      _type: 'venueListSection',
      heading: loc({
        vi: 'ĐIỂM ẨM THỰC',
        en: 'WHERE TO EAT & DRINK',
        zh: '餐饮场所',
        ko: '식음 시설',
        ja: 'レストラン＆バー',
        th: 'ร้านอาหารและบาร์',
      }),
      filterKind: 'dining',
    },

    {
      _key: 'sec-3',
      _type: 'imageTextSection',
      eyebrow: loc({
        vi: 'TRONG NGÀY',
        en: 'THROUGH THE DAY',
        zh: '一日之间',
        ko: '하루 동안',
        ja: '一日の流れ',
        th: 'ตลอดทั้งวัน',
      }),
      heading: loc({
        vi: 'Nhịp một ngày bên bàn ăn',
        en: 'A day, meal by meal',
        zh: '一日三餐的节奏',
        ko: '한 끼씩 이어지는 하루',
        ja: '一食ずつたどる一日',
        th: 'หนึ่งวัน ทีละมื้อ',
      }),
      content: blockLoc({
        vi: [
          'Giữa trưa, Pool Bar ngay cạnh bể bơi ngoài trời phục vụ đồ uống mát lạnh và các món ăn nhẹ Á – Âu, đủ để quý khách không phải rời ghế tắm nắng.',
          'Chiều cuối tuần, La Terrasse dọn trà nóng và quà chiều dưới tán cây trong khuôn viên kiểu Âu.',
          'Bữa tối thuộc về Phúc Viên trên tầng hai. Bếp mở 24/7, nên chuyến tàu vịnh về muộn vẫn còn chỗ ngồi và còn bếp sáng đèn.',
          'Khuya, Piano Bar trong sảnh giữ lại tiếng dương cầm và quầy cocktail cho những ai chưa muốn khép lại ngày.',
        ],
        en: [
          'At midday, Pool Bar beside the outdoor swimming pool serves cold drinks and Asian–European light bites, so there is no need to leave your sun lounger.',
          'On weekend afternoons, La Terrasse lays out hot tea and afternoon treats under the trees of the European-style grounds.',
          'Dinner belongs to Phuc Vien on the second floor. The kitchen runs 24/7, so a late return from the bay still finds a table and a stove alight.',
          'Later, Piano Bar in the lobby keeps the piano playing and the cocktail counter open for anyone not ready to close the day.',
        ],
        zh: [
          '正午时分，室外泳池畔的 Pool Bar 供应冰爽饮品与亚欧风味小食，让您无需离开日光躺椅。',
          '周末午后，La Terrasse 在欧式园林的树荫下摆上热茶与下午茶点。',
          '晚餐属于二楼的福缘中餐厅。厨房 24/7 不打烊，即便游船归来得晚，也仍有座位、仍有灶火。',
          '夜深时，大堂的 Piano Bar 留住琴声与调酒台，等待那些还不想结束这一天的人。',
        ],
        ko: [
          '한낮에는 야외 수영장 옆 Pool Bar가 시원한 음료와 아시아·유럽식 가벼운 요리를 내어드려, 선베드를 떠나지 않아도 됩니다.',
          '주말 오후에는 La Terrasse가 유럽식 정원의 나무 그늘 아래 따뜻한 차와 애프터눈 티를 차려 놓습니다.',
          '저녁 식사는 2층 푹비엔 레스토랑의 몫입니다. 주방이 24시간 운영되므로 베이 크루즈에서 늦게 돌아와도 자리와 불 켜진 주방이 기다립니다.',
          '밤이 깊어지면 로비의 Piano Bar가 피아노 선율과 칵테일 바를 그대로 두고, 하루를 아직 마치고 싶지 않은 분들을 맞이합니다.',
        ],
        ja: [
          '昼どきは屋外プールに面した Pool Bar が冷たい飲み物とアジア・ヨーロッパの軽食を用意し、サンラウンジャーを離れる必要がありません。',
          '週末の午後は、La Terrasse がヨーロッパ風の庭園の木陰で温かいお茶とアフタヌーンティーを用意します。',
          '夕食は2階のフックヴィエン・レストランへ。厨房は24時間動いているため、湾クルーズから遅く戻っても席と火の入った厨房があります。',
          '夜更けには、ロビーの Piano Bar がピアノの音とカクテルカウンターを残し、まだ一日を終えたくない方を迎えます。',
        ],
        th: [
          'ยามเที่ยง Pool Bar ข้างสระว่ายน้ำกลางแจ้งเสิร์ฟเครื่องดื่มเย็นและอาหารว่างเอเชีย–ยุโรป จนไม่ต้องลุกจากเตียงอาบแดด',
          'บ่ายวันหยุดสุดสัปดาห์ La Terrasse จัดชาร้อนและของว่างยามบ่ายไว้ใต้ร่มไม้ในสวนสไตล์ยุโรป',
          'มื้อค่ำเป็นของภัตตาคารฟุกเวียนบนชั้นสอง ครัวเปิด 24 ชั่วโมงทุกวัน แม้กลับจากล่องเรือในอ่าวช้าก็ยังมีที่นั่งและมีครัวที่ยังติดไฟ',
          'ยามดึก Piano Bar ในล็อบบี้ยังคงเสียงเปียโนและเคาน์เตอร์ค็อกเทลไว้สำหรับผู้ที่ยังไม่อยากปิดวันนี้',
        ],
      }),
      image: fig('DSC00626-scaled.jpg', ALT.toastRedWine),
      imageSide: 'left',
      imageFit: 'cover',
      tone: 'cream',
    },

    {
      _key: 'sec-4',
      _type: 'imageTextSection',
      eyebrow: loc({
        vi: 'ĐẶT BÀN',
        en: 'RESERVATIONS',
        zh: '餐位预订',
        ko: '예약 안내',
        ja: 'ご予約',
        th: 'การจองโต๊ะ',
      }),
      heading: loc({
        vi: 'Bàn cho nhóm và hai phòng VIP',
        en: 'Group tables and two VIP rooms',
        zh: '团体餐桌与两间贵宾房',
        ko: '단체 테이블과 VIP룸 두 곳',
        ja: '団体席と二つのVIPルーム',
        th: 'โต๊ะสำหรับหมู่คณะและห้องวีไอพีสองห้อง',
      }),
      content: blockLoc({
        vi: [
          'Phúc Viên nằm trên tầng hai của khách sạn, sức chứa 250 khách, cùng hai phòng VIP tách riêng cho bữa ăn cần kín đáo hơn.',
          'Vì bếp mở 24/7, giờ ăn không phải xếp theo giờ nhà hàng mà theo lịch của quý khách — bữa sáng muộn, bữa trưa sớm hay bữa khuya đều được.',
          `Giữ chỗ qua hotline ${HOTLINE_RESTAURANT}. Thực đơn đầy đủ xem trước theo liên kết bên dưới.`,
        ],
        en: [
          'Phuc Vien sits on the second floor of the hotel, seating 250 guests, with two separate VIP rooms for meals that call for more privacy.',
          'Because the kitchen runs 24/7, mealtimes follow your schedule rather than the restaurant’s — a late breakfast, an early lunch or a midnight supper all work.',
          `Hold a table on ${HOTLINE_RESTAURANT}. The full menu can be read in advance through the link below.`,
        ],
        zh: [
          '福缘中餐厅位于酒店二楼，可容纳 250 位客人，另设两间独立贵宾房，供需要更私密的用餐场合。',
          '厨房 24/7 运转，用餐时间无需迁就餐厅，而是随您的行程安排——迟来的早餐、提早的午餐或深夜的一顿，都可以。',
          `请致电 ${HOTLINE_RESTAURANT} 预留餐位。完整菜单可通过下方链接提前查看。`,
        ],
        ko: [
          '푹비엔 레스토랑은 호텔 2층에 있으며 250명을 수용하고, 보다 사적인 식사를 위한 별도의 VIP룸 두 곳을 갖추고 있습니다.',
          '주방이 24시간 운영되기에 식사 시간은 레스토랑이 아니라 고객님의 일정에 맞춥니다. 늦은 아침, 이른 점심, 한밤의 야식 모두 가능합니다.',
          `${HOTLINE_RESTAURANT} 으로 전화하시면 자리를 잡아 드립니다. 전체 메뉴는 아래 링크에서 미리 확인하실 수 있습니다.`,
        ],
        ja: [
          'フックヴィエン・レストランはホテル2階にあり、250名を収容できます。より落ち着いた食事のための独立したVIPルームも二室ご用意しています。',
          '厨房が24時間動いているため、食事の時間はレストランではなくお客様の予定に合わせられます。遅い朝食も、早い昼食も、夜食も承ります。',
          `ご予約はホットライン ${HOTLINE_RESTAURANT} まで。メニューの全容は下のリンクから事前にご覧いただけます。`,
        ],
        th: [
          'ภัตตาคารฟุกเวียนตั้งอยู่บนชั้นสองของโรงแรม รองรับได้ 250 ท่าน พร้อมห้องวีไอพีแยกอีกสองห้องสำหรับมื้ออาหารที่ต้องการความเป็นส่วนตัว',
          'เพราะครัวเปิด 24 ชั่วโมงทุกวัน เวลารับประทานจึงไม่ต้องอิงเวลาของภัตตาคาร แต่อิงตารางของท่าน ไม่ว่าจะเป็นอาหารเช้าสาย มื้อกลางวันก่อนเวลา หรือมื้อดึก',
          `สำรองโต๊ะได้ที่สายด่วน ${HOTLINE_RESTAURANT} ดูเมนูฉบับเต็มล่วงหน้าได้จากลิงก์ด้านล่าง`,
        ],
      }),
      image: fig('Royal-Halong-Hotel-Restaurant-07.jpg', ALT.restaurant07),
      imageSide: 'right',
      imageFit: 'cover',
      tone: 'white',
      cta: linkOut(MENU_URL, {
        vi: 'XEM THỰC ĐƠN',
        en: 'VIEW THE MENU',
        zh: '查看菜单',
        ko: '메뉴 보기',
        ja: 'メニューを見る',
        th: 'ดูเมนู',
      }),
    },

    {
      _key: 'sec-5',
      _type: 'imageTextSection',
      eyebrow: loc({
        vi: 'TIỆC & SỰ KIỆN',
        en: 'BANQUETS & EVENTS',
        zh: '宴会与活动',
        ko: '연회 & 행사',
        ja: '宴会・イベント',
        th: 'งานเลี้ยงและอีเวนต์',
      }),
      heading: loc({
        vi: 'Tiệc cưới',
        en: 'Weddings',
        zh: '婚礼',
        ko: '웨딩',
        ja: 'ウエディング',
        th: 'งานแต่งงาน',
      }),
      content: blockLoc({
        vi: [
          'Trao lời yêu thương với một nửa của bạn tại Cung Hội nghị Quốc tế Hoàng Gia — không gian sang trọng với đèn chùm rực rỡ, tháp bánh và tháp sâm-panh.',
          'Nếu thứ quý khách cần là một bữa tiệc cho cả đoàn khách chứ không phải một bàn ăn, đây là nơi bắt đầu.',
        ],
        en: [
          'Say your vows at the Royal International Convention Palace — a grand room of bright chandeliers, a cake tower and a champagne tower.',
          'If what you need is a banquet for a whole party rather than a single table, this is where to begin.',
        ],
        zh: [
          '在皇家国际会议宫许下誓言——璀璨的水晶吊灯、层叠的婚礼蛋糕塔与香槟塔，构成一处华美的场地。',
          '如果您需要的是一场宾客云集的宴席，而非一张餐桌，这里就是起点。',
        ],
        ko: [
          '로열 인터내셔널 컨벤션 팰리스에서 서로에게 사랑을 약속하세요. 화려한 샹들리에와 케이크 타워, 샴페인 타워가 어우러진 공간입니다.',
          '한 테이블이 아니라 하객 전체를 위한 연회가 필요하시다면, 여기서 시작하시면 됩니다.',
        ],
        ja: [
          'ロイヤル国際コンベンションパレスで愛の言葉を交わしませんか。きらめくシャンデリア、ケーキタワー、シャンパンタワーが揃う華やかな空間です。',
          '一卓の食事ではなく、招待客全員のための宴席をお考えなら、ここが出発点です。',
        ],
        th: [
          'กล่าวคำรักกับคนสำคัญที่รอยัล อินเตอร์เนชั่นแนล คอนเวนชัน พาเลซ พื้นที่หรูหราพร้อมโคมระย้าเปล่งประกาย ทาวเวอร์เค้ก และทาวเวอร์แชมเปญ',
          'หากสิ่งที่ท่านต้องการคืองานเลี้ยงสำหรับแขกทั้งหมด ไม่ใช่เพียงโต๊ะอาหารหนึ่งโต๊ะ ที่นี่คือจุดเริ่มต้น',
        ],
      }),
      image: fig('Royal-Ha-Long-Gallery-Wedding-12.jpg', ALT.weddingArch),
      imageSide: 'left',
      imageFit: 'cover',
      // `white` chứ không phải `cream`: `cardGridSection` ngay dưới có nền
      // `bg-cream-alt` CỨNG trong component (không đọc `tone`). Để khối này
      // `cream` thì hai section dính thành một dải #f3ebdb cao gần 200px
      // trống giữa hai cụm chữ — mắt không thấy chỗ khối này kết thúc.
      tone: 'white',
      cta: linkTo('page.wedding', {
        vi: 'XEM CHI TIẾT',
        en: 'VIEW DETAILS',
        zh: '查看详情',
        ko: '자세히 보기',
        ja: '詳細を見る',
        th: 'ดูรายละเอียด',
      }),
    },

    {
      _key: 'sec-6',
      _type: 'cardGridSection',
      heading: loc({
        vi: 'TRẢI NGHIỆM ĐẶC TRƯNG',
        en: 'SIGNATURE MOMENTS',
        zh: '招牌体验',
        ko: '시그니처 경험',
        ja: 'シグネチャーな体験',
        th: 'ประสบการณ์ซิกเนเจอร์',
      }),
      subheading: loc({
        vi: 'Sáu khoảnh khắc nên thử ít nhất một lần trong kỳ nghỉ',
        en: 'Six things worth trying at least once during your stay',
        zh: '入住期间值得至少尝试一次的六个瞬间',
        ko: '머무는 동안 한 번쯤 경험해 볼 만한 여섯 가지',
        ja: '滞在中に一度は試したい六つのひととき',
        th: 'หกช่วงเวลาที่ควรลองสักครั้งระหว่างเข้าพัก',
      }),
      // Sáu thẻ ở `columns: 3` = hai hàng ĐẦY. Năm thẻ để lại một ô trống
      // toang ở hàng dưới.
      //
      // `description` của thẻ bị `line-clamp-2` (xem `CardGridSection.tsx`).
      // Đã đo `scrollHeight` vs `clientHeight` ở cả sáu ngôn ngữ × ba bề
      // ngang: mọi bản dịch dưới đây vừa đúng hai dòng, không bị cắt. Viết
      // thêm một mệnh đề nữa là chữ biến mất sau dấu "…" — đo lại nếu sửa.
      columns: 3,
      cards: [
        {
          _key: 'card-5',
          _type: 'card',
          title: loc({
            vi: 'Hải sản vịnh Hạ Long',
            en: 'Ha Long Bay seafood',
            zh: '下龙湾海鲜',
            ko: '하롱베이 해산물',
            ja: 'ハロン湾の海鮮',
            th: 'อาหารทะเลอ่าวฮาลอง',
          }),
          description: loc({
            vi: 'Hải sản tươi sống của vịnh là mạch vị chính của thực đơn Phúc Viên.',
            en: 'Live seafood from the bay is the backbone of the Phuc Vien menu.',
            zh: '海湾的鲜活海鲜是福缘菜单的主脉，出锅即上桌。',
            ko: '만에서 온 활어 해산물은 푹비엔 메뉴의 중심입니다.',
            ja: '湾の活きた海鮮はフックヴィエンの献立の軸です。',
            th: 'อาหารทะเลสดจากอ่าวคือแกนหลักของเมนูฟุกเวียน',
          }),
          image: fig('Royal-Halong-Hotel-Restaurant-10.jpg', ALT.restaurant10),
        },
        {
          _key: 'card-0',
          _type: 'card',
          title: loc({
            vi: 'Bếp mở',
            en: 'The open kitchen',
            zh: '开放式厨房',
            ko: '오픈 키친',
            ja: 'オープンキッチン',
            th: 'ครัวเปิด',
          }),
          description: loc({
            vi: 'Món được đảo, chiên rồi múc ra đĩa ngay trước mặt thực khách.',
            en: 'Dishes are tossed, fried and plated right in front of you.',
            zh: '翻炒、油炸到装盘，都在客人眼前完成。',
            ko: '볶고 튀기고 접시에 담는 과정이 눈앞에서 이루어집니다.',
            ja: '炒め、揚げ、盛りつけまで目の前で仕上げます。',
            th: 'ผัด ทอด และตักใส่จานต่อหน้าผู้รับประทาน',
          }),
          image: fig('Royal-Ha-Long-Restaurant-Phuc-Vien-04.jpg', ALT.phucVien04),
        },
        {
          _key: 'card-1',
          _type: 'card',
          title: loc({
            vi: 'Quầy bánh mì và bánh ngọt',
            en: 'Breads and pastries',
            zh: '面包与糕点台',
            ko: '빵과 페이스트리 코너',
            ja: 'パンと焼き菓子',
            th: 'มุมขนมปังและเพสตรี',
          }),
          description: loc({
            vi: 'Baguette, croissant, bánh mì tròn và bánh ngọt xếp đầy giỏ mây.',
            en: 'Baguettes, croissants, rolls and pastries stacked in wicker baskets.',
            zh: '法棍、可颂、圆面包和糕点装满藤篮。',
            ko: '바게트와 크루아상, 둥근 빵과 페이스트리가 바구니에 가득합니다.',
            // Tiếng Nhật giữ <= 23 ký tự: ở 1440px một dòng chứa ~24 ký tự, mà
            // luật 禁則 không cho 「。」 đứng đầu dòng nên câu dài hơn sẽ đẩy
            // đúng hai chữ cuối xuống dòng hai — trông như lỗi hơn là xuống dòng.
            ja: 'バゲットやクロワッサンが籠に山盛りです。',
            th: 'บาแกตต์ ครัวซองต์ ขนมปังกลม และเพสตรีวางเต็มตะกร้าหวาย',
          }),
          image: fig('Royal-Halong-Hotel-Restaurant-09.jpg', ALT.restaurant09),
        },
        {
          _key: 'card-2',
          _type: 'card',
          title: loc({
            vi: 'Phô mai, đồ nguội và rượu vang',
            en: 'Cheese, charcuterie and wine',
            zh: '芝士、冷肉与葡萄酒',
            ko: '치즈, 샤퀴테리, 와인',
            ja: 'チーズとシャルキュトリ',
            th: 'ชีส ชาร์กูเตอรี และไวน์',
          }),
          description: loc({
            vi: 'Đĩa phô mai và thịt nguội, hợp với danh mục rượu vang nhập khẩu.',
            en: 'A board of cheeses and cured meats, made for the imported wine list.',
            zh: '切块芝士配冷肉，正好佐进口葡萄酒单。',
            ko: '치즈와 냉육 플래터가 수입 와인 리스트와 잘 어울립니다.',
            ja: 'チーズと冷製肉は輸入ワインによく合います。',
            th: 'จานชีสและเนื้อรมควัน เข้ากันดีกับรายการไวน์นำเข้า',
          }),
          image: fig('Royal-Halong-Hotel-Restaurant-11.jpg', ALT.restaurant11),
        },
        {
          _key: 'card-3',
          _type: 'card',
          title: loc({
            vi: 'Bữa tối bên ánh nến',
            en: 'Dinner by candlelight',
            zh: '烛光晚餐',
            ko: '촛불 아래의 저녁',
            ja: 'キャンドルの夕食',
            th: 'มื้อค่ำใต้แสงเทียน',
          }),
          description: loc({
            vi: 'Bàn hai người, một ngọn nến và ly vang đỏ. Phúc Viên mở 24/7.',
            en: 'A table for two, one candle and a glass of red wine. Open 24/7.',
            zh: '两人的餐桌、一支蜡烛和一杯红酒。福缘 24/7 营业。',
            ko: '두 사람의 테이블, 촛불 하나, 레드 와인 한 잔. 24시간 운영합니다.',
            ja: 'キャンドルを灯した二人の席。24時間営業です。',
            th: 'โต๊ะสำหรับสองคน เทียนหนึ่งเล่ม และไวน์แดง เปิด 24 ชั่วโมง',
          }),
          image: fig('DSC00511-scaled.jpg', ALT.candlelitTable),
        },
        {
          _key: 'card-4',
          _type: 'card',
          title: loc({
            vi: 'Cocktail cuối ngày',
            en: 'A cocktail to close the day',
            zh: '一日终章的鸡尾酒',
            ko: '하루를 닫는 칵테일',
            ja: '一日を締めるカクテル',
            th: 'ค็อกเทลปิดท้ายวัน',
          }),
          description: loc({
            vi: 'Cocktail pha tại quầy, uống bên phím dương cầm hoặc thành bể bơi.',
            en: 'Cocktails mixed at the bar, taken by the piano or at the poolside.',
            zh: '吧台现调的鸡尾酒，可在钢琴旁或泳池边品味。',
            ko: '바에서 바로 만든 칵테일을 피아노 옆이나 수영장 가에서 즐기세요.',
            ja: 'カクテルはピアノのそばでもプールサイドでも。',
            th: 'ค็อกเทลผสมสดที่บาร์ ดื่มข้างเปียโนหรือริมสระว่ายน้ำ',
          }),
          image: fig('DSC00801-scaled.jpg', ALT.cocktailClink),
        },
      ],
    },

    {
      _key: 'sec-7',
      _type: 'ctaBandSection',
      heading: loc({
        vi: 'ĐẶT BÀN TẠI ROYAL HẠ LONG',
        en: 'RESERVE A TABLE AT ROYAL HA LONG',
        zh: '在 ROYAL HA LONG 预订餐位',
        ko: 'ROYAL HA LONG에서 테이블 예약하기',
        ja: 'ROYAL HA LONG でテーブルを予約する',
        th: 'สำรองโต๊ะที่ ROYAL HA LONG',
      }),
      description: loc({
        vi: `Gọi ${HOTLINE_RESTAURANT} để giữ chỗ ở nhà hàng Phúc Viên, phòng VIP hoặc bàn tiệc theo nhóm.`,
        en: `Call ${HOTLINE_RESTAURANT} to hold a table at Phuc Vien Restaurant, a VIP room or a group booking.`,
        zh: `致电 ${HOTLINE_RESTAURANT} 即可预留福缘中餐厅的餐位、贵宾房或团体宴席。`,
        ko: `${HOTLINE_RESTAURANT} 으로 전화하시면 푹비엔 레스토랑의 좌석, VIP룸, 단체 연회석을 예약하실 수 있습니다.`,
        ja: `${HOTLINE_RESTAURANT} までお電話いただければ、フックヴィエン・レストランのお席、VIPルーム、団体席をお取りします。`,
        th: `โทร ${HOTLINE_RESTAURANT} เพื่อจองโต๊ะที่ภัตตาคารฟุกเวียน ห้องวีไอพี หรือโต๊ะจัดเลี้ยงสำหรับหมู่คณะ`,
      }),
      // Đo trên chính ảnh: với lớp phủ `.scrim-hero`, ảnh này cho tiêu đề
      // 12.87:1 (xấu nhất 6.16:1) và mô tả 16.20:1 — cao nhất trong toàn bộ
      // kho ảnh ẩm thực. Đổi ảnh khác thì ĐO LẠI, đừng chọn bằng mắt: từng
      // thử `DSC00511-scaled.jpg` và tụt xuống 2.03:1.
      background: fig('Royal-Halong-Hotel-Restaurant-08.jpg', ALT.restaurant08),
      cta: linkOut(
        TEL_HREF,
        {
          vi: 'GỌI ĐẶT BÀN',
          en: 'CALL TO RESERVE',
          zh: '致电预订',
          ko: '전화로 예약',
          ja: '電話で予約',
          th: 'โทรจองโต๊ะ',
        },
        false,
      ),
    },
  ]
}

/* ------------------------------------------------------------------ *
 * Bốn document venue loại `dining`
 *
 * BA Ô ĐỂ TRỐNG CÓ CHỦ Ý — đừng điền, bản clone không có số:
 *   - `hours` của Piano Bar / Pool Bar / La Terrasse.
 *   - `menuUrl` của Pool Bar (không có nút menu) và La Terrasse (nút có
 *     nhưng `href=""` rỗng).
 *   - `capacity` của Pool Bar / La Terrasse.
 * ------------------------------------------------------------------ */

function phucVien() {
  return {
    name: loc({
      // GLOSSARY.md — tên riêng, đã chốt đủ sáu ngôn ngữ.
      vi: 'Nhà hàng Phúc Viên',
      en: 'Phuc Vien Restaurant',
      zh: '福缘中餐厅',
      ko: '푹비엔 레스토랑',
      ja: 'フックヴィエン・レストラン',
      th: 'ภัตตาคารฟุกเวียน',
    }),
    slug: sameSlug('nha-hang-phuc-vien'),
    kind: 'dining',
    order: 1,
    location: loc({
      vi: 'Tầng 2 khách sạn',
      en: 'Second floor of the hotel',
      zh: '酒店二楼',
      ko: '호텔 2층',
      ja: 'ホテル2階',
      th: 'ชั้น 2 ของโรงแรม',
    }),
    capacity: loc({
      vi: '250 khách, 2 phòng VIP',
      en: '250 guests, 2 VIP rooms',
      zh: '250 位客人，2 间贵宾房',
      ko: '250명, VIP룸 2개',
      ja: '250名、VIPルーム2室',
      th: '250 ท่าน, ห้องวีไอพี 2 ห้อง',
    }),
    // "24/7" đọc giống nhau ở cả sáu ngôn ngữ — không có gì để dịch.
    hours: loc({ vi: '24/7', en: '24/7', zh: '24/7', ko: '24/7', ja: '24/7', th: '24/7' }),
    phone: HOTLINE_RESTAURANT,
    menuUrl: MENU_URL,
    highlights: chips([
      { vi: 'Vịt quay Bắc Kinh', en: 'Peking duck', zh: '北京烤鸭', ko: '베이징덕', ja: '北京ダック', th: 'เป็ดปักกิ่ง' },
      { vi: 'Đậu phụ Càn Long', en: 'Can Long tofu', zh: '乾隆豆腐', ko: '건륭 두부', ja: '乾隆豆腐', th: 'เต้าหู้เฉียนหลง' },
      { vi: 'Thịt quay xá xíu', en: 'Char siu roast pork', zh: '叉烧', ko: '차슈', ja: 'チャーシュー', th: 'หมูแดงชาชู' },
      { vi: 'Hải sản tươi sống', en: 'Live seafood', zh: '鲜活海鲜', ko: '활어 해산물', ja: '活きた海鮮', th: 'อาหารทะเลสด' },
      { vi: 'Rượu vang nhập khẩu', en: 'Imported wines', zh: '进口葡萄酒', ko: '수입 와인', ja: '輸入ワイン', th: 'ไวน์นำเข้า' },
    ]),
    description: blockLoc({
      vi: [
        'Nhà hàng Phúc Viên là điểm ăn chính của khách sạn: một chuyến tàu ẩm thực đa dạng, nơi thực khách thưởng thức những hương vị đặc trưng của hải sản tươi sống Hạ Long.',
        'Bên cạnh đó là các món đặc trưng của ẩm thực châu Á như vịt quay Bắc Kinh đậm đà, đậu phụ Càn Long mềm ngậy, cùng một số món Âu như bò bít tết hảo hạng ăn kèm sốt mù tạt, sốt tiêu hay sốt kem.',
        'Không gian thân mật, gần gũi, với quầy bếp mở đặt ngay cạnh dãy buffet — món ăn được hoàn thiện trước mắt thực khách.',
      ],
      en: [
        'Phuc Vien is the hotel’s main restaurant: a wide-ranging culinary journey built around the flavours of live Ha Long seafood.',
        'Alongside it come Asian signatures such as rich Peking duck and silky Can Long tofu, together with European plates including prime steak served with mustard, pepper or cream sauce.',
        'The room is warm and unhurried, with an open kitchen set beside the buffet line so dishes are finished in front of you.',
      ],
      zh: [
        '福缘中餐厅是酒店的主餐厅：一趟风味多元的美食之旅，客人在此品尝下龙鲜活海鲜的标志性滋味。',
        '此外还有亚洲经典菜式，如味道浓郁的北京烤鸭、软滑绵密的乾隆豆腐，以及配芥末酱、黑椒酱或奶油酱的上等牛排等欧陆菜。',
        '空间亲切而放松，开放厨台就设在自助餐台旁，菜品在客人眼前完成最后一道工序。',
      ],
      ko: [
        '푹비엔 레스토랑은 호텔의 주 식당입니다. 하롱의 활어 해산물이 지닌 고유한 맛을 중심으로 폭넓은 미식 여정을 펼칩니다.',
        '여기에 진한 풍미의 베이징덕, 부드러운 건륭 두부 같은 아시아 대표 요리와, 머스터드·후추·크림 소스를 곁들인 최상급 스테이크 같은 유럽 요리가 더해집니다.',
        '공간은 아늑하고 편안하며, 뷔페 라인 옆에 오픈 키친을 두어 요리의 마지막 손질을 손님 앞에서 마칩니다.',
      ],
      ja: [
        'フックヴィエン・レストランはホテルの中心となる食事処です。ハロンの活きた海鮮が持つ持ち味を軸に、幅広い美食の道程をご用意しています。',
        'あわせて、こくのある北京ダックやなめらかな乾隆豆腐といったアジアの定番、さらにマスタード、ペッパー、クリームのソースを添えた上質なステーキなどのヨーロッパ料理もそろえています。',
        '空間は親しみやすく落ち着いており、ビュッフェ台の隣に置かれたオープンキッチンで料理の仕上げをお客様の目の前で行います。',
      ],
      th: [
        'ภัตตาคารฟุกเวียนคือห้องอาหารหลักของโรงแรม เป็นการเดินทางแห่งรสชาติที่หลากหลาย โดยมีอาหารทะเลสดจากฮาลองเป็นรสชาติเด่น',
        'นอกจากนี้ยังมีอาหารเอเชียอันเป็นเอกลักษณ์ เช่น เป็ดปักกิ่งรสเข้มข้น เต้าหู้เฉียนหลงเนื้อนุ่ม พร้อมอาหารยุโรปอย่างสเต๊กคุณภาพเยี่ยมเสิร์ฟกับซอสมัสตาร์ด ซอสพริกไทย หรือซอสครีม',
        'บรรยากาศอบอุ่นเป็นกันเอง พร้อมเคาน์เตอร์ครัวเปิดที่ตั้งอยู่ข้างแนวบุฟเฟต์ อาหารจึงถูกปรุงจนเสร็จต่อหน้าผู้รับประทาน',
      ],
    }),
    image: fig('Royal-Halong-Hotel-Restaurant-06.jpg', ALT.restaurant06),
    gallery: [
      fig('Royal-Ha-Long-Restaurant-Phuc-Vien-04.jpg', ALT.phucVien04),
      fig('Royal-Ha-Long-Restaurant-Phuc-Vien-05.jpg', ALT.phucVien05),
      fig('Royal-Halong-Hotel-Restaurant-07.jpg', ALT.restaurant07),
      fig('Royal-Halong-Hotel-Restaurant-08.jpg', ALT.restaurant08),
      fig('Royal-Halong-Hotel-Restaurant-09.jpg', ALT.restaurant09),
      fig('Royal-Halong-Hotel-Restaurant-10.jpg', ALT.restaurant10),
      fig('Royal-Halong-Hotel-Restaurant-11.jpg', ALT.restaurant11),
      fig('Royal-Halong-Hotel-Restaurant-04.jpg', ALT.restaurant04),
    ],
  }
}

function pianoBar() {
  return {
    // "Piano Bar" giữ nguyên ở cả sáu ngôn ngữ (GLOSSARY.md).
    name: loc({ vi: 'Piano Bar', en: 'Piano Bar', zh: 'Piano Bar', ko: 'Piano Bar', ja: 'Piano Bar', th: 'Piano Bar' }),
    slug: sameSlug('piano-bar'),
    kind: 'dining',
    order: 13,
    location: loc({
      vi: 'Sảnh khách sạn',
      en: 'Hotel lobby',
      zh: '酒店大堂',
      ko: '호텔 로비',
      ja: 'ホテルロビー',
      th: 'ล็อบบี้โรงแรม',
    }),
    capacity: loc({
      vi: '40 chỗ ngồi',
      en: '40 seats',
      zh: '40 个座位',
      ko: '40석',
      ja: '40席',
      th: '40 ที่นั่ง',
    }),
    phone: HOTLINE_HOTEL,
    menuUrl: MENU_URL,
    highlights: chips([
      { vi: 'Cocktail', en: 'Cocktails', zh: '鸡尾酒', ko: '칵테일', ja: 'カクテル', th: 'ค็อกเทล' },
      {
        vi: 'Đồ uống đặc biệt',
        en: 'Signature drinks',
        zh: '招牌饮品',
        ko: '시그니처 드링크',
        ja: 'シグネチャードリンク',
        th: 'เครื่องดื่มซิกเนเจอร์',
      },
      {
        vi: 'Âm nhạc du dương',
        en: 'Live melodies',
        zh: '悠扬乐声',
        ko: '은은한 라이브 연주',
        ja: '生演奏の調べ',
        th: 'เสียงดนตรีสด',
      },
    ]),
    description: blockLoc({
      vi: [
        'Nằm ngay trong sảnh khách sạn, Piano Bar mang đến các loại cocktail và đồ uống đặc biệt.',
        'Quầy bar 40 chỗ ngồi là một không gian thư giãn giữa đường về phòng và cửa chính — ghé một ly trước bữa tối, hoặc ngồi lại sau bữa tối cùng tiếng dương cầm.',
      ],
      en: [
        'Set in the hotel lobby, Piano Bar serves cocktails and signature drinks.',
        'Its 40 seats make an easy pause between the front door and the lift — a glass before dinner, or a long one afterwards with the piano playing.',
      ],
      zh: [
        'Piano Bar 就设在酒店大堂，供应各式鸡尾酒与招牌饮品。',
        '40 个座位的吧台，是大门与客房之间的一处歇脚地——晚餐前小酌一杯，或在餐后伴着琴声多坐一会儿。',
      ],
      ko: [
        '호텔 로비에 자리한 Piano Bar는 다양한 칵테일과 시그니처 드링크를 선보입니다.',
        '40석 규모의 바는 정문과 객실 사이에 놓인 쉼터입니다. 저녁 식사 전 한 잔, 혹은 식사 후 피아노 선율과 함께 머무는 시간을 권해 드립니다.',
      ],
      ja: [
        'ホテルのロビーにある Piano Bar では、さまざまなカクテルとシグネチャードリンクをご用意しています。',
        '40席のバーは、玄関と客室のあいだのひと休みの場所です。夕食前の一杯にも、食後にピアノの音とともに過ごす時間にもどうぞ。',
      ],
      th: [
        'Piano Bar ตั้งอยู่ในล็อบบี้ของโรงแรม เสิร์ฟค็อกเทลหลากชนิดและเครื่องดื่มซิกเนเจอร์',
        'บาร์ขนาด 40 ที่นั่งคือพื้นที่พักผ่อนระหว่างประตูหน้ากับห้องพัก แวะดื่มสักแก้วก่อนมื้อค่ำ หรือนั่งต่อหลังมื้อค่ำพร้อมเสียงเปียโน',
      ],
    }),
    image: fig('Royal-Ha-Long-Casino-11.jpg', ALT.pianoCocktails),
    gallery: [
      fig('Royal-Halong-Hotel-piano-bar-01.jpg', ALT.lobbyChandelier),
      fig('DSC00801-scaled.jpg', ALT.cocktailClink),
    ],
  }
}

function poolBar() {
  return {
    name: loc({ vi: 'Pool Bar', en: 'Pool Bar', zh: 'Pool Bar', ko: 'Pool Bar', ja: 'Pool Bar', th: 'Pool Bar' }),
    slug: sameSlug('pool-bar'),
    kind: 'dining',
    order: 14,
    location: loc({
      vi: 'Cạnh bể bơi ngoài trời',
      en: 'Beside the outdoor swimming pool',
      zh: '室外泳池畔',
      ko: '야외 수영장 옆',
      ja: '屋外プールのそば',
      th: 'ข้างสระว่ายน้ำกลางแจ้ง',
    }),
    phone: HOTLINE_HOTEL,
    highlights: chips([
      {
        vi: 'Đồ uống mát lạnh',
        en: 'Chilled drinks',
        zh: '冰爽饮品',
        ko: '시원한 음료',
        ja: '冷たいドリンク',
        th: 'เครื่องดื่มเย็น',
      },
      {
        vi: 'Đồ ăn nhẹ Á – Âu',
        en: 'Asian–European light bites',
        zh: '亚欧风味小食',
        ko: '아시아·유럽식 스낵',
        ja: 'アジア・欧風の軽食',
        th: 'อาหารว่างเอเชีย–ยุโรป',
      },
      {
        vi: 'Ngồi sát mặt nước',
        en: 'Seating at the water’s edge',
        zh: '临水座席',
        ko: '물가 좌석',
        ja: '水辺の席',
        th: 'ที่นั่งริมน้ำ',
      },
    ]),
    description: blockLoc({
      vi: [
        'Quầy bar nằm cạnh bể bơi ngoài trời của khách sạn, mở ra một khoảng thư giãn thoáng đãng và mát mẻ.',
        'Pool Bar để quý khách đắm mình vào cảnh sắc trong khi thưởng thức các loại đồ uống mát lạnh cùng những món ăn nhẹ Á – Âu, không cần thay đồ hay rời ghế tắm nắng.',
      ],
      en: [
        'The bar sits beside the hotel’s outdoor swimming pool, opening onto an airy, cool place to unwind.',
        'Pool Bar lets you stay with the view over chilled drinks and Asian–European light bites — no need to change or leave your sun lounger.',
      ],
      zh: [
        '酒吧位于酒店室外泳池旁，辟出一处开阔而清凉的放松之所。',
        '在 Pool Bar，您可以一边沉浸于眼前景色，一边享用冰爽饮品与亚欧风味小食，无需更衣，也不必离开日光躺椅。',
      ],
      ko: [
        '바는 호텔의 야외 수영장 옆에 자리해, 탁 트이고 시원한 휴식 공간을 열어 줍니다.',
        'Pool Bar에서는 시원한 음료와 아시아·유럽식 가벼운 요리를 즐기며 풍경에 머무실 수 있습니다. 옷을 갈아입거나 선베드를 떠나실 필요가 없습니다.',
      ],
      ja: [
        'バーはホテルの屋外プールのそばにあり、開放的で涼しいくつろぎの場を作っています。',
        'Pool Bar なら、冷たい飲み物とアジア・欧風の軽食を楽しみながら景色に浸れます。着替える必要も、サンラウンジャーを離れる必要もありません。',
      ],
      th: [
        'บาร์ตั้งอยู่ข้างสระว่ายน้ำกลางแจ้งของโรงแรม เปิดออกสู่พื้นที่พักผ่อนอันโปร่งโล่งและเย็นสบาย',
        'ที่ Pool Bar ท่านสามารถดื่มด่ำกับทิวทัศน์พร้อมเครื่องดื่มเย็นและอาหารว่างเอเชีย–ยุโรป โดยไม่ต้องเปลี่ยนชุดหรือลุกจากเตียงอาบแดด',
      ],
    }),
    image: fig('Royal-Halong-Hotel-four-season-swimming-pool-04.jpg', ALT.loungerCocktails),
    gallery: [
      fig('Royal-Halong-Hotel-outdoor-swimming-pool-03.jpg', ALT.poolParasols),
      fig('Royal-Halong-Hotel-outdoor-swimming-pool-02.jpg', ALT.poolPalms),
    ],
  }
}

function laTerrasse() {
  return {
    name: loc({
      vi: 'La Terrasse',
      en: 'La Terrasse',
      zh: 'La Terrasse',
      ko: 'La Terrasse',
      ja: 'La Terrasse',
      th: 'La Terrasse',
    }),
    slug: sameSlug('la-terrasse'),
    kind: 'dining',
    order: 15,
    location: loc({
      vi: 'Khuôn viên ngoài trời của khách sạn',
      en: 'In the hotel grounds',
      zh: '酒店户外园区',
      ko: '호텔 야외 정원',
      ja: 'ホテルの屋外庭園',
      th: 'ในสวนกลางแจ้งของโรงแรม',
    }),
    phone: HOTLINE_HOTEL,
    highlights: chips([
      {
        vi: 'Quầy bar ngoài trời',
        en: 'Open-air bar',
        zh: '露天酒吧',
        ko: '야외 바',
        ja: '屋外バー',
        th: 'บาร์กลางแจ้ง',
      },
      {
        vi: 'Trà chiều cuối tuần',
        en: 'Weekend afternoon tea',
        zh: '周末下午茶',
        ko: '주말 애프터눈 티',
        ja: '週末のアフタヌーンティー',
        th: 'ชายามบ่ายวันหยุด',
      },
      {
        vi: 'Không gian xanh',
        en: 'Green surroundings',
        zh: '绿意环绕',
        ko: '초록의 공간',
        ja: '緑に包まれた空間',
        th: 'พื้นที่สีเขียว',
      },
    ]),
    description: blockLoc({
      vi: [
        'Nổi bật giữa khuôn viên kiểu Âu, La Terrasse mang đầy đủ những nét đặc trưng của một quầy bar ngoài trời với không gian xanh mướt dễ chịu.',
        'Nhâm nhi tách trà nóng và quà chiều vào những ngày cuối tuần, dưới ánh nắng nhẹ dịu, sẽ xua tan đi những bộn bề thường nhật và khơi dậy cảm giác thư thái, an nhiên.',
      ],
      en: [
        'Standing out in the European-style grounds, La Terrasse has everything an open-air bar should: green, easy surroundings and shade from the trees.',
        'A pot of hot tea and afternoon treats at the weekend, taken in soft sunlight, is enough to lift the week off your shoulders.',
      ],
      zh: [
        'La Terrasse 立于欧式园林之中，具备露天酒吧的全部气质，绿意盎然，令人舒展。',
        '周末在柔和日光下慢饮一壶热茶、配上下午茶点，足以驱散日常的忙乱，唤回安然自在的心绪。',
      ],
      ko: [
        '유럽식 정원 가운데 자리한 La Terrasse는 싱그러운 녹음과 함께 야외 바가 갖춰야 할 요소를 모두 지니고 있습니다.',
        '주말, 부드러운 햇살 아래 따뜻한 차와 오후의 다과를 천천히 즐기다 보면 일상의 번잡함이 걷히고 편안한 마음이 되돌아옵니다.',
      ],
      ja: [
        'ヨーロッパ風の庭園に佇む La Terrasse は、みずみずしい緑に包まれ、屋外バーらしさをひととおり備えています。',
        '週末、やわらかな日差しの下で温かいお茶とアフタヌーンティーをゆっくり味わえば、日々の慌ただしさがほどけ、穏やかな心持ちが戻ってきます。',
      ],
      th: [
        'La Terrasse โดดเด่นอยู่กลางสวนสไตล์ยุโรป มีครบทุกองค์ประกอบของบาร์กลางแจ้ง ท่ามกลางพื้นที่สีเขียวอันร่มรื่น',
        'จิบชาร้อนพร้อมของว่างยามบ่ายในวันหยุดสุดสัปดาห์ ใต้แสงแดดอ่อน ช่วยคลายความวุ่นวายประจำวันและคืนความรู้สึกผ่อนคลายสงบใจ',
      ],
    }),
    image: fig('488706854_1470177697737884_8772341987698441772_n.jpg', ALT.terrassePavilion),
    gallery: [
      fig('Royal-Ha-Long-Gallery-Hotel-14.jpg', ALT.brickPath),
      fig('Royal-Ha-Long-Gallery-Hotel-12.jpg', ALT.whiteBuilding),
    ],
  }
}

/* ------------------------------------------------------------------ */

async function main() {
  // Đặt lại bộ đếm `_key` để mỗi lần chạy sinh ra đúng cùng một bộ khoá →
  // patch lặp lại không tạo diff giả.
  resetKeys()

  await patchDoc('page.culinary', {
    title: loc({ vi: 'ẨM THỰC', en: 'DINING', zh: '餐饮', ko: '다이닝', ja: 'ダイニング', th: 'ร้านอาหาร' }),
    slug: sameSlug('culinary'),
    sections: culinarySections(),
  })

  await patchDoc('venue.nha-hang-phuc-vien', phucVien())
  await patchDoc('venue.piano-bar', pianoBar())
  await patchDoc('venue.pool-bar', poolBar())
  await patchDoc('venue.la-terrasse', laTerrasse())

  console.log('')
  let holes = 0
  for (const id of [
    'page.culinary',
    'venue.nha-hang-phuc-vien',
    'venue.piano-bar',
    'venue.pool-bar',
    'venue.la-terrasse',
  ]) {
    holes += await assertFullyTranslated(id)
  }
  console.log(
    holes === 0 ? '\n✓ Nhóm B đủ sáu ngôn ngữ.' : `\n${holes} field còn thiếu bản dịch.`,
  )
  process.exit(holes === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
