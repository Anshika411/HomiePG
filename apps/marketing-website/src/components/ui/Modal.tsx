'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'md',
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-text-dark/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />

        {/* Panel */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2',
            'w-full bg-white rounded-3xl shadow-card-hover border border-border',
            'data-[state=open]:animate-fade-up',
            'focus:outline-none',
            sizeMap[size],
            className
          )}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {/* Header */}
          {(title || description) && (
            <div className="px-6 pt-6 pb-4 border-b border-border-light">
              {title && (
                <DialogPrimitive.Title className="text-h4 font-heading font-semibold text-text-dark">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description
                  id="modal-description"
                  className="mt-1 text-caption text-text-muted"
                >
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5">{children}</div>

          {/* Close button */}
          <DialogPrimitive.Close
            className={cn(
              'absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center',
              'text-text-muted hover:text-text-dark hover:bg-bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue'
            )}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" aria-hidden />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Re-export Trigger for convenience */
export const ModalTrigger = DialogPrimitive.Trigger;
