import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

type RatingStarsProps = {
  rating: number;
  size?: 'sm' | 'md';
  className?: string;
};

export function RatingStars({ rating, size = 'md', className }: RatingStarsProps) {
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className={cn('flex text-secondary', className)}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`full-${i}`} className={cn(iconClass, 'fill-secondary')} />
      ))}
      {hasHalf && <StarHalf className={cn(iconClass, 'fill-secondary')} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`empty-${i}`} className={iconClass} />
      ))}
    </div>
  );
}
