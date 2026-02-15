export type RGB = { readonly r: number; readonly g: number; readonly b: number }
export type HSL = { readonly h: number; readonly s: number; readonly l: number }

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === rn) {
    h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  } else if (max === gn) {
    h = ((bn - rn) / d + 2) / 6
  } else {
    h = ((rn - gn) / d + 4) / 6
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100
  const ln = l / 100

  if (sn === 0) {
    const v = Math.round(ln * 255)
    return { r: v, g: v, b: v }
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    const tn = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (tn < 1 / 6) return p + (q - p) * 6 * tn
    if (tn < 1 / 2) return q
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6
    return p
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const hn = h / 360

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  }
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const srgb = c / 255
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export function getContrastRatio(fg: string, bg: string): number {
  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
  const l1 = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b)
  const l2 = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WcagResult = {
  readonly ratio: number
  readonly aa: boolean
  readonly aaa: boolean
  readonly aaLarge: boolean
  readonly aaaLarge: boolean
}

export function checkWcag(fg: string, bg: string): WcagResult {
  const ratio = getContrastRatio(fg, bg)
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  }
}

type TailwindEntry = {
  readonly name: string
  readonly hex: string
}

const TAILWIND_COLORS: readonly TailwindEntry[] = [
  { name: 'slate-50', hex: '#f8fafc' },
  { name: 'slate-100', hex: '#f1f5f9' },
  { name: 'slate-200', hex: '#e2e8f0' },
  { name: 'slate-300', hex: '#cbd5e1' },
  { name: 'slate-400', hex: '#94a3b8' },
  { name: 'slate-500', hex: '#64748b' },
  { name: 'slate-600', hex: '#475569' },
  { name: 'slate-700', hex: '#334155' },
  { name: 'slate-800', hex: '#1e293b' },
  { name: 'slate-900', hex: '#0f172a' },
  { name: 'slate-950', hex: '#020617' },
  { name: 'gray-50', hex: '#f9fafb' },
  { name: 'gray-100', hex: '#f3f4f6' },
  { name: 'gray-200', hex: '#e5e7eb' },
  { name: 'gray-300', hex: '#d1d5db' },
  { name: 'gray-400', hex: '#9ca3af' },
  { name: 'gray-500', hex: '#6b7280' },
  { name: 'gray-600', hex: '#4b5563' },
  { name: 'gray-700', hex: '#374151' },
  { name: 'gray-800', hex: '#1f2937' },
  { name: 'gray-900', hex: '#111827' },
  { name: 'gray-950', hex: '#030712' },
  { name: 'zinc-50', hex: '#fafafa' },
  { name: 'zinc-100', hex: '#f4f4f5' },
  { name: 'zinc-200', hex: '#e4e4e7' },
  { name: 'zinc-300', hex: '#d4d4d8' },
  { name: 'zinc-400', hex: '#a1a1aa' },
  { name: 'zinc-500', hex: '#71717a' },
  { name: 'zinc-600', hex: '#52525b' },
  { name: 'zinc-700', hex: '#3f3f46' },
  { name: 'zinc-800', hex: '#27272a' },
  { name: 'zinc-900', hex: '#18181b' },
  { name: 'zinc-950', hex: '#09090b' },
  { name: 'red-50', hex: '#fef2f2' },
  { name: 'red-100', hex: '#fee2e2' },
  { name: 'red-200', hex: '#fecaca' },
  { name: 'red-300', hex: '#fca5a5' },
  { name: 'red-400', hex: '#f87171' },
  { name: 'red-500', hex: '#ef4444' },
  { name: 'red-600', hex: '#dc2626' },
  { name: 'red-700', hex: '#b91c1c' },
  { name: 'red-800', hex: '#991b1b' },
  { name: 'red-900', hex: '#7f1d1d' },
  { name: 'red-950', hex: '#450a0a' },
  { name: 'orange-50', hex: '#fff7ed' },
  { name: 'orange-100', hex: '#ffedd5' },
  { name: 'orange-200', hex: '#fed7aa' },
  { name: 'orange-300', hex: '#fdba74' },
  { name: 'orange-400', hex: '#fb923c' },
  { name: 'orange-500', hex: '#f97316' },
  { name: 'orange-600', hex: '#ea580c' },
  { name: 'orange-700', hex: '#c2410c' },
  { name: 'orange-800', hex: '#9a3412' },
  { name: 'orange-900', hex: '#7c2d12' },
  { name: 'orange-950', hex: '#431407' },
  { name: 'amber-50', hex: '#fffbeb' },
  { name: 'amber-100', hex: '#fef3c7' },
  { name: 'amber-200', hex: '#fde68a' },
  { name: 'amber-300', hex: '#fcd34d' },
  { name: 'amber-400', hex: '#fbbf24' },
  { name: 'amber-500', hex: '#f59e0b' },
  { name: 'amber-600', hex: '#d97706' },
  { name: 'amber-700', hex: '#b45309' },
  { name: 'amber-800', hex: '#92400e' },
  { name: 'amber-900', hex: '#78350f' },
  { name: 'amber-950', hex: '#451a03' },
  { name: 'yellow-50', hex: '#fefce8' },
  { name: 'yellow-100', hex: '#fef9c3' },
  { name: 'yellow-200', hex: '#fef08a' },
  { name: 'yellow-300', hex: '#fde047' },
  { name: 'yellow-400', hex: '#facc15' },
  { name: 'yellow-500', hex: '#eab308' },
  { name: 'yellow-600', hex: '#ca8a04' },
  { name: 'yellow-700', hex: '#a16207' },
  { name: 'yellow-800', hex: '#854d0e' },
  { name: 'yellow-900', hex: '#713f12' },
  { name: 'yellow-950', hex: '#422006' },
  { name: 'lime-50', hex: '#f7fee7' },
  { name: 'lime-100', hex: '#ecfccb' },
  { name: 'lime-200', hex: '#d9f99d' },
  { name: 'lime-300', hex: '#bef264' },
  { name: 'lime-400', hex: '#a3e635' },
  { name: 'lime-500', hex: '#84cc16' },
  { name: 'lime-600', hex: '#65a30d' },
  { name: 'lime-700', hex: '#4d7c0f' },
  { name: 'lime-800', hex: '#3f6212' },
  { name: 'lime-900', hex: '#365314' },
  { name: 'lime-950', hex: '#1a2e05' },
  { name: 'green-50', hex: '#f0fdf4' },
  { name: 'green-100', hex: '#dcfce7' },
  { name: 'green-200', hex: '#bbf7d0' },
  { name: 'green-300', hex: '#86efac' },
  { name: 'green-400', hex: '#4ade80' },
  { name: 'green-500', hex: '#22c55e' },
  { name: 'green-600', hex: '#16a34a' },
  { name: 'green-700', hex: '#15803d' },
  { name: 'green-800', hex: '#166534' },
  { name: 'green-900', hex: '#14532d' },
  { name: 'green-950', hex: '#052e16' },
  { name: 'emerald-50', hex: '#ecfdf5' },
  { name: 'emerald-100', hex: '#d1fae5' },
  { name: 'emerald-200', hex: '#a7f3d0' },
  { name: 'emerald-300', hex: '#6ee7b7' },
  { name: 'emerald-400', hex: '#34d399' },
  { name: 'emerald-500', hex: '#10b981' },
  { name: 'emerald-600', hex: '#059669' },
  { name: 'emerald-700', hex: '#047857' },
  { name: 'emerald-800', hex: '#065f46' },
  { name: 'emerald-900', hex: '#064e3b' },
  { name: 'emerald-950', hex: '#022c22' },
  { name: 'teal-50', hex: '#f0fdfa' },
  { name: 'teal-100', hex: '#ccfbf1' },
  { name: 'teal-200', hex: '#99f6e4' },
  { name: 'teal-300', hex: '#5eead4' },
  { name: 'teal-400', hex: '#2dd4bf' },
  { name: 'teal-500', hex: '#14b8a6' },
  { name: 'teal-600', hex: '#0d9488' },
  { name: 'teal-700', hex: '#0f766e' },
  { name: 'teal-800', hex: '#115e59' },
  { name: 'teal-900', hex: '#134e4a' },
  { name: 'teal-950', hex: '#042f2e' },
  { name: 'cyan-50', hex: '#ecfeff' },
  { name: 'cyan-100', hex: '#cffafe' },
  { name: 'cyan-200', hex: '#a5f3fc' },
  { name: 'cyan-300', hex: '#67e8f9' },
  { name: 'cyan-400', hex: '#22d3ee' },
  { name: 'cyan-500', hex: '#06b6d4' },
  { name: 'cyan-600', hex: '#0891b2' },
  { name: 'cyan-700', hex: '#0e7490' },
  { name: 'cyan-800', hex: '#155e75' },
  { name: 'cyan-900', hex: '#164e63' },
  { name: 'cyan-950', hex: '#083344' },
  { name: 'sky-50', hex: '#f0f9ff' },
  { name: 'sky-100', hex: '#e0f2fe' },
  { name: 'sky-200', hex: '#bae6fd' },
  { name: 'sky-300', hex: '#7dd3fc' },
  { name: 'sky-400', hex: '#38bdf8' },
  { name: 'sky-500', hex: '#0ea5e9' },
  { name: 'sky-600', hex: '#0284c7' },
  { name: 'sky-700', hex: '#0369a1' },
  { name: 'sky-800', hex: '#075985' },
  { name: 'sky-900', hex: '#0c4a6e' },
  { name: 'sky-950', hex: '#082f49' },
  { name: 'blue-50', hex: '#eff6ff' },
  { name: 'blue-100', hex: '#dbeafe' },
  { name: 'blue-200', hex: '#bfdbfe' },
  { name: 'blue-300', hex: '#93c5fd' },
  { name: 'blue-400', hex: '#60a5fa' },
  { name: 'blue-500', hex: '#3b82f6' },
  { name: 'blue-600', hex: '#2563eb' },
  { name: 'blue-700', hex: '#1d4ed8' },
  { name: 'blue-800', hex: '#1e40af' },
  { name: 'blue-900', hex: '#1e3a8a' },
  { name: 'blue-950', hex: '#172554' },
  { name: 'indigo-50', hex: '#eef2ff' },
  { name: 'indigo-100', hex: '#e0e7ff' },
  { name: 'indigo-200', hex: '#c7d2fe' },
  { name: 'indigo-300', hex: '#a5b4fc' },
  { name: 'indigo-400', hex: '#818cf8' },
  { name: 'indigo-500', hex: '#6366f1' },
  { name: 'indigo-600', hex: '#4f46e5' },
  { name: 'indigo-700', hex: '#4338ca' },
  { name: 'indigo-800', hex: '#3730a3' },
  { name: 'indigo-900', hex: '#312e81' },
  { name: 'indigo-950', hex: '#1e1b4e' },
  { name: 'violet-50', hex: '#f5f3ff' },
  { name: 'violet-100', hex: '#ede9fe' },
  { name: 'violet-200', hex: '#ddd6fe' },
  { name: 'violet-300', hex: '#c4b5fd' },
  { name: 'violet-400', hex: '#a78bfa' },
  { name: 'violet-500', hex: '#8b5cf6' },
  { name: 'violet-600', hex: '#7c3aed' },
  { name: 'violet-700', hex: '#6d28d9' },
  { name: 'violet-800', hex: '#5b21b6' },
  { name: 'violet-900', hex: '#4c1d95' },
  { name: 'violet-950', hex: '#2e1065' },
  { name: 'purple-50', hex: '#faf5ff' },
  { name: 'purple-100', hex: '#f3e8ff' },
  { name: 'purple-200', hex: '#e9d5ff' },
  { name: 'purple-300', hex: '#d8b4fe' },
  { name: 'purple-400', hex: '#c084fc' },
  { name: 'purple-500', hex: '#a855f7' },
  { name: 'purple-600', hex: '#9333ea' },
  { name: 'purple-700', hex: '#7e22ce' },
  { name: 'purple-800', hex: '#6b21a8' },
  { name: 'purple-900', hex: '#581c87' },
  { name: 'purple-950', hex: '#3b0764' },
  { name: 'fuchsia-50', hex: '#fdf4ff' },
  { name: 'fuchsia-100', hex: '#fae8ff' },
  { name: 'fuchsia-200', hex: '#f5d0fe' },
  { name: 'fuchsia-300', hex: '#f0abfc' },
  { name: 'fuchsia-400', hex: '#e879f9' },
  { name: 'fuchsia-500', hex: '#d946ef' },
  { name: 'fuchsia-600', hex: '#c026d3' },
  { name: 'fuchsia-700', hex: '#a21caf' },
  { name: 'fuchsia-800', hex: '#86198f' },
  { name: 'fuchsia-900', hex: '#701a75' },
  { name: 'fuchsia-950', hex: '#4a044e' },
  { name: 'pink-50', hex: '#fdf2f8' },
  { name: 'pink-100', hex: '#fce7f3' },
  { name: 'pink-200', hex: '#fbcfe8' },
  { name: 'pink-300', hex: '#f9a8d4' },
  { name: 'pink-400', hex: '#f472b6' },
  { name: 'pink-500', hex: '#ec4899' },
  { name: 'pink-600', hex: '#db2777' },
  { name: 'pink-700', hex: '#be185d' },
  { name: 'pink-800', hex: '#9d174d' },
  { name: 'pink-900', hex: '#831843' },
  { name: 'pink-950', hex: '#500724' },
  { name: 'rose-50', hex: '#fff1f2' },
  { name: 'rose-100', hex: '#ffe4e6' },
  { name: 'rose-200', hex: '#fecdd3' },
  { name: 'rose-300', hex: '#fda4af' },
  { name: 'rose-400', hex: '#fb7185' },
  { name: 'rose-500', hex: '#f43f5e' },
  { name: 'rose-600', hex: '#e11d48' },
  { name: 'rose-700', hex: '#be123c' },
  { name: 'rose-800', hex: '#9f1239' },
  { name: 'rose-900', hex: '#881337' },
  { name: 'rose-950', hex: '#4c0519' },
]

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
  )
}

export function findClosestTailwindColor(hex: string): string {
  const target = hexToRgb(hex)
  let closest = TAILWIND_COLORS[0].name
  let minDist = Infinity

  for (const entry of TAILWIND_COLORS) {
    const entryRgb = hexToRgb(entry.hex)
    const dist = colorDistance(target, entryRgb)
    if (dist < minDist) {
      minDist = dist
      closest = entry.name
    }
  }

  return closest
}

export type TailwindPaletteGroup = {
  readonly name: string
  readonly shades: readonly { readonly shade: string; readonly hex: string }[]
}

export function getTailwindPalette(): readonly TailwindPaletteGroup[] {
  const groups: Map<string, { shade: string; hex: string }[]> = new Map()

  for (const entry of TAILWIND_COLORS) {
    const dashIdx = entry.name.lastIndexOf('-')
    const groupName = entry.name.slice(0, dashIdx)
    const shade = entry.name.slice(dashIdx + 1)
    const existing = groups.get(groupName) ?? []
    groups.set(groupName, [...existing, { shade, hex: entry.hex }])
  }

  return Array.from(groups.entries()).map(([name, shades]) => ({ name, shades }))
}

export function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
}

export function normalizeHex(hex: string): string {
  const clean = hex.replace(/^#/, '')
  if (clean.length === 3) {
    return '#' + clean.split('').map((c) => c + c).join('')
  }
  return '#' + clean
}
