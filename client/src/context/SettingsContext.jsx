import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { OPERATORS } from '../utils/constants';

const STORAGE_KEY = 'bajarang.settings';
const DEFAULTS = { operator: '' };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Forget names that are no longer in the list (e.g. old labels).
    return { operator: OPERATORS.includes(saved.operator) ? saved.operator : DEFAULTS.operator };
  } catch {
    return DEFAULTS;
  }
}

const SettingsContext = createContext(null);

// Per-phone memory: the operator name picked last time in the product form.
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable: remember only for this session */
    }
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const value = useMemo(() => ({ ...settings, update }), [settings, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
