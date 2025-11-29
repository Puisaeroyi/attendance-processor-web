import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border';

    const variantStyles = {
      default: 'bg-white/20 text-white border-white/30',
      success: 'bg-green-500/25 text-green-200 border-green-400/40',
      warning: 'bg-yellow-500/25 text-yellow-200 border-yellow-400/40',
      error: 'bg-red-500/25 text-red-200 border-red-400/40',
      info: 'bg-blue-500/25 text-blue-200 border-blue-400/40',
      primary: 'bg-purple-500/25 text-purple-200 border-purple-400/40',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
