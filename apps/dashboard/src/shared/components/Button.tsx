import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({
  children,
  className = '',
  disabled,
  isLoading = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? 'Chargement...' : children}
    </button>
  );
}
