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
      'inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all duration-150 ease-out border-4 border-black shadow-lg focus-visible:outline-none focus-visible:outline-4 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-xl active:translate-x-0 active:translate-y-0 active:shadow-lg focus-visible:outline-blue-600',
      secondary:
        'bg-purple-600 text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-xl active:translate-x-0 active:translate-y-0 active:shadow-lg focus-visible:outline-purple-600',
      success:
        'bg-green-600 text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-xl active:translate-x-0 active:translate-y-0 active:shadow-lg focus-visible:outline-green-600',
      warning:
        'bg-yellow-400 text-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-xl active:translate-x-0 active:translate-y-0 active:shadow-lg focus-visible:outline-yellow-400',
      error:
        'bg-red-600 text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-xl active:translate-x-0 active:translate-y-0 active:shadow-lg focus-visible:outline-red-600',
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
