import { SectionWrapper } from './section-wrapper'

interface ColorSwatch {
  readonly name: string
  readonly className: string
  readonly hex: string
}

const PRIMARY_COLORS: readonly ColorSwatch[] = [
  { name: 'Primary (Blue 500)', className: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Blue 400', className: 'bg-blue-400', hex: '#60a5fa' },
  { name: 'Blue 600', className: 'bg-blue-600', hex: '#2563eb' },
  { name: 'Slate 950', className: 'bg-slate-950', hex: '#020617' },
  { name: 'Slate 900', className: 'bg-slate-900', hex: '#0f172a' },
  { name: 'Slate 800', className: 'bg-slate-800', hex: '#1e293b' },
  { name: 'Slate 700', className: 'bg-slate-700', hex: '#334155' },
  { name: 'Slate 400', className: 'bg-slate-400', hex: '#94a3b8' },
  { name: 'Slate 50', className: 'bg-slate-50', hex: '#f8fafc' },
]

const SEMANTIC_COLORS: readonly ColorSwatch[] = [
  { name: 'Success', className: 'bg-green-500', hex: '#22c55e' },
  { name: 'Warning', className: 'bg-amber-500', hex: '#f59e0b' },
  { name: 'Error', className: 'bg-red-500', hex: '#ef4444' },
  { name: 'Info', className: 'bg-blue-500', hex: '#3b82f6' },
]

function SwatchGrid({
  label,
  swatches,
}: {
  readonly label: string
  readonly swatches: readonly ColorSwatch[]
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">{label}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {swatches.map((swatch) => (
          <div
            key={swatch.name}
            className="flex items-center gap-3 rounded-md border border-slate-700 p-3"
          >
            <div
              className={`h-10 w-10 shrink-0 rounded-md ${swatch.className} border border-slate-600`}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {swatch.name}
              </p>
              <p className="font-mono text-xs text-slate-500">{swatch.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ColorSwatches() {
  return (
    <SectionWrapper
      id="colors"
      title="Colors"
      description="Primary, accent, and semantic color palette"
    >
      <div className="space-y-8">
        <SwatchGrid label="Primary / Slate" swatches={PRIMARY_COLORS} />
        <SwatchGrid label="Semantic" swatches={SEMANTIC_COLORS} />
      </div>
    </SectionWrapper>
  )
}
