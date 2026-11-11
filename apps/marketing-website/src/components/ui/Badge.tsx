import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-body font-medium rounded-full px-2.5 py-0.5 text-xs leading-none transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg-muted text-text-muted',
        blue: 'bg-brand-blue-light text-brand-blue',
        green: 'bg-brand-green-light text-brand-green-dark',
        purple: 'bg-brand-purple-light text-brand-purple-dark',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-600',
        dark: 'bg-text-dark text-white',
        outline: 'border border-border text-text-muted bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean;
  };

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'green' ? 'bg-brand-green' :
            variant === 'blue' ? 'bg-brand-blue' :
            variant === 'danger' ? 'bg-red-500' :
            'bg-current'
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
