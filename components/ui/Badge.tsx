import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-nb-3 py-nb-1 text-xs font-bold uppercase tracking-wide border-nb-2 border-nb-black shadow-nb-sm';

    const variantStyles = {
      default: 'bg-nb-gray-100 text-nb-black',
      primary: 'bg-nb-blue text-nb-white',
      success: 'bg-nb-green text-nb-white',
      warning: 'bg-nb-yellow text-nb-black',
      error: 'bg-nb-red text-nb-white',
    };

    return (
      <span ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
