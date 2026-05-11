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
    statusWishlist: '#ec4899',
    statusOnHold: '#f59e0b',
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
    statusWishlist: '#f472b6',
    statusOnHold: '#fbbf24',
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
    statusWishlist: '#e879f9',
    statusOnHold: '#fb923c',
    scoreGradient: 'linear-gradient(135deg,#0ea5e9,#d4af37)',
  },
  editorial: {
    bg: '#0e0c0a',
    bgCard: '#17130f',
    bgElevated: '#201a14',
    bgHover: '#28211a',
    border: 'rgba(217,119,6,0.18)',
    borderHover: 'rgba(217,119,6,0.45)',
    accent: '#d97706',
    accentLight: '#f59e0b',
    accentGlow: 'rgba(217,119,6,0.3)',
    text: '#faf5eb',
    textMuted: '#a89060',
    textFaint: '#5a4a2a',
    sidebarBg: '#0b0905',
    tagBg: 'rgba(217,119,6,0.12)',
    tagText: '#f59e0b',
    inputBg: '#17130f',
    inputBorder: 'rgba(217,119,6,0.25)',
    statusPlanned: '#3B82F6',
    statusInProgress: '#d97706',
    statusCompleted: '#22c55e',
    statusAbandoned: '#6B7280',
    statusWishlist: '#ec4899',
    statusOnHold: '#fb923c',
    scoreGradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
  },
  terminal: {
    bg: '#020a04',
    bgCard: '#051209',
    bgElevated: '#081a0d',
    bgHover: '#0c2212',
    border: 'rgba(34,197,94,0.15)',
    borderHover: 'rgba(34,197,94,0.45)',
    accent: '#22c55e',
    accentLight: '#4ade80',
    accentGlow: 'rgba(34,197,94,0.2)',
    text: '#ecfdf5',
    textMuted: '#5a9970',
    textFaint: '#1a4a28',
    sidebarBg: '#010703',
    tagBg: 'rgba(34,197,94,0.1)',
    tagText: '#4ade80',
    inputBg: '#051209',
    inputBorder: 'rgba(34,197,94,0.2)',
    statusPlanned: '#38bdf8',
    statusInProgress: '#22c55e',
    statusCompleted: '#a3e635',
    statusAbandoned: '#64748b',
    statusWishlist: '#ec4899',
    statusOnHold: '#f59e0b',
    scoreGradient: 'linear-gradient(135deg,#22c55e,#a3e635)',
  },
  cosmic: {
    bg: '#07030f',
    bgCard: '#0e0618',
    bgElevated: '#150a24',
    bgHover: '#1c102e',
    border: 'rgba(232,121,249,0.15)',
    borderHover: 'rgba(232,121,249,0.45)',
    accent: '#e879f9',
    accentLight: '#f0abfc',
    accentGlow: 'rgba(232,121,249,0.25)',
    text: '#fdf4ff',
    textMuted: '#a07ab0',
    textFaint: '#4a2a5a',
    sidebarBg: '#04010b',
    tagBg: 'rgba(232,121,249,0.1)',
    tagText: '#f0abfc',
    inputBg: '#0e0618',
    inputBorder: 'rgba(232,121,249,0.2)',
    statusPlanned: '#818cf8',
    statusInProgress: '#e879f9',
    statusCompleted: '#34d399',
    statusAbandoned: '#64748b',
    statusWishlist: '#f472b6',
    statusOnHold: '#fb923c',
    scoreGradient: 'linear-gradient(135deg,#e879f9,#818cf8)',
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
  statusWishlist: string; statusOnHold: string;
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
