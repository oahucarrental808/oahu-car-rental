import { useEffect, useState } from 'react';
import { loadProperties } from './properties';

/**
 * React hook to load and use properties
 * Returns [properties, loading, error]
 */
export function useProperties() {
  const [properties, setProperties] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProperties()
      .then(props => {
        setProperties(props);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return [properties, loading, error];
}

/**
 * React hook to get a specific property value
 * Returns [value, loading, error]
 */
export function useProperty(path, defaultValue = '') {
  const [properties, loading, error] = useProperties();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!properties) return;
    
    const keys = path.split('.');
    let val = properties;
    
    for (const key of keys) {
      if (val && typeof val === 'object' && key in val) {
        val = val[key];
      } else {
        setValue(defaultValue);
        return;
      }
    }
    
    setValue(val || defaultValue);
  }, [properties, path, defaultValue]);

  return [value, loading, error];
}
