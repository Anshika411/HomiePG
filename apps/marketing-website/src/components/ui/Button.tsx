import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-body font-semibold',
    'rounded-xl transition-all duration-DEFAULT focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 select-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-blue text-white shadow-glow',
          'hover:bg-brand-blue-dark hover:shadow-glow hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-none',
        ],
        green: [
          'bg-brand-green text-white shadow-glow-green',
          'hover:bg-brand-green-dark hover:-translate-y-0.5',
          'active:translate-y-0',
        ],
        outline: [
          'border-2 border-brand-blue text-brand-blue bg-transparent',
          'hover:bg-brand-blue-light hover:-translate-y-0.5',
        ],
        ghost: [
          'text-text-muted bg-transparent',
          'hover:bg-bg-muted hover:text-text-dark',
        ],
        white: [
          'bg-white text-brand-blue font-semibold shadow-card',
          'hover:shadow-card-hover hover:-translate-y-0.5',
        ],
        danger: [
          'bg-red-500 text-white',
          'hover:bg-red-600 hover:-translate-y-0.5',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-lg',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        xl: 'h-14 px-9 text-lg',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : leftIcon ? (
          <span aria-hidden>{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && <span aria-hidden>{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
