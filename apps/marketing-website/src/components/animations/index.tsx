'use client';

import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── FadeUp Component ─────────────────────────────────────────────────
type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
} & Omit<HTMLMotionProps<'div'>, 'children'>;

export function FadeUp({ children, delay = 0, className, ...props }: FadeUpProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── FadeIn Component ─────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, className, ...props }: FadeUpProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerChildren Component ────────────────────────────────────────
type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function StaggerChildren({ children, className, delay = 0 }: StaggerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── HoverLift Component ──────────────────────────────────────────────
type HoverLiftProps = {
  children: ReactNode;
  className?: string;
  scale?: number;
};

export function HoverLift({ children, className, scale = 1.015 }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
