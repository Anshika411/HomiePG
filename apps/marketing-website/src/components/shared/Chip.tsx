import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function Chip({ children, active, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium',
        'border transition-all duration-DEFAULT focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
        active
          ? 'bg-brand-blue text-white border-brand-blue shadow-glow'
          : 'bg-white text-text-muted border-border hover:border-brand-blue hover:text-brand-blue',
        className
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
