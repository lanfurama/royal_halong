import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { blocksToPlainText, parseTravelStats } from '@/lib/home-stats'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { VideoFacade } from './VideoFacade'

/**
 * Khối giới thiệu: đoạn văn về khách sạn + các mốc khoảng cách + video.
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
    <section className="pt-16 pb-20 lg:pt-24 lg:pb-24">
      <Container size="wide">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-gold text-[0.6875rem] tracking-[0.18em] uppercase">
              {ui('about', lang)}
            </p>

            {/* Đoạn giới thiệu đặt cỡ chữ lớn hơn body thường: khối này không
                có `h2` (xem chú thích đầu file), nên chính đoạn văn phải mang
                sức nặng thị giác mở đầu. */}
            <div className="text-body/85 mt-5 text-base leading-[1.85] text-pretty lg:text-[0.96875rem]">
              <RichText value={intro?.content} lang={lang} />
            </div>

            {stats.length > 0 ? (
              <dl className="border-gold/25 mt-8 grid grid-cols-2 gap-6 border-t pt-6 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={`${stat.value}-${stat.label}`}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="font-display text-gold-deep block text-[2.375rem] leading-none">
                        {stat.value}
                        <span className="text-xl"> {stat.unit}</span>
                      </span>
                      <span className="text-muted mt-2 block text-xs leading-relaxed">
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
              <div className="border-gold/25 text-body/85 mt-8 border-t pt-6 text-sm leading-relaxed">
                <RichText value={location?.content} lang={lang} />
              </div>
            )}

            <Link
              href={mapHref}
              className="text-gold-text border-gold/50 hover:text-gold-deep hover:border-gold mt-9 inline-flex min-h-11 items-center gap-3 border-b text-xs tracking-[0.1em] uppercase transition-colors"
            >
              {ui('findOnMap', lang)}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {videoImage?.asset && (
            <div className="relative aspect-[4/5] w-full">
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
                      sizes="(max-width: 1024px) 100vw, 620px"
                      decorative
                      className="h-full w-full object-cover"
                    />
                  </VideoFacade>
                ) : (
                  <SanityImage
                    image={videoImage}
                    lang={lang}
                    sizes="(max-width: 1024px) 100vw, 620px"
                    decorative
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
