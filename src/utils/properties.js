// Runtime properties loader
let propertiesCache = null;
let loadPromise = null;

/**
 * Loads properties from /properties.json at runtime
 * Caches the result for subsequent calls
 */
export async function loadProperties() {
  if (propertiesCache) {
    return propertiesCache;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = fetch('/properties.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load properties: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      propertiesCache = data;
      return data;
    })
    .catch(err => {
      console.error('Error loading properties:', err);
      loadPromise = null;
      // Return empty object as fallback
      return {};
    });

  return loadPromise;
}

/**
 * Gets a property value by path (e.g., "admin.titles.pickupInstructions")
 * Returns defaultValue if not found
 */
export async function getProperty(path, defaultValue = '') {
  const props = await loadProperties();
  const keys = path.split('.');
  let value = props;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value || defaultValue;
}

/**
 * Synchronous getter - only works after properties are loaded
 * Use this in components that can handle async loading
 */
export function getPropertySync(path, defaultValue = '') {
  if (!propertiesCache) {
    console.warn('Properties not loaded yet. Use getProperty() for async loading.');
    return defaultValue;
  }
  
  const keys = path.split('.');
  let value = propertiesCache;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value || defaultValue;
}

// Convenience getters (async)
export const getDefaultPickupAddress = () => getProperty('addresses.defaultPickup', '');
export const getDefaultDropoffAddress = () => getProperty('addresses.defaultDropoff', '');
export const getTrackerNotice = () => getProperty('notices.trackerNotice', '');
export const getPlaceholder = (key) => getProperty(`placeholders.${key}`, '');
export const getLabel = (key) => getProperty(`labels.${key}`, '');
export const getButtonText = (key) => getProperty(`buttons.${key}`, '');
export const getTitle = (key) => getProperty(`titles.${key}`, '');

// Synchronous convenience getters (use after properties are loaded)
export const getDefaultPickupAddressSync = () => getPropertySync('addresses.defaultPickup', '');
export const getDefaultDropoffAddressSync = () => getPropertySync('addresses.defaultDropoff', '');
export const getTrackerNoticeSync = () => getPropertySync('notices.trackerNotice', '');
export const getPlaceholderSync = (key) => getPropertySync(`placeholders.${key}`, '');
export const getLabelSync = (key) => getPropertySync(`labels.${key}`, '');
export const getButtonTextSync = (key) => getPropertySync(`buttons.${key}`, '');
export const getTitleSync = (key) => getPropertySync(`titles.${key}`, '');

// Export the properties object directly (after loading)
export default propertiesCache;
