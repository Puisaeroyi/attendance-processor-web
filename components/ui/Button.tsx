import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white hover:from-blue-500 hover:to-purple-500 hover:shadow-[0_0_20px_rgba(102,126,234,0.5)]',
      secondary:
        'bg-white/15 text-white hover:bg-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]',
      success:
        'bg-green-500/30 text-white border-green-400/40 hover:bg-green-500/50 hover:shadow-[0_0_15px_rgba(52,199,89,0.4)]',
      warning:
        'bg-yellow-500/30 text-white border-yellow-400/40 hover:bg-yellow-500/50 hover:shadow-[0_0_15px_rgba(255,204,0,0.4)]',
      error:
        'bg-red-500/30 text-white border-red-400/40 hover:bg-red-500/50 hover:shadow-[0_0_15px_rgba(255,59,48,0.4)]',
      ghost:
        'bg-transparent text-white/80 border-transparent hover:bg-white/10 hover:text-white',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
