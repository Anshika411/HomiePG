import { cn } from '@/lib/utils';
import { SearchX, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReactNode } from 'react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({
  title = 'Nothing found',
  description = 'Try adjusting your search or filters.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-bg-muted flex items-center justify-center mb-4 text-text-muted">
        {icon ?? <SearchX className="w-6 h-6" />}
      </div>
      <h3 className="text-h4 text-text-dark mb-2">{title}</h3>
      <p className="text-caption text-text-muted max-w-sm">{description}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load the data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 text-red-500">
        <ServerCrash className="w-6 h-6" />
      </div>
      <h3 className="text-h4 text-text-dark mb-2">{title}</h3>
      <p className="text-caption text-text-muted max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
