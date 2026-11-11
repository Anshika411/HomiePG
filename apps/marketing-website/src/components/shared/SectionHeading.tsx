import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  titleHighlight?: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { title: 'text-h3', subtitle: 'text-body max-w-xl' },
  md: { title: 'text-h2', subtitle: 'text-body-lg max-w-2xl' },
  lg: { title: 'text-h1', subtitle: 'text-body-lg max-w-2xl' },
};

const alignMap = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export function SectionHeading({
  eyebrow,
  title,
  titleHighlight,
  subtitle,
  align = 'center',
  className,
  titleClassName,
  subtitleClassName,
  size = 'md',
}: SectionHeadingProps) {
  const { title: titleSize, subtitle: subtitleSize } = sizeMap[size];

  return (
    <div className={cn('flex flex-col gap-3', alignMap[align], className)}>
      {eyebrow && (
        <span className="text-xs-label text-brand-blue tracking-widest uppercase font-semibold">
          {eyebrow}
        </span>
      )}
      <h2 className={cn(titleSize, 'font-heading font-bold text-text-dark', titleClassName)}>
        {title}
        {titleHighlight && (
          <span className="text-brand-blue"> {titleHighlight}</span>
        )}
      </h2>
      {subtitle && (
        <p className={cn(subtitleSize, 'text-text-muted', alignMap[align], subtitleClassName)}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
