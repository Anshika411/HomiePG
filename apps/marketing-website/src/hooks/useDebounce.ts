'use client';

import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay in milliseconds.
 * Useful for search inputs to avoid firing requests on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
