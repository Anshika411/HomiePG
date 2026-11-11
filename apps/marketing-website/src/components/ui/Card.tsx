import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section' | 'li';
} & React.HTMLAttributes<HTMLDivElement>;

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 md:p-8',
};

export function Card({
  children,
  className,
  hover = false,
  padding = 'md',
  as: Tag = 'div',
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-border bg-white shadow-card',
        paddingMap[padding],
        hover && [
          'transition-all duration-DEFAULT cursor-pointer',
          'hover:shadow-card-hover hover:-translate-y-1',
        ],
        className
      )}
      {...(props as any)}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex-1', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border-light flex items-center justify-between', className)}>
      {children}
    </div>
  );
}
