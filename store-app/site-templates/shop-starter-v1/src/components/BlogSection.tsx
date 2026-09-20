import Image from 'next/image';
import Link from 'next/link';
import type { ArticleItem } from '@/lib/types/site-content';

type BlogSectionProps = {
  articles: ArticleItem[];
};

export function BlogSection({ articles }: BlogSectionProps) {
  return (
    <section className="section-gap">
      <div className="page-container">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="section-title">مجله زیبایی</h2>
          <Link href="/products" className="text-sm font-semibold text-primary hover:underline">
            مطالب بیشتر
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {articles.map((article) => (
            <article key={article.slug} className="group overflow-hidden rounded-card bg-surface shadow-soft">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{article.tag}</span>
                <h3 className="mt-2 text-xl font-semibold text-on-surface">{article.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{article.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
