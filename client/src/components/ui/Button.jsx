import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white shadow-[0_0_20px_rgba(124,92,255,0.25)]',
  secondary: 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border-light)]',
  ghost: 'bg-transparent hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]',
  danger: 'bg-transparent hover:bg-red-500/10 text-[var(--color-danger)] border border-red-500/30',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
