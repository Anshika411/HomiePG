'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

// ─── Tabs Root ────────────────────────────────────────────────────────
export const Tabs = TabsPrimitive.Root;

// ─── Tabs List ────────────────────────────────────────────────────────
export function TabsList({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-bg-muted rounded-xl',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
}

// ─── Tab Trigger ──────────────────────────────────────────────────────
export function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium',
        'text-text-muted transition-all duration-DEFAULT',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
        'data-[state=active]:bg-white data-[state=active]:text-text-dark data-[state=active]:shadow-card',
        'hover:text-text-dark',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

// ─── Tab Content ──────────────────────────────────────────────────────
export function TabsContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl',
        'data-[state=inactive]:hidden',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
