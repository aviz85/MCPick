import { useState, useMemo } from 'react';
import { maskSensitiveValue } from '../utils/mask';

/**
 * Hook for masking sensitive values
 * @param value - The original value to mask
 * @returns An object with the masked value, mask state, and toggle function
 */
export function useMask(value: string) {
  const [masked, setMasked] = useState(true);
  
  const maskedValue = useMemo(
    () => masked ? maskSensitiveValue(value) : value,
    [masked, value]
  );
  
  const toggle = () => setMasked(!masked);
  
  return { maskedValue, masked, toggle };
} 