import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all duration-150 ease-out border-nb-4 border-nb-black shadow-nb focus-visible:outline-none focus-visible:outline-4 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-nb-blue text-nb-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-nb-lg active:translate-x-0 active:translate-y-0 active:shadow-nb-sm focus-visible:outline-nb-blue',
      secondary:
        'bg-nb-purple text-nb-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-nb-lg active:translate-x-0 active:translate-y-0 active:shadow-nb-sm focus-visible:outline-nb-purple',
      success:
        'bg-nb-green text-nb-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-nb-lg active:translate-x-0 active:translate-y-0 active:shadow-nb-sm focus-visible:outline-nb-green',
      warning:
        'bg-nb-yellow text-nb-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-nb-lg active:translate-x-0 active:translate-y-0 active:shadow-nb-sm focus-visible:outline-nb-yellow',
      error:
        'bg-nb-red text-nb-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-nb-lg active:translate-x-0 active:translate-y-0 active:shadow-nb-sm focus-visible:outline-nb-red',
    };

    const sizeStyles = {
      sm: 'px-nb-4 py-nb-2 text-sm',
      md: 'px-nb-6 py-nb-3 text-base',
      lg: 'px-nb-8 py-nb-4 text-lg',
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
