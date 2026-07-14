import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-blue-500 text-white hover:bg-brand-blue-600 active:bg-brand-blue-700',
  secondary: 'bg-brand-green-500 text-white hover:bg-brand-green-600',
  ghost: 'bg-transparent text-brand-ink hover:bg-slate-100 border border-slate-200',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, className = '', children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
