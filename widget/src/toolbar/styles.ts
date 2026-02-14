/**
 * Widget styles as TypeScript constants.
 * All styles are inline or injected into shadow DOM,
 * so they are fully isolated from the host page.
 */

export const COLORS = {
  fabBg: '#3b82f6',
  fabBgHover: '#2563eb',
  fabBgActive: '#1d4ed8',
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
export const PANEL_WIDTH = 300
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
  boxShadow: `0 4px 12px ${COLORS.shadow}`,
  transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}

export const panelStyle: Record<string, string | number> = {
  position: 'fixed',
  top: '0',
  right: '0',
  width: `${PANEL_WIDTH}px`,
  height: '100vh',
  backgroundColor: COLORS.panelBg,
  borderLeft: `1px solid ${COLORS.panelBorder}`,
  zIndex: 999998,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: COLORS.text,
  boxShadow: `-4px 0 20px ${COLORS.shadow}`,
}

export const panelHeaderStyle: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: COLORS.panelHeaderBg,
  borderBottom: `1px solid ${COLORS.panelBorder}`,
  flexShrink: '0',
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

export const toolListStyle: Record<string, string | number> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '12px',
  overflowY: 'auto',
  flex: '1',
}

export const toolBtnStyle: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: COLORS.toolBtnBg,
  color: COLORS.text,
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  textAlign: 'left',
  transition: 'background-color 0.12s ease',
  width: '100%',
}

export const toolIconStyle: Record<string, string | number> = {
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  flexShrink: '0',
}

export const toolContentStyle: Record<string, string | number> = {
  flex: '1',
  padding: '16px',
  overflowY: 'auto',
  fontSize: '13px',
  color: COLORS.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const panelSlideIn = 'translateX(0)' as const
export const panelSlideOut = `translateX(${PANEL_WIDTH}px)` as const
