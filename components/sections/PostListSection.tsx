import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { Reveal } from '@/components/ui/Reveal'
import { hrefFor } from '@/lib/routes'

export function PostListSection({
  heading,
  resolved = [],
  limit = 12,
  lang,
}: any & { lang: Locale }) {
  const posts = resolved.slice(0, limit)

  if (posts.length === 0) {
    return (
      <section className="py-16">
        <Container>
          <p className="text-center text-sm">
            {lang === 'vi' ? 'Chưa có bài viết nào.' : 'No articles yet.'}
          </p>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any, index: number) => {
            const published = post.publishedAt ? new Date(post.publishedAt) : null
            const postTitle = t<string>(post.title, lang)
            return (
              <Reveal key={post._id} delay={index * 80}>
                <article className="h-full">
                  <Link href={hrefFor(lang, post.slug)} className="group block">
                    {post.coverImage && (
                      <SanityImage
                        image={post.coverImage}
                        lang={lang}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        fallbackAlt={postTitle}
                        className="aspect-[3/2] w-full object-cover"
                      />
                    )}
                    {published && (
                      <time
                        dateTime={published.toISOString()}
                        className="text-gold-text mt-4 block text-xs tracking-widest uppercase"
                      >
                        {published.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                    {/* 18px, dưới ngưỡng gold-deep (>=24px) -> gold-text (5.32:1 trên
                        trắng), giữ nguyên cỡ chữ tiêu đề thẻ bài viết. */}
                    <h3 className="font-display text-gold-text mt-2 text-lg group-hover:underline">
                      {postTitle}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm">{t<string>(post.excerpt, lang)}</p>
                    )}
                  </Link>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
