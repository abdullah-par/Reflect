import { useState, useEffect } from 'react';

export type FontStyle = 'editorial' | 'typewriter' | 'sans';

export interface AppSettings {
  fontStyle: FontStyle;
  enableObserverNotes: boolean;
  enableMemoryEcho: boolean;
  enablePatterns: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  fontStyle: 'editorial',
  enableObserverNotes: true,
  enableMemoryEcho: true,
  enablePatterns: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('reflect_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('reflect_settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-font', settings.fontStyle);
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
