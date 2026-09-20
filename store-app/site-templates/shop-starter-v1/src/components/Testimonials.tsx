import { RatingStars } from '@/components/ui/RatingStars';
import type { TestimonialItem } from '@/lib/types/site-content';

type TestimonialsProps = {
  items: TestimonialItem[];
};

export function Testimonials({ items }: TestimonialsProps) {
  return (
    <section className="section-gap bg-surface-container-low">
      <div className="page-container">
        <h2 className="section-title mb-12 text-center">نظر مشتریان</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((item, index) => (
            <blockquote
              key={`${item.name}-${index}`}
              className="rounded-card bg-surface p-8 shadow-soft"
            >
              <RatingStars rating={item.rating} />
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">&ldquo;{item.text}&rdquo;</p>
              <footer className="mt-6 text-sm font-semibold text-on-surface">— {item.name}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
