import { useState, useEffect } from 'react';

export type FontStyle = 
  | 'editorial' 
  | 'typewriter' 
  | 'sans' 
  | 'lora' 
  | 'playfair' 
  | 'baskerville' 
  | 'merriweather' 
  | 'source-serif';

export interface AppSettings {
  fontStyle: FontStyle;
  fontSize: number;
  lineHeight: number;
  enableObserverNotes: boolean;
  enableMemoryEcho: boolean;
  enablePatterns: boolean;
  typewriterMode: boolean;
  typewriterSound: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  fontStyle: 'editorial',
  fontSize: 17,
  lineHeight: 1.8,
  enableObserverNotes: true,
  enableMemoryEcho: true,
  enablePatterns: true,
  typewriterMode: false,
  typewriterSound: true,
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
    document.documentElement.style.setProperty('--reading-size', settings.fontSize + 'px');
    document.documentElement.style.setProperty('--reading-lh', String(settings.lineHeight));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
