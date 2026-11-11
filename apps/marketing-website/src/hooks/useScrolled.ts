'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true when the page has been scrolled past the given threshold.
 * Useful for showing a solid navbar background after scrolling.
 */
export function useScrolled(threshold = 20): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll(); // check immediately
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
