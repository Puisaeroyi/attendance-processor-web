import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const baseStyles =
      'w-full bg-nb-white border-nb-4 border-nb-black px-nb-4 py-nb-3 text-base font-medium transition-all duration-150 ease-out placeholder:text-nb-gray-400 focus:outline-none focus:border-nb-blue focus:shadow-nb-blue disabled:opacity-50 disabled:cursor-not-allowed';

    const errorStyles = error ? 'border-nb-red focus:border-nb-red focus:shadow-nb-red' : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-nb-2 block text-sm font-bold uppercase tracking-wide text-nb-black"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(baseStyles, errorStyles, className)}
          {...props}
        />
        {error && <p className="mt-nb-2 text-sm font-medium text-nb-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
