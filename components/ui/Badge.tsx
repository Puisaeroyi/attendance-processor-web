import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black shadow-sm';

    const variantStyles = {
      default: 'bg-gray-100 text-black',
      primary: 'bg-blue-600 text-white',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-400 text-black',
      error: 'bg-red-600 text-white',
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
