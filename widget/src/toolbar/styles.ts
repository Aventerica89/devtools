/**
 * Widget styles as TypeScript constants.
 * All styles are inline or injected into shadow DOM,
 * so they are fully isolated from the host page.
 */

export const COLORS = {
  fabBg: '#6366f1',
  fabBgHover: '#4f46e5',
  fabBgActive: '#4338ca',
  panelBg: '#0f172a',
  panelBorder: '#1e293b',
  panelHeaderBg: '#1e293b',
  toolBtnBg: '#1e293b',
  toolBtnBgHover: '#334155',
  toolBtnBgActive: '#3b82f6',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textBright: '#f8fafc',
  closeBtnHover: '#ef4444',
  shadow: 'rgba(0, 0, 0, 0.4)',
} as const

export const FAB_SIZE = 48
export const PANEL_WIDTH = 580
export const DRAG_THRESHOLD = 5

export const fabStyle: Record<string, string | number> = {
  position: 'fixed',
  width: `${FAB_SIZE}px`,
  height: `${FAB_SIZE}px`,
  borderRadius: '50%',
  backgroundColor: COLORS.fabBg,
  color: '#fff',
  border: 'none',
  cursor: 'grab',
  fontSize: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999999,
  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.5)',
  transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}

export const panelStyle: Record<string, string | number> = {
  position: 'fixed',
  width: `${PANEL_WIDTH}px`,
  backgroundColor: COLORS.panelBg,
  border: `1px solid ${COLORS.panelBorder}`,
  borderRadius: '12px',
  zIndex: 999998,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: COLORS.text,
  boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
  overflow: 'hidden',
}

export const panelHeaderStyle: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px 0',
  flexShrink: 0,
  cursor: 'grab',
  userSelect: 'none',
}

export const panelTitleStyle: Record<string, string | number> = {
  fontSize: '14px',
  fontWeight: '600',
  color: COLORS.textBright,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '220px',
}

export const closeBtnStyle: Record<string, string | number> = {
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: 'transparent',
  color: COLORS.textMuted,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  lineHeight: '1',
  flexShrink: '0',
}

export const toolContentStyle: Record<string, string | number> = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 12px',
  fontSize: '13px',
  color: COLORS.textMuted,
  display: 'block',
}

export const domainInfoStyle: Record<string, string | number> = {
  fontSize: 11,
  color: '#475569',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

export const domainDotStyle: Record<string, string | number> = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#4ade80',
  flexShrink: 0,
}

export const headerActionsStyle: Record<string, string | number> = {
  display: 'flex',
  gap: 4,
  alignItems: 'center',
}

export const iconBtnStyle: Record<string, string | number> = {
  background: 'none',
  border: 'none',
  color: '#475569',
  cursor: 'pointer',
  padding: 4,
  borderRadius: 4,
  fontSize: 12,
  lineHeight: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const copyClaudeBtnStyle: Record<string, string | number> = {
  background: '#1a2547',
  border: '1px solid #2d3b6e',
  color: '#a5b4fc',
  fontSize: 10,
  padding: '3px 8px',
  borderRadius: 4,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  lineHeight: '1.4',
  cursor: 'pointer',
}

export const tabBarStyle: Record<string, string | number> = {
  display: 'flex',
  borderBottom: `1px solid ${COLORS.panelBorder}`,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  flexShrink: 0,
  marginTop: 6,
}

// Base tab style (inactive)
export const tabStyle: Record<string, string | number> = {
  padding: '6px 10px',
  fontSize: 11,
  color: '#475569',
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
  userSelect: 'none',
  background: 'none',
  border: 'none',
  fontFamily: 'inherit',
}

// Additional styles for active tab (spread on top of tabStyle)
export const activeTabStyle: Record<string, string | number> = {
  color: '#a5b4fc',
  borderBottom: '2px solid #6366f1',
}

export const tabBadgeStyle: Record<string, string | number> = {
  background: '#ef4444',
  color: '#fff',
  borderRadius: 6,
  padding: '0 4px',
  fontSize: 9,
  fontWeight: '700',
  lineHeight: '14px',
}
