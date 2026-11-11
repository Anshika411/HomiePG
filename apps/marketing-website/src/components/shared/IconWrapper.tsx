import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type IconWrapperProps = {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'blue' | 'green' | 'purple' | 'muted' | 'white';
  className?: string;
};

const sizeMap = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-xl',
  xl: 'w-16 h-16 rounded-2xl',
};

const variantMap = {
  blue: 'bg-brand-blue-light text-brand-blue',
  green: 'bg-brand-green-light text-brand-green-dark',
  purple: 'bg-brand-purple-light text-brand-purple-dark',
  muted: 'bg-bg-muted text-text-muted',
  white: 'bg-white text-brand-blue shadow-card',
};

export function IconWrapper({ children, size = 'md', variant = 'blue', className }: IconWrapperProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
