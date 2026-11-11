import { cn } from '@/lib/utils';
import { Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-caption text-text-muted', className)}>
      <Link href="/" className="hover:text-brand-blue transition-colors" aria-label="Home">
        <Home className="h-3.5 w-3.5" aria-hidden />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-text-light" aria-hidden />
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-brand-blue transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={cn(i === items.length - 1 && 'text-text-dark font-medium')}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
