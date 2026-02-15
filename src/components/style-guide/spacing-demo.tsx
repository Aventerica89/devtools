import { SectionWrapper } from './section-wrapper'

const SPACING_SCALE = [
  { name: 'p-1', px: '4px' },
  { name: 'p-2', px: '8px' },
  { name: 'p-3', px: '12px' },
  { name: 'p-4', px: '16px' },
  { name: 'p-5', px: '20px' },
  { name: 'p-6', px: '24px' },
  { name: 'p-8', px: '32px' },
] as const

export function SpacingDemo() {
  return (
    <SectionWrapper
      id="spacing"
      title="Spacing"
      description="Padding and margin scale visualization"
    >
      <div className="space-y-6">
        {/* Padding Scale */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Padding Scale</h3>
          <div className="space-y-3">
            {SPACING_SCALE.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <span className="w-10 shrink-0 font-mono text-xs text-slate-500">
                  {item.px}
                </span>
                <span className="w-12 shrink-0 font-mono text-xs text-slate-300">
                  {item.name}
                </span>
                <div className="flex-1">
                  <div className="inline-block rounded border border-slate-600 bg-slate-800/50">
                    <div className={`${item.name} bg-blue-500/20 border border-blue-500/40 rounded`}>
                      <div className="h-4 rounded bg-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gap Scale */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Gap Scale</h3>
          <div className="space-y-3">
            {(['gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8'] as const).map(
              (gap) => (
                <div key={gap} className="flex items-center gap-4">
                  <span className="w-24 shrink-0 font-mono text-xs text-slate-300">
                    {gap}
                  </span>
                  <div className={`flex ${gap}`}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={i}
                        className="h-6 w-10 rounded bg-blue-500/30 border border-blue-500/40"
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
