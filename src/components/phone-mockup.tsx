import { Wrench, Wifi, Signal, Battery } from 'lucide-react'

export function PhoneMockup() {
  return (
    <div className="flex justify-center py-8">
      {/* Phone frame */}
      <div className="relative w-64 h-[500px] bg-slate-900 rounded-[2.5rem] border-2 border-slate-700 shadow-2xl shadow-slate-900/80 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-full z-10" />

        {/* Screen */}
        <div className="absolute inset-2 rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between px-8 pt-5 pb-2">
            <span className="text-[10px] text-slate-400 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="h-2.5 w-2.5 text-slate-400" />
              <Wifi className="h-2.5 w-2.5 text-slate-400" />
              <Battery className="h-2.5 w-2.5 text-slate-400" />
            </div>
          </div>

          {/* App content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            {/* App icon */}
            <div className="w-16 h-16 rounded-2xl bg-slate-700/50 border border-slate-600 flex items-center justify-center">
              <Wrench className="h-8 w-8 text-slate-300" />
            </div>

            {/* App name */}
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">DevTools</h3>
              <p className="text-[10px] text-slate-400">
                Developer Companion
              </p>
            </div>

            {/* Mini dashboard preview */}
            <div className="w-full space-y-2 mt-2">
              <div className="h-2 w-3/4 mx-auto rounded bg-slate-700/60" />
              <div className="grid grid-cols-2 gap-2">
                <MockStatCard label="Errors" value="3" color="text-red-400" />
                <MockStatCard label="Deploys" value="12" color="text-green-400" />
                <MockStatCard label="Bugs" value="7" color="text-yellow-400" />
                <MockStatCard label="Perf" value="94" color="text-blue-400" />
              </div>
            </div>
          </div>

          {/* Bottom nav bar */}
          <div className="flex items-center justify-around px-4 py-3 border-t border-slate-700/50">
            <NavDot active />
            <NavDot />
            <NavDot />
            <NavDot />
          </div>
        </div>
      </div>
    </div>
  )
}

function MockStatCard({
  label,
  value,
  color,
}: {
  readonly label: string
  readonly value: string
  readonly color: string
}) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-2 text-center">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-slate-500">{label}</p>
    </div>
  )
}

function NavDot({ active = false }: { readonly active?: boolean }) {
  return (
    <div
      className={`w-2 h-2 rounded-full ${
        active ? 'bg-slate-300' : 'bg-slate-600'
      }`}
    />
  )
}
