import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'article' | 'header' | 'footer' | 'nav';
  size?: 'sm' | 'md' | 'lg' | 'full';
};

const sizeMap = {
  sm: 'max-w-[1024px]',
  md: 'max-w-[960px]',
  lg: 'max-w-[1280px]',
  full: 'max-w-full',
};

export function Container({
  children,
  className,
  as: Tag = 'div',
  size = 'lg',
}: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeMap[size], className)}>
      {children}
    </Tag>
  );
}
