import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'

/**
 * Thanh mục lục dính, đặt ngay sau hero của những trang dài.
 *
 * Vì sao cần: trang /wedding dài ~9 màn hình và câu hỏi của khách không đi
 * theo thứ tự trang — người đã xem sảnh chỉ muốn nhảy tới "Sức chứa", người
 * được giới thiệu qua bạn bè muốn tới thẳng "Đặt hẹn". Không có thanh này
 * thì đường duy nhất là cuộn, và nút "Nhận tư vấn" — hành động chính của cả
 * trang — chỉ tồn tại ở hero (cuộn qua là mất) và ở cuối trang.
 *
 * KHÔNG có JS: không theo dõi section đang xem, không tô sáng mục hiện tại.
 * `IntersectionObserver` cho 6 mốc chỉ để đổi màu một dòng chữ là JS chạy
 * suốt lúc cuộn đổi lấy một tín hiệu mà thanh cuộn của trình duyệt đã cho
 * rồi. Neo `#` thuần chạy được cả khi JS chưa tải.
 *
 * Chiều cao khai ở `--pagenav-h` (`app/globals.css`), KHÔNG viết vào đây:
 * `scroll-margin-top` của mọi neo trên trang phải cộng đúng con số đó, và
 * `body:has(.rhl-pagenav)` là thứ duy nhất nối hai chỗ lại với nhau.
 */
export function PageNavSection({ links, cta, lang }: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection — projection GROQ trả `null`
  // TƯỜNG MINH cho field vắng mặt, mà default parameter chỉ bắt `undefined`.
  const list: any[] = links ?? []
  if (list.length === 0) return null

  return (
    <nav className="rhl-pagenav" aria-label={ui('onThisPage', lang)}>
      <Container size="wide">
        {/* `flex-nowrap` + `shrink-0` cho nút, thay cho `flex-wrap` của bản
            thiết kế: ở 390px bản gốc đẩy nút xuống dòng thứ hai và thanh cao
            gấp đôi — mà `--pagenav-h` (thứ `scroll-margin-top` đang cộng vào)
            vẫn là một dòng, nên mọi neo cuộn lệch đúng 56px. Thanh này phải
            cao BẰNG NHAU ở mọi bề ngang, không có ngoại lệ. */}
        <div className="flex flex-nowrap items-center gap-4">
          {/* Dải mục lục cuộn ngang khi không đủ chỗ. Không thêm `tabIndex`
              như ở `TableBody`: axe chỉ đòi vùng cuộn phải focus được khi nó
              KHÔNG có con nào focus được — ở đây mỗi mục là một `<a>`, người
              dùng bàn phím tab qua là vùng tự cuộn theo. Thêm tab stop nữa
              chỉ làm họ phải bấm thừa một lần.

              Mặt nạ mờ dần ở mép phải là dấu hiệu DUY NHẤT cho biết còn mục
              phía sau (thanh cuộn trên iOS/macOS là lớp phủ, chỉ hiện lúc
              đang cuộn). Đây đúng lớp lỗi "3/5 tab vô hình" — chỉ khác là
              bắt được trước khi nó lên production. */}
          <ul
            className="flex min-w-0 list-none items-center gap-5 overflow-x-auto [mask-image:linear-gradient(90deg,#000_calc(100%-2rem),transparent)] lg:gap-6 lg:[mask-image:none]"
          >
            {list.map((link: any, index: number) => {
              const label = t<string>(link.label, lang)
              if (!label || !link.anchor) return null
              return (
                <li key={link._key ?? index}>
                  <a href={`#${link.anchor}`} className="rhl-pagenav__link">
                    {label}
                  </a>
                </li>
              )
            })}
          </ul>

          {/* `ml-auto` chứ không phải `justify-between` trên hàng cha: dải
              mục lục đã `min-w-0` và co được, nên `justify-between` không có
              chỗ trống nào để chia — nút sẽ dính liền mục cuối. */}
          {/* `min-h-11` (44px) chứ không phải 40px của bản thiết kế: thanh
              cao 56px nên 44px vẫn còn 6px đệm mỗi bên, tức không mất gì mà
              đạt đúng ngưỡng vùng chạm. 40px là con số duy nhất trong bản
              thiết kế trượt ngưỡng này. */}
          {cta && (
            <SmartLink
              link={cta}
              lang={lang}
              className="bg-gold text-ink focus-visible:outline-ink ml-auto inline-flex min-h-11 shrink-0 items-center px-5 text-xs font-semibold tracking-[0.1em] whitespace-nowrap uppercase focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          )}
        </div>
      </Container>
    </nav>
  )
}
