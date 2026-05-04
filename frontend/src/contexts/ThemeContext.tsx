import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export const THEMES = {
  neon: {
    bg: '#080810',
    bgCard: '#0f0f1a',
    bgElevated: '#14142a',
    bgHover: '#1a1a2e',
    border: 'rgba(124,58,237,0.2)',
    borderHover: 'rgba(124,58,237,0.5)',
    accent: '#7c3aed',
    accentLight: '#a855f7',
    accentGlow: 'rgba(124,58,237,0.3)',
    text: '#f0eeff',
    textMuted: '#8b8aaf',
    textFaint: '#4a4a6a',
    sidebarBg: '#0a0a18',
    tagBg: 'rgba(124,58,237,0.15)',
    tagText: '#c084fc',
    inputBg: '#0f0f1a',
    inputBorder: 'rgba(124,58,237,0.3)',
    statusPlanned: '#3B82F6',
    statusInProgress: '#7c3aed',
    statusCompleted: '#22c55e',
    statusAbandoned: '#6B7280',
    scoreGradient: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  },
  crimson: {
    bg: '#0a0505',
    bgCard: '#130a0a',
    bgElevated: '#1c0e0e',
    bgHover: '#231212',
    border: 'rgba(220,38,38,0.18)',
    borderHover: 'rgba(220,38,38,0.5)',
    accent: '#dc2626',
    accentLight: '#f87171',
    accentGlow: 'rgba(220,38,38,0.25)',
    text: '#f5f0f0',
    textMuted: '#9a8a8a',
    textFaint: '#4a3535',
    sidebarBg: '#080303',
    tagBg: 'rgba(220,38,38,0.12)',
    tagText: '#f87171',
    inputBg: '#130a0a',
    inputBorder: 'rgba(220,38,38,0.25)',
    statusPlanned: '#3B82F6',
    statusInProgress: '#f87171',
    statusCompleted: '#4ade80',
    statusAbandoned: '#64748b',
    scoreGradient: 'linear-gradient(135deg,#dc2626,#f87171)',
  },
  ocean: {
    bg: '#020b18',
    bgCard: '#061423',
    bgElevated: '#0a1e32',
    bgHover: '#0e2740',
    border: 'rgba(14,165,233,0.15)',
    borderHover: 'rgba(14,165,233,0.45)',
    accent: '#0ea5e9',
    accentLight: '#38bdf8',
    accentGlow: 'rgba(14,165,233,0.25)',
    text: '#e8f4fd',
    textMuted: '#7ea8c4',
    textFaint: '#2d5070',
    sidebarBg: '#010810',
    tagBg: 'rgba(14,165,233,0.12)',
    tagText: '#38bdf8',
    inputBg: '#061423',
    inputBorder: 'rgba(14,165,233,0.22)',
    statusPlanned: '#38bdf8',
    statusInProgress: '#0ea5e9',
    statusCompleted: '#34d399',
    statusAbandoned: '#64748b',
    scoreGradient: 'linear-gradient(135deg,#0ea5e9,#d4af37)',
  },
} as const;

export type ThemeName = keyof typeof THEMES;
export type Theme = {
  bg: string; bgCard: string; bgElevated: string; bgHover: string;
  border: string; borderHover: string;
  accent: string; accentLight: string; accentGlow: string;
  text: string; textMuted: string; textFaint: string;
  sidebarBg: string; tagBg: string; tagText: string;
  inputBg: string; inputBorder: string;
  statusPlanned: string; statusInProgress: string; statusCompleted: string; statusAbandoned: string;
  scoreGradient: string;
};

interface ThemeContextType {
  theme: ThemeName;
  t: Theme;
  setTheme: (t: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'neon',
  t: THEMES.neon,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem('gamelog_theme');
    if (stored && stored in THEMES) return stored as ThemeName;
    return 'neon';
  });

  const setTheme = (t: ThemeName) => {
    localStorage.setItem('gamelog_theme', t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, t: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
