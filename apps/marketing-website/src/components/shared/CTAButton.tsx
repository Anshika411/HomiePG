'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type CTAButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'blue' | 'green' | 'purple' | 'white';
  className?: string;
  showIcon?: boolean;
};

export function CTAButton({
  href,
  children,
  variant = 'blue',
  className,
  showIcon = true,
}: CTAButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-heading font-semibold rounded-xl text-base px-7 py-3.5 transition-all duration-DEFAULT select-none';

  const variantStyles = {
    blue: 'bg-brand-blue text-white shadow-glow hover:bg-brand-blue-dark hover:shadow-lg',
    green: 'bg-brand-green text-white shadow-glow-green hover:bg-brand-green-dark hover:shadow-lg',
    purple: 'bg-brand-purple text-white shadow-glow hover:bg-brand-purple-dark hover:shadow-lg',
    white: 'bg-white text-brand-blue shadow-card hover:shadow-card-hover hover:bg-bg-light',
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Link
        href={href}
        className={cn(baseStyles, variantStyles[variant], className)}
      >
        <span>{children}</span>
        {showIcon && (
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
}
