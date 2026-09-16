import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { blocksToPlainText, parseTravelStats } from '@/lib/home-stats'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { VideoFacade } from './VideoFacade'

/**
 * Khối giới thiệu: thẻ chữ về khách sạn đan xen (đè lên mép trái) một video
 * nằm ngang rộng gần hết khung, bốn mốc khoảng cách là dải riêng bên dưới.
 *
 * Gộp HAI `richTextSection` liền nhau của trang chủ (đoạn "Tọa lạc tại…" và
 * đoạn "…2 phút di chuyển đến bãi biển; 5 phút…") vào một bố cục hai cột,
 * đúng bản thiết kế. Không có heading riêng: `richTextSection` trong dữ liệu
 * không có `heading`, và tiêu đề duy nhất của trang chủ (`h1`) đã nằm ở
 * hero — không bịa thêm một `h2` không có trong nội dung.
 */
export function HomeIntro({
  intro,
  location,
  videoUrl,
  videoImage,
  lang,
  mapHref,
}: {
  /** `richTextSection` thứ nhất — đoạn giới thiệu. */
  intro?: any
  /** `richTextSection` thứ hai — đoạn vị trí, nguồn của các mốc khoảng cách. */
  location?: any
  videoUrl?: string | null
  videoImage?: any
  lang: Locale
  /** Đích của link "Tìm chúng tôi trên bản đồ" — neo `#map` trong trang. */
  mapHref: string
}) {
  const locationBlocks = t<any[]>(location?.content, lang)
  const stats = parseTravelStats(blocksToPlainText(locationBlocks))

  return (
    // Đệm trên là khoảng thở bình thường, KHÔNG phải chỗ chừa cho thanh đặt
    // phòng: từ bản này thanh đó nằm trong luồng và tự chiếm chỗ (xem ghi chú
    // ở `HomeHero`). Trước đây chỗ này là `pt-44` — một con số buộc phải khớp
    // với chiều cao thanh, và đã đè lên chữ ở 390px khi thanh xếp 1 cột.
    <section className="pt-12 pb-14 lg:pt-16 lg:pb-16">
      <Container size="wide">
        {/* Bố cục ĐAN XEN trên desktop: lưới 3 cột 40% / 15% / 45%.
            - Video chiếm cột 2→4 (60% bề ngang), khung 47:20 (= 2.35:1) —
              ĐÚNG tỉ lệ phần hình thật của video (`TI_LE_NOI_DUNG` trong
              `VideoFacade`). Đây là ràng buộc cứng: khung hẹp hơn tỉ lệ này
              thì bản xem trước phóng lên phủ kín và cắt hai bên (logo góc
              phải mất, video "trông hẹp đi"). Muốn video cao hơn thì phải
              cho nó rộng theo, không đổi tỉ lệ.
            - Thẻ chữ chiếm cột 1→3 (55%), cùng hàng, nổi lên trên (z-10),
              đè lên 15% khung (1/4 bề ngang video) — đủ để kính mờ thật sự
              có hình động phía sau. Thẻ là "kính mờ": nền kem
              55% + blur 3px (mờ nhẹ, vẫn nhận ra hình), hai viền vàng lồng nhau, chữ cái đầu đoạn văn
              dựng lớn bằng Playfair (drop cap). Nút phát của video nằm ở
              tâm (x ≈ 70%), ngoài vùng thẻ che (kết thúc ở 55%).
            - Cả hai `items-center` trong CÙNG một ô hàng, nên nếu đoạn văn
              dài hơn khung video thì hàng cao theo chữ, không tràn — khác với
              `absolute`.
            - Bốn mốc khoảng cách là dải riêng bên dưới, tràn hết bề ngang.
            Dưới lg: xếp dọc chữ → video → mốc như thường. */}
        <div className="grid gap-10 lg:grid-cols-[40fr_15fr_45fr] lg:items-center lg:gap-x-0 lg:gap-y-12">
          <div className="relative lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:z-10 lg:border lg:border-gold/35 lg:bg-cream-soft/55 lg:p-9 lg:backdrop-blur-[3px] xl:p-10">
            {/* Vạch vàng ngắn mở đầu — nhấn cho thẻ khi nó nằm trên nền video. */}
            <span aria-hidden="true" className="bg-gold mb-5 hidden h-px w-10 lg:block" />
            <p className="text-gold text-[0.6875rem] tracking-[0.18em] uppercase">
              {ui('about', lang)}
            </p>

            {/* Đoạn giới thiệu đặt cỡ chữ lớn hơn body thường: khối này không
                có `h2` (xem chú thích đầu file), nên chính đoạn văn phải mang
                sức nặng thị giác mở đầu. */}
            <div className="text-body/85 mt-4 text-[0.9375rem] leading-[1.8] text-pretty lg:[&_p:first-of-type::first-letter]:font-display lg:[&_p:first-of-type::first-letter]:text-gold-deep lg:[&_p:first-of-type::first-letter]:float-left lg:[&_p:first-of-type::first-letter]:mt-1 lg:[&_p:first-of-type::first-letter]:mr-2.5 lg:[&_p:first-of-type::first-letter]:text-[3.5rem] lg:[&_p:first-of-type::first-letter]:leading-[0.8]">
              <RichText value={intro?.content} lang={lang} />
            </div>

            <Link
              href={mapHref}
              className="text-gold-text border-gold/50 hover:text-gold-deep hover:border-gold mt-7 inline-flex min-h-11 items-center gap-3 border-b text-xs tracking-[0.1em] uppercase transition-colors"
            >
              {ui('findOnMap', lang)}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {videoImage?.asset && (
            <div className="relative aspect-video w-full min-w-0 lg:col-start-2 lg:col-end-4 lg:row-start-1 lg:aspect-[47/20]">
              {/* Khung viền lệch 18px phía sau ảnh — chi tiết của bản thiết
                  kế. `pointer-events-none` để nó không nuốt click của nút
                  phát nằm bên dưới nó trong thứ tự xếp chồng. */}
              <span
                aria-hidden="true"
                className="border-gold/40 pointer-events-none absolute inset-0 translate-x-4.5 translate-y-4.5 border"
              />
              <div className="relative h-full w-full overflow-hidden">
                {videoUrl ? (
                  <VideoFacade videoUrl={videoUrl} lang={lang}>
                    <SanityImage
                      image={videoImage}
                      lang={lang}
                      sizes="(max-width: 1024px) 100vw, 820px"
                      decorative
                      className="h-full w-full object-cover"
                    />
                  </VideoFacade>
                ) : (
                  <SanityImage
                    image={videoImage}
                    lang={lang}
                    sizes="(max-width: 1024px) 100vw, 820px"
                    decorative
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {stats.length > 0 ? (
            // Dải mốc tràn hết bề ngang, dưới cả thẻ chữ và video. Trên lg
            // `gap-y-12` của lưới đã chừa chỗ cho khung viền lệch 18px dưới
            // video.
            <dl className="border-gold/25 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-5 sm:grid-cols-4 lg:col-span-3 lg:row-start-2">
              {stats.map((stat) => (
                <div key={`${stat.value}-${stat.label}`}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="font-display text-gold-deep block text-[2rem] leading-none">
                      {stat.value}
                      <span className="text-lg"> {stat.unit}</span>
                    </span>
                    <span className="text-muted mt-1.5 block text-xs leading-relaxed">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            // Không dò được mốc nào (biên tập viên viết lại đoạn văn theo
            // cách khác) -> hiện nguyên đoạn. Mất phần trang trí, không
            // mất nội dung. Xem `lib/home-stats.ts`.
            <div className="border-gold/25 text-body/85 border-t pt-5 text-sm leading-relaxed lg:col-span-3 lg:row-start-2">
              <RichText value={location?.content} lang={lang} />
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
