import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'md' | 'lg';
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-orange-500 text-white shadow-lg shadow-orange-500/30 active:bg-orange-600 disabled:bg-gray-300 disabled:shadow-none',
  secondary:
    'bg-white text-orange-500 border-2 border-orange-500 active:bg-orange-50 disabled:border-gray-300 disabled:text-gray-300',
  outline:
    'bg-white text-gray-700 border-2 border-gray-200 active:bg-gray-100 disabled:text-gray-300',
  danger:
    'bg-red-500 text-white shadow-lg shadow-red-500/30 active:bg-red-600 disabled:bg-gray-300 disabled:shadow-none',
  ghost: 'bg-transparent text-gray-500 active:bg-gray-100',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'h-12 px-5 text-base rounded-2xl',
  lg: 'h-16 px-6 text-lg rounded-3xl',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  fullWidth = true,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 font-bold transition-all',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled}
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
