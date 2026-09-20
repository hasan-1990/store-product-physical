import type { ProductDetail } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';

type ProductReviewsProps = {
  product: ProductDetail;
};

export function ProductReviews({ product }: ProductReviewsProps) {
  return (
    <section className="section-gap">
      <ProductReviewsHeader product={product} />
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {product.reviews.map((review) => (
          <ReviewCard key={review.name} review={review} />
        ))}
      </div>
    </section>
  );
}

function ProductReviewsHeader({ product }: ProductReviewsProps) {
  return (
    <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div className="space-y-2">
        <h2 className="section-title">نظرات مشتریان</h2>
        <div className="flex items-center gap-4">
          <span className="font-display text-4xl text-on-surface">{product.rating}</span>
          <div>
            <RatingStars rating={product.rating} />
            <span className="text-xs font-semibold text-on-surface-variant">
              بر اساس {product.reviewCount} نظر ثبت شده
            </span>
          </div>
        </div>
      </div>
      <Button variant="ghost" className="bg-surface-container-high px-8 py-3 hover:bg-surface-container">
        نوشتن نظر
      </Button>
    </div>
  );
}

function ReviewCard({ review }: { review: ProductDetail['reviews'][number] }) {
  return (
    <article className="card-surface space-y-4 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-on-surface">{review.name}</p>
          {review.verified && (
            <p className="text-xs font-semibold text-on-surface-variant">خریدار تایید شده</p>
          )}
        </div>
        <RatingStars rating={review.rating} size="sm" />
      </div>
      <p className="text-sm italic leading-7 text-on-surface-variant">&ldquo;{review.text}&rdquo;</p>
    </article>
  );
}
