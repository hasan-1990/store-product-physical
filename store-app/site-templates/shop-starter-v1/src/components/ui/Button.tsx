import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
  };

  return (
    <button
      className={cn(variants[variant], fullWidth && 'w-full', className)}
      {...props}
    >
      {children}
    </button>
  );
}
