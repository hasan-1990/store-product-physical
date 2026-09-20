import { cn } from '@/lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'new';
  className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        variant === 'new' ? 'product-card-badge' : 'rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-surface',
        className,
      )}
    >
      {children}
    </span>
  );
}
