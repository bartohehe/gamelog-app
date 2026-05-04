import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import type { ThemeName } from '../contexts/ThemeContext';

const THEME_DOTS: Record<ThemeName, string> = {
  neon: '#7c3aed',
  crimson: '#dc2626',
  ocean: '#0ea5e9',
};

const THEME_LABELS: Record<ThemeName, string> = {
  neon: 'Neon',
  crimson: 'Crimson',
  ocean: 'Ocean',
};

const NAV_ITEMS = [
  {
    id: 'discover',
    label: 'Odkryj',
    path: '/',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <path d="M9 1l2.2 5.5L17 9l-5.8 2.5L9 17l-2.2-5.5L1 9l5.8-2.5z" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Biblioteka',
    path: '/library',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <rect x="1" y="2" width="4" height="14" rx="1" />
        <rect x="7" y="2" width="4" height="14" rx="1" />
        <rect x="13" y="2" width="4" height="14" rx="1" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Szukaj',
    path: '/search',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="7.5" cy="7.5" r="5.5" />
        <line x1="12" y1="12" x2="16" y2="16" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profil',
    path: '/profile',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <circle cx="9" cy="6" r="3.5" />
        <path d="M2 17c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </svg>
    ),
  },
];

const STATUS_ITEMS = [
  { key: 'Planned',    label: 'Planowane',  colorKey: 'statusPlanned'    as const },
  { key: 'InProgress', label: 'W trakcie',  colorKey: 'statusInProgress' as const },
  { key: 'Completed',  label: 'Ukończone',  colorKey: 'statusCompleted'  as const },
  { key: 'Abandoned',  label: 'Porzucone',  colorKey: 'statusAbandoned'  as const },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { t, theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const initials = user?.username ? user.username[0].toUpperCase() : '?';

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 220 : 60,
        minWidth: expanded ? 220 : 60,
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
        background: t.sidebarBg,
        borderRight: `1px solid ${t.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        height: '100vh',
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          height: 68,
          display: 'flex',
          alignItems: 'center',
          padding: '0 13px',
          justifyContent: 'flex-start',
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: t.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            flexShrink: 0,
            boxShadow: `0 0 18px ${t.accentGlow}`,
          }}
        >
          G
        </div>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 17,
            fontWeight: 700,
            color: t.text,
            whiteSpace: 'nowrap',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.15s',
            pointerEvents: 'none',
          }}
        >
          Gamelogg
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: expanded ? '10px 18px' : '10px 0',
                justifyContent: expanded ? 'flex-start' : 'center',
                background: active ? `${t.accent}20` : 'transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: active ? `3px solid ${t.accent}` : '3px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
                color: active ? t.accentLight : t.textMuted,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                marginBottom: 2,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = `${t.accent}10`;
                  (e.currentTarget as HTMLButtonElement).style.color = t.text;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = t.textMuted;
                }
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {item.svg}
              </span>
              <span
                style={{
                  whiteSpace: 'nowrap',
                  opacity: expanded ? 1 : 0,
                  transition: 'opacity 0.12s',
                  maxWidth: expanded ? 200 : 0,
                  overflow: 'hidden',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Status counts — only when authenticated + expanded */}
        {expanded && isAuthenticated && (
          <div style={{ marginTop: 20, padding: '0 14px' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: t.textFaint,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Statusy
            </div>
            {STATUS_ITEMS.map(s => (
              <div
                key={s.key}
                onClick={() => navigate('/library')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  borderRadius: 6,
                  marginBottom: 1,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: t[s.colorKey],
                    }}
                  />
                  <span style={{ fontSize: 12, color: t.textMuted }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Theme picker ── */}
      <div
        style={{
          padding: expanded ? '10px 14px' : '10px 0',
          borderTop: `1px solid ${t.border}`,
          flexShrink: 0,
        }}
      >
        {expanded ? (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: t.textFaint,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 7,
              }}
            >
              Motyw
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {(Object.keys(THEMES) as ThemeName[]).map(tn => (
                <button
                  key={tn}
                  onClick={() => setTheme(tn)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 7px',
                    border: `1px solid ${theme === tn ? THEME_DOTS[tn] : 'transparent'}`,
                    borderRadius: 7,
                    cursor: 'pointer',
                    background: theme === tn ? `${THEME_DOTS[tn]}20` : t.bgElevated,
                    color: theme === tn ? THEME_DOTS[tn] : t.textMuted,
                    fontSize: 11,
                    fontWeight: theme === tn ? 600 : 400,
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: THEME_DOTS[tn],
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  {THEME_LABELS[tn]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {(Object.keys(THEMES) as ThemeName[]).map(tn => (
              <button
                key={tn}
                onClick={() => setTheme(tn)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: `2px solid ${theme === tn ? THEME_DOTS[tn] : 'transparent'}`,
                  background: THEME_DOTS[tn],
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s',
                  outline: theme === tn ? `2px solid ${THEME_DOTS[tn]}40` : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── User ── */}
      <div
        onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
        style={{
          padding: expanded ? '12px 14px' : '12px 0',
          borderTop: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: 10,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: t.accentGlow,
            border: `2px solid ${t.accent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: t.accent,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        {expanded && (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: t.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.username ?? 'Gość'}
            </div>
            {user && (
              <div style={{ fontSize: 11, color: t.textFaint }}>
                @{user.username.toLowerCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
