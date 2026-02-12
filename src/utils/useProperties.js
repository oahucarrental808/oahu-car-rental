import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadProperties } from './properties';

/**
 * React hook to load and use properties using React Query
 * Returns [properties, loading, error]
 */
export function useProperties() {
  const { data: properties, isLoading: loading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: loadProperties,
    staleTime: 10 * 60 * 1000, // 10 minutes - properties don't change often
  });

  return [properties || null, loading, error || null];
}

/**
 * React hook to get a specific property value using derived state
 * Returns [value, loading, error]
 */
export function useProperty(path, defaultValue = '') {
  const [properties, loading, error] = useProperties();

  // Use useMemo to derive the value from properties
  const value = useMemo(() => {
    if (!properties) return defaultValue;
    
    const keys = path.split('.');
    let val = properties;
    
    for (const key of keys) {
      if (val && typeof val === 'object' && key in val) {
        val = val[key];
      } else {
        return defaultValue;
      }
    }
    
    return val || defaultValue;
  }, [properties, path, defaultValue]);

  return [value, loading, error];
}
